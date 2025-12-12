# OpenSpec 增强版 - 发布指南

## 📋 发布前准备

### 1. 修改包名（已完成）
当前包名：`@your-company/openspec`
版本号：`0.16.0-enhanced.1`

**替换 `@your-company` 为你的实际组织名**

### 2. 登录 npm
```bash
npm login
# 输入你的 npm 账号信息
```

### 3. 构建项目
```bash
cd /Users/youren/OpenSpec
npm run build
```

### 4. 发布到 npm
```bash
npm publish
```

---

## 🚀 同事如何使用

### 安装
```bash
npm install -g @your-company/openspec
```

### 使用
```bash
cd /path/to/your-java-project
openspec init
```

### 生成的文档
- `openspec/project.md` - 项目主文档（索引）
- `openspec/modules/*.md` - 各模块详细文档
- `openspec/ai-tasks.md` - AI 补全任务清单

### AI 补全流程
按照初始化后的提示，让 AI 执行6步文档补全：
1. 阅读 `openspec/project.md` 主文档
2. 依次阅读各模块文档
3. 根据 `ai-tasks.md` 补充类、字段、方法描述
4. 添加【业务场景】章节
5. 添加【核心业务流程】章节
6. 完成后删除 `ai-tasks.md`

---

## 🔄 后续更新

### 更新版本号
```bash
# 修改 package.json 的 version
# 例如：0.16.0-enhanced.1 → 0.16.0-enhanced.2
```

### 重新发布
```bash
npm run build
npm publish
```

### 同事更新
```bash
npm update -g @your-company/openspec
```

---

## 📝 版本说明

### 相比官方版本 v0.16.0 的增强功能

1. **默认启用完整实现指南**
   - 无需 `--with-impl-guide` 参数
   - `openspec init` 即可生成完整文档

2. **支持 Java Spring Boot 项目**
   - 识别 Maven 多模块项目
   - 支持 `interface`、`enum`、`public class`
   - 提取 JPA 实体映射、Spring 注解
   - 识别依赖注入（`@Autowired`, `@Resource`）
   - 扫描深度增加到20层

3. **模块化文档结构**
   - 主文档作为索引（约100-200行）
   - 按模块拆分详细文档
   - 避免单文件过大（原18,719行）

4. **AI 补全工作流**
   - 中文化引导提示
   - 业务场景占位符
   - 核心业务流程占位符
   - AI 任务清单文件

5. **增强的 AGENTS.md**
   - 要求 AI 基于项目文档理解现有代码
   - task.md 中明确调用链和文件路径
   - 避免 AI 幻觉，不编造不存在的类

---

## ⚠️ 注意事项

### npm 组织名配置
如果使用 `@your-company/openspec` 格式：
- 需要在 npm 上创建组织 `your-company`
- 或者使用个人作用域：`@yourusername/openspec`

### 简化包名（不使用作用域）
如果不想使用组织名，可以改为：
```json
"name": "openspec-enhanced"
```

### 私有发布
如果只在公司内部使用，可以使用私有 npm registry：
- Verdaccio（自建）
- npm private packages（付费）
- GitHub Packages
