# OpenSpec 提案强制要求规范

## 📋 概述

本文档定义了 OpenSpec 提案（proposal.md 和 tasks.md）中必须包含的强制性内容，确保 AI 智能体在实施时有明确、完整的规范可遵循。

---

## 🎯 核心原则

### 1. 明确性原则
- 所有 API 必须明确定义请求和响应格式
- 所有方法必须明确定义输入参数和返回值
- 所有调用链必须明确列出每一步

### 2. 完整性原则
- 请求体和响应体必须包含所有字段
- 错误处理必须包含所有可能的错误码
- 实现逻辑必须包含所有步骤

### 3. 严格执行原则
- 实施时必须严格按照提案执行
- 不允许修改 API 路径、参数、返回值
- 不允许跳过调用链中的任何步骤

---

## 📝 Proposal.md 必须包含的内容

### ✅ 基础信息（原有）
```markdown
# Change: [Brief description]

## Why
[1-2 sentences]

## What Changes
- [Bullet list]

## Impact
- Affected specs: [list]
- Affected code: [key files]
```

### ✅ API 规范（新增 - 强制）

**对于任何新增或修改的 API，必须包含：**

#### 1. HTTP 规范
```markdown
### API Specification

#### POST /api/users/register

**Request:**
- Method: POST
- Path: /api/users/register
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer {token} (if required)
```

#### 2. 请求体结构
```typescript
interface CreateUserDto {
  email: string;     // Required, valid email format
  password: string;  // Required, min 8 chars, must contain number
  name: string;      // Required, max 50 chars
}
```

**要求：**
- ✅ 必须列出所有字段
- ✅ 必须注明类型
- ✅ 必须注明必填/可选
- ✅ 必须注明验证规则

#### 3. 响应体结构
```markdown
**Response:**

Success (201 Created):
```typescript
interface UserResponse {
  id: string;        // UUID
  email: string;
  name: string;
  createdAt: Date;
}
```

Error Responses:
- 400 Bad Request: `{ error: "Invalid email format" }`
- 401 Unauthorized: `{ error: "Token expired" }`
- 409 Conflict: `{ error: "Email already exists" }`
- 500 Server Error: `{ error: "Internal server error" }`
```

**要求：**
- ✅ 必须定义成功响应（2xx）
- ✅ 必须定义所有可能的错误响应（4xx, 5xx）
- ✅ 必须包含错误消息示例

#### 4. 实现逻辑
```markdown
**Implementation Logic:**
1. Validate DTO using class-validator
2. Check email uniqueness in UserRepository
3. Hash password using PasswordService.hash()
4. Create User entity
5. Save to database via UserRepository.save()
6. Send welcome email asynchronously
7. Return UserResponse
```

**要求：**
- ✅ 必须列出所有步骤
- ✅ 必须说明调用的类和方法
- ✅ 必须说明数据流转

#### 5. 调用链
```markdown
**Call Chain:**
```
UserController.register(dto)
  → UserService.createUser(dto)
    → UserRepository.findByEmail(email)    [validation]
    → PasswordService.hash(password)       [security]
    → UserRepository.save(user)            [persistence]
    → EmailService.sendWelcome(email)      [notification]
```
```

**要求：**
- ✅ 必须列出完整的调用链
- ✅ 必须注明每一步的作用
- ✅ 必须按照实际调用顺序

---

## 📋 Tasks.md 必须包含的内容

### ✅ API/Controller 任务（新增强制要求）

```markdown
- [ ] 2.1 Create user registration endpoint
  - File: `src/controllers/user.controller.ts`
  - Class: `UserController`
  - Method: `register(dto: CreateUserDto): Promise<UserResponse>`
  - API: `POST /api/users/register`
  
  - Request Body: 
    ```typescript
    interface CreateUserDto {
      email: string;     // Format: valid email
      password: string;  // Min 8 chars, must contain number
      name: string;      // Max 50 chars
    }
    ```
  
  - Response:
    ```typescript
    interface UserResponse {
      id: string;        // UUID
      email: string;
      name: string;
      createdAt: Date;
    }
    ```
  
  - Status Codes:
    - 201 Created: Success
    - 400 Bad Request: Invalid input
    - 409 Conflict: Email exists
  
  - Implementation:
    ```typescript
    @Controller('users')
    export class UserController {
      @Post('register')
      @HttpCode(201)
      async register(@Body() dto: CreateUserDto): Promise<UserResponse> {
        const user = await this.userService.createUser(dto);
        return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
      }
    }
    ```
  
  - Call Chain:
    ```
    UserController.register()
      ├─> Validate DTO (class-validator)
      ├─> UserService.createUser(dto)
      └─> Transform to UserResponse
    ```
  
  - Verification: Integration test with valid/invalid payloads
```

**强制要求：**
1. ✅ **完整的请求规范**（HTTP方法、路径、请求头、请求体结构）
2. ✅ **完整的响应规范**（成功响应、所有错误响应）
3. ✅ **实现代码模板**（展示完整代码，不是伪代码）
4. ✅ **调用链规范**（列出所有步骤）

---

### ✅ Service 任务（新增强制要求）

```markdown
- [ ] 3.1 Implement user creation logic
  - File: `src/services/user.service.ts`
  - Class: `UserService`
  - Method: `createUser(dto: CreateUserDto): Promise<User>`
  
  - Input Parameters:
    ```typescript
    interface CreateUserDto {
      email: string;     // Must be unique, validated format
      password: string;  // Will be hashed, min 8 chars
      name: string;      // Display name, max 50 chars
    }
    ```
  
  - Return Value:
    ```typescript
    interface User {
      id: string;           // Generated UUID
      email: string;        // Normalized lowercase
      passwordHash: string; // Bcrypt hash
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }
    ```
  
  - Implementation Logic:
    ```typescript
    async createUser(dto: CreateUserDto): Promise<User> {
      // Step 1: Validate email uniqueness
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) throw new ConflictException('Email already exists');
      
      // Step 2: Hash password
      const passwordHash = await this.passwordService.hash(dto.password);
      
      // Step 3: Create entity
      const user = this.userRepository.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name
      });
      
      // Step 4: Save to database
      const savedUser = await this.userRepository.save(user);
      
      // Step 5: Send welcome email (async)
      this.emailService.sendWelcome(savedUser.email).catch(err => {
        this.logger.error('Failed to send welcome email', err);
      });
      
      return savedUser;
    }
    ```
  
  - Call Chain:
    ```
    UserService.createUser(dto)
      ├─> UserRepository.findByEmail(dto.email)      [Check uniqueness]
      ├─> PasswordService.hash(dto.password)         [Hash password]
      ├─> UserRepository.create(userData)            [Create entity]
      ├─> UserRepository.save(user)                  [Persist to DB]
      └─> EmailService.sendWelcome(user.email)       [Send email async]
    ```
  
  - Error Handling:
    - ConflictException: Email already exists
    - ValidationException: Invalid input format
    - DatabaseException: Save operation failed
  
  - Verification: Unit test with mocked dependencies
```

**强制要求：**
1. ✅ **完整的方法签名**（参数类型、返回值类型）
2. ✅ **完整的输入参数规范**（所有字段、验证规则）
3. ✅ **完整的返回值规范**（所有字段、数据类型）
4. ✅ **完整的实现逻辑**（每一步都有注释）
5. ✅ **完整的调用链**（列出所有依赖的方法）
6. ✅ **完整的错误处理**（所有可能的异常）

---

## 🚨 实施阶段的强制规则

### RULE 1: 严格遵循提案
- ✅ **必须**使用提案中定义的确切 API 端点
- ✅ **必须**使用提案中定义的确切请求/响应格式
- ✅ **必须**遵循提案中指定的确切调用链
- ❌ **禁止**在未更新提案的情况下修改方法签名
- ❌ **禁止**在未更新提案的情况下更改架构

### RULE 2: 输入/输出合规性
- ✅ **必须**实现提案中定义的确切接口/DTO 结构
- ✅ **必须**按提案中的规定验证所有输入
- ✅ **必须**以提案中指定的确切格式返回数据
- ✅ **必须**使用提案中定义的确切状态码处理所有错误

### RULE 3: 调用链合规性
- ✅ **必须**按"Call Chain"部分指定的确切顺序调用方法
- ✅ **必须**使用"Uses:"部分列出的确切服务/仓库方法
- ❌ **禁止**跳过中间层（例如，Controller 必须调用 Service，而不是直接调用 Repository）
- ❌ **禁止**引入提案中未列出的新方法调用

### RULE 4: 验证后再完成
- ✅ **必须**使用指定的"Verification"方法验证每个任务
- ✅ **必须**使用提案中的确切请求/响应示例进行测试
- ❌ **禁止**在验证通过之前将任务标记为完成

---

## ✅ 合规性检查示例

### 提案规定：
```markdown
API: POST /api/users/register
Request Body: { email, password, name }
Response: { id, email, name, createdAt }
Call Chain: Controller → UserService.createUser() → UserRepository.save()
```

### 实施时必须：
- ✓ 使用确切路径：`POST /api/users/register`（不是 `/users` 或 `/api/register`）
- ✓ 接受确切字段：`email, password, name`（不是 `username` 或 `firstName/lastName`）
- ✓ 返回确切字段：`id, email, name, createdAt`（不是 `userId` 或整个 `user` 对象）
- ✓ 调用确切方法：`UserService.createUser()`（不是 `UserService.create()` 或 `UserService.register()`）
- ✓ 遵循确切链：`Controller → Service → Repository`（不是 `Controller → Repository`）

---

## 🔄 偏差处理协议

如果在实施过程中发现提案不正确或不完整：

1. **立即停止**实施
2. **记录**问题（什么问题、为什么行不通）
3. **更新** proposal.md 和 tasks.md 为正确的规范
4. **请求**重新批准（如果更改重大）
5. **仅在提案更新后**恢复实施

### ❌ 禁止做法：
- 实施"合理的做法"，如果它与提案不同
- 在未更新提案的情况下进行"小调整"
- 假设"他们可能的意思是 X"，而提案说的是 Y

---

## 📊 使用指南

### 创建提案时：
1. 阅读 `openspec/project.md` 了解项目结构
2. 阅读 `openspec/modules/*.md` 了解现有类和 API
3. 按照本文档的要求编写 proposal.md
4. 按照本文档的要求编写 tasks.md
5. 运行 `openspec validate <change-id> --strict` 验证

### 实施提案时：
1. 仔细阅读 proposal.md 中的所有规范
2. 严格按照 tasks.md 中的实现模板编码
3. 使用提案中的确切 API 路径、参数、返回值
4. 遵循提案中指定的确切调用链
5. 使用提案中的验证方法进行测试
6. **禁止偏离提案**，如有问题先更新提案

---

## 🎯 效果预期

遵循本规范后，将实现：

1. ✅ **零歧义**：AI 智能体知道确切要实现什么
2. ✅ **零偏差**：实施结果与提案完全一致
3. ✅ **可验证**：每个任务都有明确的验证方法
4. ✅ **可追溯**：从 API 到数据库的完整调用链清晰可见
5. ✅ **易维护**：后续开发者可以快速理解实现逻辑

---

## 📚 相关文档

- [AGENTS.md](openspec/AGENTS.md) - 完整的 AI 指令
- [project.md](openspec/project.md) - 项目结构和模块概览
- [modules/*.md](openspec/modules/) - 模块详细文档

---

*最后更新：2024-12-12*
