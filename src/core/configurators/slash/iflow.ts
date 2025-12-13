import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.iflow/commands/cainiaospec-proposal.md',
  apply: '.iflow/commands/cainiaospec-apply.md',
  archive: '.iflow/commands/cainiaospec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: /cainiaospec-proposal
id: cainiaospec-proposal
category: CainiaoSpec
description: Scaffold a new CainiaoSpec change and validate strictly.
---`,
  apply: `---
name: /cainiaospec-apply
id: cainiaospec-apply
category: CainiaoSpec
description: Implement an approved CainiaoSpec change and keep tasks in sync.
---`,
  archive: `---
name: /cainiaospec-archive
id: cainiaospec-archive
category: CainiaoSpec
description: Archive a deployed CainiaoSpec change and update specs.
---`
};

export class IflowSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'iflow';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
