## ADDED Requirements

### Requirement: Java Project Detection
The init command SHALL automatically detect Java/Spring Boot projects and select appropriate scanning strategies.

#### Scenario: Detecting Maven projects
- **WHEN** `openspec init --scan-code` is executed in a directory containing `pom.xml`
- **THEN** identify the project as a Maven-based Java project
- **AND** parse `pom.xml` to extract dependencies and build configuration
- **AND** detect Spring Boot version from parent POM or dependency management
- **AND** extract Java version from `<java.version>` property or `<maven.compiler.source>`

#### Scenario: Detecting Gradle projects
- **WHEN** `openspec init --scan-code` is executed in a directory containing `build.gradle` or `build.gradle.kts`
- **THEN** identify the project as a Gradle-based Java project
- **AND** parse build file to extract dependencies
- **AND** support both Groovy DSL (`build.gradle`) and Kotlin DSL (`build.gradle.kts`)
- **AND** detect Spring Boot version from plugin configuration

#### Scenario: Detecting Spring Boot projects
- **WHEN** scanning Java source files
- **THEN** search for classes annotated with `@SpringBootApplication`
- **AND** identify the main application entry point
- **AND** extract package structure from the main class

### Requirement: Java Framework Detection
The init command SHALL detect Java frameworks and libraries used in the project.

#### Scenario: Detecting Spring frameworks
- **WHEN** analyzing project dependencies
- **THEN** identify the following Spring modules if present:
  - Spring Boot (spring-boot-starter-*)
  - Spring Web (spring-boot-starter-web)
  - Spring Data JPA (spring-boot-starter-data-jpa)
  - Spring Security (spring-boot-starter-security)
- **AND** extract version information for each detected module

#### Scenario: Detecting ORM frameworks
- **WHEN** analyzing project dependencies
- **THEN** identify ORM frameworks:
  - MyBatis (mybatis-spring-boot-starter)
  - Hibernate/JPA (hibernate-core, spring-data-jpa)
  - MyBatis-Plus (mybatis-plus-boot-starter)
- **AND** record which ORM is in use

#### Scenario: Detecting databases
- **WHEN** analyzing project dependencies
- **THEN** identify database drivers:
  - MySQL (mysql-connector-java)
  - PostgreSQL (postgresql)
  - Oracle (ojdbc)
  - MongoDB (spring-boot-starter-data-mongodb)
  - Redis (spring-boot-starter-data-redis)

### Requirement: Java Code Scanning
The init command SHALL scan Java source files to extract code structure and metadata.

#### Scenario: Scanning Entity classes
- **WHEN** scanning Java files with `@Entity` or `@Table` annotations
- **THEN** extract the following information:
  - Class name and table name
  - Package path
  - All fields with their Java types
  - Field annotations (`@Column`, `@Id`, `@GeneratedValue`)
  - Field constraints (nullable, unique, length)
  - Relationship annotations (`@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@OneToOne`)
  - Cascade types and fetch strategies

#### Scenario: Scanning Controller classes
- **WHEN** scanning Java files with `@RestController` or `@Controller` annotations
- **THEN** extract the following information:
  - Controller class name and base path from `@RequestMapping`
  - All request mapping methods with:
    - HTTP method (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`)
    - Route path
    - Request parameters (`@RequestParam`, `@PathVariable`, `@RequestBody`)
    - Return type
    - JavaDoc comments
  - Authorization annotations (`@PreAuthorize`, `@Secured`)

#### Scenario: Scanning Service classes
- **WHEN** scanning Java files with `@Service` annotation
- **THEN** extract the following information:
  - Service class name and package
  - Public methods with:
    - Method name
    - Parameters (type and name)
    - Return type
    - JavaDoc documentation
  - Transaction annotations (`@Transactional` and its attributes)
  - Injected dependencies (constructor or field injection)

#### Scenario: Scanning Repository interfaces
- **WHEN** scanning Java interfaces extending `JpaRepository`, `CrudRepository`, or marked with `@Repository`
- **THEN** extract the following information:
  - Repository interface name
  - Generic type parameters (entity type and ID type)
  - Custom query methods
  - `@Query` annotations with JPQL or native SQL

#### Scenario: Scanning DTO classes
- **WHEN** scanning Java classes in `dto`, `vo`, or `request/response` packages
- **THEN** extract the following information:
  - Class name and package
  - All fields with their types
  - Validation annotations (`@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Pattern`)
  - Lombok annotations (`@Data`, `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`)

### Requirement: Java Project Documentation Generation
The init command SHALL generate comprehensive Markdown documentation for Java projects.

#### Scenario: Generating project overview
- **WHEN** scan completes for a Java project
- **THEN** generate project overview section including:
  - Project name (from pom.xml or build.gradle)
  - Technology stack summary (frameworks detected)
  - Java version
  - Spring Boot version (if applicable)
  - Build tool (Maven or Gradle)

#### Scenario: Generating architecture documentation
- **WHEN** generating Java project documentation
- **THEN** include architecture section with:
  - Layered architecture description (Controller/Service/Repository/Entity)
  - Package organization pattern (by layer or by module)
  - Dependency flow diagram (using Mermaid)
  - Directory structure table with purposes

#### Scenario: Generating API documentation
- **WHEN** Controller classes are scanned
- **THEN** generate API documentation table with columns:
  - HTTP Method
  - API Path
  - Function Description
  - Request Parameters
  - Response Format
  - Authentication Requirements
- **AND** group APIs by controller or functional module

#### Scenario: Generating data model documentation
- **WHEN** Entity classes are scanned
- **THEN** generate data model documentation including:
  - Entity relationship diagram (Mermaid ER diagram)
  - For each entity:
    - Table name
    - Field list table (field name, Java type, database type, constraints, description)
    - Relationships with other entities

#### Scenario: Generating code conventions documentation
- **WHEN** analyzing scanned code patterns
- **THEN** infer and document code conventions:
  - Naming conventions (class, method, variable, constant)
  - Annotation usage patterns
  - Exception handling patterns
  - Transaction management patterns
- **AND** provide code examples from scanned files

#### Scenario: Generating business logic documentation
- **WHEN** scanning Service classes with JavaDoc
- **THEN** extract and document business processes:
  - Core business flows (from method JavaDoc)
  - Validation logic
  - External service integrations
  - Transaction boundaries

### Requirement: Scan Progress Feedback
The init command SHALL provide real-time feedback during Java code scanning.

#### Scenario: Displaying scan progress
- **WHEN** scanning Java files
- **THEN** display progress indicators showing:
  - Current directory being scanned
  - Number of files scanned
  - Number of Entities, Controllers, Services discovered
- **AND** use ora spinner animation for visual feedback

#### Scenario: Displaying scan summary
- **WHEN** scan completes
- **THEN** display summary statistics:
  - Detected frameworks and versions
  - Code organization pattern
  - Total entities found
  - Total API endpoints found
  - Total service classes found
  - Lines of code (approximate)

### Requirement: Mixed Project Support
The init command SHALL handle projects containing both Java and TypeScript/JavaScript code.

#### Scenario: Detecting mixed projects
- **WHEN** both `pom.xml`/`build.gradle` and `package.json` exist
- **THEN** identify as a mixed project
- **AND** prompt user to choose primary language or scan both
- **AND** allow `--frameworks` parameter to specify which scanners to use

#### Scenario: Scanning mixed projects
- **WHEN** user chooses to scan both Java and TypeScript
- **THEN** run both Java scanner and TypeScript scanner
- **AND** merge results into a unified project documentation
- **AND** clearly label which sections apply to which language/framework
