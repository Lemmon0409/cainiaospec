# Implementation Tasks

## 1. 阶段 1: 基础设施 (3-4 天)

- [ ] 1.1 创建 Java 框架检测器
  - 文件: `src/core/framework-detector-java.ts`
  - 内容: 检测 Maven 和 Gradle 项目,识别 Java 和 Spring Boot 版本
  - 验证: 能够正确识别 pom.xml 和 build.gradle 文件

- [ ] 1.2 实现 Maven pom.xml 解析器
  - 文件: `src/core/parsers/maven-parser.ts`
  - 内容: 使用 XML 解析库提取 dependencies、properties、plugins
  - 依赖: 需要安装 `fast-xml-parser` 包
  - 验证: 正确解析测试 pom.xml 文件,提取 Spring Boot 版本

- [ ] 1.3 实现 Gradle build.gradle 解析器
  - 文件: `src/core/parsers/gradle-parser.ts`
  - 内容: 使用正则表达式提取 dependencies 和 plugins
  - 支持: Groovy DSL 和 Kotlin DSL 两种语法
  - 验证: 正确解析测试 build.gradle 文件

- [ ] 1.4 添加项目类型检测逻辑
  - 文件: `src/core/init.ts`
  - 内容: 在 `buildProjectContext` 中检测 Java 项目(pom.xml/build.gradle 存在)
  - 验证: 能够区分 Java、TypeScript 和混合项目

## 2. 阶段 2: 代码扫描器 (5-6 天)

- [ ] 2.1 创建 Java 代码扫描器主类
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 实现 `JavaCodeScanner` 类,扫描 `src/main/java` 目录
  - 参考: 复用 `code-scanner.ts` 的目录遍历逻辑
  - 验证: 能够递归扫描 Java 源码目录

- [ ] 2.2 实现 Java 文件过滤逻辑
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 排除 `target/`、`build/`、`.class` 文件,仅扫描 `.java` 文件
  - 验证: 不会扫描编译产物

- [ ] 2.3 实现 Java 注解提取
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 使用正则表达式匹配 `@Entity`、`@Controller`、`@Service` 等注解
  - 验证: 能够正确提取单行和多行注解

- [ ] 2.4 实现 Entity 类扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 提取类名、表名、字段、字段类型、字段注解、关系注解
  - 正则: 匹配 `@Column`、`@Id`、`@OneToMany` 等注解
  - 验证: 扫描测试 Entity 类,输出正确的元数据

- [ ] 2.5 实现 Controller 类扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 提取 API 路由、HTTP 方法、请求参数、响应类型
  - 正则: 匹配 `@GetMapping`、`@PostMapping`、`@RequestParam`、`@PathVariable` 等
  - 验证: 扫描测试 Controller,输出 API 接口清单

- [ ] 2.6 实现 Service 类扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 提取服务方法、参数、返回值、事务注解
  - 验证: 扫描测试 Service,输出方法列表

- [ ] 2.7 实现 Repository 接口扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 提取 Repository 名称、泛型参数、自定义查询方法
  - 验证: 扫描 JpaRepository 接口,识别实体类型

- [ ] 2.8 实现 DTO 类扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 提取 DTO 字段、验证注解、Lombok 注解
  - 验证: 扫描测试 DTO,识别 `@NotNull`、`@Data` 等注解

- [ ] 2.9 实现包结构分析
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 分析包组织模式(按层/按模块),识别 `com.example.controller`、`com.example.service` 等
  - 验证: 正确识别分层架构

- [ ] 2.10 实现依赖关系分析
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 从 `@Autowired` 或构造器注入识别服务依赖关系
  - 验证: 构建 Controller -> Service -> Repository 依赖图

## 3. 阶段 3: 文档生成 (4-5 天)

- [ ] 3.1 创建 Java 项目文档模板
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 定义 Markdown 文档结构(项目概览、架构、API、数据模型等)
  - 参考: `project-template.ts` 的结构
  - 验证: 生成的模板包含所有必需章节

- [ ] 3.2 实现项目概览生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 生成技术栈摘要、Java 版本、Spring Boot 版本、构建工具
  - 验证: 输出正确的项目信息

- [ ] 3.3 实现架构文档生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 生成分层架构说明、目录结构表、依赖规则
  - 验证: 文档清晰描述项目架构

- [ ] 3.4 实现 API 接口文档生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 生成 API 接口表格(HTTP 方法、路径、参数、响应)
  - 格式: Markdown 表格
  - 验证: API 文档包含所有扫描到的接口

- [ ] 3.5 实现数据模型文档生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 生成实体字段表格、实体关系说明
  - 验证: 每个实体都有完整的字段列表

- [ ] 3.6 实现 Mermaid ER 图生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 基于实体关系注解生成 Mermaid 实体关系图
  - 语法: `erDiagram` 格式
  - 验证: 生成的图表语法正确,能在 Markdown 中渲染

- [ ] 3.7 实现代码规范文档生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 推断命名规范、注解使用模式、异常处理规范
  - 验证: 规范文档包含具体示例

- [ ] 3.8 实现业务逻辑文档生成
  - 文件: `src/core/templates/java-project-template.ts`
  - 内容: 从 JavaDoc 提取业务流程说明
  - 验证: 能够提取并格式化 JavaDoc 注释

## 4. 阶段 4: 集成与优化 (3-4 天)

- [ ] 4.1 集成到 init 命令
  - 文件: `src/core/init.ts`
  - 内容: 在 `buildProjectContext` 中调用 Java 扫描器
  - 逻辑: 根据项目类型选择 TypeScript 或 Java 扫描器
  - 验证: Java 项目能够触发 Java 扫描器

- [ ] 4.2 实现模板注册
  - 文件: `src/core/templates/index.ts`
  - 内容: 导出 `javaProjectTemplate` 并在 `TemplateManager` 中注册
  - 验证: init 命令能够使用 Java 模板

- [ ] 4.3 实现扫描进度展示
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 使用 `ora` 显示扫描进度和统计信息
  - 验证: 扫描时显示实时进度

- [ ] 4.4 实现扫描结果摘要
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 扫描完成后显示实体数、API 数、服务数
  - 验证: 摘要信息准确

- [ ] 4.5 实现错误处理
  - 文件: `src/core/code-scanner-java.ts`、`src/core/parsers/*.ts`
  - 内容: 捕获 XML 解析错误、文件读取错误,提供友好提示
  - 验证: 错误信息清晰,不会导致程序崩溃

- [ ] 4.6 实现混合项目支持
  - 文件: `src/core/init.ts`
  - 内容: 检测到混合项目时,提示用户或同时运行两个扫描器
  - 验证: 混合项目能够生成完整文档

## 5. 阶段 5: 测试与文档 (3-4 天)

- [ ] 5.1 编写框架检测器单元测试
  - 文件: `test/core/framework-detector-java.test.ts`
  - 内容: 测试 Maven、Gradle 项目识别
  - 验证: 所有测试通过

- [ ] 5.2 编写 Maven 解析器单元测试
  - 文件: `test/core/parsers/maven-parser.test.ts`
  - 内容: 测试 pom.xml 解析,包括依赖提取、版本提取
  - 验证: 覆盖主要场景

- [ ] 5.3 编写 Gradle 解析器单元测试
  - 文件: `test/core/parsers/gradle-parser.test.ts`
  - 内容: 测试 Groovy 和 Kotlin DSL 解析
  - 验证: 覆盖主要场景

- [ ] 5.4 编写 Java 扫描器单元测试
  - 文件: `test/core/code-scanner-java.test.ts`
  - 内容: 测试 Entity、Controller、Service、Repository 扫描
  - 准备: 创建测试 fixture (示例 Java 文件)
  - 验证: 扫描结果与预期一致

- [ ] 5.5 编写 Java 模板生成单元测试
  - 文件: `test/core/templates/java-project-template.test.ts`
  - 内容: 测试文档生成逻辑,验证 Markdown 格式
  - 验证: 生成的文档结构正确

- [ ] 5.6 编写集成测试
  - 文件: `test/cli-e2e/java-init.test.ts`
  - 内容: 端到端测试 `openspec init --scan-code` 在 Java 项目中的表现
  - 准备: 创建测试用 Spring Boot 项目
  - 验证: 成功生成完整的项目文档

- [ ] 5.7 使用真实 Spring Boot 项目测试
  - 项目: 使用开源 Spring Boot 示例项目(如 Spring Pet Clinic)
  - 验证: 扫描成功,文档准确,性能可接受

- [ ] 5.8 更新 AGENTS.md
  - 文件: `openspec/AGENTS.md`
  - 内容: 添加 Java 项目扫描的说明和示例
  - 验证: 文档清晰易懂

- [ ] 5.9 更新 README.md
  - 文件: `README.md`
  - 内容: 添加 Java/Spring Boot 项目支持的说明
  - 验证: 用户能够理解如何使用

## 6. 优化任务(可选)

- [ ] 6.1 实现并行扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 使用 Worker Threads 并行处理多个 Java 文件
  - 目标: 提升大型项目扫描速度

- [ ] 6.2 实现增量扫描
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 缓存扫描结果,仅扫描变更文件
  - 目标: 支持 `--update` 参数增量更新文档

- [ ] 6.3 添加性能指标收集
  - 文件: `src/core/code-scanner-java.ts`
  - 内容: 记录扫描耗时、文件数、内存使用
  - 目标: 监控性能,发现瓶颈
