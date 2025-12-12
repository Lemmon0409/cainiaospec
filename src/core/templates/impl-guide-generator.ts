import { ScanResult, EntityInfo, ControllerInfo, ServiceInfo } from '../code-scanner.js';
import { FrameworkDetectionResult } from '../framework-detector.js';

export interface ImplGuideContext {
  scanResult: ScanResult;
  frameworks: FrameworkDetectionResult;
  projectRoot: string;
}

/**
 * Generate implementation guide sections for module specs
 */
export class ImplGuideGenerator {
  private context: ImplGuideContext;

  constructor(context: ImplGuideContext) {
    this.context = context;
  }

  /**
   * Generate complete implementation guide for a module
   */
  generateModuleGuide(moduleName: string): string {
    const sections: string[] = [];

    sections.push(this.generateHeader(moduleName));
    sections.push(this.generateDataModelSection(moduleName));
    sections.push(this.generateAPISection(moduleName));
    sections.push(this.generateBusinessLogicSection(moduleName));
    sections.push(this.generateImplementationChecklist(moduleName));

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Generate implementation guide for an entity
   */
  generateEntityGuide(entity: EntityInfo): string {
    const sections: string[] = [];

    sections.push(`### Implementation: ${entity.name} Entity\n`);
    sections.push(`**File:** \`${entity.filePath}\`\n`);

    if (entity.decorators.length > 0) {
      sections.push(`**Decorators:** ${entity.decorators.map(d => `@${d}`).join(', ')}\n`);
    }

    if (entity.fields.length > 0) {
      sections.push('**Fields:**');
      sections.push('| Field | Type | Decorators | Optional |');
      sections.push('|-------|------|-----------|----------|');
      entity.fields.forEach(field => {
        sections.push(
          `| ${field.name} | ${field.type} | ${field.decorators.map(d => `@${d}`).join(', ')} | ${field.optional ? 'Yes' : 'No'} |`
        );
      });
    }

    sections.push(this.generateEntityExample(entity));

    return sections.join('\n');
  }

  /**
   * Generate implementation guide for a controller
   */
  generateControllerGuide(controller: ControllerInfo): string {
    const sections: string[] = [];

    sections.push(`### Implementation: ${controller.name} Controller\n`);
    sections.push(`**File:** \`${controller.filePath}\`\n`);

    if (controller.routes.length > 0) {
      sections.push('**Routes:**');
      sections.push('| Method | Path | Handler |');
      sections.push('|--------|------|---------|');
      controller.routes.forEach(route => {
        sections.push(`| ${route.method} | ${route.path} | ${route.handler} |`);
      });
    }

    sections.push(this.generateControllerExample(controller));

    return sections.join('\n');
  }

  /**
   * Generate implementation guide for a service
   */
  generateServiceGuide(service: ServiceInfo): string {
    const sections: string[] = [];

    sections.push(`### Implementation: ${service.name} Service\n`);
    sections.push(`**File:** \`${service.filePath}\`\n`);

    if (service.methods.length > 0) {
      sections.push('**Methods:**');
      sections.push('| Method | Parameters | Return Type |');
      sections.push('|--------|-----------|-------------|');
      service.methods.forEach(method => {
        sections.push(
          `| ${method.name} | ${method.parameters.join(', ') || 'none'} | ${method.returnType || 'void'} |`
        );
      });
    }

    sections.push(this.generateServiceExample(service));

    return sections.join('\n');
  }

  private generateHeader(moduleName: string): string {
    return `## Implementation Guide: ${moduleName}\n\nThis section provides specific implementation details to help AI assistants generate accurate code.`;
  }

  private generateDataModelSection(moduleName: string): string {
    const entities = this.context.scanResult.entities.filter(e =>
      e.filePath.toLowerCase().includes(moduleName.toLowerCase())
    );

    if (entities.length === 0) {
      return '';
    }

    const sections: string[] = [`### Data Models\n`];
    entities.forEach(entity => {
      sections.push(this.generateEntityGuide(entity));
    });

    return sections.join('\n');
  }

  private generateAPISection(moduleName: string): string {
    const controllers = this.context.scanResult.controllers.filter(c =>
      c.filePath.toLowerCase().includes(moduleName.toLowerCase())
    );

    if (controllers.length === 0) {
      return '';
    }

    const sections: string[] = [`### API Endpoints\n`];
    controllers.forEach(controller => {
      sections.push(this.generateControllerGuide(controller));
    });

    return sections.join('\n');
  }

  private generateBusinessLogicSection(moduleName: string): string {
    const services = this.context.scanResult.services.filter(s =>
      s.filePath.toLowerCase().includes(moduleName.toLowerCase())
    );

    if (services.length === 0) {
      return '';
    }

    const sections: string[] = [`### Business Logic\n`];
    services.forEach(service => {
      sections.push(this.generateServiceGuide(service));
    });

    return sections.join('\n');
  }

  private generateImplementationChecklist(moduleName: string): string {
    return `### Implementation Checklist

When implementing changes to the ${moduleName} module:

- [ ] Update entity definitions in \`src/entities/\` or \`src/models/\`
- [ ] Update DTOs for request/response validation
- [ ] Update service methods with business logic
- [ ] Update controller routes and handlers
- [ ] Update repository methods if needed
- [ ] Add/update unit tests
- [ ] Update integration tests
- [ ] Update API documentation`;
  }

  private generateEntityExample(entity: EntityInfo): string {
    const hasTypeORM = this.context.frameworks.database?.includes('typeorm');
    const hasPrisma = this.context.frameworks.database?.includes('prisma');

    if (hasTypeORM) {
      return this.generateTypeORMEntityExample(entity);
    } else if (hasPrisma) {
      return this.generatePrismaEntityExample(entity);
    }

    return this.generateGenericEntityExample(entity);
  }

  private generateTypeORMEntityExample(entity: EntityInfo): string {
    const fields = entity.fields.map(f => 
      `  @Column(${f.optional ? '{ nullable: true }' : ''})\n  ${f.name}${f.optional ? '?' : ''}: ${f.type};`
    ).join('\n\n');

    return `\n**Example:**\n\`\`\`typescript
@Entity('${entity.name.toLowerCase()}s')
export class ${entity.name} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

${fields}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
\`\`\``;
  }

  private generatePrismaEntityExample(entity: EntityInfo): string {
    const fields = entity.fields.map(f => 
      `  ${f.name} ${f.type}${f.optional ? '?' : ''}`
    ).join('\n');

    return `\n**Example (Prisma Schema):**\n\`\`\`prisma
model ${entity.name} {
  id        String   @id @default(uuid())
${fields}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\``;
  }

  private generateGenericEntityExample(entity: EntityInfo): string {
    const fields = entity.fields.map(f => 
      `  ${f.name}${f.optional ? '?' : ''}: ${f.type};`
    ).join('\n');

    return `\n**Example:**\n\`\`\`typescript
export class ${entity.name} {
  id: string;
${fields}
  createdAt: Date;
  updatedAt: Date;
}
\`\`\``;
  }

  private generateControllerExample(controller: ControllerInfo): string {
    const hasNestJS = this.context.frameworks.backend?.includes('nestjs');
    const hasExpress = this.context.frameworks.backend?.includes('express');

    if (hasNestJS) {
      return this.generateNestJSControllerExample(controller);
    } else if (hasExpress) {
      return this.generateExpressControllerExample(controller);
    }

    return '';
  }

  private generateNestJSControllerExample(controller: ControllerInfo): string {
    const route = controller.routes[0];
    if (!route) return '';

    return `\n**Example:**\n\`\`\`typescript
@Controller('${controller.name.replace('Controller', '').toLowerCase()}')
export class ${controller.name} {
  constructor(private readonly service: ${controller.name.replace('Controller', 'Service')}) {}

  @${route.method.charAt(0) + route.method.slice(1).toLowerCase()}('${route.path}')
  async ${route.handler}(@Body() dto: CreateDto) {
    return this.service.${route.handler}(dto);
  }
}
\`\`\``;
  }

  private generateExpressControllerExample(controller: ControllerInfo): string {
    const route = controller.routes[0];
    if (!route) return '';

    return `\n**Example:**\n\`\`\`typescript
router.${route.method.toLowerCase()}('${route.path}', async (req, res, next) => {
  try {
    const result = await ${controller.name.replace('Controller', 'Service')}.${route.handler}(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
\`\`\``;
  }

  private generateServiceExample(service: ServiceInfo): string {
    const method = service.methods[0];
    if (!method) return '';

    const hasNestJS = this.context.frameworks.backend?.includes('nestjs');

    if (hasNestJS) {
      return `\n**Example:**\n\`\`\`typescript
@Injectable()
export class ${service.name} {
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
  ) {}

  async ${method.name}(${method.parameters.join(', ')}): Promise<${method.returnType || 'void'}> {
    // Implementation
  }
}
\`\`\``;
    }

    return `\n**Example:**\n\`\`\`typescript
export class ${service.name} {
  async ${method.name}(${method.parameters.join(', ')}): Promise<${method.returnType || 'void'}> {
    // Implementation
  }
}
\`\`\``;
  }
}

/**
 * Generate implementation guide from scan results and framework detection
 */
export function generateImplGuide(context: ImplGuideContext, moduleName: string): string {
  const generator = new ImplGuideGenerator(context);
  return generator.generateModuleGuide(moduleName);
}
