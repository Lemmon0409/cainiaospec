# OpenSpec 快速开始指南

## 📚 项目已初始化？下次使用这个指南

如果你已经初始化过 OpenSpec，下次打开项目时按以下步骤操作：

---

## 🚀 快速工作流

### 场景 1：完善项目文档（首次初始化后）

如果这是首次初始化，文档中的描述都是空的，需要先完善：

```bash
# 1. 查看生成的文档
cat openspec/project.md
cat openspec/modules/*.md
cat openspec/ai-tasks.md

# 2. 复制初始化时显示的"开始复制"到"复制结束"之间的内容
# 3. 粘贴给 AI 助手，让 AI 按照步骤完善文档
```

AI 会：
- 补充所有 Controller 类的业务功能说明
- 补充所有 Service 类的业务逻辑说明
- 补充重要 DTO 的关键字段描述
- 补充核心模块的业务场景和流程

---

### 场景 2：实现新功能

文档完善后，开始开发新功能：

```bash
# 告诉 AI：
"我想实现 [具体功能描述]。
请基于 openspec/project.md 和模块文档理解项目结构，
创建详细的 OpenSpec 变更提案，
说明需要修改哪些文件、调用哪些类、具体实现逻辑"
```

AI 会创建：
```
openspec/changes/[change-id]/
  ├── proposal.md   # 提案：为什么做、做什么、影响范围
  ├── tasks.md      # 任务清单：如何实现（包含完整的 API 规范、调用链）
  └── design.md     # （可选）技术设计
```

---

### 场景 3：实施提案

提案创建后，开始实施：

```bash
# 告诉 AI：
"请按照 openspec/changes/[change-id]/tasks.md 实施这个提案"
```

AI 会：
1. 阅读 `proposal.md` 了解规范
2. 查看 `tasks.md` 中的每个任务
3. 每个任务都会引用 `proposal.md` 的具体章节
4. 严格按照提案中的 API 规范、调用链、业务逻辑实现
5. 不允许偏离提案（除非先更新提案）

---

### 场景 4：查看项目状态

```bash
# 查看所有活动中的变更
openspec list

# 查看所有规范
openspec list --specs

# 查看特定变更的详情
openspec show [change-id]

# 验证变更
openspec validate [change-id] --strict
```

---

### 场景 5：归档已完成的变更

功能开发完成并部署后：

```bash
# 归档变更
openspec archive [change-id]

# 或者非交互式归档
openspec archive [change-id] --yes
```

---

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `openspec list` | 查看所有活动中的变更 |
| `openspec list --specs` | 查看所有规范 |
| `openspec show [item]` | 查看变更或规范详情 |
| `openspec validate [item]` | 验证变更或规范 |
| `openspec archive [change-id]` | 归档已完成的变更 |

---

## 🔄 典型工作流程

```
1. 完善文档（首次）
   └─ 复制提示词 → AI 补充描述 → 删除 ai-tasks.md

2. 提出需求
   └─ "我想实现..." → AI 创建 proposal.md + tasks.md

3. 审查提案
   └─ 检查 API 规范、调用链、业务逻辑是否正确

4. 实施提案
   └─ "按照 tasks.md 实施" → AI 严格遵循规范实现

5. 验证
   └─ openspec validate [change-id] --strict

6. 部署后归档
   └─ openspec archive [change-id]
```

---

## 💡 最佳实践

### ✅ DO（推荐做法）

1. **总是先完善文档**
   - 让 AI 补充关键类的描述
   - Controller、Service、DTO 必须有描述

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
   - 更新 proposal.md 和 tasks.md
   - 重新审查后再继续

### ❌ DON'T（避免做法）

1. **不要跳过文档完善**
   - 没有描述的文档，AI 无法理解业务逻辑

2. **不要只创建 proposal.md**
   - tasks.md 是必需的，包含实施细节

3. **不要偏离提案实施**
   - "觉得这样更好"也不行
   - 必须先更新提案

4. **不要忘记归档**
   - 已部署的变更要归档
   - 否则 changes/ 目录会越来越乱

---

## 🆘 常见问题

### Q1: 重新打开项目后，如何继续之前的工作？

```bash
# 1. 查看状态
openspec list

# 2. 如果有未完成的变更
openspec show [change-id]

# 3. 继续实施
# 告诉 AI："请继续实施 openspec/changes/[change-id] 的提案"
```

### Q2: 如何知道文档是否已经完善？

```bash
# 检查 ai-tasks.md 是否存在
ls openspec/ai-tasks.md

# 如果存在，说明还没完善
# 如果不存在，说明已经完善
```

### Q3: 提案创建后发现规范不对怎么办？

```bash
# 直接修改文件：
# - openspec/changes/[change-id]/proposal.md
# - openspec/changes/[change-id]/tasks.md

# 然后告诉 AI："提案已更新，请重新实施"
```

### Q4: 如何查看项目的完整文档？

```bash
# 主文档
cat openspec/project.md

# 模块文档
cat openspec/modules/*.md

# 工作流指南
cat openspec/AGENTS.md
```

---

## 📚 更多信息

- [完整的 AGENTS.md](openspec/AGENTS.md) - AI 工作流指南
- [提案规范要求](../PROPOSAL_REQUIREMENTS.md) - 提案必须包含的内容
- [强制执行清单](../ENFORCEMENT_CHECKLIST.md) - 实施时的强制规则

---

*提示：如果忘记了工作流程，随时可以查看这个文件！*
