import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.codebuddy/commands/cainiaospec/proposal.md',
  apply: '.codebuddy/commands/cainiaospec/apply.md',
  archive: '.codebuddy/commands/cainiaospec/archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: CainiaoSpec: Proposal
description: Scaffold a new CainiaoSpec change and validate strictly.
category: CainiaoSpec
tags: [cainiaospec, change]
---`,
  apply: `---
name: CainiaoSpec: Apply
description: Implement an approved CainiaoSpec change and keep tasks in sync.
category: CainiaoSpec
tags: [cainiaospec, apply]
---`,
  archive: `---
name: CainiaoSpec: Archive
description: Archive a deployed CainiaoSpec change and update specs.
category: CainiaoSpec
tags: [cainiaospec, archive]
---`
};

export class CodeBuddySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'codebuddy';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}

