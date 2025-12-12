## ADDED Requirements

### Requirement: Proposal File Change Manifest
AI-generated proposals SHALL include an explicit file change manifest listing all files to be created, modified, or deleted.

#### Scenario: Including file change manifest in proposal
- **WHEN** AI generates a proposal.md
- **THEN** include a "File Change Manifest" section with three subsections:
  - "New Files": table with columns [File Path, Purpose, Dependencies]
  - "Modified Files": table with columns [File Path, Changes, Reason]
  - "Deleted Files": table with columns [File Path, Reason]
- **AND** use specific file paths (e.g., `src/core/code-scanner.ts`)
- **AND** avoid generic placeholders like `[module-name].ts`

#### Scenario: File change manifest format
- **WHEN** documenting file changes in proposal
- **THEN** use the following table format for new files:

```markdown
### New Files

| File Path | Purpose | Dependencies |
|-----------|---------|--------------|
| `src/core/code-scanner.ts` | Scan project directory structure | fs, path |
| `src/core/framework-detector.ts` | Detect project frameworks | package.json reader |
```

- **AND** use similar format for modified and deleted files

### Requirement: Implementation Step Mapping
AI-generated proposals SHALL include detailed implementation step mapping that connects each step to specific files and spec references.

#### Scenario: Including implementation steps in proposal
- **WHEN** AI generates a proposal.md
- **THEN** include an "Implementation Steps Detail" section
- **AND** for each step, specify:
  - Step number and description
  - File path to create or modify
  - Content to implement
  - Reference to spec section
  - Dependencies on other steps

#### Scenario: Implementation step format
- **WHEN** documenting implementation steps
- **THEN** use the following format:

```markdown
## Implementation Steps Detail

### Step 1: Create Framework Detector

**File:** `src/core/framework-detector.ts`

**Implementation Content:**
- Define `FrameworkDetector` class
- Implement `detectFrameworks()` method that reads package.json
- Return framework metadata (name, version, type)

**Reference:** See spec `openspec/specs/cli-init/spec.md` "Framework-Specific Templates" requirement

**Dependencies:** None
```

### Requirement: Code Example Snippets
AI-generated proposals SHALL include code example snippets for critical implementations.

#### Scenario: Including code examples in proposal
- **WHEN** AI generates a proposal.md for complex features
- **THEN** include "Key Code Implementations" section
- **AND** provide code snippets for:
  - Critical class or function signatures
  - Complex algorithm implementations
  - Framework-specific patterns
- **AND** keep examples concise (10-30 lines)
- **AND** include comments explaining key decisions

#### Scenario: Code example format
- **WHEN** documenting code examples
- **THEN** use fenced code blocks with language specification
- **AND** include context before the code block
- **AND** explain the code's role in the implementation

### Requirement: Task File Path Specification
AI-generated tasks SHALL include specific file paths and implementation locations for each task.

#### Scenario: Specifying file paths in tasks
- **WHEN** AI generates tasks.md
- **THEN** each task MUST include:
  - "File:" field with absolute or relative path
  - "Content:" field describing what to implement
  - "Reference:" field pointing to spec section
  - "Verification:" field explaining how to confirm completion

#### Scenario: Task format with file paths
- **WHEN** documenting tasks
- **THEN** use the following format:

```markdown
- [ ] 1.1 Create framework detector
  - File: `src/core/framework-detector.ts`
  - Content: Implement framework detection by parsing package.json dependencies
  - Reference: Spec section "Framework-Specific Templates"
  - Verification: Run unit test `test/core/framework-detector.test.ts`
```

### Requirement: Task Dependency Declaration
AI-generated tasks SHALL explicitly declare dependencies between tasks.

#### Scenario: Declaring task dependencies
- **WHEN** AI generates tasks.md with dependent tasks
- **THEN** include "Dependencies:" field listing prerequisite task IDs
- **AND** order tasks so dependencies appear before dependents
- **AND** group related tasks under the same section

#### Scenario: Task dependency format
- **WHEN** documenting task dependencies
- **THEN** use the following format:

```markdown
- [ ] 2.1 Create entity parser
  - File: `src/core/parsers/entity-parser.ts`
  - Dependencies: Task 1.1 (TypeScript parser must exist first)
  - Content: Extract entity metadata from AST
  - Verification: Parse sample entity file successfully
```

### Requirement: Verification Method Specification
AI-generated tasks SHALL include specific verification methods for each task.

#### Scenario: Specifying verification methods
- **WHEN** AI generates tasks.md
- **THEN** each task MUST include a "Verification:" field that specifies:
  - How to confirm the task is complete
  - Commands to run (e.g., test commands, CLI commands)
  - Expected outputs or behaviors
- **AND** use concrete, executable verification steps

#### Scenario: Verification method examples
- **WHEN** documenting verification
- **THEN** use specific commands and expected results:
  - "Run `pnpm test framework-detector.test.ts` - all tests pass"
  - "Run `openspec init --help` - displays new `--with-impl-guide` option"
  - "Generate spec with option - project.md contains directory mapping table"
