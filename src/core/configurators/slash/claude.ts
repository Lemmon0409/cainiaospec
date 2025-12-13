import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.claude/commands/cainiaospec/proposal.md',
  apply: '.claude/commands/cainiaospec/apply.md',
  archive: '.claude/commands/cainiaospec/archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: OpenSpec: Proposal
description: Scaffold a new CainiaoSpec change and validate strictly.
category: CainiaoSpec
tags: [cainiaospec, change]
---`,
  apply: `---
name: OpenSpec: Apply
description: Implement an approved CainiaoSpec change and keep tasks in sync.
category: CainiaoSpec
tags: [cainiaospec, apply]
---`,
  archive: `---
name: OpenSpec: Archive
description: Archive a deployed CainiaoSpec change and update specs.
category: CainiaoSpec
tags: [cainiaospec, archive]
---`
};

export class ClaudeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'claude';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
