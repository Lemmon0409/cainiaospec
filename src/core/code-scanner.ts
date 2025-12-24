import { readdirSync, statSync, lstatSync, realpathSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname, basename, resolve } from 'path';
import { DirectoryMapping } from './templates/project-template.js';
import {
  inferMethodDescription,
  inferClassDescription,
  inferFieldDescription,
  generateMethodBusinessDescription,
  detectOperationPatterns,
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
  // MyBatis-Plus: Entity-Mapper-Service relationship models
  mybatisPlusModels?: MyBatisPlusModel[];
  // MyBatis-Plus: Method-level query documentation
  mybatisPlusQueryDocs?: MethodQueryDoc[];
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
  // ENHANCED: Full SQL content for direct output in documentation
  sql?: string;
}

// Enhanced: MyBatis-Plus key snippet for method analysis
export interface KeySnippet {
  kind: 'validation' | 'exception' | 'stateChange' | 'dbRead' | 'dbWrite' | 'mpCrud' | 'mpQueryWrapper' | 'mpUpdateWrapper' | 'rpc' | 'event' | 'transaction';
  summary: string;
  evidence: string;
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
  // ENHANCED: Raw class header with full generics (for MyBatis-Plus parsing)
  rawHeader?: string;
  // ENHANCED: Declaration kind for accurate type detection
  declarationKind?: 'class' | 'interface' | 'enum' | 'record';
  // ENHANCED: Full class source code for direct output in documentation (Entity/DTO only)
  rawSource?: string;
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
  // ENHANCED: Key snippets for method analysis (optional, non-breaking)
  keySnippets?: KeySnippet[];
  // ENHANCED: Core score and role (optional, non-breaking)
  coreScore?: number;
  // 0-100: how core this method is
  role?: 'core' | 'support';
  // core = route handler/transaction, support = helper
  // ENHANCED: Raw method body for downstream analysis (service classes only)
  rawBody?: string;
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

// ==================== MyBatis-Plus Enhanced Support ====================

/**
 * MyBatis-Plus relationship model: Mapper <-> Entity <-> Table
 * Derived from generic type inference of BaseMapper<T> and ServiceImpl<M, T>
 */
export interface MyBatisPlusModel {
  entity: string;             // Entity class name (e.g., User)
  entityFile?: string;        // Entity file path
  tableName?: string;         // Database table name (e.g., t_user)
  primaryKey?: string;        // Primary key field (e.g., id)
  mapper?: string;            // Mapper interface name (e.g., UserMapper)
  mapperFile?: string;        // Mapper interface file path
  service?: string;           // ServiceImpl class name (e.g., UserServiceImpl)
  serviceFile?: string;       // ServiceImpl file path
  serviceInterface?: string;  // IService interface name (e.g., IUserService)
}

/**
 * Query condition extracted from QueryWrapper/LambdaQueryWrapper chains
 * Only includes WHERE conditions (eq, ne, like, in, etc.)
 */
export interface QueryCondition {
  field: string;              // Field name (e.g., "status" or "User::getStatus" -> "status")
  op: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 
      'like' | 'likeLeft' | 'likeRight' | 'notLike' | 'notLikeLeft' | 'notLikeRight' |
      'in' | 'notIn' | 'between' | 'notBetween' |
      'isNull' | 'isNotNull' | 
      'exists' | 'notExists';  // Only WHERE condition operators
  valueHint?: string;         // Value hint (param name, constant, or expression fragment)
}

/**
 * Query extras: ordering, grouping, set operations (not WHERE conditions)
 */
export interface QueryExtra {
  type: 'orderBy' | 'groupBy' | 'having' | 'set';  // Extra type
  fields: string[];           // Affected fields
  hint?: string;              // Additional info (e.g., ASC/DESC direction)
}

/**
 * Method-level query documentation for MyBatis-Plus
 */
export interface MethodQueryDoc {
  className: string;          // Service class name
  methodName: string;         // Method name
  entity?: string;            // Related entity class
  tableName?: string;         // Related table name
  conditions: QueryCondition[];  // WHERE conditions (eq, like, in, etc.)
  extras?: QueryExtra[];      // ENHANCED: Ordering, grouping, set operations
  crud: ('select' | 'insert' | 'update' | 'delete')[];  // CRUD operations
}

// ==================== End MyBatis-Plus Enhanced Support ====================

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
  // Framework detection: 'spring' for Java Spring Boot, 'all' for Spring+NestJS+Express
  framework?: 'spring' | 'all';
  // ENHANCED: Max file size in bytes (default 1MB), files larger than this use degraded scanning
  maxFileSize?: number;
  // ENHANCED: Max XML file size in bytes (default 500KB), skip larger XML files
  maxXmlSize?: number;
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
  // FIXED: Use nested structure to avoid __alt__ prefix collision risk
  // Structure: { main: RegExp for full path, alt?: RegExp for basename (only for **/ patterns) }
  private includeRegexCache = new Map<string, { main: RegExp; alt?: RegExp }>();
  // MyBatis: Store mapper XML information
  private mybatisMappers: MyBatisMapperInfo[] = [];
  // MyBatis-Plus: Store Entity-Mapper-Service relationship models
  private mybatisPlusModels: MyBatisPlusModel[] = [];
  // MyBatis-Plus: Store method-level query documentation
  private mybatisPlusQueryDocs: MethodQueryDoc[] = [];
  // ENHANCED: File content cache to avoid repeated readFileSync calls
  private fileContentCache = new Map<string, string>();
  // ENHANCED: Visited real paths to prevent symlink cycles
  private visitedRealPaths = new Set<string>();
  // ENHANCED: Normalized root directory for escape detection
  private normalizedRootDir: string = '';

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
      // Framework detection: 'spring' for Java Spring Boot (default), 'all' for multi-framework projects
      framework: options.framework || 'spring',
      // ENHANCED: Max file size defaults
      maxFileSize: options.maxFileSize || 1024 * 1024,  // 1MB default
      maxXmlSize: options.maxXmlSize || 512 * 1024,     // 500KB default
    };
    
    // Pre-compile all exclude patterns
    for (const pattern of this.options.excludePatterns) {
      this.excludeRegexCache.set(pattern, this.globToRegex(pattern));
    }
    
    // FIXED: Pre-compile all include patterns (with alt patterns for simple **/*.ext patterns)
    // Using nested structure to avoid potential key collision
    for (const pattern of this.options.includePatterns) {
      const mainRegex = this.globToRegex(pattern);
      let altRegex: RegExp | undefined;
      
      // FIXED: Only create alt pattern for simple **/*.ext patterns
      // Pattern must: 1) start with **/, 2) remainder must not contain /
      // This ensures we only do basename matching for patterns like **/*.java,
      // not for patterns like **/src/*.java or **/a/b/*.java
      if (pattern.startsWith('**/')) {
        const remainder = pattern.slice(3);
        // Only if remainder has no path separators (e.g., "*.java" not "a/*.java")
        if (!remainder.includes('/')) {
          altRegex = this.globToRegex(remainder);
        }
      }
      
      this.includeRegexCache.set(pattern, { main: mainRegex, alt: altRegex });
    }
  }

  /**
   * Scan the project and return extracted information
   */
  async scan(): Promise<ScanResult> {
    // ENHANCED: Initialize normalized root directory for escape detection
    try {
      this.normalizedRootDir = realpathSync(this.options.rootDir).replace(/\\/g, '/');
    } catch {
      this.normalizedRootDir = this.options.rootDir.replace(/\\/g, '/');
    }
    
    // First pass: analyze project structure (Maven/Gradle modules)
    this.analyzeProjectStructure();
    
    // Second pass: scan all code files (Java + MyBatis XML)
    this.scanDirectory(this.options.rootDir, 0);
    
    // Third pass: post-processing after all files are scanned
    this.correctClassTypesByAnnotations();  // Fix class types based on annotations
    // FIXED: Rebuild entities/controllers/services from allClasses to ensure consistency
    this.rebuildTypedArrays();
    this.linkAllMyBatisToMappers();          // Link MyBatis XML to Mapper interfaces
    
    // MyBatis-Plus pass: build relationship models and extract query conditions
    this.buildMyBatisPlusModels();           // Build Entity-Mapper-Service relationships
    this.extractMyBatisPlusQueryDocs();      // Extract query conditions from method bodies
    
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
      mybatisPlusModels: this.mybatisPlusModels.length > 0 ? this.mybatisPlusModels : undefined,
      mybatisPlusQueryDocs: this.mybatisPlusQueryDocs.length > 0 ? this.mybatisPlusQueryDocs : undefined,
    };
  }

  private scanDirectory(dir: string, depth: number): void {
    if (depth > this.options.maxDepth) return;
    if (!existsSync(dir)) return;
    if (this.shouldExclude(dir, true)) return;  // Pass isDirectory=true

    // FIXED: Use realpath for ALL directories (not just symlinks) to properly detect cycles and escapes
    try {
      let realDir: string;
      try {
        realDir = realpathSync(dir).replace(/\\/g, '/');
      } catch {
        return; // Cannot resolve, skip
      }
      
      // Check for escape: real path is outside rootDir
      if (!realDir.startsWith(this.normalizedRootDir)) {
        return;
      }
      
      // Check for cycle: already visited this real path
      if (this.visitedRealPaths.has(realDir)) {
        return;
      }
      this.visitedRealPaths.add(realDir);
      
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        
        // FIXED: Use lstatSync for each entry to properly detect symlinks
        let lst;
        try {
          lst = lstatSync(fullPath);
        } catch {
          continue; // Cannot stat, skip this entry
        }
        
        if (lst.isSymbolicLink()) {
          // Symlink: resolve and check for cycle/escape before following
          let realEntry: string;
          try {
            realEntry = realpathSync(fullPath).replace(/\\/g, '/');
          } catch {
            continue; // Cannot resolve symlink, skip
          }
          
          // Check escape
          if (!realEntry.startsWith(this.normalizedRootDir)) {
            continue;
          }
          
          // Check cycle
          if (this.visitedRealPaths.has(realEntry)) {
            continue;
          }
          this.visitedRealPaths.add(realEntry);
          
          // Follow the symlink
          try {
            const realStat = statSync(fullPath);
            if (realStat.isDirectory()) {
              this.scanDirectory(fullPath, depth + 1);
            } else if (realStat.isFile()) {
              this.scanFile(fullPath);
            }
          } catch {
            // Cannot stat target, skip
          }
          continue;
        }
        
        // Regular file/directory
        if (lst.isDirectory()) {
          this.scanDirectory(fullPath, depth + 1);
        } else if (lst.isFile()) {
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
    if (this.shouldExclude(filePath, false)) return;  // Pass isDirectory=false

    // ENHANCED: Check file size before reading
    let fileSize: number;
    try {
      fileSize = statSync(filePath).size;
    } catch {
      return; // Cannot stat, skip
    }

    // Handle MyBatis XML files separately
    // ENHANCED: Use content-based detection with path-based heuristic for performance
    if (ext === '.xml') {
      // Check size limit for XML files
      if (fileSize > this.options.maxXmlSize) {
        return; // Too large, skip
      }
      
      // ENHANCED: Quick path-based heuristic to skip obviously non-MyBatis XML
      // This is an accelerator, not a filter - content detection is the final arbiter
      const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
      const isLikelyMybatis = 
        normalizedPath.includes('/mapper') ||
        normalizedPath.includes('/mybatis') ||
        normalizedPath.includes('/resources/') ||
        normalizedPath.includes('/sql/') ||
        basename(filePath).toLowerCase().includes('mapper');
      
      // Skip common non-MyBatis XML patterns
      const isUnlikelyMybatis =
        normalizedPath.includes('/checkstyle') ||
        normalizedPath.includes('/logback') ||
        normalizedPath.includes('/log4j') ||
        normalizedPath.includes('/spring-') ||
        normalizedPath.includes('/liquibase') ||
        normalizedPath.includes('/flyway') ||
        normalizedPath.includes('/k8s') ||
        normalizedPath.includes('/kubernetes') ||
        basename(filePath).toLowerCase() === 'pom.xml';
      
      if (!isLikelyMybatis && isUnlikelyMybatis) {
        return; // Unlikely to be MyBatis, skip
      }
      
      this.scanMyBatisXml(filePath);
      return;
    }

    // FIXED: Check includePatterns for .java files
    if (!this.shouldInclude(filePath)) return;

    // Count file types
    const fileType = this.categorizeFile(filePath);
    this.filesByType.set(fileType, (this.filesByType.get(fileType) || 0) + 1);
    this.fileNames.push(basename(filePath));

    // ENHANCED: Check file size for degraded scanning
    const useDegradedScan = fileSize > this.options.maxFileSize;

    // Scan file content
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // ENHANCED: Cache file content for later use
      // FIXED: Use normalizeAbsPath for consistent cache key
      this.fileContentCache.set(this.normalizeAbsPath(filePath), content);
      
      // Extract imports for pattern detection
      this.extractImports(content);
      
      // Extract all classes with full information
      // ENHANCED: Use degraded scan for large files (skip method body extraction)
      const classInfo = useDegradedScan 
        ? this.extractClassInfoDegraded(filePath, content, fileType)
        : this.extractClassInfo(filePath, content, fileType);
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

  /**
   * ENHANCED: Degraded class extraction for large files
   * FIXED: Preserves rawHeader, declarationKind, dependencies for MP relationship detection
   */
  private extractClassInfoDegraded(filePath: string, content: string, fileType: string): ClassInfo | null {
    // Match class, interface, enum, and record (Java 16+)
    const classMatch = content.match(/(?:public\s+|private\s+|protected\s+|abstract\s+|final\s+)*(?:class|interface|enum|record)\s+(\w+)(?:\s+extends\s+([\w\.,\s<>]+?))?(?:\s+implements\s+([\w\.,\s]+))?(?:\s*\{|\s*\(|$)/m);
    if (!classMatch) return null;

    const className = classMatch[1];
    const extendsRaw = classMatch[2]?.replace(/<[^>]*>/g, '') || '';
    const extendsList = extendsRaw.split(',').map(s => s.trim().split('.').pop()!).filter(Boolean);
    const extendsClass = extendsList[0];
    const implementsRaw = (classMatch[3] || '').replace(/<[^>]*>/g, '');
    const implementsInterfaces = [
      ...implementsRaw.split(',').map(s => s.trim().split('.').pop()!).filter(Boolean),
      ...extendsList.slice(1)
    ];
    
    const decorators = this.extractDecorators(content);
    const type = this.mapFileTypeToClassType(fileType);
    
    // FIXED: Extract rawHeader and declarationKind for MP relationship detection
    const classPosition = content.indexOf(classMatch[0]);
    const rawHeader = this.extractRawClassHeader(content, classPosition, className);
    const declarationKind = content.substring(classPosition, classPosition + 200).match(/(?:class|interface|enum|record)\s+\w+/)?.[0]?.split(/\s+/)[0] as 'class' | 'interface' | 'enum' | 'record' || 'class';
    
    // FIXED: Extract dependencies using simple injection detection (no method body needed)
    const dependencies = this.extractDependencies(content);

    return {
      name: className,
      filePath: relative(this.options.rootDir, filePath),
      type,
      description: `[Large file - degraded scan] ${inferClassDescription(className, type)}`,
      decorators,
      fields: [], // Skip field extraction for large files
      methods: [], // Skip method extraction for large files
      dependencies,
      implements: implementsInterfaces,
      extends: extendsClass,
      rawHeader,
      declarationKind,
    };
  }

  /**
   * Check if a path should be excluded from scanning
   * @param path - The path to check
   * @param isDirectory - Whether the path is a directory (quick check only applies to directories)
   */
  private shouldExclude(path: string, isDirectory: boolean): boolean {
    const relativePath = relative(this.options.rootDir, path);

    // Quick check for common exclude directories (optimization)
    // FIXED: Only apply to directories, not files (avoids excluding files named 'out', 'target', etc.)
    // ENHANCED: Added more build output directories for various build tools
    if (isDirectory) {
      const baseName = basename(path);
      const excludeDirs = [
        // Common
        'node_modules', 'dist', 'build', '.git',
        // Java/Maven/Gradle
        'target', 'bin', 'out', 'classes', 'generated-sources', 'generated-test-sources',
        // IDE
        '.idea', '.vscode', '.settings', '.project', '.classpath',
        // Test/Coverage
        'coverage', 'test-output', 'surefire-reports', 'jacoco',
        // Other build tools
        '.gradle', '.mvn', 'cmake-build-debug', 'cmake-build-release',
      ];
      if (excludeDirs.includes(baseName)) {
        return true;
      }
    }

    // FIXED: Normalize path separators to / before regex matching
    // This ensures patterns work on Windows (where paths use \)
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');
    const normalizedPath = path.replace(/\\/g, '/');

    // Use cached regex patterns
    return this.options.excludePatterns.some(pattern => {
      const regex = this.excludeRegexCache.get(pattern) || this.globToRegex(pattern);
      return regex.test(normalizedRelativePath) || regex.test(normalizedPath);
    });
  }

  /**
   * FIXED: Check if a file matches includePatterns (glob matching)
   * Returns true if file should be included, false otherwise
   * Uses cached regex patterns for performance
   */
  private shouldInclude(path: string): boolean {
    const relativePath = relative(this.options.rootDir, path);
    // Normalize path separators to / for cross-platform compatibility
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');
    const fileName = basename(path);
    
    // If no include patterns, include all (after exclude filtering)
    if (!this.options.includePatterns || this.options.includePatterns.length === 0) {
      return true;
    }
    
    // Check if any include pattern matches (using cached regex)
    return this.options.includePatterns.some(pattern => {
      // Get cached regex object (guaranteed to exist from constructor)
      const regexObj = this.includeRegexCache.get(pattern)!;
      
      // Test against relative path using main regex
      if (regexObj.main.test(normalizedRelativePath)) return true;
      
      // FIXED: For **/xxx patterns, also test with alt pattern against basename
      // This handles files in root directory (e.g., Foo.java matching **/*.java)
      if (regexObj.alt && regexObj.alt.test(fileName)) return true;
      
      return false;
    });
  }

  // FIXED: Simplified globToRegex with path separator normalization
  // Handles both / and \ separators for cross-platform compatibility
  // REMOVED: Unnecessary .+/.* temporary replacements (glob patterns don't contain these)
  private globToRegex(glob: string): RegExp {
    // Normalize path separators to / for regex matching
    let pattern = glob.replace(/\\/g, '/');

    // Escape special regex characters except for glob wildcards (*, ?, **)
    // Must escape . first (before we handle wildcards), then +, (, ), [, ], {, }, |, ^, $
    pattern = pattern
      .replace(/\./g, '\\.')      // Escape dots (must come first)
      .replace(/\+/g, '\\+')      // Escape plus
      .replace(/\(/g, '\\(')      // Escape open paren
      .replace(/\)/g, '\\)')      // Escape close paren
      .replace(/\[/g, '\\[')      // Escape open bracket
      .replace(/\]/g, '\\]')      // Escape close bracket
      .replace(/\{/g, '\\{')      // Escape open brace
      .replace(/\}/g, '\\}')      // Escape close brace
      .replace(/\|/g, '\\|')      // Escape pipe
      .replace(/\^/g, '\\^')      // Escape caret
      .replace(/\$/g, '\\$');     // Escape dollar

    // Handle ** first (must be before *)
    pattern = pattern.replace(/\*\*/g, '___DOUBLE_STAR___');
    // Handle * (match any segment except /)
    pattern = pattern.replace(/\*/g, '[^/]*');
    // Handle ** (match any including /)
    pattern = pattern.replace(/___DOUBLE_STAR___/g, '.*');
    // Handle ? (match any single char)
    pattern = pattern.replace(/\?/g, '.');

    return new RegExp(`^${pattern}$`);
  }

  private categorizeFile(filePath: string): string {
    const name = basename(filePath);
    
    // Java file patterns (prioritize by common naming conventions)
    if (name.endsWith('Controller.java')) return 'controller';
    // ENHANCED: Support more service implementation patterns (*ApiImpl, *ManagerImpl, *FacadeImpl, etc.)
    if (name.endsWith('Service.java') || name.endsWith('ServiceImpl.java') || 
        name.endsWith('ApiImpl.java') || name.endsWith('ManagerImpl.java') ||
        name.endsWith('FacadeImpl.java') || name.endsWith('Manager.java')) return 'service';
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
    // Java: Match class, interface, enum, or record with optional modifiers
    const classMatch = content.match(/\b(?:public|protected|private|abstract|final|\s)*\b(?:class|interface|enum|record)\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  /**
   * FIXED: Extract class-level decorators by finding the annotation block immediately before class declaration
   * Uses line-based approach with correct parenthesis tracking for backwards scanning
   */
  private extractDecorators(content: string): string[] {
    // Step 1: Find the class/interface/enum/record declaration position
    const classKeywordMatch = content.match(/\b(public\s+|private\s+|protected\s+|abstract\s+|final\s+)*(class|interface|enum|record)\s+\w+/);
    if (!classKeywordMatch) {
      return [];
    }

    const classPosition = classKeywordMatch.index!;
    
    // Step 2: Get lines before the class declaration and iterate backwards
    const linesBeforeClass = content.substring(0, classPosition).split('\n');
    const annotationLines: string[] = [];

    // FIXED: Track unclosed right parens when scanning backwards
    // When scanning backwards:
    // - ')' means we're entering the inside of an annotation (unclosedRightParens++)
    // - '(' means we're exiting/closing one level (unclosedRightParens--)
    // If unclosedRightParens > 0, we're still inside a multi-line annotation
    let unclosedRightParens = 0;
    let consecutiveEmptyLines = 0;
    const maxEmptyLines = 2;

    // Iterate backwards to collect annotation block
    for (let i = linesBeforeClass.length - 1; i >= 0; i--) {
      const line = linesBeforeClass[i];
      const trimmed = line.trim();

      // Handle empty lines
      if (trimmed === '') {
        // If we're inside an unclosed parenthesis, include the empty line
        if (unclosedRightParens > 0) {
          annotationLines.unshift(line);
          continue;
        }
        consecutiveEmptyLines++;
        if (consecutiveEmptyLines > maxEmptyLines) {
          break;
        }
        continue;
      }
      
      // Non-empty line found, reset counter
      consecutiveEmptyLines = 0;

      // Stop at comment end (JavaDoc end) - skip JavaDoc but keep looking for annotations
      if (trimmed === '*/') {
        while (i > 0 && !linesBeforeClass[i].trim().startsWith('/**')) {
          i--;
        }
        continue;
      }

      // FIXED: Count parentheses correctly for backwards scanning
      // ENHANCED: Skip parentheses inside strings to avoid miscounting
      // e.g., @RequestMapping(path = "/a(b)") should not affect paren depth
      // FIXED: Scan from RIGHT to LEFT (matching the backward line iteration)
      let lineUnclosedChange = 0;
      let inStr = false;
      let inChr = false;
      for (let j = trimmed.length - 1; j >= 0; j--) {
        const c = trimmed[j];
        const prevC = j > 0 ? trimmed[j - 1] : '';
        
        // Handle escape (look backwards: if prev char is \, skip this char)
        if (prevC === '\\' && (inStr || inChr)) {
          continue;
        }
        
        // Toggle string/char state (scanning backwards, so order is reversed)
        if (c === '"' && !inChr) {
          inStr = !inStr;
          continue;
        }
        if (c === "'" && !inStr) {
          inChr = !inChr;
          continue;
        }
        
        // Only count parens outside strings/chars
        // When scanning backwards: ) opens a level, ( closes a level
        if (!inStr && !inChr) {
          if (c === ')') {
            lineUnclosedChange++;
          } else if (c === '(') {
            lineUnclosedChange--;
          }
        }
      }
      
      // Check if line starts with @
      if (trimmed.startsWith('@')) {
        annotationLines.unshift(line);
        unclosedRightParens += lineUnclosedChange;
        // Clamp to >= 0 to avoid negative depth
        if (unclosedRightParens < 0) unclosedRightParens = 0;
        continue;
      }
      
      // FIXED: Continuation is only valid when we have unclosed right parens
      // This means we're still inside a multi-line annotation like:
      // @TableName(
      //   value = "t_user",  <- this line will be included because unclosedRightParens > 0
      //   schema = "s"
      // )
      if (unclosedRightParens > 0) {
        annotationLines.unshift(line);
        unclosedRightParens += lineUnclosedChange;
        if (unclosedRightParens < 0) unclosedRightParens = 0;
        continue;
      }
      
      // Line doesn't start with @ and we're not inside an annotation - stop
      break;
    }

    // Step 3: Extract annotation names from the collected block
    const annotationBlock = annotationLines.join('\n');
    const decoratorMatches = annotationBlock.matchAll(/@(\w+)/g);
    
    // Return unique annotation names
    const decorators = Array.from(new Set(Array.from(decoratorMatches, match => match[1])));
    return decorators;
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

  /**
   * OPTIMIZED: Extract routes using two-stage approach for better performance
   * Stage 1: Quick scan to find lines containing @...Mapping
   * Stage 2: Extract method signature following the annotation
   */
  private extractRoutes(content: string): RouteInfo[] {
    const routes: RouteInfo[] = [];

    // Framework-specific route parsing
    // Java Spring Boot: only parse Spring-style routes (default)
    // Multi-framework projects (framework='all'): also parse NestJS/Express routes
    const isAllFrameworks = this.options.framework === 'all';

    // NestJS style: @Get(), @Post(), etc. - only when framework='all'
    if (isAllFrameworks) {
      const nestjsRoutes = content.matchAll(/@(Get|Post|Put|Delete|Patch)\s*\(\s*(?:['"]([^'"]*)['"\s]*)?\)\s*(?:async\s+)?(\w+)/g);
      for (const match of nestjsRoutes) {
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2] || '',
          handler: match[3],
        });
      }

      // Express style: router.get(), router.post(), etc. - only when framework='all'
      const expressRoutes = content.matchAll(/router\.(get|post|put|delete|patch)\(['"]([^'"]*)['"]/g);
      for (const match of expressRoutes) {
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          handler: 'anonymous',
        });
      }
    }

    // OPTIMIZED: Spring style - two-stage approach
    // Stage 1: Find all @...Mapping occurrences quickly
    const mappingPattern = /@(Get|Post|Put|Delete|Patch|Request)Mapping/g;
    let mappingMatch;
    
    while ((mappingMatch = mappingPattern.exec(content)) !== null) {
      const mappingStart = mappingMatch.index;
      
      // Stage 2: Extract annotation block backwards and method signature forwards
      // FIXED: Use windowStart as reference point to avoid overshoot
      // FIXED: Increased backward window to 2000 to handle long annotations (Swagger/OpenAPI)
      // Calculate within the local window, then convert to global position
      const windowStart = Math.max(0, mappingStart - 2000);
      const windowContent = content.substring(windowStart, mappingStart);
      const linesBefore = windowContent.split('\n');
      
      // Find where annotations start (going backwards within window)
      // FIXED: Use 'started' flag to distinguish annotation lines from code lines
      // - Before started: only allow lines starting with @
      // - After started: allow continuation lines (ending with ) , " ' { } = or containing these)
      let localOffset = windowContent.length; // Start at end of window (= mappingStart position)
      let started = false;
      for (let i = linesBefore.length - 1; i >= 0; i--) {
        const trimmed = linesBefore[i].trim();
        
        // Empty line stops backtracking
        if (trimmed === '') break;
        
        // Line starts with @ -> definitely an annotation
        if (trimmed.startsWith('@')) {
          started = true;
          localOffset -= linesBefore[i].length + 1;
          continue;
        }
        
        // If not started yet and doesn't start with @, stop
        if (!started) break;
        
        // After started: allow annotation continuation lines
        // Must look like annotation content (ends with ) , " ' { } = or contains these)
        // But reject lines that look like code (starts with modifiers like private/public/final)
        const looksLikeCode = /^(public|private|protected|final|static|abstract|synchronized|native|strictfp|transient|volatile)\b/.test(trimmed);
        const looksLikeContinuation = /[),"'{}=]/.test(trimmed) && !looksLikeCode;
        
        if (looksLikeContinuation) {
          localOffset -= linesBefore[i].length + 1;
          continue;
        }
        
        // Not a continuation line, stop
        break;
      }
      // Clamp to window bounds and convert to global position
      localOffset = Math.max(0, localOffset);
      const annotationBlockStart = windowStart + localOffset;
      
      // Find the method signature after the annotation (extended search window)
      // FIXED: Increased from 500 to 2000 to handle long annotations (Swagger/OpenAPI, complex produces/consumes)
      const afterAnnotation = content.substring(mappingStart, mappingStart + 2000);
      
      // Pattern: find method name after annotation block
      // ENHANCED: Support more modifiers: final, static, default (interface), synchronized
      // FIXED: Use RegExp.exec() instead of String.match() for stable .index type
      const methodSigRegex = /(?:Mapping[^)]*\)|Mapping)\s*(?:\/\/[^\n]*\n|\s)*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:default\s+)?(?:synchronized\s+)?[\w<>\[\]\.]+\s+(\w+)\s*\(/;
      const methodSigMatch = methodSigRegex.exec(afterAnnotation);
      
      if (methodSigMatch) {
        const methodName = methodSigMatch[1];
        
        // Extract the full annotation block for parsing
        // methodSigMatch.index is guaranteed to exist with exec()
        const annotationBlockEnd = mappingStart + methodSigMatch.index + methodSigMatch[0].length;
        const annotationBlock = content.substring(annotationBlockStart, annotationBlockEnd);
        
        const routeInfo = this.parseSpringMappingAnnotation(annotationBlock, methodName);
        if (routeInfo) {
          // Deduplicate
          const alreadyMatched = routes.some(r =>
            r.method === routeInfo.method && r.path === routeInfo.path && r.handler === routeInfo.handler
          );
          if (!alreadyMatched) {
            routes.push(routeInfo);
          }
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

  // FIXED: Simplified extractJsDoc using character-level backwards scanning
  // JavaDoc belongs to target only if JavaDoc is directly adjacent (only whitespace between)
  // to either the annotation block or the target itself
  private extractJsDoc(content: string, position: number): string | undefined {
    // Step 1: Find annotation block start by scanning backwards from position
    const annotationBlockStart = this.findPrecedingAnnotationBlockStart(content, position);
    
    // Step 2: Look for /** ... */ immediately before the annotation block (or target)
    const searchEnd = annotationBlockStart;
    const preContent = content.substring(0, searchEnd);
    
    // Find the last */ before annotation block
    const lastJsDocEnd = preContent.lastIndexOf('*/');
    if (lastJsDocEnd === -1) {
      return undefined;
    }
    
    // Find the corresponding /** (must be before */)
    const lastJsDocStart = preContent.lastIndexOf('/**');
    if (lastJsDocStart === -1 || lastJsDocStart > lastJsDocEnd) {
      return undefined;
    }
    
    // Step 3: Check adjacency - only whitespace allowed between */ and annotation block
    const betweenContent = content.substring(lastJsDocEnd + 2, searchEnd);
    if (/\S/.test(betweenContent)) {
      return undefined; // Non-whitespace content between, not adjacent
    }
    
    // Step 4: Extract and parse the JavaDoc content
    const jsDoc = content.substring(lastJsDocStart, lastJsDocEnd + 2);
    return this.parseJsDocDescription(jsDoc);
  }
  
  /**
   * FIXED: Find where the annotation block starts before a given position
   * Scans backwards from position, skipping annotations and their continuations
   */
  private findPrecedingAnnotationBlockStart(content: string, position: number): number {
    let pos = position;
    
    // Skip trailing whitespace
    while (pos > 0 && /\s/.test(content[pos - 1])) {
      pos--;
    }
    
    // Now scan backwards through annotation blocks
    // An annotation starts with @ and may span multiple lines with ( ... )
    while (pos > 0) {
      // Skip whitespace/newlines between annotations
      const beforeSkip = pos;
      while (pos > 0 && /\s/.test(content[pos - 1])) {
        pos--;
      }
      
      if (pos === 0) break;
      
      // Check if we're at the end of an annotation (closing paren or annotation name)
      // We need to look for patterns like:
      //   @Annotation
      //   @Annotation(params)
      //   @Annotation(\n  params\n)
      
      // If previous char is ')' - this is end of annotation with params
      if (content[pos - 1] === ')') {
        // Find matching '(' using depth counting
        let depth = 1;
        let parenPos = pos - 2;
        while (parenPos >= 0 && depth > 0) {
          const c = content[parenPos];
          if (c === ')') depth++;
          else if (c === '(') depth--;
          parenPos--;
        }
        
        if (depth !== 0) {
          // Unbalanced, stop
          return beforeSkip;
        }
        
        // parenPos is now before '(', look for @AnnotationName
        pos = parenPos + 1; // Position after '('
        
        // Skip any whitespace before '('
        while (pos > 0 && /\s/.test(content[pos - 1])) {
          pos--;
        }
      }
      
      // Now we should be at the end of the annotation name, find @
      // Scan backwards for @ followed by word characters
      let nameEnd = pos;
      while (pos > 0 && /[\w$]/.test(content[pos - 1])) {
        pos--;
      }
      
      // Check for @ before the name
      if (pos > 0 && content[pos - 1] === '@') {
        pos--; // Include @
        // This is an annotation, continue scanning for more
        continue;
      }
      
      // Not at an annotation, restore position and stop
      return beforeSkip;
    }
    
    return pos;
  }
  
  /**
   * Parse JavaDoc description from comment text
   * Extracts text before any @tags
   */
  private parseJsDocDescription(jsDoc: string): string | undefined {
    const lines = jsDoc.split(/\r?\n/);
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      // Remove /** , * , */
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
    
    // Join and clean up
    const description = descriptionLines.join(' ').trim();
    
    // Reject if too long (probably not a real description)
    if (description.length > 200) {
      return undefined;
    }
    
    return description.length > 0 ? description : undefined;
  }

  // Enhanced: Extract full class information with auto-inferred descriptions
  // FIXED: Added record support for Java 16+ records
  private extractClassInfo(filePath: string, content: string, fileType: string): ClassInfo | null {
    // Match class, interface, enum, and record (Java 16+), with optional modifiers (public, abstract, etc.)
    // Support full qualified names and comma-separated extends (interface A extends B, C)
    const classMatch = content.match(/(?:public\s+|private\s+|protected\s+|abstract\s+|final\s+)*(?:class|interface|enum|record)\s+(\w+)(?:\s+extends\s+([\w\.,\s<>]+?))?(?:\s+implements\s+([\w\.,\s]+))?(?:\s*\{|\s*\(|$)/m);
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

    // ENHANCED: Extract raw class header (with annotations and generics)
    // Find the class declaration line(s) including preceding annotations
    const rawHeader = this.extractRawClassHeader(content, classPosition, className);
    // ENHANCED: Detect declaration kind (class/interface/enum/record)
    const declarationKind = content.substring(classPosition, classPosition + 200).match(/(?:class|interface|enum|record)\s+\w+/)?.[0]?.split(/\s+/)[0] as 'class' | 'interface' | 'enum' | 'record' || 'class';

    // ENHANCED: Extract rawSource for Entity/DTO types (for direct documentation output)
    // Only extract for model classes to avoid memory bloat
    let rawSource: string | undefined;
    if (type === 'entity' || type === 'dto') {
      rawSource = this.extractRawClassSource(content, classPosition);
    }

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
      // ENHANCED: Add raw header and declaration kind
      rawHeader,
      declarationKind,
      rawSource,  // ENHANCED: Full class source for Entity/DTO
    };
  }

  // ENHANCED: Extract complete class source code (for Entity/DTO documentation)
  private extractRawClassSource(content: string, classPosition: number): string {
    // Find start: scan backwards for annotations/javadoc
    let start = classPosition;
    
    // Skip whitespace before class declaration
    while (start > 0 && /\s/.test(content[start - 1])) {
      start--;
    }
    
    // Scan backwards to include annotations and javadoc
    let hasMore = true;
    while (start > 0 && hasMore) {
      let lineStart = start - 1;
      // Skip newlines
      while (lineStart > 0 && (content[lineStart] === '\n' || content[lineStart] === '\r')) {
        lineStart--;
      }
      // Find line start
      while (lineStart > 0 && content[lineStart - 1] !== '\n' && content[lineStart - 1] !== '\r') {
        lineStart--;
      }
      
      const line = content.substring(lineStart, start).trim();
      // Include if annotation, javadoc, or empty
      if (line.startsWith('@') || line.startsWith('*') || line.startsWith('/**') || 
          line.startsWith('//') || line === '*/' || line === '') {
        start = lineStart;
      } else {
        hasMore = false;
      }
    }
    
    // Find end: match braces to find closing }
    let end = content.indexOf('{', classPosition);
    if (end === -1) return content.substring(start).trim();
    
    let braceDepth = 1;
    end++;
    const maxLength = Math.min(content.length, start + 50000);  // Limit to 50KB per class
    
    while (end < maxLength && braceDepth > 0) {
      const char = content[end];
      if (char === '{') braceDepth++;
      else if (char === '}') braceDepth--;
      end++;
    }
    
    return content.substring(start, end).trim();
  }

  // ENHANCED: Extract raw class header with annotations and generics
  // Used for MyBatis-Plus @TableName parsing and generic type extraction
  private extractRawClassHeader(content: string, classPosition: number, className: string): string {
    // Scan backwards from classPosition to capture all preceding annotations
    let start = classPosition;
    let hasAnnotations = true;

    // Skip any whitespace before class declaration
    while (start > 0 && /\s/.test(content[start - 1])) {
      start--;
    }

    // Capture all annotations (lines starting with @)
    while (start > 0 && hasAnnotations) {
      let lineStart = start - 1;
      // Skip newline
      while (lineStart > 0 && (content[lineStart] === '\n' || content[lineStart] === '\r')) {
        lineStart--;
      }
      // Find line start
      while (lineStart > 0 && content[lineStart - 1] !== '\n' && content[lineStart - 1] !== '\r') {
        lineStart--;
      }

      const line = content.substring(lineStart, start);
      // Check if line starts with @ (annotation)
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('@')) {
        start = lineStart;
        // Skip more whitespace
        while (start > 0 && /\s/.test(content[start - 1])) {
          start--;
        }
      } else {
        hasAnnotations = false;
      }
    }

    // Find end of class declaration (up to { or end of generics)
    // FIXED: Don't break at newline - support multi-line extends/implements
    let end = classPosition;
    let braceDepth = 0;
    let inGeneric = false;
    const maxScanLength = 5000; // Prevent runaway scanning on malformed files

    while (end < content.length && end < start + maxScanLength) {
      const char = content[end];
      if (char === '<') {
        inGeneric = true;
        braceDepth++;
      } else if (char === '>') {
        braceDepth--;
        if (braceDepth === 0) inGeneric = false;
      } else if (char === '{' && !inGeneric) {
        end++;
        break;
      }
      end++;
    }

    return content.substring(start, end).trim();
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
  // FIXED: Removed TypeScript patterns - this is a Java-only scanner
  // FIXED: Use offset from extractFieldsSection for accurate JSDoc positioning
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
    
    // Extract class body statements with offset information
    const statementsWithOffset = this.extractFieldsSection(content);

    // Java field pattern: [annotations] [modifiers] Type fieldName [= value];
    // IMPORTANT: Only match fields that appear before any method definitions
    const javaFieldPattern = /((?:@\w+(?:\([^)]*\))?\s*)*)\s*(private|public|protected)?\s+(static|final)?\s*(static|final)?\s*([\w<>\[\]]+)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    
    for (const { statement, offset } of statementsWithOffset) {
      javaFieldPattern.lastIndex = 0; // Reset regex
      const javaMatch = javaFieldPattern.exec(statement);
      if (!javaMatch) continue;
      
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

      // FIXED: Use offset from extractFieldsSection for accurate JSDoc positioning
      // offset is the absolute position of the statement in the original content
      const fieldPosition = offset + (javaMatch.index || 0);
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
   * FIXED: Extract top-level class members (fields) using brace depth parsing
   * Collects all statements at depth=0 (class body level) that look like field declarations
   * FIXED: Handle field initializers with anonymous classes/lambdas (nested {} blocks)
   * FIXED: Return statements with offset for accurate JSDoc positioning
   * FIXED: Removed 30k limit, use statement count limit instead
   */
  private extractFieldsSection(content: string): Array<{ statement: string; offset: number }> {
    // Find class/interface/enum/record body start
    const classMatch = content.match(/(?:class|interface|enum|record)\s+\w+[^{]*\{/);
    if (!classMatch) {
      return [{ statement: content.substring(0, 10000), offset: 0 }];
    }
    
    const classStart = classMatch.index! + classMatch[0].length;
    const afterClass = content.substring(classStart);
    
    // Parse using brace depth to extract only top-level statements
    // depth=0 means we're at class body level (inside the class {}, but not inside any nested block)
    // FIXED: We now track depth but always accumulate statement content
    // A statement ends when depth=0 and we see ';'
    let depth = 0;
    let pos = 0;
    let inString = false;
    let inTextBlock = false; // FIXED: Java 15+ text block ("""...""") support
    let inChar = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escapeNext = false;
    
    const topLevelStatements: Array<{ statement: string; offset: number }> = [];
    let statementStart = 0;
    
    // FIXED: Increased statement limit to 5000 for large generated classes
    const maxStatements = 5000; // Large limit for auto-generated entities/constants
    const maxLength = afterClass.length; // No character limit
    
    while (pos < maxLength && topLevelStatements.length < maxStatements) {
      const char = afterClass[pos];
      const nextChar = pos + 1 < maxLength ? afterClass[pos + 1] : '';
      const next2Char = pos + 2 < maxLength ? afterClass[pos + 2] : '';
      
      // Handle escape sequences - FIXED: Only for regular strings/chars, NOT text blocks
      // Text blocks have different escape semantics and don't need this
      if (escapeNext) {
        escapeNext = false;
        pos++;
        continue;
      }
      
      if (char === '\\' && (inString || inChar)) {
        escapeNext = true;
        pos++;
        continue;
      }
      
      // Handle comments
      if (inLineComment) {
        if (char === '\n') {
          inLineComment = false;
        }
        pos++;
        continue;
      }
      
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          pos += 2;
        } else {
          pos++;
        }
        continue;
      }
      
      // FIXED: Handle Java text block ("""...""") - must check before regular string
      if (inTextBlock) {
        if (char === '"' && nextChar === '"' && next2Char === '"') {
          inTextBlock = false;
          pos += 3;
        } else {
          pos++;
        }
        continue;
      }
      
      // Start of comments (only when not in string/char)
      if (!inString && !inChar) {
        if (char === '/' && nextChar === '/') {
          inLineComment = true;
          pos += 2;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          pos += 2;
          continue;
        }
      }
      
      // FIXED: Check for text block start before regular string
      if (!inString && !inChar && char === '"' && nextChar === '"' && next2Char === '"') {
        inTextBlock = true;
        pos += 3;
        continue;
      }
      
      // Track strings and chars (only if not in text block)
      if (char === '"' && !inChar) {
        inString = !inString;
      } else if (char === "'" && !inString) {
        inChar = !inChar;
      }
      
      // Count braces outside of strings, chars, and comments
      if (!inString && !inChar) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth < 0) {
            // End of class body
            break;
          }
        }
        
        // FIXED: Collect statement when at depth=0 and see ';'
        // This correctly handles field initializers with anonymous classes:
        // private Runnable r = new Runnable() { public void run() {} };
        // The entire statement from 'private' to ';' is captured
        if (depth === 0 && char === ';') {
          const currentStatement = afterClass.substring(statementStart, pos + 1);
          const trimmed = currentStatement.trim();
          
          // Skip empty statements
          if (trimmed !== ';') {
            // Skip if it looks like a method declaration:
            // Pattern: visibility/modifiers + type + name + (...) + ; or throws
            // Key: ) followed by optional whitespace/throws, then ; at end
            // But NOT if there's a { } pair in the middle (that's a field with initializer)
            const hasNestedBlock = currentStatement.includes('{');
            const looksLikeMethod = !hasNestedBlock && 
                                    /\)\s*(?:throws\s+[\w,\s]+)?;\s*$/.test(trimmed) &&
                                    /\b\w+\s*\(/.test(trimmed) &&
                                    (trimmed.indexOf('=') === -1 || trimmed.indexOf('=') > trimmed.indexOf('('));
            
            // Skip static blocks
            const isStaticBlock = /^\s*static\s*\{/.test(trimmed);
            
            if (!looksLikeMethod && !isStaticBlock) {
              topLevelStatements.push({
                statement: currentStatement,
                offset: classStart + statementStart
              });
            }
          }
          statementStart = pos + 1;
        }
      }
      
      pos++;
    }
    
    // Return all top-level field-like statements with offsets
    return topLevelStatements;
  }

  // Enhanced: Extract class methods with full information
  // FIXED: Use correct position calculation via classBodyMatch.index + match.index
  // FIXED: Two-stage approach for parameter extraction to handle nested parentheses
  // FIXED: Skip constructors (where methodName equals className)
  // 
  // KNOWN LIMITATIONS (not bugs, but may cause incomplete results):
  // - Constructors: Detected by matching methodName === className, but may miss some edge cases
  // - Record compact constructors: public R { ... } (no parentheses) may be missed
  // - @Override methods with return type on separate line: May not match correctly
  // - Complex multi-line generic signatures: May fail to parse
  // - These are acceptable trade-offs for a regex-based parser vs full AST parsing
  private extractClassMethods(content: string, classType: ClassInfo['type'] = 'other'): ClassMethodInfo[] {
    const methods: ClassMethodInfo[] = [];
    const seen = new Set<string>(); // Track seen methods to avoid duplicates
    
    // Check if this is an entity/dto class (getter/setter should be simplified)
    const isDataClass = classType === 'entity' || classType === 'dto';
    
    // FIXED: Extract className to detect constructors
    const classNameMatch = content.match(/(?:class|interface|enum|record)\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : null;
    
    // CRITICAL: Extract only class-level methods from the field section to first real method
    // This prevents matching code inside method bodies
    // Support both class, interface, enum and record bodies
    const classBodyMatch = content.match(/(?:class|interface|enum|record)\s+\w+[^{]*\{([\s\S]*)/m);
    if (!classBodyMatch) return methods;
    
    const classBody = classBodyMatch[1];
    // FIXED: Calculate the correct offset of classBody in the original content
    // classBodyMatch.index is where the match starts, classBodyMatch[0].length - classBody.length = offset to classBody
    const classBodyStartInContent = classBodyMatch.index! + classBodyMatch[0].length - classBody.length;
    
    // FIXED: Two-stage approach for method extraction
    // Stage 1: Find potential method starts with simplified pattern
    // Pattern matches: [annotations] [modifiers] ReturnType methodName(
    // We'll then parse parentheses manually for stage 2
    const methodStartPattern = /^[ \t]*((?:@\w+(?:\([^)]*\))?\s*)*)(public|private|protected)?\s*(static\s+)?(?:default\s+)?(?:final\s+)?(?:abstract\s+)?(?:synchronized\s+)?(?:<[\w,\s]+>\s+)?([\w<>\[\]\.]+)\s+(\w+)\s*\(/gm;
    
    let match;
    while ((match = methodStartPattern.exec(classBody)) !== null) {
      const matchStart = match.index!;
      const decoratorsStr = match[1] || '';
      const visibility = (match[2] as 'public' | 'private' | 'protected') || 'public';
      const isStatic = !!match[3];
      const returnType = match[4]?.trim();
      const methodName = match[5];
      
      // Stage 2: Extract parameters using parentheses depth parsing
      const parenStart = matchStart + match[0].length - 1; // Position of (
      const paramsResult = this.extractBalancedParenContent(classBody, parenStart);
      if (!paramsResult.success) continue;
      
      const paramsStr = paramsResult.content;
      const parenEnd = paramsResult.endPos;
      
      // FIXED: Find the first significant char after ) to determine if method or interface
      // Scan from parenEnd+1, skip whitespace and throws clause, find { or ;
      const afterParenResult = this.findMethodEndMarker(classBody, parenEnd + 1);
      if (!afterParenResult.found) continue;
      
      const isInterfaceMethod = afterParenResult.marker === ';';
      const methodEndMarkerPos = afterParenResult.position; // Position of { or ; in classBody

      // FIXED: Skip constructors (methodName equals className, and returnType also equals className)
      // In Java, constructors have no return type, but regex captures the className as returnType
      // NOTE: Record compact/canonical constructors may not be reliably detected:
      // - Compact constructor: public MyRecord { ... } - no parentheses, may be missed entirely
      // - Canonical constructor: public MyRecord(String a, int b) - detected but rare
      // Impact is limited since records typically contain few business methods.
      if (className && methodName === className && returnType === className) {
        continue; // This is a constructor, skip it
      }

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

      // FIXED: Calculate the correct method position using classBody offset + match.index
      // match.index is relative to classBody, so we add the offset to get position in original content
      const methodPosition = classBodyStartInContent + match.index!;
      
      // Extract description from JSDoc (look back from method position)
      const jsDocDescription = this.extractJsDoc(content, methodPosition);

      // Extract method body for business logic detection and mapper calls (only for concrete methods)
      let methodBody = '';
      let businessLogic: string | undefined;
      // ENHANCED: Key snippets and core scoring
      let keySnippets: KeySnippet[] = [];
      let dedupedSnippets: KeySnippet[] = [];
      let coreScore = 0;
      let role: 'core' | 'support' = 'support';

      if (!isInterfaceMethod) {
        // FIXED: Use parenEnd to calculate the correct { position
        // methodEndMarkerPos is the position of { in classBody
        // Convert to absolute position in content: classBodyStartInContent + methodEndMarkerPos
        const openBracePos = classBodyStartInContent + methodEndMarkerPos;
        methodBody = this.extractMethodBody(content, openBracePos);
        businessLogic = methodBody ? detectOperationPatterns(methodBody).join('、') : undefined;

        // Enhanced: Extract mapper/repository calls from method body
        if (methodBody && classType === 'service') {
          // Extract dependencies from current content for mapper call detection
          const currentDependencies = this.extractDependencies(content);
          const mapperCalls = this.extractMapperCalls(methodBody, currentDependencies);
          if (mapperCalls.length > 0 && businessLogic) {
            businessLogic = `${businessLogic}、调用Mapper: ${mapperCalls.join(', ')}`;
          } else if (mapperCalls.length > 0) {
            businessLogic = `调用Mapper: ${mapperCalls.join(', ')}`;
          }
        }

        // ENHANCED: Extract key snippets for method analysis
        keySnippets = methodBody ? this.extractKeySnippets(methodBody, classType === 'service') : [];

        // FIXED: Add transaction snippet from @Transactional decorator
        if (decorators.includes('Transactional')) {
          keySnippets.push({
            kind: 'transaction',
            summary: '事务管理',
            evidence: '@Transactional'
          });
        }

        // FIXED: Add validation snippets from parameter annotations
        // Check for @Valid, @Validated, @NotNull, @NotBlank, @NotEmpty on parameters
        // FIXED: Prioritize @Valid/@Validated in evidence, then null checks
        const highPriorityValidations: string[] = [];  // @Valid, @Validated
        const lowPriorityValidations: string[] = [];   // @NotNull, @NotBlank, etc.

        for (const param of parameters) {
          if (param.decorators) {
            for (const deco of param.decorators) {
              const annotationStr = `@${deco} ${param.name}`;
              if (['Valid', 'Validated'].includes(deco)) {
                highPriorityValidations.push(annotationStr);
              } else if (['NotNull', 'NotBlank', 'NotEmpty', 'Size', 'Min', 'Max', 'Pattern', 'Email'].includes(deco)) {
                lowPriorityValidations.push(annotationStr);
              }
            }
          }
        }

        if (highPriorityValidations.length > 0 || lowPriorityValidations.length > 0) {
          // Combine: high priority first, then low priority (with + separator)
          const combined = [
            ...highPriorityValidations.slice(0, 2),  // Max 2 high priority
            ...lowPriorityValidations.slice(0, 2)    // Max 2 low priority
          ];
          keySnippets.push({
            kind: 'validation',
            summary: '参数校验',
            evidence: combined.join(' + ')
          });
        }

        // FIXED: Deduplicate keySnippets by kind (merge evidence to avoid duplicate scoring)
        dedupedSnippets = this.dedupeKeySnippets(keySnippets);

        // ENHANCED: Calculate core score and role
        if (decorators.includes('Transactional') || decorators.includes('GetMapping') ||
            decorators.includes('PostMapping') || decorators.includes('RequestMapping')) {
          coreScore += 40;
        }
        if (dedupedSnippets.some(s => s.kind === 'mpCrud' || s.kind === 'dbWrite')) {
          coreScore += 30;
        }
        if (dedupedSnippets.some(s => s.kind === 'validation' || s.kind === 'exception')) {
          coreScore += 15;
        }

        role = coreScore >= 40 ? 'core' : 'support';
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
        // ENHANCED: Add optional fields
        keySnippets: dedupedSnippets.length > 0 ? dedupedSnippets : undefined,
        coreScore: coreScore > 0 ? coreScore : undefined,
        role: coreScore > 0 ? role : undefined,
        // ENHANCED: Cache raw body for service and controller classes for documentation output
        rawBody: (classType === 'service' || classType === 'controller') && methodBody ? methodBody : undefined,
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

  /**
   * FIXED: Extract content inside balanced parentheses, handling nested parens, strings, and comments
   * ENHANCED: Added Java text block ("""...""") support
   * Returns the content between ( and ), not including the outer parens
   */
  private extractBalancedParenContent(content: string, startPos: number): { success: boolean; content: string; endPos: number } {
    if (startPos >= content.length || content[startPos] !== '(') {
      return { success: false, content: '', endPos: startPos };
    }
    
    let depth = 0;
    let pos = startPos;
    let inString = false;
    let inTextBlock = false; // ENHANCED: Java 15+ text block support
    let inChar = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escapeNext = false;
    const maxLength = Math.min(content.length, startPos + 20000); // FIXED: Increased from 5000 to handle complex method params + multi-annotations
    
    while (pos < maxLength) {
      const char = content[pos];
      const nextChar = pos + 1 < maxLength ? content[pos + 1] : '';
      const next2Char = pos + 2 < maxLength ? content[pos + 2] : '';
      
      // Handle escape sequences (only for regular strings/chars, NOT text blocks)
      if (escapeNext) {
        escapeNext = false;
        pos++;
        continue;
      }
      
      if (char === '\\' && (inString || inChar)) {
        escapeNext = true;
        pos++;
        continue;
      }
      
      // Handle comments
      if (inLineComment) {
        if (char === '\n') inLineComment = false;
        pos++;
        continue;
      }
      
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          pos += 2;
        } else {
          pos++;
        }
        continue;
      }
      
      // ENHANCED: Handle Java text block ("""...""")
      if (inTextBlock) {
        if (char === '"' && nextChar === '"' && next2Char === '"') {
          inTextBlock = false;
          pos += 3;
        } else {
          pos++;
        }
        continue;
      }
      
      // Start of comments
      if (!inString && !inChar) {
        if (char === '/' && nextChar === '/') {
          inLineComment = true;
          pos += 2;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          pos += 2;
          continue;
        }
      }
      
      // ENHANCED: Check for text block start before regular string
      if (!inString && !inChar && char === '"' && nextChar === '"' && next2Char === '"') {
        inTextBlock = true;
        pos += 3;
        continue;
      }
      
      // Track strings and chars
      if (char === '"' && !inChar) {
        inString = !inString;
      } else if (char === "'" && !inString) {
        inChar = !inChar;
      }
      
      // Count parens outside of strings, chars, and comments
      if (!inString && !inChar) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            // Found matching close paren
            return {
              success: true,
              content: content.substring(startPos + 1, pos),
              endPos: pos
            };
          }
        }
      }
      
      pos++;
    }
    
    return { success: false, content: '', endPos: pos };
  }

  /**
   * FIXED: Find the method end marker ({ or ;) after closing paren
   * Skips whitespace, comments, and throws clause
   * Returns the marker type and its position
   */
  private findMethodEndMarker(content: string, startPos: number): { found: boolean; marker: '{' | ';' | ''; position: number } {
    let pos = startPos;
    const maxLength = Math.min(content.length, startPos + 1000); // Reasonable limit
    let inLineComment = false;
    let inBlockComment = false;
    let sawThrows = false;
    
    while (pos < maxLength) {
      const char = content[pos];
      const nextChar = pos + 1 < maxLength ? content[pos + 1] : '';
      
      // Handle comments
      if (inLineComment) {
        if (char === '\n') inLineComment = false;
        pos++;
        continue;
      }
      
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          pos += 2;
        } else {
          pos++;
        }
        continue;
      }
      
      // Start of comments
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        pos += 2;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        pos += 2;
        continue;
      }
      
      // Skip whitespace
      if (/\s/.test(char)) {
        pos++;
        continue;
      }
      
      // FIXED: Check for 'throws' keyword with word boundary
      // Previous check could match in middle of identifiers like 'mythrowsCount'
      if (!sawThrows) {
        // Check if we're at 'throws' with word boundaries
        const substr = content.substring(pos, pos + 6);
        if (substr === 'throws') {
          // Verify word boundary: char before should not be alphanumeric
          const charBefore = pos > 0 ? content[pos - 1] : ' ';
          const charAfter = pos + 6 < content.length ? content[pos + 6] : ' ';
          if (!/\w/.test(charBefore) && !/\w/.test(charAfter)) {
            sawThrows = true;
            pos += 6;
            // Skip the throws clause (exception names separated by commas)
            while (pos < maxLength) {
              const c = content[pos];
              if (c === '{' || c === ';') break;
              pos++;
            }
            continue;
          }
        }
      }
      
      // Found the marker
      if (char === '{' || char === ';') {
        return { found: true, marker: char as '{' | ';', position: pos };
      }
      
      // Any other character means this is not a valid method signature
      // (could be default value, annotation, etc.)
      // But allow identifiers in throws clause
      if (sawThrows && /[\w,\s\.]/.test(char)) {
        pos++;
        continue;
      }
      
      // Unexpected character - not a method
      return { found: false, marker: '', position: pos };
    }
    
    return { found: false, marker: '', position: pos };
  }

  // ENHANCED: Extract method body using brace matching with string/comment state machine
  // FIXED: Ignores {} in strings ("...", '...') and comments (//..., /*...*/)
  // FIXED: Configurable max length (default 20000) to handle long methods
  // FIXED: Proper depth counting to capture complete method bodies
  // ENHANCED: Added Java text block ("""...""") support
  // FIXED: Increased default limit from 20000 to 100000 to avoid truncating large service methods
  private extractMethodBody(content: string, startPosition: number, maxMethodBodyLength = 100000): string {
    let depth = 0;
    let pos = startPosition;
    const maxPos = Math.min(content.length, startPosition + maxMethodBodyLength);

    // State machine flags
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let inString = false;
    let inTextBlock = false; // ENHANCED: Java 15+ text block support
    let inChar = false;
    let escapeNext = false;

    // Track the position of the first opening brace
    let firstBracePos = -1;

    // Skip leading whitespace to find first {
    while (pos < maxPos && /\s/.test(content[pos])) {
      pos++;
    }

    // Expect first char to be {
    if (pos >= maxPos || content[pos] !== '{') {
      return '';
    }
    firstBracePos = pos;
    depth = 1;
    pos++;

    // Scan until we find the matching closing brace
    while (pos < maxPos && depth > 0) {
      const char = content[pos];
      const nextChar = pos + 1 < maxPos ? content[pos + 1] : '';
      const next2Char = pos + 2 < maxPos ? content[pos + 2] : '';

      // Handle escape sequences (only for regular strings/chars, NOT text blocks)
      if (escapeNext) {
        escapeNext = false;
        pos++;
        continue;
      }

      if ((inString || inChar) && char === '\\') {
        escapeNext = true;
        pos++;
        continue;
      }

      // Single-line comment start
      if (!inMultiLineComment && !inString && !inChar && !inTextBlock && char === '/' && nextChar === '/') {
        inSingleLineComment = true;
        pos += 2;
        continue;
      }

      // Single-line comment end (newline)
      if (inSingleLineComment && (char === '\n' || char === '\r')) {
        inSingleLineComment = false;
        pos++;
        continue;
      }

      // Multi-line comment start
      if (!inSingleLineComment && !inString && !inChar && !inTextBlock && char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        pos += 2;
        continue;
      }

      // Multi-line comment end
      if (inMultiLineComment && char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        pos += 2;
        continue;
      }

      // If inside any comment, skip brace counting
      if (inSingleLineComment || inMultiLineComment) {
        pos++;
        continue;
      }

      // ENHANCED: Handle Java text block ("""...""")
      if (inTextBlock) {
        if (char === '"' && nextChar === '"' && next2Char === '"') {
          inTextBlock = false;
          pos += 3;
        } else {
          pos++;
        }
        continue;
      }

      // ENHANCED: Check for text block start before regular string
      if (!inChar && !inString && char === '"' && nextChar === '"' && next2Char === '"') {
        inTextBlock = true;
        pos += 3;
        continue;
      }

      // FIXED: String literal start/end (only " for strings)
      if (!inChar && !inTextBlock && char === '"') {
        inString = !inString;
        pos++;
        continue;
      }

      // FIXED: Char literal start/end (only ' for chars)
      if (!inString && !inTextBlock && char === "'") {
        inChar = !inChar;
        pos++;
        continue;
      }

      // If inside string or char, skip brace counting
      if (inString || inChar) {
        pos++;
        continue;
      }

      // Brace counting (only outside strings/comments/text blocks)
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      }

      pos++;
    }

    // FIXED: Extract method body excluding outer braces (from after first { to before last })
    // This returns only the inner content for better pattern matching
    return content.substring(firstBracePos + 1, pos - 1);
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

  /**
   * Enhanced: Extract mapper/repository method calls from Service method body
   * Analyzes code to find which Mapper methods are being called
   */
  private extractMapperCalls(methodBody: string, dependencies: string[]): string[] {
    const mapperCalls: string[] = [];
    
    // Find mapper/repository variable names from dependencies
    // Dependencies are class names like UserMapper, OrderRepository, etc.
    const mapperPatterns = dependencies
      .filter(dep => dep.endsWith('Mapper') || dep.endsWith('Repository') || dep.endsWith('DAO') || dep.endsWith('Dao'))
      .map(dep => {
        // Convert class name to variable name: UserMapper -> userMapper
        const varName = dep.charAt(0).toLowerCase() + dep.slice(1);
        return { className: dep, varName };
      });
    
    for (const mapper of mapperPatterns) {
      // Pattern: mapperVarName.methodName(
      const callPattern = new RegExp(`${mapper.varName}\\.(\\w+)\\s*\\(`, 'g');
      let match;
      while ((match = callPattern.exec(methodBody)) !== null) {
        const methodName = match[1];
        // Filter out getter methods and common non-DB methods
        if (!methodName.startsWith('get') && !methodName.startsWith('set') && 
            !['toString', 'hashCode', 'equals', 'getClass'].includes(methodName)) {
          const callStr = `${mapper.className}.${methodName}()`;
          if (!mapperCalls.includes(callStr)) {
            mapperCalls.push(callStr);
          }
        }
      }
    }
    
    // Also detect common mapper call patterns without knowing variable name
    // Pattern: xxxMapper.methodName( or xxxRepository.methodName(
    const genericMapperPattern = /(\w+(?:Mapper|Repository|DAO|Dao))\.(\w+)\s*\(/g;
    let genericMatch;
    while ((genericMatch = genericMapperPattern.exec(methodBody)) !== null) {
      const mapperName = genericMatch[1];
      const methodName = genericMatch[2];
      if (!methodName.startsWith('get') && !methodName.startsWith('set') &&
          !['toString', 'hashCode', 'equals', 'getClass'].includes(methodName)) {
        const callStr = `${mapperName}.${methodName}()`;
        if (!mapperCalls.includes(callStr)) {
          mapperCalls.push(callStr);
        }
      }
    }
    
    return mapperCalls;
  }

  // ENHANCED: Extract key snippets for method analysis
  // Detects: validation, exceptions, state changes, DB ops, MP CRUD, wrappers, etc.
  private extractKeySnippets(methodBody: string, isService: boolean): KeySnippet[] {
    const snippets: KeySnippet[] = [];

    // 1. Validation patterns (FIXED: Only patterns that appear in method body, not annotations)
    // ValidationUtils, validate(), Assert, null-check patterns
    if (/ValidationUtils|validate\(|Assert\.|Objects\.requireNonNull|if\s*\(\s*\w+\s*==\s*null\s*\)\s*throw/.test(methodBody)) {
      snippets.push({
        kind: 'validation',
        summary: '数据验证',
        evidence: this.extractEvidence(methodBody, /(?:ValidationUtils|validate\(|Assert\.|Objects\.requireNonNull|if\s*\(\s*\w+\s*==\s*null\s*\)\s*throw)/)
      });
    }

    // 2. Exception handling
    if (/throw new\s+\w+Exception|try\s*\{[\s\S]*?\}\s*catch/.test(methodBody)) {
      snippets.push({
        kind: 'exception',
        summary: '异常处理',
        evidence: this.extractEvidence(methodBody, /throw new\s+\w+Exception/)
      });
    }

    // 3. State changes (update operations)
    if (/\b(set[A-Z]\w*|update[A-Z]\w*|modify[A-Z]\w*)\s*\(/.test(methodBody) && !/\.(set|update|get)\w*\(/.test(methodBody)) {
      snippets.push({
        kind: 'stateChange',
        summary: '状态变更',
        evidence: this.extractEvidence(methodBody, /\b(set|update|modify)[A-Z]\w*\s*\(/)
      });
    }

    // 4. MyBatis-Plus CRUD operations
    // FIXED: Improved evidence extraction for more stable output
    // FIXED: Added this.lambdaQuery() and this.lambdaUpdate() patterns
    const mpCrudPatterns = [
      // this.save/this.updateById/this.removeById/this.getById/this.page
      { pattern: /\bthis\.(save|updateById|removeById|deleteById|getById|page|saveOrUpdate|saveBatch)\s*\(/g, kind: 'mpCrud' as const, summary: 'MyBatis-Plus CRUD 操作', evidence: 'this.' },
      // baseMapper.xxx CRUD methods
      { pattern: /\bbaseMapper\.(selectById|selectOne|selectList|selectPage|selectCount|insert|updateById|deleteById)\s*\(/gi, kind: 'mpCrud' as const, summary: 'MyBatis-Plus CRUD 操作', evidence: 'baseMapper.' },
      // FIXED: Added this.lambdaQuery() and this.lambdaUpdate() patterns
      { pattern: /\bthis\.lambdaQuery\(\)\s*\./g, kind: 'mpQueryWrapper' as const, summary: 'MyBatis-Plus 查询构造器', evidence: 'this.lambdaQuery' },
      { pattern: /\bthis\.lambdaUpdate\(\)\s*\./g, kind: 'mpUpdateWrapper' as const, summary: 'MyBatis-Plus 更新构造器', evidence: 'this.lambdaUpdate' },
      // Also support lambdaQuery() and lambdaUpdate() without this. (for imports)
      { pattern: /\blambdaQuery\(\)\s*\./g, kind: 'mpQueryWrapper' as const, summary: 'MyBatis-Plus 查询构造器', evidence: 'lambdaQuery' },
      { pattern: /\blambdaUpdate\(\)\s*\./g, kind: 'mpUpdateWrapper' as const, summary: 'MyBatis-Plus 更新构造器', evidence: 'lambdaUpdate' },
    ];

    const detectedMpKinds = new Set<string>();
    for (const { pattern, kind, summary, evidence: evidencePrefix } of mpCrudPatterns) {
      const matches = methodBody.match(pattern);
      if (matches && !detectedMpKinds.has(kind)) {
        detectedMpKinds.add(kind);
        snippets.push({
          kind,
          summary,
          evidence: evidencePrefix
        });
      }
    }

    // 5. Database write operations
    if (/\b(insert|update|delete|save)\s*\(/i.test(methodBody) && !/\.(insert|update|delete|save)\w*\(/.test(methodBody)) {
      const hasMpCrud = snippets.some(s => s.kind === 'mpCrud' || s.kind === 'mpUpdateWrapper');
      if (!hasMpCrud) {
        snippets.push({
          kind: 'dbWrite',
          summary: '数据写入',
          evidence: this.extractEvidence(methodBody, /\b(insert|update|delete|save)\s*\(/i)
        });
      }
    }

    return snippets;
  }

  // Helper: Extract evidence snippet from method body
  private extractEvidence(methodBody: string, pattern: RegExp): string {
    const match = methodBody.match(pattern);
    if (!match) return '';

    // Get up to 50 characters around the match
    const matchStart = methodBody.indexOf(match[0]);
    const start = Math.max(0, matchStart - 20);
    const end = Math.min(methodBody.length, matchStart + match[0].length + 20);
    let evidence = methodBody.substring(start, end).replace(/\s+/g, ' ').trim();

    if (evidence.length > 50) {
      evidence = evidence.substring(0, 47) + '...';
    }

    return evidence;
  }

  // ENHANCED: Deduplicate key snippets by kind, merging evidence
  private dedupeKeySnippets(snippets: KeySnippet[]): KeySnippet[] {
    const byKind = new Map<string, KeySnippet>();
    for (const snippet of snippets) {
      const existing = byKind.get(snippet.kind);
      if (existing) {
        const newEvidence = snippet.evidence;
        // FIXED: Avoid duplicate evidence
        if (!existing.evidence.includes(newEvidence)) {
          existing.evidence = `${existing.evidence}, ${newEvidence}`;
          // FIXED: Limit to 80 characters
          if (existing.evidence.length > 80) {
            existing.evidence = existing.evidence.substring(0, 77) + '...';
          }
        }
      } else {
        byKind.set(snippet.kind, { ...snippet });
      }
    }
    return Array.from(byKind.values());
  }

  // Enhanced: Extract dependencies from constructor and injection annotations
  // Java-only: Only extract from @Autowired/@Resource/@Inject, NOT from method calls
  // ENHANCED: Also support Lombok constructor injection (@RequiredArgsConstructor, @AllArgsConstructor)
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
    
    // ENHANCED: Lombok constructor injection - @RequiredArgsConstructor / @AllArgsConstructor
    // When these annotations are present, all final fields become constructor dependencies
    const hasLombokConstructor = 
      content.includes('@RequiredArgsConstructor') || 
      content.includes('@AllArgsConstructor');
    
    if (hasLombokConstructor) {
      // Extract final fields as dependencies
      // Pattern: (private|protected|public)? final Type fieldName;
      // FIXED: Allow optional visibility modifier to handle @Getter final X x; without private
      const finalFieldPattern = /(?:private|protected|public)?\s*final\s+([\w<>\[\],\s.]+)\s+(\w+)\s*[;=]/g;
      let fieldMatch;
      while ((fieldMatch = finalFieldPattern.exec(content)) !== null) {
        const type = fieldMatch[1];
        this.extractTypeFromGeneric(type, dependencies);
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
        // FIXED: Use cached getFileContent instead of direct readFileSync
        controllerContent = this.getFileContent(controllerFilePath);
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
   * FIXED: Now supports multi-line annotations like @RequestMapping(\n  value = "/api"\n)
   * FIXED: Only looks in the annotation block immediately before the class declaration
   */
  private extractSpringControllerBasePath(content: string): string {
    // Find class declaration position
    const classKeywordMatch = content.match(/\b(public\s+|private\s+|protected\s+|abstract\s+|final\s+)*(class|interface)\s+\w+/);
    if (!classKeywordMatch) return '';
    
    const classPosition = classKeywordMatch.index!;
    
    // FIXED: Only look in the continuous annotation block immediately before class
    // Use line-based approach similar to extractDecorators
    const linesBeforeClass = content.substring(0, classPosition).split('\n');
    const annotationLines: string[] = [];
    
    // Iterate backwards to collect continuous annotation block
    for (let i = linesBeforeClass.length - 1; i >= 0; i--) {
      const line = linesBeforeClass[i];
      const trimmed = line.trim();
      
      // Empty line breaks the annotation block (only if we haven't started yet)
      if (trimmed === '' && annotationLines.length === 0) {
        continue; // Skip trailing empty lines
      }
      if (trimmed === '' && annotationLines.length > 0) {
        break; // Empty line after annotations, stop
      }
      
      // JavaDoc end - skip the entire JavaDoc block
      if (trimmed === '*/') {
        while (i > 0 && !linesBeforeClass[i].trim().startsWith('/**')) {
          i--;
        }
        continue;
      }
      
      // Must start with @ or be a continuation of annotation (for multi-line)
      if (!trimmed.startsWith('@')) {
        // Allow continuation lines (part of multi-line annotation)
        if (annotationLines.length === 0) break;
        // Check if this looks like annotation content (has = , ) etc.)
        if (!/[=,)("]/.test(trimmed)) break;
      }
      
      annotationLines.unshift(line);
    }
    
    // Join the annotation block
    const annotationBlock = annotationLines.join('\n');
    
    // ENHANCED: Support both @RequestMapping and @GetMapping/@PostMapping/etc at class level (rare but exists)
    // Try @RequestMapping first (most common), then fall back to other *Mapping annotations
    const mappingAnnotations = ['@RequestMapping', '@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping'];
    
    let rmIndex = -1;
    let matchedAnnotation = '';
    for (const ann of mappingAnnotations) {
      const idx = annotationBlock.indexOf(ann);
      if (idx !== -1) {
        rmIndex = idx;
        matchedAnnotation = ann;
        break;
      }
    }
    
    if (rmIndex === -1) return '';
    
    // Extract the full annotation content using bracket depth parsing
    const afterRM = annotationBlock.substring(rmIndex);
    const openParen = afterRM.indexOf('(');
    if (openParen === -1) return ''; // @RequestMapping without params
    
    // Parse until matching close paren
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let annotationContent = '';
    
    for (let i = openParen; i < afterRM.length; i++) {
      const char = afterRM[i];
      
      // Handle string literals
      if ((char === '"' || char === "'") && (i === 0 || afterRM[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        
        if (depth === 0) {
          annotationContent = afterRM.substring(openParen + 1, i);
          break;
        }
      }
    }
    
    if (!annotationContent) return '';
    
    // Extract path from annotation content
    // Pattern 1: value = "/path" or path = "/path"
    const valueMatch = annotationContent.match(/(?:value|path)\s*=\s*["']([^"']+)["']/);
    if (valueMatch) return valueMatch[1];
    
    // Pattern 2: value = { "/path1", "/path2" } - take first
    const arrayMatch = annotationContent.match(/(?:value|path)\s*=\s*\{\s*["']([^"']+)["']/);
    if (arrayMatch) return arrayMatch[1];
    
    // Pattern 3: Just "/path" without key
    const directMatch = annotationContent.match(/^\s*["']([^"']+)["']\s*$/);
    if (directMatch) return directMatch[1];
    
    // Pattern 4: { "/path1", "/path2" } without key - take first
    const directArrayMatch = annotationContent.match(/^\s*\{\s*["']([^"']+)["']/);
    if (directArrayMatch) return directArrayMatch[1];
    
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
   * ENHANCED: Support @TableId without value attribute - just the annotation presence is enough
   */
  private extractPrimaryKey(content: string, fields: FieldInfo[]): string | undefined {
    // MyBatis-Plus: @TableId annotation (with or without value attribute)
    // Handles: @TableId, @TableId(type = IdType.ASSIGN_ID), @TableId(value = "id")
    // Pattern: @TableId followed by optional (...) and then field declaration
    const mpIdMatch = content.match(/@TableId(?:\s*\([^)]*\))?\s*(?:private|public|protected)\s+[\w<>\[\]]+\s+(\w+)/);
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
        // FIXED: Use fieldMatch.index instead of indexOf to get the actual match position
        // indexOf would return the first occurrence, which may be wrong for duplicate patterns
        const beforeField = content.substring(0, fieldMatch.index!);
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
   * ENHANCED: Uses content-based detection instead of path-based
   * Detects MyBatis mapper by checking for <mapper namespace="..."> or DTD declaration
   */
  private scanMyBatisXml(filePath: string): void {
    try {
      // ENHANCED: Use cached getFileContent
      const content = this.getFileContent(filePath);
      
      // ENHANCED: Quick content-based check for MyBatis mapper XML
      // Check 1: Standard mapper declaration with namespace
      // Check 2: MyBatis DTD declaration (mybatis-3-mapper.dtd)
      const isMybatisMapper = 
        (content.includes('<mapper') && content.includes('namespace')) ||
        content.includes('mybatis-3-mapper.dtd') ||
        content.includes('mybatis.org/dtd/mybatis-3-mapper');
      
      if (!isMybatisMapper) {
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
          
          // ENHANCED: Extract and clean SQL content for documentation
          let sqlContent: string | undefined;
          if (!fullBlock.endsWith('/>')) {
            // Not self-closing, extract inner SQL
            const startTagEnd = fullBlock.indexOf('>');
            const endTagStart = fullBlock.lastIndexOf('</');
            if (startTagEnd > 0 && endTagStart > startTagEnd) {
              sqlContent = fullBlock.substring(startTagEnd + 1, endTagStart)
                .trim()
                .replace(/\s+/g, ' ');  // Normalize whitespace
            }
          }
          
          statements.push({
            id,
            type: type as 'select' | 'insert' | 'update' | 'delete',
            resultType: resultTypeMatch?.[1],
            parameterType: parameterTypeMatch?.[1],
            tables: tables.length > 0 ? tables : undefined,
            sql: sqlContent,  // ENHANCED: Store full SQL for documentation
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
      // Silent fail for non-mapper XML files or read errors
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
    
    // ENHANCED D: Also extract @Select/@Insert/@Update/@Delete annotation SQL from Mapper interfaces
    this.extractAnnotationSqlFromMappers();
  }
  
  /**
   * FIXED: Two-step approach for extracting annotation SQL
   * Step 1: Find @(Select|Insert|Update|Delete)( position
   * Step 2: Use extractBalancedParenContent to get complete annotation params
   * Step 3: Extract all string literals and concatenate them as SQL
   */
  private extractAnnotationSqlFromMappers(): void {
    for (const classInfo of this.allClasses) {
      if (classInfo.type !== 'repository') continue;
      
      const filePath = join(this.options.rootDir, classInfo.filePath);
      let content: string;
      try {
        content = this.getFileContent(filePath);
      } catch {
        continue;
      }
      
      const statements: MyBatisStatement[] = [];
      const annotationPattern = /@(Select|Insert|Update|Delete)\s*\(/g;
      let annotationMatch;
      
      while ((annotationMatch = annotationPattern.exec(content)) !== null) {
        const type = annotationMatch[1].toLowerCase() as 'select' | 'insert' | 'update' | 'delete';
        const parenStart = annotationMatch.index + annotationMatch[0].length - 1;
        
        const parenResult = this.extractBalancedParenContent(content, parenStart);
        if (!parenResult.success) continue;
        
        const sql = this.extractSqlFromAnnotationContent(parenResult.content);
        if (!sql) continue;
        
        const afterAnnotation = content.substring(parenResult.endPos + 1);
        const methodMatch = afterAnnotation.match(/^\s*(?:@\w+(?:\([^)]*\))?\s*)*(?:default\s+)?(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:final\s+)?(?:[\w<>\[\].,\s]+)\s+(\w+)\s*\(/);
        if (!methodMatch) continue;
        
        const methodName = methodMatch[1];
        if (statements.some(s => s.id === methodName)) continue;
        
        const tables = this.extractTablesFromSql(sql);
        statements.push({
          id: methodName,
          type,
          tables: tables.length > 0 ? tables : undefined,
          sql,  // ENHANCED: Store full SQL for documentation
        });
        
        this.updateMethodBusinessLogic(classInfo, methodName, type, tables);
      }
      
      if (statements.length > 0) {
        const existingMapper = this.mybatisMappers.find(m => {
          const className = m.namespace.split('.').pop();
          return className === classInfo.name;
        });
        
        if (existingMapper) {
          for (const stmt of statements) {
            if (!existingMapper.statements.some(s => s.id === stmt.id)) {
              existingMapper.statements.push(stmt);
            }
          }
        } else {
          this.mybatisMappers.push({
            namespace: classInfo.name,
            filePath: classInfo.filePath,
            statements,
          });
        }
      }
    }
  }
  
  private extractSqlFromAnnotationContent(annotationContent: string): string | null {
    const strings: string[] = [];
    let pos = 0;
    const content = annotationContent.trim();
    
    while (pos < content.length) {
      const char = content[pos];
      if (/[\s,{}]/.test(char)) { pos++; continue; }
      
      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        pos++;
        
        while (pos < content.length) {
          const c = content[pos];
          if (c === '\\' && pos + 1 < content.length) {
            const nextC = content[pos + 1];
            if (nextC === 'n') str += '\n';
            else if (nextC === 't') str += '\t';
            else if (nextC === quote || nextC === '\\') str += nextC;
            else str += '\\' + nextC;
            pos += 2;
            continue;
          }
          if (c === quote) { pos++; break; }
          str += c;
          pos++;
        }
        if (str.trim()) strings.push(str);
        continue;
      }
      pos++;
    }
    
    if (strings.length === 0) return null;
    return strings.join(' ').replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Helper: Update method businessLogic with SQL annotation info
   */
  private updateMethodBusinessLogic(
    classInfo: ClassInfo, 
    methodName: string, 
    type: 'select' | 'insert' | 'update' | 'delete',
    tables: string[]
  ): void {
    const method = classInfo.methods.find(m => m.name === methodName);
    if (method) {
      const sqlTypeMap = {
        select: '注解SQL查询',
        insert: '注解SQL插入',
        update: '注解SQL更新',
        delete: '注解SQL删除',
      };
      
      let sqlInfo = sqlTypeMap[type];
      if (tables.length > 0) {
        sqlInfo += `(表: ${tables.join(', ')})`;
      }
      
      method.businessLogic = method.businessLogic 
        ? `${method.businessLogic}、${sqlInfo}` 
        : sqlInfo;
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

  // FIXED: Rebuild entities/controllers/services arrays from allClasses
  // This ensures ScanResult.entities/controllers/services matches allClasses.type
  private rebuildTypedArrays(): void {
    // Clear existing arrays
    this.entities = [];
    this.controllers = [];
    this.services = [];

    // Rebuild from allClasses based on corrected type
    for (const classInfo of this.allClasses) {
      if (classInfo.type === 'entity') {
        const entityInfo = this.extractEntityFromClassInfo(classInfo);
        this.entities.push(entityInfo);
      } else if (classInfo.type === 'controller') {
        const controllerInfo = this.extractControllerFromClassInfo(classInfo);
        this.controllers.push(controllerInfo);
      } else if (classInfo.type === 'service') {
        const serviceInfo = this.extractServiceFromClassInfo(classInfo);
        this.services.push(serviceInfo);
      }
    }
  }

  private extractEntityFromClassInfo(classInfo: ClassInfo): EntityInfo {
    const fields = classInfo.fields.map(f => ({
      name: f.name,
      type: f.type,
      decorators: f.decorators,
      optional: f.optional || false,
    }));

    return {
      name: classInfo.name,
      filePath: classInfo.filePath,
      fields,
      decorators: classInfo.decorators,
      tableName: classInfo.rawHeader ? this.extractTableNameFromRaw(classInfo.rawHeader, classInfo.name) : undefined,
    };
  }

  private extractControllerFromClassInfo(classInfo: ClassInfo): ControllerInfo {
    // ENHANCED: Use cached content to avoid repeated file reads
    const filePath = join(this.options.rootDir, classInfo.filePath);
    const content = this.getFileContent(filePath);
    const routes = this.extractRoutes(content);

    return {
      name: classInfo.name,
      filePath: classInfo.filePath,
      routes,
      decorators: classInfo.decorators,
    };
  }
  
  /**
   * ENHANCED: Normalize file path to consistent key for caching
   * FIXED: Use resolve + realpathSync for reliable cache key
   * Handles relative paths, symlinks, Windows/Unix differences
   */
  private normalizeAbsPath(p: string): string {
    // First resolve to absolute path
    let abs = resolve(p);
    // Then try to get realpath (resolves symlinks, normalizes case on case-insensitive systems)
    try {
      abs = realpathSync(abs);
    } catch {
      // Fall back to resolved path if realpath fails
    }
    // Convert to forward slashes for consistent key
    return abs.replace(/\\/g, '/');
  }

  /**
   * ENHANCED: Get file content from cache or read from disk
   * Avoids repeated readFileSync calls for the same file
   * FIXED: Use normalizeAbsPath for consistent cache keys
   */
  private getFileContent(filePath: string): string {
    // Normalize path for consistent cache key
    const key = this.normalizeAbsPath(filePath);
    
    // Check cache first
    const cached = this.fileContentCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Read from disk and cache
    const content = readFileSync(filePath, 'utf-8');
    this.fileContentCache.set(key, content);
    return content;
  }

  private extractServiceFromClassInfo(classInfo: ClassInfo): ServiceInfo {
    const methods = classInfo.methods.map(m => ({
      name: m.name,
      parameters: m.parameters.map(p => p.name + ': ' + p.type),
      returnType: m.returnType,
    }));

    return {
      name: classInfo.name,
      filePath: classInfo.filePath,
      methods,
      decorators: classInfo.decorators,
    };
  }

  private extractTableNameFromRaw(rawHeader: string, className: string): string | undefined {
    const tableMatch = rawHeader.match(/@TableName\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    return tableMatch ? tableMatch[1] : undefined;
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

  // ==================== MyBatis-Plus Enhanced Support ====================

  /**
   * Parse generic type from BaseMapper<T> extends clause
   * Examples:
   * - "interface UserMapper extends BaseMapper<User>" -> "User"
   * - "interface UserMapper extends com.baomidou.mybatisplus.core.mapper.BaseMapper<UserDO>" -> "UserDO"
   * FIXED: Added m flag and support for inner class $ in type names
   */
  private parseBaseMapperGeneric(rawHeader: string | undefined): string | null {
    if (!rawHeader) return null;
    
    // Match: extends BaseMapper<EntityName> or extends ...BaseMapper<EntityName>
    // FIXED: Added m flag for multiline, support $ for inner classes
    const pattern = /extends\s+(?:[\w.]+\.)?BaseMapper\s*<\s*([\w.$]+)\s*>/m;
    const match = rawHeader.match(pattern);
    if (match) {
      // Extract simple class name from potential full qualified name
      return match[1].split('.').pop() || null;
    }
    return null;
  }

  /**
   * Parse generic types from ServiceImpl<M, T> extends clause
   * Examples:
   * - "class UserServiceImpl extends ServiceImpl<UserMapper, User>" -> { mapper: "UserMapper", entity: "User" }
   * - "class UserServiceImpl extends ServiceImpl<UserMapper, UserDO> implements IUserService" -> { mapper: "UserMapper", entity: "UserDO", serviceInterface: "IUserService" }
   * FIXED: Added m flag and support for inner class $ in type names
   */
  private parseServiceImplGeneric(rawHeader: string | undefined): { mapper: string; entity: string; serviceInterface?: string } | null {
    if (!rawHeader) return null;
    
    // Match: extends ServiceImpl<MapperName, EntityName>
    // FIXED: Added m flag for multiline, support $ for inner classes
    const pattern = /extends\s+(?:[\w.]+\.)?ServiceImpl\s*<\s*([\w.$]+)\s*,\s*([\w.$]+)\s*>/m;
    const match = rawHeader.match(pattern);
    if (match) {
      const mapper = match[1].split('.').pop() || '';
      const entity = match[2].split('.').pop() || '';
      
      // FIXED: Find first service interface from implements clause
      // Handles: implements IUserService, implements IUserService<User>, implements IUserService, Serializable
      let serviceInterface: string | undefined;
      // Match implements followed by first interface (with optional generics)
      const implMatch = rawHeader.match(/implements\s+([\w.$]+)(?:\s*<[^>]*>)?/m);
      if (implMatch) {
        // Extract simple name, excluding common non-service interfaces
        const firstInterface = implMatch[1].split('.').pop() || '';
        // Filter out common non-service interfaces
        if (!['Serializable', 'Cloneable', 'Comparable', 'AutoCloseable'].includes(firstInterface)) {
          serviceInterface = firstInterface;
        }
      }
      
      return { mapper, entity, serviceInterface };
    }
    
    // ENHANCED: Fallback - try to parse extends IService<Entity> directly
    // This handles: class UserServiceImpl extends BaseServiceImpl implements IService<User>
    // or: class UserServiceImpl implements IService<User>
    const iservicePattern = /(?:extends|implements)\s+(?:[\w.]+\.)?IService\s*<\s*([\w.$]+)\s*>/m;
    const iserviceMatch = rawHeader.match(iservicePattern);
    if (iserviceMatch) {
      const entity = iserviceMatch[1].split('.').pop() || '';
      return { mapper: '', entity, serviceInterface: 'IService' };
    }
    
    return null;
  }
  
  /**
   * ENHANCED: Parse entity type from IService interface
   * Handles:
   * - interface UserService extends IService<User>
   * - interface UserService extends com.baomidou.mybatisplus.extension.service.IService<User>
   * - class UserServiceImpl implements IService<User>
   * This provides conservative fallback when ServiceImpl is not used
   * ENHANCED: Support both extends and implements forms
   */
  private parseIServiceInterfaceGeneric(rawHeader: string | undefined): string | null {
    if (!rawHeader) return null;
    
    // ENHANCED: Match both extends and implements forms with optional full package path
    // Pattern: (extends|implements) [package.]IService<EntityName>
    const pattern = /(extends|implements)\s+(?:[\w.]+\.)?IService\s*<\s*([\w.$]+)\s*>/m;
    const match = rawHeader.match(pattern);
    if (match) {
      return match[2].split('.').pop() || null;
    }
    return null;
  }
  
  /**
   * ENHANCED: Parse @TableName value from decorators or rawHeader
   * Handles: @TableName("t_user"), @TableName(value = "t_user")
   * Fallback for classes not in this.entities but referenced by Mapper/Service
   */
  private parseTableNameFromDecorators(decorators: string[], rawHeader: string | undefined): string | null {
    // Check if TableName is in decorators list
    if (!decorators.includes('TableName')) {
      return null;
    }
    
    if (!rawHeader) return null;
    
    // Pattern 1: @TableName("t_user") or @TableName('t_user')
    const simpleMatch = rawHeader.match(/@TableName\s*\(\s*["']([^"']+)["']\s*\)/);
    if (simpleMatch) {
      return simpleMatch[1];
    }
    
    // Pattern 2: @TableName(value = "t_user")
    const valueMatch = rawHeader.match(/@TableName\s*\([^)]*value\s*=\s*["']([^"']+)["']/);
    if (valueMatch) {
      return valueMatch[1];
    }
    
    return null;
  }

  /**
   * Build MyBatis-Plus relationship models (Entity <-> Mapper <-> Service)
   * Scans all classes and infers relationships from generic type parameters
   * FIXED: Use this.entities for complete entity info (tableName, primaryKey, etc.)
   */
  private buildMyBatisPlusModels(): void {
    const mapperToEntity = new Map<string, { entity: string; mapperFile?: string }>();
    const serviceToMapperEntity = new Map<string, { mapper: string; entity: string; serviceFile?: string; serviceInterface?: string }>();
    
    // ENHANCED: Map service interface name -> entity (for IService<T> fallback)
    // Handles: interface UserService extends IService<User>
    const serviceInterfaceToEntity = new Map<string, string>();
    
    // FIXED: Build entity info map from this.entities (database-oriented) instead of ClassInfo
    // EntityInfo has more accurate tableName, primaryKey, indexes from extractEntity()
    const entityInfoMap = new Map<string, EntityInfo>();
    for (const entity of this.entities) {
      entityInfoMap.set(entity.name, entity);
    }
    
    // Pass 1: Collect all relationships from class headers
    for (const cls of this.allClasses) {
      // Check if this is a Mapper interface extending BaseMapper
      if (cls.declarationKind === 'interface' || cls.type === 'repository') {
        const entity = this.parseBaseMapperGeneric(cls.rawHeader);
        if (entity) {
          mapperToEntity.set(cls.name, {
            entity,
            mapperFile: cls.filePath,
          });
        }
        
        // ENHANCED: Check if this is a Service interface extending IService<T>
        // This provides fallback when implementation doesn't extend ServiceImpl
        const iserviceEntity = this.parseIServiceInterfaceGeneric(cls.rawHeader);
        if (iserviceEntity) {
          serviceInterfaceToEntity.set(cls.name, iserviceEntity);
        }
      }
      
      // Check if this is a ServiceImpl class
      if (cls.decorators.includes('Service') || cls.name.endsWith('ServiceImpl')) {
        let parsed = this.parseServiceImplGeneric(cls.rawHeader);
        
        // ENHANCED: Fallback - if no direct generic found, try to find entity through implements interface
        // Handles: class UserServiceImpl implements UserService (where UserService extends IService<User>)
        if (!parsed && cls.implements && cls.implements.length > 0) {
          for (const iface of cls.implements) {
            const entity = serviceInterfaceToEntity.get(iface);
            if (entity) {
              parsed = { mapper: '', entity, serviceInterface: iface };
              break;
            }
          }
        }
        
        if (parsed) {
          serviceToMapperEntity.set(cls.name, {
            mapper: parsed.mapper,
            entity: parsed.entity,
            serviceFile: cls.filePath,
            serviceInterface: parsed.serviceInterface,
          });
        }
      }
    }
    
    // Pass 2: Merge relationships into MyBatisPlusModel
    const modelMap = new Map<string, MyBatisPlusModel>();
    
    // Start from Mapper -> Entity relationships
    for (const [mapperName, info] of mapperToEntity) {
      const entityName = info.entity;
      let model = modelMap.get(entityName) || { entity: entityName };
      
      model.mapper = mapperName;
      model.mapperFile = info.mapperFile;
      
      // FIXED: Use EntityInfo from this.entities for accurate tableName/primaryKey
      // ENHANCED: Fallback for entity name mismatch (UserDO vs User, UserEntity vs UserPO)
      let eInfo = entityInfoMap.get(entityName);
      
      // Fallback: Try to find entity class in allClasses and parse @TableName
      if (!eInfo) {
        const entityClass = this.allClasses.find(c => c.name === entityName);
        if (entityClass) {
          const tableName = this.parseTableNameFromDecorators(entityClass.decorators, entityClass.rawHeader);
          if (tableName) {
            model.entityFile = entityClass.filePath;
            model.tableName = tableName;
          }
        }
      } else {
        model.entityFile = eInfo.filePath;
        model.tableName = eInfo.tableName;
        model.primaryKey = eInfo.primaryKey;
      }
      
      modelMap.set(entityName, model);
    }
    
    // Add Service -> Mapper -> Entity relationships
    for (const [serviceName, info] of serviceToMapperEntity) {
      const entityName = info.entity;
      let model = modelMap.get(entityName) || { entity: entityName };
      
      model.service = serviceName;
      model.serviceFile = info.serviceFile;
      model.serviceInterface = info.serviceInterface;
      
      // If mapper wasn't found from interface, use the one from ServiceImpl
      if (!model.mapper && info.mapper) {
        model.mapper = info.mapper;
        // Try to find mapper file
        const mapperClass = this.allClasses.find(c => c.name === info.mapper);
        if (mapperClass) {
          model.mapperFile = mapperClass.filePath;
        }
      }
      
      // FIXED: Use EntityInfo from this.entities if not already linked
      // ENHANCED: Fallback for entity name mismatch (UserDO vs User, UserEntity vs UserPO)
      if (!model.entityFile || !model.tableName) {
        let eInfo = entityInfoMap.get(entityName);
        
        // Fallback: Try to find entity class in allClasses and parse @TableName
        if (!eInfo) {
          const entityClass = this.allClasses.find(c => c.name === entityName);
          if (entityClass) {
            const tableName = this.parseTableNameFromDecorators(entityClass.decorators, entityClass.rawHeader);
            if (tableName) {
              if (!model.entityFile) model.entityFile = entityClass.filePath;
              if (!model.tableName) model.tableName = tableName;
            }
          }
        } else {
          if (!model.entityFile) model.entityFile = eInfo.filePath;
          if (!model.tableName) model.tableName = eInfo.tableName;
          if (!model.primaryKey) model.primaryKey = eInfo.primaryKey;
        }
      }
      
      modelMap.set(entityName, model);
    }
    
    // FIXED: Also add entities that have tableName but no mapper/service yet
    // This ensures we capture standalone entities with @TableName annotation
    for (const entity of this.entities) {
      if (!modelMap.has(entity.name) && entity.tableName) {
        modelMap.set(entity.name, {
          entity: entity.name,
          entityFile: entity.filePath,
          tableName: entity.tableName,
          primaryKey: entity.primaryKey,
        });
      }
    }
    
    // Convert to array
    this.mybatisPlusModels = Array.from(modelMap.values());
  }

  /**
   * ENHANCED B1: Detect wrapper variable declarations and their entity types
   * Handles:
   * - QueryWrapper<User> qw = new QueryWrapper<>();
   * - LambdaQueryWrapper<User> lqw = Wrappers.lambdaQuery();
   * - var qw = Wrappers.<User>lambdaQuery();
   * - var qw = Wrappers.lambdaQuery(User.class);
   * Returns: Map of variable name -> entity class name
   */
  private detectWrapperVariables(methodBody: string): Map<string, string> {
    const wrapperVars = new Map<string, string>();
    
    // Pattern 1: Explicit generic declaration
    // QueryWrapper<User> qw = ...
    // LambdaQueryWrapper<User> lqw = ...
    const decl1 = /(?:^|[;\n])\s*(?:final\s+)?(LambdaQueryWrapper|QueryWrapper|LambdaUpdateWrapper|UpdateWrapper)\s*<\s*([\w.$]+)\s*>\s+(\w+)\s*=/g;
    let match;
    while ((match = decl1.exec(methodBody)) !== null) {
      const entity = match[2].split('.').pop() || '';
      const varName = match[3];
      if (entity && varName) {
        wrapperVars.set(varName, entity);
      }
    }
    
    // Pattern 2: Wrappers factory with type param: Wrappers.<User>lambdaQuery()
    const decl2 = /(?:^|[;\n])\s*(?:final\s+)?(?:var|\w+(?:QueryWrapper|UpdateWrapper))\s+(\w+)\s*=\s*Wrappers\s*\.\s*<\s*([\w.$]+)\s*>\s*(?:lambdaQuery|lambdaUpdate|query|update)\s*\(/g;
    while ((match = decl2.exec(methodBody)) !== null) {
      const varName = match[1];
      const entity = match[2].split('.').pop() || '';
      if (entity && varName) {
        wrapperVars.set(varName, entity);
      }
    }
    
    // Pattern 3: Wrappers factory with class param: Wrappers.lambdaQuery(User.class)
    const decl3 = /(?:^|[;\n])\s*(?:final\s+)?(?:var|\w+)\s+(\w+)\s*=\s*Wrappers\s*\.\s*(?:lambdaQuery|lambdaUpdate)\s*\(\s*([\w.$]+)\s*\.class\s*\)/g;
    while ((match = decl3.exec(methodBody)) !== null) {
      const varName = match[1];
      const entity = match[2].split('.').pop() || '';
      if (entity && varName) {
        wrapperVars.set(varName, entity);
      }
    }
    
    return wrapperVars;
  }
  
  /**
   * ENHANCED B2: Extract entity from Wrappers factory direct chain calls
   * Handles:
   * - Wrappers.<User>lambdaQuery().eq(...)
   * - Wrappers.lambdaQuery(User.class).eq(...)
   * Returns: Entity name if found, undefined otherwise
   */
  private detectWrappersChainEntity(methodBody: string): string | undefined {
    // Pattern 1: Wrappers.<User>lambdaQuery()
    const typeParamMatch = methodBody.match(/Wrappers\s*\.\s*<\s*([\w.$]+)\s*>\s*(?:lambdaQuery|lambdaUpdate|query|update)\s*\(/);
    if (typeParamMatch) {
      return typeParamMatch[1].split('.').pop() || undefined;
    }
    
    // Pattern 2: Wrappers.lambdaQuery(User.class)
    const classParamMatch = methodBody.match(/Wrappers\s*\.\s*(?:lambdaQuery|lambdaUpdate)\s*\(\s*([\w.$]+)\s*\.class/);
    if (classParamMatch) {
      return classParamMatch[1].split('.').pop() || undefined;
    }
    
    return undefined;
  }

  /**
   * Extract query conditions from QueryWrapper/LambdaQueryWrapper chain in method body
   * Patterns:
   * - lambdaQuery().eq(User::getStatus, status)
   * - new QueryWrapper<User>().eq("status", status)
   * - this.lambdaQuery().like(User::getName, name)
   * ENHANCED: Also extracts conditions from wrapper variable calls (qw.eq(...))
   * FIXED: Only extracts WHERE conditions, not orderBy/groupBy/set (use extractQueryExtras for those)
   * FIXED: Now actually uses detectWrapperVariables() for variable-style calls
   */
  private extractQueryConditions(methodBody: string): QueryCondition[] {
    const conditions: QueryCondition[] = [];
    
    // FIXED: Detect wrapper variables for variable-style calls (qw.eq(...))
    const wrapperVars = this.detectWrapperVariables(methodBody);
    
    // WHERE condition operators only (not orderBy/groupBy/set)
    const whereOperators = [
      // Comparison
      'eq', 'ne', 'gt', 'ge', 'lt', 'le',
      // String matching
      'like', 'likeLeft', 'likeRight', 'notLike', 'notLikeLeft', 'notLikeRight',
      // Collection
      'in', 'notIn', 'between', 'notBetween',
      // Null checks
      'isNull', 'isNotNull',
      // Existence
      'exists', 'notExists',
    ];
    
    // A) Chain-style: .eq( - already covers lambdaQuery().eq(), this.lambdaQuery().eq(), etc.
    const opPattern = new RegExp(`\\.(${whereOperators.join('|')})\\s*\\(`, 'g');
    let opMatch;
    
    while ((opMatch = opPattern.exec(methodBody)) !== null) {
      const op = opMatch[1] as QueryCondition['op'];
      const parenStart = opMatch.index + opMatch[0].length - 1; // Position of '('
      
      // FIXED: Extract balanced parentheses content instead of using [^)]+
      // This correctly handles nested expressions like: list.stream().map(...).collect(...)
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (!argsResult.success) continue;
      const argsContent = argsResult.content;
      
      // Parse the arguments
      const condition = this.parseQueryConditionArgs(op, argsContent);
      if (condition) {
        // Avoid duplicates (same field and op)
        if (!conditions.some(c => c.field === condition.field && c.op === condition.op)) {
          conditions.push(condition);
        }
      }
    }
    
    // B) Variable-style: qw.eq( / lqw.like( - uses detected wrapper variable names
    // This covers the common pattern: QueryWrapper<User> qw = ...; qw.eq(...);
    if (wrapperVars.size > 0) {
      const varAlternation = Array.from(wrapperVars.keys())
        .map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // escape regex special chars
        .join('|');
      
      const varOpPattern = new RegExp(`\\b(?:${varAlternation})\\s*\\.\\s*(${whereOperators.join('|')})\\s*\\(`, 'g');
      let varMatch: RegExpExecArray | null;
      
      while ((varMatch = varOpPattern.exec(methodBody)) !== null) {
        const op = varMatch[1] as QueryCondition['op'];
        const parenStart = varMatch.index + varMatch[0].length - 1;
        const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
        if (!argsResult.success) continue;
        
        const condition = this.parseQueryConditionArgs(op, argsResult.content);
        if (condition && !conditions.some(c => c.field === condition.field && c.op === condition.op)) {
          conditions.push(condition);
        }
      }
    }
    
    return conditions;
  }
  
  /**
   * ENHANCED: Extract query extras (orderBy, groupBy, having, set) from method body
   * These are separate from WHERE conditions as they have different semantics
   */
  private extractQueryExtras(methodBody: string): QueryExtra[] {
    const extras: QueryExtra[] = [];
    
    // Pattern: .orderByAsc(User::getId) or .orderByAsc("id")
    const orderAscPattern = /\.orderByAsc\s*\(/g;
    let match;
    while ((match = orderAscPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        const fields = this.extractFieldsFromArgs(argsResult.content);
        if (fields.length > 0) {
          extras.push({ type: 'orderBy', fields, hint: 'ASC' });
        }
      }
    }
    
    // Pattern: .orderByDesc(User::getId)
    const orderDescPattern = /\.orderByDesc\s*\(/g;
    while ((match = orderDescPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        const fields = this.extractFieldsFromArgs(argsResult.content);
        if (fields.length > 0) {
          extras.push({ type: 'orderBy', fields, hint: 'DESC' });
        }
      }
    }
    
    // Pattern: .orderBy(true, true, User::getId) - (condition, isAsc, column...)
    const orderByPattern = /\.orderBy\s*\(/g;
    while ((match = orderByPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        const argList = this.splitTopLevelArgs(argsResult.content);
        // orderBy(condition, isAsc, columns...) - skip first two args
        if (argList.length >= 3) {
          const isAsc = argList[1].trim();
          const fields = this.extractFieldsFromArgs(argList.slice(2).join(','));
          if (fields.length > 0) {
            extras.push({ type: 'orderBy', fields, hint: isAsc === 'true' ? 'ASC' : 'DESC' });
          }
        }
      }
    }
    
    // Pattern: .groupBy(User::getStatus)
    const groupByPattern = /\.groupBy\s*\(/g;
    while ((match = groupByPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        const fields = this.extractFieldsFromArgs(argsResult.content);
        if (fields.length > 0) {
          extras.push({ type: 'groupBy', fields });
        }
      }
    }
    
    // Pattern: .set(User::getStatus, 1)
    const setPattern = /\.set\s*\(/g;
    while ((match = setPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        const fields = this.extractFieldsFromArgs(argsResult.content);
        if (fields.length > 0) {
          extras.push({ type: 'set', fields });
        }
      }
    }
    
    // ENHANCED: Pattern: .setSql("status = 1") - raw SQL set
    const setSqlPattern = /\.setSql\s*\(/g;
    while ((match = setSqlPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        // setSql contains raw SQL, put in hint (fields not reliably extractable)
        extras.push({ type: 'set', fields: [], hint: this.simplifyValueHint(argsResult.content) });
      }
    }
    
    // ENHANCED: Pattern: .having("sum(amount) > {0}", value) - HAVING clause
    const havingPattern = /\.having\s*\(/g;
    while ((match = havingPattern.exec(methodBody)) !== null) {
      const parenStart = match.index + match[0].length - 1;
      const argsResult = this.extractBalancedParenContent(methodBody, parenStart);
      if (argsResult.success) {
        // having contains raw SQL condition, put in hint (fields not reliably extractable)
        extras.push({ type: 'having', fields: [], hint: this.simplifyValueHint(argsResult.content) });
      }
    }
    
    return extras;
  }
  
  /**
   * Helper: Extract field names from comma-separated args (lambda or string style)
   */
  private extractFieldsFromArgs(argsContent: string): string[] {
    const fields: string[] = [];
    const argList = this.splitTopLevelArgs(argsContent);
    
    for (const arg of argList) {
      const trimmed = arg.trim();
      // Lambda method reference: User::getStatus -> status
      const lambdaMatch = trimmed.match(/^([\w]+)::(get|is)(\w+)$/);
      if (lambdaMatch) {
        let fieldName = lambdaMatch[3];
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        fields.push(fieldName);
        continue;
      }
      // String column: "status" or 'status'
      const stringMatch = trimmed.match(/^["']([\w]+)["']$/);
      if (stringMatch) {
        fields.push(stringMatch[1]);
      }
    }
    
    return fields;
  }
  
  /**
   * Parse query condition arguments from extracted content
   * Handles both lambda style (User::getStatus) and string style ("status")
   * ENHANCED: Also handles 3-arg overload: .eq(condition, column, value)
   */
  private parseQueryConditionArgs(op: string, argsContent: string): QueryCondition | null {
    // Trim whitespace
    const args = argsContent.trim();
    if (!args) return null;
    
    // Split args by top-level commas to detect overload type
    const argList = this.splitTopLevelArgs(args);
    
    // ENHANCED: Handle 3-arg overload: .eq(condition, User::getStatus, value)
    // First arg is boolean condition, second is column, third is value
    // This is very common: .eq(StringUtils.isNotBlank(name), User::getName, name)
    if (argList.length >= 2) {
      // Check if second arg looks like a method reference or string column
      const secondArg = argList.length >= 2 ? argList[1].trim() : '';
      const thirdArg = argList.length >= 3 ? argList[2].trim() : '';
      
      // Pattern: condition, Entity::getField, value (3-arg)
      const lambda3Match = secondArg.match(/^([\w]+)::(get|is)(\w+)$/);
      if (lambda3Match) {
        let fieldName = lambda3Match[3];
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        return {
          field: fieldName,
          op: op as QueryCondition['op'],
          valueHint: thirdArg ? this.simplifyValueHint(thirdArg) : undefined,
        };
      }
      
      // Pattern: condition, "columnName", value (3-arg with string column)
      const string3Match = secondArg.match(/^["']([\w]+)["']$/);
      if (string3Match) {
        return {
          field: string3Match[1],
          op: op as QueryCondition['op'],
          valueHint: thirdArg ? this.simplifyValueHint(thirdArg) : undefined,
        };
      }
    }
    
    // Pattern 1: Lambda method reference - User::getStatus or User::isDeleted (2-arg)
    const firstArg = argList[0]?.trim() || '';
    const lambdaMatch = firstArg.match(/^([\w]+)::(get|is)(\w+)$/);
    if (lambdaMatch) {
      // Convert getXxx/isXxx to xxx (camelCase)
      let fieldName = lambdaMatch[3];
      fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
      const valueArg = argList.length >= 2 ? argList[1]?.trim() : undefined;
      
      return {
        field: fieldName,
        op: op as QueryCondition['op'],
        valueHint: valueArg ? this.simplifyValueHint(valueArg) : undefined,
      };
    }
    
    // Pattern 2: String column name - "status" or 'status' (2-arg)
    const stringMatch = firstArg.match(/^["']([\w]+)["']$/);
    if (stringMatch) {
      const valueArg = argList.length >= 2 ? argList[1]?.trim() : undefined;
      
      return {
        field: stringMatch[1],
        op: op as QueryCondition['op'],
        valueHint: valueArg ? this.simplifyValueHint(valueArg) : undefined,
      };
    }
    
    return null;
  }
  
  /**
   * Split arguments by top-level commas, respecting nested structures
   * E.g., "a, b.foo(x, y), c" -> ["a", "b.foo(x, y)", "c"]
   */
  private splitTopLevelArgs(argsStr: string): string[] {
    const result: string[] = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let inChar = false;
    
    for (let pos = 0; pos < argsStr.length; pos++) {
      const char = argsStr[pos];
      const prevChar = pos > 0 ? argsStr[pos - 1] : '';
      
      // Handle escape
      if (prevChar === '\\' && (inString || inChar)) {
        continue;
      }
      
      if (char === '"' && !inChar) {
        inString = !inString;
      } else if (char === "'" && !inString) {
        inChar = !inChar;
      }
      
      if (!inString && !inChar) {
        if (char === '(' || char === '[' || char === '{' || char === '<') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}' || char === '>') {
          depth--;
        } else if (char === ',' && depth === 0) {
          result.push(argsStr.substring(start, pos).trim());
          start = pos + 1;
        }
      }
    }
    
    // Add last segment
    if (start < argsStr.length) {
      result.push(argsStr.substring(start).trim());
    }
    
    return result;
  }
  
  /**
   * Extract the first argument from a comma-separated list, handling nested parens
   * E.g., "list.stream().map(x -> x.getId()).collect(Collectors.toList())" -> same string (one arg)
   * E.g., "value1, value2" -> "value1"
   */
  private extractFirstArg(argsStr: string): string {
    let depth = 0;
    let pos = 0;
    let inString = false;
    let inChar = false;
    
    while (pos < argsStr.length) {
      const char = argsStr[pos];
      const prevChar = pos > 0 ? argsStr[pos - 1] : '';
      
      // Handle escape
      if (prevChar === '\\' && (inString || inChar)) {
        pos++;
        continue;
      }
      
      if (char === '"' && !inChar) {
        inString = !inString;
      } else if (char === "'" && !inString) {
        inChar = !inChar;
      }
      
      if (!inString && !inChar) {
        if (char === '(' || char === '[' || char === '{' || char === '<') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}' || char === '>') {
          depth--;
        } else if (char === ',' && depth === 0) {
          // Found top-level comma, return everything before it
          return argsStr.substring(0, pos).trim();
        }
      }
      
      pos++;
    }
    
    // No comma found, return the whole string
    return argsStr.trim();
  }

  /**
   * Simplify value hint to show only the essential part
   * Examples:
   * - "dto.getStatus()" -> "dto.status"
   * - "userVO.getName()" -> "userVO.name"
   * - "Constants.ACTIVE" -> "Constants.ACTIVE"
   * - Simple param name -> keep as is
   */
  private simplifyValueHint(value: string): string {
    // Remove getter call pattern: .getXxx() -> .xxx
    let simplified = value.replace(/\.get(\w+)\(\)/g, (_, prop) => {
      return '.' + prop.charAt(0).toLowerCase() + prop.slice(1);
    });
    
    // Truncate if too long
    if (simplified.length > 30) {
      simplified = simplified.substring(0, 27) + '...';
    }
    
    return simplified;
  }

  /**
   * Detect CRUD operation types from method body
   * ENHANCED: Comprehensive MyBatis-Plus CRUD pattern coverage
   * ENHANCED: Support various caller prefixes (this., baseMapper., userMapper., getBaseMapper()., etc.)
   */
  private detectCrudOperations(methodBody: string): ('select' | 'insert' | 'update' | 'delete')[] {
    const crud: ('select' | 'insert' | 'update' | 'delete')[] = [];
    
    // ENHANCED: Common caller prefixes for MP methods
    // Matches: this., baseMapper., super.baseMapper., getBaseMapper()., xxxxMapper.
    const callerPrefix = '(?:this\\.|super\\.baseMapper\\.|getBaseMapper\\(\\)\\.|baseMapper\\.|\\w+Mapper\\.)?';
    
    // MyBatis-Plus CRUD patterns - comprehensive list with flexible caller prefix
    const patterns = {
      select: [
        // BaseMapper select methods
        new RegExp(`${callerPrefix}selectById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectBatchIds\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectByMap\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectList\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectOne\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectPage\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectCount\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectMaps\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectMapsPage\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}selectObjs\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}exists\\s*\\(`, 'g'),
        // IService query methods
        new RegExp(`${callerPrefix}getById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}getOne\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}getMap\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}getObj\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}getOptById\\s*\\(`, 'g'),  // ADDED: Optional get
        new RegExp(`${callerPrefix}listByIds\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}listByMap\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}listMaps\\s*\\(`, 'g'),    // ADDED
        new RegExp(`${callerPrefix}list\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}page\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}pageMaps\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}count\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}lambdaQuery\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}query\\s*\\(\\)`, 'g'),
        // Wrapper types indicate read intent
        /QueryWrapper/,
        /LambdaQueryWrapper/,
      ],
      insert: [
        new RegExp(`${callerPrefix}insert\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}save\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}saveBatch\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}saveOrUpdate\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}saveOrUpdateBatch\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}insertBatchSomeColumn\\s*\\(`, 'g'),
      ],
      update: [
        new RegExp(`${callerPrefix}updateById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}update\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}updateBatchById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}lambdaUpdate\\s*\\(`, 'g'),
        /UpdateWrapper/,
        /LambdaUpdateWrapper/,
      ],
      delete: [
        // BaseMapper delete methods
        new RegExp(`${callerPrefix}deleteById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}deleteBatchIds\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}deleteByMap\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}delete\\s*\\(`, 'g'),
        // IService remove methods
        new RegExp(`${callerPrefix}removeById\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}removeByIds\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}removeByMap\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}remove\\s*\\(`, 'g'),
        new RegExp(`${callerPrefix}removeBatchByIds\\s*\\(`, 'g'),
      ],
    };
    
    for (const [op, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (pattern.test(methodBody)) {
          if (!crud.includes(op as any)) {
            crud.push(op as any);
          }
          break;
        }
      }
    }
    
    return crud;
  }

  /**
   * Extract MyBatis-Plus query documentation for all service methods
   */
  private extractMyBatisPlusQueryDocs(): void {
    // Build entity -> tableName map from mybatisPlusModels
    const entityToTable = new Map<string, string>();
    for (const model of this.mybatisPlusModels) {
      if (model.tableName) {
        entityToTable.set(model.entity, model.tableName);
      }
    }
    
    // Find entity for each service class
    const serviceToEntity = new Map<string, string>();
    for (const model of this.mybatisPlusModels) {
      if (model.service) {
        serviceToEntity.set(model.service, model.entity);
      }
    }
    
    // Process all service classes
    for (const cls of this.allClasses) {
      if (cls.type !== 'service') continue;
      
      // Find the entity for this service
      let entityName = serviceToEntity.get(cls.name);
      
      // If not found in models, try to infer from ServiceImpl generic
      if (!entityName) {
        const parsed = this.parseServiceImplGeneric(cls.rawHeader);
        if (parsed) {
          entityName = parsed.entity;
        }
      }
      
      const tableName = entityName ? entityToTable.get(entityName) : undefined;
      
      // Process each method with keySnippets containing MP patterns
      for (const method of cls.methods) {
        // FIXED: Use cached rawBody from ClassMethodInfo instead of regex-based re-extraction
        // This avoids issues with duplicate methods, overloads, and weak regex matching
        const methodBody = method.rawBody;
        if (!methodBody) continue;
        
        // ENHANCED F: Performance - skip methods without any MP keywords
        if (!methodBody.includes('QueryWrapper') && 
            !methodBody.includes('LambdaQueryWrapper') &&
            !methodBody.includes('UpdateWrapper') &&
            !methodBody.includes('LambdaUpdateWrapper') &&
            !methodBody.includes('Wrappers') &&
            !methodBody.includes('lambdaQuery') &&
            !methodBody.includes('lambdaUpdate') &&
            !methodBody.includes('::get') &&
            !methodBody.includes('::is')) {
          continue;
        }
        
        // ENHANCED: Double-check gating - keySnippets may have false positives
        // Verify method body actually contains MP-specific patterns
        const hasMpPatterns = method.keySnippets?.some(s => 
          s.kind === 'mpCrud' || s.kind === 'mpQueryWrapper' || s.kind === 'mpUpdateWrapper'
        );
        
        // ENHANCED: Secondary verification - check for actual MP method calls
        // This reduces false positives from keySnippets matching non-MP patterns
        const hasMpMethodCalls = this.hasMybatisPlusMethodCalls(methodBody);
        
        // Only process if BOTH keySnippets indicate MP AND actual MP calls found
        // OR if strong MP calls are found even without keySnippets (fallback)
        if (!hasMpPatterns && !hasMpMethodCalls) continue;
        
        // ENHANCED B2: Try to extract entity from Wrappers direct chain (higher priority)
        const wrappersEntity = this.detectWrappersChainEntity(methodBody);
        
        // ENHANCED: Fallback - use wrapper variable declaration to infer entity
        // Covers: QueryWrapper<User> qw = ...; qw.eq(...);
        const wrapperVars = this.detectWrapperVariables(methodBody);
        // Get first wrapper entity (if unique or only one exists)
        let wrapperVarEntity: string | undefined;
        if (wrapperVars.size === 1) {
          wrapperVarEntity = wrapperVars.values().next().value as string;
        } else if (wrapperVars.size > 1) {
          // Multiple wrappers - check if they all refer to same entity
          const entities = new Set(wrapperVars.values());
          if (entities.size === 1) {
            wrapperVarEntity = entities.values().next().value as string;
          }
          // If different entities, don't set - ambiguous
        }
        
        // Priority: wrappersEntity > entityName > wrapperVarEntity
        const effectiveEntity = wrappersEntity || entityName || wrapperVarEntity;
        const effectiveTable = effectiveEntity ? entityToTable.get(effectiveEntity) : undefined;
        
        // Extract query conditions (B1: now also supports wrapper variable calls)
        const conditions = this.extractQueryConditions(methodBody);
        
        // ENHANCED: Extract query extras (orderBy, groupBy, set) separately
        const extras = this.extractQueryExtras(methodBody);
        
        // Detect CRUD operations
        const crud = this.detectCrudOperations(methodBody);
        
        // Only add if we found meaningful conditions, extras, or CRUD operations
        if (conditions.length > 0 || extras.length > 0 || crud.length > 0) {
          this.mybatisPlusQueryDocs.push({
            className: cls.name,
            methodName: method.name,
            entity: effectiveEntity,
            tableName: effectiveTable,
            conditions,
            extras: extras.length > 0 ? extras : undefined,
            crud,
          });
        }
      }
    }
  }

  /**
   * ENHANCED: Check if method body contains actual MyBatis-Plus method calls
   * This provides secondary verification to reduce false positives from keySnippets
   * FIXED: Method references (::getXxx) alone don't count - must be with MP context
   */
  private hasMybatisPlusMethodCalls(methodBody: string): boolean {
    // Strong indicators of MP usage - these are very specific to MP
    const strongMpPatterns = [
      // Wrapper creation patterns (very specific to MP)
      /new\s+(?:Lambda)?QueryWrapper\s*[<(]/,
      /new\s+(?:Lambda)?UpdateWrapper\s*[<(]/,
      /\.lambdaQuery\s*\(/,
      /\.lambdaUpdate\s*\(/,
      // IService query/update methods (specific to MP)
      /\.query\s*\(\)\./,   // .query().xxx - must be chained
      /\.update\s*\(\)\./,  // .update().xxx - must be chained
      // BaseMapper/IService specific methods (unique to MP)
      /\.selectBatchIds\s*\(/,
      /\.selectByMap\s*\(/,
      /\.deleteBatchIds\s*\(/,
      /\.removeByIds\s*\(/,
      /\.listByIds\s*\(/,
      /\.listByMap\s*\(/,
      /\.saveOrUpdateBatch\s*\(/,
      /\.getBaseMapper\s*\(/,
    ];
    
    // First check strong patterns - if any match, it's definitely MP
    for (const pattern of strongMpPatterns) {
      if (pattern.test(methodBody)) {
        return true;
      }
    }
    
    // FIXED: Method reference alone (User::getId) is NOT enough - could be Stream API
    // Only count as MP if BOTH method reference AND chain call pattern exist
    const hasMethodReference = /\w+::(get|is)\w+/.test(methodBody);
    const hasChainCall = /\.(?:eq|ne|gt|ge|lt|le|like|in|between|isNull|isNotNull|orderByAsc|orderByDesc|set)\s*\(/.test(methodBody);
    
    // Both must be present for method reference to indicate MP
    if (hasMethodReference && hasChainCall) {
      return true;
    }
    
    return false;
  }

  // ==================== End MyBatis-Plus Enhanced Support ====================
}

/**
 * Scan a project directory and extract implementation details
 */
export async function scanCodebase(options: ScanOptions): Promise<ScanResult> {
  const scanner = new CodeScanner(options);
  return scanner.scan();
}
