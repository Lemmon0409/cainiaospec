import { TomlSlashCommandConfigurator } from './toml-base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.gemini/commands/cainiaospec/proposal.toml',
  apply: '.gemini/commands/cainiaospec/apply.toml',
  archive: '.gemini/commands/cainiaospec/archive.toml'
};

const DESCRIPTIONS: Record<SlashCommandId, string> = {
  proposal: 'Scaffold a new CainiaoSpec change and validate strictly.',
  apply: 'Implement an approved CainiaoSpec change and keep tasks in sync.',
  archive: 'Archive a deployed CainiaoSpec change and update specs.'
};

export class GeminiSlashCommandConfigurator extends TomlSlashCommandConfigurator {
  readonly toolId = 'gemini';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getDescription(id: SlashCommandId): string {
    return DESCRIPTIONS[id];
  }
}
