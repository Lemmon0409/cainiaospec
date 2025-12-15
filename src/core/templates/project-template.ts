import type { 
  ClassInfo, 
  ApiEndpoint, 
  BusinessLogicInfo,
  CodeStyleInfo,
  ProjectStructure,
  ClassDependency,
} from '../code-scanner.js';

export interface ProjectContext {
  projectName?: string;
  description?: string;
  techStack?: string[];
  conventions?: string;
  withImplGuide?: boolean;
  directoryStructure?: DirectoryMapping[];
  frameworks?: string[];
  // Enhanced: Include scanned class information
  allClasses?: ClassInfo[];
  // Enhanced: Include API documentation
  apiDocumentation?: ApiEndpoint[];
  // Enhanced: Include business logic
  businessLogic?: BusinessLogicInfo[];
  // Enhanced: Include code style patterns
  codeStylePatterns?: CodeStyleInfo;
  // Enhanced: Project structure
  projectStructure?: ProjectStructure;
  // Enhanced: Class dependencies
  classDependencies?: ClassDependency[];
}

export interface DirectoryMapping {
  path: string;
  purpose: string;
  responsibilities: string[];
  examples?: string[];
}

export const projectTemplate = (context: ProjectContext = {}) => {
  const baseTemplate = `# ${context.projectName || '项目'} 上下文

## 项目目的
${context.description || '[描述项目的目的和目标]'}

## 技术栈
${context.techStack?.length ? context.techStack.map(tech => `- ${tech}`).join('\n') : '- [列出主要技术]\n- [例如: TypeScript, React, Node.js]'}

## 项目规范

### 代码风格
[描述代码风格偏好、格式化规则和命名约定]

### 架构模式
[记录架构决策和模式]

### 测试策略
[说明测试方法和要求]

### Git 工作流
[描述分支策略和提交规范]

## 领域上下文
[添加 AI 助手需要了解的领域特定知识]

## 重要约束
[列出技术、业务或法规约束]

## 外部依赖
[记录关键外部服务、API 或系统]
`;

  if (!context.withImplGuide) {
    return baseTemplate;
  }

  const implGuideSection = generateImplGuideSection(context);
  return baseTemplate + '\n' + implGuideSection;
};

function generateImplGuideSection(context: ProjectContext): string {
  const sections: string[] = [];

  // Enhanced: Project Structure (Maven/Gradle modules)
  if (context.projectStructure && context.projectStructure.modules.length > 0) {
    sections.push(generateProjectStructureSection(context.projectStructure));
  }

  // Directory Structure Mapping
  sections.push(`## 实现指南

### 目录结构与职责

本节映射目录及其目的和职责，帮助 AI 助手了解在哪里查找和放置代码.

${generateDirectoryTable(context.directoryStructure)}
`);

  // Layered Architecture Rules
  sections.push(`### 分层架构依赖关系

遵循以下依赖规则以维护清晰架构：

- **Controllers/Routes** → Services → Repositories → Entities
- **Services** 可以导入: Repositories, Entities, DTOs, Utilities
- **Services** 不能导入: Controllers, Routes
- **Repositories** 可以导入: Entities, 数据库连接
- **Repositories** 不能导入: Services, Controllers
- **Entities** 不应导入其他层（领域模型是独立的）
`);

  // Framework Conventions
  if (context.frameworks && context.frameworks.length > 0) {
    sections.push(generateFrameworkConventions(context.frameworks));
  }

  // File Naming Conventions
  sections.push(`### 文件命名约定

遵循以下命名模式以保持一致性：

- **Entities/Models**: \`user.entity.ts\`, \`product.model.ts\`
- **DTOs**: \`create-user.dto.ts\`, \`update-product.dto.ts\`
- **Services**: \`user.service.ts\`, \`email.service.ts\`
- **Controllers**: \`user.controller.ts\`, \`auth.controller.ts\`
- **Repositories**: \`user.repository.ts\`, \`product.repository.ts\`
- **Middleware**: \`auth.middleware.ts\`, \`logging.middleware.ts\`
- **Utils**: \`date.util.ts\`, \`validation.util.ts\`
- **Constants**: \`user.constants.ts\`, \`app.constants.ts\`
- **Types**: \`user.types.ts\`, \`api.types.ts\`
- **Interfaces**: \`user.interface.ts\`, \`repository.interface.ts\`
`);

  // Code Organization Examples
  sections.push(`### 代码组织示例

典型模块结构：

\`\`\`
src/
├── modules/
│   └── user/
│       ├── user.entity.ts          # 数据模型定义
│       ├── user.repository.ts      # 数据访问层
│       ├── user.service.ts         # 业务逻辑
│       ├── user.controller.ts      # HTTP 端点
│       ├── dto/
│       │   ├── create-user.dto.ts  # 请求验证
│       │   └── user-response.dto.ts
│       ├── user.types.ts           # 类型定义
│       └── user.constants.ts       # 模块常量
├── shared/
│   ├── decorators/                 # 自定义装饰器
│   ├── guards/                     # 认证/授权
│   ├── interceptors/               # 请求/响应转换
│   ├── filters/                    # 异常处理
│   └── pipes/                      # 验证管道
└── config/                         # 配置文件
\`\`\`
`);

  // Enhanced: Add code style documentation if available
  if (context.codeStylePatterns) {
    sections.push(generateCodeStyleSection(context.codeStylePatterns));
  }

  // Enhanced: Add class dependencies documentation
  if (context.classDependencies && context.classDependencies.length > 0) {
    sections.push(generateClassDependenciesSection(context.classDependencies));
  }

  // Enhanced: Add class definitions documentation
  if (context.allClasses && context.allClasses.length > 0) {
    // First, generate entity database mappings if present
    const entities = context.allClasses.filter(c => c.type === 'entity');
    if (entities.length > 0) {
      sections.push(generateEntityDatabaseMappings(entities));
    }
    
    sections.push(generateClassDocumentation(context.allClasses));
  }

  // Enhanced: Add API documentation
  if (context.apiDocumentation && context.apiDocumentation.length > 0) {
    sections.push(generateApiDocumentation(context.apiDocumentation));
  }

  // Enhanced: Add business logic documentation
  if (context.businessLogic && context.businessLogic.length > 0) {
    sections.push(generateBusinessLogicDocumentation(context.businessLogic));
  }

  // Enhanced: Add AI completion tasks
  if (context.allClasses && context.allClasses.length > 0) {
    sections.push(generateAICompletionTasks(context.allClasses));
  }

  return sections.join('\n');
}

// Enhanced: Generate project structure section
function generateProjectStructureSection(structure: ProjectStructure): string {
  const sections: string[] = [`## 项目结构\n`];

  // Project type
  const typeLabels = {
    maven: 'Maven 多模块项目',
    gradle: 'Gradle 多模块项目',
    npm: 'NPM 项目',
    monorepo: 'Monorepo',
    single: '单体项目',
  };
  
  sections.push(`**项目类型**: ${typeLabels[structure.type]}\n`);

  // Module overview
  sections.push(`### 模块概览\n`);
  sections.push(`| 模块名 | 路径 | 类型 | 包名 | 依赖模块 |`);
  sections.push(`|---------|------|------|------|----------|`);

  for (const module of structure.modules) {
    // 跳过 starter 模块
    if (module.name.toLowerCase().includes('starter')) {
      continue;
    }
    
    const typeLabels = {
      api: 'API层',
      biz: '业务层',
      dal: '数据层',
      web: 'Web层',
      common: '公共库',
      other: '其他',
    };
    const deps = module.dependencies.length > 0 ? module.dependencies.join(', ') : '-';
    const pkg = module.packageName || '-';
    sections.push(`| \`${module.name}\` | \`${module.path}\` | ${typeLabels[module.type]} | \`${pkg}\` | ${deps} |`);
  }

  sections.push('');

  // Module dependencies graph
  if (structure.dependencies.length > 0) {
    sections.push(`### 模块依赖关系\n`);
    sections.push(`\`\`\``);
    
    // Build dependency tree
    const depTree = new Map<string, string[]>();
    for (const dep of structure.dependencies) {
      if (!depTree.has(dep.from)) {
        depTree.set(dep.from, []);
      }
      depTree.get(dep.from)!.push(dep.to);
    }

    for (const [from, tos] of depTree) {
      // 跳过 starter 模块
      if (from.toLowerCase().includes('starter')) {
        continue;
      }
      sections.push(`${from}`);
      for (const to of tos) {
        sections.push(`  └→ ${to}`);
      }
    }

    sections.push(`\`\`\`\n`);
  }

  // Module purpose guide
  sections.push(`### 模块职责说明\n`);
  sections.push(`**在添加新功能时，请根据以下指导选择正确的模块：**\n`);
  sections.push(`- **API层模块** (\`*-api\`): 定义对外接口、DTO、枚举、常量`);
  sections.push(`- **业务层模块** (\`*-biz\`, \`*-service\`): 实现业务逻辑、Service、Manager`);
  sections.push(`- **数据层模块** (\`*-dal\`, \`*-dao\`): 实体类、Mapper/Repository、数据库操作`);
  sections.push(`- **Web层模块** (\`*-web\`, \`*-controller\`): Controller、过滤器、拦截器`);
  sections.push(`- **公共模块** (\`*-common\`, \`*-kernel\`): 工具类、公共依赖\n`);

  return sections.join('\n');
}

// Enhanced: Generate code style documentation from detected patterns
function generateCodeStyleSection(codeStyle: CodeStyleInfo): string {
  const sections: string[] = [`## 代码风格与规范\n`];

  // Naming Conventions
  if (codeStyle.namingConventions.length > 0) {
    sections.push(`### 命名约定\n`);
    for (const conv of codeStyle.namingConventions) {
      sections.push(`- **${conv.type}**: ${conv.pattern}`);
      if (conv.examples.length > 0) {
        sections.push(`  - 示例: \`${conv.examples.join('\`, \`')}\``);
      }
    }
    sections.push('');
  }

  // File Patterns
  if (codeStyle.filePatterns.length > 0) {
    sections.push(`### 文件命名模式\n`);
    sections.push(`| 模式 | 数量 | 示例 |`);
    sections.push(`|---------|-------|----------|`);
    for (const pattern of codeStyle.filePatterns.slice(0, 10)) {
      sections.push(`| \`${pattern.pattern}\` | ${pattern.count} | ${pattern.examples.join(', ')} |`);
    }
    sections.push('');
  }

  // Decorator Usage
  if (codeStyle.decoratorUsage.length > 0) {
    sections.push(`### 装饰器使用情况\n`);
    sections.push(`| 装饰器 | 使用次数 | 使用位置 |`);
    sections.push(`|-----------|-------------|---------|`);
    for (const dec of codeStyle.decoratorUsage.slice(0, 10)) {
      sections.push(`| \`@${dec.name}\` | ${dec.count} | ${dec.usedIn.slice(0, 3).join(', ')} |`);
    }
    sections.push('');
  }

  // Common Imports
  if (codeStyle.commonImports.length > 0) {
    sections.push(`### 常用依赖\n`);
    sections.push(`频繁导入的模块：\n`);
    for (const imp of codeStyle.commonImports) {
      sections.push(`- \`${imp}\``);
    }
    sections.push('');
  }

  return sections.join('\n');
}

// Enhanced: Generate class dependencies section
function generateClassDependenciesSection(dependencies: ClassDependency[]): string {
  const sections: string[] = [`## 类依赖关系\n`];
  sections.push(`本节显示类之间的调用关系,帮助 AI 理解代码的执行流程。\n`);

  // Filter important dependencies (controllers with call chains)
  const importantDeps = dependencies.filter(d => d.callChain && d.callChain.length > 1);

  if (importantDeps.length > 0) {
    sections.push(`### 典型调用链\n`);
    sections.push(`以下是主要的调用链路，显示了请求如何在各层之间流转：\n`);

    for (const dep of importantDeps.slice(0, 15)) {
      if (dep.callChain) {
        const chain = dep.callChain.map(c => `\`${c}\``).join(' → ');
        sections.push(`- ${chain}`);
      }
    }

    sections.push('');
  }

  // Dependency matrix for key services
  const services = dependencies.filter(d => d.type === 'service');
  if (services.length > 0 && services.length <= 20) {
    sections.push(`### 服务依赖矩阵\n`);
    sections.push(`| 服务 | 依赖的类 | 被谁使用 |`);
    sections.push(`|------|----------|----------|`);

    for (const service of services.slice(0, 15)) {
      const deps = service.directDependencies.length > 0 
        ? service.directDependencies.slice(0, 3).map(d => `\`${d}\``).join(', ')
        : '-';
      const usedBy = service.usedBy.length > 0
        ? service.usedBy.slice(0, 3).map(u => `\`${u}\``).join(', ')
        : '-';
      sections.push(`| \`${service.className}\` | ${deps} | ${usedBy} |`);
    }

    sections.push('');
  }

  return sections.join('\n');
}

// Enhanced: Generate class documentation
function generateClassDocumentation(classes: ClassInfo[]): string {
  const sections: string[] = [`## 类定义\n`];

  // Group classes by type
  const classGroups: Record<string, ClassInfo[]> = {};
  for (const cls of classes) {
    if (!classGroups[cls.type]) {
      classGroups[cls.type] = [];
    }
    classGroups[cls.type].push(cls);
  }

  const typeOrder = ['entity', 'controller', 'service', 'repository', 'dto', 'middleware', 'guard', 'utility', 'other'];
  const typeLabels: Record<string, string> = {
    entity: '实体类（数据模型）',
    controller: '控制器（API 端点）',
    service: '服务类（业务逻辑）',
    repository: '仓储类（数据访问）',
    dto: 'DTO（数据传输对象）',
    middleware: '中间件',
    guard: '守卫（授权）',
    utility: '工具类',
    other: '其他类',
  };

  for (const type of typeOrder) {
    const group = classGroups[type];
    if (!group || group.length === 0) continue;

    sections.push(`### ${typeLabels[type]}\n`);

    for (const cls of group) {
      sections.push(`#### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      if (cls.description) {
        sections.push(`- **描述**: ${cls.description}`);
      }
      if (cls.extends) {
        sections.push(`- **继承**: \`${cls.extends}\``);
      }
      if (cls.implements && cls.implements.length > 0) {
        sections.push(`- **实现**: \`${cls.implements.join('\`, \`')}\``);
      }
      if (cls.dependencies.length > 0) {
        sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
      }

      // Fields table
      if (cls.fields.length > 0) {
        sections.push(`\n**字段：**\n`);
        sections.push(`| 字段 | 类型 | 描述 | 装饰器 |`);
        sections.push(`|-------|------|-------------|------------|`);
        for (const field of cls.fields) {
          const decorators = field.decorators.length > 0 ? `@${field.decorators.join(', @')}` : '-';
          const desc = field.description || '-';
          const optional = field.optional ? '?' : '';
          sections.push(`| \`${field.name}${optional}\` | \`${field.type}\` | ${desc} | ${decorators} |`);
        }
      }

      // Methods table
      const publicMethods = cls.methods.filter(m => m.visibility !== 'private');
      if (publicMethods.length > 0) {
        sections.push(`\n**方法：**\n`);
        sections.push(`| 方法 | 参数 | 返回类型 | 描述 |`);
        sections.push(`|--------|------------|-------------|-------------|`);
        for (const method of publicMethods) {
          const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
          const desc = method.description || method.businessLogic || '-';
          const returnType = method.returnType || 'void';
          sections.push(`| \`${method.name}()\` | \`${params || '-'}\` | \`${returnType}\` | ${desc} |`);
        }
      }

      sections.push('');
    }
  }

  return sections.join('\n');
}

// Enhanced: Generate API documentation
function generateApiDocumentation(endpoints: ApiEndpoint[]): string {
  const sections: string[] = [`## API 文档\n`];

  // Group by controller
  const byController: Record<string, ApiEndpoint[]> = {};
  for (const endpoint of endpoints) {
    if (!byController[endpoint.controller]) {
      byController[endpoint.controller] = [];
    }
    byController[endpoint.controller].push(endpoint);
  }

  // Summary table
  sections.push(`### API 端点概览\n`);
  sections.push(`| 方法 | 路径 | 处理器 | 控制器 |`);
  sections.push(`|--------|------|---------|------------|`);
  for (const endpoint of endpoints) {
    sections.push(`| \`${endpoint.method}\` | \`${endpoint.fullPath}\` | \`${endpoint.handler}\` | \`${endpoint.controller}\` |`);
  }
  sections.push('');

  // Detailed API documentation by controller
  sections.push(`### API 详情\n`);
  
  for (const [controller, controllerEndpoints] of Object.entries(byController)) {
    sections.push(`#### ${controller}\n`);
    sections.push(`- **文件**: \`${controllerEndpoints[0].controllerPath}\`\n`);

    for (const endpoint of controllerEndpoints) {
      sections.push(`##### \`${endpoint.method} ${endpoint.fullPath}\``);
      if (endpoint.description) {
        sections.push(`${endpoint.description}\n`);
      }
      sections.push(`- **处理器**: \`${endpoint.handler}\``);

      // Parameters
      if (endpoint.parameters.length > 0) {
        sections.push(`\n**参数：**\n`);
        sections.push(`| 名称 | 位置 | 类型 | 是否必需 | 描述 |`);
        sections.push(`|------|-----|------|----------|-------------|`);
        for (const param of endpoint.parameters) {
          sections.push(`| \`${param.name}\` | ${param.in} | \`${param.type}\` | ${param.required ? '是' : '否'} | ${param.description || '-'} |`);
        }
      }

      // Request Body
      if (endpoint.requestBody) {
        sections.push(`\n**请求体**: \`${endpoint.requestBody.type}\``);
        if (endpoint.requestBody.fields.length > 0) {
          sections.push(`\n| 字段 | 类型 | 是否必需 |`);
          sections.push(`|-------|------|----------|`);
          for (const field of endpoint.requestBody.fields) {
            sections.push(`| \`${field.name}\` | \`${field.type}\` | ${!field.optional ? '是' : '否'} |`);
          }
        }
      }

      // Responses
      if (endpoint.responses.length > 0) {
        sections.push(`\n**响应：**\n`);
        sections.push(`| 状态码 | 描述 | 类型 |`);
        sections.push(`|--------|-------------|------|`);
        for (const response of endpoint.responses) {
          sections.push(`| ${response.status} | ${response.description} | ${response.type ? `\`${response.type}\`` : '-'} |`);
        }
      }

      sections.push('');
    }
  }

  return sections.join('\n');
}

// Enhanced: Generate business logic documentation
function generateBusinessLogicDocumentation(businessLogic: BusinessLogicInfo[]): string {
  const sections: string[] = [`## 业务逻辑\n`];
  sections.push(`本节记录服务类中的业务逻辑实现。\n`);

  for (const service of businessLogic) {
    sections.push(`### ${service.serviceName}`);
    sections.push(`- **文件**: \`${service.filePath}\``);
    if (service.description) {
      sections.push(`- **描述**: ${service.description}`);
    }
    sections.push('');

    if (service.methods.length > 0) {
      sections.push(`#### 业务操作\n`);
      sections.push(`| 方法 | 描述 | 输入 | 输出 | 业务规则 |`);
      sections.push(`|--------|-------------|-------|--------|----------------|`);
      
      for (const method of service.methods) {
        const inputs = method.inputTypes.length > 0 ? `\`${method.inputTypes.join(', ')}\`` : '-';
        const output = method.outputType ? `\`${method.outputType}\`` : '-';
        const rules = method.businessRules?.join('; ') || '-';
        sections.push(`| \`${method.name}\` | ${method.description} | ${inputs} | ${output} | ${rules} |`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

function generateDirectoryTable(directories?: DirectoryMapping[]): string {
  if (!directories || directories.length === 0) {
    return `| Directory | Purpose | Responsibilities |
|-----------|---------|------------------|
| \`src/entities/\` | Data Models | Define database schemas, entity classes, ORM mappings |
| \`src/services/\` | Business Logic | Implement business rules, orchestrate operations |
| \`src/controllers/\` | API Endpoints | Handle HTTP requests, route to services |
| \`src/repositories/\` | Data Access | Database queries, CRUD operations |
| \`src/dto/\` | Data Transfer | Request/response validation, data transformation |
| \`src/utils/\` | Utilities | Helper functions, common utilities |
| \`src/config/\` | Configuration | App settings, environment variables |
| \`src/middleware/\` | Request Processing | Authentication, logging, error handling |
| \`tests/\` | Testing | Unit tests, integration tests, E2E tests |`;
  }

  const header = `| Directory | Purpose | Responsibilities |\n|-----------|---------|------------------|`;
  const rows = directories.map(dir => 
    `| \`${dir.path}\` | ${dir.purpose} | ${dir.responsibilities.join(', ')} |`
  ).join('\n');
  
  return header + '\n' + rows;
}

function generateFrameworkConventions(frameworks: string[]): string {
  const sections: string[] = [`### Framework Usage Conventions\n`];

  if (frameworks.includes('nestjs')) {
    sections.push(`#### NestJS Patterns

- Use decorators for dependency injection: \`@Injectable()\`, \`@Controller()\`
- Module organization: Each feature should have its own module
- Dependency injection: Use constructor injection for services
- Example:
  \`\`\`typescript
  @Injectable()
  export class UserService {
    constructor(
      @InjectRepository(User)
      private userRepository: Repository<User>,
    ) {}
  }
  \`\`\`
`);
  }

  if (frameworks.includes('typeorm')) {
    sections.push(`#### TypeORM Patterns

- Entity definition using decorators: \`@Entity()\`, \`@Column()\`, \`@PrimaryGeneratedColumn()\`
- Relationships: \`@OneToMany()\`, \`@ManyToOne()\`, \`@ManyToMany()\`
- Repository pattern: Use \`Repository<Entity>\` from TypeORM
- Example:
  \`\`\`typescript
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @OneToMany(() => Post, post => post.author)
    posts: Post[];
  }
  \`\`\`
`);
  }

  if (frameworks.includes('express')) {
    sections.push(`#### Express Patterns

- Router organization: Separate routers per resource
- Middleware usage: Authentication, validation, error handling
- Route handlers: Keep them thin, delegate to services
- Example:
  \`\`\`typescript
  router.post('/users', 
    authenticate,
    validate(createUserSchema),
    async (req, res, next) => {
      try {
        const user = await userService.create(req.body);
        res.status(201).json(user);
      } catch (error) {
        next(error);
      }
    }
  );
  \`\`\`
`);
  }

  if (frameworks.includes('prisma')) {
    sections.push(`#### Prisma Patterns

- Schema definition in \`schema.prisma\`
- Client generation: \`npx prisma generate\`
- Migrations: \`npx prisma migrate dev\`
- Example:
  \`\`\`typescript
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      posts: {
        create: { title: 'Hello World' }
      }
    },
    include: { posts: true }
  });
  \`\`\`
`);
  }

  return sections.join('\n');
}

// Enhanced: Generate entity database mappings
function generateEntityDatabaseMappings(entities: ClassInfo[]): string {
  const sections: string[] = [`## 数据库实体映射\n`];
  sections.push(`本节显示实体类与数据库表的映射关系，包括表名、字段映射和索引信息。\n`);

  for (const entity of entities) {
    // Type assertion to access entity-specific properties
    const entityInfo = entity as any;
    
    if (!entityInfo.tableName && !entityInfo.fields.some((f: any) => f.columnName)) {
      continue; // Skip if no database mapping info
    }

    sections.push(`### \`${entity.name}\`\n`);
    
    if (entityInfo.tableName) {
      sections.push(`- **表名**: \`${entityInfo.tableName}\``);
    }
    
    if (entityInfo.tableComment) {
      sections.push(`- **表描述**: ${entityInfo.tableComment}`);
    }
    
    if (entityInfo.primaryKey) {
      sections.push(`- **主键**: \`${entityInfo.primaryKey}\``);
    }
    
    sections.push('');

    // Field mappings table
    const dbFields = entity.fields.filter((f: any) => f.columnName || f.columnType);
    if (dbFields.length > 0) {
      sections.push(`**字段映射：**\n`);
      sections.push(`| Java字段 | 数据库列 | 类型 | 可为空 | 说明 |`);
      sections.push(`|----------|----------|------|--------|------|`);
      
      for (const field of dbFields) {
        const fieldInfo = field as any;
        const columnName = fieldInfo.columnName || '-';
        const columnType = fieldInfo.columnType || fieldInfo.type;
        const nullable = fieldInfo.nullable !== undefined ? (fieldInfo.nullable ? '是' : '否') : '-';
        const comment = fieldInfo.comment || fieldInfo.description || '-';
        const isPk = entityInfo.primaryKey === field.name ? ' (PK)' : '';
        
        sections.push(`| \`${field.name}\`${isPk} | \`${columnName}\` | \`${columnType}\` | ${nullable} | ${comment} |`);
      }
      
      sections.push('');
    }

    // Indexes
    if (entityInfo.indexes && entityInfo.indexes.length > 0) {
      sections.push(`**索引：**\n`);
      sections.push(`| 索引名 | 字段 | 唯一索引 |`);
      sections.push(`|---------|------|----------|`);
      
      for (const index of entityInfo.indexes) {
        const unique = index.unique ? '是' : '否';
        sections.push(`| \`${index.name}\` | \`${index.columns.join(', ')}\` | ${unique} |`);
      }
      
      sections.push('');
    }

    sections.push('');
  }

  if (sections.length === 2) {
    return ''; // No database mappings found
  }

  return sections.join('\n');
}

// Enhanced: Generate AI completion tasks for missing descriptions
function generateAICompletionTasks(classes: ClassInfo[]): string {
  const sections: string[] = [];
  
  sections.push(`---\n`);
  sections.push(`## 📝 AI 补全任务\n`);
  sections.push(`以下内容需要 AI 助手补充完善（通过阅读代码理解业务逻辑后填写）：\n`);
  
  // Find classes without descriptions
  const classesWithoutDesc = classes.filter(c => !c.description);
  
  if (classesWithoutDesc.length > 0) {
    sections.push(`### 1. 缺少业务描述的类（共 ${classesWithoutDesc.length} 个）\n`);
    sections.push(`请为以下类添加业务功能说明：\n`);
    
    // Group by type
    const byType: Record<string, ClassInfo[]> = {};
    for (const cls of classesWithoutDesc.slice(0, 50)) { // Limit to 50 to avoid too long
      if (!byType[cls.type]) byType[cls.type] = [];
      byType[cls.type].push(cls);
    }
    
    const typeLabels: Record<string, string> = {
      controller: '控制器',
      service: '服务类',
      repository: '数据访问类',
      entity: '实体类',
      dto: 'DTO',
      other: '其他',
    };
    
    for (const [type, items] of Object.entries(byType)) {
      if (items.length > 0) {
        sections.push(`\n#### ${typeLabels[type] || type}\n`);
        for (const cls of items.slice(0, 10)) {
          sections.push(`- \`${cls.name}\` - \`${cls.filePath}\``);
        }
        if (items.length > 10) {
          sections.push(`- ... 还有 ${items.length - 10} 个类\n`);
        }
      }
    }
  }
  
  // Find fields without descriptions
  const fieldsWithoutDesc: Array<{className: string; fieldName: string; fieldType: string}> = [];
  for (const cls of classes) {
    if (cls.type === 'entity' || cls.type === 'dto') {
      for (const field of cls.fields) {
        if (!field.description && field.name !== 'serialVersionUID') {
          fieldsWithoutDesc.push({
            className: cls.name,
            fieldName: field.name,
            fieldType: field.type,
          });
        }
      }
    }
  }
  
  if (fieldsWithoutDesc.length > 0) {
    sections.push(`\n### 2. 缺少说明的字段（共 ${fieldsWithoutDesc.length} 个）\n`);
    sections.push(`以下 DTO/Entity 的字段缺少业务说明，请补充：\n`);
    
    // Group by class
    const byClass: Record<string, typeof fieldsWithoutDesc> = {};
    for (const item of fieldsWithoutDesc.slice(0, 100)) {
      if (!byClass[item.className]) byClass[item.className] = [];
      byClass[item.className].push(item);
    }
    
    let classCount = 0;
    for (const [className, fields] of Object.entries(byClass)) {
      if (classCount >= 10) break; // Limit to 10 classes
      sections.push(`\n#### ${className}\n`);
      for (const field of fields.slice(0, 5)) {
        sections.push(`- \`${field.fieldName}\` (${field.fieldType}) - [请说明此字段的业务含义]`);
      }
      if (fields.length > 5) {
        sections.push(`- ... 还有 ${fields.length - 5} 个字段\n`);
      }
      classCount++;
    }
    
    if (Object.keys(byClass).length > 10) {
      sections.push(`\n... 还有 ${Object.keys(byClass).length - 10} 个类的字段需要补充\n`);
    }
  }
  
  // Find methods without descriptions
  const methodsWithoutDesc: Array<{className: string; methodName: string}> = [];
  for (const cls of classes) {
    if (cls.type === 'controller' || cls.type === 'service') {
      for (const method of cls.methods) {
        if (!method.description && !method.name.startsWith('get') && !method.name.startsWith('set')) {
          methodsWithoutDesc.push({
            className: cls.name,
            methodName: method.name,
          });
        }
      }
    }
  }
  
  if (methodsWithoutDesc.length > 0) {
    sections.push(`\n### 3. 缺少说明的关键方法（共 ${methodsWithoutDesc.length} 个）\n`);
    sections.push(`以下业务方法缺少功能说明：\n`);
    
    const byClass: Record<string, typeof methodsWithoutDesc> = {};
    for (const item of methodsWithoutDesc.slice(0, 50)) {
      if (!byClass[item.className]) byClass[item.className] = [];
      byClass[item.className].push(item);
    }
    
    let classCount = 0;
    for (const [className, methods] of Object.entries(byClass)) {
      if (classCount >= 8) break;
      sections.push(`\n#### ${className}\n`);
      for (const method of methods.slice(0, 5)) {
        sections.push(`- \`${method.methodName}()\` - [请说明此方法的业务功能]`);
      }
      if (methods.length > 5) {
        sections.push(`- ... 还有 ${methods.length - 5} 个方法\n`);
      }
      classCount++;
    }
  }
  
  sections.push(`\n---\n`);
  sections.push(`**📌 AI 助手使用说明：**\n`);
  sections.push(`1. 请阅读相应的源代码文件，理解业务逻辑`);
  sections.push(`2. 用简洁的中文描述每个类/字段/方法的业务用途`);
  sections.push(`3. 直接在上述标记的位置替换 [请说明...] 占位符`);
  sections.push(`4. 完成补全后，删除本 "📝 AI 补全任务" 整个章节`);
  sections.push(`5. 如果某些内容无法理解，可以标注 [需要确认] 并询问开发者\n`);
  
  return sections.join('\n');
}

// Enhanced: Generate modular documentation (split into multiple files)
export interface ModularDoc {
  path: string;
  content: string;
}

export function generateModularDocs(context: ProjectContext): ModularDoc[] {
  const docs: ModularDoc[] = [];
  
  // Generate main index file
  docs.push({
    path: 'project.md',
    content: generateIndexDoc(context),
  });
  
  // Generate module-specific files if project structure exists
  if (context.projectStructure && context.projectStructure.modules.length > 0) {
    for (const module of context.projectStructure.modules) {
      const moduleClasses = (context.allClasses || []).filter(cls => 
        cls.filePath.includes(module.path)
      );
      
      if (moduleClasses.length > 0) {
        // Split module docs into multiple files for better AI processing
        const moduleDocs = generateSplitModuleDocs(module.name, moduleClasses, context);
        docs.push(...moduleDocs);
      }
    }
  }
  
  // Generate AI completion tasks file
  if (context.allClasses && context.allClasses.length > 0) {
    docs.push({
      path: 'ai-tasks.md',
      content: generateAICompletionTasks(context.allClasses),
    });
  }
  
  return docs;
}

// Generate index/overview document
function generateIndexDoc(context: ProjectContext): string {
  const sections: string[] = [];
  
  // Basic project info
  sections.push(`# ${context.projectName || '项目'} 上下文\n`);
  sections.push(`## 项目目的\n${context.description || '[描述项目的目的和目标]'}\n`);
  sections.push(`## 技术栈
${context.techStack?.length ? context.techStack.map(tech => `- ${tech}`).join('\n') : '- [列出主要技术]\n- [例如: TypeScript, React, Node.js]'}
`);
  
  // Project structure overview
  if (context.projectStructure && context.projectStructure.modules.length > 0) {
    sections.push(generateProjectStructureSection(context.projectStructure));
  }
  
  // Module documentation index
  if (context.projectStructure && context.projectStructure.modules.length > 0) {
    sections.push(`## 📚 模块文档索引\n`);
    sections.push(`本项目按模块拆分了详细文档，每个模块进一步拆分为多个小文件，方便 AI 处理：\n`);
    
    for (const module of context.projectStructure.modules) {
      // 跳过 starter 模块
      if (module.name.toLowerCase().includes('starter')) {
        continue;
      }
      
      const moduleClasses = (context.allClasses || []).filter(cls => 
        cls.filePath.includes(module.path)
      );
      
      if (moduleClasses.length > 0) {
        const controllers = moduleClasses.filter(c => c.type === 'controller');
        const services = moduleClasses.filter(c => c.type === 'service');
        const dtos = moduleClasses.filter(c => c.type === 'dto');
        const entities = moduleClasses.filter(c => c.type === 'entity');
        
        const typeLabels = {
          api: 'API层',
          biz: '业务层',
          dal: '数据层',
          web: 'Web层',
          common: '公共库',
          other: '其他',
        };
        
        sections.push(`### [📁 ${module.name}](modules/${module.name}/README.md)`);
        sections.push(`- **类型**: ${typeLabels[module.type] || '其他'}`);
        sections.push(`- **路径**: \`${module.path}\``);
        sections.push(`- **类数量**: ${moduleClasses.length} 个`);
        sections.push(`- **子文档**:`);
        sections.push(`  - [📖 模块概览](modules/${module.name}/README.md) - 业务场景、流程、规则`);
        if (controllers.length > 0) {
          sections.push(`  - [📡 Controllers](modules/${module.name}/controllers.md) - ${controllers.length} 个`);
        }
        if (services.length > 0) {
          sections.push(`  - [⚙️ Services](modules/${module.name}/services.md) - ${services.length} 个`);
        }
        if (dtos.length > 0 || entities.length > 0) {
          sections.push(`  - [📋 Models](modules/${module.name}/models.md) - ${dtos.length + entities.length} 个`);
        }
        sections.push(``);
      }
    }
  }
  
  // Code style overview
  if (context.codeStylePatterns) {
    sections.push(`## 代码风格概览\n`);
    sections.push(generateCodeStyleSection(context.codeStylePatterns));
  }
  
  // Class dependencies overview
  if (context.classDependencies && context.classDependencies.length > 0) {
    sections.push(generateClassDependenciesSection(context.classDependencies));
  }
  
  // API overview
  if (context.apiDocumentation && context.apiDocumentation.length > 0) {
    sections.push(`## API 端点概览\n`);
    sections.push(`项目共有 ${context.apiDocumentation.length} 个 API 端点，详见各模块文档。\n`);
  }
  
  // AI tasks link
  sections.push(`---\n`);
  sections.push(`## 📝 AI 补全任务\n`);
  sections.push(`请查看 [ai-tasks.md](ai-tasks.md) 了解需要补充的内容。\n`);
  
  return sections.join('\n');
}

// Generate module-specific document
function generateModuleDoc(moduleName: string, classes: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];
  
  sections.push(`# 模块: ${moduleName}\n`);
  sections.push(`[← 返回主文档](../project.md)\n`);
  sections.push(`---\n`);
  
  // Business scenario placeholder - ENHANCED with detailed structure
  sections.push(`## 🎯 业务场景\n`);
  sections.push(`**[请 AI 补充: 说明该模块解决什么业务问题，服务于哪些业务场景]**\n`);
  sections.push(`示例结构（请替换为实际内容）：`);
  sections.push(`- **核心价值**: [该模块解决的核心问题]`);
  sections.push(`- **服务对象**: [哪些用户群体/系统使用这个模块]`);
  sections.push(`- **场景1**: [具体业务场景描述]`);
  sections.push(`- **场景2**: [具体业务场景描述]`);
  sections.push(`- **场景3**: [具体业务场景描述]\n`);
  
  // Core business flows placeholder - ENHANCED with Mermaid examples
  sections.push(`## 🔄 核心业务流程\n`);
  sections.push(`**[请 AI 补充: 为每个主要业务场景绘制 Mermaid 流程图，建议 3-5 个]**\n`);
  sections.push(`要求：`);
  sections.push(`- 每个核心业务场景都需要一个流程图`);
  sections.push(`- 使用 sequenceDiagram 展示调用链`);
  sections.push(`- 标注关键的校验点、分支逻辑、异常处理`);
  sections.push(`- 包含主要参与者：Controller、Service、外部系统、数据库等\n`);
  sections.push(`示例结构（请替换为实际内容）：\n`);
  sections.push(`### 流程1: [流程名称，如"订单创建流程"]\n`);
  sections.push(`\`\`\`mermaid`);
  sections.push(`sequenceDiagram`);
  sections.push(`    participant User as 用户`);
  sections.push(`    participant Controller as XxxController`);
  sections.push(`    participant Service as XxxService`);
  sections.push(`    participant DB as 数据库`);
  sections.push(`    `);
  sections.push(`    User->>Controller: POST /api/xxx`);
  sections.push(`    Controller->>Service: createXxx(req)`);
  sections.push(`    Service->>Service: validate() 验证数据`);
  sections.push(`    Service->>DB: 保存数据`);
  sections.push(`    Service-->>Controller: 返回结果`);
  sections.push(`    Controller-->>User: 响应成功`);
  sections.push(`\`\`\`\n`);
  sections.push(`### 流程2: [流程名称]\n`);
  sections.push(`[类似的流程图...]\n`);
  sections.push(`### 流程3: [流程名称]\n`);
  sections.push(`[类似的流程图...]\n`);
  sections.push(`### 流程4: [流程名称]\n`);
  sections.push(`[类似的流程图...]\n`);
  sections.push(`### 流程5: [流程名称]\n`);
  sections.push(`[类似的流程图...]\n`);
  
  // Business Rules placeholder - NEW section
  sections.push(`## 📜 核心业务规则\n`);
  sections.push(`**[请 AI 补充: 说明该模块的关键业务规则和约束]**\n`);
  sections.push(`示例结构（请替换为实际内容）：\n`);
  sections.push(`### 规则1: [规则名称]`);
  sections.push(`- **判断条件**: [什么情况下触发]`);
  sections.push(`- **处理逻辑**: [如何处理]`);
  sections.push(`- **异常情况**: [边界场景处理]\n`);
  sections.push(`### 规则2: [规则名称]`);
  sections.push(`- **判断条件**: [...]`);
  sections.push(`- **处理逻辑**: [...]\n`);
  
  // State Machine placeholder - NEW section for entities with status
  sections.push(`## 🔀 状态流转\n`);
  sections.push(`**[请 AI 补充: 如果该模块有状态机，绘制状态流转图]**\n`);
  sections.push(`示例结构（请替换为实际内容）：\n`);
  sections.push(`\`\`\`mermaid`);
  sections.push(`stateDiagram-v2`);
  sections.push(`    [*] --> CREATED: 创建`);
  sections.push(`    CREATED --> PROCESSING: 开始处理`);
  sections.push(`    CREATED --> CANCELLED: 取消`);
  sections.push(`    PROCESSING --> COMPLETED: 完成`);
  sections.push(`    PROCESSING --> FAILED: 失败`);
  sections.push(`    COMPLETED --> [*]`);
  sections.push(`    CANCELLED --> [*]`);
  sections.push(`    FAILED --> [*]`);
  sections.push(`\`\`\`\n`);
  sections.push(`**状态说明：**\n`);
  sections.push(`| 状态 | 说明 | 可进行的操作 |`);
  sections.push(`|------|------|-------------|`);
  sections.push(`| CREATED | [初始状态说明] | [可执行的操作] |`);
  sections.push(`| PROCESSING | [处理中说明] | [可执行的操作] |`);
  sections.push(`| COMPLETED | [完成说明] | [可执行的操作] |\n`);
  
  // Module statistics
  const controllers = classes.filter(c => c.type === 'controller');
  const services = classes.filter(c => c.type === 'service');
  const entities = classes.filter(c => c.type === 'entity');
  const dtos = classes.filter(c => c.type === 'dto');
  
  sections.push(`## 📊 模块统计\n`);
  sections.push(`- **控制器**: ${controllers.length} 个`);
  sections.push(`- **服务类**: ${services.length} 个`);
  sections.push(`- **实体类**: ${entities.length} 个`);
  sections.push(`- **DTO**: ${dtos.length} 个`);
  sections.push(`- **总类数**: ${classes.length} 个\n`);
  
  // ENHANCED: Class documentation with better structure
  // Controllers first with enhanced format
  if (controllers.length > 0) {
    sections.push(`## 📡 控制器（API 端点）\n`);
    sections.push(`**[请 AI 补充: 为每个 Controller 添加详细的业务描述、服务场景和核心 API 说明]**\n`);
    
    for (const cls of controllers) {
      sections.push(`### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '**[请 AI 补充: 该 Controller 的业务功能概述]**'}`);
      if (cls.extends) {
        sections.push(`- **继承**: \`${cls.extends}\``);
      }
      if (cls.dependencies.length > 0) {
        sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
      }
      
      // Business functions placeholder
      sections.push(`- **业务功能**: **[请 AI 补充]**`);
      sections.push(`  - 功能1: [具体功能描述]`);
      sections.push(`  - 功能2: [具体功能描述]`);
      sections.push(`- **服务场景**: **[请 AI 补充]**`);
      sections.push(`  - [哪些用户/系统使用这些 API]\n`);
      
      // Methods with enhanced format for Controllers
      if (cls.methods.length > 0) {
        sections.push(`**核心 API 端点：**\n`);
        sections.push(`| 端点 | 用途 | 参数格式要求 | 常见错误码 |`);
        sections.push(`|------|------|--------------|------------|`);
        
        for (const method of cls.methods) {
          const desc = method.description || method.businessLogic || '**[请 AI 补充]**';
          sections.push(`| \`${method.name}()\` | ${desc} | **[补充日期格式/枚举值/必填项]** | **[补充错误码]** |`);
        }
        sections.push('');
      }
      
      sections.push('');
    }
  }
  
  // Services with enhanced format
  if (services.length > 0) {
    sections.push(`## ⚙️ 服务类（业务逻辑）\n`);
    sections.push(`**[请 AI 补充: 为每个 Service 的核心方法添加详细的业务描述]**\n`);
    
    for (const cls of services) {
      sections.push(`### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '**[请 AI 补充: 该 Service 的业务职责概述]**'}`);
      if (cls.extends) {
        sections.push(`- **继承**: \`${cls.extends}\``);
      }
      if (cls.implements && cls.implements.length > 0) {
        sections.push(`- **实现**: \`${cls.implements.join('\`, \`')}\``);
      }
      if (cls.dependencies.length > 0) {
        sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
      }
      
      // Methods with enhanced format for Services
      if (cls.methods.length > 0) {
        sections.push(`\n**核心方法说明：**\n`);
        sections.push(`| 方法 | 参数 | 返回类型 | 业务描述 | 可能异常 |`);
        sections.push(`|------|------|----------|----------|----------|`);
        
        for (const method of cls.methods) {
          const params = method.parameters.length > 0 
            ? method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')
            : '-';
          const desc = method.description || method.businessLogic || '**[请 AI 补充]**';
          sections.push(`| \`${method.name}()\` | \`${params}\` | \`${method.returnType || 'void'}\` | ${desc} | **[补充异常]** |`);
        }
        sections.push('');
      }
      
      sections.push('');
    }
  }
  
  // Other class types (entities, DTOs, etc.)
  const typeOrder = ['repository', 'entity', 'dto', 'utility', 'other'];
  const typeLabels: Record<string, string> = {
    repository: '🗄️ 仓储类（数据访问）',
    entity: '📊 实体类（数据模型）',
    dto: '📦 DTO（数据传输对象）',
    utility: '🛠️ 工具类',
    other: '📁 其他类',
  };
  
  for (const type of typeOrder) {
    const typeClasses = classes.filter(c => c.type === type);
    if (typeClasses.length === 0) continue;
    
    sections.push(`## ${typeLabels[type]}\n`);
    
    // For Entity and DTO, add field description reminder
    if (type === 'entity' || type === 'dto') {
      sections.push(`**[请 AI 补充: 为关键字段添加业务含义说明]**\n`);
    }
    
    for (const cls of typeClasses) {
      sections.push(`### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      if (cls.description) {
        sections.push(`- **描述**: ${cls.description}`);
      }
      if (cls.extends) {
        sections.push(`- **继承**: \`${cls.extends}\``);
      }
      if (cls.implements && cls.implements.length > 0) {
        sections.push(`- **实现**: \`${cls.implements.join('\`, \`')}\``);
      }
      if (cls.dependencies.length > 0) {
        sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
      }
      
      // Fields with enhanced format for Entity/DTO
      if (cls.fields.length > 0) {
        sections.push(`\n**字段说明：**\n`);
        
        if (type === 'entity') {
          sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值 | 示例 |`);
          sections.push(`|------|------|------|----------|----------|------|`);
          
          for (const field of cls.fields) {
            const desc = field.description || '[请 AI 补充]';
            sections.push(`| \`${field.name}\` | \`${field.type}\` | [是/否] | ${desc} | **[格式要求]** | **[示例值]** |`);
          }
        } else {
          sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值 | 示例 |`);
          sections.push(`|------|------|------|----------|----------|------|`);
          
          for (const field of cls.fields) {
            const desc = field.description || '[请 AI 补充]';
            const required = field.optional ? '否' : '是';
            sections.push(`| \`${field.name}\` | \`${field.type}\` | ${required} | ${desc} | **[格式要求]** | **[示例值]** |`);
          }
        }
        sections.push('');
      }
      
      // Methods
      if (cls.methods.length > 0) {
        sections.push(`**方法：**\n`);
        sections.push(`| 方法 | 参数 | 返回类型 | 描述 |`);
        sections.push(`|--------|------------|-------------|-------------|`);
        
        for (const method of cls.methods) {
          const params = method.parameters.length > 0 
            ? method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')
            : '-';
          const desc = method.description || method.businessLogic || '-';
          sections.push(`| \`${method.name}()\` | \`${params}\` | \`${method.returnType || 'void'}\` | ${desc} |`);
        }
        sections.push('');
      }
      
      sections.push('');
    }
  }
  
  // Module-specific API documentation
  const moduleApis = (context.apiDocumentation || []).filter(api => 
    classes.some(cls => api.controller === cls.name)
  );
  
  if (moduleApis.length > 0) {
    sections.push(`## 🔗 API 端点汇总\n`);
    sections.push(`| 方法 | 路径 | 控制器 | 处理器 |`);
    sections.push(`|------|------|--------|--------|`);
    
    for (const api of moduleApis) {
      sections.push(`| ${api.method} | \`${api.path}\` | \`${api.controller}\` | \`${api.handler}\` |`);
    }
    sections.push('');
  }
  
  // FAQ section - NEW
  sections.push(`## ❓ 常见问题 FAQ\n`);
  sections.push(`**[请 AI 补充: 添加该模块的常见问题和解答]**\n`);
  sections.push(`示例结构（请替换为实际内容）：\n`);
  sections.push(`**Q1: [常见问题 1]?**\n`);
  sections.push(`A: [解答内容]\n`);
  sections.push(`**Q2: [常见问题 2]?**\n`);
  sections.push(`A: [解答内容]\n`);
  sections.push(`**Q3: [常见问题 3]?**\n`);
  sections.push(`A: [解答内容]\n`);
  
  return sections.join('\n');
}

// Generate split module documents for better AI processing
function generateSplitModuleDocs(moduleName: string, classes: ClassInfo[], context: ProjectContext): ModularDoc[] {
  const docs: ModularDoc[] = [];
  const moduleDir = `modules/${moduleName}`;
  
  // 完全跳过 starter 模块，不生成任何文档
  const skipModulePatterns = ['starter'];
  const shouldSkip = skipModulePatterns.some(pattern => 
    moduleName.toLowerCase().includes(pattern)
  );
  if (shouldSkip) {
    return docs; // 返回空数组，不生成文档
  }
  
  const controllers = classes.filter(c => c.type === 'controller');
  const services = classes.filter(c => c.type === 'service');
  const entities = classes.filter(c => c.type === 'entity');
  const dtos = classes.filter(c => c.type === 'dto');
  const others = classes.filter(c => !['controller', 'service', 'entity', 'dto'].includes(c.type));
  
  // 1. Module README - Overview, business scenario, flows, rules
  docs.push({
    path: `${moduleDir}/README.md`,
    content: generateModuleReadme(moduleName, classes, controllers, services, entities, dtos, context),
  });
  
  // 2. Controllers document
  if (controllers.length > 0) {
    docs.push({
      path: `${moduleDir}/controllers.md`,
      content: generateControllersDoc(moduleName, controllers, context),
    });
  }
  
  // 3. Services document
  if (services.length > 0) {
    docs.push({
      path: `${moduleDir}/services.md`,
      content: generateServicesDoc(moduleName, services, context),
    });
  }
  
  // 4. DTOs and Entities document
  if (dtos.length > 0 || entities.length > 0) {
    docs.push({
      path: `${moduleDir}/models.md`,
      content: generateModelsDoc(moduleName, entities, dtos, context),
    });
  }
  
  // 5. Other classes (if any)
  if (others.length > 0) {
    docs.push({
      path: `${moduleDir}/others.md`,
      content: generateOthersDoc(moduleName, others, context),
    });
  }
  
  return docs;
}

// Generate module README with overview and business context
function generateModuleReadme(
  moduleName: string, 
  allClasses: ClassInfo[], 
  controllers: ClassInfo[], 
  services: ClassInfo[], 
  entities: ClassInfo[], 
  dtos: ClassInfo[],
  context: ProjectContext
): string {
  const sections: string[] = [];
  
  // 判断是否是基础设施模块（配置类、工具类等，不需要详细的业务文档）
  const infraModulePatterns = [
    'config', 'configuration', 'common', 'utils', 'util',
    'core', 'base', 'framework', 'infrastructure', 'bootstrap',
    'test', 'testutils', 'mock'
  ];
  const isInfraModule = infraModulePatterns.some(pattern => 
    moduleName.toLowerCase().includes(pattern)
  );
  
  sections.push(`# 模块: ${moduleName}\n`);
  sections.push(`[← 返回主文档](../../project.md)\n`);
  sections.push(`---\n`);
  
  // 基础设施模块：生成简化版文档
  if (isInfraModule) {
    sections.push(`> **模块类型**: 基础设施/配置模块（无需详细业务文档）\n`);
    
    sections.push(`## 📝 模块说明\n`);
    sections.push(`**[简要说明该模块的用途]**\n`);
    
    sections.push(`## 📦 主要类\n`);
    sections.push(`| 类名 | 类型 | 说明 |`);
    sections.push(`|------|------|------|`);
    for (const cls of allClasses.slice(0, 20)) {
      const typeLabel = cls.type === 'controller' ? 'Controller' : 
                        cls.type === 'service' ? 'Service' :
                        cls.type === 'entity' ? 'Entity' :
                        cls.type === 'dto' ? 'DTO' :
                        cls.type === 'repository' ? 'Repository' : '其他';
      sections.push(`| \`${cls.name}\` | ${typeLabel} | ${cls.description || '[说明]'} |`);
    }
    if (allClasses.length > 20) {
      sections.push(`| ... | ... | 还有 ${allClasses.length - 20} 个类 |`);
    }
    sections.push(`\n`);
    
    sections.push(`## 📊 模块统计\n`);
    sections.push(`- **总类数**: ${allClasses.length} 个\n`);
    
    return sections.join('\n');
  }
  
  // 业务模块：生成完整版文档
  // Navigation to sub-documents
  sections.push(`## 📂 文档索引\n`);
  sections.push(`本模块文档已拆分，AI 处理时请按需读取：\n`);
  sections.push(`| 文档 | 内容 | 类数量 |`);
  sections.push(`|------|------|---------|`);
  sections.push(`| [📖 本文件](README.md) | 业务场景、核心流程、业务规则、状态流转 | - |`);
  if (controllers.length > 0) {
    sections.push(`| [📡 Controllers](controllers.md) | 控制器和 API 端点 | ${controllers.length} 个 |`);
  }
  if (services.length > 0) {
    sections.push(`| [⚙️ Services](services.md) | 业务服务类 | ${services.length} 个 |`);
  }
  if (entities.length > 0 || dtos.length > 0) {
    sections.push(`| [📋 Models](models.md) | 实体和 DTO | ${entities.length + dtos.length} 个 |`);
  }
  sections.push(`\n`);
  
  // Business scenario
  sections.push(`## 🎯 业务场景\n`);
  sections.push(`> **❗ 重要**: 此部分必须全面且准确，是 AI 理解业务的关键\n`);
  sections.push(`**[请 AI 补充: 仔细阅读代码后填写]**\n`);
  sections.push(`### 核心价值`);
  sections.push(`- **解决的问题**: [该模块解决什么业务问题]`);
  sections.push(`- **业务目标**: [该模块要实现什么业务目标]\n`);
  sections.push(`### 服务对象`);
  sections.push(`| 用户类型 | 使用场景 | 操作频率 |`);
  sections.push(`|----------|----------|----------|`);
  sections.push(`| [用户类型1] | [使用场景] | [高/中/低] |`);
  sections.push(`| [用户类型2] | [使用场景] | [高/中/低] |\n`);
  sections.push(`### 业务场景详情`);
  sections.push(`#### 场景1: [场景名称]`);
  sections.push(`- **触发条件**: [什么情况下触发]`);
  sections.push(`- **操作步骤**: 1. xxx 2. xxx 3. xxx`);
  sections.push(`- **预期结果**: [操作完成后的结果]`);
  sections.push(`- **异常处理**: [失败时如何处理]\n`);
  sections.push(`#### 场景2: [场景名称]`);
  sections.push(`- **触发条件**: [什么情况下触发]`);
  sections.push(`- **操作步骤**: 1. xxx 2. xxx 3. xxx`);
  sections.push(`- **预期结果**: [操作完成后的结果]`);
  sections.push(`- **异常处理**: [失败时如何处理]\n`);
  sections.push(`#### 场景3: [场景名称]`);
  sections.push(`[请补充...]\n`);
  
  // Core business flows
  sections.push(`## 🔄 核心业务流程\n`);
  sections.push(`**[请 AI 补充: 绘制 3-5 个核心流程的 Mermaid 序列图，覆盖主要业务场景]**\n`);
  sections.push(`要求：每个核心场景都需要流程图，标注校验点/分支逻辑/异常处理\n`);
  sections.push(`### 流程1: [流程名称]\n`);
  sections.push(`\`\`\`mermaid`);
  sections.push(`sequenceDiagram`);
  sections.push(`    participant User as 用户`);
  sections.push(`    participant Controller as XxxController`);
  sections.push(`    participant Service as XxxService`);
  sections.push(`    participant DB as 数据库`);
  sections.push(`    User->>Controller: POST /api/xxx`);
  sections.push(`    Controller->>Service: method(req)`);
  sections.push(`    Service->>DB: 保存数据`);
  sections.push(`    Service-->>Controller: 返回结果`);
  sections.push(`    Controller-->>User: 响应`);
  sections.push(`\`\`\`\n`);
  sections.push(`### 流程2: [流程名称]\n`);
  sections.push(`[请绘制流程图...]\n`);
  sections.push(`### 流程3: [流程名称]\n`);
  sections.push(`[请绘制流程图...]\n`);
  sections.push(`### 流程4: [流程名称]\n`);
  sections.push(`[请绘制流程图...]\n`);
  sections.push(`### 流程5: [流程名称]\n`);
  sections.push(`[请绘制流程图...]\n`);
  
  // Business rules
  sections.push(`## 📜 核心业务规则\n`);
  sections.push(`> **❗ 重要**: 此部分必须全面且准确，是 AI 编程的依据\n`);
  sections.push(`**[请 AI 补充: 从代码中提取所有业务规则，包括校验规则、计算规则、状态规则等]**\n`);
  sections.push(`### 校验规则\n`);
  sections.push(`| 规则名称 | 校验条件 | 错误提示 | 触发时机 |`);
  sections.push(`|----------|----------|----------|----------|`);
  sections.push(`| [请补充规则名] | [请补充条件表达式] | [请补充错误码和消息] | [请补充哪个操作] |`);
  sections.push(`| [请补充规则名] | [请补充条件表达式] | [请补充错误码和消息] | [请补充哪个操作] |\n`);
  sections.push(`### 业务计算规则\n`);
  sections.push(`| 规则名称 | 计算公式 | 适用场景 | 示例 |`);
  sections.push(`|----------|----------|----------|------|`);
  sections.push(`| [请补充规则名] | [请补充公式] | [请补充场景] | [请补充示例] |\n`);
  sections.push(`### 状态转换规则\n`);
  sections.push(`| 当前状态 | 操作 | 目标状态 | 前置条件 | 后置动作 |`);
  sections.push(`|----------|------|----------|----------|----------|`);
  sections.push(`| [请补充状态] | [请补充操作] | [请补充状态] | [请补充条件] | [请补充动作] |\n`);
  sections.push(`### 详细规则说明\n`);
  sections.push(`#### 规则 1: [请补充规则名称]`);
  sections.push(`- **业务背景**: [请补充: 为什么需要这个规则]`);
  sections.push(`- **判断条件**: [请补充: 什么情况下触发]`);
  sections.push(`- **处理逻辑**: [请补充: 如何处理]`);
  sections.push(`- **异常情况**: [请补充: 边界场景处理]`);
  sections.push(`- **代码位置**: [请补充: 哪个类/方法]\n`);
  sections.push(`**实现伪代码**`);
  sections.push(`\`\`\``);
  sections.push(`// 规则 1 实现逻辑`);
  sections.push(`[请补充: 输入参数]`);
  sections.push(``);
  sections.push(`1. 检查条件`);
  sections.push(`   IF [请补充: 条件表达式] THEN`);
  sections.push(`       [请补充: 执行操作]`);
  sections.push(`   ELSE`);
  sections.push(`       [请补充: 异常处理]`);
  sections.push(`   END IF`);
  sections.push(``);
  sections.push(`2. 返回结果`);
  sections.push(`   [请补充: 返回什么]`);
  sections.push(`\`\`\`\n`);
  sections.push(`#### 规则 2: [请补充规则名称]`);
  sections.push(`- **业务背景**: [请补充: 为什么需要这个规则]`);
  sections.push(`- **判断条件**: [请补充: 什么情况下触发]`);
  sections.push(`- **处理逻辑**: [请补充: 如何处理]`);
  sections.push(`- **异常情况**: [请补充: 边界场景处理]`);
  sections.push(`- **代码位置**: [请补充: 哪个类/方法]\n`);
  sections.push(`**实现伪代码**`);
  sections.push(`\`\`\``);
  sections.push(`// 规则 2 实现逻辑`);
  sections.push(`[请补充: 输入参数]`);
  sections.push(``);
  sections.push(`1. 检查条件`);
  sections.push(`   IF [请补充: 条件表达式] THEN`);
  sections.push(`       [请补充: 执行操作]`);
  sections.push(`   ELSE`);
  sections.push(`       [请补充: 异常处理]`);
  sections.push(`   END IF`);
  sections.push(``);
  sections.push(`2. 返回结果`);
  sections.push(`   [请补充: 返回什么]`);
  sections.push(`\`\`\`\n`);
  sections.push(`#### 规则 3: [请补充规则名称]`);
  sections.push(`[请按照上述格式补充...]\n`);
  
  // State machine
  sections.push(`## 🔀 状态流转\n`);
  sections.push(`**[请 AI 补充: 如果该模块有状态机，绘制 Mermaid 状态图]**\n`);
  sections.push(`\`\`\`mermaid`);
  sections.push(`stateDiagram-v2`);
  sections.push(`    [*] --> CREATED: 创建`);
  sections.push(`    CREATED --> PROCESSING: 开始处理`);
  sections.push(`    CREATED --> CANCELLED: 取消`);
  sections.push(`    PROCESSING --> COMPLETED: 完成`);
  sections.push(`    COMPLETED --> [*]`);
  sections.push(`    CANCELLED --> [*]`);
  sections.push(`\`\`\`\n`);
  sections.push(`| 状态 | 说明 | 可执行操作 |`);
  sections.push(`|------|------|-----------|`);
  sections.push(`| CREATED | [说明] | [操作] |\n`);
  
  // Exception handling specification
  sections.push(`## ⚠️ 异常处理规范\n`);
  sections.push(`**[请 AI 补充: 列出该模块的常见异常和处理方式]**\n`);
  sections.push(`### 常见错误码\n`);
  sections.push(`| 错误码 | 含义 | 触发场景 | 处理建议 |`);
  sections.push(`|--------|------|----------|----------|`);
  sections.push(`| 400 | 参数错误 | [场景] | [建议] |`);
  sections.push(`| 404 | 资源不存在 | [场景] | [建议] |`);
  sections.push(`| 500 | 系统异常 | [场景] | [建议] |\n`);
  sections.push(`### 业务异常\n`);
  sections.push(`| 异常类 | 触发条件 | 处理方式 |`);
  sections.push(`|---------|----------|----------|`);
  sections.push(`| [XxxException] | [条件] | [处理] |\n`);
  
  // Module statistics
  sections.push(`## 📊 模块统计\n`);
  sections.push(`- **控制器**: ${controllers.length} 个`);
  sections.push(`- **服务类**: ${services.length} 个`);
  sections.push(`- **实体类**: ${entities.length} 个`);
  sections.push(`- **DTO**: ${dtos.length} 个`);
  sections.push(`- **总类数**: ${allClasses.length} 个\n`);
  
  // FAQ
  sections.push(`## ❓ 常见问题 FAQ\n`);
  sections.push(`**[请 AI 补充: 添加 3-5 个常见问题]**\n`);
  sections.push(`### Q1: [问题]?`);
  sections.push(`A: [答案]\n`);
  sections.push(`### Q2: [问题]?`);
  sections.push(`A: [答案]\n`);
  
  // Development Guide
  sections.push(`## 🛠️ 开发指南\n`);
  sections.push(`> AI 编写代码时请遵循以下规范和模板\n`);
  
  sections.push(`### 技术栈\n`);
  sections.push(`| 类别 | 技术 | 说明 |`);
  sections.push(`|------|------|------|`);
  sections.push(`| 框架 | Spring Boot 2.x | [版本号] |`);
  sections.push(`| ORM | MyBatis-Plus | 使用 LambdaQueryWrapper |`);
  sections.push(`| 缓存 | CacheAPI (Tair) | getOrSetCache / deleteFromCache |`);
  sections.push(`| 返回值 | Result<T> | Result.success() / Result.fail() |\n`);
  
  sections.push(`### Controller 模板\n`);
  sections.push(`\`\`\`java`);
  sections.push(`@RestController`);
  sections.push(`@RequestMapping("/api/xxx")`);
  sections.push(`public class XxxController {`);
  sections.push(``);
  sections.push(`    @Resource`);
  sections.push(`    private XxxService xxxService;`);
  sections.push(``);
  sections.push(`    /**`);
  sections.push(`     * [接口描述]`);
  sections.push(`     * @param req 请求参数`);
  sections.push(`     * @return 响应结果`);
  sections.push(`     */`);
  sections.push(`    @PostMapping("/create")`);
  sections.push(`    public Result<XxxResp> create(@RequestBody @Valid XxxReq req) {`);
  sections.push(`        return xxxService.create(req);`);
  sections.push(`    }`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);
  
  sections.push(`### Service 模板\n`);
  sections.push(`\`\`\`java`);
  sections.push(`@Service`);
  sections.push(`public class XxxServiceImpl implements XxxService {`);
  sections.push(``);
  sections.push(`    @Resource`);
  sections.push(`    private XxxMapper xxxMapper;`);
  sections.push(`    @Resource`);
  sections.push(`    private CacheAPI cacheAPI;`);
  sections.push(``);
  sections.push(`    @Override`);
  sections.push(`    public Result<XxxResp> create(XxxReq req) {`);
  sections.push(`        // 1. 参数校验`);
  sections.push(`        if (req.getXxx() == null) {`);
  sections.push(`            throw new FmsBaseDataSysException("PARAM_ERROR", "xxx不能为空");`);
  sections.push(`        }`);
  sections.push(``);
  sections.push(`        // 2. 业务逻辑`);
  sections.push(`        XxxEntity entity = new XxxEntity();`);
  sections.push(`        BeanUtils.copyProperties(req, entity);`);
  sections.push(`        entity.markNew(operator);`);
  sections.push(``);
  sections.push(`        // 3. 保存数据`);
  sections.push(`        xxxMapper.insert(entity);`);
  sections.push(``);
  sections.push(`        // 4. 清除缓存`);
  sections.push(`        cacheAPI.deleteFromCache(CacheKey.XXX_KEY + entity.getCode());`);
  sections.push(``);
  sections.push(`        return Result.success(entity.entity2DO());`);
  sections.push(`    }`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);
  
  sections.push(`### 常用工具类\n`);
  sections.push(`| 工具 | 用法 | 说明 |`);
  sections.push(`|------|------|------|`);
  sections.push(`| Result | \`Result.success(data)\` / \`Result.fail("msg")\` | 统一返回值 |`);
  sections.push(`| 异常 | \`throw new FmsBaseDataSysException("CODE", "msg")\` | 业务异常 |`);
  sections.push(`| 新增标记 | \`entity.markNew(operator)\` | 设置创建人/时间 |`);
  sections.push(`| 更新标记 | \`entity.markUpdate(operator)\` | 设置修改人/时间 |`);
  sections.push(`| 缓存读取 | \`cacheAPI.getOrSetCache(key, loader, expire)\` | 缓存穿透保护 |`);
  sections.push(`| 缓存删除 | \`cacheAPI.deleteFromCache(key)\` | 清除缓存 |\n`);
  
  // MyBatis-Plus 查询示例
  sections.push(`### MyBatis-Plus 查询示例\n`);
  sections.push(`**[请 AI 补充: 根据项目实际使用情况补充更多示例]**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 1. 简单查询 - 根据条件查询单条记录`);
  sections.push(`XxxEntity entity = xxxMapper.selectOne(`);
  sections.push(`    new LambdaQueryWrapper<XxxEntity>()`);
  sections.push(`        .eq(XxxEntity::getCode, code)`);
  sections.push(`        .eq(XxxEntity::getStatus, 1)`);
  sections.push(`);`);
  sections.push(``);
  sections.push(`// 2. 列表查询 - 带分页`);
  sections.push(`Page<XxxEntity> page = new Page<>(pageNum, pageSize);`);
  sections.push(`LambdaQueryWrapper<XxxEntity> wrapper = new LambdaQueryWrapper<XxxEntity>()`);
  sections.push(`    .like(StringUtils.isNotBlank(name), XxxEntity::getName, name)`);
  sections.push(`    .eq(status != null, XxxEntity::getStatus, status)`);
  sections.push(`    .orderByDesc(XxxEntity::getGmtCreate);`);
  sections.push(`Page<XxxEntity> result = xxxMapper.selectPage(page, wrapper);`);
  sections.push(``);
  sections.push(`// 3. 聚合查询 - 统计数量`);
  sections.push(`Long count = xxxMapper.selectCount(`);
  sections.push(`    new LambdaQueryWrapper<XxxEntity>()`);
  sections.push(`        .eq(XxxEntity::getTenantCode, tenantCode)`);
  sections.push(`        .between(XxxEntity::getGmtCreate, startTime, endTime)`);
  sections.push(`);`);
  sections.push(``);
  sections.push(`// 4. 批量更新`);
  sections.push(`xxxMapper.update(null,`);
  sections.push(`    new LambdaUpdateWrapper<XxxEntity>()`);
  sections.push(`        .set(XxxEntity::getStatus, newStatus)`);
  sections.push(`        .in(XxxEntity::getId, idList)`);
  sections.push(`);`);
  sections.push(``);
  sections.push(`// 5. 存在性检查`);
  sections.push(`boolean exists = xxxMapper.exists(`);
  sections.push(`    new LambdaQueryWrapper<XxxEntity>()`);
  sections.push(`        .eq(XxxEntity::getCode, code)`);
  sections.push(`);`);
  sections.push(`\`\`\`\n`);
  
  // 事务处理示例
  sections.push(`### 事务处理示例\n`);
  sections.push(`**[请 AI 补充: 根据项目实际使用情况补充更多示例]**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 1. 基本事务 - 方法级别`);
  sections.push(`@Transactional(rollbackFor = Exception.class)`);
  sections.push(`public Result<Void> createOrder(OrderReq req) {`);
  sections.push(`    // 业务逻辑...`);
  sections.push(`    orderMapper.insert(order);`);
  sections.push(`    orderItemMapper.insertBatch(items);`);
  sections.push(`    return Result.success();`);
  sections.push(`}`);
  sections.push(``);
  sections.push(`// 2. 编程式事务 - 细粒度控制`);
  sections.push(`@Resource`);
  sections.push(`private TransactionTemplate transactionTemplate;`);
  sections.push(``);
  sections.push(`public Result<Void> complexOperation() {`);
  sections.push(`    // 非事务操作: 查询、校验`);
  sections.push(`    XxxEntity entity = xxxMapper.selectById(id);`);
  sections.push(`    if (entity == null) {`);
  sections.push(`        return Result.fail("NOT_FOUND", "记录不存在");`);
  sections.push(`    }`);
  sections.push(``);
  sections.push(`    // 事务操作: 修改数据`);
  sections.push(`    return transactionTemplate.execute(status -> {`);
  sections.push(`        try {`);
  sections.push(`            xxxMapper.updateById(entity);`);
  sections.push(`            yyyMapper.insert(relatedEntity);`);
  sections.push(`            return Result.success();`);
  sections.push(`        } catch (Exception e) {`);
  sections.push(`            status.setRollbackOnly();`);
  sections.push(`            return Result.fail("ERROR", e.getMessage());`);
  sections.push(`        }`);
  sections.push(`    });`);
  sections.push(`}`);
  sections.push(``);
  sections.push(`// 3. 事务传播 - 嵌套调用`);
  sections.push(`@Transactional(propagation = Propagation.REQUIRED)`);
  sections.push(`public void outerMethod() {`);
  sections.push(`    // 外层事务`);
  sections.push(`    innerMethod(); // 加入外层事务`);
  sections.push(`}`);
  sections.push(``);
  sections.push(`@Transactional(propagation = Propagation.REQUIRES_NEW)`);
  sections.push(`public void innerMethod() {`);
  sections.push(`    // 新建独立事务，不受外层影响`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);
  
  // 通用工具类使用示例
  sections.push(`### 通用工具类使用示例\n`);
  sections.push(`**[请 AI 补充: 根据项目实际使用情况补充更多示例]**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 1. Result 统一返回`);
  sections.push(`// 成功返回`);
  sections.push(`return Result.success(data);`);
  sections.push(`return Result.success(); // 无数据返回`);
  sections.push(``);
  sections.push(`// 失败返回`);
  sections.push(`return Result.fail("PARAM_ERROR", "参数错误");`);
  sections.push(`return Result.fail(ErrorCode.NOT_FOUND, "记录不存在");`);
  sections.push(``);
  sections.push(`// 2. 异常抛出`);
  sections.push(`// 业务异常 - 会被全局异常处理器捕获`);
  sections.push(`throw new FmsBaseDataSysException("PARAM_ERROR", "参数不合法");`);
  sections.push(`throw new FmsBaseDataSysException(ErrorCode.DUPLICATE, "code已存在");`);
  sections.push(``);
  sections.push(`// 3. 缓存操作`);
  sections.push(`// 读取缓存，不存在则加载`);
  sections.push(`XxxDTO dto = cacheAPI.getOrSetCache(`);
  sections.push(`    CacheKey.XXX_KEY + code,`);
  sections.push(`    () -> xxxMapper.selectByCode(code),`);
  sections.push(`    3600 // 过期时间(秒)`);
  sections.push(`);`);
  sections.push(``);
  sections.push(`// 删除缓存`);
  sections.push(`cacheAPI.deleteFromCache(CacheKey.XXX_KEY + code);`);
  sections.push(``);
  sections.push(`// 4. 实体操作`);
  sections.push(`// 新增时设置创建人/时间`);
  sections.push(`entity.markNew(operator);`);
  sections.push(``);
  sections.push(`// 更新时设置修改人/时间`);
  sections.push(`entity.markUpdate(operator);`);
  sections.push(``);
  sections.push(`// DO 与 Entity 互转`);
  sections.push(`XxxEntity entity = XxxEntity.do2Entity(xxxDO);`);
  sections.push(`XxxDO xxxDO = entity.entity2DO();`);
  sections.push(`\`\`\`\n`);
  
  sections.push(`### DTO 转换规范\n`);
  sections.push(`| 场景 | 方法 | 示例 |`);
  sections.push(`|------|------|------|`);
  sections.push(`| DO → Entity | \`Entity.do2Entity(do)\` | \`XxxEntity.do2Entity(xxxDO)\` |`);
  sections.push(`| Entity → DO | \`entity.entity2DO()\` | \`xxxEntity.entity2DO()\` |`);
  sections.push(`| Req → Entity | \`BeanUtils.copyProperties(req, entity)\` | 手动复制 |\n`);
  
  return sections.join('\n');
}

// Generate Controllers document
function generateControllersDoc(moduleName: string, controllers: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];
  
  sections.push(`# ${moduleName} - Controllers\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);
  
  sections.push(`> **AI 处理指南**: 请逐个 Controller 补充描述，完成后报告 "✅ Controllers 已补充"\n`);
  
  for (const cls of controllers) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **描述**: ${cls.description || '**[请补充: 一句话说明该 Controller 负责什么]**'}`);
    if (cls.extends) {
      sections.push(`- **继承**: \`${cls.extends}\``);
    }
    if (cls.dependencies.length > 0) {
      sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
    }
    sections.push(``);
    
    // Business functions
    sections.push(`### 业务功能\n`);
    sections.push(`**[请补充]**`);
    sections.push(`- 功能1: [描述]`);
    sections.push(`- 功能2: [描述]\n`);
    
    sections.push(`### 服务场景\n`);
    sections.push(`**[请补充: 哪些用户/系统使用这些 API]**\n`);
    
    // API endpoints
    if (cls.methods.length > 0) {
      sections.push(`### API 端点\n`);
      sections.push(`| 端点 | 用途 | 参数格式要求 | 常见错误码 |`);
      sections.push(`|------|------|--------------|------------|`);
      
      for (const method of cls.methods) {
        const desc = method.description || method.businessLogic || '**[请补充]**';
        // 获取参数信息，生成需要补充的格式提示
        const paramHints = method.parameters.length > 0
          ? '**[请补充：' + method.parameters.map(p => `${p.name}的格式要求`).join('、') + ']**'
          : '-';
        sections.push(`| \`${method.name}()\` | ${desc} | ${paramHints} | **[请补充错误码]** |`);
      }
      sections.push(``);
      
      // 请求响应示例
      sections.push(`### 请求响应示例\n`);
      sections.push(`**[请 AI 补充: 为每个核心 API 提供完整示例]**\n`);
      
      // 为每个方法生成请求响应示例
      for (const method of cls.methods) {
        sections.push(`#### ${method.name}()\n`);
        sections.push(`**请求示例**`);
        sections.push(`\`\`\`json`);
        if (method.parameters.length > 0) {
          sections.push(`// POST /api/xxx/${method.name}`);
          sections.push(`{`);
          for (const param of method.parameters) {
            sections.push(`  "${param.name}": "[请补充示例值]"`);
          }
          sections.push(`}`);
        } else {
          sections.push(`// GET /api/xxx/${method.name}`);
          sections.push(`// 无请求体`);
        }
        sections.push(`\`\`\`\n`);
        
        sections.push(`**成功响应**`);
        sections.push(`\`\`\`json`);
        sections.push(`{`);
        sections.push(`  "success": true,`);
        sections.push(`  "code": "200",`);
        sections.push(`  "data": {`);
        sections.push(`    // [请补充: ${method.returnType || 'void'} 的完整结构]`);
        sections.push(`  }`);
        sections.push(`}`);
        sections.push(`\`\`\`\n`);
        
        sections.push(`**失败响应**`);
        sections.push(`\`\`\`json`);
        sections.push(`{`);
        sections.push(`  "success": false,`);
        sections.push(`  "code": "[错误码]",`);
        sections.push(`  "message": "[错误描述]"`);
        sections.push(`}`);
        sections.push(`\`\`\`\n`);
      }
    }
    
    // 异常处理
    sections.push(`### 异常处理\n`);
    sections.push(`| 错误码 | 含义 | 触发场景 | 返回示例 |`);
    sections.push(`|--------|------|----------|----------|`);
    sections.push(`| 400 | 参数错误 | **[请补充]** | **[请补充]** |`);
    sections.push(`| 401 | 未授权 | **[请补充]** | **[请补充]** |`);
    sections.push(`| 404 | 资源不存在 | **[请补充]** | **[请补充]** |`);
    sections.push(`| 500 | 服务器错误 | **[请补充]** | **[请补充]** |`);
    sections.push(``)
    
    sections.push(`---\n`);
  }
  
  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Controller 的描述已填写`);
  sections.push(`- [ ] 每个 API 端点的用途已填写`);
  sections.push(`- [ ] 每个 API 的参数格式要求已填写`);
  sections.push(`- [ ] 每个 API 的错误码已填写`);
  sections.push(`- [ ] 请求响应示例已补充完整`);
  sections.push(`- [ ] 异常处理表格已填写`);
  sections.push(`- [ ] 搜索 \`[请补充\` 结果为 0\n`);
  
  return sections.join('\n');
}

// Generate Services document
function generateServicesDoc(moduleName: string, services: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];
  
  sections.push(`# ${moduleName} - Services\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);
  
  sections.push(`> **AI 处理指南**: 请逐个 Service 补充方法描述，完成后报告 "✅ Services 已补充"`);
  sections.push(`> **强制要求**: 每个方法的业务描述和可能异常必须填写，禁止遗漏\n`);
  
  for (const cls of services) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **描述**: ${cls.description || '**[请补充: 该 Service 的业务职责]**'}`);
    if (cls.extends) {
      sections.push(`- **继承**: \`${cls.extends}\``);
    }
    if (cls.implements && cls.implements.length > 0) {
      sections.push(`- **实现**: \`${cls.implements.join('\`, \`')}\``);
    }
    if (cls.dependencies.length > 0) {
      sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
    }
    sections.push(``);
    
    // Methods
    if (cls.methods.length > 0) {
      sections.push(`### 核心方法\n`);
      sections.push(`| 方法 | 参数 | 返回类型 | 业务描述 | 可能异常 |`);
      sections.push(`|------|------|----------|----------|----------|`);
      
      for (const method of cls.methods) {
        const params = method.parameters.length > 0 
          ? method.parameters.map(p => `${p.name}`).join(', ')
          : '-';
        const desc = method.description || method.businessLogic || '**[请补充]**';
        sections.push(`| \`${method.name}()\` | \`${params}\` | \`${method.returnType || 'void'}\` | ${desc} | **[异常类型]** |`);
      }
      sections.push(``);
      
      // 方法实现伪代码
      sections.push(`### 方法实现伪代码\n`);
      sections.push(`**[请 AI 补充: 为每个核心方法提供实现伪代码]**\n`);
      
      // 为每个方法生成伪代码模板
      for (const method of cls.methods) {
        const params = method.parameters.length > 0 
          ? method.parameters.map(p => `${p.type} ${p.name}`).join(', ')
          : '';
        sections.push(`#### ${method.name}(${method.parameters.map(p => p.name).join(', ')})\n`);
        sections.push(`- **方法用途**: [请补充: 这个方法做什么]`);
        sections.push(`- **调用场景**: [请补充: 什么情况下调用]`);
        sections.push(`- **事务要求**: [请补充: 是否需要事务，REQUIRED/REQUIRES_NEW/无]\n`);
        sections.push(`**实现伪代码**`);
        sections.push(`\`\`\``);
        sections.push(`// ${method.name} 实现逻辑`);
        sections.push(``);
        sections.push(`输入: ${method.parameters.length > 0 ? method.parameters.map(p => `${p.name}`).join(', ') : '无'}`);
        sections.push(`输出: ${method.returnType || 'void'}`);
        sections.push(``);
        sections.push(`1. 参数校验`);
        if (method.parameters.length > 0) {
          for (const param of method.parameters) {
            sections.push(`   IF ${param.name} == null THEN`);
            sections.push(`       [请补充: 抛出什么异常]`);
            sections.push(`   END IF`);
          }
        } else {
          sections.push(`   [无参数校验]`);
        }
        sections.push(``);
        sections.push(`2. 业务校验`);
        sections.push(`   [请补充: 业务规则校验]`);
        sections.push(`   IF [请补充: 校验条件] THEN`);
        sections.push(`       [请补充: 抛出什么异常]`);
        sections.push(`   END IF`);
        sections.push(``);
        sections.push(`3. 核心逻辑`);
        sections.push(`   STEP 1: [请补充: 第一步操作]`);
        sections.push(`   STEP 2: [请补充: 第二步操作]`);
        sections.push(`   STEP 3: [请补充: 第三步操作]`);
        sections.push(``);
        sections.push(`4. 数据操作`);
        sections.push(`   CALL [请补充: Mapper/Service].[请补充: 方法名]([请补充: 参数])`);
        sections.push(`   CALL [请补充: Mapper/Service].[请补充: 方法名]([请补充: 参数])`);
        sections.push(``);
        sections.push(`5. 缓存处理`);
        sections.push(`   [请补充: 是否需要清除/更新缓存]`);
        sections.push(``);
        sections.push(`6. 返回结果`);
        sections.push(`   IF 成功 THEN`);
        sections.push(`       RETURN [请补充: 返回内容]`);
        sections.push(`   ELSE`);
        sections.push(`       THROW [请补充: 异常类型]([请补充: 错误码], [请补充: 错误消息])`);
        sections.push(`   END IF`);
        sections.push(`\`\`\`\n`);
      }
    }
    
    // 事务和异常处理
    sections.push(`### 事务与异常处理\n`);
    sections.push(`| 方法 | 事务传播 | 可能抛出异常 | 异常处理建议 |`);
    sections.push(`|------|----------|--------------|--------------|`);
    sections.push(`| **[方法名]** | REQUIRED | **[异常类]** | **[处理方式]** |`);
    sections.push(``)
    
    sections.push(`---\n`);
  }
  
  // 事务处理示例
  sections.push(`## 事务处理示例\n`);
  sections.push(`**[请 AI 补充: 根据项目实际代码补充更多示例]**\n`);
  sections.push(`### 示例 1：需要事务的操作\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 场景：新增/修改/删除操作，涉及多表修改时必须使用事务`);
  sections.push(`@Transactional(rollbackFor = Exception.class)`);
  sections.push(`public Result<Void> createXxx(XxxReq req) {`);
  sections.push(`    // 1. 参数校验`);
  sections.push(`    if (req.getCode() == null) {`);
  sections.push(`        throw new FmsBaseDataSysException("PARAM_ERROR", "code不能为空");`);
  sections.push(`    }`);
  sections.push(``);
  sections.push(`    // 2. 业务校验`);
  sections.push(`    if (xxxMapper.existsByCode(req.getCode())) {`);
  sections.push(`        throw new FmsBaseDataSysException("DUPLICATE", "code已存在");`);
  sections.push(`    }`);
  sections.push(``);
  sections.push(`    // 3. 保存主表`);
  sections.push(`    XxxEntity entity = new XxxEntity();`);
  sections.push(`    BeanUtils.copyProperties(req, entity);`);
  sections.push(`    entity.markNew(operator);`);
  sections.push(`    xxxMapper.insert(entity);`);
  sections.push(``);
  sections.push(`    // 4. 保存关联表（同一事务）`);
  sections.push(`    for (ItemReq item : req.getItems()) {`);
  sections.push(`        XxxItemEntity itemEntity = new XxxItemEntity();`);
  sections.push(`        itemEntity.setXxxId(entity.getId());`);
  sections.push(`        xxxItemMapper.insert(itemEntity);`);
  sections.push(`    }`);
  sections.push(``);
  sections.push(`    // 5. 清除缓存`);
  sections.push(`    cacheAPI.deleteFromCache(CacheKey.XXX_KEY + entity.getCode());`);
  sections.push(``);
  sections.push(`    return Result.success();`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);
  sections.push(`### 示例 2：不需要事务的操作（只读查询）\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 场景：纯查询操作，不修改数据，不需要事务`);
  sections.push(`// 注意：不加 @Transactional，或使用 readOnly=true`);
  sections.push(`public Result<XxxDTO> queryXxx(String code) {`);
  sections.push(`    // 1. 参数校验`);
  sections.push(`    if (StringUtils.isBlank(code)) {`);
  sections.push(`        return Result.fail("PARAM_ERROR", "code不能为空");`);
  sections.push(`    }`);
  sections.push(``);
  sections.push(`    // 2. 优先读缓存`);
  sections.push(`    XxxDTO dto = cacheAPI.getOrSetCache(`);
  sections.push(`        CacheKey.XXX_KEY + code,`);
  sections.push(`        () -> {`);
  sections.push(`            XxxEntity entity = xxxMapper.selectByCode(code);`);
  sections.push(`            return entity != null ? entity.toDTO() : null;`);
  sections.push(`        },`);
  sections.push(`        3600`);
  sections.push(`    );`);
  sections.push(``);
  sections.push(`    // 3. 返回结果`);
  sections.push(`    if (dto == null) {`);
  sections.push(`        return Result.fail("NOT_FOUND", "记录不存在");`);
  sections.push(`    }`);
  sections.push(`    return Result.success(dto);`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);
  
  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Service 的描述已填写`);
  sections.push(`- [ ] 每个方法的业务描述已填写`);
  sections.push(`- [ ] 每个方法的可能异常已填写`);
  sections.push(`- [ ] 每个核心方法的实现伪代码已填写`);
  sections.push(`- [ ] 事务与异常处理表格已填写`);
  sections.push(`- [ ] 搜索 \`[请补充\` 结果为 0\n`);
  
  return sections.join('\n');
}

// Generate Models (Entities + DTOs) document
function generateModelsDoc(moduleName: string, entities: ClassInfo[], dtos: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];
  
  sections.push(`# ${moduleName} - Models\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);
  
  sections.push(`> **AI 处理指南**: 请为重要字段补充业务含义，完成后报告 "✅ Models 已补充"\n`);
  
  // Entities
  if (entities.length > 0) {
    sections.push(`## 🗄️ 实体类 (Entity)\n`);
    
    for (const cls of entities) {
      sections.push(`### ${cls.name}\n`);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '**[请补充: 该实体代表什么]**'}\n`);
      
      if (cls.fields.length > 0) {
        sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值/约束 | 示例 |`);
        sections.push(`|------|------|------|----------|----------------|------|`);
        
        for (const field of cls.fields) {
          const desc = field.description || '[请补充]';
          // 尝试从注解推断必填
          const required = field.optional === false ? '是' : (field.optional === true ? '否' : '[是/否]');
          sections.push(`| \`${field.name}\` | \`${field.type}\` | ${required} | ${desc} | **[长度/范围/枚举值]** | **[示例值]** |`);
        }
        sections.push(``);
      }
      sections.push(`---\n`);
    }
  }
  
  // DTOs
  if (dtos.length > 0) {
    sections.push(`## 📦 数据传输对象 (DTO)\n`);
    
    for (const cls of dtos) {
      sections.push(`### ${cls.name}\n`);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '**[请补充: 该 DTO 的用途]**'}\n`);
      
      if (cls.fields.length > 0) {
        sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值/约束 | 示例 |`);
        sections.push(`|------|------|------|----------|----------------|------|`);
        
        for (const field of cls.fields) {
          const desc = field.description || '[请补充]';
          const required = field.optional ? '否' : '是';
          sections.push(`| \`${field.name}\` | \`${field.type}\` | ${required} | ${desc} | **[长度/范围/枚举值]** | **[示例值]** |`);
        }
        sections.push(``);
      }
      sections.push(`---\n`);
    }
  }
  
  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Entity/DTO 的描述已填写`);
  sections.push(`- [ ] 每个字段的业务含义已填写`);
  sections.push(`- [ ] 每个字段的格式/取值/约束已填写`);
  sections.push(`- [ ] 每个字段的示例值已填写`);
  sections.push(`- [ ] 搜索 \`[请补充\` 结果为 0`);
  sections.push(`- [ ] 搜索 \`[示例值]\` 结果为 0`);
  sections.push(`- [ ] 搜索 \`[长度/范围\` 结果为 0\n`);
  
  return sections.join('\n');
}

// Generate Others document
function generateOthersDoc(moduleName: string, others: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];
  
  sections.push(`# ${moduleName} - 其他类\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);
  
  for (const cls of others) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **类型**: \`${cls.type}\``);
    sections.push(`- **描述**: ${cls.description || '-'}\n`);
    
    if (cls.methods.length > 0) {
      sections.push(`**方法:**`);
      for (const method of cls.methods) {
        sections.push(`- \`${method.name}()\``);
      }
      sections.push(``);
    }
    sections.push(`---\n`);
  }
  
  return sections.join('\n');
}

/**
 * Generate AI completion prompt for one-click business logic filling
 * This creates a comprehensive prompt that AI can use to fill in all business descriptions
 */
export function generateAICompletionPrompt(context: ProjectContext): string {
  const sections: string[] = [];
  const allClasses = context.allClasses || [];
  
  // Calculate statistics
  const controllers = allClasses.filter(c => c.type === 'controller');
  const services = allClasses.filter(c => c.type === 'service');
  const entities = allClasses.filter(c => c.type === 'entity');
  const dtos = allClasses.filter(c => c.type === 'dto');
  const repositories = allClasses.filter(c => c.type === 'repository');
  
  // Helper to extract module name from file path
  const getModuleName = (filePath: string): string => {
    // Try to get module name from path like src/main/java/com/xxx/module/...
    const parts = filePath.split('/');
    // Find 'java' and take the next meaningful segment after package structure
    const javaIndex = parts.indexOf('java');
    if (javaIndex >= 0 && javaIndex + 4 < parts.length) {
      // Skip com/xxx/project -> get module name
      return parts[javaIndex + 4] || 'main';
    }
    // Fallback: use parent directory name
    return parts[parts.length - 2] || 'main';
  };
  
  // Group by module
  const moduleMap = new Map<string, ClassInfo[]>();
  for (const cls of allClasses) {
    const module = getModuleName(cls.filePath);
    if (!moduleMap.has(module)) {
      moduleMap.set(module, []);
    }
    moduleMap.get(module)!.push(cls);
  }
  const moduleNames = Array.from(moduleMap.keys()).sort();
  
  // Header
  sections.push(`# AI 一键补全业务文档\n`);
  sections.push(`> 将此提示词发送给 AI 助手，让 AI 自动分析代码并填充所有业务描述\n`);
  sections.push(`---\n`);
  
  // ❗ Critical Requirements
  sections.push(`## ❗ 强制要求（必须遵守）\n`);
  sections.push(`**警告：以下要求必须严格执行，禁止跳过或遗漏！**\n`);
  sections.push(`1. **零占位符原则**：所有 \`**[请补充]**\`、\`**[请补充错误码]**\`、\`**[示例值]**\` 等占位符必须替换为实际内容`);
  sections.push(`2. **无遗漏原则**：每一个 Controller/Service/Entity/DTO 的每一个字段和方法都必须有完整描述`);
  sections.push(`3. **检查原则**：每完成一个文件，必须搜索 \`[请补充\` 确认无遗漏`);
  sections.push(`4. **完成标准**：文档中不应包含任何 \`[请补充\`、\`**[请补充\`、\`[示例\`、\`[格式\` 等占位文本\n`);
  
  // Project Overview
  sections.push(`## 📊 项目概览\n`);
  sections.push(`| 统计项 | 数量 |`);
  sections.push(`|--------|------|`);
  sections.push(`| 模块数 | ${moduleNames.length} |`);
  sections.push(`| Controller | ${controllers.length} |`);
  sections.push(`| Service | ${services.length} |`);
  sections.push(`| Entity | ${entities.length} |`);
  sections.push(`| DTO | ${dtos.length} |`);
  sections.push(`| Repository/Mapper | ${repositories.length} |`);
  sections.push(`| 总类数 | ${allClasses.length} |\n`);
  
  // Module List
  sections.push(`## 📁 模块列表\n`);
  
  // 判断是否是基础设施模块
  const infraModulePatterns = [
    'config', 'configuration', 'common', 'utils', 'util',
    'core', 'base', 'framework', 'infrastructure', 'bootstrap',
    'test', 'testutils', 'mock'
  ];
  const skipModulePatterns = ['starter'];
  const isInfraModule = (name: string) => infraModulePatterns.some(pattern => 
    name.toLowerCase().includes(pattern)
  );
  const shouldSkipModule = (name: string) => skipModulePatterns.some(pattern => 
    name.toLowerCase().includes(pattern)
  );
  
  for (const moduleName of moduleNames) {
    // 跳过 starter 模块
    if (shouldSkipModule(moduleName)) {
      sections.push(`- ~~${moduleName}~~ — 配置类模块，已跳过`);
      continue;
    }
    
    const moduleClasses = moduleMap.get(moduleName)!;
    const mControllers = moduleClasses.filter(c => c.type === 'controller').length;
    const mServices = moduleClasses.filter(c => c.type === 'service').length;
    const mEntities = moduleClasses.filter(c => c.type === 'entity').length;
    
    if (isInfraModule(moduleName)) {
      sections.push(`- **${moduleName}** ⚠️ 基础设施模块（可简化处理）: ${moduleClasses.length} 个类`);
    } else {
      sections.push(`- **${moduleName}**: ${mControllers} Controllers, ${mServices} Services, ${mEntities} Entities`);
    }
  }
  sections.push(``);
  
  // The Prompt
  sections.push(`---\n`);
  sections.push(`## 🎯 AI 补全指令\n`);
  sections.push(`请按以下步骤为项目补充完整的业务文档：\n`);
  
  sections.push(`### 步骤 1：阅读代码，理解业务\n`);
  sections.push(`请依次打开以下目录中的所有 .java 文件，仔细阅读代码：`);
  sections.push(``);
  for (const moduleName of moduleNames) {
    sections.push(`- \`cainiaospec/modules/${moduleName}/\``);
  }
  sections.push(``);
  sections.push(`重点关注：`);
  sections.push(`- Controller 的 API 端点和请求处理逻辑`);
  sections.push(`- Service 的核心业务方法和调用链`);
  sections.push(`- Entity/DTO 的字段含义和用途`);
  sections.push(``);
  
  sections.push(`### 步骤 2：补充模块概览（README.md）\n`);
  sections.push(`对于每个模块的 \`README.md\`，补充以下内容：\n`);
  sections.push(`1. **🎯 业务场景**`);
  sections.push(`   - 核心价值：该模块解决什么问题`);
  sections.push(`   - 服务对象：谁在使用这个模块`);
  sections.push(`   - 主要场景：列出 3-5 个具体业务场景\n`);
  sections.push(`2. **🔄 核心业务流程**`);
  sections.push(`   - 用 Mermaid sequenceDiagram 绘制 3-5 个核心流程`);
  sections.push(`   - 标注关键的校验点和分支逻辑\n`);
  sections.push(`3. **📜 核心业务规则**`);
  sections.push(`   - 列出该模块的关键业务规则`);
  sections.push(`   - 每条规则包含：判断条件、处理逻辑、异常情况\n`);
  sections.push(`4. **🔀 状态流转**（如果有状态机）`);
  sections.push(`   - 用 Mermaid stateDiagram-v2 绘制状态图`);
  sections.push(`   - 说明每个状态的含义和可执行操作\n`);
  sections.push(`5. **❓ FAQ**`);
  sections.push(`   - 添加 3-5 个开发者常见问题\n`);
  
  sections.push(`### 步骤 3：补充 Controller 描述（controllers.md）\n`);
  sections.push(`对于每个 Controller：\n`);
  sections.push(`1. **描述**：一句话说明该 Controller 负责什么业务`);
  sections.push(`2. **业务功能**：列出 2-3 个主要功能点`);
  sections.push(`3. **服务场景**：说明哪些用户/系统使用这些 API`);
  sections.push(`4. **API 端点表**：为每个方法填写：`);
  sections.push(`   - 用途说明`);
  sections.push(`   - 参数格式要求（如日期格式 yyyy-MM-dd、枚举取值、必填/选填）`);
  sections.push(`   - 返回值说明`);
  sections.push(`   - 常见错误码和处理\n`);
  
  sections.push(`### 步骤 4：补充 Service 描述（services.md）\n`);
  sections.push(`对于每个 Service 的核心方法：\n`);
  sections.push(`1. **业务描述**：这个方法做什么业务`);
  sections.push(`2. **执行步骤**：1.xxx 2.xxx 3.xxx`);
  sections.push(`3. **调用链**：调用了哪些其他服务/DAO`);
  sections.push(`4. **异常处理**：可能抛出的异常和处理方式\n`);
  
  sections.push(`### 步骤 5：补充 Model 字段描述（models.md）\n`);
  sections.push(`对于每个 Entity/DTO 的每个字段，必须填写：\n`);
  sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值 | 示例 |`);
  sections.push(`|------|------|------|----------|----------|------|`);
  sections.push(`| code | String | 是 | 订单编号 | 20位，前缀ORD | \`ORD20250312001234\` |`);
  sections.push(`| status | Integer | 是 | 订单状态 | 1=待处理,2=处理中,3=完成 | \`1\` |`);
  sections.push(`| amount | BigDecimal | 是 | 订单金额 | 单位:元,保留两位小数 | \`199.99\` |`);
  sections.push(`| createTime | Date | 否 | 创建时间 | yyyy-MM-dd HH:mm:ss | \`2025-03-12 10:30:00\` |\n`);
  sections.push(`**重点关注：**`);
  sections.push(`- 枚举字段必须列出所有取值及含义`);
  sections.push(`- 日期字段必须说明格式`);
  sections.push(`- 金额字段必须说明单位和精度`);
  sections.push(`- 编码字段必须说明规则\n`);
  
  // Output Format
  sections.push(`---\n`);
  sections.push(`## 📝 输出格式要求\n`);
  sections.push(`1. **直接修改文件**：不要输出到对话，直接编辑 cainiaospec/modules/ 下的 md 文件`);
  sections.push(`2. **删除占位符**：完成补充后，删除所有 \`[请 AI 补充]\` 占位符`);
  sections.push(`3. **使用中文**：所有描述使用简洁的中文`);
  sections.push(`4. **保持格式**：保持原有的 Markdown 表格和标题格式`);
  sections.push(`5. **逐模块处理**：一个模块一个模块地处理，每完成一个模块报告进度\n`);
  sections.push(`6. **强制检查**：每个文件完成后必须执行以下检查：`);
  sections.push(`   \`\`\``);
  sections.push(`   搜索关键词: [请补充  [格式  [示例  [错误码  **[`);
  sections.push(`   确认结果: 必须为 0 个匹配项`);
  sections.push(`   \`\`\`\n`);
  
  // Key Classes Summary (help AI focus)
  sections.push(`---\n`);
  sections.push(`## 🔍 核心类速览\n`);
  sections.push(`以下是需要重点关注的核心类（按模块分组）：\n`);
  
  for (const moduleName of moduleNames.slice(0, 10)) { // Limit to first 10 modules
    const moduleClasses = moduleMap.get(moduleName)!;
    sections.push(`### ${moduleName}\n`);
    
    const mControllers = moduleClasses.filter(c => c.type === 'controller');
    const mServices = moduleClasses.filter(c => c.type === 'service');
    
    if (mControllers.length > 0) {
      sections.push(`**Controllers:**`);
      for (const ctrl of mControllers.slice(0, 5)) {
        const methodCount = ctrl.methods.length;
        sections.push(`- \`${ctrl.name}\` (${methodCount} 个 API) - ${ctrl.description || '待补充'}`);
      }
      if (mControllers.length > 5) {
        sections.push(`- ... 还有 ${mControllers.length - 5} 个 Controller`);
      }
      sections.push(``);
    }
    
    if (mServices.length > 0) {
      sections.push(`**Services:**`);
      for (const svc of mServices.slice(0, 5)) {
        const methodCount = svc.methods.length;
        sections.push(`- \`${svc.name}\` (${methodCount} 个方法) - ${svc.description || '待补充'}`);
      }
      if (mServices.length > 5) {
        sections.push(`- ... 还有 ${mServices.length - 5} 个 Service`);
      }
      sections.push(``);
    }
  }
  
  if (moduleNames.length > 10) {
    sections.push(`\n> 注：还有 ${moduleNames.length - 10} 个模块未展示，请查看 cainiaospec/modules/ 目录\n`);
  }
  
  // 后续工作流简介
  sections.push(`---\n`);
  sections.push(`## 📖 文档补充完成后\n`);
  sections.push(`文档补充完成后，请阅读 **cainiaospec/AGENTS.md** 了解 CainiaoSpec 的完整工作流程：\n`);
  sections.push(`| 阶段 | 命令 | 说明 |`);
  sections.push(`|------|------|------|`);
  sections.push(`| 创建提案 | \`/proposal 功能描述\` | 让 AI 读取模块文档，创建详细的实施提案 |`);
  sections.push(`| 实施提案 | \`/apply change-id\` | 按照提案实施代码变更 |`);
  sections.push(`| 归档变更 | \`/archive change-id\` | 归档并同步更新模块文档 |\n`);
  sections.push(`> 提示：试试告诉 AI “请解释 cainiaospec/AGENTS.md 中的工作流程”\n`);
  
  // Final instruction
  sections.push(`---\n`);
  sections.push(`## 🚀 开始执行\n`);
  sections.push(`请现在开始执行上述步骤，从第一个模块 **${moduleNames[0] || 'main'}** 开始。\n`);
  sections.push(`每完成一个模块，请报告："✅ [模块名] 已完成，占位符检查: 0 个遗漏"\n`);
  sections.push(`全部完成后，执行最终检查并报告：\n`);
  sections.push(`\`\`\``);
  sections.push(`🎉 所有模块业务文档已补充完成！`);
  sections.push(``);
  sections.push(`完成度检查:`);
  sections.push(`- README.md: X 个模块 ✓`);
  sections.push(`- controllers.md: X 个 Controller, Y 个 API ✓`);
  sections.push(`- services.md: X 个 Service, Y 个方法 ✓`);
  sections.push(`- models.md: X 个 Entity/DTO, Y 个字段 ✓`);
  sections.push(``);
  sections.push(`占位符检查: 全局搜索 "[请补充" 结果为 0`);
  sections.push(`\`\`\`\n`);
  
  return sections.join('\n');
}
