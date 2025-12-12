# Git 仓库设置指南

## ✅ 已完成的步骤

1. ✅ 创建新分支 `feat/java-spring-boot-enhanced`
2. ✅ 添加所有改动文件
3. ✅ 提交代码（commit message 已写好）

---

## 📋 接下来的步骤

### 方案A：推送到你自己的 GitHub 仓库（推荐）

#### 1. 在 GitHub 上创建新仓库

访问：https://github.com/new

- **Repository name**: `openspec-enhanced` 或 `OpenSpec`
- **Description**: `OpenSpec 增强版 - 支持 Java Spring Boot 和模块化文档`
- **Visibility**: Public（公开）或 Private（私有）
- **不要勾选** "Initialize this repository with a README"

#### 2. 添加你的远程仓库

```bash
cd /Users/youren/OpenSpec

# 将官方仓库改名为 upstream
git remote rename origin upstream

# 添加你自己的仓库为 origin
git remote add origin https://github.com/你的用户名/openspec-enhanced.git

# 验证
git remote -v
```

应该看到：
```
origin    https://github.com/你的用户名/openspec-enhanced.git (fetch)
origin    https://github.com/你的用户名/openspec-enhanced.git (push)
upstream  https://github.com/Fission-AI/OpenSpec.git (fetch)
upstream  https://github.com/Fission-AI/OpenSpec.git (push)
```

#### 3. 推送到你的仓库

```bash
# 推送增强版分支
git push -u origin feat/java-spring-boot-enhanced

# 也推送 main 分支
git checkout main
git push -u origin main
```

#### 4. 分享给同事

同事克隆你的仓库：
```bash
git clone https://github.com/你的用户名/openspec-enhanced.git
cd openspec-enhanced

# 切换到增强版分支
git checkout feat/java-spring-boot-enhanced

# 安装依赖
npm install

# 构建
npm run build

# 全局链接
npm link

# 测试
cd /path/to/java-project
openspec init
```

---

### 方案B：推送到公司内部 GitLab

#### 1. 在 GitLab 创建新项目

访问你们公司的 GitLab，创建新项目：
- **Project name**: `openspec-enhanced`
- **Visibility**: Internal（内部）

#### 2. 添加公司 GitLab 远程仓库

```bash
cd /Users/youren/OpenSpec

# 将官方仓库改名为 upstream
git remote rename origin upstream

# 添加公司 GitLab 为 origin
git remote add origin https://gitlab.company.com/你的用户名/openspec-enhanced.git

# 验证
git remote -v
```

#### 3. 推送代码

```bash
# 推送增强版分支
git push -u origin feat/java-spring-boot-enhanced

# 推送 main 分支
git push -u origin main
```

#### 4. 分享给同事

同事克隆：
```bash
git clone https://gitlab.company.com/你的用户名/openspec-enhanced.git
cd openspec-enhanced
git checkout feat/java-spring-boot-enhanced
npm install && npm run build && npm link
```

---

### 方案C：合并到 main 分支（简化版）

如果不想维护多个分支，可以直接合并到 main：

```bash
cd /Users/youren/OpenSpec

# 切换到 main
git checkout main

# 合并增强版分支
git merge feat/java-spring-boot-enhanced

# 设置远程仓库（按方案A或B操作）
# ...

# 推送 main
git push -u origin main
```

---

## 🎯 推荐操作流程

我推荐你执行以下步骤：

### Step 1: 在 GitHub 创建仓库
访问 https://github.com/new 创建新仓库

### Step 2: 执行以下命令
```bash
cd /Users/youren/OpenSpec

# 重命名远程仓库
git remote rename origin upstream

# 添加你的仓库（替换下面的URL）
git remote add origin https://github.com/你的用户名/openspec-enhanced.git

# 推送增强版分支
git push -u origin feat/java-spring-boot-enhanced

# 推送 main 分支
git checkout main
git push -u origin main
```

### Step 3: 发给同事
将仓库地址发给同事：
```
https://github.com/你的用户名/openspec-enhanced
```

### Step 4: 同事安装使用
```bash
git clone https://github.com/你的用户名/openspec-enhanced.git
cd openspec-enhanced
git checkout feat/java-spring-boot-enhanced
npm install && npm run build && npm link
cd /path/to/java-project
openspec init
```

---

## 📝 给同事的安装文档

将以下内容发给同事：

---

# OpenSpec 增强版 - 安装使用指南

## 📦 安装

```bash
# 1. 克隆仓库
git clone https://github.com/你的用户名/openspec-enhanced.git
cd openspec-enhanced

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

## 🚀 使用

### 初始化 Java 项目
```bash
cd /path/to/your-java-project
openspec init
```

### 生成的文档结构
```
openspec/
├── project.md          # 主文档（索引）
├── modules/            # 模块详细文档
│   ├── module1.md
│   └── module2.md
└── ai-tasks.md         # AI 补全任务清单
```

### AI 补全流程

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

### 创建新需求

AI 补全文档后：

```
我想实现：[描述需求]

请基于 openspec/project.md 和 openspec/modules/*.md 生成实现方案，
明确说明要修改的文件、调用的现有类和方法、完整的调用链。
```

## ✨ 增强功能

相比官方版本 v0.16.0：

1. ✅ 默认启用完整实现指南（无需 `--with-impl-guide`）
2. ✅ 支持 Java Spring Boot 项目
   - Maven/Gradle 多模块识别
   - JPA 实体映射、Spring 注解
   - Interface、Enum 支持
   - 依赖注入分析
3. ✅ 模块化文档（主文档 + 各模块独立）
4. ✅ AI 补全工作流（中文引导 + 业务场景占位符）
5. ✅ 精确实现指导（基于文档避免 AI 幻觉）

## 🔄 更新

获取最新版本：
```bash
cd openspec-enhanced
git pull
npm run build
```

## ❓ 问题反馈

有问题请联系：[你的联系方式]

---

## ⚠️ 注意事项

### 如果 npm link 后找不到命令

检查 npm 全局路径：
```bash
npm config get prefix
```

确保该路径在你的 PATH 中：
```bash
echo $PATH | grep $(npm config get prefix)
```

如果不在，添加到 `~/.zshrc` 或 `~/.bashrc`：
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

### 如果构建失败

检查 Node.js 版本（需要 >= 20.19.0）：
```bash
node --version
```

更新 Node.js：
```bash
# 使用 nvm
nvm install 20
nvm use 20

# 或使用 Homebrew
brew install node@20
```

---

## 📊 测试验证

已在真实项目中验证：
- 项目：starchain-astrolabe（Maven 多模块项目）
- 扫描：278 个类
- 文档：主文档 122 行 + 3 个模块文档
- AI 测试：能基于文档生成精确实现方案

---

**祝使用愉快！🎉**
