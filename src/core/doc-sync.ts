import { promises as fs } from 'fs';
import path from 'path';
import { CodeScanner } from './code-scanner.js';
import type { ClassInfo } from './code-scanner.js';
import chalk from 'chalk';

/**
 * Documentation Sync System
 *
 * Tracks code changes and prompts documentation updates when:
 * 1. New classes are added
 * 2. Methods are modified
 * 3. Fields are changed
 * 4. Signatures are updated
 */

export interface DocSyncConfig {
  projectPath: string;
  docPath: string;
  ignorePatterns?: string[];
}

export interface CodeChange {
  type: 'added' | 'modified' | 'deleted';
  fileType: 'controller' | 'service' | 'entity' | 'dto' | 'repository' | 'other';
  filePath: string;
  className?: string;
  methodName?: string;
  timestamp: string;
}

export interface DocUpdateSuggestion {
  priority: 'high' | 'medium' | 'low';
  changes: CodeChange[];
  affectedDocs: string[];
  suggestion: string;
  command?: string;
}

/**
 * Main class for documentation synchronization
 */
export class DocSyncManager {
  private config: DocSyncConfig;
  private snapshotPath: string;
  private changesPath: string;

  constructor(config: DocSyncConfig) {
    this.config = config;
    this.snapshotPath = path.join(config.docPath, '.code-snapshot.json');
    this.changesPath = path.join(config.docPath, '.pending-changes.json');
  }

  /**
   * Scan code changes and generate documentation update suggestions
   */
  async scanAndSuggest(): Promise<DocUpdateSuggestion[]> {
    const suggestions: DocUpdateSuggestion[] = [];

    // 1. Load previous snapshot
    const previousSnapshot = await this.loadSnapshot();

    // 2. Scan current code
    const currentSnapshot = await this.scanCurrentCode();

    // 3. Compare and detect changes
    const changes = this.detectChanges(previousSnapshot, currentSnapshot);

    if (changes.length === 0) {
      console.log(chalk.green('✓ No code changes detected since last scan.'));
      return suggestions;
    }

    // 4. Group changes by type and priority
    const groupedChanges = this.groupChangesByPriority(changes);

    // 5. Generate suggestions
    for (const [priority, priorityChanges] of Object.entries(groupedChanges)) {
      const suggestion = this.generateSuggestion(priority as any, priorityChanges);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // 6. Save current snapshot
    await this.saveSnapshot(currentSnapshot);

    // 7. Save pending changes
    await this.savePendingChanges(changes);

    return suggestions;
  }

  /**
   * Display suggestions to the user
   */
  displaySuggestions(suggestions: DocUpdateSuggestion[]): void {
    if (suggestions.length === 0) {
      console.log(chalk.gray('No documentation updates needed.'));
      return;
    }

    console.log(chalk.bold('\n📋 Documentation Update Suggestions\n'));

    for (const suggestion of suggestions) {
      const priorityColor = suggestion.priority === 'high' ? chalk.red
        : suggestion.priority === 'medium' ? chalk.yellow
        : chalk.gray;

      console.log(priorityColor(`\n${suggestion.priority.toUpperCase()} PRIORITY`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(suggestion.suggestion);

      if (suggestion.affectedDocs.length > 0) {
        console.log(chalk.cyan('\nAffected documentation:'));
        for (const doc of suggestion.affectedDocs) {
          console.log(chalk.gray(`  • ${doc}`));
        }
      }

      if (suggestion.command) {
        console.log(chalk.cyan('\nSuggested command:'));
        console.log(chalk.gray(`  ${suggestion.command}`));
      }

      console.log('');
    }

    console.log(chalk.yellow('💡 Tip: Run `cainiaospec doc-sync --auto` to auto-update docs'));
  }

  /**
   * Auto-update documentation based on changes
   */
  async autoUpdate(): Promise<void> {
    const changes = await this.loadPendingChanges();

    if (changes.length === 0) {
      console.log(chalk.gray('No pending changes to sync.'));
      return;
    }

    console.log(chalk.cyan(`\n⟳ Syncing ${changes.length} change(s) to documentation...\n`));

    for (const change of changes) {
      await this.applyChange(change);
    }

    // Clear pending changes after successful sync
    await this.clearPendingChanges();

    console.log(chalk.green('\n✓ Documentation sync completed.'));
  }

  /**
   * Load previous code snapshot
   */
  private async loadSnapshot(): Promise<Map<string, ClassInfo>> {
    try {
      const content = await fs.readFile(this.snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }

  /**
   * Save current code snapshot
   */
  private async saveSnapshot(snapshot: Map<string, ClassInfo>): Promise<void> {
    const obj = Object.fromEntries(snapshot);
    await fs.mkdir(path.dirname(this.snapshotPath), { recursive: true });
    await fs.writeFile(this.snapshotPath, JSON.stringify(obj, null, 2));
  }

  /**
   * Load pending changes
   */
  private async loadPendingChanges(): Promise<CodeChange[]> {
    try {
      const content = await fs.readFile(this.changesPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Save pending changes
   */
  private async savePendingChanges(changes: CodeChange[]): Promise<void> {
    await fs.mkdir(path.dirname(this.changesPath), { recursive: true });
    await fs.writeFile(this.changesPath, JSON.stringify(changes, null, 2));
  }

  /**
   * Clear pending changes
   */
  private async clearPendingChanges(): Promise<void> {
    try {
      await fs.unlink(this.changesPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  /**
   * Scan current code to build snapshot
   */
  private async scanCurrentCode(): Promise<Map<string, ClassInfo>> {
    const scanner = new CodeScanner({
      rootDir: this.config.projectPath,
      includePatterns: ['**/*.java', '**/*.ts', '**/*.tsx'],
      excludePatterns: this.config.ignorePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    });

    const result = await scanner.scan();
    const snapshot = new Map<string, ClassInfo>();

    if (result.allClasses) {
      for (const cls of result.allClasses) {
        const key = this.getClassKey(cls);
        snapshot.set(key, cls);
      }
    }

    return snapshot;
  }

  /**
   * Get unique key for a class
   */
  private getClassKey(cls: ClassInfo): string {
    return `${cls.filePath}:${cls.name}`;
  }

  /**
   * Detect changes between snapshots
   */
  private detectChanges(
    previous: Map<string, ClassInfo>,
    current: Map<string, ClassInfo>
  ): CodeChange[] {
    const changes: CodeChange[] = [];
    const timestamp = new Date().toISOString();

    // Detect added classes
    for (const [key, cls] of current.entries()) {
      if (!previous.has(key)) {
        changes.push({
          type: 'added',
          fileType: cls.type as any,
          filePath: cls.filePath,
          className: cls.name,
          timestamp,
        });
      }
    }

    // Detect modified classes
    for (const [key, currentClass] of current.entries()) {
      const previousClass = previous.get(key);
      if (previousClass && this.isClassModified(previousClass, currentClass)) {
        changes.push({
          type: 'modified',
          fileType: currentClass.type as any,
          filePath: currentClass.filePath,
          className: currentClass.name,
          timestamp,
        });
      }
    }

    // Detect deleted classes
    for (const [key, cls] of previous.entries()) {
      if (!current.has(key)) {
        changes.push({
          type: 'deleted',
          fileType: cls.type as any,
          filePath: cls.filePath,
          className: cls.name,
          timestamp,
        });
      }
    }

    return changes;
  }

  /**
   * Check if a class has been modified
   */
  private isClassModified(prev: ClassInfo, curr: ClassInfo): boolean {
    // Check methods
    if (prev.methods.length !== curr.methods.length) return true;

    const prevMethodNames = new Set(prev.methods.map(m => m.name));
    const currMethodNames = new Set(curr.methods.map(m => m.name));

    for (const name of currMethodNames) {
      if (!prevMethodNames.has(name)) return true;
    }

    // Check fields
    if (prev.fields.length !== curr.fields.length) return true;

    const prevFieldNames = new Set(prev.fields.map(f => f.name));
    const currFieldNames = new Set(curr.fields.map(f => f.name));

    for (const name of currFieldNames) {
      if (!prevFieldNames.has(name)) return true;
    }

    return false;
  }

  /**
   * Group changes by priority
   */
  private groupChangesByPriority(changes: CodeChange[]): Record<string, CodeChange[]> {
    const grouped: Record<string, CodeChange[]> = {
      high: [],
      medium: [],
      low: [],
    };

    for (const change of changes) {
      // High priority: Controllers, Services changes
      if (['controller', 'service'].includes(change.fileType)) {
        grouped.high.push(change);
      }
      // Medium priority: Entities, DTOs changes
      else if (['entity', 'dto'].includes(change.fileType)) {
        grouped.medium.push(change);
      }
      // Low priority: Repositories, others
      else {
        grouped.low.push(change);
      }
    }

    return grouped;
  }

  /**
   * Generate documentation update suggestion
   */
  private generateSuggestion(
    priority: 'high' | 'medium' | 'low',
    changes: CodeChange[]
  ): DocUpdateSuggestion | null {
    if (changes.length === 0) return null;

    const added = changes.filter(c => c.type === 'added');
    const modified = changes.filter(c => c.type === 'modified');
    const deleted = changes.filter(c => c.type === 'deleted');

    let suggestion = '';
    const affectedDocs: string[] = [];

    if (added.length > 0) {
      suggestion += `**New Classes Added:** ${added.length}\n`;
      for (const change of added) {
        suggestion += `  • ${change.className || change.filePath}\n`;

        // Determine which docs need updating
        if (change.fileType === 'controller') {
          affectedDocs.push('cainiaospec/modules/*/controllers.md');
        } else if (change.fileType === 'service') {
          affectedDocs.push('cainiaospec/modules/*/services.md');
        } else if (change.fileType === 'entity' || change.fileType === 'dto') {
          affectedDocs.push('cainiaospec/modules/*/models.md');
        }
      }
    }

    if (modified.length > 0) {
      suggestion += `**Classes Modified:** ${modified.length}\n`;
      for (const change of modified) {
        suggestion += `  • ${change.className || change.filePath}\n`;
      }
    }

    if (deleted.length > 0) {
      suggestion += `**Classes Deleted:** ${deleted.length}\n`;
      for (const change of deleted) {
        suggestion += `  • ${change.className || change.filePath}\n`;
      }
    }

    return {
      priority,
      changes,
      affectedDocs: [...new Set(affectedDocs)],
      suggestion,
      command: this.generateUpdateCommand(changes),
    };
  }

  /**
   * Generate suggested command for updating docs
   */
  private generateUpdateCommand(changes: CodeChange[]): string {
    const modules = new Set<string>();

    for (const change of changes) {
      // Extract module name from file path
      const match = change.filePath.match(/modules[\/\\]([^\/\\]+)/);
      if (match) {
        modules.add(match[1]);
      }
    }

    if (modules.size > 0) {
      return `cainiaospec doc-sync --update ${Array.from(modules).join(',')}`;
    }

    return 'cainiaospec doc-sync --auto';
  }

  /**
   * Apply a single change to documentation
   */
  private async applyChange(change: CodeChange): Promise<void> {
    // Determine module and doc file
    const moduleMatch = change.filePath.match(/modules[\/\\]([^\/\\]+)/);
    const moduleName = moduleMatch ? moduleMatch[1] : 'default';

    let docFile = '';
    if (change.fileType === 'controller') {
      docFile = path.join(this.config.docPath, 'modules', moduleName, 'controllers.md');
    } else if (change.fileType === 'service') {
      docFile = path.join(this.config.docPath, 'modules', moduleName, 'services.md');
    } else if (change.fileType === 'entity' || change.fileType === 'dto') {
      docFile = path.join(this.config.docPath, 'modules', moduleName, 'models.md');
    } else if (change.fileType === 'repository') {
      docFile = path.join(this.config.docPath, 'modules', moduleName, 'mappers.md');
    }

    if (!docFile) return;

    // Update the doc file
    if (change.type === 'added') {
      await this.addDocEntry(docFile, change);
    } else if (change.type === 'modified') {
      await this.updateDocEntry(docFile, change);
    } else if (change.type === 'deleted') {
      await this.removeDocEntry(docFile, change);
    }

    console.log(chalk.gray(`  • Synced ${change.type} ${change.className || change.filePath}`));
  }

  /**
   * Add entry to documentation
   */
  private async addDocEntry(docFile: string, change: CodeChange): Promise<void> {
    try {
      await fs.mkdir(path.dirname(docFile), { recursive: true });

      let content = '';
      try {
        content = await fs.readFile(docFile, 'utf-8');
      } catch {
        // File doesn't exist, create new
        content = this.generateDocHeader(docFile);
      }

      // Add placeholder for new class
      const newEntry = `
## ${change.className}

<!-- AI_FILL_HERE: From ${change.filePath} -->
**File**: \`${change.filePath}\`
**Type**: \`${change.fileType}\`

**Description**: [AI补充: 此类的业务功能说明]

**Methods**:
<!-- AI_FILL_HERE: Extract methods from source -->

**Fields**:
<!-- AI_FILL_HERE: Extract fields from source -->

---
`;

      await fs.writeFile(docFile, content + newEntry);
    } catch (error: any) {
      console.warn(chalk.yellow(`  Warning: Could not add entry to ${docFile}: ${error.message}`));
    }
  }

  /**
   * Update existing entry in documentation
   */
  private async updateDocEntry(docFile: string, change: CodeChange): Promise<void> {
    try {
      let content = '';
      try {
        content = await fs.readFile(docFile, 'utf-8');
      } catch {
        return; // File doesn't exist, skip
      }

      // Add update marker
      const marker = `
<!-- 🔄 CODE_CHANGE_DETECTED: ${change.timestamp} -->
<!-- This section may need updating. Source: ${change.filePath} -->
`;

      if (change.className && content.includes(`## ${change.className}`)) {
        // Class section exists, add marker
        const updated = content.replace(
          new RegExp(`(## ${change.className}[\\s\\S]*?)(---|$)`),
          `$1${marker}\n$2`
        );
        await fs.writeFile(docFile, updated);
      }
    } catch (error: any) {
      console.warn(chalk.yellow(`  Warning: Could not update entry in ${docFile}: ${error.message}`));
    }
  }

  /**
   * Remove entry from documentation
   */
  private async removeDocEntry(docFile: string, change: CodeChange): Promise<void> {
    try {
      let content = '';
      try {
        content = await fs.readFile(docFile, 'utf-8');
      } catch {
        return; // File doesn't exist, skip
      }

      if (change.className) {
        // Remove class section
        const updated = content.replace(
          new RegExp(`## ${change.className}[\\s\\S]*?---\\n?`, 'g'),
          ''
        );
        await fs.writeFile(docFile, updated);
      }
    } catch (error: any) {
      console.warn(chalk.yellow(`  Warning: Could not remove entry from ${docFile}: ${error.message}`));
    }
  }

  /**
   * Generate documentation header for new file
   */
  private generateDocHeader(docFile: string): string {
    const fileName = path.basename(docFile, '.md');
    const title = fileName.charAt(0).toUpperCase() + fileName.slice(1);

    return `# ${title}

> Auto-generated from code changes

---
`;
  }
}

/**
 * CLI command for documentation synchronization
 */
export class DocSyncCommand {
  async execute(
    projectPath: string = '.',
    options: { auto?: boolean; update?: string } = {}
  ): Promise<void> {
    const docPath = path.join(projectPath, 'cainiaospec');

    // Check if cainiaospec directory exists
    try {
      await fs.access(docPath);
    } catch {
      throw new Error('No CainiaoSpec directory found. Run "cainiaospec init" first.');
    }

    const manager = new DocSyncManager({
      projectPath,
      docPath,
      ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/cainiaospec/**',
      ],
    });

    if (options.auto) {
      // Auto-update mode
      await manager.autoUpdate();
    } else if (options.update) {
      // Update specific modules
      console.log(`Updating docs for modules: ${options.update}`);
      await manager.autoUpdate();
    } else {
      // Scan and suggest mode
      const suggestions = await manager.scanAndSuggest();
      manager.displaySuggestions(suggestions);
    }
  }
}
