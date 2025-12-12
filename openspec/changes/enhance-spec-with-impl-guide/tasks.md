# 实现任务清单

## 1. 阶段 1：增强项目级模板

- [ ] 1.1 增强 `src/core/templates/project-template.ts`
  - 文件：`src/core/templates/project-template.ts`
  - 内容：添加目录结构映射表、分层架构说明、框架使用约定
  - 参考：设计文档"需求 1：项目级实现上下文文档"部分
  - 验证：生成的 project.md 包含完整的目录映射表

- [ ] 1.2 创建框架特定的项目模板变体
  - 文件：`src/core/templates/frameworks/`
  - 内容：NestJS、Express、通用 TypeScript 项目模板
  - 验证：每个框架模板包含特定的代码组织约定

- [ ] 1.3 更新模板管理器注册新模板类型
  - 文件：`src/core/templates/index.ts`
  - 内容：导出框架特定模板，添加模板选择逻辑
  - 验证：可以根据框架类型选择正确的模板

## 2. 阶段 2：实现代码扫描器

- [ ] 2.1 创建框架检测器
  - 文件：`src/core/framework-detector.ts`
  - 内容：检测 package.json 中的依赖，识别使用的框架
  - 功能：支持检测 NestJS、Express、Fastify、TypeORM、Prisma
  - 验证：正确识别 OpenSpec 项目使用的 TypeScript + Commander

- [ ] 2.2 创建目录结构扫描器
  - 文件：`src/core/code-scanner.ts`
  - 内容：扫描项目目录，识别分层架构模式（entities, services, controllers 等）
  - 功能：递归扫描 src/ 目录，识别代码组织模式
  - 验证：能够识别 OpenSpec 的 cli/core/utils 结构

- [ ] 2.3 创建元数据提取器
  - 文件：`src/core/metadata-extractor.ts`
  - 内容：从扫描结果中提取模块、文件列表、依赖关系
  - 验证：生成包含模块元数据的结构化数据

- [ ] 2.4 创建 TypeScript AST 解析器
  - 文件：`src/core/parsers/typescript-parser.ts`
  - 内容：使用 TypeScript Compiler API 解析 .ts 文件
  - 功能：提取类、接口、函数定义
  - 依赖：需要添加 `typescript` 依赖（已有）
  - 验证：能够解析 OpenSpec 的 TypeScript 文件

- [ ] 2.5 创建装饰器解析器
  - 文件：`src/core/parsers/decorator-parser.ts`
  - 内容：从 AST 中提取装饰器信息（NestJS、TypeORM 等）
  - 验证：能够识别常见的装饰器模式

- [ ] 2.6 创建实体定义解析器
  - 文件：`src/core/parsers/entity-parser.ts`
  - 内容：提取类的字段、类型、装饰器信息
  - 验证：生成结构化的实体元数据

## 3. 阶段 3：实现指引模板生成器

- [ ] 3.1 创建通用实现指引模板
  - 文件：`src/core/templates/impl-guide-template.ts`
  - 内容：包含代码组织、文件路径、实现模式的模板函数
  - 验证：生成包含实现指引的 spec 内容

- [ ] 3.2 创建 NestJS 实体模板
  - 文件：`src/core/templates/nestjs/entity-template.ts`
  - 内容：TypeORM 实体定义示例，包含常见装饰器用法
  - 验证：生成符合 NestJS + TypeORM 最佳实践的示例

- [ ] 3.3 创建 NestJS 控制器模板
  - 文件：`src/core/templates/nestjs/controller-template.ts`
  - 内容：Controller 装饰器、路由定义、DTO 使用示例
  - 验证：生成包含 API 实现指引的内容

- [ ] 3.4 创建 NestJS 服务模板
  - 文件：`src/core/templates/nestjs/service-template.ts`
  - 内容：Service 类、依赖注入、业务逻辑模式示例
  - 验证：生成包含业务逻辑实现指引的内容

- [ ] 3.5 创建 NestJS 模块模板
  - 文件：`src/core/templates/nestjs/module-template.ts`
  - 内容：Module 注册、Provider 配置示例
  - 验证：生成模块组织指引

- [ ] 3.6 创建 Express 路由模板
  - 文件：`src/core/templates/express/route-template.ts`
  - 内容：Express 路由定义、中间件使用示例
  - 验证：生成符合 Express 最佳实践的示例

- [ ] 3.7 创建 Express 模型模板
  - 文件：`src/core/templates/express/model-template.ts`
  - 内容：数据模型定义、ORM 使用示例
  - 验证：生成数据层实现指引

## 4. 阶段 4：集成到 init 命令

- [ ] 4.1 添加新的命令行选项
  - 文件：`src/cli/index.ts`
  - 内容：添加 `--with-impl-guide`、`--scan-code`、`--frameworks` 选项
  - 验证：运行 `openspec init --help` 显示新选项

- [ ] 4.2 扩展 InitCommand 类
  - 文件：`src/core/init.ts`
  - 内容：添加处理新选项的逻辑，集成代码扫描和模板生成
  - 验证：新选项能够正确触发相应功能

- [ ] 4.3 实现代码扫描流程
  - 文件：`src/core/init.ts`
  - 内容：当 `--scan-code` 启用时，执行扫描并提取元数据
  - 验证：扫描结果正确反映项目结构

- [ ] 4.4 实现实现指引生成流程
  - 文件：`src/core/init.ts`
  - 内容：当 `--with-impl-guide` 启用时，使用增强模板生成 spec
  - 验证：生成的 spec 包含实现映射表和代码示例

- [ ] 4.5 实现框架特定模板选择
  - 文件：`src/core/init.ts`
  - 内容：根据检测到的框架或 `--frameworks` 参数选择模板
  - 验证：正确应用框架特定的模板和示例

## 5. 阶段 5：更新 AGENTS.md 指引

- [ ] 5.1 更新 AGENTS.md 添加提案生成要求
  - 文件：`openspec/AGENTS.md`
  - 内容：在"Creating Change Proposals"部分添加文件变更清单要求
  - 验证：指引明确说明需要包含新增/修改/删除文件列表

- [ ] 5.2 添加实现步骤映射要求
  - 文件：`openspec/AGENTS.md`
  - 内容：要求 proposal 包含实现步骤与文件、参考规范的映射
  - 验证：指引包含具体的示例格式

- [ ] 5.3 更新任务文档生成要求
  - 文件：`openspec/AGENTS.md`
  - 内容：要求 tasks 包含具体文件路径、参考规范、验证方法
  - 验证：指引包含 tasks.md 的示例格式

## 6. 阶段 6：创建 Spec 增量更新

- [ ] 6.1 创建 cli-init spec 增量
  - 文件：`openspec/changes/enhance-spec-with-impl-guide/specs/cli-init/spec.md`
  - 内容：在 ADDED Requirements 下添加新命令行选项的需求
  - 验证：符合 OpenSpec delta 格式

- [ ] 6.2 创建 docs-agent-instructions spec 增量
  - 文件：`openspec/changes/enhance-spec-with-impl-guide/specs/docs-agent-instructions/spec.md`
  - 内容：在 MODIFIED Requirements 下更新 AI 指引要求
  - 验证：包含完整的修改后需求内容

## 7. 阶段 7：测试和文档

- [ ] 7.1 编写代码扫描器单元测试
  - 文件：`test/core/code-scanner.test.ts`
  - 内容：测试目录扫描、框架检测、元数据提取
  - 验证：覆盖主要场景和边界情况

- [ ] 7.2 编写模板生成器单元测试
  - 文件：`test/core/templates/impl-guide-template.test.ts`
  - 内容：测试模板渲染、框架特定内容生成
  - 验证：生成的内容符合预期格式

- [ ] 7.3 编写 init 命令集成测试
  - 文件：`test/core/init.test.ts`（更新现有文件）
  - 内容：测试新选项的功能，验证生成的 spec 内容
  - 验证：覆盖简单模式和实现指引模式

- [ ] 7.4 更新 README 文档
  - 文件：`README.md`
  - 内容：添加新选项的使用说明和示例
  - 验证：文档清晰易懂

- [ ] 7.5 创建使用示例
  - 文件：在 README 或单独文档中
  - 内容：展示不同选项的使用场景和输出示例
  - 验证：示例可复现

## 8. 阶段 8：验证和优化

- [ ] 8.1 在 OpenSpec 项目自身测试
  - 操作：在 OpenSpec 项目中运行 `openspec init --scan-code --with-impl-guide`
  - 验证：正确识别项目结构，生成准确的实现指引

- [ ] 8.2 创建示例项目测试
  - 操作：创建一个简单的 NestJS 项目进行测试
  - 验证：正确检测 NestJS 框架，生成相应的实现指引

- [ ] 8.3 性能优化
  - 内容：优化代码扫描性能，确保大型项目不会过慢
  - 验证：扫描包含 100+ 文件的项目在 5 秒内完成

- [ ] 8.4 错误处理完善
  - 内容：添加友好的错误提示，处理扫描失败等异常情况
  - 验证：各种错误情况都有清晰的提示信息

## 9. 完成和发布

- [ ] 9.1 运行完整的测试套件
  - 命令：`pnpm test`
  - 验证：所有测试通过

- [ ] 9.2 验证 lint 和格式化
  - 验证：代码符合项目规范

- [ ] 9.3 更新 CHANGELOG
  - 内容：记录新增功能和使用方法
  - 验证：变更日志完整准确

- [ ] 9.4 准备发布
  - 操作：确认所有任务完成，代码审查通过
  - 验证：功能完整，文档齐全
