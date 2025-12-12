# OpenSpec 提案强制执行检查清单

## 🎯 问题背景

**问题**: 智能体在按照 `tasks.md` 执行任务时，可能没有遵守 `proposal.md` 中的规则和实现逻辑。

**原因**:
1. AI 可能只看 `tasks.md`，没有交叉引用 `proposal.md`
2. AI 可能凭记忆或"合理推测"实现，而不是严格按照规范
3. `tasks.md` 中缺少对 `proposal.md` 的明确引用

---

## ✅ 解决方案

### 1️⃣ **tasks.md 强制引用机制**

每个 `tasks.md` 现在**必须**以这个强制性章节开头：

```markdown
# Implementation Tasks

## ⚠️  MANDATORY: Read Before Starting

**Before implementing ANY task below, you MUST:**

1. **Read proposal.md completely** - Understand the full context and requirements
2. **Review all API specifications in proposal.md** - Note exact endpoints, request/response formats
3. **Study the call chain diagrams in proposal.md** - Understand data flow
4. **Review implementation logic in proposal.md** - Follow the exact steps defined

**CRITICAL RULES:**
- ✅ Use EXACT API paths from proposal.md (do not modify)
- ✅ Use EXACT request/response structures from proposal.md (do not add/remove fields)
- ✅ Follow EXACT call chain from proposal.md (do not skip steps)
- ✅ Implement EXACT business logic from proposal.md (do not simplify)
- ❌ DO NOT deviate from proposal.md without updating it first
- ❌ DO NOT "improve" or "optimize" without proposal approval

**Cross-Reference Checklist:**
For each task below, verify against proposal.md:
- [ ] API endpoint matches proposal (method + path)
- [ ] Request body matches proposal (all fields, types, validation)
- [ ] Response body matches proposal (all fields, status codes)
- [ ] Call chain matches proposal (same order, same methods)
- [ ] Business logic matches proposal (same steps, same rules)
```

---

### 2️⃣ **每个任务的 Reference 字段**

每个任务现在都有 `**Reference**` 字段，指向 `proposal.md` 的具体章节：

#### API/Controller 任务示例：
```markdown
- [ ] 2.1 Create user registration endpoint
  - **Reference**: See proposal.md "API Specification > POST /api/users/register"
  - **MUST MATCH**: Use EXACT endpoint, request, response from proposal
  - File: `src/controllers/user.controller.ts`
  - Class: `UserController`
  - Method: `register(dto: CreateUserDto): Promise<UserResponse>`
  - API: `POST /api/users/register`
```

#### Service 任务示例：
```markdown
- [ ] 3.1 Implement user creation logic
  - **Reference**: See proposal.md "Implementation Logic" and "Call Chain" sections
  - **MUST MATCH**: Follow EXACT steps and method calls from proposal
  - File: `src/services/user.service.ts`
  - Class: `UserService`
  - Method: `createUser(dto: CreateUserDto): Promise<User>`
```

---

### 3️⃣ **实施前强制检查清单**

在 **Stage 2: Implementing Changes** 部分，添加了强制性预检查：

```markdown
**⚠️  BEFORE WRITING ANY CODE: Complete Pre-Implementation Checklist**

For EVERY task, you MUST:
1. ✅ Open and read proposal.md completely
2. ✅ Locate the relevant section in proposal.md (API Specification, Implementation Logic, Call Chain)
3. ✅ Copy the exact specifications from proposal.md:
   - API endpoints (method + path)
   - Request/response structures (all fields with types)
   - Business logic steps (numbered list)
   - Call chain (method call order)
4. ✅ Verify tasks.md matches proposal.md
5. ✅ Only then start coding

**Implementation Workflow:**
1. **Read proposal.md** - Understand what's being built
2. **Read design.md** (if exists) - Review technical decisions
3. **Read tasks.md** - Get implementation checklist
4. **For each task:**
   a. **Cross-reference with proposal.md** - Find the exact specification
   b. **Copy specs from proposal** - Don't rely on memory or assumptions
   c. **Implement exactly as written** - No deviations
   d. **Verify against proposal** - Check every detail matches
5. **Confirm completion** - Ensure every item in tasks.md is finished
6. **Update checklist** - Set completed tasks to `- [x]`
```

---

### 4️⃣ **任务模板中的强制引用**

所有任务模板现在都包含：

#### API/Controller 任务模板：
```markdown
**CRITICAL for API/Controller Tasks:**

Every API task MUST include:
1. **Complete Request Specification** (from proposal.md)
2. **Complete Response Specification** (from proposal.md)
3. **Implementation Code Template** (following proposal.md)
4. **Call Chain Specification** (exact copy from proposal.md)
```

#### Service 任务模板：
```markdown
**CRITICAL for Service Tasks:**

**FIRST: Review proposal.md for this service's specification**

Every Service task MUST include:
1. **Complete Method Signature** (from proposal.md)
2. **Input Parameter Specification** (from proposal.md)
3. **Return Value Specification** (from proposal.md)
4. **Complete Implementation Logic** (step-by-step from proposal.md)
5. **Dependencies and Call Chain** (exact copy from proposal.md)
```

---

## 📋 强制执行机制

### 实施时的强制规则

**RULE 1: 严格遵循提案**
- ✅ **必须**完全按照 `proposal.md` 和 `tasks.md` 中的规范实现
- ✅ **必须**使用提案中定义的确切 API 端点、请求/响应格式
- ✅ **必须**遵循 `tasks.md` 中指定的确切调用链
- ❌ **禁止**在未更新提案的情况下修改方法签名、参数类型或返回类型
- ❌ **禁止**在未更新提案的情况下添加新依赖或更改架构

**RULE 2: 输入/输出合规性**
- ✅ **必须**实现提案中定义的确切接口/DTO 结构
- ✅ **必须**按提案中的规定验证所有输入
- ✅ **必须**以响应体中指定的确切格式返回数据
- ✅ **必须**使用提案中定义的确切状态码处理所有错误

**RULE 3: 调用链合规性**
- ✅ **必须**按"Call Chain"部分指定的确切顺序调用方法
- ✅ **必须**使用"Uses:"部分列出的确切服务/仓库方法
- ❌ **禁止**跳过中间层（例如，Controller 必须调用 Service，不能直接调用 Repository）
- ❌ **禁止**引入提案中未列出的新方法调用

**RULE 4: 验证后再完成**
- ✅ **必须**使用指定的"Verification"方法验证每个任务
- ✅ **必须**使用提案中的确切请求/响应示例进行测试
- ❌ **禁止**在验证通过之前将任务标记为完成

---

## 🔄 偏差处理协议

如果在实施过程中发现提案不正确或不完整：

1. **立即停止**实施
2. **记录**问题（什么问题、为什么行不通）
3. **更新** `proposal.md` 和 `tasks.md` 为正确的规范
4. **请求**重新批准（如果更改重大）
5. **仅在提案更新后**恢复实施

### ❌ 禁止做法：
- 实施"合理的做法"，如果它与提案不同
- 在未更新提案的情况下进行"小调整"
- 假设"他们可能的意思是 X"，而提案说的是 Y

---

## ✅ 验证清单

### 提案创建时验证：
- [ ] `proposal.md` 包含完整的 API 规范
- [ ] `proposal.md` 包含详细的实现逻辑步骤
- [ ] `proposal.md` 包含完整的调用链图
- [ ] `tasks.md` 以强制性"MANDATORY"章节开头
- [ ] 每个任务都有 `**Reference**` 字段指向 `proposal.md`
- [ ] 每个任务都有 `**MUST MATCH**` 警告

### 实施时验证：
- [ ] 已完整阅读 `proposal.md`
- [ ] 已定位到相关的 API/实现规范章节
- [ ] 已复制提案中的确切规范（不依赖记忆）
- [ ] API 端点完全匹配提案（method + path）
- [ ] 请求体完全匹配提案（所有字段 + 类型）
- [ ] 响应体完全匹配提案（所有字段 + 状态码）
- [ ] 调用链完全匹配提案（顺序 + 方法名）
- [ ] 业务逻辑完全匹配提案（所有步骤）

### 完成时验证：
- [ ] 使用提案中的示例进行了测试
- [ ] 所有验证步骤都已通过
- [ ] 没有偏离提案的实现
- [ ] `tasks.md` 中的 checklist 已更新

---

## 📊 效果预期

实施这些改进后，将实现：

1. ✅ **零歧义**: AI 必须查看 `proposal.md`，不能凭猜测
2. ✅ **零偏差**: 每个任务都明确引用了提案中的规范
3. ✅ **可追溯**: 从任务可以直接定位到提案的具体章节
4. ✅ **强制执行**: 多层检查机制确保合规性
5. ✅ **一致性**: 实施结果与提案完全一致

---

## 🚀 使用示例

### 创建提案时：

```bash
# AI 会自动在 tasks.md 中生成：
## ⚠️  MANDATORY: Read Before Starting
...

- [ ] 2.1 Create user registration endpoint
  - **Reference**: See proposal.md "API Specification > POST /api/users/register"
  - **MUST MATCH**: Use EXACT endpoint, request, response from proposal
  ...
```

### 实施时：

```markdown
AI 必须执行的步骤：
1. ✅ 打开 proposal.md
2. ✅ 搜索 "API Specification > POST /api/users/register"
3. ✅ 复制确切的 API 规范
4. ✅ 按照规范实现，不做任何修改
5. ✅ 验证实现完全匹配规范
```

---

## 📚 相关文档

- [AGENTS.md](openspec/AGENTS.md) - 完整的 AI 指令（已更新）
- [PROPOSAL_REQUIREMENTS.md](PROPOSAL_REQUIREMENTS.md) - 提案规范要求
- [agents-template.ts](src/core/templates/agents-template.ts) - 模板源代码

---

*最后更新：2024-12-12*
*版本：2.0 - 添加强制引用机制*
