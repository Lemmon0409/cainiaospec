import type { 
  ClassInfo, 
  ApiEndpoint, 
  BusinessLogicInfo,
  CodeStyleInfo,
  ProjectStructure,
  ClassDependency,
  MyBatisMapperInfo,  // ENHANCED: Import for SQL output
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
  // ENHANCED: Include MyBatis mapper SQL for direct output
  mybatisMappers?: MyBatisMapperInfo[];
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
        const repositories = moduleClasses.filter(c => c.type === 'repository');

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
        if (repositories.length > 0) {
          sections.push(`  - [🗄️ Mappers](modules/${module.name}/mappers.md) - ${repositories.length} 个`);
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
  sections.push(`<!-- AI_INSTRUCTION: 说明该模块的业务目标、解决的问题、服务场景 -->\n`);
  sections.push(`示例结构（请替换为实际内容）：`);
  sections.push(`- **核心价值**: [该模块解决的核心问题]`);
  sections.push(`- **服务对象**: [哪些用户群体/系统使用这个模块]`);
  sections.push(`- **场景1**: [具体业务场景描述]`);
  sections.push(`- **场景2**: [具体业务场景描述]`);
  sections.push(`- **场景3**: [具体业务场景描述]\n`);
  
  // Core business flows placeholder - ENHANCED with Mermaid examples
  sections.push(`## 🔄 核心业务流程\n`);
  sections.push(`<!-- AI_INSTRUCTION: 
为每个主要业务场景绘制 Mermaid 流程图，建议 3-5 个
使用 sequenceDiagram 或 flowchart 格式
示例：。。。mermaid
sequenceDiagram
  participant User
  participant OrderService
  participant PaymentService
  User->>OrderService: 创建订单
  OrderService->>PaymentService: 发起支付
  PaymentService-->>OrderService: 支付成功
  OrderService-->>User: 返回订单结果
。。。
-->\n`);
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
  sections.push(`<!-- AI_INSTRUCTION: 
从代码中提取关键业务规则和约束：
1. 校验规则（如字段必填、格式约束）
2. 计算规则（如金额计算、积分规则）
3. 状态流转规则（如订单状态变更条件）
4. 权限规则（如操作权限限制）
格式：
- **规则名称**：具体描述
-->\n`);
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
  sections.push(`<!-- AI_INSTRUCTION: 
如果该模块有状态机，绘制状态流转图
使用 Mermaid stateDiagram 格式
示例：。。。mermaid
stateDiagram-v2
  [*] --> 待处理
  待处理 --> 处理中 : 开始处理
  处理中 --> 完成 : 处理成功
  处理中 --> 失败 : 处理失败
。。。
如果没有状态机，删除此章节
-->\n`);
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
    sections.push(`<!-- AI_INSTRUCTION: 
为每个 Controller 补充：
1. 业务功能概述
2. 服务场景说明
3. 核心 API 的用途、参数、返回值、错误码
-->
`);
    
    for (const cls of controllers) {
      sections.push(`### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '<!-- AI_INSTRUCTION: 补充该 Controller 的业务功能概述 -->'}`);
      if (cls.extends) {
        sections.push(`- **继承**: \`${cls.extends}\``);
      }
      if (cls.dependencies.length > 0) {
        sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
      }
      
      // Business functions placeholder
      sections.push(`- **业务功能**: <!-- AI_INSTRUCTION: 说明该Controller提供的核心业务能力 -->`);
      sections.push(`  - 功能1: [具体功能描述]`);
      sections.push(`  - 功能2: [具体功能描述]`);
      sections.push(`- **服务场景**: <!-- AI_INSTRUCTION: 说明哪些业务场景会使用这些API -->`);
      sections.push(`  - [哪些用户/系统使用这些 API]\n`);
      
      // Methods with enhanced format for Controllers
      if (cls.methods.length > 0) {
        sections.push(`**核心 API 端点：**\n`);
        sections.push(`| 端点 | 用途 | 参数格式要求 | 常见错误码 |`);
        sections.push(`|------|------|--------------|------------|`);
        
        for (const method of cls.methods) {
          const desc = method.description || method.businessLogic || '';
          sections.push(`| \`${method.name}()\` | ${desc || '<!-- AI_INSTRUCTION: \n从实际代码中提取该API的：\n1. 完整API路径和方法（如 POST /api/order/create）\n2. 请求参数示例（JSON格式）\n3. 成功响应示例（JSON格式）\n4. 核心业务逻辑代码片段\n\n不要生成伪代码，直接引用实际代码，格式：\n```java\n@PostMapping("/api/xxx")\npublic Result<XxxVO> methodName(@RequestBody XxxReq req) {\n    // 实际代码\n}\n```\n-->'}  | <!-- AI_INSTRUCTION: \n补充请求/响应格式要求：\n- 日期字段格式（如 yyyy-MM-dd HH:mm:ss）\n- 枚举值列表（如 1=待处理,2=处理中）\n- 必填字段标注\n--> | <!-- AI_INSTRUCTION: \n从代码中提取该API可能返回的错误码：\n- 业务错误码（如 ORDER_NOT_FOUND）\n- HTTP状态码（如 400, 404, 500）\n格式：错误码 - 错误描述\n--> |`);
        }
        sections.push('');
      }
      
      sections.push('');
    }
  }
  
  // Services with enhanced format
  if (services.length > 0) {
    sections.push(`## ⚙️ 服务类（业务逻辑）\n`);
    sections.push(`<!-- AI_INSTRUCTION: 
为每个 Service 的核心方法补充：
1. 业务职责概述
2. 方法的业务描述、执行步骤、调用链
3. 可能抛出的异常
-->
`);
    
    for (const cls of services) {
      sections.push(`### \`${cls.name}\``);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '<!-- AI_INSTRUCTION: 补充该 Service 的业务职责概述 -->'}`);
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
          const desc = method.description || method.businessLogic || '';
          sections.push(`| \`${method.name}()\` | \`${params}\` | \`${method.returnType || 'void'}\` | ${desc || '<!-- AI_INSTRUCTION: \n从实际代码中提取该方法的：\n1. 完整方法签名\n2. 核心业务逻辑（代码片段）\n3. 调用的其他方法/DAO\n4. 返回值处理\n\n不要生成伪代码，直接引用实际代码片段，格式：\n```java\n// 从 XxxService.java:行号 提取\npublic ReturnType methodName(ParamType param) {\n    // 实际代码\n}\n```\n-->'} | <!-- AI_INSTRUCTION: \n从代码中提取该方法可能抛出的异常：\n- 业务异常类型\n- 异常触发条件\n格式：ExceptionType - 触发条件\n--> |`);
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
      sections.push(`<!-- AI_INSTRUCTION: 
为关键字段补充说明：
1. 业务含义（字段代表什么）
2. 必填性（必填/可选）
3. 格式约束（长度、正则、枚举值）
4. 示例值
-->
`);
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
          sections.push(`| 字段 | 类型 | 说明 | 示例 |`);
          sections.push(`|------|------|------|------|`);
          
          for (const field of cls.fields) {
            const desc = field.description || '[请 AI 补充]';
           sections.push(`| \`${field.name}\` | \`${field.type}\` | <!-- AI_INSTRUCTION: 
从代码中提取该字段的：
1. 必填性（从@NotNull等注解判断，写"必填"或"可选"）
2. 业务含义（从字段名和注释推断）
3. 格式约束（从@Pattern/@Length等注解提取）
4. 枚举值（如果是枚举类型，列出所有值）
格式示例：订单编号，20位前缀ORD，系统生成，必填
--> | <!-- AI_INSTRUCTION: 
生成符合格式的真实示例值
--> |`);
          }
        } else {
          sections.push(`| 字段 | 类型 | 必填 | 业务含义 | 格式/取值 | 示例 |`);
          sections.push(`|------|------|------|----------|----------|------|`);
          
          for (const field of cls.fields) {
            const desc = field.description || '[请 AI 补充]';
            const required = field.optional ? '否' : '是';
           sections.push(`| \`${field.name}\` | \`${field.type}\` | <!-- AI_INSTRUCTION: 
从代码中提取该字段的：
1. 必填性（从@NotNull等注解判断，写"必填"或"可选"）
2. 业务含义（从字段名和注释推断）
3. 格式约束（从@Pattern/@Length/@Size等注解提取）
4. 枚举值（如果是枚举类型，列出所有值）
格式示例：订单状态，1=待处理,2=处理中,3=完成，必填
--> | <!-- AI_INSTRUCTION: 
生成符合格式的真实示例值
--> |`);
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
  sections.push(`<!-- AI_INSTRUCTION: 
根据代码逐步和业务规则，添加 3-5 个常见问题：
1. 状态判断类（如"如何判断订单能否取消？"）
2. 规则解释类（如"什么情况下会触发重复订单检查？"）
3. 异常处理类（如"创建订单失败的常见原因？"）
格式：
**Q1: [问题]?**
A: [解答]
-->\n`);
  
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
  const repositories = classes.filter(c => c.type === 'repository');
  const others = classes.filter(c => !['controller', 'service', 'entity', 'dto', 'repository'].includes(c.type));

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

  // 5. Mappers SQL document (NEW)
  if (repositories.length > 0) {
    docs.push({
      path: `${moduleDir}/mappers.md`,
      content: generateMappersDoc(moduleName, repositories, context),
    });
  }

  // 6. Other classes (if any)
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
    sections.push(`**<!-- AI_INSTRUCTION: 简要说明该模块的用途，不需详细业务文档 -->**\n`);
    
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
  if (context.allClasses) {
    const repositories = allClasses.filter(c => c.type === 'repository');
    if (repositories.length > 0) {
      sections.push(`| [🗄️ Mappers](mappers.md) | 数据访问层和 SQL | ${repositories.length} 个 |`);
    }
  }
  sections.push(`\n`);
  
  // Business scenario - SIMPLIFIED: 移除详细业务场景描述，只保留核心概述
  sections.push(`## 🎯 业务场景\n`);
  sections.push(`> **精简说明**: 该模块的核心业务功能概述\n`);
  sections.push(`**<!-- AI_INSTRUCTION: 一句话概括该模块的核心功能 -->**\n`);
  sections.push(`**核心功能**: [一句话描述该模块做什么]\n`);

  // Core business flows - SIMPLIFIED: 只保留调用链 DSL 和关键代码片段，移除 Mermaid 图
  sections.push(`## 🔄 核心业务流程\n`);
  sections.push(`<!-- AI_INSTRUCTION:
分析 3-5 个核心业务场景的方法调用链，生成真实的调用序列

步骤：
1. 识别方法入口（Controller 方法）
2. 追踪 Service 调用
3. 追踪 Mapper/Repository 调用
4. 标注数据库操作、事务边界、外部调用
5. 提取关键代码片段

格式要求（精简版，只保留必要内容）：

每个流程应包含两部分：

**第一步：调用链 DSL**
使用树形结构描述方法调用链：
- 使用 ├─> 表示中间调用
- 使用 └─> 表示最后一个调用
- 标注 @Transactional 事务边界
- 标注 [SQL查询]/[SQL写入] 等数据库操作
- 标注外部调用（如 RPC、HTTP）

**第二步：关键代码片段**
从实际代码中提取关键逻辑：
- 使用 java 代码块
- 标注文件名和行号
- 只提取核心业务逻辑，不要完整方法
-->\n`);
  sections.push(`### 流程 1: <!-- AI_FILL_HERE: 流程名称（从 Controller 方法提取）-->\n`);
  sections.push(`**调用链 DSL：**\n`);
  sections.push(`<!-- AI_FILL_HERE:
从实际代码中提取调用链，必须使用树形结构

示例格式：
BusOptibusSyncController.syncTask(vo)
  ├─> 参数校验: @Valid OptibusSyncTaskVO
  ├─> @Transactional BusTaskService.sync(driverCodes, date)
  │   ├─> OptibusApiClient.fetchTasks(driverCodes, date) [HTTP调用]
  │   ├─> BusTaskMapper.batchInsert(tasks) [SQL写入]
  │   └─> 缓存更新: cacheAPI.delete("task:" + driverCode)
  └─> 返回: Result.ofSuccess(tasks)
-->\n`);
  sections.push(`**关键代码片段：**\n`);
  sections.push(`<!-- AI_FILL_HERE:
从实际代码中提取该流程的关键逻辑（5-20行）

格式：\\\`\\\`\\\`java
// 从 ActualFileName.java:实际行号-实际行号 提取
实际的代码片段
\\\`\\\`\\\`\`
-->\n`);
  sections.push(`### 流程 2: <!-- AI_FILL_HERE: 流程名称（从 Controller 方法提取）-->\n`);
  sections.push(`<!-- AI_INSTRUCTION: 按照流程 1 的格式，包含调用链 DSL、关键代码片段 -->\n`);
  sections.push(`### 流程 3: <!-- AI_FILL_HERE: 流程名称（从 Controller 方法提取）-->\n`);
  sections.push(`<!-- AI_INSTRUCTION: 按照流程 1 的格式，包含调用链 DSL、关键代码片段 -->\n`);

  // Business rules
  sections.push(`## 📜 核心业务规则\n`);
  sections.push(`> **❗ 重要: 代码优先原则**\n`);
  sections.push(`> - **❌ 不要使用文字描述规则**\n`);
  sections.push(`> - **✅ 使用代码片段**（AI 可直接复制运行）\n`);
  sections.push(`> 此部分必须全面且准确，是 AI 编程的依据\n`);

  sections.push(`<!-- AI_INSTRUCTION:`);
  sections.push(`从代码中提取实际的业务规则代码片段（不是示例，是真实代码）`);
  sections.push(``);
  sections.push(`步骤：`);
  sections.push(`1. 搜索代码中的 if 语句、throw 语句、校验逻辑`);
  sections.push(`2. 识别业务规则的判断条件和处理逻辑`);
  sections.push(`3. 提取完整的代码片段（包括注释）`);
  sections.push(`4. 标注文件名和行号`);
  sections.push(``);
  sections.push(`格式：`);
  sections.push(``);
  sections.push(`### 规则 X: [从代码中提取规则名称]`);
  sections.push(``);
  sections.push(`**实际代码：**`);
  sections.push(`\\\`\\\`\\\`java`);
  sections.push(`// 从 ActualFileName.java:实际行号-实际行号 提取`);
  sections.push(``);
  sections.push(`实际的 if/throw 代码`);
  sections.push(`\\\`\\\`\\\``);
  sections.push(``);
  sections.push(`**说明**：{一句话解释该规则}`);
  sections.push(`**代码位置**：\\\`ActualFileName.java:实际行号-实际行号\\\``);
  sections.push(`---`);
  sections.push(`-->\n`);
  sections.push(`<!-- AI_FILL_HERE: 从 Service 层代码中提取所有业务规则 -->\n`);

  
 // State machine
  sections.push(`## 🔀 状态流转\n`);
  sections.push(`<!-- AI_INSTRUCTION:
从枚举类和数据库状态字段分析状态流转规则：

步骤：
1. 识别所有状态值（从 XxxStatusEnum 或实体类的 status 字段提取）
2. 分析状态转换方法（从 updateStatus() 等方法的调用分析）
3. 提取触发条件（从 if 语句和业务逻辑分析）
4. 标注可执行操作（从 Controller 方法的条件判断分析）
5. 标注代码位置（ClassName:行号）

输出状态转换规则表格
-->\n`);
  sections.push(`### 状态转换规则\n`);
  sections.push(`<!-- AI_INSTRUCTION:
从代码中提取状态转换逻辑，生成表格：

| 当前状态 | 可执行操作 | 目标状态 | 触发条件 | 代码位置 |
|---------|-----------|----------|----------|----------|
| 状态枚举值 | Controller方法名/业务操作 | 目标状态枚举值 | 从if条件提取 | ClassName:行号 |

要求：
- 当前状态、目标状态必须是枚举类中定义的实际值
- 可执行操作应该是实际的接口路径或方法名
- 触发条件要具体（不要写"满足条件"，要写具体条件）
- 代码位置格式：ClassName:行号
-->\n`);
  sections.push(`| 当前状态 | 可执行操作 | 目标状态 | 触发条件 | 代码位置 |`);
  sections.push(`|---------|-----------|----------|----------|----------|`);
  sections.push(`<!-- AI_FILL_HERE: 从状态转换相关代码提取 -->\n`);

  // Exception handling specification - SIMPLIFIED: 移除处理建议
  sections.push(`## ⚠️ 错误码\n`);
  sections.push(`<!-- AI_INSTRUCTION:
从代码中提取所有 throw 语句，按错误码分组。

输出格式：

### {错误码常量名}

**错误码值**：\`{错误码字符串}\`

**抛出位置**：
\\\`\\\`\\\`java
// {ClassName}.java:{行号}
if ({触发条件}) {
    throw new {异常类}({错误码常量}, {参数});
}
\\\`\\\`\\\`\

---

示例：

### PARAM_ERROR

**错误码值**：\`PARAM_ERROR\`

**抛出位置**：
\\\`\\\`\\\`java
// BusQueryService.java:45
if (StringUtils.isBlank(driverCode)) {
    throw new FmsBaseDataSysException("PARAM_ERROR", "driverCode不能为空");
}
\\\`\\\`\\\`\

---
-->\n`);

  // Module statistics
  sections.push(`## 📊 模块统计\n`);
  sections.push(`- **控制器**: ${controllers.length} 个`);
  sections.push(`- **服务类**: ${services.length} 个`);
  sections.push(`- **实体类**: ${entities.length} 个`);
  sections.push(`- **DTO**: ${dtos.length} 个`);
  sections.push(`- **总类数**: ${allClasses.length} 个\n`);

  // FAQ - SIMPLIFIED: 可选填充部分
  sections.push(`## ❓ 常见问题 FAQ\n`);
  sections.push(`<!-- 可选：初始化时可跳过 -->\n`);
  sections.push(`<!-- AI_FILL_HERE: 从代码中提取 1-3 个常见问题和答案 -->\n`);

  // Module-specific features only
  sections.push(`## 🛠️ 模块特性\n`);
  sections.push(`<!-- AI_INSTRUCTION: 只保留本模块特有的配置和依赖 -->\n`);
  sections.push(`<!-- AI_FILL_HERE: 外部依赖、特殊配置、性能要点（如有） -->\n`);
  
  return sections.join('\n');
}

// Generate Controllers document (ENHANCED: Direct method body output)
function generateControllersDoc(moduleName: string, controllers: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];

  sections.push(`# ${moduleName} - Controllers\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);

  sections.push(`> **代码已自动提取，AI 只需补充业务语义**\n`);
  sections.push(`> - ✅ API 方法代码已从源码提取\n`);
  sections.push(`> - 请补充：API 的业务场景和使用说明\n`);

  for (const cls of controllers) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **描述**: ${cls.description || '**[AI 请补充: 一句话说明该 Controller 负责什么]**'}`);
    if (cls.dependencies.length > 0) {
      sections.push(`- **依赖**: \`${cls.dependencies.join('\`, \`')}\``);
    }
    sections.push(``);

    // ENHANCED: Output method body directly if available
    if (cls.methods.length > 0) {
      for (const method of cls.methods) {
        const httpMethod = method.decorators.find(d => 
          ['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'PatchMapping', 'RequestMapping'].includes(d)
        ) || 'API';
        
        sections.push(`### ${httpMethod}: ${method.name}()\n`);
        sections.push(`- **返回类型**: ${method.returnType || 'void'}`);
        sections.push(`- **参数**: ${method.parameters.map(p => `${p.type} ${p.name}`).join(', ') || '无'}`);
        if (method.decorators.length > 0) {
          sections.push(`- **注解**: ${method.decorators.map(d => `@${d}`).join(', ')}`);
        }
        sections.push(``);
        
        // Output rawBody if available
        if (method.rawBody) {
          sections.push(`**API 实现**:`);
          sections.push(`\`\`\`java`);
          sections.push(method.rawBody);
          sections.push(`\`\`\`\n`);
          
          sections.push(`<!-- AI_FILL: 请补充该 API 的业务说明：使用场景、请求示例、注意事项 -->\n`);
        } else {
          // Fallback: Ask AI to extract
          sections.push(`<!-- API 方法体未能自动提取，请 AI 从源文件提取 -->`);
          sections.push(`<!-- AI_FILL_HERE: 从 ${cls.name}.java 提取 ${method.name}() 的完整实现 -->\n`);
        }
      }
    }

    sections.push(`---\n`);
  }

  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Controller 的描述已填写`);
  sections.push(`- [ ] 每个 API 的业务场景已补充`);
  sections.push(`- [ ] 搜索 \`[AI 请补充\` 结果为 0\n`);

  return sections.join('\n');
}

// Generate Services document (ENHANCED: Direct method body output)
function generateServicesDoc(moduleName: string, services: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];

  sections.push(`# ${moduleName} - Services\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);

  sections.push(`> **代码已自动提取，AI 只需补充业务语义**\n`);
  sections.push(`> - ✅ 方法体代码已从源码提取\n`);
  sections.push(`> - 请补充：方法的业务逻辑说明和调用场景\n`);

  for (const cls of services) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **描述**: ${cls.description || '**[AI 请补充: 该 Service 的业务职责]**'}`);
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

    // ENHANCED: Output method body directly if available
    if (cls.methods.length > 0) {
      for (const method of cls.methods) {
        const params = method.parameters.map(p => p.name).join(', ');
        sections.push(`### ${method.name}(${params})\n`);
        sections.push(`- **返回类型**: ${method.returnType || 'void'}`);
        sections.push(`- **参数**: ${method.parameters.map(p => `${p.type} ${p.name}`).join(', ') || '无'}`);
        if (method.decorators.length > 0) {
          sections.push(`- **注解**: ${method.decorators.map(d => `@${d}`).join(', ')}`);
        }
        sections.push(``);
        
        // Output rawBody if available
        if (method.rawBody) {
          sections.push(`**方法实现**:`);
          sections.push(`\`\`\`java`);
          sections.push(method.rawBody);
          sections.push(`\`\`\`\n`);
          
          sections.push(`<!-- AI_FILL: 请补充该方法的业务逻辑说明：业务场景、调用时机、注意事项 -->\n`);
        } else {
          // Fallback: Ask AI to extract
          sections.push(`<!-- 方法体未能自动提取，请 AI 从源文件提取 -->`);
          sections.push(`<!-- AI_FILL_HERE: 从 ${cls.name}.java 提取 ${method.name}() 的完整实现 -->\n`);
        }
      }
    }

    sections.push(`---\n`);
  }

  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Service 的描述已填写`);
  sections.push(`- [ ] 每个方法的业务逻辑已补充`);
  sections.push(`- [ ] 搜索 \`[AI 请补充\` 结果为 0\n`);

  return sections.join('\n');
}

// Generate Models (Entities + DTOs) document
// ENHANCED: Directly output class source code if available
function generateModelsDoc(moduleName: string, entities: ClassInfo[], dtos: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];

  sections.push(`# ${moduleName} - Models\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);

  sections.push(`> **代码已自动提取，AI 只需补充业务语义**\n`);
  sections.push(`> - ✅ 完整类定义已从源码提取\n`);
  sections.push(`> - 请补充：字段的业务含义说明（在类代码后的 "<!-- AI_FILL -->" 处）\n`);

  // Entities
  if (entities.length > 0) {
    sections.push(`## 🗄️ 实体类 (Entity)\n`);

    for (const cls of entities) {
      sections.push(`### ${cls.name}\n`);
      sections.push(`- **文件**: \`${cls.filePath}\``);
      sections.push(`- **描述**: ${cls.description || '**[AI 请补充: 该实体代表什么]**'}\n`);

      // ENHANCED: Output rawSource directly if available
      if (cls.rawSource) {
        sections.push(`**完整类定义**：`);
        sections.push(`\`\`\`java`);
        sections.push(cls.rawSource);
        sections.push(`\`\`\`\n`);
        
        // Only ask AI to fill business meaning
        sections.push(`<!-- AI_FILL: 请为重要字段补充业务含义说明，格式: -->`);
        sections.push(`<!-- - \`fieldName\`: 业务含义，取值范围，示例值 -->\n`);
      } else {
        // Fallback: Ask AI to extract from file
        sections.push(`<!-- 类定义未能自动提取，请 AI 从源文件提取完整类定义 -->`);
        sections.push(`<!-- AI_FILL_HERE: 从 ${cls.name}.java 提取完整类定义 -->\n`);
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
      sections.push(`- **描述**: ${cls.description || '**[AI 请补充: 该 DTO 的用途]**'}\n`);

      // ENHANCED: Output rawSource directly if available
      if (cls.rawSource) {
        sections.push(`**完整类定义**：`);
        sections.push(`\`\`\`java`);
        sections.push(cls.rawSource);
        sections.push(`\`\`\`\n`);
        
        sections.push(`<!-- AI_FILL: 请为重要字段补充业务含义说明 -->\n`);
      } else {
        sections.push(`<!-- AI_FILL_HERE: 从 ${cls.name}.java 提取完整类定义 -->\n`);
      }
      sections.push(`---\n`);
    }
  }

  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Entity/DTO 的描述已填写`);
  sections.push(`- [ ] 重要字段的业务含义已补充`);
  sections.push(`- [ ] 搜索 \`[AI 请补充\` 结果为 0\n`);

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

// Generate Mappers SQL document (ENHANCED: Direct SQL output)
function generateMappersDoc(moduleName: string, repositories: ClassInfo[], context: ProjectContext): string {
  const sections: string[] = [];

  sections.push(`# ${moduleName} - Mappers\n`);
  sections.push(`[← 返回模块概览](README.md)\n`);
  sections.push(`---\n`);

  sections.push(`> **SQL 已自动提取，AI 只需补充业务语义**\n`);
  sections.push(`> - ✅ SQL 语句已从 XML/注解自动提取\n`);
  sections.push(`> - 请补充：SQL 的业务含义和使用场景\n`);

  // Build mapper SQL lookup from context
  const mapperSqlMap = new Map<string, Map<string, string>>();
  if (context.mybatisMappers) {
    for (const mapper of context.mybatisMappers) {
      const className = mapper.namespace.split('.').pop() || mapper.namespace;
      if (!mapperSqlMap.has(className)) {
        mapperSqlMap.set(className, new Map());
      }
      for (const stmt of mapper.statements) {
        if (stmt.sql) {
          mapperSqlMap.get(className)!.set(stmt.id, stmt.sql);
        }
      }
    }
  }

  for (const cls of repositories) {
    sections.push(`## ${cls.name}\n`);
    sections.push(`- **文件**: \`${cls.filePath}\``);
    sections.push(`- **描述**: ${cls.description || '**[AI 请补充: 该 Mapper 负责什么数据访问]**'}\n`);

    // Get SQL for this mapper
    const sqlMap = mapperSqlMap.get(cls.name);

    // Output each method with SQL
    if (cls.methods.length > 0) {
      for (const method of cls.methods) {
        const sql = sqlMap?.get(method.name);
        
        sections.push(`### ${method.name}()\n`);
        sections.push(`- **类型**: ${method.returnType || 'void'}`);
        sections.push(`- **参数**: ${method.parameters.map(p => `${p.type} ${p.name}`).join(', ') || '无'}\n`);
        
        if (sql) {
          sections.push(`**SQL 语句**:`);
          sections.push(`\`\`\`sql`);
          sections.push(sql);
          sections.push(`\`\`\`\n`);
          
          sections.push(`<!-- AI_FILL: 请补充该 SQL 的业务场景和使用说明 -->\n`);
        } else {
          // No SQL found, ask AI to extract
          sections.push(`<!-- SQL 未能自动提取，请 AI 从 XML/注解中提取 -->`);
          sections.push(`<!-- AI_FILL_HERE: 从 ${cls.name}.xml 或注解提取 ${method.name}() 的 SQL 实现 -->\n`);
        }
      }
    } else {
      sections.push(`<!-- 未检测到方法，该 Mapper 可能继承自 BaseMapper -->`);
      sections.push(`<!-- AI_FILL: 请说明该 Mapper 使用的 MyBatis-Plus CRUD 操作 -->\n`);
    }

    sections.push(`---\n`);
  }

  // 完成检查清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成检查\n`);
  sections.push(`完成补充后，请执行以下检查：\n`);
  sections.push(`- [ ] 每个 Mapper 的描述已填写`);
  sections.push(`- [ ] 每个方法的业务场景已补充`);
  sections.push(`- [ ] 搜索 \`[AI 请补充\` 结果为 0\n`);

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
  // 填充前必读
  sections.push(`## ✅ 填充前必读\n`);

  // 代码提取规则
  sections.push(`### 代码提取规则\n`);
  sections.push(`#### 1. 真实性原则`);
  sections.push(`- ✅ **从实际代码文件中复制粘贴**`);
  sections.push(`- ❌ **不要编造或简化代码**`);
  sections.push(`- ✅ **保留所有注释和注解**\n`);

  sections.push(`#### 2. 完整性原则`);
  sections.push(`- ✅ **方法签名必须包含所有注解**（@PostMapping, @Valid, @RequestBody 等）`);
  sections.push(`- ✅ **VO/DTO 必须包含所有字段和校验注解**`);
  sections.push(`- ✅ **Service 方法必须包含完整实现**（不是伪代码）`);
  sections.push(`- ✅ **import 语句要包含在内**\n`);

  sections.push(`#### 3. 可执行性原则`);
  sections.push(`- ✅ **提取的代码可以直接编译运行**`);
  sections.push(`- ✅ **类名、包名必须真实存在**\n`);

  sections.push(`#### 4. 标注原则`);
  sections.push(`- ✅ **所有代码片段都要标注来源**（文件名:行号）`);
  sections.push(`- ✅ **调用链必须标注** [SQL查询]/[@Transactional] 等`);
  sections.push(`- ✅ **异常代码必须标注触发条件**\n`);

  // 填充顺序
  sections.push(`### 填充顺序\n`);
  sections.push(`建议按以下顺序填充（避免遗漏）：\n`);
  sections.push(`1. **第一步：Models**`);
  sections.push(`   - 先填充 models.md（DTO/Entity 的完整类定义）`);
  sections.push(`   - 这样后续填充 Controller/Service 时可以引用\n`);
  sections.push(`2. **第二步：Mappers**`);
  sections.push(`   - 填充 mappers.md（SQL 实现）`);
  sections.push(`   - 这样填充 Service 时可以引用 Mapper 方法\n`);
  sections.push(`3. **第三步：Services**`);
  sections.push(`   - 填充 services.md（完整实现代码）`);
  sections.push(`   - 这样填充 Controller 时可以引用 Service 方法\n`);
  sections.push(`4. **第四步：Controllers**`);
  sections.push(`   - 填充 controllers.md（完整 API 实现）\n`);
  sections.push(`5. **第五步：README**`);
  sections.push(`   - 填充 README.md（业务场景、流程图、业务规则）`);
  sections.push(`   - 可以引用前面填充的代码\n`);

  // 常见错误
  sections.push(`### 常见错误\n`);
  sections.push(`❌ **错误 1：使用伪代码**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 错误示例（伪代码）`);
  sections.push(`public void methodName() {`);
  sections.push(`    // 业务逻辑`);
  sections.push(`    doSomething();`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);

  sections.push(`✅ **正确示例（真实代码）**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`// 从 BusTaskService.java:45-67 提取`);
  sections.push(`@Override`);
  sections.push(`@Transactional`);
  sections.push(`public List<BusTask> sync(String[] driverCodes, Date date) {`);
  sections.push(`    // 1. 调用 Optibus API`);
  sections.push(`    List<OptibusTa> tasks = optibusClient.fetchTasks(driverCodes, date);`);
  sections.push(`    `);
  sections.push(`    // 2. 批量插入数据库`);
  sections.push(`    busTaskMapper.batchInsert(tasks);`);
  sections.push(`    `);
  sections.push(`    return tasks;`);
  sections.push(`}`);
  sections.push(`\`\`\`\n`);

  sections.push(`❌ **错误 2：缺少注解**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`public Result<List<BusTask>> syncTask(OptibusSyncTaskVO vo) {`);
  sections.push(`\`\`\`\n`);

  sections.push(`✅ **正确示例（包含所有注解）**\n`);
  sections.push(`\`\`\`java`);
  sections.push(`@PostMapping("/sync-task")`);
  sections.push(`public Result<List<BusTask>> syncTask(@RequestBody @Valid OptibusSyncTaskVO vo) {`);
  sections.push(`\`\`\`\n`);

  sections.push(`❌ **错误 3：调用链编造**\n`);
  sections.push(`\`\`\``);
  sections.push(`Controller → Service → Mapper`);
  sections.push(`\`\`\`\n`);

  sections.push(`✅ **正确示例（从代码提取）**\n`);
  sections.push(`\`\`\``);
  sections.push(`BusOptibusSyncController.syncTask(vo)`);
  sections.push(`  ├─> 参数校验: @Valid OptibusSyncTaskVO`);
  sections.push(`  ├─> BusTaskService.sync(driverCodes, date)`);
  sections.push(`  │   ├─> OptibusApiClient.fetchTasks(driverCodes, date) [HTTP调用]`);
  sections.push(`  │   └─> BusTaskMapper.batchInsert(tasks) [SQL写入]`);
  sections.push(`  └─> 返回: Result.ofSuccess(tasks)`);
  sections.push(`\`\`\`\n`);

  sections.push(`---\n`);

  // 强制要求
  sections.push(`## ❗ 强制要求（必须遵守）\n`);
  sections.push(`**警告：以下要求必须严格执行，禁止跳过或遗漏！**\n`);
  sections.push(`1. **代码优先原则**：所有内容必须使用完整代码片段，禁止使用表格和文字描述`);
  sections.push(`2. **零占位符原则**：所有 \`**[请补充]**\`、\`**[请补充错误码]**\`、\`**[示例值]**\` 等占位符必须替换为实际内容`);
  sections.push(`3. **无遗漏原则**：每一个 Controller/Service/Entity/DTO/Mapper 的每一个字段和方法都必须有完整描述`);
  sections.push(`4. **检查原则**：每完成一个文件，必须搜索 \`[请补充\` 确认无遗漏`);
  sections.push(`5. **完成标准**：文档中不应包含任何 \`[请补充\`、\`**[请补充\`、\`[示例\`、\`[格式\` 等占位文本\n`);

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
  sections.push(`**❌ 不要使用表格描述 API**\n`);
  sections.push(`**✅ 使用完整代码示例**\n`);
  sections.push(`1. **描述**：一句话说明该 Controller 负责什么业务`);
  sections.push(`2. **每个 API 方法**：提取完整代码，包括：`);
  sections.push(`   - 完整的 Controller 方法（含注解）`);
  sections.push(`   - 完整的请求 VO 类定义（含所有校验注解）`);
  sections.push(`   - 调用链 DSL（树形结构）`);
  sections.push(`   - 异常处理代码片段`);
  sections.push(`   - curl 测试命令\n`);

  sections.push(`### 步骤 4：补充 Service 描述（services.md）\n`);
  sections.push(`对于每个 Service：\n`);
  sections.push(`**❌ 不要使用文字描述业务逻辑**\n`);
  sections.push(`**✅ 使用完整实现代码**\n`);
  sections.push(`1. **每个方法**：提取完整代码，包括：`);
  sections.push(`   - 完整的方法签名`);
  sections.push(`   - 完整的实现代码（含注释）`);
  sections.push(`   - 调用链 DSL`);
  sections.push(`   - 依赖注入代码`);
  sections.push(`   - 异常处理代码片段\n`);

  sections.push(`### 步骤 5：补充 Model 字段描述（models.md）\n`);
  sections.push(`对于每个 Entity/DTO：\n`);
  sections.push(`**❌ 不要使用表格描述字段**\n`);
  sections.push(`**✅ 使用完整类定义**\n`);
  sections.push(`1. **每个类**：提取完整代码，包括：`);
  sections.push(`   - 完整的类定义（含包名、注解）`);
  sections.push(`   - 所有字段及其注释（含校验注解）`);
  sections.push(`   - 使用示例代码\n`);

  sections.push(`### 步骤 6：补充 Mapper SQL 描述（mappers.md）\n`);
  sections.push(`对于每个 Mapper：\n`);
  sections.push(`**❌ 不要使用文字描述 SQL**\n`);
  sections.push(`**✅ 使用完整 SQL 实现**\n`);
  sections.push(`1. **每个方法**：提取完整代码，包括：`);
  sections.push(`   - 完整的 Mapper 接口定义`);
  sections.push(`   - 完整的 XML SQL 实现`);
  sections.push(`   - 表关系说明`);
  sections.push(`   - 字段映射说明`);
  sections.push(`   - 必需索引说明\n`);

  // Output Format
 sections.push(`---\n`);
  sections.push(`## 📝 补充格式说明\n`);
  sections.push(`**字段说明列的组成：**`);
  sections.push(`1. **业务含义**：这个字段代表什么（如"订单编号"）`);
  sections.push(`2. **必填性**：必填/可选（融入说明中，如"创建时间，可选"）`);
  sections.push(`3. **格式约束**：`);
  sections.push(`   - 枚举类型：列出所有取值（如 1=待处理,2=处理中,3=完成）`);
  sections.push(`   - 日期类型：格式说明（如 yyyy-MM-dd HH:mm:ss）`);
  sections.push(`   - 数值类型：单位和范围（如 单位：元，保留两位小数）`);
  sections.push(`   - 字符串：长度和规则（如 20位前缀ORD，系统自动生成）\n`);
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

  // 填充后验收清单
  sections.push(`---\n`);
  sections.push(`## ✅ 完成验收清单\n`);

  // 必须通过的检查
  sections.push(`### 必须通过的检查\n`);

  sections.push(`#### 1. 零占位符检查\n`);
  sections.push(`\`\`\`bash`);
  sections.push(`# 在项目根目录执行`);
  sections.push(`grep -r "\\[请补充" cainiaospec/modules/`);
  sections.push(`grep -r "AI_FILL_HERE" cainiaospec/modules/`);
  sections.push(`grep -r "\\*\\*\\[" cainiaospec/modules/`);
  sections.push(`\`\`\``);
  sections.push(`**期望结果**：所有搜索结果为 0\n`);

  sections.push(`#### 2. 代码完整性检查\n`);
  sections.push(`**Controllers 检查**：`);
  sections.push(`- [ ] 每个 API 都有完整的方法签名（含注解）`);
  sections.push(`- [ ] 每个 @RequestBody 的 API 都有完整的 VO 类定义`);
  sections.push(`- [ ] 每个 API 都有调用链 DSL`);
  sections.push(`- [ ] 每个 API 都有 curl 测试命令`);
  sections.push(`- [ ] 每个 API 都标注了代码位置（文件名:行号）\n`);

  sections.push(`**Services 检查**：`);
  sections.push(`- [ ] 每个方法都有完整的实现代码（不是伪代码）`);
  sections.push(`- [ ] 每个方法都有调用链 DSL`);
  sections.push(`- [ ] 每个方法都标注了代码位置\n`);

  sections.push(`**Mappers 检查**：`);
  sections.push(`- [ ] 每个方法都有完整的 Mapper 接口定义`);
  sections.push(`- [ ] 每个方法都有完整的 XML SQL 实现`);
  sections.push(`- [ ] 每个方法都有字段映射说明\n`);

  sections.push(`**Models 检查**：`);
  sections.push(`- [ ] 每个类都有完整的类定义（含包名、注解）`);
  sections.push(`- [ ] 每个字段都有注释`);
  sections.push(`- [ ] 每个类都有使用示例\n`);

  sections.push(`#### 3. AI 可执行性检查\n`);
  sections.push(`随机选择 3 个 Controller 方法，验证：`);
  sections.push(`- [ ] 代码可以直接复制粘贴编译通过`);
  sections.push(`- [ ] import 语句完整`);
  sections.push(`- [ ] 类名、方法名真实存在\n`);

  sections.push(`随机选择 3 个 Service 方法，验证：`);
  sections.push(`- [ ] 调用链中的方法在代码中真实存在`);
  sections.push(`- [ ] 调用顺序与实际代码一致`);
  sections.push(`- [ ] throw 语句真实存在\n`);

  sections.push(`#### 4. 文档一致性检查\n`);
  sections.push(`- [ ] README.md 中的流程图与 controllers.md/services.md 的调用链一致`);
  sections.push(`- [ ] 业务规则的代码片段在 Service 代码中真实存在`);
  sections.push(`- [ ] Models 中的类在 Controllers/Services 中被引用\n`);

  sections.push(`#### 5. 格式规范检查\n`);
  sections.push(`- [ ] 所有代码块都用三个反引号 java 包裹`);
  sections.push(`- [ ] 所有代码块都标注了来源（// 从 XXX.java:行号 提取）`);
  sections.push(`- [ ] 所有调用链都用树形结构（├─> └─>）`);
  sections.push(`- [ ] 所有 Mermaid 图都用三个反引号 mermaid 包裹\n`);

  // 自测问题
  sections.push(`### 自测问题\n`);
  sections.push(`完成填充后，请回答以下问题：\n`);
  sections.push(`1. **如果让另一个 AI 根据这个文档写代码，它能成功吗？**`);
  sections.push(`   - [ ] 是，所有代码都可以直接复制运行`);
  sections.push(`   - [ ] 否，还有部分是伪代码或描述\n`);

  sections.push(`2. **文档中的调用链是从代码提取的，还是编造的？**`);
  sections.push(`   - [ ] 从代码提取，可以验证`);
  sections.push(`   - [ ] 部分是编造的\n`);

  sections.push(`3. **文档中的 SQL 是完整的吗？**`);
  sections.push(`   - [ ] 是，可以直接在数据库执行`);
  sections.push(`   - [ ] 否，还有占位符或简化\n`);

  sections.push(`4. **文档中的业务规则是代码片段，还是文字描述？**`);
  sections.push(`   - [ ] 代码片段（if-else、throw 语句）`);
  sections.push(`   - [ ] 文字描述\n`);

  sections.push(`5. **所有代码都标注了位置吗？**`);
  sections.push(`   - [ ] 是，都有文件名:行号`);
  sections.push(`   - [ ] 否，部分缺少\n`);

  // 报告格式
  sections.push(`### 报告格式\n`);
  sections.push(`完成后请报告：\n`);
  sections.push(`\`\`\`\\n`);
  sections.push(`🎉 [模块名] 文档填充完成！`);
  sections.push(`\\n`);
  sections.push(`完成度检查:`);
  sections.push(`- README.md: ✓ 业务场景、流程图、业务规则已填充`);
  sections.push(`- controllers.md: ✓ X 个 Controller, Y 个 API 已填充`);
  sections.push(`- services.md: ✓ X 个 Service, Y 个方法已填充`);
  sections.push(`- models.md: ✓ X 个 Entity/DTO 已填充`);
  sections.push(`- mappers.md: ✓ X 个 Mapper, Y 个方法已填充`);
  sections.push(`\\n`);
  sections.push(`占位符检查:`);
  sections.push(`- grep "[请补充" 结果: 0 ✓`);
  sections.push(`- grep "AI_FILL_HERE" 结果: 0 ✓`);
  sections.push(`- grep "**[" 结果: 0 ✓`);
  sections.push(`\\n`);
  sections.push(`代码完整性检查:`);
  sections.push(`- 所有 Controller 方法都有完整签名: ✓`);
  sections.push(`- 所有 Service 方法都有完整实现: ✓`);
  sections.push(`- 所有 Mapper 方法都有完整 SQL: ✓`);
  sections.push(`- 所有 Model 都有完整类定义: ✓`);
  sections.push(`\\n`);
  sections.push(`AI 可执行性检查:`);
  sections.push(`- 随机抽查 3 个方法可编译: ✓`);
  sections.push(`- 调用链与实际代码一致: ✓`);
  sections.push(`- 所有代码都标注了位置: ✓`);
  sections.push(`\`\`\`\\n`);

  // 后续工作流简介
  sections.push(`---\n`);
  sections.push(`## 📖 文档补充完成后\n`);
  sections.push(`文档补充完成后，请阅读 **cainiaospec/AGENTS.md** 了解 CainiaoSpec 的完整工作流程：\n`);
  sections.push(`| 阶段 | 命令 | 说明 |`);
  sections.push(`|------|------|------|`);
  sections.push(`| 创建提案 | \`/proposal 功能描述\` | 让 AI 读取模块文档，创建详细的实施提案 |`);
  sections.push(`| 实施提案 | \`/apply change-id\` | 按照提案实施代码变更 |`);
  sections.push(`| 归档变更 | \`/archive change-id\` | 归档并同步更新模块文档 |\n`);
  sections.push(`> 提示：试试告诉 AI "请解释 cainiaospec/AGENTS.md 中的工作流程"\n`);

  // Final instruction
  sections.push(`---\n`);
  sections.push(`## 🚀 开始执行\n`);
  sections.push(`请现在开始执行上述步骤，从第一个模块 **${moduleNames[0] || 'main'}** 开始。\n`);
  sections.push(`每完成一个模块，请按照上述"报告格式"报告进度。\n`);

  return sections.join('\n');
}
