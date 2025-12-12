# OpenSpec Enhanced - Java Spring Boot 智能文档生成工具

<p align="center">
  <a href="https://github.com/Lemmon0409/openspec-improve">
    <picture>
      <source srcset="assets/openspec_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/openspec_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/openspec_pixel_light.svg" alt="OpenSpec logo" height="64">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://github.com/Lemmon0409/openspec-improve"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-openspec--improve-blue?logo=github&style=flat-square" /></a>
  <a href="https://github.com/Fission-AI/OpenSpec"><img alt="Based on OpenSpec v0.16.0" src="https://img.shields.io/badge/Based%20on-OpenSpec%20v0.16.0-green?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

---

## 📖 项目简介

**OpenSpec Enhanced** 是基于 [OpenSpec v0.16.0](https://github.com/Fission-AI/OpenSpec) 的增强版本，专为 **Java Spring Boot** 项目深度优化。

### 🎯 核心价值

通过**静态代码扫描 + AI 智能补充**，自动生成高质量的项目文档，让 AI 编程助手能够：

- ✅ **准确理解**项目结构和业务逻辑
- ✅ **严格遵循**提案规范实现新功能
- ✅ **避免幻觉**：基于真实代码而非猜测
- ✅ **提升效率**：减少 70% 的上下文理解时间

### 🚀 工作流程

```
1. 初始化 (openspec init)
   └─ 自动扫描代码 → 生成结构化文档

2. AI 补充描述
   └─ 复制提示词 → AI 补充业务含义

3. 开发新功能
   └─ AI 读文档 → 创建提案 (proposal.md + tasks.md)

4. 严格实施
   └─ AI 按提案执行 → 确保规范一致

5. 归档部署
   └─ 功能上线后归档 → 保持文档整洁
```

---

## 🌟 相比原版 OpenSpec 的核心优势

### 1. 🔥 专为 Java Spring Boot 深度优化

| 功能 | 原版 OpenSpec | 增强版 |
|------|--------------|--------|
| **Maven 多模块项目** | ❌ 不支持 | ✅ 完整支持，自动识别模块依赖 |
| **Interface/Enum** | ❌ 忽略 | ✅ 完整扫描，识别 API 和枚举 |
| **JPA 实体映射** | ❌ 基础支持 | ✅ 提取 `@Entity`, `@Table`, `@Column`, `@Index` |
| **Spring 注解** | ❌ 部分识别 | ✅ 全面识别 `@RestController`, `@Service`, `@Autowired` 等 |
| **依赖注入过滤** | ❌ Bean 被当字段 | ✅ 自动过滤 `@Resource`, `@Autowired` |
| **局部变量过滤** | ❌ 方法内变量被误识别 | ✅ 精准识别类字段，排除局部变量 |

---

### 2. 🎯 强制性提案规范，确保 AI 严格执行

| 规范要求 | 原版 OpenSpec | 增强版 |
|---------|--------------|--------|
| **proposal.md + tasks.md** | ⚠️ 可能只生成一个 | ✅ **强制生成两个文件**（6 处强制提醒） |
| **API 规范** | ⚠️ 可能不完整 | ✅ 必须包含完整的请求/响应体 |
| **调用链** | ⚠️ 可能缺失 | ✅ 必须包含 Controller → Service → Repository |
| **实施强制引用** | ❌ AI 可能凭记忆实现 | ✅ tasks.md 强制引用 proposal.md 章节 |
| **实施前检查清单** | ❌ 无 | ✅ 每个任务都有强制验证清单 |

**效果**：AI 在实施时**不允许偏离提案**，确保代码和设计完全一致！

---

### 3. 📚 完善的文档和指南

| 文档 | 原版 OpenSpec | 增强版 |
|------|--------------|--------|
| **中文文档** | ❌ 仅英文 | ✅ 完整中文化 |
| **快速开始指南** | ❌ 无 | ✅ `QUICK_START.md`（5 大场景） |
| **提案规范文档** | ⚠️ 分散 | ✅ `PROPOSAL_REQUIREMENTS.md` |
| **强制执行清单** | ❌ 无 | ✅ `ENFORCEMENT_CHECKLIST.md` |
| **初始化提示词** | ⚠️ 不清晰 | ✅ 重构，逻辑清晰无循环引用 |

---

### 4. 🔧 字段和方法识别的精准优化

#### ❌ 原版问题示例

```java
@RestController
public class DepotController {
    @Resource
    private DepotService depotService;  // ❌ 被当成字段（错误！）
    
    public Result<Depot> selectOne(String code) {
        Result<Depot> byCode = depotService.getByCode(code);  // ❌ 被当成字段（错误！）
        return byCode;
    }
}
```

**生成的错误文档**：
```
字段：
- depotService (DepotService) - @Resource  ❌ 依赖注入不应该列为字段
- byCode (Result<Depot>)                   ❌ 局部变量不应该列为字段
```

#### ✅ 增强版修复

```
✅ 真正的字段：
（无业务字段，依赖注入已过滤）

✅ 依赖：
- DepotService - 仓库服务（依赖注入）
```

**修复的问题**：
1. ✅ 过滤 `@Autowired`, `@Resource`, `@Inject` 等依赖注入
2. ✅ 过滤 `Logger`, `serialVersionUID` 等工具字段
3. ✅ 过滤 `static final` 常量
4. ✅ 过滤方法内的局部变量

---

### 5. 🎨 用户体验优化

| 优化点 | 原版 OpenSpec | 增强版 |
|-------|--------------|--------|
| **初始化提示** | ⚠️ 逻辑混乱 | ✅ 清晰的"开始复制"和"复制结束"标记 |
| **下次使用提示** | ❌ 无 | ✅ 初始化完成时显示 4 大场景快速开始 |
| **错误处理** | ⚠️ 基础 | ✅ 字段描述长度限制，避免 JSON 乱码 |
| **文档验收标准** | ❌ 无 | ✅ 明确的核心类验收标准 |

---

## 🚀 本地部署使用方法

### 前置要求

- **Node.js**: >= 20.19.0
- **操作系统**: macOS, Linux, Windows
- **项目类型**: Java Spring Boot（Maven/Gradle）

### 安装步骤

#### 方式 1：克隆仓库并本地安装（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Lemmon0409/openspec-improve.git
cd openspec-improve

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 全局链接（本地可用）
npm link

# 5. 验证安装
openspec --version
```

#### 方式 2：从源码直接运行

```bash
# 1-3 步同上

# 4. 在项目中使用
cd /path/to/your/java/project
node /path/to/openspec-improve/dist/cli.js init
```

### 卸载

```bash
# 取消全局链接
npm unlink -g @fission-ai/openspec

# 或者使用 npm uninstall
npm uninstall -g @fission-ai/openspec
```

---

## 📋 快速开始

### 第一步：初始化项目

```bash
# 进入你的 Java Spring Boot 项目根目录
cd /path/to/your/spring-boot-project

# 初始化 OpenSpec
openspec init
```

**会发生什么？**

1. ✅ 自动扫描代码，生成文档结构
2. ✅ 创建 `openspec/` 目录
3. ✅ 生成 `project.md`（项目概览）
4. ✅ 生成 `modules/*.md`（模块文档）
5. ✅ 生成 `AGENTS.md`（AI 工作流指南）
6. ✅ 生成 `ai-tasks.md`（待补充清单）

### 第二步：AI 补充描述

初始化完成后，终端会显示：

```
📋 强制任务：请立即复制以下内容发给 AI 助手
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 开始复制 ▼

我需要你帮我完善项目文档，这是一个强制任务...
（中间是完整的步骤说明）

 复制结束 ▲
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**操作**：

1. 复制"开始复制"到"复制结束"之间的内容
2. 粘贴给 AI 助手（Claude, ChatGPT, Qwen 等）
3. AI 会自动补充所有关键类的业务描述
4. 完成后会删除 `ai-tasks.md`

### 第三步：开始开发

文档完善后，直接告诉 AI 你的需求：

```
你："我想实现一个用户登录功能，支持手机号+验证码登录。
     请基于项目文档创建 OpenSpec 提案。"
```

**AI 会自动**：

1. ✅ 读取 `openspec/project.md` 理解项目结构
2. ✅ 创建 `openspec/changes/add-phone-login/`
3. ✅ 生成 `proposal.md`（完整的 API 规范、调用链）
4. ✅ 生成 `tasks.md`（实施步骤、强制引用）

### 第四步：审查并实施

```
你："提案看起来不错，请按照 tasks.md 实施。"
```

**AI 会严格按照提案**：

1. ✅ 引用 `proposal.md` 的 API 规范
2. ✅ 使用完全相同的请求/响应结构
3. ✅ 遵循完全相同的调用链
4. ✅ 不允许偏离提案（除非先更新提案）

### 第五步：归档

功能上线后：

```bash
openspec archive add-phone-login
```

---

## 📖 常用命令

### 核心命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `openspec init` | 初始化项目，扫描代码生成文档 | `openspec init` |
| `openspec list` | 查看所有活动中的变更 | `openspec list` |
| `openspec list --specs` | 查看所有规范 | `openspec list --specs` |
| `openspec show [item]` | 查看变更或规范详情 | `openspec show add-login` |
| `openspec validate [item]` | 验证变更或规范的完整性 | `openspec validate add-login --strict` |
| `openspec archive [change-id]` | 归档已完成的变更 | `openspec archive add-login` |
| `openspec update` | 更新 AGENTS.md 等共享文件 | `openspec update` |

### 初始化选项

```bash
# 基础初始化（推荐，默认启用代码扫描）
openspec init

# 指定框架（自动检测 Spring Boot）
openspec init --frameworks spring

# 禁用代码扫描（不推荐）
openspec init --no-scan-code

# 选择特定的 AI 工具配置
openspec init --tools cline,codex
```

### 查看命令

```bash
# 查看所有活动变更（简洁模式）
openspec list

# 查看详细信息
openspec list --long

# 只查看规范
openspec list --specs

# 查看特定变更详情
openspec show add-user-login

# 查看特定规范详情
openspec show auth
```

### 验证命令

```bash
# 验证特定变更
openspec validate add-user-login

# 严格验证（推荐）
openspec validate add-user-login --strict

# 验证所有变更
openspec validate --all
```

### 归档命令

```bash
# 交互式归档（会确认）
openspec archive add-user-login

# 非交互式归档
openspec archive add-user-login --yes

# 归档多个变更
openspec archive add-login add-register --yes
```

---

## 🔄 典型工作流程

### 场景 1：新项目首次使用

```bash
# 1. 初始化
cd /path/to/your/project
openspec init

# 2. 复制提示词给 AI，AI 补充描述

# 3. 验证文档完善
ls openspec/ai-tasks.md  # 如果不存在，说明已完善

# 4. 开始开发
# 告诉 AI："我想实现 XXX 功能"
```

### 场景 2：继续未完成的工作

```bash
# 1. 查看状态
openspec list

# 2. 查看详情
openspec show add-payment

# 3. 继续实施
# 告诉 AI："请继续实施 openspec/changes/add-payment/ 的提案"
```

### 场景 3：实现新功能

```bash
# 1. 告诉 AI 需求
# "我想实现用户积分系统，支持积分充值、消费、查询"

# 2. AI 创建提案
# openspec/changes/add-points-system/
#   ├── proposal.md
#   └── tasks.md

# 3. 审查提案
cat openspec/changes/add-points-system/proposal.md

# 4. 实施
# "请按照 tasks.md 实施"

# 5. 验证
openspec validate add-points-system --strict

# 6. 上线后归档
openspec archive add-points-system
```

### 场景 4：修改现有功能

```bash
# 1. 告诉 AI
# "修改登录功能，增加短信验证码支持"

# 2. AI 创建变更提案
# openspec/changes/update-login-sms/

# 3. 审查 → 实施 → 验证 → 归档
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **总是先完善文档**
   - 让 AI 补充关键类的描述
   - Controller、Service、DTO 必须有描述
   - 验收标准：`ai-tasks.md` 被删除

2. **创建提案时要求完整规范**
   - 必须包含完整的 API 规范（请求/响应）
   - 必须包含完整的调用链
   - 必须包含详细的实现逻辑

3. **实施时严格遵循提案**
   - 不修改 API 路径
   - 不修改请求/响应字段
   - 不跳过调用链中的步骤

4. **发现问题先更新提案**
   - 如果提案有问题，先停止实施
   - 更新 `proposal.md` 和 `tasks.md`
   - 重新审查后再继续

5. **及时归档已完成的变更**
   - 功能上线后立即归档
   - 保持 `changes/` 目录整洁

### ❌ 避免做法

1. **不要跳过文档完善**
   - 没有描述的文档，AI 无法理解业务逻辑

2. **不要只创建 proposal.md**
   - `tasks.md` 是必需的，包含实施细节

3. **不要偏离提案实施**
   - "觉得这样更好"也不行
   - 必须先更新提案

4. **不要忘记归档**
   - 已部署的变更要归档
   - 否则 `changes/` 目录会越来越乱

---

## 🆘 常见问题

### Q1: 初始化后，AI 补充描述时应该复制哪些内容？

**A**: 复制终端显示的"开始复制 ▼"到"复制结束 ▲"之间的**全部内容**，包括：

- 第 1-6 步的完整说明
- 补充原则
- 验收标准

**不要复制**"使用说明"和"后续操作提示词"部分（在复制框外面）。

---

### Q2: 如何知道文档是否已经完善？

**A**: 检查 `openspec/ai-tasks.md` 是否存在：

```bash
ls openspec/ai-tasks.md

# 如果存在 → 还没完善
# 如果不存在 → 已经完善
```

---

### Q3: AI 创建提案时只生成了 proposal.md，没有 tasks.md 怎么办？

**A**: 这是 AI 没有遵循规范。提醒 AI：

```
"请按照 OpenSpec 工作流创建完整的提案：
1. 必须同时创建 proposal.md 和 tasks.md
2. tasks.md 必须包含完整的实施步骤
3. 每个任务都要引用 proposal.md 的具体章节"
```

**根本原因**：增强版已经在 6 个位置添加了强制提醒，理论上不应该出现这个问题。如果出现，可能是 AI 工具的缓存问题，重启 AI 助手即可。

---

### Q4: 提案创建后发现规范不对怎么办？

**A**: 直接修改文件，然后告诉 AI：

```bash
# 1. 手动修改
vim openspec/changes/add-login/proposal.md
vim openspec/changes/add-login/tasks.md

# 2. 告诉 AI
"提案已更新，请重新实施"
```

---

### Q5: 如何查看项目的完整文档？

**A**: 

```bash
# 主文档
cat openspec/project.md

# 模块文档
ls openspec/modules/
cat openspec/modules/user-module.md

# 工作流指南
cat openspec/AGENTS.md

# 快速开始
cat QUICK_START.md
```

---

### Q6: Maven 多模块项目如何处理？

**A**: OpenSpec Enhanced 会自动识别：

1. ✅ 扫描所有子模块的 `pom.xml`
2. ✅ 识别模块间的依赖关系
3. ✅ 为每个模块生成独立的文档
4. ✅ 在 `project.md` 中显示完整的模块树

**示例**：

```
项目结构：
my-project/
  ├── pom.xml
  ├── my-api/
  │   └── pom.xml
  ├── my-service/
  │   └── pom.xml
  └── my-web/
      └── pom.xml

生成的文档：
openspec/
  ├── project.md           # 包含完整的模块树
  ├── modules/
  │   ├── my-api.md
  │   ├── my-service.md
  │   └── my-web.md
```

---

### Q7: 字段识别不准确怎么办？

**A**: 增强版已经修复了大部分问题，但如果仍有问题，可以手动修改：

```bash
# 1. 查看生成的文档
cat openspec/modules/your-module.md

# 2. 找到错误的字段，手动删除或修正

# 3. 告诉 AI
"我已经手动修正了文档，请基于最新的文档理解项目"
```

**已修复的问题**：
- ✅ `@Autowired`, `@Resource` 依赖注入不再被当作字段
- ✅ `Logger`, `serialVersionUID` 工具字段已过滤
- ✅ `static final` 常量已过滤
- ✅ 方法内的局部变量已过滤

---

## 📚 更多文档

- [QUICK_START.md](QUICK_START.md) - 快速开始指南（5 大场景）
- [PROPOSAL_REQUIREMENTS.md](PROPOSAL_REQUIREMENTS.md) - 提案规范要求
- [ENFORCEMENT_CHECKLIST.md](ENFORCEMENT_CHECKLIST.md) - 强制执行清单
- [README_CN.md](README_CN.md) - 完整的中文用户文档（旧版，已合并到此文档）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

```bash
# 1. Fork 仓库
# 2. 创建分支
git checkout -b feature/your-feature

# 3. 开发并测试
npm run build
npm run test

# 4. 提交
git commit -m "feat: your feature description"

# 5. 推送并创建 PR
git push origin feature/your-feature
```

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- 基于 [OpenSpec v0.16.0](https://github.com/Fission-AI/OpenSpec) by Fission AI
- 感谢所有贡献者和用户的反馈

---

## 📮 联系方式

- **GitHub Issues**: [提交问题](https://github.com/Lemmon0409/openspec-improve/issues)
- **原版 Discord**: [加入 OpenSpec 社区](https://discord.gg/YctCnvvshC)

---

<p align="center">
  <sub>如果这个项目对你有帮助，请给个 ⭐ Star！</sub>
</p>
