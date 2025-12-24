import { agentsTemplate } from './agents-template.js';
import { projectTemplate, ProjectContext, generateModularDocs, generateAICompletionPrompt } from './project-template.js';
import { claudeTemplate } from './claude-template.js';
import { clineTemplate } from './cline-template.js';
import { costrictTemplate } from './costrict-template.js';
import { agentsRootStubTemplate } from './agents-root-stub.js';
import { getSlashCommandBody, SlashCommandId } from './slash-command-templates.js';

export interface Template {
  path: string;
  content: string | ((context: ProjectContext) => string);
}

export class TemplateManager {
  static getTemplates(context: ProjectContext = {}): Template[] {
    // Check if we should generate modular docs
    // 有多模块结构时生成模块化文档，或者类超过 30 个
    const hasMultipleModules = context.projectStructure && 
                               context.projectStructure.modules.length > 0;
    const hasEnoughClasses = (context.allClasses || []).length > 0;
    const shouldSplitDocs = hasMultipleModules && hasEnoughClasses;
    
    if (shouldSplitDocs) {
      // Generate modular documentation (split into multiple files)
      const modularDocs = generateModularDocs(context);
      return [
        {
          path: 'AGENTS.md',
          content: agentsTemplate
        },
        ...modularDocs.map(doc => ({
          path: doc.path,
          content: doc.content
        }))
      ];
    } else {
      // Generate single project.md file
      return [
        {
          path: 'AGENTS.md',
          content: agentsTemplate
        },
        {
          path: 'project.md',
          content: projectTemplate(context)
        }
      ];
    }
  }

  static getClaudeTemplate(): string {
    return claudeTemplate;
  }

  static getClineTemplate(): string {
    return clineTemplate;
  }

  static getCostrictTemplate(): string {
    return costrictTemplate;
  }

  static getAgentsStandardTemplate(): string {
    return agentsRootStubTemplate;
  }

  static getSlashCommandBody(id: SlashCommandId): string {
    return getSlashCommandBody(id);
  }
}

export { ProjectContext, generateAICompletionPrompt } from './project-template.js';
export type { SlashCommandId } from './slash-command-templates.js';
