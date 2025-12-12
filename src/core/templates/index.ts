import { agentsTemplate } from './agents-template.js';
import { projectTemplate, ProjectContext, generateModularDocs } from './project-template.js';
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
    const shouldSplitDocs = context.projectStructure && 
                           context.projectStructure.modules.length > 0 &&
                           (context.allClasses || []).length > 50; // Split if more than 50 classes
    
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

export { ProjectContext } from './project-template.js';
export type { SlashCommandId } from './slash-command-templates.js';
