# OpenSpec 增强版 🚀

基于官方 [OpenSpec v0.16.0](https://github.com/Fission-AI/OpenSpec) 的增强版本，专为 Java Spring Boot 项目优化。

## ✨ 核心增强功能

### 1. 默认启用完整实现指南
```bash
# 无需额外参数，直接生成完整文档
openspec init
```

### 2. Java Spring Boot 全面支持
- ✅ Maven/Gradle 多模块项目识别
- ✅ Interface、Enum、Public Class 支持
- ✅ JPA 实体映射提取 (`@Entity`, `@Table`, `@Column`)
- ✅ Spring 注解识别 (`@RestController`, `@Service`, `@Autowired`)
- ✅ 依赖注入分析和调用链推断
- ✅ 扫描深度增加到 20 层

### 3. 模块化文档结构
解决大文档 AI 难以阅读的问题：
- 主文档作为索引（100-200 行）
- 按模块拆分详细文档
- 避免单文件过大（18,719 行 → 多个 2,000-6,000 行文件）

### 4. AI 补全工作流
- 中文化初始化提示（6 步引导）
- 业务场景和核心流程占位符
- AI 任务清单自动生成
- AGENTS.md 增强：要求基于文档理解现有代码

### 5. 精确实现指导
- 基于文档生成准确的调用链
- 明确文件路径和现有类引用
- 避免 AI 幻觉，不编造不存在的代码

---

## 📦 快速开始

### 给贡献者（你）

#### 已完成步骤 ✅
```bash
✅ 1. 创建分支 feat/java-spring-boot-enhanced
✅ 2. 提交所有改动
```

#### 接下来的步骤

**方式1：使用自动化脚本（推荐）**
```bash
cd /Users/youren/OpenSpec

# 运行一键推送脚本
./push-to-remote.sh

# 按提示输入你的 GitHub/GitLab 仓库地址
# 例如: https://github.com/yourusername/openspec-enhanced.git
```

**方式2：手动操作**

1. 在 GitHub/GitLab 创建新仓库 `openspec-enhanced`
2. 执行以下命令：
```bash
cd /Users/youren/OpenSpec

# 重命名官方仓库为 upstream
git remote rename origin upstream

# 添加你的仓库
git remote add origin https://github.com/yourusername/openspec-enhanced.git

# 推送增强版分支
git push -u origin feat/java-spring-boot-enhanced

# 推送 main 分支
git checkout main
git push -u origin main
```

---

### 给同事

#### 克隆并安装
```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/openspec-enhanced.git
cd openspec-enhanced

# 2. 切换到增强版分支
git checkout feat/java-spring-boot-enhanced

# 3. 安装依赖
npm install

# 4. 构建项目
npm run build

# 5. 全局链接
npm link

# 6. 验证
openspec --version
```

#### 使用
```bash
# 初始化 Java 项目
cd /path/to/your-java-project
openspec init

# 生成的文档结构
# openspec/
# ├── project.md          # 主文档（索引）
# ├── modules/            # 模块详细文档
# │   ├── module1.md
# │   └── module2.md
# └── ai-tasks.md         # AI 补全任务清单
```

#### AI 补全流程

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

AI 补全文档后：

```
我想实现：[描述需求]

请基于 openspec/project.md 和 openspec/modules/*.md 生成实现方案，
明确说明要修改的文件、调用的现有类和方法、完整的调用链。
```

---

## 📊 测试验证

已在真实项目中验证通过：

- **测试项目**: starchain-astrolabe（Maven 多模块项目）
- **扫描结果**: 278 个类
- **生成文档**: 
  - 主文档 122 行
  - 3 个模块文档（平均 2,000-6,000 行）
  - AI 任务清单 212 行
- **AI 测试**: 能基于文档生成精确实现方案，无幻觉

---

## 📚 相关文档

- [GIT_SETUP.md](./GIT_SETUP.md) - Git 仓库设置详细指南
- [SHARING_OPTIONS.md](./SHARING_OPTIONS.md) - 三种分享方案对比
- [PUBLISH_GUIDE.md](./PUBLISH_GUIDE.md) - npm 发布指南

---

## 🔄 更新

### 贡献者更新代码
```bash
cd /Users/youren/OpenSpec
git add .
git commit -m "feat: 新功能描述"
git push origin feat/java-spring-boot-enhanced
```

### 同事获取最新版本
```bash
cd openspec-enhanced
git pull
npm run build
```

---

## 📝 版本历史

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

**Bug 修复**:
- ✅ 修复 JavaDoc 类描述显示 `@author` 的问题
- ✅ 修复所有字段显示相同描述的问题
- ✅ 修复 `@Post()` 等无参数装饰器未识别的问题
- ✅ 增加扫描深度从 10 层到 20 层

**详细改动**: 查看 commit `6085427`

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 继承自官方 [OpenSpec](https://github.com/Fission-AI/OpenSpec)

---

## 🔗 相关链接

- 官方仓库: https://github.com/Fission-AI/OpenSpec
- 增强版仓库: [待填写]

---

**祝使用愉快！🎉**
