# CainiaoSpec - 菜鸟 Java Spring Boot 智能文档生成工具

```
 █████   ████   ██████  ██  ██  ██████   ████    ████
██      ██  ██    ██    ███ ██    ██    ██  ██  ██  ██
██      ██████    ██    ██ ███    ██    ██████  ██  ██
██      ██  ██    ██    ██  ██    ██    ██  ██  ██  ██
 █████  ██  ██  ██████  ██  ██  ██████  ██  ██   ████
```

> 让 AI 真正理解你的项目，写出符合规范的代码

---

## 📖 项目简介

**CainiaoSpec** 是一个专为 **Java Spring Boot** 项目设计的智能文档生成工具，通过**静态代码扫描 + AI 智能补充**，自动生成高质量的项目文档。

### 🎯 核心价值

- ✅ **AI 准确理解**项目结构和业务逻辑
- ✅ **严格遵循**提案规范实现新功能
- ✅ **避免幻觉**：基于真实代码而非猜测
- ✅ **提升效率**：减少 70% 的上下文理解时间
- ✅ **代码规范**：自动生成开发模板和规范

---

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd cainiaospec

# 安装依赖
npm install

# 构建
npm run build

# 全局链接
npm link
```

### 初始化项目

```bash
cd your-java-project

# 初始化并扫描代码
cainiaospec init --scan-code

# 指定 AI 工具
cainiaospec init --scan-code --tools qoder
```

### 工作流程

```
1. 初始化 (cainiaospec init --scan-code)
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

## 📂 生成的文档结构

```
your-project/
├── openspec/
│   ├── project.md              # 项目总览
│   ├── AGENTS.md               # AI 助手配置
│   └── modules/
│       ├── module-a/
│       │   ├── README.md       # 模块概览、业务流程、规则
│       │   ├── controllers.md  # Controller 和 API 文档
│       │   ├── services.md     # Service 业务逻辑
│       │   └── models.md       # Entity 和 DTO 字段说明
│       └── module-b/
│           └── ...
└── QUICK_START.md              # 快速开始指南
```

---

## 🌟 核心功能

### 1. 智能代码扫描

自动扫描 Java 项目，提取：
- **Controller**：API 路由、请求参数、响应类型
- **Service**：业务方法、依赖关系
- **Entity**：数据库映射、字段注解
- **DTO**：所有字段及 JavaDoc 注释

### 2. 模块化文档

每个模块自动拆分为多个文档，避免单文件过大导致 AI 迷失：

| 文档 | 内容 |
|------|------|
| README.md | 业务场景、核心流程、业务规则、状态流转 |
| controllers.md | Controller 类和 API 端点详情 |
| services.md | Service 类和核心方法说明 |
| models.md | Entity 和 DTO 字段说明 |

### 3. 开发指南自动生成

每个模块 README 自动包含开发指南：

```markdown
## 🛠️ 开发指南

### 技术栈
| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Spring Boot 2.x | [版本号] |
| ORM | MyBatis-Plus | 使用 LambdaQueryWrapper |
| 缓存 | CacheAPI (Tair) | getOrSetCache / deleteFromCache |
| 返回值 | Result<T> | Result.success() / Result.fail() |

### Controller 模板
[完整代码示例]

### Service 模板
[含缓存、校验、异常的完整代码示例]

### 常用工具类
- Result.success() / Result.fail()
- FmsBaseDataSysException("CODE", "msg")
- entity.markNew(operator) / entity.markUpdate(operator)
- cacheAPI.getOrSetCache() / deleteFromCache()

### DTO 转换规范
- DO → Entity: Entity.do2Entity(do)
- Entity → DO: entity.entity2DO()
```

### 4. 分步补充提示词

避免 AI 一次处理过多内容导致遗漏：

```
方案 A：分步补充（推荐，适合大模块）

█ 步骤 1: 补充 README.md
  → 业务场景、核心流程、业务规则、状态流转、FAQ

█ 步骤 2: 补充 controllers.md
  → 描述、业务功能、服务场景、API端点表

█ 步骤 3: 补充 services.md
  → 业务描述、执行步骤

█ 步骤 4: 补充 models.md
  → 业务含义、示例值、单位/取值
```

---

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `cainiaospec init` | 初始化项目 |
| `cainiaospec init --scan-code` | 初始化并扫描代码 |
| `cainiaospec init --tools qoder` | 指定 AI 工具 |
| `cainiaospec list` | 列出所有活动变更 |
| `cainiaospec show [change-id]` | 查看变更详情 |
| `cainiaospec archive [change-id]` | 归档已完成的变更 |
| `cainiaospec update` | 更新共享配置 |

---

## 🔧 技术栈支持

### 项目类型
- ✅ Maven 单模块项目
- ✅ Maven 多模块项目
- ✅ Gradle 项目

### 框架识别
- ✅ Spring Boot 2.x / 3.x
- ✅ MyBatis / MyBatis-Plus
- ✅ Spring Data JPA
- ✅ Spring Security

### 代码识别
- ✅ Controller (@RestController, @Controller)
- ✅ Service (@Service, @Component)
- ✅ Repository (@Repository, @Mapper)
- ✅ Entity (@Entity, @Table)
- ✅ DTO (所有字段 + JavaDoc)
- ✅ Enum (枚举类型)
- ✅ Interface (接口定义)

---

## 💡 使用技巧

### 1. 让 AI 补充文档

初始化后，复制提示词给 AI：

```
请打开 openspec/modules/[模块名]/README.md
补充以下章节：
1. 🎯 业务场景 - 核心价值、服务对象、主要场景
2. 🔄 核心业务流程 - 用 Mermaid 绘制 1-2 个流程图
3. 📜 核心业务规则 - 判断条件、处理逻辑
4. 🔀 状态流转 - 用 Mermaid 绘制状态图
5. ❓ 常见问题 FAQ - 添加 3-5 个问题
完成后告诉我："✅ README 已补充"
```

### 2. 实现新功能

```
我想实现 [具体功能描述]。
请基于 openspec/project.md 和模块文档理解项目结构，
创建详细的 CainiaoSpec 变更提案，
说明需要修改哪些文件、调用哪些类、具体实现逻辑。
```

### 3. 归档已完成的变更

```bash
cainiaospec archive [change-id]
```

归档时会自动：
- 生成实施总结
- 更新 project.md（新增类）
- 更新模块文档

---

## 📁 配置文件

### .cainiaospec.json（可选）

```json
{
  "excludePatterns": [
    "**/target/**",
    "**/.idea/**",
    "**/test/**"
  ],
  "scanCode": true,
  "frameworks": ["spring-boot", "mybatis-plus"]
}
```

---

## ❓ 常见问题

### Q1: 扫描很慢怎么办？

确保排除了 `target/`、`.idea/`、`node_modules/` 等目录：

```bash
cainiaospec init --scan-code
```

默认已自动排除这些目录。

### Q2: 某些字段没有扫描到？

检查字段是否有正确的 JavaDoc 注释：

```java
/**
 * 订单编号
 */
private String orderNo;
```

### Q3: 模块文档太大，AI 迷失了？

使用**分步补充**方案（方案 A），一次只处理一个小任务。

### Q4: 如何更新已初始化的项目？

```bash
cainiaospec update
```

---

## 🔄 版本历史

### v1.0.0
- 初始版本
- 支持 Java Spring Boot 项目扫描
- 模块化文档拆分
- 开发指南自动生成
- 分步补充提示词

---

## 📮 联系方式

如有问题或建议，请联系开发团队。

---

<p align="center">
  <sub>CainiaoSpec - 让 AI 成为你的最佳编程搭档</sub>
</p>
