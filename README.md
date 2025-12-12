<p align="center">
  <a href="https://github.com/Lemmon0409/openspec-improve">
    <picture>
      <source srcset="assets/openspec_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/openspec_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/openspec_pixel_light.svg" alt="OpenSpec logo" height="64">
    </picture>
  </a>
  
</p>
<p align="center">Spec-driven development for AI coding assistants - Enhanced for Java Spring Boot 🚀</p>
<p align="center">
  <a href="https://github.com/Lemmon0409/openspec-improve"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-openspec--improve-blue?logo=github&style=flat-square" /></a>
  <a href="https://github.com/Fission-AI/OpenSpec"><img alt="Based on OpenSpec v0.16.0" src="https://img.shields.io/badge/Based%20on-OpenSpec%20v0.16.0-green?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec dashboard preview" width="90%">
</p>

<p align="center">
  Follow <a href="https://x.com/0xTab">@0xTab on X</a> for updates · Join the <a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> for help and questions.
</p>

# OpenSpec Enhanced - Java Spring Boot Edition

> 基于 [OpenSpec v0.16.0](https://github.com/Fission-AI/OpenSpec) 的增强版本，专为 Java Spring Boot 项目优化。

OpenSpec 通过规范驱动开发使人类和 AI 编码助手保持一致，在编写任何代码之前就达成共识。**无需 API 密钥。**

## ✨ 增强功能亮点

相比官方版本，此增强版新增：

### 🎯 1. 默认启用完整实现指南
```bash
# 无需额外参数，一键生成完整文档
openspec init
```
- ✅ 自动扫描代码生成详细文档
- ✅ 无需 `--with-impl-guide` 参数
- ✅ 开箱即用

### ☕ 2. Java Spring Boot 全面支持
- ✅ **Maven/Gradle 多模块项目**识别和依赖分析
- ✅ **Interface、Enum、Public Class** 完整支持
- ✅ **JPA 实体映射**提取 (`@Entity`, `@Table`, `@Column`, `@Index`)
- ✅ **Spring 注解**识别 (`@RestController`, `@Service`, `@Repository`, `@Autowired`)
- ✅ **依赖注入分析**和完整调用链推断
- ✅ **扫描深度增加到 20 层**（原 10 层）

### 📚 3. 模块化文档结构
解决大型项目文档难以阅读的问题：
```
openspec/
├── project.md          # 主文档（100-200 行索引）
├── modules/            # 各模块详细文档
│   ├── module1.md     # 模块 1（2,000-6,000 行）
│   └── module2.md     # 模块 2
└── ai-tasks.md         # AI 补全任务清单
```
- ✅ 主文档作为索引和概览
- ✅ 按模块拆分详细文档
- ✅ 避免单文件过大（从 18,719 行拆分为多个可读文件）

### 🤖 4. AI 补全工作流
- ✅ **中文化初始化提示**（6 步引导流程）
- ✅ **业务场景占位符**（引导 AI 补充业务背景）
- ✅ **核心业务流程占位符**（说明关键逻辑执行顺序）
- ✅ **AI 任务清单自动生成**（列出所有需要补充的描述）

### 🎯 5. 精确实现指导
增强的 `AGENTS.md` 确保 AI 基于文档工作：
- ✅ 要求 AI 读取项目文档理解现有代码
- ✅ `task.md` 中明确调用链和文件路径
- ✅ 引用具体的现有类和方法
- ✅ **避免 AI 幻觉**，不编造不存在的代码

### 📊 真实项目验证
已在生产级项目中验证：
- **测试项目**: starchain-astrolabe（Maven 多模块项目）
- **扫描结果**: 278 个类完整识别
- **生成文档**: 
  - 主文档 122 行
  - 3 个模块文档（平均 2,000-6,000 行/模块）
  - AI 任务清单 212 行
- **AI 测试**: ✅ 能基于文档生成精确实现方案，无幻觉

---

## Why OpenSpec?

AI coding assistants are powerful but unpredictable when requirements live in chat history. OpenSpec adds a lightweight specification workflow that locks intent before implementation, giving you deterministic, reviewable outputs.

Key outcomes:
- Human and AI stakeholders agree on specs before work begins.
- Structured change folders (proposals, tasks, and spec updates) keep scope explicit and auditable.
- Shared visibility into what's proposed, active, or archived.
- Works with the AI tools you already use: custom slash commands where supported, context rules everywhere else.

## How OpenSpec compares (at a glance)

- **Lightweight**: simple workflow, no API keys, minimal setup.
- **Brownfield-first**: works great beyond 0→1. OpenSpec separates the source of truth from proposals: `openspec/specs/` (current truth) and `openspec/changes/` (proposed updates). This keeps diffs explicit and manageable across features.
- **Change tracking**: proposals, tasks, and spec deltas live together; archiving merges the approved updates back into specs.
- **Compared to spec-kit & Kiro**: those shine for brand-new features (0→1). OpenSpec also excels when modifying existing behavior (1→n), especially when updates span multiple specs.

See the full comparison in [How OpenSpec Compares](#how-openspec-compares).

## How It Works

```
┌────────────────────┐
│ Draft Change       │
│ Proposal           │
└────────┬───────────┘
         │ share intent with your AI
         ▼
┌────────────────────┐
│ Review & Align     │
│ (edit specs/tasks) │◀──── feedback loop ──────┐
└────────┬───────────┘                          │
         │ approved plan                        │
         ▼                                      │
┌────────────────────┐                          │
│ Implement Tasks    │──────────────────────────┘
│ (AI writes code)   │
└────────┬───────────┘
         │ ship the change
         ▼
┌────────────────────┐
│ Archive & Update   │
│ Specs (source)     │
└────────────────────┘

1. Draft a change proposal that captures the spec updates you want.
2. Review the proposal with your AI assistant until everyone agrees.
3. Implement tasks that reference the agreed specs.
4. Archive the change to merge the approved updates back into the source-of-truth specs.
```

## 快速开始

### 安装

#### 从 GitHub 安装（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Lemmon0409/openspec-improve.git
cd openspec-improve

# 2. 切换到增强版分支
git checkout feat/java-spring-boot-enhanced

# 3. 安装依赖
npm install

# 4. 构建项目
npm run build

# 5. 全局链接
npm link

# 6. 验证安装
openspec --version
```

### 使用

#### 初始化 Java Spring Boot 项目
```bash
cd /path/to/your-java-project
openspec init
```

#### 生成的文档结构
```
openspec/
├── AGENTS.md           # AI 工作流指南
├── project.md          # 主文档（项目概览和模块索引）
├── modules/            # 模块详细文档
│   ├── module1.md     # 模块 1 详细信息
│   └── module2.md     # 模块 2 详细信息
└── ai-tasks.md         # AI 补全任务清单
```

#### AI 补全流程（重要！）

初始化后，将以下提示词复制给 AI：

```
请按以下步骤完善项目文档：

1. 阅读 openspec/project.md 主文档，理解项目结构
2. 依次阅读 openspec/modules/*.md 中每个模块的代码
3. 根据 openspec/ai-tasks.md 的指引，补充所有类、字段、方法的业务描述
4. 在各模块文档开头添加【业务场景】章节，说明该模块解决什么业务问题
5. 添加【核心业务流程】章节，说明关键业务逻辑的执行流程
6. 完成后删除 openspec/ai-tasks.md 文件
```

#### 创建新需求

AI 补全文档后，提出需求：

```
我想实现：[描述你的需求]

请基于 openspec/project.md 和 openspec/modules/*.md 生成实现方案，
明确说明要修改的文件、调用的现有类和方法、完整的调用链。
```

### 更新

获取最新版本：
```bash
cd openspec-improve
git pull
npm run build
```

---

## 官方功能

以下是继承自 OpenSpec v0.16.0 的核心功能：

### Supported AI Tools

<details>
<summary><strong>Native Slash Commands</strong> (click to expand)</summary>

These tools have built-in OpenSpec commands. Select the OpenSpec integration when prompted.

| Tool | Commands |
|------|----------|
| **Amazon Q Developer** | `@openspec-proposal`, `@openspec-apply`, `@openspec-archive` (`.amazonq/prompts/`) |
| **Antigravity** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.agent/workflows/`) |
| **Auggie (Augment CLI)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.augment/commands/`) |
| **Claude Code** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` |
| **Cline** | Workflows in `.clinerules/workflows/` directory (`.clinerules/workflows/openspec-*.md`) |
| **CodeBuddy Code (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.codebuddy/commands/`) — see [docs](https://www.codebuddy.ai/cli) |
| **Codex** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (global: `~/.codex/prompts`, auto-installed) |
| **CoStrict** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.cospec/openspec/commands/`) — see [docs](https://costrict.ai)|
| **Crush** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.crush/commands/openspec/`) |
| **Cursor** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Factory Droid** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.factory/commands/`) |
| **Gemini CLI** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.gemini/commands/openspec/`) |
| **GitHub Copilot** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.github/prompts/`) |
| **iFlow (iflow-cli)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.iflow/commands/`) |
| **Kilo Code** | `/openspec-proposal.md`, `/openspec-apply.md`, `/openspec-archive.md` (`.kilocode/workflows/`) |
| **OpenCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Qoder (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.qoder/commands/openspec/`) — see [docs](https://qoder.com/cli) |
| **Qwen Code** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.qwen/commands/`) |
| **RooCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.roo/commands/`) |
| **Windsurf** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.windsurf/workflows/`) |

Kilo Code discovers team workflows automatically. Save the generated files under `.kilocode/workflows/` and trigger them from the command palette with `/openspec-proposal.md`, `/openspec-apply.md`, or `/openspec-archive.md`.

</details>

<details>
<summary><strong>AGENTS.md Compatible</strong> (click to expand)</summary>

These tools automatically read workflow instructions from `openspec/AGENTS.md`. Ask them to follow the OpenSpec workflow if they need a reminder. Learn more about the [AGENTS.md convention](https://agents.md/).

| Tools |
|-------|
| Amp • Jules • Others |

</details>

### Install & Initialize

#### Prerequisites
- **Node.js >= 20.19.0** - Check your version with `node --version`

#### Step 1: Install the CLI globally

```bash
npm install -g @fission-ai/openspec@latest
```

Verify installation:
```bash
openspec --version
```

#### Step 2: Initialize OpenSpec in your project

Navigate to your project directory:
```bash
cd my-project
```

Run the initialization:
```bash
openspec init
```

**What happens during initialization:**
- You'll be prompted to pick any natively supported AI tools (Claude Code, CodeBuddy, Cursor, OpenCode, Qoder,etc.); other assistants always rely on the shared `AGENTS.md` stub
- OpenSpec automatically configures slash commands for the tools you choose and always writes a managed `AGENTS.md` hand-off at the project root
- A new `openspec/` directory structure is created in your project

**After setup:**
- Primary AI tools can trigger `/openspec` workflows without additional configuration
- Run `openspec list` to verify the setup and view any active changes
- If your coding assistant doesn't surface the new slash commands right away, restart it. Slash commands are loaded at startup,
  so a fresh launch ensures they appear

### Optional: Populate Project Context

After `openspec init` completes, you'll receive a suggested prompt to help populate your project context:

```text
Populate your project context:
"Please read openspec/project.md and help me fill it out with details about my project, tech stack, and conventions"
```

Use `openspec/project.md` to define project-level conventions, standards, architectural patterns, and other guidelines that should be followed across all changes.

### Create Your First Change

Here's a real example showing the complete OpenSpec workflow. This works with any AI tool. Those with native slash commands will recognize the shortcuts automatically.

#### 1. Draft the Proposal
Start by asking your AI to create a change proposal:

```text
You: Create an OpenSpec change proposal for adding profile search filters by role and team
     (Shortcut for tools with slash commands: /openspec:proposal Add profile search filters)

AI:  I'll create an OpenSpec change proposal for profile filters.
     *Scaffolds openspec/changes/add-profile-filters/ with proposal.md, tasks.md, spec deltas.*
```

#### 2. Verify & Review
Check that the change was created correctly and review the proposal:

```bash
$ openspec list                             # Confirm the change folder exists
$ openspec validate add-profile-filters     # Validate spec formatting
$ openspec show add-profile-filters         # Review proposal, tasks, and spec delta
```

#### 3. Refine the Specs
Iterate on the specifications until they match your needs:

```text
You: Can you add acceptance criteria for the role and team filters?

AI:  I'll update the spec delta with scenarios for role and team filters.
     *Edits openspec/changes/add-profile-filters/specs/profile/spec.md and tasks.md.*
```

#### 4. Implement the Change
Once specs look good, start implementation:

```text
You: The specs look good. Let's implement this change.
     (Shortcut for tools with slash commands: /openspec:apply add-profile-filters)

AI:  I'll work through the tasks in the add-profile-filters change.
     *Implements tasks from openspec/changes/add-profile-filters/tasks.md*
     *Marks tasks complete: Task 1.1 ✓, Task 1.2 ✓, Task 2.1 ✓...*
```

#### 5. Archive the Completed Change
After implementation is complete, archive the change:

```text
AI:  All tasks are complete. The implementation is ready.

You: Please archive the change
     (Shortcut for tools with slash commands: /openspec:archive add-profile-filters)

AI:  I'll archive the add-profile-filters change.
    *Runs: openspec archive add-profile-filters --yes*
     ✓ Change archived successfully. Specs updated. Ready for the next feature!
```

Or run the command yourself in terminal:
```bash
$ openspec archive add-profile-filters --yes  # Archive the completed change without prompts
```

**Note:** Tools with native slash commands (Claude Code, CodeBuddy, Cursor, Codex, Qoder, RooCode) can use the shortcuts shown. All other tools work with natural language requests to "create an OpenSpec proposal", "apply the OpenSpec change", or "archive the change".

## Command Reference

```bash
openspec list               # View active change folders
openspec view               # Interactive dashboard of specs and changes
openspec show <change>      # Display change details (proposal, tasks, spec updates)
openspec validate <change>  # Check spec formatting and structure
openspec archive <change> [--yes|-y]   # Move a completed change into archive/ (non-interactive with --yes)
```

## Example: How AI Creates OpenSpec Files

When you ask your AI assistant to "add two-factor authentication", it creates:

```
openspec/
├── specs/
│   └── auth/
│       └── spec.md           # Current auth spec (if exists)
└── changes/
    └── add-2fa/              # AI creates this entire structure
        ├── proposal.md       # Why and what changes
        ├── tasks.md          # Implementation checklist
        ├── design.md         # Technical decisions (optional)
        └── specs/
            └── auth/
                └── spec.md   # Delta showing additions
```

### AI-Generated Spec (created in `openspec/specs/auth/spec.md`):

```markdown
# Auth Specification

## Purpose
Authentication and session management.

## Requirements
### Requirement: User Authentication
The system SHALL issue a JWT on successful login.

#### Scenario: Valid credentials
- WHEN a user submits valid credentials
- THEN a JWT is returned
```

### AI-Generated Change Delta (created in `openspec/changes/add-2fa/specs/auth/spec.md`):

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- WHEN a user submits valid credentials
- THEN an OTP challenge is required
```

### AI-Generated Tasks (created in `openspec/changes/add-2fa/tasks.md`):

```markdown
## 1. Database Setup
- [ ] 1.1 Add OTP secret column to users table
- [ ] 1.2 Create OTP verification logs table

## 2. Backend Implementation  
- [ ] 2.1 Add OTP generation endpoint
- [ ] 2.2 Modify login flow to require OTP
- [ ] 2.3 Add OTP verification endpoint

## 3. Frontend Updates
- [ ] 3.1 Create OTP input component
- [ ] 3.2 Update login flow UI
```

**Important:** You don't create these files manually. Your AI assistant generates them based on your requirements and the existing codebase.

## Understanding OpenSpec Files

### Delta Format

Deltas are "patches" that show how specs change:

- **`## ADDED Requirements`** - New capabilities
- **`## MODIFIED Requirements`** - Changed behavior (include complete updated text)
- **`## REMOVED Requirements`** - Deprecated features

**Format requirements:**
- Use `### Requirement: <name>` for headers
- Every requirement needs at least one `#### Scenario:` block
- Use SHALL/MUST in requirement text

## How OpenSpec Compares

### vs. spec-kit
OpenSpec’s two-folder model (`openspec/specs/` for the current truth, `openspec/changes/` for proposed updates) keeps state and diffs separate. This scales when you modify existing features or touch multiple specs. spec-kit is strong for greenfield/0→1 but provides less structure for cross-spec updates and evolving features.

### vs. Kiro.dev
OpenSpec groups every change for a feature in one folder (`openspec/changes/feature-name/`), making it easy to track related specs, tasks, and designs together. Kiro spreads updates across multiple spec folders, which can make feature tracking harder.

### vs. No Specs
Without specs, AI coding assistants generate code from vague prompts, often missing requirements or adding unwanted features. OpenSpec brings predictability by agreeing on the desired behavior before any code is written.

## Team Adoption

1. **Initialize OpenSpec** – Run `openspec init` in your repo.
2. **Start with new features** – Ask your AI to capture upcoming work as change proposals.
3. **Grow incrementally** – Each change archives into living specs that document your system.
4. **Stay flexible** – Different teammates can use Claude Code, CodeBuddy, Cursor, or any AGENTS.md-compatible tool while sharing the same specs.

Run `openspec update` whenever someone switches tools so your agents pick up the latest instructions and slash-command bindings.

## Updating OpenSpec

1. **Upgrade the package**
   ```bash
   npm install -g @fission-ai/openspec@latest
   ```
2. **Refresh agent instructions**
   - Run `openspec update` inside each project to regenerate AI guidance and ensure the latest slash commands are active.

## Contributing

欢迎贡献！

- Install dependencies: `npm install`
- Build: `npm run build`
- Test: `npm test`
- Develop CLI locally: `npm run dev` or `npm run dev:cli`
- Conventional commits (one-line): `type(scope): subject`

## 版本历史

### v0.16.0-enhanced.1 (2024-12-12)

**核心功能增强**:
1. 默认启用完整实现指南（无需 `--with-impl-guide` 参数）
2. 支持 Java Spring Boot 项目（Maven/Gradle 多模块、JPA、Spring 注解）
3. 模块化文档结构（主文档 + 模块拆分）
4. AI 补全工作流（中文引导、业务场景占位符）
5. JavaDoc 描述提取修复

**新增文件**:
- `src/core/code-scanner.ts` - 代码扫描核心引擎
- `src/core/framework-detector.ts` - 框架检测器
- `src/core/templates/impl-guide-generator.ts` - 实现指南生成器
- `GIT_SETUP.md` - Git 仓库设置指南
- `SHARING_OPTIONS.md` - 分享方案对比
- `README_ENHANCED.md` - 增强版功能说明

**Bug 修复**:
- ✅ 修复 JavaDoc 类描述显示 `@author` 的问题
- ✅ 修复所有字段显示相同描述的问题
- ✅ 修复 `@Post()` 等无参数装饰器未识别的问题
- ✅ 增加扫描深度从 10 层到 20 层
- ✅ 支持 Java `interface` 和 `enum`

## 相关链接

- **官方仓库**: https://github.com/Fission-AI/OpenSpec
- **增强版仓库**: https://github.com/Lemmon0409/openspec-improve
- **增强版分支**: https://github.com/Lemmon0409/openspec-improve/tree/feat/java-spring-boot-enhanced

## 致谢

本项目基于 [OpenSpec](https://github.com/Fission-AI/OpenSpec) v0.16.0 开发，感谢 OpenSpec 团队的开源贡献。

## License

- Install dependencies: `pnpm install`
- Build: `pnpm run build`
- Test: `pnpm test`
- Develop CLI locally: `pnpm run dev` or `pnpm run dev:cli`
- Conventional commits (one-line): `type(scope): subject`

## License

MIT
