## ADDED Requirements

### Requirement: Implementation Guide Mode
The init command SHALL support generating specs with implementation guidance to help AI assistants understand code structure and avoid hallucinations.

#### Scenario: Generating specs with implementation guidance
- **WHEN** user runs `openspec init --with-impl-guide`
- **THEN** generate enhanced project.md with directory structure mapping table
- **AND** include layered architecture dependency rules
- **AND** include framework usage conventions (decorators, dependency injection patterns)
- **AND** include file naming conventions for entities, DTOs, services, controllers
- **AND** provide code organization examples

#### Scenario: Generating specs without implementation guidance
- **WHEN** user runs `openspec init` without `--with-impl-guide` option
- **THEN** generate simple template with placeholders (existing behavior)
- **AND** maintain backward compatibility

### Requirement: Code Scanning Support
The init command SHALL support scanning existing code to extract implementation details automatically.

#### Scenario: Scanning existing codebase
- **WHEN** user runs `openspec init --scan-code`
- **THEN** scan project directory structure to identify code organization patterns
- **AND** detect frameworks used in the project (NestJS, Express, TypeORM, Prisma, etc.)
- **AND** extract entity definitions (class names, fields, types, decorators)
- **AND** extract API endpoints (routes, HTTP methods, handlers)
- **AND** analyze dependency relationships
- **AND** generate implementation mapping table from scan results

#### Scenario: Displaying scan results
- **WHEN** code scanning completes
- **THEN** display scan progress (directories and files being scanned)
- **AND** show detected frameworks and patterns
- **AND** provide scan summary (number of entities, API endpoints discovered)
- **AND** allow user to preview and confirm scan results

### Requirement: Framework-Specific Templates
The init command SHALL support framework-specific templates with code examples.

#### Scenario: Specifying frameworks explicitly
- **WHEN** user runs `openspec init --with-impl-guide --frameworks nestjs,typeorm`
- **THEN** use NestJS-specific templates for project structure
- **AND** include NestJS decorator usage examples (@Controller, @Injectable, @Module)
- **AND** include TypeORM entity definition examples (@Entity, @Column, @PrimaryGeneratedColumn)
- **AND** include NestJS dependency injection patterns
- **AND** include module registration examples

#### Scenario: Auto-detecting frameworks
- **WHEN** user runs `openspec init --scan-code`
- **THEN** detect frameworks from package.json dependencies
- **AND** automatically apply framework-specific templates
- **AND** fall back to generic TypeScript template if no framework detected

#### Scenario: Supported frameworks
- **WHEN** generating framework-specific templates
- **THEN** support the following frameworks:
  - NestJS: decorators, dependency injection, module registration
  - TypeORM: entity definitions, repository patterns
  - Express: route definitions, middleware usage
  - Prisma: schema definitions, query methods
- **AND** provide generic template for unsupported frameworks

### Requirement: Command Line Options for Implementation Guide
The init command SHALL accept additional options to control implementation guide generation.

#### Scenario: Using --with-impl-guide option
- **WHEN** user provides `--with-impl-guide` or `-g` option
- **THEN** generate specs with detailed implementation guidance
- **AND** include directory mapping tables
- **AND** include code organization conventions
- **AND** include code examples

#### Scenario: Using --scan-code option
- **WHEN** user provides `--scan-code` or `-s` option
- **THEN** scan existing codebase for implementation details
- **AND** extract metadata from code
- **AND** generate implementation mapping from scan results

#### Scenario: Using --frameworks option
- **WHEN** user provides `--frameworks <framework-list>` or `-f <framework-list>`
- **THEN** parse comma-separated framework names
- **AND** validate framework names against supported list
- **AND** apply framework-specific templates
- **AND** display error for unsupported frameworks

#### Scenario: Combining options
- **WHEN** user runs `openspec init --scan-code --with-impl-guide --frameworks nestjs`
- **THEN** scan code for framework detection and metadata extraction
- **AND** generate implementation guidance using scanned metadata
- **AND** apply NestJS-specific templates
- **AND** provide comprehensive implementation guide
