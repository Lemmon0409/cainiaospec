# 变更：增强 Spec 文档生成，添加实现指引

## 为什么

当前 OpenSpec 的 `init` 命令生成的 spec 文档过于简单，仅包含占位符和基本描述，导致：

1. **AI 助手产生幻觉**：缺乏足够的上下文信息，AI 无法准确理解项目的技术实现细节
2. **提案缺乏实现细节**：生成的 proposal.md 没有明确的文件变更清单和代码实现指引
3. **任务缺乏可执行性**：生成的 tasks.md 缺少具体的文件路径和实现步骤
4. **代码映射关系不清**：数据模型、API 实现、业务规则与实际代码文件的对应关系模糊

这些问题使得 AI 助手在后续开发中容易生成不符合项目约定的代码，增加了人工审查和修正的成本。

## 变更内容

### 1. 增强项目级模板（project-template.ts）

**从：** 仅包含简单的占位符
**到：** 包含详细的实现映射表

新增内容：
- 目录结构映射表（目录路径 -> 职责 -> 包含内容 -> 命名规则 -> 示例）
- 分层架构依赖规则说明
- 框架使用约定（装饰器、依赖注入模式）
- 文件命名规范（实体、DTO、Service、Controller）

**原因：** 让 AI 知道新代码应该放在哪里，如何命名，遵循什么模式

### 2. 添加代码扫描功能（新增文件）

新增文件：
- `src/core/code-scanner.ts` - 扫描项目目录，识别代码组织模式
- `src/core/framework-detector.ts` - 检测项目使用的框架（NestJS、Express 等）
- `src/core/metadata-extractor.ts` - 从代码中提取实体、API、依赖关系

**原因：** 自动从现有代码中提取实现细节，而非让用户手动填写

### 3. 创建实现指引模板系统

新增文件：
- `src/core/templates/impl-guide-template.ts` - 包含实现指引的通用模板
- `src/core/templates/nestjs/` - NestJS 框架特定的代码片段
- `src/core/templates/express/` - Express 框架特定的代码片段

**原因：** 为不同框架提供符合其最佳实践的实现示例

### 4. 增强 init 命令选项

新增命令行选项：
- `--with-impl-guide` / `-g` - 生成包含实现指引的详细 spec
- `--scan-code` / `-s` - 扫描现有代码提取实现细节  
- `--frameworks` / `-f` - 指定框架（如 `nestjs,typeorm`）

**原因：** 让用户可以选择生成简单模板或详细的实现指引

### 5. 更新 AGENTS.md 指引

**从：** 通用的提案和任务生成说明
**到：** 包含明确的实现细节要求

新增要求：
- Proposal 必须包含文件变更清单（新增/修改/删除）
- Proposal 必须包含实现步骤映射（步骤 -> 文件 -> 参考规范）
- Tasks 每个任务必须指定具体文件路径和验证方法

**原因：** 确保 AI 生成的提案和任务具有可执行性

## 影响

### 受影响的 Spec
- `openspec/specs/cli-init/spec.md` - 需要添加新选项的需求
- `openspec/specs/docs-agent-instructions/spec.md` - 需要更新 AI 指引内容

### 受影响的代码
- `src/cli/index.ts` - 添加新的命令行选项
- `src/core/init.ts` - 集成代码扫描和实现指引生成逻辑
- `src/core/templates/project-template.ts` - 增强模板内容
- `src/core/templates/index.ts` - 注册新的模板类型
- `openspec/AGENTS.md` - 更新提案和任务生成指引

### 新增代码
- `src/core/code-scanner.ts` - 约 200 行
- `src/core/framework-detector.ts` - 约 100 行
- `src/core/metadata-extractor.ts` - 约 150 行
- `src/core/templates/impl-guide-template.ts` - 约 300 行
- `src/core/templates/nestjs/*.ts` - 约 400 行
- `src/core/templates/express/*.ts` - 约 200 行
- `src/core/parsers/*.ts` - 约 400 行

总计新增约 1750 行代码

### 破坏性变更
**无破坏性变更** - 默认行为保持不变，新功能通过选项启用

### 向后兼容性
- 不带选项的 `openspec init` 保持现有简单模式
- 现有项目不受影响
- 可以通过 `openspec init --with-impl-guide` 为现有项目补充实现指引

## 实施计划

### 阶段 1：增强项目模板（1-2 天）
- 增强 `project-template.ts`
- 添加目录映射表和架构说明
- 提供框架特定的模板变体

### 阶段 2：实现代码扫描（3-4 天）
- 创建目录结构扫描器
- 实现 TypeScript AST 解析器
- 提取实体、API、依赖关系

### 阶段 3：实现指引生成（2-3 天）
- 创建实现指引模板系统
- 实现 NestJS 代码片段库
- 实现 Express 代码片段库

### 阶段 4：集成和测试（2-3 天）
- 集成到 init 命令
- 更新 AGENTS.md
- 编写单元测试和集成测试
- 更新文档

总预计：8-12 天

## 成功指标

1. **减少 AI 幻觉**：AI 生成的代码 90% 符合项目约定
2. **提案质量**：生成的 proposal 包含完整的文件变更清单
3. **任务可执行性**：生成的 tasks 包含具体文件路径和验证步骤
4. **用户满意度**：通过选项灵活控制生成详细程度

## 风险和缓解

### 风险 1：代码扫描不准确
**缓解：** 提供扫描结果预览，允许用户手动调整

### 风险 2：框架支持有限
**缓解：** 优先支持主流框架，提供通用模板作为后备

### 风险 3：实现指引过时
**缓解：** 在 spec 中标注"初始化时的实现指引"，支持重新扫描更新
