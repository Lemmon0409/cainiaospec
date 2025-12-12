# OpenSpec 增强版 - 分享给同事的方案对比

## 🎯 三种方案对比

| 方案 | 难度 | 适用场景 | 优点 | 缺点 |
|------|------|----------|------|------|
| **方案1: npm发布** | ⭐⭐ | 正式团队使用 | 最专业，同事使用方便 | 需要npm账号，包名可能冲突 |
| **方案2: Git仓库** | ⭐ | 快速分享 | 最简单，无需npm | 同事需要手动构建 |
| **方案3: npm link** | ⭐⭐⭐ | 本地测试 | 适合开发调试 | 仅限本机，不适合分享 |

---

## 📦 方案1：发布到 npm（推荐）

### 优点
- ✅ 同事直接 `npm install -g` 即可使用
- ✅ 版本管理方便（可以随时更新）
- ✅ 最专业的分享方式

### 步骤

#### 1. 修改包名（避免与官方冲突）

编辑 `package.json`：
```json
{
  "name": "@your-company/openspec",  // 或 "openspec-enhanced"
  "version": "0.16.0-enhanced.1"
}
```

**包名选择**：
- `@your-company/openspec` - 需要在npm创建组织
- `@yourusername/openspec` - 使用你的npm用户名
- `openspec-enhanced` - 简单包名（推荐新手）

#### 2. 登录 npm
```bash
npm login
```

#### 3. 构建并发布
```bash
cd /Users/youren/OpenSpec
npm run build
npm publish
```

#### 4. 同事安装使用
```bash
# 全局安装
npm install -g @your-company/openspec

# 使用
cd /path/to/java-project
openspec init
```

### 后续更新流程
```bash
# 1. 修改 package.json 版本号
# 2. 构建
npm run build
# 3. 发布
npm publish

# 同事更新
npm update -g @your-company/openspec
```

---

## 🔗 方案2：Git 仓库分享（最简单）

### 优点
- ✅ 不需要 npm 账号
- ✅ 可以使用公司内部 GitLab/GitHub
- ✅ 版本控制清晰

### 步骤

#### 1. 创建 Git 仓库
```bash
cd /Users/youren/OpenSpec
git init
git add .
git commit -m "feat: OpenSpec 增强版 - 支持Java Spring Boot"
```

#### 2. 推送到远程仓库
```bash
# 公司 GitLab
git remote add origin https://gitlab.company.com/yourusername/openspec-enhanced.git
git push -u origin main

# 或 GitHub
git remote add origin https://github.com/yourusername/openspec-enhanced.git
git push -u origin main
```

#### 3. 同事克隆并安装
```bash
# 克隆仓库
git clone https://gitlab.company.com/yourusername/openspec-enhanced.git
cd openspec-enhanced

# 安装依赖
npm install

# 构建
npm run build

# 全局链接
npm link
```

#### 4. 同事使用
```bash
cd /path/to/java-project
openspec init
```

### 后续更新流程
```bash
# 你更新代码后
git add .
git commit -m "feat: 新增功能"
git push

# 同事更新
cd openspec-enhanced
git pull
npm run build
```

---

## 🔧 方案3：直接复制可执行文件（最快速）

### 优点
- ✅ 无需任何配置
- ✅ 适合快速体验

### 步骤

#### 1. 构建项目
```bash
cd /Users/youren/OpenSpec
npm run build
```

#### 2. 打包分发
```bash
# 创建分发包
tar -czf openspec-enhanced.tar.gz dist/ bin/ package.json

# 或使用 zip
zip -r openspec-enhanced.zip dist/ bin/ package.json
```

#### 3. 发给同事
通过邮件/聊天工具发送 `openspec-enhanced.tar.gz`

#### 4. 同事安装
```bash
# 解压
tar -xzf openspec-enhanced.tar.gz -C ~/openspec-enhanced
cd ~/openspec-enhanced

# 安装依赖
npm install --production

# 全局链接
npm link
```

#### 5. 同事使用
```bash
cd /path/to/java-project
openspec init
```

---

## 🚀 推荐方案选择

### 如果你的团队有内部 GitLab/GitHub
👉 **推荐方案2（Git仓库）**
- 最简单，不需要npm账号
- 版本管理清晰
- 适合公司内部使用

### 如果希望最专业的分享方式
👉 **推荐方案1（npm发布）**
- 同事使用最方便
- 适合长期维护
- 可以发布到公司私有npm

### 如果只是临时给1-2个同事用
👉 **推荐方案3（直接复制）**
- 最快速
- 无需配置

---

## 📝 使用文档（发给同事）

### 安装后如何使用

#### 1. 初始化项目
```bash
cd /path/to/your-java-project
openspec init
```

#### 2. 查看生成的文档
```
openspec/
├── project.md          # 主文档（索引）
├── modules/            # 模块详细文档
│   ├── module1.md
│   └── module2.md
└── ai-tasks.md         # AI 补全任务清单
```

#### 3. AI 补全流程（重要！）

将以下提示词复制给 AI：

```
请按以下步骤完善项目文档：

1. 阅读 openspec/project.md 主文档，理解项目结构
2. 依次阅读 openspec/modules/*.md 中每个模块的代码
3. 根据 openspec/ai-tasks.md 的指引，补充所有类、字段、方法的业务描述
4. 在各模块文档开头添加【业务场景】章节，说明该模块解决什么业务问题
5. 添加【核心业务流程】章节，说明关键业务逻辑的执行流程
6. 完成后删除 openspec/ai-tasks.md 文件
```

#### 4. 创建新需求

AI 补全文档后，提出需求即可：

```
我想实现一个功能：[描述你的需求]

请基于 openspec/project.md 和 openspec/modules/*.md 创建实现方案，
明确说明要修改哪些文件、调用哪些现有类和方法。
```

### 增强功能说明

相比官方版本，此增强版支持：

1. ✅ **默认启用完整文档**：`openspec init` 即可，无需额外参数
2. ✅ **Java Spring Boot 支持**：
   - Maven 多模块项目
   - JPA 实体映射
   - Spring 注解（`@RestController`, `@Service`, `@Autowired`）
   - Interface 和 Enum 支持
3. ✅ **模块化文档**：主文档作为索引，各模块独立文档
4. ✅ **AI 补全引导**：中文提示 + 业务场景占位符
5. ✅ **精确实现指导**：基于文档生成准确的调用链和文件路径

---

## ⚠️ 常见问题

### Q1: 修改包名后发布失败？
A: 检查包名是否已被占用：`npm search openspec-enhanced`

### Q2: npm link 后找不到命令？
A: 检查 npm 全局路径：`npm config get prefix`，确保在 PATH 中

### Q3: 同事安装后版本不对？
A: 清除缓存：`npm cache clean --force`，然后重新安装

### Q4: 能否贡献回官方仓库？
A: 可以！Fork 官方仓库并提交 PR：https://github.com/Fission-AI/OpenSpec

---

## 📞 技术支持

如有问题，请联系：[你的联系方式]

或查看官方文档：https://github.com/Fission-AI/OpenSpec
