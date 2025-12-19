import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { DirectoryMapping } from './templates/project-template.js';
import {
  inferMethodDescription,
  inferClassDescription,
  inferFieldDescription,
  generateMethodBusinessDescription,
  detectOperationPatterns,
  inferApiDescription,
} from './description-inferrer.js';

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
  // MyBatis: Mapper XML information
  mybatisMappers?: MyBatisMapperInfo[];
}

// MyBatis Mapper XML information
export interface MyBatisMapperInfo {
  namespace: string;
  filePath: string;
  statements: MyBatisStatement[];
}

export interface MyBatisStatement {
  id: string;
  type: 'select' | 'insert' | 'update' | 'delete';
  resultType?: string;
  parameterType?: string;
  tables?: string[];  // Tables referenced in the SQL
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
  decorators?: string[];  // Parameter annotations like @PathVariable, @RequestParam
  in?: 'path' | 'query' | 'header' | 'body';  // Location inferred from annotation
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
  // Cache compiled regex patterns
  private excludeRegexCache = new Map<string, RegExp>();
  // Track scan progress
  private scannedFiles = 0;
  private totalFilesToScan = 0;
  // MyBatis: Store mapper XML information
  private mybatisMappers: MyBatisMapperInfo[] = [];

  constructor(options: ScanOptions) {
    this.options = {
      // Java-only: Scan .java files (MyBatis .xml files are also scanned in scanFile)
      includePatterns: options.includePatterns || ['**/*.java'],
      excludePatterns: options.excludePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/target/**',    // Maven build output
        '**/.idea/**',     // IntelliJ IDEA
        '**/.vscode/**',   // VS Code
        '**/.settings/**', // Eclipse
        '**/bin/**',       // Java binary output
        '**/out/**',       // Gradle output
        '**/*.min.js',     // Minified files
        '**/*.d.ts',       // TypeScript declarations
        '**/test/**',      // Test files (usually not needed for docs)
        '**/tests/**',
        '**/__tests__/**',
        '**/spec/**',
      ],
      maxDepth: options.maxDepth || 20,
      rootDir: options.rootDir,
    };
    
    // Pre-compile all exclude patterns
    for (const pattern of this.options.excludePatterns) {
      this.excludeRegexCache.set(pattern, this.globToRegex(pattern));
    }
  }

  /**
   * Scan the project and return extracted information
   */
  async scan(): Promise<ScanResult> {
    // First pass: analyze project structure (Maven/Gradle modules)
    this.analyzeProjectStructure();
    
    // Second pass: scan all code files (Java + MyBatis XML)
    this.scanDirectory(this.options.rootDir, 0);
    
    // Third pass: post-processing after all files are scanned
    this.correctClassTypesByAnnotations();  // Fix class types based on annotations
    this.linkAllMyBatisToMappers();          // Link MyBatis XML to Mapper interfaces
    
    this.analyzeDirectoryStructure();
    this.buildApiDocumentation();
    this.extractBusinessLogic();
    
    // Fourth pass: build dependency graph
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
      mybatisMappers: this.mybatisMappers.length > 0 ? this.mybatisMappers : undefined,
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
    // Java-only: Process .java and MyBatis .xml files
    if (ext !== '.java' && ext !== '.xml') return;
    if (this.shouldExclude(filePath)) return;

    // Handle MyBatis XML files separately
    if (ext === '.xml') {
      this.scanMyBatisXml(filePath);
      return;
    }

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
    
    // Quick check for common exclude directories (optimization)
    const baseName = basename(path);
    if (['node_modules', 'dist', 'build', 'target', '.git', '.idea', 'coverage', 'bin', 'out'].includes(baseName)) {
      return true;
    }
    
    // Use cached regex patterns
    return this.options.excludePatterns.some(pattern => {
      const regex = this.excludeRegexCache.get(pattern) || this.globToRegex(pattern);
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
    
    // Java file patterns (prioritize by common naming conventions)
    if (name.endsWith('Controller.java')) return 'controller';
    if (name.endsWith('Service.java') || name.endsWith('ServiceImpl.java')) return 'service';
    if (name.endsWith('Repository.java') || name.endsWith('Mapper.java') || name.endsWith('DAO.java') || name.endsWith('Dao.java')) return 'repository';
    if (name.endsWith('DTO.java') || name.endsWith('Dto.java') || name.endsWith('VO.java') || name.endsWith('Vo.java')) return 'dto';
    if (name.endsWith('DO.java') || name.endsWith('Do.java') || name.endsWith('PO.java') || name.endsWith('Po.java') || name.endsWith('Entity.java') || name.endsWith('Model.java') || name.endsWith('POJO.java')) return 'entity';
    if (name.endsWith('Utils.java') || name.endsWith('Util.java') || name.endsWith('Helper.java')) return 'utility';
    if (name.endsWith('Config.java') || name.endsWith('Configuration.java') || name.endsWith('Properties.java')) return 'config';
    if (name.endsWith('Constants.java') || name.endsWith('Constant.java') || name.endsWith('Enum.java')) return 'constant';
    if (name.endsWith('Test.java') || name.endsWith('Tests.java') || name.endsWith('IT.java')) return 'test';
    if (name.endsWith('Interceptor.java') || name.endsWith('Filter.java') || name.endsWith('Aspect.java')) return 'middleware';
    if (name.endsWith('Handler.java') || name.endsWith('Listener.java')) return 'handler';
    
    return 'other';
  }

  private isEntity(filePath: string, content: string): boolean {
    if (!filePath.endsWith('.java')) return false;
    
    const name = basename(filePath);
    
    // JPA/Hibernate annotations
    if (content.includes('@Entity') || content.includes('@Table')) return true;
    
    // MyBatis-Plus annotations
    if (content.includes('@TableName') || content.includes('@TableId')) return true;
    
    // Common Java naming patterns for entities
    if (name.endsWith('Entity.java') || name.endsWith('Model.java')) return true;
    if (name.endsWith('DO.java') || name.endsWith('Do.java')) return true;
    if (name.endsWith('PO.java') || name.endsWith('Po.java')) return true;
    if (name.endsWith('POJO.java')) return true;
    
    // Check for Lombok @Data with field patterns (common for entities)
    if (content.includes('@Data') && !name.includes('DTO') && !name.includes('VO') && !name.includes('Request') && !name.includes('Response')) {
      // Has fields but no service/controller annotations
      if (!content.includes('@Service') && !content.includes('@Controller') && !content.includes('@Component')) {
        return true;
      }
    }
    
    return false;
  }

  private isController(filePath: string, content: string): boolean {
    if (!filePath.endsWith('.java')) return false;
    
    // Spring MVC annotations
    if (content.includes('@RestController') || content.includes('@Controller')) return true;
    
    // Common naming pattern
    if (basename(filePath).endsWith('Controller.java')) return true;
    
    return false;
  }

  private isService(filePath: string, content: string): boolean {
    if (!filePath.endsWith('.java')) return false;
    
    // Spring annotations
    if (content.includes('@Service')) return true;
    
    // Common naming patterns
    const name = basename(filePath);
    if (name.endsWith('Service.java') || name.endsWith('ServiceImpl.java')) return true;
    if (name.endsWith('Manager.java') || name.endsWith('ManagerImpl.java')) return true;
    
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
    // Java: Match class, interface, or enum with optional modifiers
    const classMatch = content.match(/\b(?:public|protected|private|abstract|final|\s)*\b(?:class|interface|enum)\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  private extractDecorators(content: string): string[] {
    const decoratorMatches = content.matchAll(/@(\w+)(?:\([^)]*\))?/g);
    return Array.from(decoratorMatches, match => match[1]);
  }

  private extractFields(content: string): FieldInfo[] {
    const classFields: ClassFieldInfo[] = this.extractClassFields(content);
    
    // Convert ClassFieldInfo[] to FieldInfo[] for backward compatibility
    return classFields.map(f => ({
      name: f.name,
      type: f.type,
      optional: f.optional || false,
      decorators: f.decorators,
    }));
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
    // Two-step approach: capture wide annotation block + method signature, then extract Mapping annotations
    // Requires method signature to end with ) followed by throws/{ /; to avoid matching field initializers
    const springMethodPattern = /((?:@\w+(?:\([^)]*\))?\s*)+)(public|private|protected)?\s*[\w<>\[\]\.]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*[{;]/g;
    
    let methodMatch;
    while ((methodMatch = springMethodPattern.exec(content)) !== null) {
      const annotationBlock = methodMatch[1];
      const methodName = methodMatch[3];
      
      // Only process if the annotation block contains a Mapping annotation
      if (!/@(?:Get|Post|Put|Delete|Patch|Request)Mapping/.test(annotationBlock)) {
        continue;
      }
      
      const routeInfo = this.parseSpringMappingAnnotation(annotationBlock, methodName);
      if (routeInfo) {
        const alreadyMatched = routes.some(r => r.handler === methodName);
        if (!alreadyMatched) {
          routes.push(routeInfo);
        }
      }
    }

    return routes;
  }

  private parseSpringMappingAnnotation(annotationBlock: string, methodName: string): RouteInfo | null {
    let httpMethod = 'GET';
    let path = '';
    const specificMapping = annotationBlock.match(/@(Get|Post|Put|Delete|Patch)Mapping/);
    if (specificMapping) {
      httpMethod = specificMapping[1].toUpperCase();
    } else if (annotationBlock.includes('@RequestMapping')) {
      // Support both method=RequestMethod.GET and method={RequestMethod.GET, RequestMethod.POST}
      const mm = annotationBlock.match(/method\s*=\s*\{?\s*(?:RequestMethod\.)?([A-Z]+)/);
      if (mm) httpMethod = mm[1];
    } else {
      return null;
    }
    const pm1 = annotationBlock.match(/@(?:Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*["']([^"']+)["']/);
    if (pm1) path = pm1[1];
    if (!path) {
      const pm2 = annotationBlock.match(/(?:value|path)\s*=\s*["']([^"']+)["']/);
      if (pm2) path = pm2[1];
    }
    if (!path) {
      const pm3 = annotationBlock.match(/(?:value|path)\s*=\s*\{\s*["']([^"']+)["']/);
      if (pm3) path = pm3[1];
    }
    return { method: httpMethod, path: path, handler: methodName };
  }

  private extractMethods(content: string): MethodInfo[] {
    const methods: ClassMethodInfo[] = this.extractClassMethods(content, 'other');
    
    // Convert ClassMethodInfo[] to MethodInfo[] for backward compatibility
    return methods.map(m => ({
      name: m.name,
      parameters: m.parameters.map(p => p.name + ': ' + p.type),
      returnType: m.returnType,
    }));
  }

  private analyzeDirectoryStructure(): void {
    const dirCounts = new Map<string, number>();

    // Count files per directory
    [...this.entities, ...this.controllers, ...this.services].forEach(item => {
      const dir = join(this.options.rootDir, item.filePath.split('/').slice(0, -1).join('/'));
      dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
    });

    // Identify common directories (Java/Maven structure)
    const commonDirs = [
      'src/main/java',
      'src/main/resources',
      'src/test/java',
      'src/test/resources',
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

    // FIXED: Correct precedence with parentheses
    if ((this.filesByType.get('entity') || 0) > 0) {
      patterns.push('Entity-based data modeling');
    }
    if ((this.filesByType.get('dto') || 0) > 0) {
      patterns.push('DTO pattern for data transfer');
    }
    if ((this.filesByType.get('repository') || 0) > 0) {
      patterns.push('Repository pattern for data access');
    }
    if ((this.filesByType.get('service') || 0) > 0) {
      patterns.push('Service layer for business logic');
    }
    if ((this.filesByType.get('controller') || 0) > 0) {
      patterns.push('Controller pattern for HTTP handling');
    }

    return patterns;
  }

  // Enhanced: Extract imports for pattern detection (Java syntax)
  private extractImports(content: string): void {
    // Java import syntax: 
    // - import com.xx.yy.ClassName;
    // - import com.xx.yy.*;
    // - import static com.xx.yy.Util.*;
    const importMatches = content.matchAll(/^\s*import\s+(static\s+)?([\w.]+(?:\.\*)?)\s*;/gm);
    for (const match of importMatches) {
      const importPath = match[2];
      let packageName: string;
      
      if (importPath.endsWith('.*')) {
        // Wildcard import: com.xx.yy.* -> package is com.xx.yy
        packageName = importPath.slice(0, -2);
      } else if (importPath.includes('.')) {
        // Class import: com.xx.yy.ClassName -> package is com.xx.yy
        packageName = importPath.substring(0, importPath.lastIndexOf('.'));
      } else {
        // Single name (rare)
        packageName = importPath;
      }
      
      this.imports.set(packageName, (this.imports.get(packageName) || 0) + 1);
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

  // Enhanced: Extract full class information with auto-inferred descriptions
  private extractClassInfo(filePath: string, content: string, fileType: string): ClassInfo | null {
    // Match both class and interface (for Java), with optional modifiers (public, abstract, etc.)
    // Support full qualified names and comma-separated extends (interface A extends B, C)
    const classMatch = content.match(/(?:public\s+|private\s+|protected\s+|abstract\s+)*(?:class|interface|enum)\s+(\w+)(?:\s+extends\s+([\w\.,\s<>]+?))?(?:\s+implements\s+([\w\.,\s]+))?(?:\s*\{|$)/m);
    if (!classMatch) return null;

    const className = classMatch[1];
    // Extract simple names from extends (may be comma-separated for interface multi-extends)
    // Strip generics before processing: BaseMapper<User> -> BaseMapper
    const extendsRaw = classMatch[2]?.replace(/<[^>]*>/g, '') || '';
    const extendsList = extendsRaw.split(',').map(s => s.trim().split('.').pop()!).filter(Boolean);
    const extendsClass = extendsList[0]; // Primary extends class
    // For interface multi-extends, also add to implements for unified checking
    // Strip generics from implements too: IService<User> -> IService
    const implementsRaw = (classMatch[3] || '').replace(/<[^>]*>/g, '');
    const implementsInterfaces = [
      ...implementsRaw.split(',').map(s => s.trim().split('.').pop()!).filter(Boolean),
      ...extendsList.slice(1) // Add secondary extends (for interface multi-extends)
    ];
    
    const classPosition = content.indexOf(classMatch[0]);
    const jsDocDescription = this.extractJsDoc(content, classPosition);
    const decorators = this.extractDecorators(content);
    const fields = this.extractClassFields(content);
    const type = this.mapFileTypeToClassType(fileType);
    const methods = this.extractClassMethods(content, type);
    const dependencies = this.extractDependencies(content);

    // Auto-infer description if JSDoc is missing
    const description = jsDocDescription || inferClassDescription(className, type);

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
    
    // Extract class body to avoid matching local variables inside methods
    // IMPROVED: Find the fields section (before first method definition)
    // For DTO/Entity classes, fields are the main content, so we need to scan more
    const classFieldsSection = this.extractFieldsSection(content);
    
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
      while ((match = pattern.exec(classFieldsSection)) !== null) {
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

        // Look for JSDoc description, auto-infer if missing
        const fieldPosition = content.indexOf(match[0]);
        const jsDocDesc = this.extractJsDoc(content, fieldPosition);
        const description = jsDocDesc || inferFieldDescription(fieldName, fieldType);

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
    // IMPORTANT: Only match fields that appear before any method definitions
    const javaFieldPattern = /((?:@\w+(?:\([^)]*\))?\s*)*)\s*(private|public|protected)?\s+(static|final)?\s*(static|final)?\s*([\w<>\[\]]+)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    let javaMatch;
    while ((javaMatch = javaFieldPattern.exec(classFieldsSection)) !== null) {
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

      // Skip common keywords and method-like patterns (NOT actual Java types)
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
      const jsDocDesc = this.extractJsDoc(content, fieldPosition);
      const description = jsDocDesc || inferFieldDescription(fieldName, fieldType);

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

  /**
   * Extract the fields section of a class (before first method definition)
   * This avoids matching local variables inside methods
   */
  private extractFieldsSection(content: string): string {
    // Find class/interface/enum body start (supports all Java type declarations)
    const classMatch = content.match(/(?:class|interface|enum)\s+\w+[^{]*\{/);
    if (!classMatch) {
      return content.substring(0, 10000);
    }
    
    const classStart = classMatch.index! + classMatch[0].length;
    const afterClass = content.substring(classStart);
    
    // Find first method definition pattern in Java:
    // [annotations] [visibility] [static] [final] ReturnType methodName(...) {
    // This pattern looks for: visibility + type + name + ( + ) + {
    const methodPatterns = [
      // Java method: public void doSomething() {
      /(?:^|\n)\s*(?:@\w+(?:\([^)]*\))?\s*)*(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[\w,\s]+>\s+)?[\w<>\[\]\.]+\s+\w+\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/,
      // Constructor pattern: public ClassName(...) {
      /(?:^|\n)\s*(?:public|private|protected)\s+\w+\s*\([^)]*\)\s*\{/,
    ];
    
    let firstMethodPos = afterClass.length;
    
    for (const pattern of methodPatterns) {
      const match = afterClass.match(pattern);
      if (match && match.index !== undefined && match.index < firstMethodPos) {
        firstMethodPos = match.index;
      }
    }
    
    // Extract fields section (content before first method)
    // Add some buffer (200 chars) to handle edge cases, but cap at reasonable limit
    const fieldsSection = afterClass.substring(0, Math.min(firstMethodPos + 200, 20000));
    
    return fieldsSection;
  }

  // Enhanced: Extract class methods with full information
  private extractClassMethods(content: string, classType: ClassInfo['type'] = 'other'): ClassMethodInfo[] {
    const methods: ClassMethodInfo[] = [];
    const seen = new Set<string>(); // Track seen methods to avoid duplicates
    
    // Check if this is an entity/dto class (getter/setter should be simplified)
    const isDataClass = classType === 'entity' || classType === 'dto';
    
    // CRITICAL: Extract only class-level methods from the field section to first real method
    // This prevents matching code inside method bodies
    // Support both class and interface bodies
    const classBodyMatch = content.match(/(?:class|interface)\s+\w+[^{]*\{([\s\S]*)/m);
    if (!classBodyMatch) return methods;
    
    const classBody = classBodyMatch[1];
    
    // OPTIMIZED: Simplified Java method pattern to avoid catastrophic backtracking
    // Pattern: [annotations] [modifiers] ReturnType methodName(params) [throws] { or ;
    // Support both concrete methods (ending with {) and interface/abstract methods (ending with ;)
    const javaMethodPattern = /^[ \t]*((?:@\w+(?:\([^)]*\))?\s*)*)(public|private|protected)?\s*(static\s+)?(?:default\s+)?(?:final\s+)?(?:abstract\s+)?(?:synchronized\s+)?(?:<[\w,\s]+>\s+)?([\w<>\[\]\.]+)\s+(\w+)\s*\(([^)]*)\)(?:\s*throws\s+[\w,\s]+)?\s*(\{|;)/gm;
    
    let match;
    while ((match = javaMethodPattern.exec(classBody)) !== null) {
      const decoratorsStr = match[1] || '';
      const visibility = (match[2] as 'public' | 'private' | 'protected') || 'public';
      const isStatic = !!match[3];
      const returnType = match[4]?.trim();
      const methodName = match[5];
      const paramsStr = match[6];
      const isInterfaceMethod = match[7] === ';'; // Interface/abstract methods end with ;

      // Skip if this is a static final method (usually utility methods)
      // Skip constructor and common non-business methods, also skip control flow keywords
      if (['constructor', 'toString', 'valueOf', 'equals', 'hashCode', 'clone', 'wait', 'notify', 'notifyAll',
           'ngOnInit', 'ngOnDestroy', 'finalize',
           'if', 'for', 'while', 'switch', 'catch', 'try', 'else', 'do',
           'return', 'throw', 'new', 'class', 'interface', 'extends', 'implements',
           'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'String',
           'filter', 'map', 'forEach', 'collect'].includes(methodName)) continue;

      // Skip if method name starts with lowercase and is likely a variable or keyword
      if (methodName.length < 2) continue;
      
      // Skip if looks like a field access or lambda
      if (methodName.includes('.') || methodName.includes('->') || methodName.includes('=>')) continue;
      
      // For entity/dto classes: skip getter/setter methods (they're not business logic)
      // Getter: get* with 0 params, Setter: set* with 1 param and void return
      if (isDataClass) {
        const isGetter = methodName.startsWith('get') && paramsStr.trim() === '';
        const isSetter = methodName.startsWith('set') && returnType === 'void' && paramsStr.includes(',') === false && paramsStr.trim() !== '';
        const isBooleanGetter = (methodName.startsWith('is') || methodName.startsWith('has') || methodName.startsWith('can')) && paramsStr.trim() === '';
        if (isGetter || isSetter || isBooleanGetter) {
          continue; // Skip getter/setter in entity/dto
        }
      }

      // Create unique method signature to detect duplicates
      const methodSignature = `${methodName}(${paramsStr})`;
      if (seen.has(methodSignature)) {
        continue; // Skip duplicate methods
      }
      seen.add(methodSignature);

      const decoratorsMatch = decoratorsStr.match(/@(\w+)/g);
      const decorators = decoratorsMatch ? decoratorsMatch.map(d => d.substring(1)) : [];

      // Parse parameters
      const parameters = this.parseMethodParameters(paramsStr);

      // Extract description from JSDoc (look back from method position)
      const methodPosition = content.indexOf(match[0]);
      const jsDocDescription = this.extractJsDoc(content, methodPosition);

      // Extract method body for business logic detection (only for concrete methods)
      let methodBody = '';
      let businessLogic: string | undefined;
      if (!isInterfaceMethod) {
        const methodBodyStart = methodPosition + match[0].length;
        methodBody = this.extractMethodBody(content, methodBodyStart);
        businessLogic = methodBody ? detectOperationPatterns(methodBody).join('、') : undefined;
      }
      
      // Auto-infer description if JSDoc is missing
      const description = generateMethodBusinessDescription(
        methodName,
        methodBody || undefined,
        jsDocDescription
      );

      methods.push({
        name: methodName,
        description: description || inferMethodDescription(methodName),
        parameters,
        returnType: returnType || 'void',
        decorators,
        isAsync: false,
        visibility,
        businessLogic,
      });
    }

    return methods;
  }

  // Enhanced: Parse method parameters with Spring annotation support
  private parseMethodParameters(paramsStr: string): ParameterInfo[] {
    if (!paramsStr.trim()) return [];

    const params: ParameterInfo[] = [];
    // Split by comma, handling generics
    const paramParts = this.splitParameters(paramsStr);

    for (const part of paramParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Java: @Annotation Type paramName or final Type paramName
      // Extract annotations with their full text (for parsing attributes)
      const annotationMatches = trimmed.match(/@(\w+)(?:\([^)]*\))?/g) || [];
      const decorators = annotationMatches.map(a => a.match(/@(\w+)/)?.[1] || '');
      
      // Determine parameter location and optional status from Spring annotations
      let inLocation: ParameterInfo['in'] = undefined;
      let isOptional = false;
      let defaultValue: string | undefined = undefined;
      
      for (const annotation of annotationMatches) {
        if (annotation.startsWith('@PathVariable')) {
          inLocation = 'path';
          // @PathVariable defaults to required=true, check for required=false
          if (/required\s*=\s*false/.test(annotation)) {
            isOptional = true;
          }
        } else if (annotation.startsWith('@RequestParam')) {
          inLocation = 'query';
          // @RequestParam defaults to required=true, unless:
          // - required=false is specified
          // - defaultValue is specified
          if (/required\s*=\s*false/.test(annotation)) {
            isOptional = true;
          }
          const defaultMatch = annotation.match(/defaultValue\s*=\s*["']([^"']*)["']/);
          if (defaultMatch) {
            isOptional = true;
            defaultValue = defaultMatch[1];
          }
        } else if (annotation.startsWith('@RequestHeader')) {
          inLocation = 'header';
          if (/required\s*=\s*false/.test(annotation)) {
            isOptional = true;
          }
        } else if (annotation.startsWith('@RequestBody')) {
          inLocation = 'body';
          if (/required\s*=\s*false/.test(annotation)) {
            isOptional = true;
          }
        }
      }
      
      // Extract type and name (after removing annotations)
      const javaParamMatch = trimmed.match(/(?:@\w+(?:\([^)]*\))?\s*)*(final\s+)?([\w<>\[\]]+)\s+(\w+)$/);
      if (javaParamMatch) {
        params.push({
          name: javaParamMatch[3],
          type: javaParamMatch[2].trim(),
          optional: isOptional,
          defaultValue,
          decorators: decorators.length > 0 ? decorators : undefined,
          in: inLocation,
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

  // Extract method body content (up to a reasonable length)
  private extractMethodBody(content: string, startPosition: number): string {
    const maxLength = 500; // Maximum characters to scan
    const scanContent = content.substring(startPosition, startPosition + maxLength);
    
    // Find the method body (until matching closing brace or maxLength)
    let depth = 1;
    let pos = 0;
    let bodyContent = '';
    
    while (pos < scanContent.length && depth > 0 && bodyContent.length < 400) {
      const char = scanContent[pos];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      if (depth > 0) bodyContent += char;
      pos++;
    }

    return bodyContent;
  }

  // Enhanced: Extract business logic hint from method body
  private extractMethodBusinessLogic(content: string, startPosition: number): string | undefined {
    // Limit extraction to avoid pulling in large code blocks
    const maxLength = 500; // Maximum characters to scan
    const scanContent = content.substring(startPosition, startPosition + maxLength);
    
    // Find the method body (until matching closing brace or maxLength)
    let depth = 1;
    let pos = 0;
    let bodyContent = '';
    
    while (pos < scanContent.length && depth > 0 && bodyContent.length < 300) {
      const char = scanContent[pos];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      if (depth > 0) bodyContent += char;
      pos++;
    }

    // IMPORTANT: Do NOT extract actual code, only logic patterns
    const logicIndicators: string[] = [];

    // Check for validation logic
    if (bodyContent.includes('validate') || bodyContent.includes('Validator')) {
      logicIndicators.push('数据验证');
    }
    // Check for database operations
    if (bodyContent.includes('save(') || bodyContent.includes('insert(') || bodyContent.includes('create(')) {
      logicIndicators.push('数据写入');
    }
    if (bodyContent.includes('update(') || bodyContent.includes('modify(')) {
      logicIndicators.push('数据更新');
    }
    if (bodyContent.includes('find(') || bodyContent.includes('query(') || bodyContent.includes('select(')) {
      logicIndicators.push('数据查询');
    }
    if (bodyContent.includes('delete(') || bodyContent.includes('remove(')) {
      logicIndicators.push('数据删除');
    }
    // Check for external API calls
    if (bodyContent.includes('fetch(') || bodyContent.includes('axios') || bodyContent.includes('httpClient') || bodyContent.includes('RestTemplate')) {
      logicIndicators.push('外部API调用');
    }
    // Check for transaction handling
    if (bodyContent.includes('transaction') || bodyContent.includes('Transaction') || bodyContent.includes('@Transactional')) {
      logicIndicators.push('事务管理');
    }
    // Check for event emission
    if (bodyContent.includes('emit(') || bodyContent.includes('publish(') || bodyContent.includes('sendEvent')) {
      logicIndicators.push('事件发布');
    }
    // Check for cache operations
    if (bodyContent.includes('cache') || bodyContent.includes('Cache') || bodyContent.includes('redis')) {
      logicIndicators.push('缓存操作');
    }

    // Return ONLY pattern indicators, NOT code
    return logicIndicators.length > 0 ? logicIndicators.join('、') : undefined;
  }

  // Enhanced: Extract dependencies from constructor and injection annotations
  // Java-only: Only extract from @Autowired/@Resource/@Inject, NOT from method calls
  private extractDependencies(content: string): string[] {
    const dependencies = new Set<string>();

    // Java: Field injection with @Autowired, @Resource, @Inject
    const javaInjectionPattern = /(?:@Autowired|@Resource|@Inject)\s*(?:\([^)]*\))?\s*(?:private|public|protected)?\s+([\w<>\[\],\s.]+)\s+(\w+)\s*;/g;
    let javaMatch;
    while ((javaMatch = javaInjectionPattern.exec(content)) !== null) {
      const type = javaMatch[1];
      this.extractTypeFromGeneric(type, dependencies);
    }
    
    // Java: Constructor injection (common in Spring)
    // Pattern: public ClassName(ServiceA a, ServiceB b) { ... }
    const constructorPattern = /public\s+(\w+)\s*\(([^)]*)\)\s*\{/;
    const constructorMatch = content.match(constructorPattern);
    if (constructorMatch) {
      const paramsStr = constructorMatch[2];
      const paramParts = this.splitParameters(paramsStr);
      
      for (const part of paramParts) {
        // Match: Type paramName or final Type paramName
        const depMatch = part.trim().match(/(?:final\s+)?([\w<>\[\],\s.]+)\s+\w+$/);
        if (depMatch) {
          const type = depMatch[1];
          this.extractTypeFromGeneric(type, dependencies);
        }
      }
    }

    // Filter out common Java types that are not actual dependencies
    const excludeTypes = new Set([
      'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Byte', 'Short', 'Character',
      'List', 'Set', 'Map', 'Collection', 'Optional', 'Object', 'Class',
      'void', 'int', 'long', 'double', 'float', 'boolean', 'byte', 'short', 'char'
    ]);
    
    return Array.from(dependencies).filter(d => d.length > 0 && !excludeTypes.has(d));
  }

  // Helper: Extract dependency types from generic type declarations
  // e.g., Map<String, com.xx.UserDTO> -> UserDTO, List<User> -> User
  private extractTypeFromGeneric(type: string, dependencies: Set<string>): void {
    let t = type.replace(/\s+/g, '').replace(/\[\]$/g, '');
    // Remove wildcards: ? extends X, ? super X, ?
    t = t.replace(/\?\s*extends\s*/g, '').replace(/\?\s*super\s*/g, '').replace(/\?/g, '');
    
    // Get the content inside outermost <>
    const outerMatch = t.match(/<(.+)>/);
    if (outerMatch) {
      // Split by comma but respect nested <>
      const args = this.splitGenericArgs(outerMatch[1]);
      // Get last argument (e.g., for Map<K,V> we want V)
      t = args[args.length - 1] || t;
    }
    
    // Strip remaining nested generics iteratively
    while (/<[^<>]*>/.test(t)) {
      t = t.replace(/<[^<>]*>/g, '');
    }
    
    // Get simple name (remove package prefix)
    const simpleName = t.split('.').pop()!.replace(/\[\]$/g, '').trim();
    if (simpleName && /^[A-Z]/.test(simpleName)) {
      dependencies.add(simpleName);
    }
  }
  
  /**
   * Split generic arguments respecting nested <>
   */
  private splitGenericArgs(content: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';
    
    for (const char of content) {
      if (char === '<') {
        depth++;
        current += char;
      } else if (char === '>') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }

  // Enhanced: Build complete API documentation
  private buildApiDocumentation(): void {
    for (const controller of this.controllers) {
      // Extract controller base path from file content
      const controllerClass = this.allClasses.find(c => c.name === controller.name);
      // Read file content for controller path extraction
      const controllerFilePath = join(this.options.rootDir, controller.filePath);
      let controllerContent = '';
      try {
        controllerContent = readFileSync(controllerFilePath, 'utf-8');
      } catch (e) {
        // Silent fail
      }
      const controllerPath = this.extractControllerPath(controllerClass?.decorators || [], controllerContent) || '';

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
          parameters: this.extractApiParameters(methodInfo, fullPath, route.method),
          requestBody: this.extractRequestBody(methodInfo, route.method),
          responses: this.inferApiResponses(methodInfo),
          decorators: methodInfo?.decorators || [],
        };

        this.apiEndpoints.push(endpoint);
      }
    }
  }

  private extractControllerPath(decorators: string[], content?: string): string | undefined {
    // Java Spring: Extract base path from @RequestMapping on class level
    if (content) {
      return this.extractSpringControllerBasePath(content);
    }
    // Fallback for NestJS style
    return undefined;
  }

  /**
   * Extract Spring controller base path from class-level @RequestMapping
   * Handles: @RequestMapping("/api/users") or @RequestMapping(value="/api/users")
   * Also supports: @RequestMapping({"/a", "/b"}) - takes first path
   */
  private extractSpringControllerBasePath(content: string): string {
    // Match class/interface declaration with all preceding annotations
    // The annotations are PART of the classMatch, not before it
    const classMatch = content.match(/(?:@\w+(?:\([^)]*\))?\s*)*(?:public\s+)?(?:abstract\s+)?(?:class|interface)\s+\w+/);
    if (!classMatch) return '';
    
    const header = classMatch[0];
    
    // Look for @RequestMapping in the class header annotations
    // Pattern 1: @RequestMapping("/path") or @RequestMapping(value="/path")
    const m1 = header.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    if (m1) return m1[1];
    
    // Pattern 2: @RequestMapping(path="/path")
    const m2 = header.match(/@RequestMapping\s*\([^)]*\bpath\s*=\s*["']([^"']+)["']/);
    if (m2) return m2[1];
    
    // Pattern 3: @RequestMapping({"/a", "/b"}) - array of paths, take first
    const m3 = header.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?\{\s*["']([^"']+)["']/);
    if (m3) return m3[1];
    
    return '';
  }

  private joinPaths(base: string, path: string): string {
    const cleanBase = base.replace(/^\/|\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `/${cleanBase}${cleanBase && cleanPath ? '/' : ''}${cleanPath}`;
  }

  // Helper: Normalize type for comparison (strip generics, arrays, whitespace)
  // Uses iterative approach to handle nested generics like List<List<User>>
  private normalizeType(type: string): string {
    let t = type.replace(/\s+/g, '').replace(/\[\]$/g, '');
    // Iteratively remove innermost generics until none remain
    while (true) {
      const next = t.replace(/<[^<>]*>/g, '');
      if (next === t) break;
      t = next;
    }
    return t;
  }

  // Helper: Check if type is a simple Java type (primitives, wrappers, String, Date, etc.)
  private isSimpleJavaType(type: string): boolean {
    const normalized = this.normalizeType(type);
    const simpleTypes = [
      'String', 'Integer', 'Long', 'Short', 'Byte', 'Float', 'Double', 'Boolean', 'Character',
      'int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char',
      'BigDecimal', 'BigInteger', 'Date', 'LocalDate', 'LocalDateTime', 'LocalTime',
      'Instant', 'ZonedDateTime', 'UUID'
    ];
    return simpleTypes.includes(normalized);
  }

  // Helper: Check if type is a collection type
  private isCollectionType(type: string): boolean {
    // Remove whitespace for consistent matching
    const t = type.replace(/\s+/g, '');
    const normalized = this.normalizeType(type);
    
    // Check for common collection patterns (including fully qualified names)
    return t.startsWith('List<') || t.includes('.List<') ||
           t.startsWith('Set<') || t.includes('.Set<') ||
           t.startsWith('Collection<') || t.includes('.Collection<') ||
           t.startsWith('Map<') || t.includes('.Map<') ||
           t.endsWith('[]') ||
           normalized === 'List' || normalized === 'Set' || normalized === 'Collection' || normalized === 'Map';
  }

  // Helper: Check if type is a complex object (likely body candidate)
  private isComplexType(type: string): boolean {
    const normalized = this.normalizeType(type);
    // Exclude Spring framework types (check both normalized and original for generics like List<MultipartFile>)
    const excludedTypes = ['Object', 'Void', 'void', 'BindingResult', 'Errors', 'MultipartFile'];
    if (excludedTypes.includes(normalized) || type.includes('MultipartFile')) return false;
    if (type.startsWith('HttpServlet') || type.startsWith('Model') || type.includes('HttpServlet')) return false;
    
    return !this.isSimpleJavaType(type) && !this.isCollectionType(type);
  }

  private extractApiParameters(methodInfo?: ClassMethodInfo, routePath?: string, httpMethod?: string): ApiParameter[] {
    if (!methodInfo) return [];

    // Extract path variables from route path
    // Supports both {id} (Spring/OpenAPI) and :id (Express/Swagger) formats
    const pathVariables = new Set<string>();
    if (routePath) {
      // Match {paramName} format
      const matches1 = routePath.matchAll(/\{(\w+)\}/g);
      for (const match of matches1) {
        pathVariables.add(match[1].toLowerCase());
      }
      // Match :paramName format
      const matches2 = routePath.matchAll(/:(\w+)/g);
      for (const match of matches2) {
        pathVariables.add(match[1].toLowerCase());
      }
    }

    const isWriteMethod = httpMethod && ['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase());
    const params: ApiParameter[] = [];
    let foundBodyParam = false;
    
    // First pass: find if any param is explicitly marked as body
    for (const param of methodInfo.parameters) {
      if (param.in === 'body') {
        foundBodyParam = true;
        break;
      }
    }
    
    for (const param of methodInfo.parameters) {
      // Use annotation-based location if available
      let inLocation: ApiParameter['in'] = param.in || 'query';
      
      // Fallback heuristics if no annotation detected
      if (!param.in) {
        const paramNameLower = param.name.toLowerCase();
        const paramType = param.type;
        
        // 1. Check if param name matches a path variable in the route (ONLY way to be path without annotation)
        if (pathVariables.has(paramNameLower)) {
          inLocation = 'path';
        }
        // 2. Body types by naming: DTO, VO, Request, Command, Form, etc. (ONLY for write methods)
        else if (isWriteMethod && (
          paramType.includes('Dto') || paramType.includes('DTO') ||
          paramType.includes('VO') || paramType.includes('Vo') ||
          paramType.includes('Request') || paramType.includes('Command') ||
          paramType.includes('Form') || paramType.includes('Body') ||
          paramType.includes('Cmd') ||
          (paramType.includes('Param') && !paramType.includes('String'))
        )) {
          inLocation = 'body';
        }
        // 3. For POST/PUT/PATCH: complex type without explicit body -> likely body
        else if (isWriteMethod && !foundBodyParam && this.isComplexType(paramType)) {
          inLocation = 'body';
          foundBodyParam = true; // Only assign first complex type as body
        }
        // 4. Pagination/sorting params -> query
        else if (
          paramNameLower === 'page' || paramNameLower === 'pagenum' ||
          paramNameLower === 'size' || paramNameLower === 'pagesize' ||
          paramNameLower === 'sort' || paramNameLower === 'order' ||
          paramNameLower === 'limit' || paramNameLower === 'offset'
        ) {
          inLocation = 'query';
        }
        // 5. Simple types -> query
        else if (this.isSimpleJavaType(paramType)) {
          inLocation = 'query';
        }
        // 6. Collection types -> query
        else if (this.isCollectionType(paramType)) {
          inLocation = 'query';
        }
        // 7. Default: query (safer than guessing path, and GET/DELETE complex objects go here)
        else {
          inLocation = 'query';
        }
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

  private extractRequestBody(methodInfo?: ClassMethodInfo, httpMethod?: string): ApiRequestBody | undefined {
    if (!methodInfo) return undefined;

    const isWriteMethod = httpMethod && ['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase());

    // Priority 1: Find parameter with in === 'body' (from @RequestBody annotation)
    let bodyParam = methodInfo.parameters.find(p => p.in === 'body');
    
    // GET/DELETE should not have request body unless explicitly annotated with @RequestBody
    if (!isWriteMethod && !bodyParam) {
      return undefined;
    }
    
    // Priority 2: Fallback to type naming patterns (DTO, Body, Request, etc.) - ONLY for write methods
    if (!bodyParam && isWriteMethod) {
      bodyParam = methodInfo.parameters.find(p => 
        p.type.includes('Dto') || p.type.includes('DTO') || 
        p.type.includes('Body') || p.type.includes('Request') ||
        p.type.includes('Command') || p.type.includes('Form') ||
        p.type.includes('Cmd')
      );
    }
    
    // Priority 3: For POST/PUT/PATCH, find the unique complex object
    if (!bodyParam && isWriteMethod) {
      const complexParams = methodInfo.parameters.filter(p => this.isComplexType(p.type));
      // Only use if there's exactly one complex object (avoid ambiguity)
      if (complexParams.length === 1) {
        bodyParam = complexParams[0];
      }
    }

    if (!bodyParam) return undefined;

    // Find the DTO class to get its fields
    const dtoClass = this.allClasses.find(c => c.name === bodyParam!.type);

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
      // Java patterns: *Controller.java, *Service.java, *ServiceImpl.java, *Mapper.java, *DTO.java, etc.
      const match = fileName.match(/(\w+)(Controller|Service|ServiceImpl|Mapper|Repository|DAO|Dao|DTO|Dto|VO|Vo|DO|Entity|Impl)\.java$/);
      if (match) {
        const suffix = match[2];
        const pattern = `*${suffix}.java`;
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
      // 递归扫描所有模块（包括子模块）
      this.scanMavenModulesRecursive(rootDir, rootDir);
      
      // Analyze module dependencies
      this.analyzeModuleDependencies();
    } catch (error) {
      // Silent fail - not critical
    }
  }
  
  /**
   * 递归扫描 Maven 模块，支持嵌套子模块
   * @param currentDir 当前正在扫描的目录
   * @param projectRoot 项目根目录（用于计算相对路径）
   */
  private scanMavenModulesRecursive(currentDir: string, projectRoot: string): void {
    const pomPath = join(currentDir, 'pom.xml');
    if (!existsSync(pomPath)) return;
    
    try {
      const pomContent = readFileSync(pomPath, 'utf-8');
      
      // 提取当前 pom 中声明的模块
      const moduleMatches = pomContent.matchAll(/<module>([^<]+)<\/module>/g);
      const declaredModules: string[] = [];
      
      for (const match of moduleMatches) {
        declaredModules.push(match[1]);
      }
      
      if (declaredModules.length === 0) {
        // 这是一个叶子模块（没有子模块），添加到模块列表
        // 但跳过根目录本身（它通常是聚合 pom）
        if (currentDir !== projectRoot) {
          const moduleName = relative(projectRoot, currentDir);
          const moduleType = this.inferModuleType(moduleName);
          const packageName = this.extractJavaPackage(currentDir);
          
          // 检查是否已添加过（避免重复）
          const alreadyExists = this.projectModules.some(m => m.path === moduleName);
          if (!alreadyExists) {
            this.projectModules.push({
              name: moduleName,
              path: moduleName,
              type: moduleType,
              packageName,
              dependencies: [],
            });
          }
        }
      } else {
        // 这是一个聚合模块，递归处理子模块
        for (const subModule of declaredModules) {
          const subModulePath = join(currentDir, subModule);
          if (existsSync(subModulePath)) {
            this.scanMavenModulesRecursive(subModulePath, projectRoot);
          }
        }
      }
    } catch (error) {
      // Silent fail for individual module
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
    // MyBatis-Plus: @TableName("table_name") or @TableName(value = "table_name")
    const mpTableMatch = content.match(/@TableName\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    if (mpTableMatch) {
      return mpTableMatch[1];
    }
    
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
    // MyBatis-Plus: @TableId annotation
    const mpIdMatch = content.match(/@TableId[\s\S]*?(?:private|public|protected)\s+[\w<>\[\]]+\s+(\w+)/);
    if (mpIdMatch) {
      return mpIdMatch[1];
    }
    
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

        // Extract @Column annotation (JPA)
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
        
        // Extract @TableField annotation (MyBatis-Plus)
        // Support multi-line annotations: @TableField(value = "xxx", fill = ...)
        const tableFieldValueMatch = fieldDecl.match(/@TableField[\s\S]*?value\s*=\s*["']([^"']+)["']/);
        const tableFieldSimpleMatch = fieldDecl.match(/@TableField\s*\(\s*["']([^"']+)["']/);
        const tableFieldValue = tableFieldValueMatch?.[1] || tableFieldSimpleMatch?.[1];
        if (tableFieldValue && !enhancedField.columnName) {
          enhancedField.columnName = tableFieldValue;
        }
        
        // Extract @TableId annotation (MyBatis-Plus)
        // Support multi-line annotations
        const tableIdValueMatch = fieldDecl.match(/@TableId[\s\S]*?value\s*=\s*["']([^"']+)["']/);
        const tableIdSimpleMatch = fieldDecl.match(/@TableId\s*\(\s*["']([^"']+)["']/);
        const tableIdValue = tableIdValueMatch?.[1] || tableIdSimpleMatch?.[1];
        if (tableIdValue && !enhancedField.columnName) {
          enhancedField.columnName = tableIdValue;
        }
        
        // Mark non-table fields (MyBatis-Plus exist=false)
        if (/@TableField\s*\([^)]*exist\s*=\s*false/i.test(fieldDecl)) {
          enhancedField.comment = (enhancedField.comment ? enhancedField.comment + '；' : '') + '非表字段';
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
            // Append to existing comment (e.g., "非表字段") instead of overwriting
            enhancedField.comment = enhancedField.comment
              ? `${commentLines[0]}；${enhancedField.comment}`
              : commentLines[0];
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

  /**
   * Scan MyBatis mapper XML file
   */
  private scanMyBatisXml(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check if this is a MyBatis mapper XML
      if (!content.includes('<mapper') || !content.includes('namespace')) {
        return;
      }
      
      // Extract namespace
      const namespaceMatch = content.match(/<mapper\s+namespace\s*=\s*["']([^"']+)["']/);
      if (!namespaceMatch) {
        return;
      }
      
      const namespace = namespaceMatch[1];
      const statements: MyBatisStatement[] = [];
      
      // Extract select/insert/update/delete statements using complete block matching
      // This handles self-closing tags and avoids issues with indexOf
      const statementTypes = ['select', 'insert', 'update', 'delete'];
      for (const type of statementTypes) {
        // Match complete block: <type id="..." ...>...</type> or self-closing <type id="..." .../>
        const blockPattern = new RegExp(`<${type}\\s+id\\s*=\\s*["']([^"']+)["']([^>]*)(?:/>|>[\\s\\S]*?</${type}>)`, 'gi');
        let match;
        
        while ((match = blockPattern.exec(content)) !== null) {
          const id = match[1];
          const attrs = match[2];
          const fullBlock = match[0];
          
          // Extract resultType/parameterType
          const resultTypeMatch = attrs.match(/resultType\s*=\s*["']([^"']+)["']/);
          const parameterTypeMatch = attrs.match(/parameterType\s*=\s*["']([^"']+)["']/);
          
          // Extract table names from the complete SQL block
          const tables = this.extractTablesFromSql(fullBlock);
          
          statements.push({
            id,
            type: type as 'select' | 'insert' | 'update' | 'delete',
            resultType: resultTypeMatch?.[1],
            parameterType: parameterTypeMatch?.[1],
            tables: tables.length > 0 ? tables : undefined,
          });
        }
      }
      
      if (statements.length > 0) {
        this.mybatisMappers.push({
          namespace,
          filePath: relative(this.options.rootDir, filePath),
          statements,
        });
        // Note: Don't link immediately - wait until all files are scanned
        // linkAllMyBatisToMappers() will be called in scan()
      }
    } catch (error) {
      // Silent fail for non-mapper XML files
    }
  }

  /**
   * Extract table names from SQL statement (handles schema, alias, backticks)
   */
  private extractTablesFromSql(sql: string): string[] {
    const tables = new Set<string>();
    
    // Strip XML tags first to avoid false positives from <include>, <where>, etc.
    const plainSql = sql.replace(/<[^>]+>/g, ' ');
    
    // Match FROM/JOIN/INTO/UPDATE/DELETE FROM table patterns
    // Handles: t_user, `t_user`, db.t_user, db.`t_user`, t_user u (alias)
    const patterns = [
      /\bFROM\s+(?:`?([\w_]+)`?\.)?`?([\w_]+)`?(?:\s+(?:AS\s+)?\w+)?/gi,
      /\bJOIN\s+(?:`?([\w_]+)`?\.)?`?([\w_]+)`?(?:\s+(?:AS\s+)?\w+)?/gi,
      /\bINTO\s+(?:`?([\w_]+)`?\.)?`?([\w_]+)`?/gi,
      /\bUPDATE\s+(?:`?([\w_]+)`?\.)?`?([\w_]+)`?/gi,
      /\bDELETE\s+FROM\s+(?:`?([\w_]+)`?\.)?`?([\w_]+)`?/gi,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(plainSql)) !== null) {
        // match[2] is the actual table name (after optional schema)
        const tableName = (match[2] || match[1] || '').toLowerCase();
        // Filter out common SQL keywords that might be false positives
        if (tableName && !['select', 'where', 'set', 'values', 'and', 'or'].includes(tableName)) {
          tables.add(tableName);
        }
      }
    }
    
    return Array.from(tables);
  }

  /**
   * Link all MyBatis XML mappers to corresponding Mapper interfaces
   * Called after all files are scanned to avoid order dependency
   */
  private linkAllMyBatisToMappers(): void {
    for (const mapper of this.mybatisMappers) {
      this.linkMyBatisToMapper(mapper.namespace, mapper.statements);
    }
  }

  /**
   * Correct class types based on annotations (more reliable than file names)
   * Called after all files are scanned
   */
  private correctClassTypesByAnnotations(): void {
    for (const classInfo of this.allClasses) {
      const decorators = classInfo.decorators;
      const extendsClass = classInfo.extends || '';
      const implementsList = classInfo.implements || [];
      
      // Repository: @Mapper, @Repository, or extends *BaseMapper (MyBatis-Plus)
      // Note: interface extends BaseMapper goes to extendsClass, not implementsList
      if (decorators.includes('Mapper') || decorators.includes('Repository') || 
          extendsClass.endsWith('BaseMapper')) {
        classInfo.type = 'repository';
        continue;
      }
      
      // Controller: @RestController, @Controller
      if (decorators.includes('RestController') || decorators.includes('Controller')) {
        classInfo.type = 'controller';
        continue;
      }
      
      // Service: @Service > extends *ServiceImpl > implements IService > *Service naming (lower priority)
      // More strict: avoid false positives like ServiceFactory, ServiceProvider
      if (decorators.includes('Service')) {
        classInfo.type = 'service';
        continue;
      }
      if (extendsClass.endsWith('ServiceImpl')) {
        classInfo.type = 'service';
        continue;
      }
      // IService is MP's core interface
      if (implementsList.some(i => i === 'IService' || i.startsWith('IService'))) {
        classInfo.type = 'service';
        continue;
      }
      // Fallback: class name ends with Service/ServiceImpl (not just implements *Service)
      if (classInfo.name.endsWith('Service') || classInfo.name.endsWith('ServiceImpl')) {
        // But exclude Factory/Provider/Listener patterns
        if (!classInfo.name.includes('Factory') && !classInfo.name.includes('Provider') && 
            !classInfo.name.includes('Listener') && !classInfo.name.includes('Handler')) {
          classInfo.type = 'service';
          continue;
        }
      }
      
      // @Component: Only set to utility if class name suggests utility (Util/Helper)
      // Otherwise keep original type to avoid misclassifying handlers, listeners, etc.
      if (decorators.includes('Component')) {
        const className = classInfo.name;
        if (className.includes('Util') || className.includes('Helper') || className.includes('Utils')) {
          classInfo.type = 'utility';
        }
        // Otherwise keep the original type (don't change)
        continue;
      }
    }
  }

  /**
   * Link MyBatis XML info to corresponding Mapper interface methods
   */
  private linkMyBatisToMapper(namespace: string, statements: MyBatisStatement[]): void {
    // Find the corresponding Mapper class by namespace
    const mapperClass = this.allClasses.find(c => {
      // Namespace is usually the full class name
      const className = namespace.split('.').pop();
      return c.name === className && (c.decorators.includes('Mapper') || c.type === 'repository');
    });
    
    if (!mapperClass) return;
    
    // Enhance method descriptions with MyBatis info
    for (const method of mapperClass.methods) {
      const statement = statements.find(s => s.id === method.name);
      if (statement) {
        const sqlTypeMap = {
          select: 'MyBatis查询',
          insert: 'MyBatis插入',
          update: 'MyBatis更新',
          delete: 'MyBatis删除',
        };
        
        let mybatisInfo = sqlTypeMap[statement.type];
        if (statement.tables?.length) {
          mybatisInfo += `(表: ${statement.tables.join(', ')})`;
        }
        
        // Append to existing businessLogic or set new
        method.businessLogic = method.businessLogic 
          ? `${method.businessLogic}、${mybatisInfo}` 
          : mybatisInfo;
      }
    }
  }
}

/**
 * Scan a project directory and extract implementation details
 */
export async function scanCodebase(options: ScanOptions): Promise<ScanResult> {
  const scanner = new CodeScanner(options);
  return scanner.scan();
}
