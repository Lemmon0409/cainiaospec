# OpenSpec 增强版 - Java Spring Boot 专用版

<p align="center">
  <img src="assets/openspec_pixel_light.svg" alt="OpenSpec logo" height="64">
</p>

<p align="center">
  <a href="https://github.com/Lemmon0409/openspec-improve"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-openspec--improve-blue?logo=github&style=flat-square" /></a>
  <a href="https://github.com/Fission-AI/OpenSpec"><img alt="基于 OpenSpec v0.16.0" src="https://img.shields.io/badge/基于-OpenSpec%20v0.16.0-green?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="Node.js >= 20.19.0" src="https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

---

## 📖 目录

- [项目简介](#项目简介)
- [为什么选择增强版？](#为什么选择增强版)
- [核心改进功能](#核心改进功能)
- [安装指南](#安装指南)
- [快速上手](#快速上手)
- [完整使用流程](#完整使用流程)
- [改进功能详解](#改进功能详解)
- [实际案例](#实际案例)
- [常见问题](#常见问题)
- [版本历史](#版本历史)

---

## 项目简介

OpenSpec 增强版是基于 [OpenSpec v0.16.0](https://github.com/Fission-AI/OpenSpec) 开发的专业版本，**专门为 Java Spring Boot 项目优化**。

### 什么是 OpenSpec？

OpenSpec 是一个 AI 驱动的规范管理工具，让你在写代码之前先和 AI 达成一致，避免 AI 编造代码、理解错误需求。它通过**规范驱动开发**的方式，让人类和 AI 保持同步。

### 增强版做了什么？

我们在官方版本基础上，针对 **Java Spring Boot 企业级项目**做了深度优化：
- ✅ 自动识别 Maven/Gradle 多模块项目结构
- ✅ 完整解析 Spring 注解和 JPA 实体映射
- ✅ 生成易读的模块化文档（解决大项目文档过长问题）
- ✅ 提供中文化的 AI 补全工作流
- ✅ 确保 AI 基于真实代码生成实现方案，避免幻觉

---

## 为什么选择增强版？

### 官方版本的局限性

| 问题 | 官方版本 | 增强版 |
|------|---------|--------|
| **Java 项目支持** | 仅支持 TypeScript/JavaScript | ✅ 完整支持 Java Spring Boot |
| **多模块项目** | 无法识别模块结构 | ✅ 自动识别 Maven/Gradle 模块 |
| **文档可读性** | 单文件可能达数万行 | ✅ 模块化拆分，主文档作索引 |
| **AI 工作流** | 英文提示，无引导 | ✅ 中文 6 步引导流程 |
| **代码扫描深度** | 10 层（很多文件扫描不到） | ✅ 20 层（深度扫描） |
| **Interface/Enum** | 不支持 | ✅ 完整支持 |
| **依赖注入分析** | 无 | ✅ 自动分析调用链 |

### 真实对比

**官方版本生成的文档**：
```
openspec/
└── project.md (171 行，信息不完整)
    - 缺少 Service 层
    - 缺少 Interface 定义
    - 缺少数据库实体映射
```

**增强版生成的文档**：
```
openspec/
├── project.md (122 行，清晰的索引)
├── modules/
│   ├── starchain-support-bus.md (6,288 行，完整的模块文档)
│   ├── starchain-support-notification.md (...)
│   └── starter.md (...)
└── ai-tasks.md (212 行，AI 补全任务清单)

总计：278 个类完整识别 ✅
```

---

## 核心改进功能

### 🎯 改进 1: 默认启用完整文档生成

**改进前**（官方版本）：
```bash
# 需要额外参数才能生成详细文档
openspec init --with-impl-guide
```

**改进后**（增强版）：
```bash
# 一键生成完整文档，无需参数
openspec init
```

**改进原理**：
- 修改了 `src/core/init.ts` 第 389 行，将 `scanCode` 默认值改为 `true`
- 自动扫描代码生成完整的类、方法、字段文档

---

### ☕ 改进 2: Java Spring Boot 全面支持

**改进前**（官方版本）：
- ❌ 不识别 Java 文件
- ❌ 不支持 `interface` 和 `enum`
- ❌ 不识别 Spring 注解
- ❌ 扫描深度只有 10 层（Java 项目通常 14+ 层）

**改进后**（增强版）：
```java
// ✅ 完整识别以下代码结构

// 1. Interface 支持
public interface UserService {
    User findById(Long id);
}

// 2. Enum 支持
public enum UserStatus {
    ACTIVE, INACTIVE
}

// 3. Spring 注解识别
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired  // ✅ 识别依赖注入
    private UserService userService;
    
    @GetMapping("/{id}")  // ✅ 识别 API 端点
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}

// 4. JPA 实体映射
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email")
})
public class User {
    @Id
    @Column(name = "user_id")
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String email;
}
```

**生成的文档示例**：
```markdown
### `UserController`
- **文件**: `src/main/java/com/example/controller/UserController.java`
- **类型**: RestController
- **依赖**: `UserService` (通过 @Autowired 注入)

**API 端点**:
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users/{id} | 获取用户信息 |

**依赖注入**:
- `UserService` - 用户业务逻辑服务

**调用链**:
UserController → UserService → UserRepository
```

**改进原理**：
- 新增 `src/core/code-scanner.ts` - 代码扫描引擎
- 支持正则匹配 `public interface`、`public enum`
- 识别 Spring 注解：`@RestController`, `@Service`, `@Repository`, `@Autowired`
- 识别 JPA 注解：`@Entity`, `@Table`, `@Column`, `@Index`
- 扫描深度从 10 层增加到 20 层

---

### 📚 改进 3: 模块化文档结构

**问题场景**：
某个 Maven 多模块项目有 278 个类，官方版本生成的 `project.md` 达到 **18,719 行**，AI 根本读不完！

**改进前**（官方版本）：
```
openspec/
└── project.md (18,719 行 ❌ AI 无法处理)
```

**改进后**（增强版）：
```
openspec/
├── project.md (122 行 ✅ 主文档作为索引)
│   ├── 项目概览
│   ├── 技术栈
│   ├── 模块列表（链接到各模块文档）
│   └── 代码风格
│
├── modules/
│   ├── starchain-support-bus.md (6,288 行)
│   │   ├── 🎯 业务场景（AI 补全占位符）
│   │   ├── 🔄 核心业务流程（AI 补全占位符）
│   │   ├── 📊 模块统计（8 个 Controller，28 个 Service...）
│   │   └── 详细类文档
│   │
│   ├── starchain-support-notification.md (...)
│   └── starter.md (...)
│
└── ai-tasks.md (212 行)
    ├── 604 个缺少描述的类
    ├── 631 个缺少说明的字段
    └── 按类型分组的补全任务
```

**使用逻辑**：
1. AI 先读 `project.md`，了解项目整体结构
2. 根据需求定位到具体模块（如 `starchain-support-bus`）
3. 只读取相关模块的文档（6,288 行，AI 可处理）
4. 基于模块文档生成精确实现方案

**改进原理**：
- 新增 `src/core/templates/project-template.ts` 中的 `generateModularDocs()` 函数
- 自动检测：如果类超过 50 个且有多模块，则拆分文档
- 每个模块文档独立生成，包含业务场景占位符

---

### 🤖 改进 4: AI 补全工作流

**改进前**（官方版本）：
- 初始化后只有英文提示
- 没有引导 AI 如何补全文档
- AI 不知道从哪里开始

**改进后**（增强版）：
初始化后自动显示中文 6 步引导：

```
✨ 文档生成完成！

📚 项目文档已创建在 openspec/ 目录

接下来的步骤：

1. 完善项目文档（必需）:
   "请按以下步骤完善项目文档：
   1. 阅读 openspec/project.md 主文档，理解项目结构
   2. 依次阅读 openspec/modules/*.md 中每个模块的代码
   3. 根据 openspec/ai-tasks.md 的指引，补充所有类、字段、方法的业务描述
   4. 在各模块文档开头添加【业务场景】章节，说明该模块解决什么业务问题
   5. 添加【核心业务流程】章节，说明关键业务逻辑的执行流程
   6. 完成后删除 openspec/ai-tasks.md 文件"
```

**AI 任务清单示例**（`ai-tasks.md`）：
```markdown
# AI 补全任务清单

## 📋 需要补充业务描述的类

### 控制器类（8 个）
1. BusOptibusSyncController
   - 文件: starchain-support-bus-web/.../BusOptibusSyncController.java
   - 当前描述: 无
   - 需要补充: 该控制器的业务作用、主要功能

2. BusQueryController
   - 文件: starchain-support-bus-web/.../BusQueryController.java
   - 当前描述: 无
   - 需要补充: 查询服务的具体业务场景
   
### 服务类（28 个）
...

## 📋 需要补充说明的字段（631 个）
...
```

**业务场景占位符示例**：
```markdown
## 🎯 业务场景

**[请 AI 补充: 说明该模块解决什么业务问题，服务于哪些业务场景]**

例如：
- 主要业务场景 1
- 主要业务场景 2
- 核心价值和解决的问题

## 🔄 核心业务流程

**[请 AI 补充: 描述关键业务流程的执行顺序和逻辑]**

例如：
### 流程 1: [流程名称]
1. 用户/系统触发 -> Controller
2. Controller 调用 -> Service
3. Service 执行业务逻辑 -> Manager/DAO
4. 返回结果
```

**改进原理**：
- 修改 `src/core/init.ts` 第 943-980 行，添加中文化提示
- 新增 `generateAICompletionTasks()` 函数，自动生成任务清单
- 在模块文档中插入业务场景和流程占位符

---

### 🎯 改进 5: 精确实现指导（避免 AI 幻觉）

**问题场景**：
AI 经常编造不存在的类和方法，导致生成的代码无法运行。

**改进前**（官方版本）：
```markdown
# AI 生成的 task.md（错误示例）

## Task 1: 创建用户服务
- 使用 UserServiceImpl 类  ❌ (这个类不存在！)
- 调用 UserDAO.findUser() 方法  ❌ (方法名错误！)
```

**改进后**（增强版）：
增强的 `AGENTS.md` 强制要求 AI 基于文档工作：

```markdown
**Before Any Task (必须执行):**
- [ ] Read `openspec/project.md` for project structure
- [ ] Read relevant `openspec/modules/*.md` to understand existing classes
- [ ] Check existing implementations before creating new code

**When Creating task.md:**
- MUST base on project documentation
- MUST include specific file paths
- MUST reference concrete code locations
- MUST specify which existing classes/services will be called
- MUST list the call chain (e.g., "Controller → Service → Manager → DAO")
```

**AI 生成的 task.md（正确示例）**：
```markdown
# Task: 批量查询司机巴士任务状态

## 📍 模块定位
- 目标模块: starchain-support-bus
- 参考文档: openspec/modules/starchain-support-bus.md

## Task 1: 扩展 BusQueryService 接口
**文件**: `starchain-support-bus-biz/.../BusQueryService.java`

**使用现有类**:
- ✅ BusQueryService (已存在，见文档第 85 行)
- ✅ BusTaskRuntimeService (已存在，见文档第 85 行)

**新增方法**:
```java
List<BusTaskViewDTO> selectTaskAndRuntimeByDriverBatch(
    List<String> driverCodes, 
    String date
);
```

**调用链**:
```
BusQueryController (已存在)
  ↓ 依赖注入 @Resource
BusQueryService.selectTaskAndRuntimeByDriverBatch() (新增)
  ↓ 调用
BusTaskRuntimeService (已存在)
```

**验证**: 
- 文件路径已在文档第 85 行确认 ✅
- 依赖关系已在文档第 91 行确认 ✅
- 现有方法参考文档第 124 行 ✅
```

**改进原理**：
- 修改 `src/core/templates/agents-template.ts`
- 添加 "Before Any Task" 检查清单
- 要求 AI 明确引用文档中的行号和类名
- 强制列出调用链和现有依赖

---

## 安装指南

### 环境要求

| 软件 | 版本要求 | 检查命令 |
|------|---------|---------|
| **Node.js** | >= 20.19.0 | `node --version` |
| **npm** | >= 10.0.0 | `npm --version` |
| **Git** | 任意版本 | `git --version` |

### 安装步骤

#### 步骤 1: 克隆仓库

```bash
git clone https://github.com/Lemmon0409/openspec-improve.git
cd openspec-improve
```

#### 步骤 2: 切换到增强版分支

```bash
git checkout feat/java-spring-boot-enhanced
```

#### 步骤 3: 安装依赖

```bash
npm install
```

如果遇到依赖安装问题，尝试清除缓存：
```bash
npm cache clean --force
npm install
```

#### 步骤 4: 构建项目

```bash
npm run build
```

#### 步骤 5: 全局链接

```bash
npm link
```

#### 步骤 6: 验证安装

```bash
openspec --version
```

应该看到版本号输出（例如：`0.16.0`）

### 安装故障排除

**问题 1: npm link 后找不到 openspec 命令**

解决方法：
```bash
# 检查 npm 全局路径
npm config get prefix

# 将 npm 全局路径添加到 PATH
# 编辑 ~/.zshrc 或 ~/.bashrc，添加：
export PATH="$(npm config get prefix)/bin:$PATH"

# 重新加载配置
source ~/.zshrc  # 或 source ~/.bashrc
```

**问题 2: Node.js 版本过低**

解决方法：
```bash
# 使用 nvm 安装 Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# 或使用 Homebrew (macOS)
brew install node@20
```

**问题 3: 构建失败**

解决方法：
```bash
# 删除 node_modules 和 dist
rm -rf node_modules dist

# 重新安装和构建
npm install
npm run build
```

---

## 快速上手

### 10 分钟快速体验

#### 1. 初始化 Java 项目

```bash
cd /path/to/your-java-spring-boot-project
openspec init
```

**交互式选择**：
```
? Select AI tools you want to integrate: (使用空格选择)
❯ ◯ Cursor
  ◯ Qoder
  ◯ Claude Code
  ◯ 其他工具...
```

#### 2. 查看生成的文档

```bash
ls -lh openspec/

# 输出示例：
# project.md          - 主文档（项目概览）
# modules/            - 模块文档目录
# ai-tasks.md         - AI 补全任务清单
# AGENTS.md           - AI 工作流指南
```

#### 3. 阅读主文档

```bash
cat openspec/project.md
```

你会看到：
- 📋 项目概览
- 🏗️ 项目结构（Maven/Gradle 模块列表）
- 📚 模块文档索引（链接到各模块）
- 🎨 代码风格

#### 4. AI 补全文档（重要！）

复制以下内容发给你的 AI 助手（Cursor/Claude/Qoder）：

```
请按以下步骤完善项目文档：

1. 阅读 openspec/project.md 主文档，理解项目结构
2. 依次阅读 openspec/modules/*.md 中每个模块的代码
3. 根据 openspec/ai-tasks.md 的指引，补充所有类、字段、方法的业务描述
4. 在各模块文档开头添加【业务场景】章节，说明该模块解决什么业务问题
5. 添加【核心业务流程】章节，说明关键业务逻辑的执行流程
6. 完成后删除 openspec/ai-tasks.md 文件
```

AI 会自动：
- ✅ 读取所有模块文档
- ✅ 补充类、方法、字段的业务描述
- ✅ 添加业务场景说明
- ✅ 绘制业务流程图

#### 5. 创建第一个需求

补全文档后，向 AI 提出需求：

```
我想实现一个功能：批量查询多个用户的订单状态

请基于 openspec/project.md 和 openspec/modules/*.md 生成实现方案，
明确说明要修改的文件、调用的现有类和方法、完整的调用链。
```

AI 会生成：
- ✅ 明确的文件路径
- ✅ 现有类和方法的引用
- ✅ 完整的调用链（Controller → Service → Repository）
- ✅ 不会编造不存在的代码

---

## 完整使用流程

### 工作流程图

```
┌─────────────────────────────────────────────────────────────┐
│  第 1 步: 初始化项目                                          │
│  $ openspec init                                            │
│  生成: project.md, modules/*.md, ai-tasks.md, AGENTS.md    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 2 步: AI 补全文档（必需）                                 │
│  将中文提示词发给 AI，让它：                                  │
│  - 补充所有类、方法、字段的业务描述                           │
│  - 添加业务场景和核心流程                                     │
│  - 删除 ai-tasks.md                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 3 步: 提出需求                                           │
│  向 AI 描述你想实现的功能                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 4 步: AI 生成实现方案                                     │
│  AI 基于文档生成：                                           │
│  - proposal.md（需求说明）                                   │
│  - tasks.md（实现步骤）                                      │
│  - specs/*.md（规范更新）                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 5 步: 审查和调整                                         │
│  $ openspec show <change-name>                             │
│  审查 AI 生成的方案，提出修改建议                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 6 步: 实施变更                                           │
│  让 AI 按照 tasks.md 实现代码                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  第 7 步: 归档变更                                           │
│  $ openspec archive <change-name> --yes                    │
│  将变更合并到主规范中                                         │
└─────────────────────────────────────────────────────────────┘
```

### 详细步骤说明

#### 第 1 步: 初始化项目

```bash
cd /path/to/your-java-project
openspec init
```

**生成的文件结构**：
```
your-java-project/
├── src/
│   └── main/
│       └── java/
│           └── com/example/
│               ├── controller/
│               ├── service/
│               └── repository/
├── pom.xml (或 build.gradle)
└── openspec/  ← 新增目录
    ├── AGENTS.md
    ├── project.md
    ├── modules/
    │   ├── your-module-1.md
    │   └── your-module-2.md
    └── ai-tasks.md
```

#### 第 2 步: AI 补全文档

**为什么这一步很重要？**
- 初始文档只有代码结构，没有业务描述
- AI 需要理解业务逻辑才能生成正确的实现
- 补全后的文档是 AI 工作的"知识库"

**操作步骤**：

1. 复制提示词：
```
请按以下步骤完善项目文档：

1. 阅读 openspec/project.md 主文档，理解项目结构
2. 依次阅读 openspec/modules/*.md 中每个模块的代码
3. 根据 openspec/ai-tasks.md 的指引，补充所有类、字段、方法的业务描述
4. 在各模块文档开头添加【业务场景】章节，说明该模块解决什么业务问题
5. 添加【核心业务流程】章节，说明关键业务逻辑的执行流程
6. 完成后删除 openspec/ai-tasks.md 文件
```

2. 发给 AI（Cursor/Claude/Qoder）

3. AI 会：
   - 读取所有文档
   - 分析代码逻辑
   - 补充业务描述
   - 添加业务场景
   - 绘制流程图

**补全前后对比**：

**补全前**：
```markdown
### `UserService`
- **文件**: `src/main/java/com/example/service/UserService.java`
- **方法**: findById(Long id)
- **描述**: 无  ❌
```

**补全后**：
```markdown
### `UserService`
- **文件**: `src/main/java/com/example/service/UserService.java`
- **业务场景**: 用户管理服务，负责用户信息的增删改查 ✅
- **核心功能**: 
  - 根据 ID 查询用户
  - 验证用户权限
  - 用户状态管理

**方法**:
| 方法 | 描述 | 调用链 |
|------|------|--------|
| findById(Long id) | 根据用户ID查询用户信息 | UserController → UserService → UserRepository |

**业务流程**:
1. 接收用户ID
2. 从数据库查询用户
3. 验证用户状态
4. 返回用户信息
```

#### 第 3 步: 提出需求

向 AI 描述你想实现的功能：

```
我想实现一个功能：批量导出用户订单，支持按日期范围和订单状态筛选

请基于 openspec/project.md 和相关模块文档生成实现方案。
```

#### 第 4 步: AI 生成实现方案

AI 会创建变更文件夹：

```
openspec/
└── changes/
    └── add-batch-export-orders/  ← 新增
        ├── proposal.md         # 需求说明
        ├── tasks.md            # 实现步骤
        └── specs/
            └── order/
                └── spec.md     # 规范更新
```

**proposal.md 示例**：
```markdown
# 变更提案: 批量导出用户订单

## 业务背景
运营团队需要批量导出订单数据进行分析，支持按日期和状态筛选。

## 实现方案

### 1. 新增 API 端点
**文件**: `src/main/java/com/example/controller/OrderController.java`
**方法**: `POST /api/orders/export`

### 2. 使用现有服务
- ✅ OrderService (已存在，见 openspec/modules/order-module.md 第 45 行)
- ✅ OrderRepository (已存在，见文档第 89 行)

### 3. 调用链
```
OrderController.exportOrders()
  ↓
OrderService.findByDateRangeAndStatus()  (现有方法)
  ↓
OrderRepository.findAll()
  ↓
ExcelExportUtil (新增)
```

## 技术细节
- 使用 Apache POI 生成 Excel
- 异步处理大数据量导出
- 文件存储到 OSS
```

**tasks.md 示例**：
```markdown
# 实现任务清单

## Task 1: 创建导出 DTO
**文件**: `src/main/java/com/example/dto/OrderExportQuery.java`
```java
public class OrderExportQuery {
    private LocalDate startDate;
    private LocalDate endDate;
    private OrderStatus status;
}
```

## Task 2: 扩展 OrderController
**文件**: `src/main/java/com/example/controller/OrderController.java`

**使用现有依赖**:
- ✅ OrderService (已注入，见文档第 12 行)

**新增方法**:
```java
@PostMapping("/export")
public String exportOrders(@RequestBody OrderExportQuery query) {
    // 调用现有服务
    List<Order> orders = orderService.findByDateRangeAndStatus(
        query.getStartDate(), 
        query.getEndDate(), 
        query.getStatus()
    );
    
    // 生成 Excel
    return excelService.export(orders);
}
```

**验证**:
- [ ] OrderService.findByDateRangeAndStatus() 已确认存在 ✅
- [ ] 调用链正确
- [ ] API 路径符合规范
```

#### 第 5 步: 审查和调整

```bash
# 查看变更详情
openspec show add-batch-export-orders

# 验证规范格式
openspec validate add-batch-export-orders
```

如果需要调整，告诉 AI：
```
请修改 tasks.md，增加权限校验步骤
```

#### 第 6 步: 实施变更

```
请按照 openspec/changes/add-batch-export-orders/tasks.md 实现代码
```

AI 会：
1. 读取 tasks.md
2. 按顺序实现每个任务
3. 标记完成的任务
4. 运行测试验证

#### 第 7 步: 归档变更

```bash
# 归档变更（合并到主规范）
openspec archive add-batch-export-orders --yes

# 查看归档历史
ls openspec/archive/
```

---

## 改进功能详解

### 功能 1: Maven/Gradle 多模块识别

**识别的项目结构**：

```
my-project/
├── pom.xml  ← 识别为 Maven 多模块
├── module-api/
│   └── pom.xml
├── module-service/
│   └── pom.xml
└── module-dao/
    └── pom.xml
```

**生成的文档**：
```markdown
## 🏗️ 项目结构

**构建工具**: Maven
**模块数量**: 3

### 模块列表
1. **module-api** - API 接口层
2. **module-service** - 业务逻辑层
3. **module-dao** - 数据访问层

### 模块依赖关系
```
module-api
  ↓ 依赖
module-service
  ↓ 依赖
module-dao
```
```

**技术实现**：
- 新增 `src/core/framework-detector.ts`
- 解析 `pom.xml` 中的 `<modules>` 标签
- 解析 `settings.gradle` 中的 `include` 语句
- 构建模块依赖树

---

### 功能 2: Spring 注解和依赖注入分析

**识别的注解**：

| 注解类型 | 识别的注解 | 用途 |
|---------|----------|------|
| **Controller** | @RestController, @Controller | API 端点 |
| **Service** | @Service | 业务逻辑 |
| **Repository** | @Repository | 数据访问 |
| **依赖注入** | @Autowired, @Resource, @Inject | 依赖关系 |
| **API 映射** | @GetMapping, @PostMapping, @PutMapping, @DeleteMapping | HTTP 方法 |
| **JPA 实体** | @Entity, @Table, @Column | 数据库映射 |

**生成的调用链示例**：
```markdown
### UserController

**依赖注入**:
```java
@Autowired
private UserService userService;

@Autowired
private OrderService orderService;
```

**调用链分析**:
```
UserController
  ├─→ UserService
  │     └─→ UserRepository
  └─→ OrderService
        └─→ OrderRepository
```

**API 端点**:
| HTTP | 路径 | 方法 | 调用 |
|------|------|------|------|
| GET | /api/users/{id} | getUser() | UserService.findById() |
| POST | /api/users | createUser() | UserService.save() |
```

---

### 功能 3: JPA 实体映射提取

**识别的代码**：
```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_status", columnList = "status")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(name = "user_status")
    private String status;
}
```

**生成的文档**：
```markdown
### `User` (实体类)

**数据库映射**:
- **表名**: users
- **索引**:
  - idx_email (字段: email)
  - idx_status (字段: status)

**字段映射**:
| Java 字段 | 数据库列名 | 类型 | 约束 | 描述 |
|----------|----------|------|------|------|
| id | user_id | Long | 主键, 自增 | 用户ID |
| email | email | String(100) | 非空, 唯一 | 用户邮箱 |
| status | user_status | String | - | 用户状态 |
```

---

### 功能 4: JavaDoc 描述提取（修复版）

**问题案例**：
```java
/**
 * @author xinzong
 * @date 2024-01-01
 */
public class UserService {
    /**
     * 用户ID
     * for example: 12345
     */
    private Long userId;
    
    /**
     * 用户名称
     */
    private String userName;
}
```

**官方版本错误输出**：
```
类描述: @author xinzong  ❌
userId 描述: 用户ID for example: 12345  ❌
userName 描述: 用户ID for example: 12345  ❌ (所有字段显示相同描述)
```

**增强版正确输出**：
```
类描述: (无)  ✅ (正确忽略 @author)
userId 描述: 用户ID  ✅
userName 描述: 用户名称  ✅
```

**修复原理**：
- 改进 `extractJsDoc()` 方法
- 只提取 `@` 标签之前的文本
- 检查 JavaDoc 和字段之间是否有分号，避免匹配错误的注释

---

## 实际案例

### 案例: starchain-astrolabe 项目

**项目背景**：
- Maven 多模块项目
- 3 个模块：bus, notification, starter
- 278 个类
- 14 层目录深度

**官方版本结果**：
```bash
$ openspec init --with-impl-guide  # 需要额外参数

生成文档:
- project.md: 171 行  ❌
  - 只识别到部分类
  - 缺少 Service 层
  - 缺少 Interface
  - 很多深层目录的文件未扫描到
```

**增强版结果**：
```bash
$ openspec init  # 无需参数

生成文档:
- project.md: 122 行 ✅
- modules/starchain-support-bus.md: 6,288 行 ✅
- modules/starchain-support-notification.md: 7,500 行 ✅
- modules/starter.md: 4,200 行 ✅
- ai-tasks.md: 212 行 ✅

总计: 278 个类完整识别
- 8 个 Controller ✅
- 28 个 Service ✅
- 46 个 DTO ✅
- 完整的依赖关系 ✅
```

**AI 测试结果**：

用户需求：
```
我想实现一个功能：批量查询多个司机当前的巴士任务状态，
包括他们正在执行的路线、下一站信息等
```

AI 生成的实现方案（基于增强版文档）：
```markdown
## 📍 模块定位
- 目标模块: starchain-support-bus
- 参考文档: openspec/modules/starchain-support-bus.md

## 现有类分析
根据文档第 82-136 行，发现：
- ✅ BusQueryController (已存在)
- ✅ BusQueryService (已存在，第 91 行)
- ✅ BusTaskRuntimeService (已存在，第 92 行)
- ✅ 现有方法: selectTaskAndRuntimeByDriver(String driverCode)

## 实现方案

### Task 1: 扩展 BusQueryService 接口
**文件**: `starchain-support-bus-biz/.../BusQueryService.java`

**新增方法**:
```java
// 批量查询版本（基于现有单个查询方法）
List<BusTaskViewDTO> selectTaskAndRuntimeByDriverBatch(
    List<String> driverCodes, 
    String date
);
```

### Task 2: 实现批量查询逻辑
**文件**: `starchain-support-bus-biz/.../BusQueryServiceImpl.java`

**调用链** (基于文档第 85 行):
```
BusQueryController
  ↓ 依赖 @Resource (第 91 行)
BusQueryService.selectTaskAndRuntimeByDriverBatch()
  ↓ 循环调用现有方法
selectTaskAndRuntimeByDriver()  (第 124 行)
  ↓ 使用
BusTaskRuntimeService (第 92 行)
```

### Task 3: 添加 Controller 端点
**文件**: `starchain-support-bus-web/.../BusQueryController.java`

**新增 API**:
```java
@PostMapping("/task/batch/query")
public Result<List<BusTaskViewDTO>> batchQuery(
    @RequestBody BatchDriverQueryDTO query
) {
    return success(busQueryService.selectTaskAndRuntimeByDriverBatch(
        query.getDriverCodes(), 
        query.getDate()
    ));
}
```

**验证**:
- ✅ BusQueryController 已存在（文档第 82 行）
- ✅ busQueryService 已注入（文档第 91 行 @Resource）
- ✅ 现有方法参考（文档第 124 行）
- ✅ 返回类型 BusTaskViewDTO 已定义（文档第 97 行）
```

**结论**：
- ✅ 所有引用的类都真实存在
- ✅ 所有方法都有文档支持
- ✅ 调用链清晰准确
- ✅ 没有编造任何代码

---

## 常见问题

### Q1: 初始化后没有生成 modules/ 目录？

**原因**: 项目不是多模块项目，或者类数量少于 50 个

**解决方法**:
- 如果是单模块项目，所有内容会在 `project.md` 中
- 如果是多模块但未识别，检查是否有 `pom.xml` 或 `settings.gradle`

### Q2: 生成的文档中很多类缺少描述？

**这是正常的！** 初始文档只包含代码结构，业务描述需要 AI 补全。

**解决步骤**:
1. 查看 `ai-tasks.md`，了解缺少哪些描述
2. 将中文提示词发给 AI
3. AI 会自动补充所有描述

### Q3: AI 生成的代码引用了不存在的类？

**原因**: AI 没有读取项目文档，凭空想象

**解决方法**:
在提示词中明确要求：
```
请基于 openspec/project.md 和 openspec/modules/*.md 生成实现方案，
必须引用文档中已存在的类和方法，不要编造。
```

### Q4: 扫描时间过长？

**原因**: 项目过大，扫描深度 20 层

**优化方法**:
```bash
# 排除不需要扫描的目录
# 编辑 .gitignore，OpenSpec 会自动排除这些目录
target/
build/
node_modules/
```

### Q5: 如何更新文档？

**方法 1**: 重新初始化（会覆盖现有文档）
```bash
rm -rf openspec/
openspec init
```

**方法 2**: 手动编辑文档
```bash
# 直接编辑模块文档
vim openspec/modules/your-module.md
```

**方法 3**: 让 AI 更新
```
请更新 openspec/modules/user-module.md，
补充 UserService.updateUser() 方法的描述
```

### Q6: 支持 Kotlin 吗？

目前增强版主要针对 Java，Kotlin 支持有限。

**部分支持**:
- ✅ 类和方法识别
- ✅ 文件扫描
- ❌ Kotlin 特有语法（data class, sealed class 等）

### Q7: 支持 Gradle 吗？

✅ 完全支持！

**识别的文件**:
- `settings.gradle` - 多模块配置
- `build.gradle` - 模块依赖

### Q8: 如何与团队共享配置？

**方法 1**: 提交到 Git
```bash
git add openspec/
git commit -m "docs: 添加 OpenSpec 项目文档"
git push
```

**方法 2**: 定期同步
```bash
# 团队成员拉取最新文档
git pull
```

---

## 版本历史

### v0.16.0-enhanced.1 (2024-12-12)

#### 🎯 核心功能增强

1. **默认启用完整实现指南**
   - 修改: `src/core/init.ts` 第 389 行
   - 变更: `scanCode` 默认值从 `false` 改为 `true`
   - 效果: 无需 `--with-impl-guide` 参数

2. **Java Spring Boot 全面支持**
   - 新增: `src/core/code-scanner.ts` (代码扫描引擎)
   - 新增: `src/core/framework-detector.ts` (框架检测器)
   - 支持: Interface, Enum, Public Class
   - 支持: Spring 注解 (@RestController, @Service, @Autowired)
   - 支持: JPA 注解 (@Entity, @Table, @Column, @Index)
   - 变更: 扫描深度从 10 层增加到 20 层

3. **模块化文档结构**
   - 新增: `src/core/templates/project-template.ts` 中的模块化文档函数
   - 新增: `generateModularDocs()`, `generateIndexDoc()`, `generateModuleDoc()`
   - 效果: 主文档 + 模块拆分（解决大文件问题）

4. **AI 补全工作流**
   - 修改: `src/core/init.ts` 第 943-980 行（中文化提示）
   - 新增: `generateAICompletionTasks()` 函数
   - 新增: 业务场景和核心流程占位符
   - 新增: AI 任务清单自动生成

5. **精确实现指导**
   - 修改: `src/core/templates/agents-template.ts`
   - 新增: Before Any Task 检查清单
   - 新增: 强制要求 AI 读取项目文档
   - 新增: 明确调用链和文件路径要求

#### 🐛 Bug 修复

1. **JavaDoc 类描述显示 @author**
   - 修复: `extractJsDoc()` 方法
   - 原因: 提取了第一行，即使是 @author 标签
   - 方案: 只提取 @ 标签之前的文本

2. **所有字段显示相同描述**
   - 修复: `extractJsDoc()` 方法
   - 原因: 向后查找时匹配到前一个字段的 JavaDoc
   - 方案: 检查 JavaDoc 结束位置和当前位置之间是否有分号

3. **@Post() 等无参数装饰器未识别**
   - 修复: API 端点正则表达式
   - 原因: 正则要求必须有引号参数
   - 方案: 使参数可选 `\(\s*(?:['"]([^'"]*)['"\s]*)?\)`

4. **扫描深度不足**
   - 修复: `src/core/code-scanner.ts` 第 290 行
   - 变更: `maxDepth` 从 10 增加到 20
   - 效果: 文档从 171 行增加到 18,719 行（单文件版本）

5. **不支持 Java interface 和 enum**
   - 修复: `extractClassInfo()` 方法
   - 新增: 正则支持 `public interface` 和 `public enum`
   - 效果: 完整识别所有 Java 类型

#### 📦 新增文件

- `src/core/code-scanner.ts` - 代码扫描核心引擎（1,200+ 行）
- `src/core/framework-detector.ts` - 框架和项目结构检测器
- `src/core/templates/impl-guide-generator.ts` - 实现指南生成器
- `GIT_SETUP.md` - Git 仓库设置详细指南
- `SHARING_OPTIONS.md` - 三种分享方案对比
- `README_ENHANCED.md` - 增强版功能说明
- `README_CN.md` - 完整中文文档（本文件）

#### 📊 测试验证

**测试项目**: starchain-astrolabe
- **类型**: Maven 多模块项目
- **模块数**: 3 个
- **总类数**: 278 个
- **目录深度**: 14 层

**测试结果**:
- ✅ 主文档: 122 行（清晰索引）
- ✅ 模块文档: 3 个（平均 6,000 行/模块）
- ✅ 识别类型: Controller(8), Service(28), DTO(46), 其他(196)
- ✅ AI 测试: 能基于文档生成精确实现方案，无幻觉
- ✅ 依赖分析: 完整调用链识别
- ✅ JPA 映射: 表名、字段、索引完整提取

---

## 相关链接

- **官方仓库**: https://github.com/Fission-AI/OpenSpec
- **增强版仓库**: https://github.com/Lemmon0409/openspec-improve
- **增强版分支**: https://github.com/Lemmon0409/openspec-improve/tree/feat/java-spring-boot-enhanced
- **官方文档**: https://github.com/Fission-AI/OpenSpec/blob/main/README.md
- **OpenSpec Discord**: https://discord.gg/YctCnvvshC

---

## 致谢

本项目基于 [OpenSpec](https://github.com/Fission-AI/OpenSpec) v0.16.0 开发，感谢 OpenSpec 团队的开源贡献。

特别感谢：
- [@0xTab](https://x.com/0xTab) - OpenSpec 创始人
- Fission AI 团队 - OpenSpec 核心开发团队
- 所有 OpenSpec 贡献者

---

## License

MIT License

Copyright (c) 2024 OpenSpec Contributors

基于 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 开发，继承 MIT License。

---

## 联系方式

- **GitHub Issues**: https://github.com/Lemmon0409/openspec-improve/issues
- **增强版作者**: Lemmon0409

---

<p align="center">
  <strong>用 AI 的方式开发，让代码更可靠 🚀</strong>
</p>
