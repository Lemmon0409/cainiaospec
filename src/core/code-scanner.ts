import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { DirectoryMapping } from './templates/project-template.js';

export interface ScanResult {
  directoryStructure: DirectoryMapping[];
  entities: EntityInfo[];
  controllers: ControllerInfo[];
  services: ServiceInfo[];
  fileOrganization: FileOrganization;
  // Enhanced: All classes with full documentation
  allClasses: ClassInfo[];
  // Enhanced: Complete API documentation
  apiDocumentation: ApiEndpoint[];
  // Enhanced: Business logic descriptions extracted from JSDoc
  businessLogic: BusinessLogicInfo[];
  // Enhanced: Code style patterns detected
  codeStylePatterns: CodeStyleInfo;
  // Enhanced: Project structure analysis
  projectStructure?: ProjectStructure;
  // Enhanced: Class dependencies graph
  classDependencies?: ClassDependency[];
}

export interface EntityInfo {
  name: string;
  filePath: string;
  fields: FieldInfo[];
  decorators: string[];
  // Enhanced: Database mapping
  tableName?: string;
  tableComment?: string;
  primaryKey?: string;
  indexes?: IndexInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  decorators: string[];
  optional: boolean;
  // Enhanced: Database column mapping
  columnName?: string;
  columnType?: string;
  nullable?: boolean;
  defaultValue?: string;
  comment?: string;
}

// Enhanced: Database index information
export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ControllerInfo {
  name: string;
  filePath: string;
  routes: RouteInfo[];
  decorators: string[];
}

export interface RouteInfo {
  method: string;
  path: string;
  handler: string;
}

export interface ServiceInfo {
  name: string;
  filePath: string;
  methods: MethodInfo[];
  decorators: string[];
}

export interface MethodInfo {
  name: string;
  parameters: string[];
  returnType?: string;
  description?: string;
  isAsync?: boolean;
  visibility?: 'public' | 'private' | 'protected';
}

// Enhanced: Complete class information
export interface ClassInfo {
  name: string;
  filePath: string;
  type: 'entity' | 'controller' | 'service' | 'repository' | 'dto' | 'utility' | 'middleware' | 'guard' | 'other';
  description?: string;
  decorators: string[];
  fields: ClassFieldInfo[];
  methods: ClassMethodInfo[];
  dependencies: string[];
  implements?: string[];
  extends?: string;
}

export interface ClassFieldInfo {
  name: string;
  type: string;
  description?: string;
  decorators: string[];
  optional: boolean;
  defaultValue?: string;
  visibility?: 'public' | 'private' | 'protected';
}

export interface ClassMethodInfo {
  name: string;
  description?: string;
  parameters: ParameterInfo[];
  returnType?: string;
  decorators: string[];
  isAsync: boolean;
  visibility: 'public' | 'private' | 'protected';
  businessLogic?: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  defaultValue?: string;
}

// Enhanced: API endpoint documentation
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  fullPath: string;
  handler: string;
  controller: string;
  controllerPath: string;
  description?: string;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  decorators: string[];
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  type: string;
  required: boolean;
  description?: string;
}

export interface ApiRequestBody {
  type: string;
  description?: string;
  fields: ClassFieldInfo[];
}

export interface ApiResponse {
  status: number;
  description: string;
  type?: string;
}

// Enhanced: Business logic documentation
export interface BusinessLogicInfo {
  serviceName: string;
  filePath: string;
  description?: string;
  methods: BusinessMethodInfo[];
}

export interface BusinessMethodInfo {
  name: string;
  description: string;
  inputTypes: string[];
  outputType?: string;
  businessRules?: string[];
  dependencies?: string[];
}

// Enhanced: Code style patterns
export interface CodeStyleInfo {
  namingConventions: NamingConvention[];
  filePatterns: FilePattern[];
  decoratorUsage: DecoratorUsage[];
  commonImports: string[];
}

export interface NamingConvention {
  type: string;
  pattern: string;
  examples: string[];
}

export interface FilePattern {
  pattern: string;
  count: number;
  examples: string[];
}

export interface DecoratorUsage {
  name: string;
  count: number;
  usedIn: string[];
}

// Enhanced: Project structure for Maven/Gradle projects
export interface ProjectStructure {
  type: 'maven' | 'gradle' | 'npm' | 'monorepo' | 'single';
  modules: ProjectModule[];
  dependencies: ModuleDependency[];
}

export interface ProjectModule {
  name: string;
  path: string;
  type: 'api' | 'biz' | 'dal' | 'web' | 'common' | 'other';
  description?: string;
  dependencies: string[]; // other module names
  packageName?: string; // Java package base
}

export interface ModuleDependency {
  from: string;
  to: string;
  type: 'compile' | 'runtime' | 'test';
}

// Enhanced: Class dependency tracking
export interface ClassDependency {
  className: string;
  filePath: string;
  type: 'controller' | 'service' | 'repository' | 'entity' | 'dto' | 'other';
  directDependencies: string[]; // class names it depends on
  usedBy: string[]; // class names that use it
  callChain?: string[]; // typical call chain for this class
}

export interface FileOrganization {
  totalFiles: number;
  filesByType: Record<string, number>;
  commonPatterns: string[];
}

export interface ScanOptions {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxDepth?: number;
}

/**
 * Scan project codebase to extract implementation details
 */
export class CodeScanner {
  private options: Required<ScanOptions>;
  private entities: EntityInfo[] = [];
  private controllers: ControllerInfo[] = [];
  private services: ServiceInfo[] = [];
  private directories = new Map<string, DirectoryMapping>();
  private filesByType = new Map<string, number>();
  // Enhanced: Store all classes
  private allClasses: ClassInfo[] = [];
  // Enhanced: Store API endpoints
  private apiEndpoints: ApiEndpoint[] = [];
  // Enhanced: Store business logic
  private businessLogic: BusinessLogicInfo[] = [];
  // Enhanced: Store decorator usage
  private decoratorUsage = new Map<string, { count: number; usedIn: string[] }>();
  // Enhanced: Store file names for pattern detection
  private fileNames: string[] = [];
  // Enhanced: Store common imports
  private imports = new Map<string, number>();
  // Enhanced: Project structure analysis
  private projectModules: ProjectModule[] = [];
  private moduleDependencies: ModuleDependency[] = [];
  // Enhanced: Class dependency tracking
  private classDependencies = new Map<string, ClassDependency>();

  constructor(options: ScanOptions) {
    this.options = {
      includePatterns: options.includePatterns || ['**/*.ts', '**/*.js'],
      excludePatterns: options.excludePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
      ],
      maxDepth: options.maxDepth || 20,
      rootDir: options.rootDir,
    };
  }

  /**
   * Scan the project and return extracted information
   */
  async scan(): Promise<ScanResult> {
    // First pass: analyze project structure (Maven/Gradle modules)
    this.analyzeProjectStructure();
    
    // Second pass: scan all code files
    this.scanDirectory(this.options.rootDir, 0);
    this.analyzeDirectoryStructure();
    this.buildApiDocumentation();
    this.extractBusinessLogic();
    
    // Third pass: build dependency graph
    this.buildDependencyGraph();

    return {
      directoryStructure: Array.from(this.directories.values()),
      entities: this.entities,
      controllers: this.controllers,
      services: this.services,
      fileOrganization: {
        totalFiles: Array.from(this.filesByType.values()).reduce((a, b) => a + b, 0),
        filesByType: Object.fromEntries(this.filesByType),
        commonPatterns: this.detectCommonPatterns(),
      },
      allClasses: this.allClasses,
      apiDocumentation: this.apiEndpoints,
      businessLogic: this.businessLogic,
      codeStylePatterns: this.detectCodeStylePatterns(),
      projectStructure: this.projectModules.length > 0 ? {
        type: this.detectProjectType(),
        modules: this.projectModules,
        dependencies: this.moduleDependencies,
      } : undefined,
      classDependencies: Array.from(this.classDependencies.values()),
    };
  }

  private scanDirectory(dir: string, depth: number): void {
    if (depth > this.options.maxDepth) return;
    if (!existsSync(dir)) return;
    if (this.shouldExclude(dir)) return;

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          this.scanDirectory(fullPath, depth + 1);
        } else if (stat.isFile()) {
          this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dir}: ${error}`);
    }
  }

  private scanFile(filePath: string): void {
    const ext = extname(filePath);
    // Support TypeScript, JavaScript, and Java files
    if (!['.ts', '.js', '.tsx', '.jsx', '.java'].includes(ext)) return;
    if (this.shouldExclude(filePath)) return;

    // Count file types
    const fileType = this.categorizeFile(filePath);
    this.filesByType.set(fileType, (this.filesByType.get(fileType) || 0) + 1);
    this.fileNames.push(basename(filePath));

    // Scan file content
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Extract imports for pattern detection
      this.extractImports(content);
      
      // Extract all classes with full information
      const classInfo = this.extractClassInfo(filePath, content, fileType);
      if (classInfo) {
        this.allClasses.push(classInfo);
        // Track decorator usage
        for (const decorator of classInfo.decorators) {
          const usage = this.decoratorUsage.get(decorator) || { count: 0, usedIn: [] };
          usage.count++;
          usage.usedIn.push(classInfo.name);
          this.decoratorUsage.set(decorator, usage);
        }
      }
      
      if (this.isEntity(filePath, content)) {
        this.entities.push(this.extractEntity(filePath, content));
      } else if (this.isController(filePath, content)) {
        this.controllers.push(this.extractController(filePath, content));
      } else if (this.isService(filePath, content)) {
        this.services.push(this.extractService(filePath, content));
      }
    } catch (error) {
      console.warn(`Failed to scan file ${filePath}: ${error}`);
    }
  }

  private shouldExclude(path: string): boolean {
    const relativePath = relative(this.options.rootDir, path);
    return this.options.excludePatterns.some(pattern => {
      const regex = this.globToRegex(pattern);
      return regex.test(relativePath) || regex.test(path);
    });
  }

  private globToRegex(glob: string): RegExp {
    const escaped = glob
      .replace(/\*\*/g, '__DOUBLE_STAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__DOUBLE_STAR__/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    return new RegExp(`^${escaped}$`);
  }

  private categorizeFile(filePath: string): string {
    const name = basename(filePath);
    
    // TypeScript/JavaScript patterns
    if (name.includes('.entity.') || name.includes('.model.')) return 'entity';
    if (name.includes('.controller.')) return 'controller';
    if (name.includes('.service.')) return 'service';
    if (name.includes('.repository.')) return 'repository';
    if (name.includes('.dto.')) return 'dto';
    if (name.includes('.interface.') || name.includes('.types.')) return 'type';
    if (name.includes('.util.') || name.includes('.helper.')) return 'utility';
    if (name.includes('.middleware.')) return 'middleware';
    if (name.includes('.guard.')) return 'guard';
    if (name.includes('.decorator.')) return 'decorator';
    if (name.includes('.test.') || name.includes('.spec.')) return 'test';
    if (name.includes('.config.')) return 'config';
    if (name.includes('.constant.')) return 'constant';
    
    // Java patterns
    if (name.endsWith('Controller.java')) return 'controller';
    if (name.endsWith('Service.java') || name.endsWith('ServiceImpl.java')) return 'service';
    if (name.endsWith('Repository.java') || name.endsWith('Mapper.java') || name.endsWith('DAO.java')) return 'repository';
    if (name.endsWith('DTO.java') || name.endsWith('VO.java') || name.endsWith('DO.java')) return 'dto';
    if (name.endsWith('Entity.java') || name.endsWith('Model.java') || name.endsWith('PO.java')) return 'entity';
    if (name.endsWith('Utils.java') || name.endsWith('Util.java') || name.endsWith('Helper.java')) return 'utility';
    if (name.endsWith('Config.java') || name.endsWith('Configuration.java')) return 'config';
    if (name.endsWith('Constants.java') || name.endsWith('Constant.java')) return 'constant';
    if (name.endsWith('Test.java')) return 'test';
    
    return 'other';
  }

  private isEntity(filePath: string, content: string): boolean {
    // TypeScript/JavaScript patterns
    if ((filePath.includes('.entity.') || filePath.includes('.model.')) &&
        (content.includes('@Entity') || content.includes('model ='))) {
      return true;
    }
    // Java patterns
    if (filePath.endsWith('.java') && 
        (content.includes('@Entity') || content.includes('@Table') || filePath.includes('Entity.java'))) {
      return true;
    }
    return false;
  }

  private isController(filePath: string, content: string): boolean {
    // TypeScript/JavaScript patterns
    if (filePath.includes('.controller.') &&
        (content.includes('@Controller') || content.includes('router.'))) {
      return true;
    }
    // Java Spring patterns
    if (filePath.endsWith('.java') &&
        (content.includes('@RestController') || content.includes('@Controller') || 
         filePath.includes('Controller.java'))) {
      return true;
    }
    return false;
  }

  private isService(filePath: string, content: string): boolean {
    // TypeScript/JavaScript patterns
    if (filePath.includes('.service.') &&
        (content.includes('@Injectable') || content.includes('class') && content.includes('Service'))) {
      return true;
    }
    // Java Spring patterns
    if (filePath.endsWith('.java') &&
        (content.includes('@Service') || filePath.includes('Service.java') || 
         filePath.includes('ServiceImpl.java'))) {
      return true;
    }
    return false;
  }

  private extractEntity(filePath: string, content: string): EntityInfo {
    const name = this.extractClassName(content) || basename(filePath, extname(filePath));
    const decorators = this.extractDecorators(content);
    const fields = this.extractFields(content);

    // Enhanced: Extract database mapping information
    const tableName = this.extractTableName(content, name);
    const tableComment = this.extractTableComment(content);
    const primaryKey = this.extractPrimaryKey(content, fields);
    const indexes = this.extractIndexes(content);

    // Enhanced: Extract column mappings for fields
    const enhancedFields = this.enhanceFieldsWithColumnInfo(content, fields);

    return {
      name,
      filePath: relative(this.options.rootDir, filePath),
      fields: enhancedFields,
      decorators,
      tableName,
      tableComment,
      primaryKey,
      indexes,
    };
  }

  private extractController(filePath: string, content: string): ControllerInfo {
    const name = this.extractClassName(content) || basename(filePath, extname(filePath));
    const decorators = this.extractDecorators(content);
    const routes = this.extractRoutes(content);

    return {
      name,
      filePath: relative(this.options.rootDir, filePath),
      routes,
      decorators,
    };
  }

  private extractService(filePath: string, content: string): ServiceInfo {
    const name = this.extractClassName(content) || basename(filePath, extname(filePath));
    const decorators = this.extractDecorators(content);
    const methods = this.extractMethods(content);

    return {
      name,
      filePath: relative(this.options.rootDir, filePath),
      methods,
      decorators,
    };
  }

  private extractClassName(content: string): string | null {
    const classMatch = content.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  private extractDecorators(content: string): string[] {
    const decoratorMatches = content.matchAll(/@(\w+)(?:\([^)]*\))?/g);
    return Array.from(decoratorMatches, match => match[1]);
  }

  private extractFields(content: string): FieldInfo[] {
    const fields: FieldInfo[] = [];
    const fieldRegex = /@Column\([^)]*\)?\s*(\w+)(\?)?:\s*(\w+)/g;
    
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
      fields.push({
        name: match[1],
        type: match[3],
        optional: !!match[2],
        decorators: ['Column'],
      });
    }

    return fields;
  }

  private extractRoutes(content: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    
    // NestJS style: @Get(), @Post(), etc. - improved to handle empty params and optional quotes
    const nestjsRoutes = content.matchAll(/@(Get|Post|Put|Delete|Patch)\s*\(\s*(?:['"]([^'"]*)['"\s]*)?\)\s*(?:async\s+)?(\w+)/g);
    for (const match of nestjsRoutes) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2] || '',
        handler: match[3],
      });
    }

    // Express style: router.get(), router.post(), etc.
    const expressRoutes = content.matchAll(/router\.(get|post|put|delete|patch)\(['"]([^'"]*)['"]/g);
    for (const match of expressRoutes) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        handler: 'anonymous',
      });
    }

    // Spring style: @GetMapping("/path"), @PostMapping("/path"), etc.
    const springMappings = content.matchAll(/@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*(?:value\s*=\s*)?["']([^"']*)["']\s*(?:,\s*method\s*=\s*RequestMethod\.(\w+))?[^)]*\)\s*(?:public|private|protected)?\s*(?:[\w<>\[\]]+)\s+(\w+)\s*\(/g);
    for (const match of springMappings) {
      let method = match[1].toUpperCase();
      if (method === 'REQUEST' && match[3]) {
        method = match[3].toUpperCase();
      }
      routes.push({
        method,
        path: match[2] || '',
        handler: match[4],
      });
    }

    // Spring short form without explicit value: @GetMapping("/path")
    const springShortForms = content.matchAll(/@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*["']([^"']*)["']\s*\)\s*(?:public|private|protected)?\s*(?:[\w<>\[\]]+)\s+(\w+)\s*\(/g);
    for (const match of springShortForms) {
      const alreadyMatched = routes.some(r => r.handler === match[3] && r.path === match[2]);
      if (!alreadyMatched) {
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          handler: match[3],
        });
      }
    }

    return routes;
  }

  private extractMethods(content: string): MethodInfo[] {
    const methods: MethodInfo[] = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*Promise<(\w+)>|\s*:\s*(\w+))?/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      // Skip constructors and common non-business methods
      if (['constructor', 'toString', 'valueOf'].includes(methodName)) continue;
      
      methods.push({
        name: methodName,
        parameters: match[2]?.split(',').map(p => p.trim()).filter(Boolean) || [],
        returnType: match[3] || match[4],
      });
    }

    return methods;
  }

  private analyzeDirectoryStructure(): void {
    const dirCounts = new Map<string, number>();

    // Count files per directory
    [...this.entities, ...this.controllers, ...this.services].forEach(item => {
      const dir = join(this.options.rootDir, item.filePath.split('/').slice(0, -1).join('/'));
      dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
    });

    // Identify common directories
    const commonDirs = [
      'src/entities', 'src/models',
      'src/controllers', 'src/routes',
      'src/services',
      'src/repositories',
      'src/dto',
      'src/utils', 'src/helpers',
      'src/middleware',
      'src/config',
      'tests', 'test',
    ];

    for (const dir of commonDirs) {
      const fullPath = join(this.options.rootDir, dir);
      if (existsSync(fullPath)) {
        this.directories.set(dir, this.createDirectoryMapping(dir, fullPath));
      }
    }
  }

  private createDirectoryMapping(relativePath: string, fullPath: string): DirectoryMapping {
    const name = basename(relativePath);
    const purpose = this.inferDirectoryPurpose(name);
    const responsibilities = this.inferResponsibilities(name);

    return {
      path: relativePath,
      purpose,
      responsibilities,
    };
  }

  private inferDirectoryPurpose(dirName: string): string {
    const purposes: Record<string, string> = {
      entities: 'Data Models',
      models: 'Data Models',
      controllers: 'API Endpoints',
      routes: 'API Routes',
      services: 'Business Logic',
      repositories: 'Data Access',
      dto: 'Data Transfer Objects',
      utils: 'Utilities',
      helpers: 'Helper Functions',
      middleware: 'Request Processing',
      guards: 'Authorization',
      decorators: 'Custom Decorators',
      config: 'Configuration',
      tests: 'Testing',
      test: 'Testing',
    };

    return purposes[dirName] || 'Unknown';
  }

  private inferResponsibilities(dirName: string): string[] {
    const responsibilities: Record<string, string[]> = {
      entities: ['Define database schemas', 'Entity classes', 'ORM mappings'],
      models: ['Define data structures', 'Business models'],
      controllers: ['Handle HTTP requests', 'Route to services', 'Response formatting'],
      routes: ['Define API routes', 'Route handlers'],
      services: ['Implement business rules', 'Orchestrate operations', 'Transaction management'],
      repositories: ['Database queries', 'CRUD operations', 'Data persistence'],
      dto: ['Request/response validation', 'Data transformation', 'API contracts'],
      utils: ['Helper functions', 'Common utilities', 'Shared logic'],
      middleware: ['Authentication', 'Logging', 'Error handling'],
      config: ['App settings', 'Environment variables', 'Configuration management'],
      tests: ['Unit tests', 'Integration tests', 'E2E tests'],
    };

    return responsibilities[dirName] || ['General purpose'];
  }

  private detectCommonPatterns(): string[] {
    const patterns: string[] = [];

    if (this.filesByType.get('entity') || 0 > 0) {
      patterns.push('Entity-based data modeling');
    }
    if (this.filesByType.get('dto') || 0 > 0) {
      patterns.push('DTO pattern for data transfer');
    }
    if (this.filesByType.get('repository') || 0 > 0) {
      patterns.push('Repository pattern for data access');
    }
    if (this.filesByType.get('service') || 0 > 0) {
      patterns.push('Service layer for business logic');
    }
    if (this.filesByType.get('controller') || 0 > 0) {
      patterns.push('Controller pattern for HTTP handling');
    }

    return patterns;
  }

  // Enhanced: Extract imports for pattern detection
  private extractImports(content: string): void {
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      this.imports.set(importPath, (this.imports.get(importPath) || 0) + 1);
    }
  }

  // Enhanced: Extract JSDoc comment before a class/method
  private extractJsDoc(content: string, position: number): string | undefined {
    // Look backwards from position to find the immediately preceding JSDoc comment
    const beforeContent = content.substring(0, position);
    
    // Find the last /** before the position
    const lastJsDocStart = beforeContent.lastIndexOf('/**');
    if (lastJsDocStart === -1) {
      return undefined;
    }
    
    // Find the corresponding */
    const jsDocEnd = content.indexOf('*/', lastJsDocStart);
    if (jsDocEnd === -1 || jsDocEnd >= position) {
      return undefined;
    }
    
    // Extract the JSDoc content
    const jsDoc = content.substring(lastJsDocStart, jsDocEnd + 2);
    
    // Check if there's any field declaration between the JSDoc end and the current position
    const betweenContent = content.substring(jsDocEnd + 2, position);
    
    // If there's a semicolon, this JSDoc doesn't belong to the current field
    if (betweenContent.includes(';')) {
      return undefined;
    }
    
    // If there's another field declaration (private/public/protected + type + name), 
    // this JSDoc doesn't belong to the current field
    const fieldDeclarationPattern = /(private|public|protected)\s+[\w<>\[\]]+\s+\w+/;
    if (fieldDeclarationPattern.test(betweenContent)) {
      return undefined;
    }
    
    // Extract description from JSDoc (text before any @tags)
    const lines = jsDoc.split('\n');
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.replace(/^\/\*\*|^\s*\*\/?|\*\/$/g, '').trim();
      
      // Stop at first @tag
      if (trimmed.startsWith('@')) {
        break;
      }
      
      // Skip empty lines at the beginning
      if (trimmed.length > 0 || descriptionLines.length > 0) {
        descriptionLines.push(trimmed);
      }
    }
    
    // Join lines and clean up
    const description = descriptionLines.join(' ').trim();
    
    // If description is too long (> 200 chars), it's probably not a real description
    if (description.length > 200) {
      return undefined;
    }
    
    return description.length > 0 ? description : undefined;
  }

  // Enhanced: Extract full class information
  private extractClassInfo(filePath: string, content: string, fileType: string): ClassInfo | null {
    // Match both class and interface (for Java), with optional modifiers (public, abstract, etc.)
    const classMatch = content.match(/(?:public\s+|private\s+|protected\s+|abstract\s+)*(?:class|interface|enum)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/);
    if (!classMatch) return null;

    const className = classMatch[1];
    const extendsClass = classMatch[2];
    const implementsInterfaces = classMatch[3]?.split(',').map(s => s.trim()).filter(Boolean);
    
    const classPosition = content.indexOf(classMatch[0]);
    const description = this.extractJsDoc(content, classPosition);
    const decorators = this.extractDecorators(content);
    const fields = this.extractClassFields(content);
    const methods = this.extractClassMethods(content);
    const dependencies = this.extractDependencies(content);

    const type = this.mapFileTypeToClassType(fileType);

    return {
      name: className,
      filePath: relative(this.options.rootDir, filePath),
      type,
      description,
      decorators,
      fields,
      methods,
      dependencies,
      implements: implementsInterfaces,
      extends: extendsClass,
    };
  }

  private mapFileTypeToClassType(fileType: string): ClassInfo['type'] {
    const typeMap: Record<string, ClassInfo['type']> = {
      entity: 'entity',
      controller: 'controller',
      service: 'service',
      repository: 'repository',
      dto: 'dto',
      utility: 'utility',
      middleware: 'middleware',
      guard: 'guard',
    };
    return typeMap[fileType] || 'other';
  }

  // Enhanced: Extract class fields with full information
  private extractClassFields(content: string): ClassFieldInfo[] {
    const fields: ClassFieldInfo[] = [];
    
    // Dependency injection decorators that should NOT be treated as fields
    const dependencyInjectionDecorators = new Set([
      'Autowired', 'Resource', 'Inject', 'Qualifier',
      'InjectRepository', 'InjectModel', 'InjectConnection'
    ]);
    
    // Common utility field names that should be excluded
    const utilityFieldNames = new Set([
      'logger', 'log', 'LOGGER', 'LOG',
      'serialVersionUID' // Java serialization
    ]);
    
    // Match various field patterns
    // Pattern 1: @Column() fieldName: type; (TypeScript/NestJS)
    // Pattern 2: private fieldName: type; (TypeScript)
    // Pattern 3: private Type fieldName; (Java)
    const fieldPatterns = [
      // Decorated fields (TypeORM, class-validator, etc.)
      /(@\w+(?:\([^)]*\))?\s*)+\n?\s*(private|public|protected)?\s*(\w+)(\?)?:\s*([^;=]+?)(?:\s*=\s*([^;]+))?;/g,
      // Regular class fields
      /^\s*(private|public|protected)\s+(readonly\s+)?(\w+)(\?)?:\s*([^;=]+?)(?:\s*=\s*([^;]+))?;/gm,
    ];

    for (const pattern of fieldPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const decoratorsMatch = match[0].match(/@(\w+)/g);
        const decorators = decoratorsMatch ? decoratorsMatch.map(d => d.substring(1)) : [];
        
        // Skip if this field has dependency injection decorators
        const hasDependencyInjection = decorators.some(d => dependencyInjectionDecorators.has(d));
        if (hasDependencyInjection) {
          continue;
        }
        
        // Find field name and type based on pattern
        let visibility: 'public' | 'private' | 'protected' = 'public';
        let fieldName: string;
        let fieldType: string;
        let optional = false;
        let defaultValue: string | undefined;

        if (match[2] && ['private', 'public', 'protected'].includes(match[2])) {
          visibility = match[2] as 'public' | 'private' | 'protected';
          fieldName = match[3];
          optional = !!match[4];
          fieldType = match[5]?.trim() || 'unknown';
          defaultValue = match[6]?.trim();
        } else if (match[1] && ['private', 'public', 'protected'].includes(match[1])) {
          visibility = match[1] as 'public' | 'private' | 'protected';
          fieldName = match[3];
          optional = !!match[4];
          fieldType = match[5]?.trim() || 'unknown';
          defaultValue = match[6]?.trim();
        } else {
          continue;
        }

        // Skip constructor parameters and duplicates
        if (!fieldName || fields.some(f => f.name === fieldName)) continue;
        
        // Skip utility field names
        if (utilityFieldNames.has(fieldName)) {
          continue;
        }
        
        // Skip Logger/Log types
        if (fieldType.includes('Logger') || fieldType.includes('Log')) {
          continue;
        }

        // Look for JSDoc description
        const fieldPosition = content.indexOf(match[0]);
        const description = this.extractJsDoc(content, fieldPosition);

        fields.push({
          name: fieldName,
          type: fieldType,
          description,
          decorators,
          optional,
          defaultValue,
          visibility,
        });
      }
    }

    // Java field pattern: [annotations] [modifiers] Type fieldName [= value];
    const javaFieldPattern = /((?:@\w+(?:\([^)]*\))?\s*)*)\s*(private|public|protected)?\s+(static|final)?\s*(static|final)?\s*([\w<>\[\]]+)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    let javaMatch;
    while ((javaMatch = javaFieldPattern.exec(content)) !== null) {
      const decoratorsStr = javaMatch[1] || '';
      const visibility = (javaMatch[2] as 'public' | 'private' | 'protected') || 'public';
      const modifier1 = javaMatch[3]; // static or final
      const modifier2 = javaMatch[4]; // static or final
      const fieldType = javaMatch[5];
      const fieldName = javaMatch[6];
      const defaultValue = javaMatch[7]?.trim();
      
      // Skip static final constants (like Logger, configuration constants)
      const isStatic = modifier1 === 'static' || modifier2 === 'static';
      const isFinal = modifier1 === 'final' || modifier2 === 'final';
      if (isStatic && isFinal) {
        continue; // Skip constants like private static final Logger logger
      }
      
      // Skip Logger/Log fields (common utility fields)
      if (fieldType.includes('Logger') || fieldType.includes('Log')) {
        continue;
      }

      // Skip common keywords and method-like patterns
      if (['class', 'interface', 'enum', 'return', 'if', 'for', 'while'].includes(fieldType)) continue;
      if (fields.some(f => f.name === fieldName)) continue;
      
      // Skip utility field names
      if (utilityFieldNames.has(fieldName)) {
        continue;
      }

      const decoratorsMatch = decoratorsStr.match(/@(\w+)/g);
      const decorators = decoratorsMatch ? decoratorsMatch.map(d => d.substring(1)) : [];
      
      // Skip if this field has dependency injection decorators
      const hasDependencyInjection = decorators.some(d => dependencyInjectionDecorators.has(d));
      if (hasDependencyInjection) {
        continue;
      }

      const fieldPosition = content.indexOf(javaMatch[0]);
      const description = this.extractJsDoc(content, fieldPosition);

      fields.push({
        name: fieldName,
        type: fieldType,
        description,
        decorators,
        optional: false,
        defaultValue,
        visibility,
      });
    }

    return fields;
  }

  // Enhanced: Extract class methods with full information
  private extractClassMethods(content: string): ClassMethodInfo[] {
    const methods: ClassMethodInfo[] = [];
    
    // Match method patterns - improved to handle decorators better
    const methodPattern = /((?:@\w+(?:\([^)]*\))?\s*)*)((?:\/\*\*[\s\S]*?\*\/\s*)?)\n?\s*(private|public|protected)?\s*(async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g;
    
    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      const decoratorsStr = match[1] || '';
      const jsDocStr = match[2] || '';
      const visibility = (match[3] as 'public' | 'private' | 'protected') || 'public';
      const isAsync = !!match[4];
      const methodName = match[5];
      const paramsStr = match[6];
      const returnType = match[7]?.trim();

      // Skip constructor and common non-business methods, also skip control flow keywords
      if (['constructor', 'toString', 'valueOf', 'ngOnInit', 'ngOnDestroy', 'if', 'for', 'while', 'switch'].includes(methodName)) continue;

      const decoratorsMatch = decoratorsStr.match(/@(\w+)/g);
      const decorators = decoratorsMatch ? decoratorsMatch.map(d => d.substring(1)) : [];

      // Parse parameters
      const parameters = this.parseMethodParameters(paramsStr);

      // Extract description from JSDoc
      let description: string | undefined;
      if (jsDocStr) {
        const descMatch = jsDocStr.match(/\/\*\*\s*\n?\s*\*?\s*([^@\n*][^\n]*)/m);
        if (descMatch) {
          description = descMatch[1].trim();
        }
      }

      // Extract business logic from method body (first comment or logic hint)
      const methodPosition = content.indexOf(match[0]);
      const businessLogic = this.extractMethodBusinessLogic(content, methodPosition + match[0].length);

      methods.push({
        name: methodName,
        description,
        parameters,
        returnType,
        decorators,
        isAsync,
        visibility,
        businessLogic,
      });
    }

    return methods;
  }

  // Enhanced: Parse method parameters
  private parseMethodParameters(paramsStr: string): ParameterInfo[] {
    if (!paramsStr.trim()) return [];

    const params: ParameterInfo[] = [];
    // Split by comma, handling generics
    const paramParts = this.splitParameters(paramsStr);

    for (const part of paramParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // TypeScript/JavaScript: @Decorator() name?: type = defaultValue
      const tsParamMatch = trimmed.match(/(?:@\w+(?:\([^)]*\))?\s*)*(\w+)(\?)?:\s*([^=]+?)(?:\s*=\s*(.+))?$/);
      if (tsParamMatch) {
        params.push({
          name: tsParamMatch[1],
          type: tsParamMatch[3].trim(),
          optional: !!tsParamMatch[2] || !!tsParamMatch[4],
          defaultValue: tsParamMatch[4]?.trim(),
        });
        continue;
      }

      // Java: @Annotation Type paramName or final Type paramName
      const javaParamMatch = trimmed.match(/(?:@\w+(?:\([^)]*\))?\s*)*(final\s+)?([\w<>\[\]]+)\s+(\w+)/);
      if (javaParamMatch) {
        params.push({
          name: javaParamMatch[3],
          type: javaParamMatch[2].trim(),
          optional: false,
        });
      }
    }

    return params;
  }

  // Helper to split parameters handling nested generics
  private splitParameters(paramsStr: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of paramsStr) {
      if (char === '<' || char === '(' || char === '{' || char === '[') {
        depth++;
        current += char;
      } else if (char === '>' || char === ')' || char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) parts.push(current);

    return parts;
  }

  // Enhanced: Extract business logic hint from method body
  private extractMethodBusinessLogic(content: string, startPosition: number): string | undefined {
    // Find the method body (until matching closing brace)
    let depth = 1;
    let pos = startPosition;
    let bodyContent = '';
    
    while (pos < content.length && depth > 0) {
      const char = content[pos];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      if (depth > 0) bodyContent += char;
      pos++;
    }

    // Look for business logic indicators
    const logicIndicators: string[] = [];

    // Check for validation logic
    if (bodyContent.includes('validate') || bodyContent.includes('Validator')) {
      logicIndicators.push('Performs validation');
    }
    // Check for database operations
    if (bodyContent.includes('save(') || bodyContent.includes('create(') || bodyContent.includes('update(')) {
      logicIndicators.push('Database write operation');
    }
    if (bodyContent.includes('find(') || bodyContent.includes('findOne(') || bodyContent.includes('query(')) {
      logicIndicators.push('Database read operation');
    }
    // Check for external API calls
    if (bodyContent.includes('fetch(') || bodyContent.includes('axios') || bodyContent.includes('httpClient')) {
      logicIndicators.push('External API call');
    }
    // Check for transaction handling
    if (bodyContent.includes('transaction') || bodyContent.includes('Transaction')) {
      logicIndicators.push('Transaction management');
    }
    // Check for event emission
    if (bodyContent.includes('emit(') || bodyContent.includes('publish(')) {
      logicIndicators.push('Event emission');
    }

    return logicIndicators.length > 0 ? logicIndicators.join(', ') : undefined;
  }

  // Enhanced: Extract dependencies from constructor
  private extractDependencies(content: string): string[] {
    const dependencies = new Set<string>();
    
    // TypeScript/JavaScript: Constructor injection pattern
    const constructorMatch = content.match(/constructor\s*\(([^)]*)\)/s);
    if (constructorMatch) {
      const paramsStr = constructorMatch[1];
      const paramParts = this.splitParameters(paramsStr);
      
      for (const part of paramParts) {
        // Match: private readonly serviceName: ServiceType
        const depMatch = part.match(/(?:private|public|protected)?\s*(?:readonly)?\s*(\w+):\s*(\w+)/m);
        if (depMatch) {
          dependencies.add(depMatch[2]);
        }
      }
    }

    // Java: Field injection with @Autowired, @Resource, @Inject
    const javaInjectionPattern = /(?:@Autowired|@Resource|@Inject)\s*(?:\([^)]*\))?\s*(?:private|public|protected)?\s+([\w<>\[\]]+)\s+(\w+)\s*;/g;
    let javaMatch;
    while ((javaMatch = javaInjectionPattern.exec(content)) !== null) {
      const type = javaMatch[1];
      // Extract generic type if present (e.g., List<User> -> User)
      const genericMatch = type.match(/([\w]+)<([\w]+)>/);
      if (genericMatch) {
        dependencies.add(genericMatch[2]); // Inner type
      } else {
        dependencies.add(type);
      }
    }

    // Java: Extract from method calls (common patterns)
    // Pattern: someService.methodName() or this.someService.methodName()
    const methodCallPattern = /(?:this\.)?([a-z][\w]*)\.(\w+)\(/g;
    let callMatch;
    const potentialDeps = new Set<string>();
    while ((callMatch = methodCallPattern.exec(content)) !== null) {
      const fieldName = callMatch[1];
      // Convert field name to class name (e.g., userService -> UserService)
      if (fieldName.length > 3 && !['this', 'super', 'null'].includes(fieldName)) {
        const className = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        potentialDeps.add(className);
      }
    }

    // Add potential dependencies that match known class patterns
    for (const dep of potentialDeps) {
      if (dep.endsWith('Service') || dep.endsWith('Manager') || 
          dep.endsWith('Repository') || dep.endsWith('Mapper') ||
          dep.endsWith('Api') || dep.endsWith('Dao')) {
        dependencies.add(dep);
      }
    }

    return Array.from(dependencies).filter(d => d.length > 0);
  }

  // Enhanced: Build complete API documentation
  private buildApiDocumentation(): void {
    for (const controller of this.controllers) {
      // Extract controller base path
      const controllerClass = this.allClasses.find(c => c.name === controller.name);
      const controllerPath = this.extractControllerPath(controllerClass?.decorators || []) || '';

      for (const route of controller.routes) {
        const fullPath = this.joinPaths(controllerPath, route.path);
        
        // Find the method info for this route
        const methodInfo = controllerClass?.methods.find(m => m.name === route.handler);
        
        const endpoint: ApiEndpoint = {
          method: route.method as ApiEndpoint['method'],
          path: route.path,
          fullPath,
          handler: route.handler,
          controller: controller.name,
          controllerPath: controller.filePath,
          description: methodInfo?.description,
          parameters: this.extractApiParameters(methodInfo),
          requestBody: this.extractRequestBody(methodInfo),
          responses: this.inferApiResponses(methodInfo),
          decorators: methodInfo?.decorators || [],
        };

        this.apiEndpoints.push(endpoint);
      }
    }
  }

  private extractControllerPath(decorators: string[]): string | undefined {
    // Controller path is usually the first argument to @Controller
    // This is a simplified extraction
    return undefined; // Full implementation would parse decorator arguments
  }

  private joinPaths(base: string, path: string): string {
    const cleanBase = base.replace(/^\/|\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `/${cleanBase}${cleanBase && cleanPath ? '/' : ''}${cleanPath}`;
  }

  private extractApiParameters(methodInfo?: ClassMethodInfo): ApiParameter[] {
    if (!methodInfo) return [];

    const params: ApiParameter[] = [];
    
    for (const param of methodInfo.parameters) {
      // Determine parameter location based on decorators or naming conventions
      let inLocation: ApiParameter['in'] = 'query';
      
      if (param.name.toLowerCase().includes('id') || param.name.toLowerCase().includes('param')) {
        inLocation = 'path';
      } else if (param.type.includes('Dto') || param.type.includes('Body')) {
        inLocation = 'body';
      }

      params.push({
        name: param.name,
        in: inLocation,
        type: param.type,
        required: !param.optional,
        description: param.description,
      });
    }

    return params;
  }

  private extractRequestBody(methodInfo?: ClassMethodInfo): ApiRequestBody | undefined {
    if (!methodInfo) return undefined;

    // Find body parameter (usually a DTO)
    const bodyParam = methodInfo.parameters.find(p => 
      p.type.includes('Dto') || p.type.includes('Body') || p.type.includes('Request')
    );

    if (!bodyParam) return undefined;

    // Find the DTO class to get its fields
    const dtoClass = this.allClasses.find(c => c.name === bodyParam.type);

    return {
      type: bodyParam.type,
      description: bodyParam.description,
      fields: dtoClass?.fields || [],
    };
  }

  private inferApiResponses(methodInfo?: ClassMethodInfo): ApiResponse[] {
    const responses: ApiResponse[] = [];

    // Default success response
    responses.push({
      status: 200,
      description: 'Success',
      type: methodInfo?.returnType,
    });

    // Check for common error handling patterns in decorators
    if (methodInfo?.decorators.includes('UseGuards')) {
      responses.push({ status: 401, description: 'Unauthorized' });
      responses.push({ status: 403, description: 'Forbidden' });
    }

    responses.push({ status: 500, description: 'Internal Server Error' });

    return responses;
  }

  // Enhanced: Extract business logic from services
  private extractBusinessLogic(): void {
    for (const service of this.services) {
      const classInfo = this.allClasses.find(c => c.name === service.name);
      if (!classInfo) continue;

      const methodInfos: BusinessMethodInfo[] = [];

      for (const method of classInfo.methods) {
        if (method.visibility === 'private') continue; // Skip private methods

        methodInfos.push({
          name: method.name,
          description: method.description || method.businessLogic || `${method.name} operation`,
          inputTypes: method.parameters.map(p => p.type),
          outputType: method.returnType,
          businessRules: method.businessLogic ? [method.businessLogic] : undefined,
          dependencies: classInfo.dependencies,
        });
      }

      if (methodInfos.length > 0) {
        this.businessLogic.push({
          serviceName: service.name,
          filePath: service.filePath,
          description: classInfo.description,
          methods: methodInfos,
        });
      }
    }
  }

  // Enhanced: Detect code style patterns
  private detectCodeStylePatterns(): CodeStyleInfo {
    return {
      namingConventions: this.detectNamingConventions(),
      filePatterns: this.detectFilePatterns(),
      decoratorUsage: this.getDecoratorUsage(),
      commonImports: this.getCommonImports(),
    };
  }

  private detectNamingConventions(): NamingConvention[] {
    const conventions: NamingConvention[] = [];

    // Detect class naming patterns
    const entityNames = this.entities.map(e => e.name);
    const serviceNames = this.services.map(s => s.name);
    const controllerNames = this.controllers.map(c => c.name);

    if (entityNames.length > 0) {
      conventions.push({
        type: 'Entity',
        pattern: 'PascalCase (e.g., User, Product)',
        examples: entityNames.slice(0, 3),
      });
    }

    if (serviceNames.some(n => n.endsWith('Service'))) {
      conventions.push({
        type: 'Service',
        pattern: 'PascalCase + Service suffix (e.g., UserService)',
        examples: serviceNames.filter(n => n.endsWith('Service')).slice(0, 3),
      });
    }

    if (controllerNames.some(n => n.endsWith('Controller'))) {
      conventions.push({
        type: 'Controller',
        pattern: 'PascalCase + Controller suffix (e.g., UserController)',
        examples: controllerNames.filter(n => n.endsWith('Controller')).slice(0, 3),
      });
    }

    return conventions;
  }

  private detectFilePatterns(): FilePattern[] {
    const patterns: FilePattern[] = [];
    const patternCounts = new Map<string, { count: number; examples: string[] }>();

    for (const fileName of this.fileNames) {
      // Detect pattern like *.entity.ts, *.service.ts
      const match = fileName.match(/\.(\w+)\.(ts|js)$/);
      if (match) {
        const pattern = `*.${match[1]}.${match[2]}`;
        const existing = patternCounts.get(pattern) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(fileName);
        }
        patternCounts.set(pattern, existing);
      }
    }

    for (const [pattern, data] of patternCounts) {
      if (data.count >= 2) { // Only include patterns used at least twice
        patterns.push({
          pattern,
          count: data.count,
          examples: data.examples,
        });
      }
    }

    return patterns.sort((a, b) => b.count - a.count);
  }

  private getDecoratorUsage(): DecoratorUsage[] {
    const usage: DecoratorUsage[] = [];

    for (const [name, data] of this.decoratorUsage) {
      if (data.count >= 2) { // Only include decorators used at least twice
        usage.push({
          name,
          count: data.count,
          usedIn: data.usedIn.slice(0, 5),
        });
      }
    }

    return usage.sort((a, b) => b.count - a.count);
  }

  private getCommonImports(): string[] {
    const sortedImports = Array.from(this.imports.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path]) => path);

    return sortedImports;
  }

  /**
   * Enhanced: Analyze project structure (Maven/Gradle modules)
   */
  private analyzeProjectStructure(): void {
    const rootDir = this.options.rootDir;
    
    // Detect Maven multi-module project
    const rootPom = join(rootDir, 'pom.xml');
    if (existsSync(rootPom)) {
      this.analyzeMavenProject(rootDir);
      return;
    }
    
    // Detect Gradle multi-module project
    const settingsGradle = join(rootDir, 'settings.gradle');
    if (existsSync(settingsGradle)) {
      this.analyzeGradleProject(rootDir);
      return;
    }
    
    // Check for package.json (npm/monorepo)
    const packageJson = join(rootDir, 'package.json');
    if (existsSync(packageJson)) {
      this.analyzeNpmProject(rootDir);
    }
  }

  private analyzeMavenProject(rootDir: string): void {
    try {
      const pomPath = join(rootDir, 'pom.xml');
      const pomContent = readFileSync(pomPath, 'utf-8');
      
      // Extract modules from parent POM
      const moduleMatches = pomContent.matchAll(/<module>([^<]+)<\/module>/g);
      
      for (const match of moduleMatches) {
        const moduleName = match[1];
        const modulePath = join(rootDir, moduleName);
        
        if (existsSync(modulePath)) {
          const moduleType = this.inferModuleType(moduleName);
          const packageName = this.extractJavaPackage(modulePath);
          
          this.projectModules.push({
            name: moduleName,
            path: relative(rootDir, modulePath),
            type: moduleType,
            packageName,
            dependencies: [], // Will be filled later
          });
        }
      }
      
      // Analyze module dependencies
      this.analyzeModuleDependencies();
    } catch (error) {
      // Silent fail - not critical
    }
  }

  private analyzeGradleProject(rootDir: string): void {
    try {
      const settingsPath = join(rootDir, 'settings.gradle');
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      
      // Extract included projects
      const includeMatches = settingsContent.matchAll(/include\s+['"]([^'"]+)['"]/g);
      
      for (const match of includeMatches) {
        const moduleName = match[1].replace(':', '/');
        const modulePath = join(rootDir, moduleName);
        
        if (existsSync(modulePath)) {
          const moduleType = this.inferModuleType(moduleName);
          const packageName = this.extractJavaPackage(modulePath);
          
          this.projectModules.push({
            name: moduleName,
            path: relative(rootDir, modulePath),
            type: moduleType,
            packageName,
            dependencies: [],
          });
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  private analyzeNpmProject(rootDir: string): void {
    // For npm projects, check for workspaces or lerna
    try {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      if (packageJson.workspaces) {
        // Monorepo with workspaces
        this.projectModules.push({
          name: packageJson.name || 'root',
          path: '.',
          type: 'common',
          dependencies: [],
        });
      }
    } catch (error) {
      // Silent fail
    }
  }

  private inferModuleType(moduleName: string): ProjectModule['type'] {
    const lowerName = moduleName.toLowerCase();
    if (lowerName.includes('api')) return 'api';
    if (lowerName.includes('biz') || lowerName.includes('service') || lowerName.includes('core')) return 'biz';
    if (lowerName.includes('dal') || lowerName.includes('dao') || lowerName.includes('repository')) return 'dal';
    if (lowerName.includes('web') || lowerName.includes('controller')) return 'web';
    if (lowerName.includes('common') || lowerName.includes('util') || lowerName.includes('kernel')) return 'common';
    return 'other';
  }

  private extractJavaPackage(modulePath: string): string | undefined {
    // Try to find a Java file and extract package name
    try {
      const javaFiles = this.findJavaFiles(modulePath, 3);
      if (javaFiles.length > 0) {
        const content = readFileSync(javaFiles[0], 'utf-8');
        const packageMatch = content.match(/package\s+([\w.]+);/);
        if (packageMatch) {
          return packageMatch[1].split('.').slice(0, -1).join('.'); // Remove last segment (class-specific)
        }
      }
    } catch (error) {
      // Silent fail
    }
    return undefined;
  }

  private findJavaFiles(dir: string, maxDepth: number, currentDepth = 0): string[] {
    if (currentDepth > maxDepth) return [];
    if (!existsSync(dir)) return [];
    
    const files: string[] = [];
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && entry.endsWith('.java')) {
        files.push(fullPath);
        if (files.length >= 1) break; // Only need one
      } else if (stat.isDirectory() && !entry.startsWith('.')) {
        files.push(...this.findJavaFiles(fullPath, maxDepth, currentDepth + 1));
        if (files.length >= 1) break;
      }
    }
    
    return files;
  }

  private analyzeModuleDependencies(): void {
    // Analyze pom.xml dependencies between modules
    for (const module of this.projectModules) {
      const pomPath = join(this.options.rootDir, module.path, 'pom.xml');
      if (existsSync(pomPath)) {
        try {
          const pomContent = readFileSync(pomPath, 'utf-8');
          
          for (const otherModule of this.projectModules) {
            if (module.name !== otherModule.name) {
              // Check if this module depends on the other
              if (pomContent.includes(`<artifactId>${otherModule.name}</artifactId>`)) {
                module.dependencies.push(otherModule.name);
                this.moduleDependencies.push({
                  from: module.name,
                  to: otherModule.name,
                  type: 'compile',
                });
              }
            }
          }
        } catch (error) {
          // Silent fail
        }
      }
    }
  }

  private detectProjectType(): ProjectStructure['type'] {
    if (this.projectModules.length > 1) {
      if (existsSync(join(this.options.rootDir, 'pom.xml'))) return 'maven';
      if (existsSync(join(this.options.rootDir, 'settings.gradle'))) return 'gradle';
      return 'monorepo';
    }
    if (existsSync(join(this.options.rootDir, 'package.json'))) return 'npm';
    return 'single';
  }

  /**
   * Enhanced: Build class dependency graph
   */
  private buildDependencyGraph(): void {
    // First, initialize all classes in the dependency graph
    for (const cls of this.allClasses) {
      if (!this.classDependencies.has(cls.name)) {
        this.classDependencies.set(cls.name, {
          className: cls.name,
          filePath: cls.filePath,
          type: cls.type as any,
          directDependencies: cls.dependencies,
          usedBy: [],
        });
      }
    }
    
    // Second, build reverse dependencies (usedBy)
    for (const cls of this.allClasses) {
      for (const dep of cls.dependencies) {
        const depNode = this.classDependencies.get(dep);
        if (depNode && !depNode.usedBy.includes(cls.name)) {
          depNode.usedBy.push(cls.name);
        }
      }
    }
    
    // Third, infer typical call chains for important classes
    this.inferCallChains();
  }

  private inferCallChains(): void {
    // For each controller, trace the call chain
    for (const [className, depInfo] of this.classDependencies) {
      if (depInfo.type === 'controller') {
        const chain: string[] = [className];
        let current = depInfo.directDependencies[0]; // Usually first dependency is the service
        
        while (current && chain.length < 5) {
          chain.push(current);
          const nextDep = this.classDependencies.get(current);
          if (!nextDep || nextDep.directDependencies.length === 0) break;
          current = nextDep.directDependencies[0];
        }
        
        if (chain.length > 1) {
          depInfo.callChain = chain;
        }
      }
    }
  }

  /**
   * Enhanced: Extract table name from @Table annotation or class name
   */
  private extractTableName(content: string, className: string): string | undefined {
    // Java JPA: @Table(name = "table_name")
    const tableMatch = content.match(/@Table\s*\(\s*name\s*=\s*["']([^"']+)["']/);
    if (tableMatch) {
      return tableMatch[1];
    }

    // MyBatis: Often in XML, but check comments
    const commentMatch = content.match(/\*\s*@?[Tt]able(?:\s*[Nn]ame)?\s*[:=]?\s*[`"]?([\w_]+)[`"]?/);
    if (commentMatch) {
      return commentMatch[1];
    }

    // TypeORM: @Entity("table_name")
    const entityMatch = content.match(/@Entity\s*\(\s*["']([^"']+)["']/);
    if (entityMatch) {
      return entityMatch[1];
    }

    // Default: convert class name to snake_case
    if (className) {
      return this.camelToSnakeCase(className);
    }

    return undefined;
  }

  /**
   * Enhanced: Extract table comment
   */
  private extractTableComment(content: string): string | undefined {
    // Look for class-level JavaDoc or comment describing the table
    const classMatch = content.match(/\/\*\*([\s\S]*?)\*\/\s*(?:@\w+\s*)*class/);
    if (classMatch) {
      const javaDoc = classMatch[1];
      // Extract first meaningful line
      const lines = javaDoc.split('\n')
        .map(l => l.replace(/^\s*\*\s*/, '').trim())
        .filter(l => l && !l.startsWith('@'));
      if (lines.length > 0) {
        return lines[0];
      }
    }
    return undefined;
  }

  /**
   * Enhanced: Extract primary key field
   */
  private extractPrimaryKey(content: string, fields: FieldInfo[]): string | undefined {
    // Java JPA: @Id annotation
    const idMatch = content.match(/@Id[\s\S]*?(?:private|public|protected)\s+[\w<>\[\]]+\s+(\w+)/);
    if (idMatch) {
      return idMatch[1];
    }

    // Look for field named 'id'
    const idField = fields.find(f => f.name.toLowerCase() === 'id');
    if (idField) {
      return idField.name;
    }

    return undefined;
  }

  /**
   * Enhanced: Extract index information
   */
  private extractIndexes(content: string): IndexInfo[] {
    const indexes: IndexInfo[] = [];

    // Java JPA: @Table(indexes = {@Index(...)})
    const indexPattern = /@Index\s*\(\s*name\s*=\s*["']([^"']+)["']\s*,\s*columnList\s*=\s*["']([^"']+)["'](?:.*unique\s*=\s*(true|false))?/g;
    let match;
    while ((match = indexPattern.exec(content)) !== null) {
      indexes.push({
        name: match[1],
        columns: match[2].split(',').map(c => c.trim()),
        unique: match[3] === 'true',
      });
    }

    return indexes;
  }

  /**
   * Enhanced: Add column mapping info to fields
   */
  private enhanceFieldsWithColumnInfo(content: string, fields: FieldInfo[]): FieldInfo[] {
    return fields.map(field => {
      const enhancedField = { ...field };

      // Find the field declaration in content
      const fieldPattern = new RegExp(
        `(?:@[\\w]+(?:\\([^)]*\\))?[\\s]*)*\\s*(?:private|public|protected)?\\s+[\\w<>\\[\\]]+\\s+${field.name}\\s*[;=]`,
        'm'
      );
      const fieldMatch = content.match(fieldPattern);

      if (fieldMatch) {
        const fieldDecl = fieldMatch[0];

        // Extract @Column annotation
        const columnMatch = fieldDecl.match(/@Column\s*\(([^)]+)\)/);
        if (columnMatch) {
          const columnAttrs = columnMatch[1];

          // Extract column name
          const nameMatch = columnAttrs.match(/name\s*=\s*["']([^"']+)["']/);
          if (nameMatch) {
            enhancedField.columnName = nameMatch[1];
          }

          // Extract column type
          const typeMatch = columnAttrs.match(/columnDefinition\s*=\s*["']([^"']+)["']/);
          if (typeMatch) {
            enhancedField.columnType = typeMatch[1];
          }

          // Extract nullable
          const nullableMatch = columnAttrs.match(/nullable\s*=\s*(true|false)/);
          if (nullableMatch) {
            enhancedField.nullable = nullableMatch[1] === 'true';
          }
        }

        // Extract field comment from JavaDoc
        const beforeField = content.substring(0, content.indexOf(fieldMatch[0]));
        const javaDocMatch = beforeField.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
        if (javaDocMatch) {
          const javaDoc = javaDocMatch[1];
          const commentLines = javaDoc.split('\n')
            .map(l => l.replace(/^\s*\*\s*/, '').trim())
            .filter(l => l && !l.startsWith('@'));
          if (commentLines.length > 0) {
            enhancedField.comment = commentLines[0];
          }
        }
      }

      // Default column name if not specified
      if (!enhancedField.columnName) {
        enhancedField.columnName = this.camelToSnakeCase(field.name);
      }

      return enhancedField;
    });
  }

  /**
   * Helper: Convert camelCase to snake_case
   */
  private camelToSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}

/**
 * Scan a project directory and extract implementation details
 */
export async function scanCodebase(options: ScanOptions): Promise<ScanResult> {
  const scanner = new CodeScanner(options);
  return scanner.scan();
}
