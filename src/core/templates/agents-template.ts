export const agentsTemplate = `# OpenSpec Instructions

Instructions for AI coding assistants using OpenSpec for spec-driven development.

## TL;DR Quick Checklist

- Search existing work: \`openspec spec list --long\`, \`openspec list\` (use \`rg\` only for full-text search)
- Decide scope: new capability vs modify existing capability
- Pick a unique \`change-id\`: kebab-case, verb-led (\`add-\`, \`update-\`, \`remove-\`, \`refactor-\`)
- **MUST create ALL files**: \`proposal.md\`, \`tasks.md\`, \`design.md\` (only if needed), and delta specs per affected capability
- Write deltas: use \`## ADDED|MODIFIED|REMOVED|RENAMED Requirements\`; include at least one \`#### Scenario:\` per requirement
- Validate: \`openspec validate [change-id] --strict\` and fix issues
- Request approval: Do not start implementation until proposal is approved

**⚠️  CRITICAL: You MUST create both proposal.md AND tasks.md for every change. Creating only one file is incomplete!**

## Three-Stage Workflow

### Stage 1: Creating Changes
Create proposal when you need to:
- Add features or functionality
- Make breaking changes (API, schema)
- Change architecture or patterns  
- Optimize performance (changes behavior)
- Update security patterns

Triggers (examples):
- "Help me create a change proposal"
- "Help me plan a change"
- "Help me create a proposal"
- "I want to create a spec proposal"
- "I want to create a spec"

Loose matching guidance:
- Contains one of: \`proposal\`, \`change\`, \`spec\`
- With one of: \`create\`, \`plan\`, \`make\`, \`start\`, \`help\`

Skip proposal for:
- Bug fixes (restore intended behavior)
- Typos, formatting, comments
- Dependency updates (non-breaking)
- Configuration changes
- Tests for existing behavior

**Workflow**
1. Review \`openspec/project.md\`, \`openspec list\`, and \`openspec list --specs\` to understand current context.
2. Choose a unique verb-led \`change-id\` and create directory: \`openspec/changes/<id>/\`
3. **MUST create these files** (in order):
   - \`proposal.md\` - The "what" and "why"
   - \`tasks.md\` - The "how" (step-by-step implementation)
   - \`design.md\` (optional) - Technical decisions if needed
   - \`specs/\` - Delta specs if affecting capabilities
4. Draft spec deltas using \`## ADDED|MODIFIED|REMOVED Requirements\` with at least one \`#### Scenario:\` per requirement.
5. Run \`openspec validate <id> --strict\` and resolve any issues before sharing the proposal.

**⚠️  Common Mistake: DO NOT create only proposal.md and stop. You MUST also create tasks.md in the same change!**

### Stage 2: Implementing Changes

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
5. **Confirm completion** - Ensure every item in \`tasks.md\` is finished before updating statuses
6. **Update checklist** - After all work is done, set every task to \`- [x]\` so the list reflects reality
7. **Approval gate** - Do not start implementation until the proposal is reviewed and approved

**CRITICAL Implementation Rules:**

**RULE 1: Strict Adherence to Proposal**
- **MUST** implement exactly as specified in proposal.md and tasks.md
- **MUST** use the exact API endpoints, request/response formats defined in proposal
- **MUST** follow the exact call chain specified in tasks.md
- **MUST NOT** change method signatures, parameter types, or return types without updating proposal first
- **MUST NOT** add new dependencies or change architecture without proposal update

**RULE 2: Input/Output Compliance**
- **MUST** implement the exact interface/DTO structures defined in proposal
- **MUST** validate all inputs as specified in the proposal
- **MUST** return data in the exact format specified in response body
- **MUST** handle all error cases with the exact status codes defined in proposal

**RULE 3: Call Chain Compliance**
- **MUST** call methods in the exact order specified in "Call Chain" section
- **MUST** use the exact service/repository methods listed in "Uses:" section
- **MUST NOT** skip intermediate layers (e.g., Controller must call Service, not Repository directly)
- **MUST NOT** introduce new method calls not listed in proposal

**RULE 4: Verification Before Completion**
- **MUST** verify each task using the "Verification" method specified
- **MUST** test with the exact request/response examples from proposal
- **MUST NOT** mark task as complete without verification passing

**Example Compliance Check:**
\`\`\`markdown
Proposal specifies:
  - API: POST /api/users/register
  - Request Body: { email, password, name }
  - Response: { id, email, name, createdAt }
  - Call Chain: Controller → UserService.createUser() → UserRepository.save()

Implementation MUST:
  ✓ Use exact path: POST /api/users/register (not /users or /api/register)
  ✓ Accept exact fields: email, password, name (not username or firstName/lastName)
  ✓ Return exact fields: id, email, name, createdAt (not userId or user object)
  ✓ Call exact method: UserService.createUser() (not UserService.create() or UserService.register())
  ✓ Follow exact chain: Controller → Service → Repository (not Controller → Repository)
\`\`\`

**Deviation Protocol:**
If you discover the proposal is incorrect or incomplete during implementation:
1. **STOP** implementation immediately
2. **DOCUMENT** the issue (what's wrong, why it won't work)
3. **UPDATE** proposal.md and tasks.md with corrected specification
4. **REQUEST** re-approval if changes are significant
5. **RESUME** implementation only after proposal is updated

**DO NOT:**
- Implement "what makes sense" if it differs from proposal
- Make "small adjustments" without updating proposal
- Assume "they probably meant X" when proposal says Y


### Stage 3: Archiving Changes
After deployment, create separate PR to:
- Move \`changes/[name]/\` → \`changes/archive/YYYY-MM-DD-[name]/\`
- Update \`specs/\` if capabilities changed
- Use \`openspec archive <change-id> --skip-specs --yes\` for tooling-only changes (always pass the change ID explicitly)
- Run \`openspec validate --strict\` to confirm the archived change passes checks

## Before Any Task

**Context Checklist:**
- [ ] Read relevant specs in \`specs/[capability]/spec.md\`
- [ ] Check pending changes in \`changes/\` for conflicts
- [ ] **Read \`openspec/project.md\` for project structure and module overview**
- [ ] **Read relevant \`openspec/modules/*.md\` to understand existing classes and APIs**
- [ ] Run \`openspec list\` to see active changes
- [ ] Run \`openspec list --specs\` to see existing capabilities

**Before Creating Specs:**
- Always check if capability already exists
- Prefer modifying existing specs over creating duplicates
- Use \`openspec show [spec]\` to review current state
- **Based on project documentation, identify which module the feature belongs to**
- **Check existing classes in the target module to avoid duplication**
- If request is ambiguous, ask 1–2 clarifying questions before scaffolding

### Search Guidance
- Enumerate specs: \`openspec spec list --long\` (or \`--json\` for scripts)
- Enumerate changes: \`openspec list\` (or \`openspec change list --json\` - deprecated but available)
- Show details:
  - Spec: \`openspec show <spec-id> --type spec\` (use \`--json\` for filters)
  - Change: \`openspec show <change-id> --json --deltas-only\`
- Full-text search (use ripgrep): \`rg -n "Requirement:|Scenario:" openspec/specs\`

## Quick Start

### CLI Commands

\`\`\`bash
# Essential commands
openspec list                  # List active changes
openspec list --specs          # List specifications
openspec show [item]           # Display change or spec
openspec validate [item]       # Validate changes or specs
openspec archive <change-id> [--yes|-y]   # Archive after deployment (add --yes for non-interactive runs)

# Project management
openspec init [path]           # Initialize OpenSpec
openspec init --with-impl-guide  # Initialize with implementation guidance
openspec init --scan-code --with-impl-guide  # Scan code and generate guidance
openspec init --frameworks nestjs,typeorm  # Specify frameworks explicitly
openspec update [path]         # Update instruction files

# Interactive mode
openspec show                  # Prompts for selection
openspec validate              # Bulk validation mode

# Debugging
openspec show [change] --json --deltas-only
openspec validate [change] --strict
\`\`\`

### Command Flags

- \`--json\` - Machine-readable output
- \`--type change|spec\` - Disambiguate items
- \`--strict\` - Comprehensive validation
- \`--no-interactive\` - Disable prompts
- \`--skip-specs\` - Archive without spec updates
- \`--yes\`/\`-y\` - Skip confirmation prompts (non-interactive archive)

## Directory Structure

\`\`\`
openspec/
├── project.md              # Project conventions
├── specs/                  # Current truth - what IS built
│   └── [capability]/       # Single focused capability
│       ├── spec.md         # Requirements and scenarios
│       └── design.md       # Technical patterns
├── changes/                # Proposals - what SHOULD change
│   ├── [change-name]/
│   │   ├── proposal.md     # Why, what, impact
│   │   ├── tasks.md        # Implementation checklist
│   │   ├── design.md       # Technical decisions (optional; see criteria)
│   │   └── specs/          # Delta changes
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # Completed changes
\`\`\`

## Creating Change Proposals

**⚠️  MANDATORY FILES: Every change MUST include both proposal.md AND tasks.md!**

A complete change proposal requires:
1. ✅ \`proposal.md\` - Describes what and why
2. ✅ \`tasks.md\` - Describes how (step-by-step implementation)
3. ❓ \`design.md\` - Optional, only if needed (see criteria below)
4. ❓ \`specs/\` - Optional, only if affecting existing capabilities

**Missing tasks.md = Incomplete proposal = Implementation will fail!**

### Decision Tree

\`\`\`
New request?
├─ Bug fix restoring spec behavior? → Fix directly
├─ Typo/format/comment? → Fix directly  
├─ New feature/capability? → Create proposal
├─ Breaking change? → Create proposal
├─ Architecture change? → Create proposal
└─ Unclear? → Create proposal (safer)
\`\`\`

### Proposal Structure

**⚠️  You MUST create BOTH files in steps 2 and 4. Creating only one is incomplete!**

1. **Create directory:** \`changes/[change-id]/\` (kebab-case, verb-led, unique)

2. **Write proposal.md:** (File 1 of 2 - required)
\`\`\`markdown
# Change: [Brief description of change]

## Why
[1-2 sentences on problem/opportunity]

## What Changes
- [Bullet list of changes]
- [Mark breaking changes with **BREAKING**]

## Impact
- Affected specs: [list capabilities]
- Affected code: [key files/systems]
\`\`\`

**Important:** When writing proposal.md for code changes:
- **MUST** include a "File Change Manifest" section with:
  - New Files: table with [File Path, Purpose, Dependencies]
  - Modified Files: table with [File Path, Changes, Reason]
  - Deleted Files: table with [File Path, Reason]
- **MUST** use specific file paths (e.g., \`src/core/code-scanner.ts\`), not placeholders
- **MUST** include "API Specification" section for any new/modified APIs:
  - HTTP Method and Path
  - Request Parameters (headers, query, path, body)
  - Response Body (success and error cases)
  - Status Codes
- **MUST** include "Data Flow" section showing the call chain:
  - Controller → Service → Repository pattern
  - Which methods call which other methods
  - Data transformation at each step
- **MUST** include "Implementation Logic" section with:
  - Step-by-step algorithm for complex operations
  - Business rules and validation logic
  - Error handling strategy
- **SHOULD** include implementation step mapping: which files to change in which order
- **SHOULD** include code example snippets showing key patterns (decorators, interfaces, etc.)

**Example API Specification in proposal.md:**
\`\`\`markdown
### API Specification

#### POST /api/users/register

**Request:**
- Headers: \`Content-Type: application/json\`
- Body:
  \`\`\`typescript
  interface CreateUserDto {
    email: string;     // Required, valid email format
    password: string;  // Required, min 8 chars
    name: string;      // Required, max 50 chars
  }
  \`\`\`

**Response:**
- Success (201 Created):
  \`\`\`typescript
  interface UserResponse {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }
  \`\`\`
- Error (400 Bad Request): \`{ error: "Invalid email format" }\`
- Error (409 Conflict): \`{ error: "Email already exists" }\`

**Implementation Logic:**
1. Validate DTO using class-validator
2. Check email uniqueness in UserRepository
3. Hash password using PasswordService.hash()
4. Create User entity
5. Save to database via UserRepository.save()
6. Send welcome email asynchronously
7. Return UserResponse

**Call Chain:**
\`\`\`
UserController.register(dto)
  → UserService.createUser(dto)
    → UserRepository.findByEmail(email)    [validation]
    → PasswordService.hash(password)       [security]
    → UserRepository.save(user)            [persistence]
    → EmailService.sendWelcome(email)      [notification]
\`\`\`
\`\`\`


3. **Create spec deltas:** \`specs/[capability]/spec.md\`
\`\`\`markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL provide...

#### Scenario: Success case
- **WHEN** user performs action
- **THEN** expected result

## MODIFIED Requirements
### Requirement: Existing Feature
[Complete modified requirement]

## REMOVED Requirements
### Requirement: Old Feature
**Reason**: [Why removing]
**Migration**: [How to handle]
\`\`\`
If multiple capabilities are affected, create multiple delta files under \`changes/[change-id]/specs/<capability>/spec.md\`—one per capability.

**Important:** When creating spec deltas with implementation changes:
- **SHOULD** include implementation guidance section if project.md contains implementation mapping
- **SHOULD** reference specific files that implement each requirement (e.g., \`Implemented in: src/services/auth.service.ts\`)
- **SHOULD** include code examples showing decorators, class structure, or framework patterns
- **SHOULD** map requirements to actual code locations to prevent AI hallucinations

4. **Create tasks.md:** (File 2 of 2 - required)

**⚠️  DO NOT SKIP THIS STEP! proposal.md alone is incomplete!**

**CRITICAL: Tasks.md Structure Requirements**

Every tasks.md MUST start with this mandatory section:

\`\`\`markdown
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

---

## 1. Implementation
- [ ] 1.1 Create database schema
  - **Reference**: See "Data Model" section in proposal.md
  - File: \`src/entities/user.entity.ts\`
  - Class: \`User\` (extends BaseEntity)
  - Content: Define user entity with TypeORM decorators
  - Verification: Run \`pnpm typeorm migration:generate\`

- [ ] 1.2 Implement API endpoint
  - **Reference**: See "API Specification" section in proposal.md for POST /api/users/register
  - **MUST MATCH**: Exact endpoint path, request body, response body from proposal
  - File: \`src/controllers/user.controller.ts\`
  - Class: \`UserController\`
  - Method: \`register(dto: CreateUserDto): Promise<UserResponse>\`
  - API: \`POST /api/users/register\`
  - Method: \`create()\` - POST /users
  - API: \`POST /api/users\` -> \`UserService.createUser()\`
  - Dependencies: Task 1.1 (entity must exist first)
  - Verification: \`curl -X POST http://localhost:3000/api/users\`

- [ ] 1.3 Implement business logic
  - File: \`src/services/user.service.ts\`
  - Class: \`UserService\`
  - Method: \`createUser(dto: CreateUserDto): Promise<User>\`
  - Uses: \`UserRepository.save()\`, \`EmailService.sendWelcome()\`
  - Verification: Unit test \`test/services/user.service.test.ts\`

- [ ] 1.4 Write tests
  - File: \`test/controllers/user.controller.test.ts\`
  - Tests: \`UserController.create()\` scenarios
  - Verification: \`pnpm test:unit\`
\`\`\`

**Task Documentation Format (Required):**

Each task MUST include:
\`\`\`markdown
- [ ] [Task ID] [Task Description]
  - File: \`[absolute path to file]\`
  - Class: \`[ClassName]\` (if applicable)
  - Method: \`[methodName(params): ReturnType]\` (if applicable)
  - API: \`[HTTP_METHOD] [path]\` -> \`[ServiceClass.method()]\` (for API tasks)
  - Uses: \`[list of classes/methods this task calls]\`
  - Dependencies: [List prerequisite task IDs]
  - Content: [Brief description of implementation]
  - Verification: [Specific command or test to verify completion]
\`\`\`

**Task Categories and Templates:**

*Entity/Model Tasks:*
\`\`\`markdown
- [ ] 1.1 Create User entity
  - File: \`src/entities/user.entity.ts\`
  - Class: \`User\` (@Entity decorator)
  - Fields: id (uuid), email (string), createdAt (Date)
  - Relations: @OneToMany(() => Post, post => post.author)
  - Verification: TypeORM can load the entity
\`\`\`

*API/Controller Tasks:*
\`\`\`markdown
- [ ] 2.1 Create user registration endpoint
  - **Reference**: See proposal.md "API Specification > POST /api/users/register"
  - **MUST MATCH**: Use EXACT endpoint, request, response from proposal
  - File: \`src/controllers/user.controller.ts\`
  - Class: \`UserController\`
  - Method: \`register(dto: CreateUserDto): Promise<UserResponse>\`
  - API: \`POST /api/users/register\`
  - Request Body: \`CreateUserDto\` { email, password, name }
  - Response: \`UserResponse\` { id, email, name }
  - Status Codes: 201 (created), 400 (validation), 409 (duplicate)
  - Verification: Integration test with valid/invalid payloads
\`\`\`

**CRITICAL for API/Controller Tasks:**

Every API task MUST include:
1. **Complete Request Specification**
   - HTTP Method and Path: \`POST /api/users/register\`
   - Request Headers (if any): \`Authorization: Bearer {token}\`
   - Request Body Structure:
     \`\`\`typescript
     interface CreateUserDto {
       email: string;     // Format: valid email
       password: string;  // Min 8 chars, must contain number
       name: string;      // Max 50 chars
     }
     \`\`\`
   - Query Parameters (if any): \`?page=1&limit=10\`
   - Path Parameters (if any): \`/users/:userId\`

2. **Complete Response Specification**
   - Success Response (200/201):
     \`\`\`typescript
     interface UserResponse {
       id: string;        // UUID
       email: string;
       name: string;
       createdAt: Date;
     }
     \`\`\`
   - Error Responses:
     - 400 Bad Request: \`{ error: "Invalid email format" }\`
     - 401 Unauthorized: \`{ error: "Token expired" }\`
     - 409 Conflict: \`{ error: "Email already exists" }\`
     - 500 Server Error: \`{ error: "Internal server error" }\`

3. **Implementation Code Template**
   \`\`\`typescript
   @Controller('users')
   export class UserController {
     constructor(private userService: UserService) {}
     
     @Post('register')
     @HttpCode(201)
     async register(
       @Body() dto: CreateUserDto
     ): Promise<UserResponse> {
       // Step 1: Validate DTO (handled by class-validator)
       // Step 2: Call service layer
       const user = await this.userService.createUser(dto);
       // Step 3: Transform to response
       return {
         id: user.id,
         email: user.email,
         name: user.name,
         createdAt: user.createdAt
       };
     }
   }
   \`\`\`

4. **Call Chain Specification**
   \`\`\`
   UserController.register()
     ├─> Step 1: Validate DTO (class-validator)
     ├─> Step 2: UserService.createUser(dto)
     │            ├─> UserService.validateEmail(email)
     │            ├─> PasswordService.hash(password)
     │            ├─> UserRepository.save(user)
     │            └─> EmailService.sendWelcome(email)
     └─> Step 3: Transform to UserResponse
   \`\`\`


*Service/Business Logic Tasks:*
\`\`\`markdown
- [ ] 3.1 Implement user creation logic
  - **Reference**: See proposal.md "Implementation Logic" and "Call Chain" sections
  - **MUST MATCH**: Follow EXACT steps and method calls from proposal
  - File: \`src/services/user.service.ts\`
  - Class: \`UserService\`
  - Method: \`createUser(dto: CreateUserDto): Promise<User>\`
  - Business Rules:
    - Validate email uniqueness
    - Hash password before saving
    - Send welcome email after creation
  - Uses: \`UserRepository\`, \`PasswordService.hash()\`, \`EmailService.sendWelcome()\`
  - Verification: Unit test with mocked dependencies
\`\`\`

**CRITICAL for Service Tasks:**

**FIRST: Review proposal.md for this service's specification**

Every Service task MUST include:
1. **Complete Method Signature**
   \`\`\`typescript
   async createUser(dto: CreateUserDto): Promise<User> {
     // Input validation
     // Business logic
     // Data persistence
     // Return result
   }
   \`\`\`

2. **Input Parameter Specification**
   \`\`\`typescript
   interface CreateUserDto {
     email: string;     // Must be unique, validated format
     password: string;  // Will be hashed, min 8 chars
     name: string;      // Display name, max 50 chars
   }
   \`\`\`

3. **Return Value Specification**
   \`\`\`typescript
   interface User {
     id: string;           // Generated UUID
     email: string;        // Normalized lowercase
     passwordHash: string; // Bcrypt hash
     name: string;
     createdAt: Date;      // Auto-generated
     updatedAt: Date;      // Auto-generated
   }
   \`\`\`

4. **Complete Implementation Logic**
   \`\`\`typescript
   async createUser(dto: CreateUserDto): Promise<User> {
     // Step 1: Validate email uniqueness
     const existing = await this.userRepository.findByEmail(dto.email);
     if (existing) {
       throw new ConflictException('Email already exists');
     }
     
     // Step 2: Hash password
     const passwordHash = await this.passwordService.hash(dto.password);
     
     // Step 3: Create user entity
     const user = this.userRepository.create({
       email: dto.email.toLowerCase(),
       passwordHash,
       name: dto.name
     });
     
     // Step 4: Save to database
     const savedUser = await this.userRepository.save(user);
     
     // Step 5: Send welcome email (async, don't await)
     this.emailService.sendWelcome(savedUser.email).catch(err => {
       this.logger.error('Failed to send welcome email', err);
     });
     
     // Step 6: Return created user
     return savedUser;
   }
   \`\`\`

5. **Dependencies and Call Chain**
   \`\`\`
   UserService.createUser(dto)
     ├─> UserRepository.findByEmail(dto.email)      [Check uniqueness]
     ├─> PasswordService.hash(dto.password)         [Hash password]
     ├─> UserRepository.create(userData)            [Create entity]
     ├─> UserRepository.save(user)                  [Persist to DB]
     └─> EmailService.sendWelcome(user.email)       [Send email async]
   \`\`\`

6. **Error Handling**
   - ConflictException: Email already exists
   - ValidationException: Invalid input format
   - DatabaseException: Save operation failed


*Integration Tasks:*
\`\`\`markdown
- [ ] 4.1 Wire up user module
  - File: \`src/modules/user.module.ts\`
  - Imports: TypeOrmModule.forFeature([User])
  - Providers: [UserService, UserRepository]
  - Controllers: [UserController]
  - Exports: [UserService]
  - Verification: Module compiles without errors
\`\`\`

**Important:** When creating tasks.md for code changes:
- **MUST** base on \`openspec/project.md\` and \`openspec/modules/*.md\` to understand existing code structure
- **MUST** include specific file paths for each task (e.g., \`src/services/user.service.ts\`)
- **MUST** reference concrete code locations (e.g., \`UserController.create() in src/controllers/user.controller.ts\`)
- **MUST** specify which files to create, modify, or delete
- **MUST** list which existing classes/services will be called (e.g., "Uses: \`UserRepository.findByEmail()\`, \`PasswordService.hash()\`")
- **MUST** include API endpoint details for controller tasks (HTTP method, path, request/response types)
- **MUST** list business rules for service tasks
- **MUST** specify the call chain (e.g., "Controller → Service → Manager → DAO")
- **MUST** specify verification method for each task
- **AVOID** generic placeholders like \`[module-name].ts\` or \`[service-file]\`
- **SHOULD** include file change manifest: New Files, Modified Files, Deleted Files
- **SHOULD** include code snippets showing decorators, class structures, or patterns to follow
- **SHOULD** reference similar existing implementations from project docs as examples
- **SHOULD** declare dependencies between tasks when order matters
- **SHOULD** list "Uses:" section showing which classes/methods the task will call

5. **Create design.md when needed:**
Create \`design.md\` if any of the following apply; otherwise omit it:
- Cross-cutting change (multiple services/modules) or a new architectural pattern
- New external dependency or significant data model changes
- Security, performance, or migration complexity
- Ambiguity that benefits from technical decisions before coding

Minimal \`design.md\` skeleton:
\`\`\`markdown
## Context
[Background, constraints, stakeholders]

## Goals / Non-Goals
- Goals: [...]
- Non-Goals: [...]

## Decisions
- Decision: [What and why]
- Alternatives considered: [Options + rationale]

## Risks / Trade-offs
- [Risk] → Mitigation

## Migration Plan
[Steps, rollback]

## Open Questions
- [...]
\`\`\`

## Spec File Format

### Critical: Scenario Formatting

**CORRECT** (use #### headers):
\`\`\`markdown
#### Scenario: User login success
- **WHEN** valid credentials provided
- **THEN** return JWT token
\`\`\`

**WRONG** (don't use bullets or bold):
\`\`\`markdown
- **Scenario: User login**  ❌
**Scenario**: User login     ❌
### Scenario: User login      ❌
\`\`\`

Every requirement MUST have at least one scenario.

### Requirement Wording
- Use SHALL/MUST for normative requirements (avoid should/may unless intentionally non-normative)

### Delta Operations

- \`## ADDED Requirements\` - New capabilities
- \`## MODIFIED Requirements\` - Changed behavior
- \`## REMOVED Requirements\` - Deprecated features
- \`## RENAMED Requirements\` - Name changes

Headers matched with \`trim(header)\` - whitespace ignored.

#### When to use ADDED vs MODIFIED
- ADDED: Introduces a new capability or sub-capability that can stand alone as a requirement. Prefer ADDED when the change is orthogonal (e.g., adding "Slash Command Configuration") rather than altering the semantics of an existing requirement.
- MODIFIED: Changes the behavior, scope, or acceptance criteria of an existing requirement. Always paste the full, updated requirement content (header + all scenarios). The archiver will replace the entire requirement with what you provide here; partial deltas will drop previous details.
- RENAMED: Use when only the name changes. If you also change behavior, use RENAMED (name) plus MODIFIED (content) referencing the new name.

Common pitfall: Using MODIFIED to add a new concern without including the previous text. This causes loss of detail at archive time. If you aren’t explicitly changing the existing requirement, add a new requirement under ADDED instead.

Authoring a MODIFIED requirement correctly:
1) Locate the existing requirement in \`openspec/specs/<capability>/spec.md\`.
2) Copy the entire requirement block (from \`### Requirement: ...\` through its scenarios).
3) Paste it under \`## MODIFIED Requirements\` and edit to reflect the new behavior.
4) Ensure the header text matches exactly (whitespace-insensitive) and keep at least one \`#### Scenario:\`.

Example for RENAMED:
\`\`\`markdown
## RENAMED Requirements
- FROM: \`### Requirement: Login\`
- TO: \`### Requirement: User Authentication\`
\`\`\`

## Troubleshooting

### Common Errors

**"Change must have at least one delta"**
- Check \`changes/[name]/specs/\` exists with .md files
- Verify files have operation prefixes (## ADDED Requirements)

**"Requirement must have at least one scenario"**
- Check scenarios use \`#### Scenario:\` format (4 hashtags)
- Don't use bullet points or bold for scenario headers

**Silent scenario parsing failures**
- Exact format required: \`#### Scenario: Name\`
- Debug with: \`openspec show [change] --json --deltas-only\`

### Validation Tips

\`\`\`bash
# Always use strict mode for comprehensive checks
openspec validate [change] --strict

# Debug delta parsing
openspec show [change] --json | jq '.deltas'

# Check specific requirement
openspec show [spec] --json -r 1
\`\`\`

## Happy Path Script

\`\`\`bash
# 1) Explore current state
openspec spec list --long
openspec list
# Optional full-text search:
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) Choose change id and scaffold
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## Why\\n...\\n\\n## What Changes\\n- ...\\n\\n## Impact\\n- ...\\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. Implementation\\n- [ ] 1.1 ...\\n" > openspec/changes/$CHANGE/tasks.md

# 3) Add deltas (example)
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Authentication
Users MUST provide a second factor during login.

#### Scenario: OTP required
- **WHEN** valid credentials are provided
- **THEN** an OTP challenge is required
EOF

# 4) Validate
openspec validate $CHANGE --strict
\`\`\`

## Multi-Capability Example

\`\`\`
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: Two-Factor Authentication
    └── notifications/
        └── spec.md   # ADDED: OTP email notification
\`\`\`

auth/spec.md
\`\`\`markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
...
\`\`\`

notifications/spec.md
\`\`\`markdown
## ADDED Requirements
### Requirement: OTP Email Notification
...
\`\`\`

## Best Practices

### Simplicity First
- Default to <100 lines of new code
- Single-file implementations until proven insufficient
- Avoid frameworks without clear justification
- Choose boring, proven patterns

### Complexity Triggers
Only add complexity with:
- Performance data showing current solution too slow
- Concrete scale requirements (>1000 users, >100MB data)
- Multiple proven use cases requiring abstraction

### Clear References
- Use \`file.ts:42\` format for code locations
- Reference specs as \`specs/auth/spec.md\`
- Link related changes and PRs

### Capability Naming
- Use verb-noun: \`user-auth\`, \`payment-capture\`
- Single purpose per capability
- 10-minute understandability rule
- Split if description needs "AND"

### Change ID Naming
- Use kebab-case, short and descriptive: \`add-two-factor-auth\`
- Prefer verb-led prefixes: \`add-\`, \`update-\`, \`remove-\`, \`refactor-\`
- Ensure uniqueness; if taken, append \`-2\`, \`-3\`, etc.

## Tool Selection Guide

| Task | Tool | Why |
|------|------|-----|
| Find files by pattern | Glob | Fast pattern matching |
| Search code content | Grep | Optimized regex search |
| Read specific files | Read | Direct file access |
| Explore unknown scope | Task | Multi-step investigation |

## Error Recovery

### Change Conflicts
1. Run \`openspec list\` to see active changes
2. Check for overlapping specs
3. Coordinate with change owners
4. Consider combining proposals

### Validation Failures
1. Run with \`--strict\` flag
2. Check JSON output for details
3. Verify spec file format
4. Ensure scenarios properly formatted

### Missing Context
1. Read project.md first
2. Check related specs
3. Review recent archives
4. Ask for clarification

## Quick Reference

### Stage Indicators
- \`changes/\` - Proposed, not yet built
- \`specs/\` - Built and deployed
- \`archive/\` - Completed changes

### File Purposes
- \`proposal.md\` - Why and what
- \`tasks.md\` - Implementation steps
- \`design.md\` - Technical decisions
- \`spec.md\` - Requirements and behavior

### CLI Essentials
\`\`\`bash
openspec list              # What's in progress?
openspec show [item]       # View details
openspec validate --strict # Is it correct?
openspec archive <change-id> [--yes|-y]  # Mark complete (add --yes for automation)
\`\`\`

Remember: Specs are truth. Changes are proposals. Keep them in sync.
`;
