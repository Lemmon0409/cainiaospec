import { promises as fs } from 'fs';
import path from 'path';
import { select, confirm } from '@inquirer/prompts';
import { FileSystemUtils } from '../utils/file-system.js';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
} from './parsers/requirement-blocks.js';
import { CodeScanner } from './code-scanner.js';
import type { ClassInfo, ApiEndpoint } from './code-scanner.js';
import { generateModularDocs } from './templates/project-template.js';

interface SpecUpdate {
  source: string;
  target: string;
  exists: boolean;
}

export class ArchiveCommand {
  async execute(
    changeName?: string,
    options: { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean } = {}
  ): Promise<void> {
    const targetPath = '.';
    const changesDir = path.join(targetPath, 'openspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    const mainSpecsDir = path.join(targetPath, 'openspec', 'specs');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error("No CainiaoSpec changes directory found. Run 'cainiaospec init' first.");
    }

    // Get change name interactively if not provided
    if (!changeName) {
      const selectedChange = await this.selectChange(changesDir);
      if (!selectedChange) {
        console.log('No change selected. Aborting.');
        return;
      }
      changeName = selectedChange;
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.stat(changeDir);
      if (!stat.isDirectory()) {
        throw new Error(`Change '${changeName}' not found.`);
      }
    } catch {
      throw new Error(`Change '${changeName}' not found.`);
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (non-blocking unless strict mode desired in future)
      const changeFile = path.join(changeDir, 'proposal.md');
      try {
        await fs.access(changeFile);
        const changeReport = await validator.validateChange(changeFile);
        // Proposal validation is informative only (do not block archive)
        if (!changeReport.valid) {
          console.log(chalk.yellow(`\nProposal warnings in proposal.md (non-blocking):`));
          for (const issue of changeReport.issues) {
            const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
            console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
          }
        }
      } catch {
        // Change file doesn't exist, skip validation
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      let hasDeltaSpecs = false;
      try {
        const candidates = await fs.readdir(changeSpecsDir, { withFileTypes: true });
        for (const c of candidates) {
          if (c.isDirectory()) {
            try {
              const candidatePath = path.join(changeSpecsDir, c.name, 'spec.md');
              await fs.access(candidatePath);
              const content = await fs.readFile(candidatePath, 'utf-8');
              if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/m.test(content)) {
                hasDeltaSpecs = true;
                break;
              }
            } catch {}
          }
        }
      } catch {}
      if (hasDeltaSpecs) {
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          console.log(chalk.red(`\nValidation errors in change delta specs:`));
          for (const issue of deltaReport.issues) {
            if (issue.level === 'ERROR') {
              console.log(chalk.red(`  ✗ ${issue.message}`));
            } else if (issue.level === 'WARNING') {
              console.log(chalk.yellow(`  ⚠ ${issue.message}`));
            }
          }
        }
      }

      if (hasValidationErrors) {
        console.log(chalk.red('\nValidation failed. Please fix the errors before archiving.'));
        console.log(chalk.yellow('To skip validation (not recommended), use --no-validate flag.'));
        return;
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();
      
      if (!options.yes) {
        const proceed = await confirm({
          message: chalk.yellow('⚠️  WARNING: Skipping validation may archive invalid specs. Continue? (y/N)'),
          default: false
        });
        if (!proceed) {
          console.log('Archive cancelled.');
          return;
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  WARNING: Skipping validation may archive invalid specs.`));
      }
      
      console.log(chalk.yellow(`[${timestamp}] Validation skipped for change: ${changeName}`));
      console.log(chalk.yellow(`Affected files: ${changeDir}`));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName);
    const status = formatTaskStatus(progress);
    console.log(`Task status: ${status}`);

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (!options.yes) {
        const proceed = await confirm({
          message: `Warning: ${incompleteTasks} incomplete task(s) found. Continue?`,
          default: false
        });
        if (!proceed) {
          console.log('Archive cancelled.');
          return;
        }
      } else {
        console.log(`Warning: ${incompleteTasks} incomplete task(s) found. Continuing due to --yes flag.`);
      }
    }

    // Handle spec updates unless skipSpecs flag is set
    if (options.skipSpecs) {
      console.log('Skipping spec updates (--skip-specs flag provided).');
    } else {
      // Find specs to update
      const specUpdates = await this.findSpecUpdates(changeDir, mainSpecsDir);
      
      if (specUpdates.length > 0) {
        console.log('\nSpecs to update:');
        for (const update of specUpdates) {
          const status = update.exists ? 'update' : 'create';
          const capability = path.basename(path.dirname(update.target));
          console.log(`  ${capability}: ${status}`);
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          shouldUpdateSpecs = await confirm({
            message: 'Proceed with spec updates?',
            default: true
          });
          if (!shouldUpdateSpecs) {
            console.log('Skipping spec updates. Proceeding with archive.');
          }
        }

        if (shouldUpdateSpecs) {
          // Prepare all updates first (validation pass, no writes)
          const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
          try {
            for (const update of specUpdates) {
              const built = await this.buildUpdatedSpec(update, changeName!);
              prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
            }
          } catch (err: any) {
            console.log(String(err.message || err));
            console.log('Aborted. No files were changed.');
            return;
          }

          // All validations passed; pre-validate rebuilt full spec and then write files and display counts
          let totals = { added: 0, modified: 0, removed: 0, renamed: 0 };
          for (const p of prepared) {
            const specName = path.basename(path.dirname(p.update.target));
            if (!skipValidation) {
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                console.log(chalk.red(`\nValidation errors in rebuilt spec for ${specName} (will not write changes):`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                console.log('Aborted. No files were changed.');
                return;
              }
            }
            await this.writeUpdatedSpec(p.update, p.rebuilt, p.counts);
            totals.added += p.counts.added;
            totals.modified += p.counts.modified;
            totals.removed += p.counts.removed;
            totals.renamed += p.counts.renamed;
          }
          console.log(
            `Totals: + ${totals.added}, ~ ${totals.modified}, - ${totals.removed}, → ${totals.renamed}`
          );
          console.log('Specs updated successfully.');
        }
      }
    }

    // Create archive directory with date prefix
    const archiveName = `${this.getArchiveDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Check if archive already exists
    try {
      await fs.access(archivePath);
      throw new Error(`Archive '${archiveName}' already exists.`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Generate implementation summary before archiving
    await this.generateImplementationSummary(changeDir, changeName!);

    // Update project documentation with new changes
    if (!options.skipSpecs) {
      await this.updateProjectDocumentation(changeDir, changeName!);
    }

    // Create archive directory if needed
    await fs.mkdir(archiveDir, { recursive: true });

    // Move change to archive
    await fs.rename(changeDir, archivePath);
    
    console.log(`Change '${changeName}' archived as '${archiveName}'.`);
  }

  private async selectChange(changesDir: string): Promise<string | null> {
    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();

    if (changeDirs.length === 0) {
      console.log('No active changes found.');
      return null;
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id);
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: 'Select a change to archive',
        choices
      });
      return answer;
    } catch (error) {
      // User cancelled (Ctrl+C)
      return null;
    }
  }

  // Deprecated: replaced by shared task-progress utilities
  private async checkIncompleteTasks(_tasksPath: string): Promise<number> {
    return 0;
  }

  private async findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]> {
    const updates: SpecUpdate[] = [];
    const changeSpecsDir = path.join(changeDir, 'specs');

    try {
      const entries = await fs.readdir(changeSpecsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const specFile = path.join(changeSpecsDir, entry.name, 'spec.md');
          const targetFile = path.join(mainSpecsDir, entry.name, 'spec.md');
          
          try {
            await fs.access(specFile);
            
            // Check if target exists
            let exists = false;
            try {
              await fs.access(targetFile);
              exists = true;
            } catch {
              exists = false;
            }

            updates.push({
              source: specFile,
              target: targetFile,
              exists
            });
          } catch {
            // Source spec doesn't exist, skip
          }
        }
      }
    } catch {
      // No specs directory in change
    }

    return updates;
  }

  private async buildUpdatedSpec(update: SpecUpdate, changeName: string): Promise<{ rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> {
    // Read change spec content (delta-format expected)
    const changeContent = await fs.readFile(update.source, 'utf-8');

    // Parse deltas from the change spec file
    const plan = parseDeltaSpec(changeContent);
    const specName = path.basename(path.dirname(update.target));

    // Pre-validate duplicates within sections
    const addedNames = new Set<string>();
    for (const add of plan.added) {
      const name = normalizeRequirementName(add.name);
      if (addedNames.has(name)) {
        throw new Error(
          `${specName} validation failed - duplicate requirement in ADDED for header "### Requirement: ${add.name}"`
        );
      }
      addedNames.add(name);
    }
    const modifiedNames = new Set<string>();
    for (const mod of plan.modified) {
      const name = normalizeRequirementName(mod.name);
      if (modifiedNames.has(name)) {
        throw new Error(
          `${specName} validation failed - duplicate requirement in MODIFIED for header "### Requirement: ${mod.name}"`
        );
      }
      modifiedNames.add(name);
    }
    const removedNamesSet = new Set<string>();
    for (const rem of plan.removed) {
      const name = normalizeRequirementName(rem);
      if (removedNamesSet.has(name)) {
        throw new Error(
          `${specName} validation failed - duplicate requirement in REMOVED for header "### Requirement: ${rem}"`
        );
      }
      removedNamesSet.add(name);
    }
    const renamedFromSet = new Set<string>();
    const renamedToSet = new Set<string>();
    for (const { from, to } of plan.renamed) {
      const fromNorm = normalizeRequirementName(from);
      const toNorm = normalizeRequirementName(to);
      if (renamedFromSet.has(fromNorm)) {
        throw new Error(
          `${specName} validation failed - duplicate FROM in RENAMED for header "### Requirement: ${from}"`
        );
      }
      if (renamedToSet.has(toNorm)) {
        throw new Error(
          `${specName} validation failed - duplicate TO in RENAMED for header "### Requirement: ${to}"`
        );
      }
      renamedFromSet.add(fromNorm);
      renamedToSet.add(toNorm);
    }

    // Pre-validate cross-section conflicts
    const conflicts: Array<{ name: string; a: string; b: string }> = [];
    for (const n of modifiedNames) {
      if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
      if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
    }
    for (const n of addedNames) {
      if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'ADDED', b: 'REMOVED' });
    }
    // Renamed interplay: MODIFIED must reference the NEW header, not FROM
    for (const { from, to } of plan.renamed) {
      const fromNorm = normalizeRequirementName(from);
      const toNorm = normalizeRequirementName(to);
      if (modifiedNames.has(fromNorm)) {
        throw new Error(
          `${specName} validation failed - when a rename exists, MODIFIED must reference the NEW header "### Requirement: ${to}"`
        );
      }
      // Detect ADDED colliding with a RENAMED TO
      if (addedNames.has(toNorm)) {
        throw new Error(
          `${specName} validation failed - RENAMED TO header collides with ADDED for "### Requirement: ${to}"`
        );
      }
    }
    if (conflicts.length > 0) {
      const c = conflicts[0];
      throw new Error(
        `${specName} validation failed - requirement present in multiple sections (${c.a} and ${c.b}) for header "### Requirement: ${c.name}"`
      );
    }
    const hasAnyDelta = (plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length) > 0;
    if (!hasAnyDelta) {
      throw new Error(
        `Delta parsing found no operations for ${path.basename(path.dirname(update.source))}. ` +
        `Provide ADDED/MODIFIED/REMOVED/RENAMED sections in change spec.`
      );
    }

    // Load or create base target content
    let targetContent: string;
    try {
      targetContent = await fs.readFile(update.target, 'utf-8');
    } catch {
      // Target spec does not exist; only ADDED operations are permitted
      if (plan.modified.length > 0 || plan.removed.length > 0 || plan.renamed.length > 0) {
        throw new Error(
          `${specName}: target spec does not exist; only ADDED requirements are allowed for new specs.`
        );
      }
      targetContent = this.buildSpecSkeleton(specName, changeName);
    }

    // Extract requirements section and build name->block map
    const parts = extractRequirementsSection(targetContent);
    const nameToBlock = new Map<string, RequirementBlock>();
    for (const block of parts.bodyBlocks) {
      nameToBlock.set(normalizeRequirementName(block.name), block);
    }

    // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED
    // RENAMED
    for (const r of plan.renamed) {
      const from = normalizeRequirementName(r.from);
      const to = normalizeRequirementName(r.to);
      if (!nameToBlock.has(from)) {
        throw new Error(
          `${specName} RENAMED failed for header "### Requirement: ${r.from}" - source not found`
        );
      }
      if (nameToBlock.has(to)) {
        throw new Error(
          `${specName} RENAMED failed for header "### Requirement: ${r.to}" - target already exists`
        );
      }
      const block = nameToBlock.get(from)!;
      const newHeader = `### Requirement: ${to}`;
      const rawLines = block.raw.split('\n');
      rawLines[0] = newHeader;
      const renamedBlock: RequirementBlock = {
        headerLine: newHeader,
        name: to,
        raw: rawLines.join('\n'),
      };
      nameToBlock.delete(from);
      nameToBlock.set(to, renamedBlock);
    }

    // REMOVED
    for (const name of plan.removed) {
      const key = normalizeRequirementName(name);
      if (!nameToBlock.has(key)) {
        throw new Error(
          `${specName} REMOVED failed for header "### Requirement: ${name}" - not found`
        );
      }
      nameToBlock.delete(key);
    }

    // MODIFIED
    for (const mod of plan.modified) {
      const key = normalizeRequirementName(mod.name);
      if (!nameToBlock.has(key)) {
        throw new Error(
          `${specName} MODIFIED failed for header "### Requirement: ${mod.name}" - not found`
        );
      }
      // Replace block with provided raw (ensure header line matches key)
      const modHeaderMatch = mod.raw.split('\n')[0].match(/^###\s*Requirement:\s*(.+)\s*$/);
      if (!modHeaderMatch || normalizeRequirementName(modHeaderMatch[1]) !== key) {
        throw new Error(
          `${specName} MODIFIED failed for header "### Requirement: ${mod.name}" - header mismatch in content`
        );
      }
      nameToBlock.set(key, mod);
    }

    // ADDED
    for (const add of plan.added) {
      const key = normalizeRequirementName(add.name);
      if (nameToBlock.has(key)) {
        throw new Error(
          `${specName} ADDED failed for header "### Requirement: ${add.name}" - already exists`
        );
      }
      nameToBlock.set(key, add);
    }

    // Duplicates within resulting map are implicitly prevented by key uniqueness.

    // Recompose requirements section preserving original ordering where possible
    const keptOrder: RequirementBlock[] = [];
    const seen = new Set<string>();
    for (const block of parts.bodyBlocks) {
      const key = normalizeRequirementName(block.name);
      const replacement = nameToBlock.get(key);
      if (replacement) {
        keptOrder.push(replacement);
        seen.add(key);
      }
    }
    // Append any newly added that were not in original order
    for (const [key, block] of nameToBlock.entries()) {
      if (!seen.has(key)) {
        keptOrder.push(block);
      }
    }

    const reqBody = [
      parts.preamble && parts.preamble.trim() ? parts.preamble.trimEnd() : ''
    ]
      .filter(Boolean)
      .concat(keptOrder.map(b => b.raw))
      .join('\n\n')
      .trimEnd();

    const rebuilt = [
      parts.before.trimEnd(),
      parts.headerLine,
      reqBody,
      parts.after
    ]
      .filter((s, idx) => !(idx === 0 && s === ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

    return {
      rebuilt,
      counts: {
        added: plan.added.length,
        modified: plan.modified.length,
        removed: plan.removed.length,
        renamed: plan.renamed.length,
      }
    };
  }

  private async writeUpdatedSpec(update: SpecUpdate, rebuilt: string, counts: { added: number; modified: number; removed: number; renamed: number }): Promise<void> {
    // Create target directory if needed
    const targetDir = path.dirname(update.target);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(update.target, rebuilt);

    const specName = path.basename(path.dirname(update.target));
    console.log(`Applying changes to openspec/specs/${specName}/spec.md:`);
    if (counts.added) console.log(`  + ${counts.added} added`);
    if (counts.modified) console.log(`  ~ ${counts.modified} modified`);
    if (counts.removed) console.log(`  - ${counts.removed} removed`);
    if (counts.renamed) console.log(`  → ${counts.renamed} renamed`);
  }

  private buildSpecSkeleton(specFolderName: string, changeName: string): string {
    const titleBase = specFolderName;
    return `# ${titleBase} Specification

## Purpose
TBD - created by archiving change ${changeName}. Update Purpose after archive.

## Requirements
`;
  }

  private getArchiveDate(): string {
    // Returns date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Generate an implementation summary document before archiving
   * This document contains detailed information about what was implemented,
   * including APIs, classes, and business logic changes.
   */
  private async generateImplementationSummary(changeDir: string, changeName: string): Promise<void> {
    const summaryPath = path.join(changeDir, 'implementation-summary.md');
    
    // Read proposal.md if exists
    let proposalContent = '';
    try {
      proposalContent = await fs.readFile(path.join(changeDir, 'proposal.md'), 'utf-8');
    } catch {
      // No proposal.md
    }

    // Read tasks.md if exists
    let tasksContent = '';
    try {
      tasksContent = await fs.readFile(path.join(changeDir, 'tasks.md'), 'utf-8');
    } catch {
      // No tasks.md
    }

    // Parse tasks to extract implementation details
    const taskAnalysis = this.analyzeTasksContent(tasksContent);
    const proposalAnalysis = this.analyzeProposalContent(proposalContent);

    // Read delta specs to understand what requirements were added/modified
    const deltaSpecs = await this.collectDeltaSpecs(changeDir);

    // Generate the summary
    const summary = this.buildImplementationSummary(
      changeName,
      proposalAnalysis,
      taskAnalysis,
      deltaSpecs
    );

    // Write the summary
    await fs.writeFile(summaryPath, summary);
    console.log(`Generated implementation summary: implementation-summary.md`);
  }

  private analyzeTasksContent(tasksContent: string): TaskAnalysis {
    const analysis: TaskAnalysis = {
      totalTasks: 0,
      completedTasks: 0,
      files: {
        created: [],
        modified: [],
        deleted: [],
      },
      apis: [],
      classes: [],
      businessLogic: [],
    };

    if (!tasksContent) return analysis;

    const lines = tasksContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count tasks
      if (line.match(/^\s*-\s*\[[ x]\]/)) {
        analysis.totalTasks++;
        if (line.includes('[x]')) {
          analysis.completedTasks++;
        }
      }

      // Extract file paths
      const fileMatch = line.match(/File:\s*`([^`]+)`/);
      if (fileMatch) {
        const filePath = fileMatch[1];
        // Determine if create/modify based on context
        const prevLine = i > 0 ? lines[i - 1] : '';
        if (prevLine.toLowerCase().includes('create') || prevLine.toLowerCase().includes('add')) {
          if (!analysis.files.created.includes(filePath)) {
            analysis.files.created.push(filePath);
          }
        } else if (prevLine.toLowerCase().includes('delete') || prevLine.toLowerCase().includes('remove')) {
          if (!analysis.files.deleted.includes(filePath)) {
            analysis.files.deleted.push(filePath);
          }
        } else {
          if (!analysis.files.modified.includes(filePath) && !analysis.files.created.includes(filePath)) {
            analysis.files.modified.push(filePath);
          }
        }
      }

      // Extract API endpoints
      const apiMatch = line.match(/API:\s*`([^`]+)`\s*->\s*`([^`]+)`/);
      if (apiMatch) {
        analysis.apis.push({
          endpoint: apiMatch[1],
          handler: apiMatch[2],
        });
      }

      // Alternative API format: HTTP method + path
      const httpMatch = line.match(/`(GET|POST|PUT|DELETE|PATCH)\s+([^`]+)`/);
      if (httpMatch && !apiMatch) {
        analysis.apis.push({
          endpoint: `${httpMatch[1]} ${httpMatch[2]}`,
          handler: '',
        });
      }

      // Extract class references
      const classMatch = line.match(/Class:\s*`([^`]+)`/);
      if (classMatch) {
        const className = classMatch[1];
        if (!analysis.classes.some(c => c.name === className)) {
          analysis.classes.push({
            name: className,
            file: '',
          });
        }
      }

      // Extract method references
      const methodMatch = line.match(/Method:\s*`([^`]+)`/);
      if (methodMatch) {
        analysis.businessLogic.push(methodMatch[1]);
      }

      // Extract business rules
      if (line.includes('Business Rules:')) {
        // Collect subsequent indented lines as business rules
        for (let j = i + 1; j < lines.length; j++) {
          const ruleLine = lines[j];
          if (ruleLine.match(/^\s+-\s+/)) {
            const rule = ruleLine.replace(/^\s+-\s+/, '').trim();
            if (rule) {
              analysis.businessLogic.push(rule);
            }
          } else if (!ruleLine.match(/^\s+/)) {
            break;
          }
        }
      }
    }

    return analysis;
  }

  private analyzeProposalContent(proposalContent: string): ProposalAnalysis {
    const analysis: ProposalAnalysis = {
      title: '',
      why: '',
      whatChanges: [],
      affectedSpecs: [],
      affectedCode: [],
    };

    if (!proposalContent) return analysis;

    // Extract title
    const titleMatch = proposalContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      analysis.title = titleMatch[1].replace(/^Change:\s*/i, '').trim();
    }

    // Extract why section
    const whyMatch = proposalContent.match(/##\s+Why[\s\S]*?(?=##|$)/i);
    if (whyMatch) {
      analysis.why = whyMatch[0].replace(/##\s+Why\s*/i, '').trim().split('\n')[0];
    }

    // Extract what changes
    const whatMatch = proposalContent.match(/##\s+What Changes[\s\S]*?(?=##|$)/i);
    if (whatMatch) {
      const lines = whatMatch[0].split('\n');
      for (const line of lines) {
        if (line.match(/^\s*-\s+/)) {
          analysis.whatChanges.push(line.replace(/^\s*-\s+/, '').trim());
        }
      }
    }

    // Extract affected specs
    const specMatches = proposalContent.matchAll(/specs\/([\w-]+)/g);
    for (const match of specMatches) {
      if (!analysis.affectedSpecs.includes(match[1])) {
        analysis.affectedSpecs.push(match[1]);
      }
    }

    // Extract affected code paths
    const codeMatches = proposalContent.matchAll(/`(src\/[^`]+)`/g);
    for (const match of codeMatches) {
      if (!analysis.affectedCode.includes(match[1])) {
        analysis.affectedCode.push(match[1]);
      }
    }

    return analysis;
  }

  private async collectDeltaSpecs(changeDir: string): Promise<DeltaSpecSummary[]> {
    const summaries: DeltaSpecSummary[] = [];
    const specsDir = path.join(changeDir, 'specs');

    try {
      const entries = await fs.readdir(specsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const specPath = path.join(specsDir, entry.name, 'spec.md');
        try {
          const content = await fs.readFile(specPath, 'utf-8');
          const delta = parseDeltaSpec(content);
          
          summaries.push({
            capability: entry.name,
            added: delta.added.map(r => r.name),
            modified: delta.modified.map(r => r.name),
            removed: delta.removed,
            renamed: delta.renamed.map(r => `${r.from} -> ${r.to}`),
          });
        } catch {
          // Skip if can't read
        }
      }
    } catch {
      // No specs directory
    }

    return summaries;
  }

  private buildImplementationSummary(
    changeName: string,
    proposal: ProposalAnalysis,
    tasks: TaskAnalysis,
    deltas: DeltaSpecSummary[]
  ): string {
    const sections: string[] = [];
    const archiveDate = this.getArchiveDate();

    // Header
    sections.push(`# Implementation Summary: ${changeName}`);
    sections.push('');
    sections.push(`**Archived:** ${archiveDate}`);
    sections.push(`**Tasks Completed:** ${tasks.completedTasks}/${tasks.totalTasks}`);
    sections.push('');

    // Overview from proposal
    if (proposal.title) {
      sections.push(`## Overview`);
      sections.push('');
      sections.push(`**Change:** ${proposal.title}`);
      if (proposal.why) {
        sections.push(`**Reason:** ${proposal.why}`);
      }
      sections.push('');
    }

    // What Changed
    if (proposal.whatChanges.length > 0) {
      sections.push(`## What Changed`);
      sections.push('');
      for (const change of proposal.whatChanges) {
        sections.push(`- ${change}`);
      }
      sections.push('');
    }

    // Files Changed
    if (tasks.files.created.length > 0 || tasks.files.modified.length > 0 || tasks.files.deleted.length > 0) {
      sections.push(`## Files Changed`);
      sections.push('');
      
      if (tasks.files.created.length > 0) {
        sections.push(`### New Files`);
        sections.push('');
        sections.push(`| File Path | Type |`);
        sections.push(`|-----------|------|`);
        for (const file of tasks.files.created) {
          const type = this.inferFileType(file);
          sections.push(`| \`${file}\` | ${type} |`);
        }
        sections.push('');
      }

      if (tasks.files.modified.length > 0) {
        sections.push(`### Modified Files`);
        sections.push('');
        for (const file of tasks.files.modified) {
          sections.push(`- \`${file}\``);
        }
        sections.push('');
      }

      if (tasks.files.deleted.length > 0) {
        sections.push(`### Deleted Files`);
        sections.push('');
        for (const file of tasks.files.deleted) {
          sections.push(`- \`${file}\``);
        }
        sections.push('');
      }
    }

    // API Changes
    if (tasks.apis.length > 0) {
      sections.push(`## API Endpoints Added/Modified`);
      sections.push('');
      sections.push(`| Endpoint | Handler |`);
      sections.push(`|----------|---------|`);
      for (const api of tasks.apis) {
        sections.push(`| \`${api.endpoint}\` | ${api.handler ? `\`${api.handler}\`` : '-'} |`);
      }
      sections.push('');
    }

    // Classes Added/Modified
    if (tasks.classes.length > 0) {
      sections.push(`## Classes Implemented`);
      sections.push('');
      for (const cls of tasks.classes) {
        sections.push(`- \`${cls.name}\`${cls.file ? ` in \`${cls.file}\`` : ''}`);
      }
      sections.push('');
    }

    // Business Logic
    if (tasks.businessLogic.length > 0) {
      sections.push(`## Business Logic`);
      sections.push('');
      for (const logic of tasks.businessLogic) {
        sections.push(`- ${logic}`);
      }
      sections.push('');
    }

    // Spec Changes
    if (deltas.length > 0) {
      sections.push(`## Specification Changes`);
      sections.push('');
      
      for (const delta of deltas) {
        sections.push(`### ${delta.capability}`);
        sections.push('');
        
        if (delta.added.length > 0) {
          sections.push(`**Added Requirements:**`);
          for (const req of delta.added) {
            sections.push(`- ${req}`);
          }
          sections.push('');
        }

        if (delta.modified.length > 0) {
          sections.push(`**Modified Requirements:**`);
          for (const req of delta.modified) {
            sections.push(`- ${req}`);
          }
          sections.push('');
        }

        if (delta.removed.length > 0) {
          sections.push(`**Removed Requirements:**`);
          for (const req of delta.removed) {
            sections.push(`- ${req}`);
          }
          sections.push('');
        }

        if (delta.renamed.length > 0) {
          sections.push(`**Renamed Requirements:**`);
          for (const req of delta.renamed) {
            sections.push(`- ${req}`);
          }
          sections.push('');
        }
      }
    }

    // Related Documentation
    sections.push(`## Related Documentation`);
    sections.push('');
    sections.push(`- [Proposal](./proposal.md)`);
    sections.push(`- [Tasks](./tasks.md)`);
    if (deltas.length > 0) {
      sections.push(`- Spec Deltas:`);
      for (const delta of deltas) {
        sections.push(`  - [${delta.capability}](./specs/${delta.capability}/spec.md)`);
      }
    }
    sections.push('');

    return sections.join('\n');
  }

  private inferFileType(filePath: string): string {
    if (filePath.includes('.entity.') || filePath.includes('.model.')) return 'Entity';
    if (filePath.includes('.controller.')) return 'Controller';
    if (filePath.includes('.service.')) return 'Service';
    if (filePath.includes('.repository.')) return 'Repository';
    if (filePath.includes('.dto.')) return 'DTO';
    if (filePath.includes('.test.') || filePath.includes('.spec.')) return 'Test';
    if (filePath.includes('.middleware.')) return 'Middleware';
    if (filePath.includes('.guard.')) return 'Guard';
    if (filePath.includes('.module.')) return 'Module';
    if (filePath.includes('.config.')) return 'Config';
    return 'Other';
  }

  /**
   * Update project documentation with new changes from this archive
   * This merges the new code changes into project.md and module docs
   */
  private async updateProjectDocumentation(changeDir: string, changeName: string): Promise<void> {
    const spinner = chalk.cyan('⟳');
    console.log(`${spinner} Updating project documentation with changes from ${changeName}...`);
    
    try {
      // 1. Read tasks.md to get the list of files that were modified/created
      const tasksPath = path.join(changeDir, 'tasks.md');
      const tasksContent = await fs.readFile(tasksPath, 'utf-8').catch(() => '');
      const taskAnalysis = this.analyzeTasksContent(tasksContent);
      
      // Get all Java/TS/JS files from created and modified
      const codeFiles = [...taskAnalysis.files.created, ...taskAnalysis.files.modified]
        .filter(file => {
          const ext = path.extname(file);
          return ['.java', '.ts', '.js', '.tsx', '.jsx'].includes(ext);
        });
      
      if (codeFiles.length === 0) {
        console.log(chalk.gray('  No code files to update in documentation.'));
        return;
      }
      
      console.log(chalk.gray(`  Found ${codeFiles.length} code file(s) to scan...`));
      
      // 2. Scan the modified/created files to extract new class information
      const newClasses = await this.scanChangedFiles(codeFiles);
      
      if (newClasses.length === 0) {
        console.log(chalk.gray('  No new classes found to update.'));
        return;
      }
      
      console.log(chalk.gray(`  Extracted ${newClasses.length} class(es) from changes...`));
      
      // 3. Read existing project documentation
      const openspecDir = path.join('.', 'openspec');
      const projectMdPath = path.join(openspecDir, 'project.md');
      const modulesDir = path.join(openspecDir, 'modules');
      
      // Check if we have modular docs or single project.md
      let hasModularDocs = false;
      try {
        const modulesStat = await fs.stat(modulesDir);
        hasModularDocs = modulesStat.isDirectory();
      } catch {
        hasModularDocs = false;
      }
      
      // 4. Merge new classes with existing documentation
      if (hasModularDocs) {
        await this.updateModularDocs(modulesDir, newClasses, changeName);
      } else {
        await this.updateSingleProjectDoc(projectMdPath, newClasses, changeName);
      }
      
      console.log(chalk.green(`✓ Project documentation updated successfully.`));
      
    } catch (error: any) {
      console.error(chalk.yellow(`Warning: Failed to update project documentation: ${error.message}`));
      console.log(chalk.gray('  This is not critical. Documentation can be manually updated.'));
    }
  }
  
  /**
   * Scan changed files and extract class information
   */
  private async scanChangedFiles(codeFiles: string[]): Promise<ClassInfo[]> {
    const classes: ClassInfo[] = [];
    
    for (const file of codeFiles) {
      try {
        // Resolve absolute path
        const absolutePath = path.isAbsolute(file) ? file : path.resolve('.', file);
        
        // Check if file exists
        try {
          await fs.access(absolutePath);
        } catch {
          // File might have been deleted or path is incorrect
          continue;
        }
        
        // Scan this single file
        const scanner = new CodeScanner({
          rootDir: path.dirname(absolutePath),
          includePatterns: [path.basename(absolutePath)],
          excludePatterns: [],
        });
        
        const result = await scanner.scan();
        
        // Add all classes found in this file
        if (result.allClasses && result.allClasses.length > 0) {
          classes.push(...result.allClasses);
        }
      } catch (error: any) {
        console.warn(chalk.gray(`  Warning: Failed to scan ${file}: ${error.message}`));
      }
    }
    
    return classes;
  }
  
  /**
   * Update modular documentation (modules/*.md)
   */
  private async updateModularDocs(modulesDir: string, newClasses: ClassInfo[], changeName: string): Promise<void> {
    // Group classes by module
    const classesByModule = new Map<string, ClassInfo[]>();
    
    for (const cls of newClasses) {
      const moduleName = this.inferModuleName(cls.filePath);
      if (!classesByModule.has(moduleName)) {
        classesByModule.set(moduleName, []);
      }
      classesByModule.get(moduleName)!.push(cls);
    }
    
    // Update each module doc
    for (const [moduleName, moduleClasses] of classesByModule.entries()) {
      const moduleMdPath = path.join(modulesDir, `${moduleName}.md`);
      
      try {
        // Read existing module doc if exists
        let existingContent = '';
        try {
          existingContent = await fs.readFile(moduleMdPath, 'utf-8');
        } catch {
          // Module doc doesn't exist, will create new one
        }
        
        // Merge new classes into existing doc
        const updatedContent = this.mergeClassesIntoModuleDoc(
          existingContent,
          moduleClasses,
          moduleName,
          changeName
        );
        
        // Write back
        await fs.writeFile(moduleMdPath, updatedContent);
        console.log(chalk.gray(`  Updated: openspec/modules/${moduleName}.md`));
        
      } catch (error: any) {
        console.warn(chalk.yellow(`  Warning: Failed to update module ${moduleName}: ${error.message}`));
      }
    }
  }
  
  /**
   * Update single project.md file
   */
  private async updateSingleProjectDoc(projectMdPath: string, newClasses: ClassInfo[], changeName: string): Promise<void> {
    try {
      // Read existing project.md
      let existingContent = '';
      try {
        existingContent = await fs.readFile(projectMdPath, 'utf-8');
      } catch {
        // project.md doesn't exist, will create new one
        existingContent = `# 项目上下文

## 项目目的
[描述项目的目的和目标]

## 技术栈
- Java
- Spring Boot

`;
      }
      
      // Merge new classes
      const updatedContent = this.mergeClassesIntoProjectDoc(
        existingContent,
        newClasses,
        changeName
      );
      
      // Write back
      await fs.writeFile(projectMdPath, updatedContent);
      console.log(chalk.gray(`  Updated: openspec/project.md`));
      
    } catch (error: any) {
      throw new Error(`Failed to update project.md: ${error.message}`);
    }
  }
  
  /**
   * Infer module name from file path
   * Example: src/modules/order/OrderService.java -> order
   */
  private inferModuleName(filePath: string): string {
    const parts = filePath.split('/');
    
    // Look for common module indicators
    const moduleIndex = parts.findIndex(p => 
      ['modules', 'module', 'domain', 'domains', 'service', 'services'].includes(p.toLowerCase())
    );
    
    if (moduleIndex !== -1 && moduleIndex + 1 < parts.length) {
      return parts[moduleIndex + 1];
    }
    
    // Fallback: use the directory name containing the file
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    return 'default';
  }
  
  /**
   * Merge new classes into module documentation
   */
  private mergeClassesIntoModuleDoc(
    existingContent: string,
    newClasses: ClassInfo[],
    moduleName: string,
    changeName: string
  ): string {
    // If no existing content, create new module doc
    if (!existingContent) {
      return this.generateNewModuleDoc(moduleName, newClasses, changeName);
    }
    
    // Parse existing classes from the doc
    const existingClasses = this.parseClassesFromModuleDoc(existingContent);
    
    // Merge: For each new class, either update existing or append
    for (const newClass of newClasses) {
      const existingIndex = existingClasses.findIndex(c => c.name === newClass.name);
      
      if (existingIndex !== -1) {
        // Update existing class (preserve user-added descriptions)
        existingClasses[existingIndex] = this.mergeClassInfo(
          existingClasses[existingIndex],
          newClass
        );
      } else {
        // Add new class
        existingClasses.push(newClass);
      }
    }
    
    // Rebuild the module doc with merged classes
    return this.rebuildModuleDoc(existingContent, existingClasses, moduleName);
  }
  
  /**
   * Merge new classes into project.md
   */
  private mergeClassesIntoProjectDoc(
    existingContent: string,
    newClasses: ClassInfo[],
    changeName: string
  ): string {
    // Add a section for the archived change if not exists
    if (!existingContent.includes('## 核心类')) {
      existingContent += '\n## 核心类\n\n';
    }
    
    // For each new class, append or update
    let updatedContent = existingContent;
    
    for (const cls of newClasses) {
      const classHeader = `### ${cls.name}`;
      
      if (updatedContent.includes(classHeader)) {
        // Class already exists - skip for now to avoid overwriting user descriptions
        // In future version, we could do smart merge
        continue;
      }
      
      // Add new class section
      const classSection = this.generateClassSection(cls);
      updatedContent += `\n${classSection}\n`;
    }
    
    return updatedContent;
  }
  
  /**
   * Generate a new module doc from scratch
   */
  private generateNewModuleDoc(moduleName: string, classes: ClassInfo[], changeName: string): string {
    const sections: string[] = [];
    
    sections.push(`# ${moduleName} 模块`);
    sections.push('');
    sections.push(`> 从变更 ${changeName} 自动生成`);
    sections.push('');
    sections.push('## 模块说明');
    sections.push('');
    sections.push('[AI 补充: 此模块的业务功能和职责]');
    sections.push('');
    
    // Group classes by type
    const controllers = classes.filter(c => c.type === 'controller');
    const services = classes.filter(c => c.type === 'service');
    const entities = classes.filter(c => c.type === 'entity');
    const others = classes.filter(c => !['controller', 'service', 'entity'].includes(c.type));
    
    if (controllers.length > 0) {
      sections.push('## Controllers');
      sections.push('');
      for (const cls of controllers) {
        sections.push(this.generateClassSection(cls));
      }
    }
    
    if (services.length > 0) {
      sections.push('## Services');
      sections.push('');
      for (const cls of services) {
        sections.push(this.generateClassSection(cls));
      }
    }
    
    if (entities.length > 0) {
      sections.push('## Entities');
      sections.push('');
      for (const cls of entities) {
        sections.push(this.generateClassSection(cls));
      }
    }
    
    if (others.length > 0) {
      sections.push('## 其他类');
      sections.push('');
      for (const cls of others) {
        sections.push(this.generateClassSection(cls));
      }
    }
    
    return sections.join('\n');
  }
  
  /**
   * Generate class section for documentation
   */
  private generateClassSection(cls: ClassInfo): string {
    const sections: string[] = [];
    
    sections.push(`### ${cls.name}`);
    sections.push('');
    sections.push(`**类型**: \`${cls.type}\``);
    sections.push(`**文件**: \`${cls.filePath}\``);
    
    if (cls.description) {
      sections.push('');
      sections.push(`**描述**: ${cls.description}`);
    } else {
      sections.push('');
      sections.push(`**描述**: [AI 补充: 此类的业务功能说明]`);
    }
    
    // Fields
    if (cls.fields && cls.fields.length > 0) {
      sections.push('');
      sections.push('**字段**:');
      sections.push('');
      sections.push('| 字段名 | 类型 | 说明 |');
      sections.push('|--------|------|------|');
      for (const field of cls.fields) {
        const desc = field.description || '-';
        sections.push(`| ${field.name} | \`${field.type}\` | ${desc} |`);
      }
    }
    
    // Methods
    if (cls.methods && cls.methods.length > 0) {
      sections.push('');
      sections.push('**方法**:');
      sections.push('');
      sections.push('| 方法名 | 参数 | 返回值 | 说明 |');
      sections.push('|--------|------|--------|------|');
      for (const method of cls.methods) {
        const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        const desc = method.description || method.businessLogic || '-';
        sections.push(`| \`${method.name}()\` | \`${params}\` | \`${method.returnType || 'void'}\` | ${desc} |`);
      }
    }
    
    sections.push('');
    
    return sections.join('\n');
  }
  
  /**
   * Parse existing classes from module doc (simple parsing)
   */
  private parseClassesFromModuleDoc(content: string): ClassInfo[] {
    // This is a simple implementation - just return empty for now
    // In a complete implementation, we would parse the markdown to extract class info
    // For now, we'll use append-only strategy
    return [];
  }
  
  /**
   * Merge class info, preserving user descriptions
   */
  private mergeClassInfo(existing: ClassInfo, newInfo: ClassInfo): ClassInfo {
    return {
      ...newInfo,
      // Preserve user-written descriptions if they exist and are not placeholders
      description: existing.description && !existing.description.includes('[AI 补充') 
        ? existing.description 
        : newInfo.description,
    };
  }
  
  /**
   * Rebuild module doc with merged classes
   */
  private rebuildModuleDoc(existingContent: string, classes: ClassInfo[], moduleName: string): string {
    // Simple implementation: append new classes to existing content
    // In a complete implementation, we would do intelligent merging
    return existingContent;
  }
}

// Type definitions for archive analysis
interface TaskAnalysis {
  totalTasks: number;
  completedTasks: number;
  files: {
    created: string[];
    modified: string[];
    deleted: string[];
  };
  apis: Array<{ endpoint: string; handler: string }>;
  classes: Array<{ name: string; file: string }>;
  businessLogic: string[];
}

interface ProposalAnalysis {
  title: string;
  why: string;
  whatChanges: string[];
  affectedSpecs: string[];
  affectedCode: string[];
}

interface DeltaSpecSummary {
  capability: string;
  added: string[];
  modified: string[];
  removed: string[];
  renamed: string[];
}
