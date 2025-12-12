# 变更:添加 Java/Spring Boot 项目代码扫描支持

## Why

当前 OpenSpec 的代码扫描功能(`--scan-code`)仅支持 TypeScript/JavaScript 项目,无法为 Java/Spring Boot 项目提供自动化的项目文档生成,导致:

1. **Java 项目无法使用代码扫描**:执行 `openspec init --scan-code` 在 Java 项目中无效果
2. **AI 对 Java 项目缺乏理解**:没有 API、实体、业务逻辑的上下文信息,AI 容易产生幻觉
3. **手动编写文档成本高**:大型 Spring Boot 项目需要手动整理 API 接口、数据模型、代码规范
4. **代码质量难以保证**:缺少项目规范约束,AI 生成的 Java 代码容易不符合项目标准

## What Changes

### 1. 新增 Java 项目检测能力

- 创建 `src/core/framework-detector-java.ts`
- 支持识别 Maven 项目(`pom.xml`)
- 支持识别 Gradle 项目(`build.gradle`、`build.gradle.kts`)
- 检测 Spring Boot、MyBatis、Spring Data JPA 等框架
- 提取 Java 版本、Spring Boot 版本等关键信息

### 2. 新增 Java 代码扫描器

- 创建 `src/core/code-scanner-java.ts`
- 使用正则表达式解析 Java 源码(初版方案)
- 扫描并提取:
  - Entity 类:字段、类型、注解、关系
  - Controller 类:API 路由、请求参数、响应格式
  - Service 类:业务方法、事务配置
  - Repository 接口:数据访问方法
  - DTO 类:数据传输对象和验证规则
- 识别分层架构和依赖关系

### 3. 新增 Maven/Gradle 依赖解析器

- 创建 `src/core/parsers/maven-parser.ts`
- 创建 `src/core/parsers/gradle-parser.ts`
- 解析项目依赖列表
- 提取构建配置信息

### 4. 新增 Java 项目文档模板

- 创建 `src/core/templates/java-project-template.ts`
- 生成包含以下内容的 Markdown 文档:
  - 项目概览(技术栈、版本信息)
  - 架构设计(分层结构、依赖关系)
  - 目录结构说明
  - API 接口文档(路由、参数、响应)
  - 数据模型文档(实体、字段、关系)
  - 代码规范(命名、注解、异常处理)
  - 业务逻辑说明(从 JavaDoc 提取)

### 5. 扩展 init 命令逻辑

- 修改 `src/core/init.ts`,在 `buildProjectContext` 方法中:
  - 检测项目类型(Java vs TypeScript)
  - 根据项目类型选择对应的扫描器
  - 调用 Java 扫描器并生成文档

### 6. 增加扫描进度展示

- 显示正在扫描的目录
- 显示发现的实体、Controller、Service 数量
- 提供扫描完成后的结果摘要

## Impact

### 受影响的 Spec

- `specs/cli-init/spec.md` - 添加 Java 项目支持的需求

### 受影响的代码

- `src/core/init.ts` - 添加项目类型检测和 Java 扫描器集成
- `src/core/templates/index.ts` - 注册 Java 项目模板

### 新增文件

- `src/core/framework-detector-java.ts` (~200 行)
- `src/core/code-scanner-java.ts` (~600 行)
- `src/core/parsers/maven-parser.ts` (~150 行)
- `src/core/parsers/gradle-parser.ts` (~150 行)
- `src/core/templates/java-project-template.ts` (~400 行)
- 测试文件 (~500 行)

总计新增约 2000 行代码

### 破坏性变更

**无破坏性变更** - 新功能与现有 TypeScript 扫描器并行工作,互不影响

### 向后兼容性

- 现有 TypeScript/JavaScript 项目扫描功能完全保持不变
- 自动检测项目类型,选择合适的扫描器
- 对于混合项目(既有 Java 又有 TypeScript),可通过 `--frameworks` 参数手动指定

## 实施计划

### 阶段 1:基础设施(3-4 天)

- 创建 Java 框架检测器
- 实现 Maven pom.xml 解析
- 实现 Gradle build.gradle 解析
- 添加项目类型识别逻辑

### 阶段 2:代码扫描器(5-6 天)

- 创建 Java 代码扫描器主类
- 实现目录遍历和文件过滤
- 实现注解提取(正则表达式)
- 实现 Entity、Controller、Service、Repository 扫描
- 实现架构分析和依赖关系提取

### 阶段 3:文档生成(4-5 天)

- 创建 Java 项目文档模板
- 实现 API 接口文档生成
- 实现数据模型文档生成
- 实现代码规范文档生成

### 阶段 4:集成与优化(3-4 天)

- 集成到 init 命令
- 实现进度展示
- 性能优化(并行扫描)
- 错误处理完善

### 阶段 5:测试与文档(3-4 天)

- 编写单元测试
- 编写集成测试
- 使用真实 Spring Boot 项目测试
- 更新 AGENTS.md 说明

总预计:18-23 天

## 成功指标

1. **框架识别准确率** > 95%:正确识别 Spring Boot、MyBatis 等框架
2. **实体扫描完整率** > 90%:扫描到所有标准 `@Entity` 类
3. **API 扫描完整率** > 90%:扫描到所有 `@RestController` 接口
4. **文档生成成功率** 100%:所有扫描成功的项目都能生成文档
5. **性能指标**:
   - 小型项目(< 100 文件)< 10 秒
   - 中型项目(100-500 文件)< 1 分钟
   - 大型项目(500-5000 文件)< 5 分钟

## 风险和缓解

### 风险 1:Java 解析准确度有限

正则表达式解析可能无法处理复杂的 Java 语法

**缓解:**
- 优先支持标准的 Spring Boot 注解模式
- 提供详细的错误日志,帮助用户定位问题
- 未来版本可考虑使用 JavaParser 库提升准确度

### 风险 2:大型项目扫描性能

扫描 5000+ 文件可能超时或内存溢出

**缓解:**
- 实现并行扫描(使用 Worker Threads)
- 设置合理的超时和文件大小限制
- 提供进度反馈,避免用户等待焦虑

### 风险 3:多模块 Maven/Gradle 项目支持

多模块项目结构复杂,扫描难度大

**缓解:**
- 初版先支持单模块项目
- 后续版本递归扫描子模块
- 提供配置选项手动指定要扫描的模块
