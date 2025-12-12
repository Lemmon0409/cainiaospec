import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface FrameworkDetectionResult {
  frameworks: string[];
  backend?: string[];
  frontend?: string[];
  database?: string[];
  testing?: string[];
}

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const FRAMEWORK_PATTERNS = {
  // Backend frameworks
  nestjs: ['@nestjs/core', '@nestjs/common'],
  express: ['express'],
  fastify: ['fastify'],
  koa: ['koa'],
  
  // Frontend frameworks
  react: ['react'],
  vue: ['vue'],
  angular: ['@angular/core'],
  svelte: ['svelte'],
  nextjs: ['next'],
  nuxt: ['nuxt'],
  
  // Database/ORM
  typeorm: ['typeorm'],
  prisma: ['@prisma/client', 'prisma'],
  mongoose: ['mongoose'],
  sequelize: ['sequelize'],
  knex: ['knex'],
  
  // Testing
  vitest: ['vitest'],
  jest: ['jest'],
  mocha: ['mocha'],
  cypress: ['cypress'],
  playwright: ['@playwright/test'],
};

const FRAMEWORK_CATEGORIES = {
  backend: ['nestjs', 'express', 'fastify', 'koa'],
  frontend: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt'],
  database: ['typeorm', 'prisma', 'mongoose', 'sequelize', 'knex'],
  testing: ['vitest', 'jest', 'mocha', 'cypress', 'playwright'],
};

/**
 * Detect frameworks used in a project by analyzing package.json
 */
export class FrameworkDetector {
  private projectRoot: string;
  private packageJson?: PackageJson;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect all frameworks used in the project
   */
  detect(): FrameworkDetectionResult {
    this.loadPackageJson();
    
    const allDependencies = this.getAllDependencies();
    const detectedFrameworks = this.detectFrameworks(allDependencies);
    
    return {
      frameworks: detectedFrameworks,
      backend: this.categorizeFrameworks(detectedFrameworks, 'backend'),
      frontend: this.categorizeFrameworks(detectedFrameworks, 'frontend'),
      database: this.categorizeFrameworks(detectedFrameworks, 'database'),
      testing: this.categorizeFrameworks(detectedFrameworks, 'testing'),
    };
  }

  /**
   * Check if a specific framework is used
   */
  hasFramework(framework: string): boolean {
    const result = this.detect();
    return result.frameworks.includes(framework.toLowerCase());
  }

  /**
   * Get frameworks by category
   */
  getFrameworksByCategory(category: keyof typeof FRAMEWORK_CATEGORIES): string[] {
    const result = this.detect();
    return this.categorizeFrameworks(result.frameworks, category);
  }

  private loadPackageJson(): void {
    const packagePath = join(this.projectRoot, 'package.json');
    
    if (!existsSync(packagePath)) {
      this.packageJson = {};
      return;
    }

    try {
      const content = readFileSync(packagePath, 'utf-8');
      this.packageJson = JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to parse package.json: ${error}`);
      this.packageJson = {};
    }
  }

  private getAllDependencies(): Set<string> {
    const deps = new Set<string>();
    
    if (this.packageJson?.dependencies) {
      Object.keys(this.packageJson.dependencies).forEach(dep => deps.add(dep));
    }
    
    if (this.packageJson?.devDependencies) {
      Object.keys(this.packageJson.devDependencies).forEach(dep => deps.add(dep));
    }
    
    return deps;
  }

  private detectFrameworks(dependencies: Set<string>): string[] {
    const detected: string[] = [];

    for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
      const hasFramework = patterns.some(pattern => dependencies.has(pattern));
      if (hasFramework) {
        detected.push(framework);
      }
    }

    return detected;
  }

  private categorizeFrameworks(
    frameworks: string[],
    category: keyof typeof FRAMEWORK_CATEGORIES
  ): string[] {
    const categoryFrameworks = FRAMEWORK_CATEGORIES[category];
    return frameworks.filter(fw => categoryFrameworks.includes(fw));
  }
}

/**
 * Detect frameworks in a project directory
 */
export function detectFrameworks(projectRoot: string): FrameworkDetectionResult {
  const detector = new FrameworkDetector(projectRoot);
  return detector.detect();
}
