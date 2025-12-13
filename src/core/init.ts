import path from 'path';
import {
  createPrompt,
  isBackspaceKey,
  isDownKey,
  isEnterKey,
  isSpaceKey,
  isUpKey,
  useKeypress,
  usePagination,
  useState,
} from '@inquirer/core';
import chalk from 'chalk';
import ora from 'ora';
import { FileSystemUtils } from '../utils/file-system.js';
import { TemplateManager, ProjectContext } from './templates/index.js';
import { ToolRegistry } from './configurators/registry.js';
import { SlashCommandRegistry } from './configurators/slash/registry.js';
import {
  OpenSpecConfig,
  AI_TOOLS,
  OPENSPEC_DIR_NAME,
  AIToolOption,
  OPENSPEC_MARKERS,
} from './config.js';
import { PALETTE } from './styles/palette.js';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

const LETTER_MAP: Record<string, string[]> = {
  O: [' ████ ', '██  ██', '██  ██', '██  ██', ' ████ '],
  P: ['█████ ', '██  ██', '█████ ', '██    ', '██    '],
  E: ['██████', '██    ', '█████ ', '██    ', '██████'],
  N: ['██  ██', '███ ██', '██ ███', '██  ██', '██  ██'],
  S: [' █████', '██    ', ' ████ ', '    ██', '█████ '],
  C: [' █████', '██    ', '██    ', '██    ', ' █████'],
  A: [' ████ ', '██  ██', '██████', '██  ██', '██  ██'],
  I: ['██████', '  ██  ', '  ██  ', '  ██  ', '██████'],
  ' ': ['  ', '  ', '  ', '  ', '  '],
};

type ToolLabel = {
  primary: string;
  annotation?: string;
};

const sanitizeToolLabel = (raw: string): string =>
  raw.replace(/✅/gu, '✔').trim();

const parseToolLabel = (raw: string): ToolLabel => {
  const sanitized = sanitizeToolLabel(raw);
  const match = sanitized.match(/^(.*?)\s*\((.+)\)$/u);
  if (!match) {
    return { primary: sanitized };
  }
  return {
    primary: match[1].trim(),
    annotation: match[2].trim(),
  };
};

const isSelectableChoice = (
  choice: ToolWizardChoice
): choice is Extract<ToolWizardChoice, { selectable: true }> => choice.selectable;

type ToolWizardChoice =
  | {
      kind: 'heading' | 'info';
      value: string;
      label: ToolLabel;
      selectable: false;
    }
  | {
      kind: 'option';
      value: string;
      label: ToolLabel;
      configured: boolean;
      selectable: true;
    };

type ToolWizardConfig = {
  extendMode: boolean;
  baseMessage: string;
  choices: ToolWizardChoice[];
  initialSelected?: string[];
};

type WizardStep = 'intro' | 'select' | 'review';

type ToolSelectionPrompt = (config: ToolWizardConfig) => Promise<string[]>;

type RootStubStatus = 'created' | 'updated' | 'skipped';

const ROOT_STUB_CHOICE_VALUE = '__root_stub__';

const OTHER_TOOLS_HEADING_VALUE = '__heading-other__';
const LIST_SPACER_VALUE = '__list-spacer__';

const toolSelectionWizard = createPrompt<string[], ToolWizardConfig>(
  (config, done) => {
    const totalSteps = 3;
    const [step, setStep] = useState<WizardStep>('intro');
    const selectableChoices = config.choices.filter(isSelectableChoice);
    const initialCursorIndex = config.choices.findIndex((choice) =>
      choice.selectable
    );
    const [cursor, setCursor] = useState<number>(
      initialCursorIndex === -1 ? 0 : initialCursorIndex
    );
    const [selected, setSelected] = useState<string[]>(() => {
      const initial = new Set(
        (config.initialSelected ?? []).filter((value) =>
          selectableChoices.some((choice) => choice.value === value)
        )
      );
      return selectableChoices
        .map((choice) => choice.value)
        .filter((value) => initial.has(value));
    });
    const [error, setError] = useState<string | null>(null);

    const selectedSet = new Set(selected);
    const pageSize = Math.max(config.choices.length, 1);

    const updateSelected = (next: Set<string>) => {
      const ordered = selectableChoices
        .map((choice) => choice.value)
        .filter((value) => next.has(value));
      setSelected(ordered);
    };

    const page = usePagination({
      items: config.choices,
      active: cursor,
      pageSize,
      loop: false,
      renderItem: ({ item, isActive }) => {
        if (!item.selectable) {
          const prefix = item.kind === 'info' ? '  ' : '';
          const textColor =
            item.kind === 'heading' ? PALETTE.lightGray : PALETTE.midGray;
          return `${PALETTE.midGray(' ')} ${PALETTE.midGray(' ')} ${textColor(
            `${prefix}${item.label.primary}`
          )}`;
        }

        const isSelected = selectedSet.has(item.value);
        const cursorSymbol = isActive
          ? PALETTE.white('›')
          : PALETTE.midGray(' ');
        const indicator = isSelected
          ? PALETTE.white('◉')
          : PALETTE.midGray('○');
        const nameColor = isActive ? PALETTE.white : PALETTE.midGray;
        const annotation = item.label.annotation
          ? PALETTE.midGray(` (${item.label.annotation})`)
          : '';
        const configuredNote = item.configured
          ? PALETTE.midGray(' (already configured)')
          : '';
        const label = `${nameColor(item.label.primary)}${annotation}${configuredNote}`;
        return `${cursorSymbol} ${indicator} ${label}`;
      },
    });

    const moveCursor = (direction: 1 | -1) => {
      if (selectableChoices.length === 0) {
        return;
      }

      let nextIndex = cursor;
      while (true) {
        nextIndex = nextIndex + direction;
        if (nextIndex < 0 || nextIndex >= config.choices.length) {
          return;
        }

        if (config.choices[nextIndex]?.selectable) {
          setCursor(nextIndex);
          return;
        }
      }
    };

    useKeypress((key) => {
      if (step === 'intro') {
        if (isEnterKey(key)) {
          setStep('select');
        }
        return;
      }

      if (step === 'select') {
        if (isUpKey(key)) {
          moveCursor(-1);
          setError(null);
          return;
        }

        if (isDownKey(key)) {
          moveCursor(1);
          setError(null);
          return;
        }

        if (isSpaceKey(key)) {
          const current = config.choices[cursor];
          if (!current || !current.selectable) return;

          const next = new Set(selected);
          if (next.has(current.value)) {
            next.delete(current.value);
          } else {
            next.add(current.value);
          }

          updateSelected(next);
          setError(null);
          return;
        }

        if (isEnterKey(key)) {
          const current = config.choices[cursor];
          if (
            current &&
            current.selectable &&
            !selectedSet.has(current.value)
          ) {
            const next = new Set(selected);
            next.add(current.value);
            updateSelected(next);
          }
          setStep('review');
          setError(null);
          return;
        }

        if (key.name === 'escape') {
          const next = new Set<string>();
          updateSelected(next);
          setError(null);
        }
        return;
      }

      if (step === 'review') {
        if (isEnterKey(key)) {
          const finalSelection = config.choices
            .map((choice) => choice.value)
            .filter(
              (value) =>
                selectedSet.has(value) && value !== ROOT_STUB_CHOICE_VALUE
            );
          done(finalSelection);
          return;
        }

        if (isBackspaceKey(key) || key.name === 'escape') {
          setStep('select');
          setError(null);
        }
      }
    });

    const rootStubChoice = selectableChoices.find(
      (choice) => choice.value === ROOT_STUB_CHOICE_VALUE
    );
    const rootStubSelected = rootStubChoice
      ? selectedSet.has(ROOT_STUB_CHOICE_VALUE)
      : false;
    const nativeChoices = selectableChoices.filter(
      (choice) => choice.value !== ROOT_STUB_CHOICE_VALUE
    );
    const selectedNativeChoices = nativeChoices.filter((choice) =>
      selectedSet.has(choice.value)
    );

    const formatSummaryLabel = (
      choice: Extract<ToolWizardChoice, { selectable: true }>
    ) => {
      const annotation = choice.label.annotation
        ? PALETTE.midGray(` (${choice.label.annotation})`)
        : '';
      const configuredNote = choice.configured
        ? PALETTE.midGray(' (already configured)')
        : '';
      return `${PALETTE.white(choice.label.primary)}${annotation}${configuredNote}`;
    };

    const stepIndex = step === 'intro' ? 1 : step === 'select' ? 2 : 3;
    const lines: string[] = [];
    lines.push(PALETTE.midGray(`Step ${stepIndex}/${totalSteps}`));
    lines.push('');

    if (step === 'intro') {
      const introHeadline = config.extendMode
        ? 'Extend your CainiaoSpec tooling'
        : 'Configure your CainiaoSpec tooling';
      const introBody = config.extendMode
        ? 'We detected an existing setup. We will help you refresh or add integrations.'
        : "Let's get your AI assistants connected so they understand CainiaoSpec.";

      lines.push(PALETTE.white(introHeadline));
      lines.push(PALETTE.midGray(introBody));
      lines.push('');
      lines.push(PALETTE.midGray('Press Enter to continue.'));
    } else if (step === 'select') {
      lines.push(PALETTE.white(config.baseMessage));
      lines.push(
        PALETTE.midGray(
          'Use ↑/↓ to move · Space to toggle · Enter selects highlighted tool and reviews.'
        )
      );
      lines.push('');
      lines.push(page);
      lines.push('');
      lines.push(PALETTE.midGray('Selected configuration:'));
      if (rootStubSelected && rootStubChoice) {
        lines.push(
          `  ${PALETTE.white('-')} ${formatSummaryLabel(rootStubChoice)}`
        );
      }
      if (selectedNativeChoices.length === 0) {
        lines.push(
          `  ${PALETTE.midGray('- No natively supported providers selected')}`
        );
      } else {
        selectedNativeChoices.forEach((choice) => {
          lines.push(
            `  ${PALETTE.white('-')} ${formatSummaryLabel(choice)}`
          );
        });
      }
    } else {
      lines.push(PALETTE.white('Review selections'));
      lines.push(
        PALETTE.midGray('Press Enter to confirm or Backspace to adjust.')
      );
      lines.push('');

      if (rootStubSelected && rootStubChoice) {
        lines.push(
          `${PALETTE.white('▌')} ${formatSummaryLabel(rootStubChoice)}`
        );
      }

      if (selectedNativeChoices.length === 0) {
        lines.push(
          PALETTE.midGray(
            'No natively supported providers selected. Universal instructions will still be applied.'
          )
        );
      } else {
        selectedNativeChoices.forEach((choice) => {
          lines.push(
            `${PALETTE.white('▌')} ${formatSummaryLabel(choice)}`
          );
        });
      }
    }

    if (error) {
      return [lines.join('\n'), chalk.red(error)];
    }

    return lines.join('\n');
  }
);

type InitCommandOptions = {
  prompt?: ToolSelectionPrompt;
  tools?: string;
  withImplGuide?: boolean;
  scanCode?: boolean;
  frameworks?: string;
};

export class InitCommand {
  private readonly prompt: ToolSelectionPrompt;
  private readonly toolsArg?: string;
  private readonly withImplGuide: boolean;
  private readonly scanCode: boolean;
  private readonly frameworksArg?: string;

  constructor(options: InitCommandOptions = {}) {
    this.prompt = options.prompt ?? ((config) => toolSelectionWizard(config));
    this.toolsArg = options.tools;
    this.withImplGuide = options.withImplGuide ?? true; // Default to true
    this.scanCode = options.scanCode ?? true;
    this.frameworksArg = options.frameworks;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const openspecDir = OPENSPEC_DIR_NAME;
    const openspecPath = path.join(projectPath, openspecDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, openspecPath);
    const existingToolStates = await this.getExistingToolStates(projectPath, extendMode);

    this.renderBanner(extendMode);

    // Get configuration (after validation to avoid prompts if validation fails)
    const config = await this.getConfiguration(existingToolStates, extendMode);

    const availableTools = AI_TOOLS.filter((tool) => tool.available);
    const selectedIds = new Set(config.aiTools);
    const selectedTools = availableTools.filter((tool) =>
      selectedIds.has(tool.value)
    );
    const created = selectedTools.filter(
      (tool) => !existingToolStates[tool.value]
    );
    const refreshed = selectedTools.filter(
      (tool) => existingToolStates[tool.value]
    );
    const skippedExisting = availableTools.filter(
      (tool) => !selectedIds.has(tool.value) && existingToolStates[tool.value]
    );
    const skipped = availableTools.filter(
      (tool) => !selectedIds.has(tool.value) && !existingToolStates[tool.value]
    );

    // Step 1: Create directory structure
    if (!extendMode) {
      const structureSpinner = this.startSpinner(
        'Creating CainiaoSpec structure...'
      );
      await this.createDirectoryStructure(openspecPath);
      await this.generateFiles(openspecPath, config);
      structureSpinner.stopAndPersist({
        symbol: PALETTE.white('▌'),
        text: PALETTE.white('CainiaoSpec structure created'),
      });
    } else {
      ora({ stream: process.stdout }).info(
        PALETTE.midGray(
          'ℹ CainiaoSpec already initialized. Checking for missing files...'
        )
      );
      await this.createDirectoryStructure(openspecPath);
      await this.ensureTemplateFiles(openspecPath, config);
    }

    // Step 2: Configure AI tools
    const toolSpinner = this.startSpinner('Configuring AI tools...');
    const rootStubStatus = await this.configureAITools(
      projectPath,
      openspecDir,
      config.aiTools
    );
    toolSpinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('AI tools configured'),
    });

    // Success message
    this.displaySuccessMessage(
      selectedTools,
      created,
      refreshed,
      skippedExisting,
      skipped,
      extendMode,
      rootStubStatus
    );
  }

  private async validate(
    projectPath: string,
    _openspecPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(_openspecPath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private async getConfiguration(
    existingTools: Record<string, boolean>,
    extendMode: boolean
  ): Promise<OpenSpecConfig> {
    const selectedTools = await this.getSelectedTools(existingTools, extendMode);
    return { aiTools: selectedTools };
  }

  private async getSelectedTools(
    existingTools: Record<string, boolean>,
    extendMode: boolean
  ): Promise<string[]> {
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    // Fall back to interactive mode
    return this.promptForAITools(existingTools, extendMode);
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = AI_TOOLS.filter((tool) => tool.available);
    const availableValues = availableTools.map((tool) => tool.value);
    const availableSet = new Set(availableValues);
    const availableList = ['all', 'none', ...availableValues].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableValues;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private async promptForAITools(
    existingTools: Record<string, boolean>,
    extendMode: boolean
  ): Promise<string[]> {
    const availableTools = AI_TOOLS.filter((tool) => tool.available);

    const baseMessage = extendMode
      ? 'Which natively supported AI tools would you like to add or refresh?'
      : 'Which natively supported AI tools do you use?';
    const initialNativeSelection = extendMode
      ? availableTools
          .filter((tool) => existingTools[tool.value])
          .map((tool) => tool.value)
      : [];

    const initialSelected = Array.from(new Set(initialNativeSelection));

    const choices: ToolWizardChoice[] = [
      {
        kind: 'heading',
        value: '__heading-native__',
        label: {
          primary:
            'Natively supported providers (✔ CainiaoSpec custom slash commands available)',
        },
        selectable: false,
      },
      ...availableTools.map<ToolWizardChoice>((tool) => ({
        kind: 'option',
        value: tool.value,
        label: parseToolLabel(tool.name),
        configured: Boolean(existingTools[tool.value]),
        selectable: true,
      })),
      ...(availableTools.length
        ? ([
            {
              kind: 'info' as const,
              value: LIST_SPACER_VALUE,
              label: { primary: '' },
              selectable: false,
            },
          ] as ToolWizardChoice[])
        : []),
      {
        kind: 'heading',
        value: OTHER_TOOLS_HEADING_VALUE,
        label: {
          primary:
            'Other tools (use Universal AGENTS.md for Amp, VS Code, GitHub Copilot, …)',
        },
        selectable: false,
      },
      {
        kind: 'option',
        value: ROOT_STUB_CHOICE_VALUE,
        label: {
          primary: 'Universal AGENTS.md',
          annotation: 'always available',
        },
        configured: extendMode,
        selectable: true,
      },
    ];

    return this.prompt({
      extendMode,
      baseMessage,
      choices,
      initialSelected,
    });
  }

  private async getExistingToolStates(
    projectPath: string,
    extendMode: boolean
  ): Promise<Record<string, boolean>> {
    // Fresh initialization - no tools configured yet
    if (!extendMode) {
      return Object.fromEntries(AI_TOOLS.map(t => [t.value, false]));
    }

    // Extend mode - check all tools in parallel for better performance
    const entries = await Promise.all(
      AI_TOOLS.map(async (t) => [t.value, await this.isToolConfigured(projectPath, t.value)] as const)
    );
    return Object.fromEntries(entries);
  }

  private async isToolConfigured(
    projectPath: string,
    toolId: string
  ): Promise<boolean> {
    // A tool is only considered "configured by OpenSpec" if its files contain OpenSpec markers.
    // For tools with both config files and slash commands, BOTH must have markers.
    // For slash commands, at least one file with markers is sufficient (not all required).

    // Helper to check if a file exists and contains OpenSpec markers
    const fileHasMarkers = async (absolutePath: string): Promise<boolean> => {
      try {
        const content = await FileSystemUtils.readFile(absolutePath);
        return content.includes(OPENSPEC_MARKERS.start) && content.includes(OPENSPEC_MARKERS.end);
      } catch {
        return false;
      }
    };

    let hasConfigFile = false;
    let hasSlashCommands = false;

    // Check if the tool has a config file with OpenSpec markers
    const configFile = ToolRegistry.get(toolId)?.configFileName;
    if (configFile) {
      const configPath = path.join(projectPath, configFile);
      hasConfigFile = (await FileSystemUtils.fileExists(configPath)) && (await fileHasMarkers(configPath));
    }

    // Check if any slash command file exists with OpenSpec markers
    const slashConfigurator = SlashCommandRegistry.get(toolId);
    if (slashConfigurator) {
      for (const target of slashConfigurator.getTargets()) {
        const absolute = slashConfigurator.resolveAbsolutePath(projectPath, target.id);
        if ((await FileSystemUtils.fileExists(absolute)) && (await fileHasMarkers(absolute))) {
          hasSlashCommands = true;
          break; // At least one file with markers is sufficient
        }
      }
    }

    // Tool is only configured if BOTH exist with markers
    // OR if the tool has no config file requirement (slash commands only)
    // OR if the tool has no slash commands requirement (config file only)
    const hasConfigFileRequirement = configFile !== undefined;
    const hasSlashCommandRequirement = slashConfigurator !== undefined;

    if (hasConfigFileRequirement && hasSlashCommandRequirement) {
      // Both are required - both must be present with markers
      return hasConfigFile && hasSlashCommands;
    } else if (hasConfigFileRequirement) {
      // Only config file required
      return hasConfigFile;
    } else if (hasSlashCommandRequirement) {
      // Only slash commands required
      return hasSlashCommands;
    }

    return false;
  }

  private async createDirectoryStructure(openspecPath: string): Promise<void> {
    const directories = [
      openspecPath,
      path.join(openspecPath, 'specs'),
      path.join(openspecPath, 'changes'),
      path.join(openspecPath, 'changes', 'archive'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }
  }

  private async generateFiles(
    openspecPath: string,
    config: OpenSpecConfig
  ): Promise<void> {
    await this.writeTemplateFiles(openspecPath, config, false);
    
    // Generate QUICK_START.md in project root (not in cainiaospec/)
    const projectPath = path.dirname(openspecPath);
    const quickStartPath = path.join(projectPath, 'QUICK_START.md');
    const quickStartContent = this.getQuickStartContent();
    await FileSystemUtils.writeFile(quickStartPath, quickStartContent);
    
    // Generate STEP_BY_STEP_DOC_PROMPT.md in project root
    const stepByStepPath = path.join(projectPath, 'STEP_BY_STEP_DOC_PROMPT.md');
    const stepByStepContent = this.getStepByStepPromptContent();
    await FileSystemUtils.writeFile(stepByStepPath, stepByStepContent);
  }

  private async ensureTemplateFiles(
    openspecPath: string,
    config: OpenSpecConfig
  ): Promise<void> {
    // When already initialized, only check for missing critical files
    // Skip full code scan to avoid long wait times on large projects
    const agentsPath = path.join(openspecPath, 'AGENTS.md');
    const projectPath = path.join(openspecPath, 'project.md');
    
    const agentsExists = await FileSystemUtils.fileExists(agentsPath);
    const projectExists = await FileSystemUtils.fileExists(projectPath);
    
    // Only regenerate if critical files are missing
    if (agentsExists && projectExists) {
      // All critical files exist, skip regeneration
      return;
    }
    
    // Some files missing, do a minimal regeneration without full code scan
    console.log('Regenerating missing template files...');
    
    // Generate AGENTS.md if missing (doesn't need context)
    if (!agentsExists) {
      const agentsTemplate = TemplateManager.getTemplates({}).find(t => t.path === 'AGENTS.md');
      if (agentsTemplate) {
        const content = typeof agentsTemplate.content === 'function'
          ? agentsTemplate.content({})
          : agentsTemplate.content;
        await FileSystemUtils.writeFile(agentsPath, content);
      }
    }
    
    // Generate project.md if missing (minimal context, no code scan)
    if (!projectExists) {
      const minimalContext: ProjectContext = {
        withImplGuide: false, // Don't trigger code scan
      };
      const projectTemplate = TemplateManager.getTemplates(minimalContext).find(t => t.path === 'project.md');
      if (projectTemplate) {
        const content = typeof projectTemplate.content === 'function'
          ? projectTemplate.content(minimalContext)
          : projectTemplate.content;
        await FileSystemUtils.writeFile(projectPath, content);
      }
    }
  }

  private async writeTemplateFiles(
    openspecPath: string,
    config: OpenSpecConfig,
    skipExisting: boolean
  ): Promise<void> {
    const context: ProjectContext = await this.buildProjectContext(
      path.dirname(openspecPath)
    );

    const templates = TemplateManager.getTemplates(context);

    for (const template of templates) {
      const filePath = path.join(openspecPath, template.path);

      // Skip if file exists and we're in skipExisting mode
      if (skipExisting && (await FileSystemUtils.fileExists(filePath))) {
        continue;
      }

      const content =
        typeof template.content === 'function'
          ? template.content(context)
          : template.content;

      await FileSystemUtils.writeFile(filePath, content);
    }
  }

  private async buildProjectContext(
    projectPath: string
  ): Promise<ProjectContext> {
    const context: ProjectContext = {
      withImplGuide: this.withImplGuide,
    };

    if (!this.withImplGuide) {
      return context;
    }

    // Import framework detector and code scanner
    const { detectFrameworks } = await import('./framework-detector.js');
    const { scanCodebase } = await import('./code-scanner.js');

    // Detect frameworks
    const frameworkResult = detectFrameworks(projectPath);
    context.frameworks = this.frameworksArg
      ? this.frameworksArg.split(',').map(f => f.trim())
      : frameworkResult.frameworks;

    // Scan code if requested
    if (this.scanCode) {
      const scanResult = await scanCodebase({
        rootDir: projectPath,
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/coverage/**',
          '**/cainiaospec/**',
        ],
      });

      context.directoryStructure = scanResult.directoryStructure;
      // Enhanced: Pass all scanned information to template
            context.allClasses = scanResult.allClasses;
      context.apiDocumentation = scanResult.apiDocumentation;
      context.businessLogic = scanResult.businessLogic;
      context.codeStylePatterns = scanResult.codeStylePatterns;
      // Enhanced: Pass project structure and dependencies
      context.projectStructure = scanResult.projectStructure;
      context.classDependencies = scanResult.classDependencies;
    }

    return context;
  }

  private async configureAITools(
    projectPath: string,
    openspecDir: string,
    toolIds: string[]
  ): Promise<RootStubStatus> {
    const rootStubStatus = await this.configureRootAgentsStub(
      projectPath,
      openspecDir
    );

    for (const toolId of toolIds) {
      const configurator = ToolRegistry.get(toolId);
      if (configurator && configurator.isAvailable) {
        await configurator.configure(projectPath, openspecDir);
      }

      const slashConfigurator = SlashCommandRegistry.get(toolId);
      if (slashConfigurator && slashConfigurator.isAvailable) {
        await slashConfigurator.generateAll(projectPath, openspecDir);
      }
    }

    return rootStubStatus;
  }

  private async configureRootAgentsStub(
    projectPath: string,
    openspecDir: string
  ): Promise<RootStubStatus> {
    const configurator = ToolRegistry.get('agents');
    if (!configurator || !configurator.isAvailable) {
      return 'skipped';
    }

    const stubPath = path.join(projectPath, configurator.configFileName);
    const existed = await FileSystemUtils.fileExists(stubPath);

    await configurator.configure(projectPath, openspecDir);

    return existed ? 'updated' : 'created';
  }

  private displaySuccessMessage(
    selectedTools: AIToolOption[],
    created: AIToolOption[],
    refreshed: AIToolOption[],
    skippedExisting: AIToolOption[],
    skipped: AIToolOption[],
    extendMode: boolean,
    rootStubStatus: RootStubStatus
  ): void {
    console.log(); // Empty line for spacing
    const successHeadline = extendMode
      ? 'CainiaoSpec tool configuration updated!'
      : 'CainiaoSpec initialized successfully!';
    ora().succeed(PALETTE.white(successHeadline));

    console.log();
    console.log(PALETTE.lightGray('Tool summary:'));
    const summaryLines = [
      rootStubStatus === 'created'
        ? `${PALETTE.white('▌')} ${PALETTE.white(
            'Root AGENTS.md stub created for other assistants'
          )}`
        : null,
      rootStubStatus === 'updated'
        ? `${PALETTE.lightGray('▌')} ${PALETTE.lightGray(
            'Root AGENTS.md stub refreshed for other assistants'
          )}`
        : null,
      created.length
        ? `${PALETTE.white('▌')} ${PALETTE.white(
            'Created:'
          )} ${this.formatToolNames(created)}`
        : null,
      refreshed.length
        ? `${PALETTE.lightGray('▌')} ${PALETTE.lightGray(
            'Refreshed:'
          )} ${this.formatToolNames(refreshed)}`
        : null,
      skippedExisting.length
        ? `${PALETTE.midGray('▌')} ${PALETTE.midGray(
            'Skipped (already configured):'
          )} ${this.formatToolNames(skippedExisting)}`
        : null,
      skipped.length
        ? `${PALETTE.darkGray('▌')} ${PALETTE.darkGray(
            'Skipped:'
          )} ${this.formatToolNames(skipped)}`
        : null,
    ].filter((line): line is string => Boolean(line));
    for (const line of summaryLines) {
      console.log(line);
    }

    console.log();
    console.log(
      PALETTE.midGray(
        'Use `cainiaospec update` to refresh shared CainiaoSpec instructions in the future.'
      )
    );

    // Show restart instruction if any tools were configured
    if (created.length > 0 || refreshed.length > 0) {
      console.log();
      console.log(PALETTE.white('Important: Restart your IDE'));
      console.log(
        PALETTE.midGray(
          'Slash commands are loaded at startup. Please restart your coding assistant'
        )
      );
      console.log(
        PALETTE.midGray(
          'to ensure the new /cainiaospec commands appear in your command palette.'
        )
      );
    }

    // Get the selected tool name(s) for display
    const toolName = this.formatToolNames(selectedTools);

    console.log();
    console.log(chalk.green('✨ 文档生成完成！'));
    console.log();
    console.log(chalk.yellow('⚠️  重要提示：文档中类、字段、方法的描述都是空的'));
    console.log(chalk.yellow('   静态扫描无法理解业务含义，需要 AI 补充关键描述'));
    console.log();
        
    // 方案 A
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bgGreen.black(' 方案 A：分步补充（推荐，适合大模块） '));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.green('一次只处理一个小任务，避免 AI 迷失焦点。每个模块按以下 4 步完成：'));
    console.log();
    console.log(chalk.white('█ 步骤 1: 补充 README.md'));
    console.log(chalk.gray('  复制以下内容发给 AI：'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log(chalk.yellow('  请打开 cainiaospec/modules/[模块名]/README.md'));
    console.log(chalk.yellow('  补充以下章节：'));
    console.log(chalk.yellow('  1. 🎯 业务场景 - 核心价值、服务对象、主要场景'));
    console.log(chalk.yellow('  2. 🔄 核心业务流程 - 用 Mermaid 绘制 1-2 个流程图'));
    console.log(chalk.yellow('  3. 📜 核心业务规则 - 判断条件、处理逻辑'));
    console.log(chalk.yellow('  4. 🔀 状态流转 - 用 Mermaid 绘制状态图'));
    console.log(chalk.yellow('  5. ❓ 常见问题 FAQ - 添加 3-5 个问题'));
    console.log(chalk.yellow('  完成后告诉我："✅ README 已补充"'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log();
    console.log(chalk.white('█ 步骤 2: 补充 controllers.md'));
    console.log(chalk.gray('  AI 完成步骤 1 后，复制以下内容：'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log(chalk.yellow('  请打开 cainiaospec/modules/[模块名]/controllers.md'));
    console.log(chalk.yellow('  为每个 Controller 补充：'));
    console.log(chalk.yellow('  1. 描述 - 一句话说明负责什么'));
    console.log(chalk.yellow('  2. 业务功能 - 列出 2-3 个主要功能'));
    console.log(chalk.yellow('  3. 服务场景 - 哪些用户/系统使用'));
    console.log(chalk.yellow('  4. API 端点表 - 每个方法的用途和业务逻辑'));
    console.log(chalk.yellow('  完成后告诉我："✅ Controllers 已补充"'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log();
    console.log(chalk.white('█ 步骤 3: 补充 services.md'));
    console.log(chalk.gray('  AI 完成步骤 2 后，复制以下内容：'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log(chalk.yellow('  请打开 cainiaospec/modules/[模块名]/services.md'));
    console.log(chalk.yellow('  为每个 Service 的核心方法补充：'));
    console.log(chalk.yellow('  1. 业务描述 - 这个方法做什么'));
    console.log(chalk.yellow('  2. 执行步骤 - 1.xxx 2.xxx 3.xxx'));
    console.log(chalk.yellow('  完成后告诉我："✅ Services 已补充"'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log();
    console.log(chalk.white('█ 步骤 4: 补充 models.md'));
    console.log(chalk.gray('  AI 完成步骤 3 后，复制以下内容：'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log(chalk.yellow('  请打开 cainiaospec/modules/[模块名]/models.md'));
    console.log(chalk.yellow('  为重要 DTO/Entity 的关键字段补充：'));
    console.log(chalk.yellow('  1. 业务含义 - 这个字段代表什么'));
    console.log(chalk.yellow('  2. 示例值 - 如 "ORD20250312001234"'));
    console.log(chalk.yellow('  3. 单位/取值 - 如 "单位:秒"'));
    console.log(chalk.yellow('  完成后告诉我："✅ Models 已补充"'));
    console.log(chalk.white('  ────────────────────────────────────────'));
    console.log();
    console.log(chalk.gray('📄 完整分步提示词：查看 STEP_BY_STEP_DOC_PROMPT.md'));
    console.log();
        
    // 方案 B
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bgBlue.white(' 方案 B：一次性补充（适合小模块，<50个类） '));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.blue('复制以下内容发给 AI：'));
    console.log(chalk.white('────────────────────────────────────────'));
    console.log(chalk.yellow('请打开 cainiaospec/modules/[模块名]/ 目录下的所有文件：'));
    console.log(chalk.yellow('- README.md'));
    console.log(chalk.yellow('- controllers.md'));
    console.log(chalk.yellow('- services.md'));
    console.log(chalk.yellow('- models.md'));
    console.log();
    console.log(chalk.yellow('为所有空白的描述补充内容，包括：'));
    console.log(chalk.yellow('1. 业务场景、核心流程（Mermaid）、业务规则、状态流转'));
    console.log(chalk.yellow('2. 每个 Controller 的描述和 API 说明'));
    console.log(chalk.yellow('3. 每个 Service 方法的业务描述'));
    console.log(chalk.yellow('4. 重要 DTO 字段的业务含义'));
    console.log(chalk.yellow('5. FAQ 常见问题'));
    console.log();
    console.log(chalk.yellow('完成后告诉我："✅ 模块文档已补充完成"'));
    console.log(chalk.white('────────────────────────────────────────'));
    console.log();
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(
      PALETTE.darkGray(
        '────────────────────────────────────────────────────────────'
      )
    );
    console.log();
    console.log(PALETTE.white('📚 后续操作提示词示例：'));
    console.log();
    console.log(PALETTE.white('实现新功能（文档完善后使用）:'));
    console.log(
      PALETTE.lightGray(
        '   "我想实现 [具体功能描述]。'
      )
    );
    console.log(
      PALETTE.lightGray(
        '   请基于 cainiaospec/project.md 和模块文档理解项目结构，'
      )
    );
    console.log(
      PALETTE.lightGray(
        '   创建详细的 CainiaoSpec 变更提案，'
      )
    );
    console.log(
      PALETTE.lightGray(
        '   说明需要修改哪些文件、调用哪些类、具体实现逻辑"'
      )
    );
    console.log();
    console.log(PALETTE.white('了解 CainiaoSpec 工作流:'));
    console.log(
      PALETTE.lightGray(
        '   "请解释 cainiaospec/AGENTS.md 中的工作流程，'
      )
    );
    console.log(
      PALETTE.lightGray('    以及如何在这个项目中协作"')
    );
    console.log();

    // Codex heads-up: prompts installed globally
    const selectedToolIds = new Set(selectedTools.map((t) => t.value));
    if (selectedToolIds.has('codex')) {
      console.log(PALETTE.white('Codex setup note'));
      console.log(
        PALETTE.midGray('Prompts installed to ~/.codex/prompts (or $CODEX_HOME/prompts).')
      );
      console.log();
    }

    // Quick start reminder for next time
    console.log(
      PALETTE.darkGray(
        '────────────────────────────────────────────────────────────'
      )
    );
    console.log();
    console.log(chalk.cyan('💡 下次打开项目时的快速开始：'));
    console.log();
    console.log(chalk.white('场景 1：继续未完成的工作'));
    console.log(chalk.gray('  cainiaospec list              # 查看所有活动中的变更'));
    console.log(chalk.gray('  cainiaospec show [change-id]  # 查看具体变更详情'));
    console.log();
    console.log(chalk.white('场景 2：实现新功能'));
    console.log(chalk.gray('  告诉 AI："我想实现 [功能描述]，请创建 CainiaoSpec 提案"'));
    console.log(chalk.gray('  AI 会创建：proposal.md + tasks.md'));
    console.log();
    console.log(chalk.white('场景 3：实施提案'));
    console.log(chalk.gray('  告诉 AI："请按照 cainiaospec/changes/[change-id]/tasks.md 实施"'));
    console.log(chalk.gray('  AI 会严格遵循提案中的规范和逻辑'));
    console.log();
    console.log(chalk.white('场景 4：归档已完成的变更'));
    console.log(chalk.gray('  cainiaospec archive [change-id]  # 功能部署后归档'));
    console.log();
    console.log(chalk.magenta('📚 完整的快速开始指南：'));
    console.log(chalk.gray('  查看 QUICK_START.md（已保存在项目根目录）'));
    console.log();
  }

  private formatToolNames(tools: AIToolOption[]): string {
    const names = tools
      .map((tool) => tool.successLabel ?? tool.name)
      .filter((name): name is string => Boolean(name));

    if (names.length === 0)
      return PALETTE.lightGray('your AGENTS.md-compatible assistant');
    if (names.length === 1) return PALETTE.white(names[0]);

    const base = names.slice(0, -1).map((name) => PALETTE.white(name));
    const last = PALETTE.white(names[names.length - 1]);

    return `${base.join(PALETTE.midGray(', '))}${
      base.length ? PALETTE.midGray(', and ') : ''
    }${last}`;
  }

  private renderBanner(_extendMode: boolean): void {
    const rows = ['', '', '', '', ''];
    for (const char of 'CAINIAO') {
      const glyph = LETTER_MAP[char] ?? LETTER_MAP[' '];
      for (let i = 0; i < rows.length; i += 1) {
        rows[i] += `${glyph[i]}  `;
      }
    }

    const rowStyles = [
      PALETTE.white,
      PALETTE.lightGray,
      PALETTE.midGray,
      PALETTE.lightGray,
      PALETTE.white,
    ];

    console.log();
    rows.forEach((row, index) => {
      console.log(rowStyles[index](row.replace(/\s+$/u, '')));
    });
    console.log();
    console.log(PALETTE.white('Welcome to CainiaoSpec!'));
    console.log();
  }

 private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }

  private getQuickStartContent(): string {
    return `# OpenSpec 快速开始指南

## 📚 项目已初始化？下次使用这个指南

如果你已经初始化过 OpenSpec，下次打开项目时按以下步骤操作：

---

## 🚀 快速工作流

### 场景 1：完善项目文档（首次初始化后）

如果这是首次初始化，文档中的描述都是空的，需要先完善：

\`\`\`bash
# 1. 查看生成的文档
cat cainiaospec/project.md
cat cainiaospec/modules/*.md
cat cainiaospec/ai-tasks.md

# 2. 复制初始化时显示的"开始复制"到"复制结束"之间的内容
# 3. 粘贴给 AI 助手，让 AI 按照步骤完善文档
\`\`\`

AI 会：
- 补充所有 Controller 类的业务功能说明
- 补充所有 Service 类的业务逻辑说明
- 补充重要 DTO 的关键字段描述
- 补充核心模块的业务场景和流程

---

### 场景 2：实现新功能

文档完善后，开始开发新功能：

\`\`\`bash
# 告诉 AI：
"我想实现 [具体功能描述]。
请基于 cainiaospec/project.md 和模块文档理解项目结构，
创建详细的 CainiaoSpec 变更提案，
说明需要修改哪些文件、调用哪些类、具体实现逻辑"
\`\`\`

AI 会创建：
\`\`\`
cainiaospec/changes/[change-id]/
  ├── proposal.md   # 提案：为什么做、做什么、影响范围
  ├── tasks.md      # 任务清单：如何实现（包含完整的 API 规范、调用链）
  └── design.md     # （可选）技术设计
\`\`\`

---

### 场景 3：实施提案

提案创建后，开始实施：

\`\`\`bash
# 告诉 AI：
"请按照 cainiaospec/changes/[change-id]/tasks.md 实施这个提案"
\`\`\`

AI 会：
1. 阅读 \`proposal.md\` 了解规范
2. 查看 \`tasks.md\` 中的每个任务
3. 每个任务都会引用 \`proposal.md\` 的具体章节
4. 严格按照提案中的 API 规范、调用链、业务逻辑实现
5. 不允许偏离提案（除非先更新提案）

---

### 场景 4：查看项目状态

\`\`\`bash
# 查看所有活动中的变更
cainiaospec list

# 查看所有规范
cainiaospec list --specs

# 查看特定变更的详情
cainiaospec show [change-id]

# 验证变更
cainiaospec validate [change-id] --strict
\`\`\`

---

### 场景 5：归档已完成的变更

功能开发完成并部署后：

\`\`\`bash
# 归档变更
cainiaospec archive [change-id]

# 或者非交互式归档
cainiaospec archive [change-id] --yes
\`\`\`

---

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| \`cainiaospec list\` | 查看所有活动中的变更 |
| \`cainiaospec list --specs\` | 查看所有规范 |
| \`cainiaospec show [item]\` | 查看变更或规范详情 |
| \`cainiaospec validate [item]\` | 验证变更或规范 |
| \`cainiaospec archive [change-id]\` | 归档已完成的变更 |

---

## 🔄 典型工作流程

\`\`\`
1. 完善文档（首次）
   └─ 复制提示词 → AI 补充描述 → 删除 ai-tasks.md

2. 提出需求
   └─ "我想实现..." → AI 创建 proposal.md + tasks.md

3. 审查提案
   └─ 检查 API 规范、调用链、业务逻辑是否正确

4. 实施提案
   └─ "按照 tasks.md 实施" → AI 严格遵循规范实现

5. 验证
   └─ cainiaospec validate [change-id] --strict

6. 部署后归档
   └─ cainiaospec archive [change-id]
\`\`\`

---

## 💡 最佳实践

### ✅ DO（推荐做法）

1. **总是先完善文档**
   - 让 AI 补充关键类的描述
   - Controller、Service、DTO 必须有描述

2. **创建提案时要求完整规范**
   - 必须包含完整的 API 规范（请求/响应）
   - 必须包含完整的调用链
   - 必须包含详细的实现逻辑

3. **实施时严格遵循提案**
   - 不修改 API 路径
   - 不修改请求/响应字段
   - 不跳过调用链中的步骤

4. **发现问题先更新提案**
   - 如果提案有问题，先停止实施
   - 更新 proposal.md 和 tasks.md
   - 重新审查后再继续

### ❌ DON'T（避免做法）

1. **不要跳过文档完善**
   - 没有描述的文档，AI 无法理解业务逻辑

2. **不要只创建 proposal.md**
   - tasks.md 是必需的，包含实施细节

3. **不要偏离提案实施**
   - "觉得这样更好"也不行
   - 必须先更新提案

4. **不要忘记归档**
   - 已部署的变更要归档
   - 否则 changes/ 目录会越来越乱

---

## 🆘 常见问题

### Q1: 重新打开项目后，如何继续之前的工作？

\`\`\`bash
# 1. 查看状态
cainiaospec list

# 2. 如果有未完成的变更
cainiaospec show [change-id]

# 3. 继续实施
# 告诉 AI："请继续实施 cainiaospec/changes/[change-id] 的提案"
\`\`\`

### Q2: 如何知道文档是否已经完善？

\`\`\`bash
# 检查 ai-tasks.md 是否存在
ls cainiaospec/ai-tasks.md

# 如果存在，说明还没完善
# 如果不存在，说明已经完善
\`\`\`

### Q3: 提案创建后发现规范不对怎么办？

\`\`\`bash
# 直接修改文件：
# - cainiaospec/changes/[change-id]/proposal.md
# - cainiaospec/changes/[change-id]/tasks.md

# 然后告诉 AI："提案已更新，请重新实施"
\`\`\`

### Q4: 如何查看项目的完整文档？

\`\`\`bash
# 主文档
cat cainiaospec/project.md

# 模块文档
cat cainiaospec/modules/*.md

# 工作流指南
cat cainiaospec/AGENTS.md
\`\`\`

---

## 📚 更多信息

- [完整的 AGENTS.md](cainiaospec/AGENTS.md) - AI 工作流指南

---

*提示：如果忘记了工作流程，随时可以查看这个文件！*
`;
  }

  private getStepByStepPromptContent(): string {
    return `# 分步补充文档提示词

> 当模块文档过大时，使用分步提示词让 AI 逐步完成，避免遗漏

---

## 🎯 使用方法

**不要一次性让 AI 补充整个文档！**

按以下顺序，每次只发一个提示词给 AI，等 AI 完成后再发下一个。

---

## 第 1 步：补充业务场景

\`\`\`
请打开 cainiaospec/modules/[模块名].md 文件。

只做这一件事：补充【🎯 业务场景】章节。

要求：
1. 阅读该模块的 Controller 和 Service 代码
2. 理解这个模块解决什么业务问题
3. 填写：
   - 核心价值: [该模块解决的核心业务问题]
   - 服务对象: [哪些用户群体/系统使用这个模块]
   - 场景1: [具体业务场景]
   - 场景2: [具体业务场景]

完成后告诉我："✅ 业务场景已补充"
\`\`\`

---

## 第 2 步：补充核心业务流程

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：补充【🔄 核心业务流程】章节。

要求：
1. 找出该模块最重要的 1-2 个业务流程
2. 阅读相关 Controller 和 Service 代码
3. 用 Mermaid sequenceDiagram 绘制流程图

示例格式：
### 流程1: 订单创建流程

\`\`\`mermaid
sequenceDiagram
    participant User as 用户
    participant Controller as OrderController
    participant Service as OrderService
    participant DB as 数据库
    
    User->>Controller: POST /order/create
    Controller->>Service: create(req)
    Service->>Service: validate() 校验
    Service->>DB: save() 保存
    Service-->>Controller: 返回订单号
    Controller-->>User: 创建成功
\`\`\`

完成后告诉我："✅ 核心业务流程已补充"
\`\`\`

---

## 第 3 步：补充业务规则

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：补充【📜 核心业务规则】章节。

要求：
1. 阅读 Service 代码中的校验逻辑和业务判断
2. 提取 3-5 个核心业务规则
3. 每个规则说明：
   - 判断条件: [什么情况下触发]
   - 处理逻辑: [如何处理]
   - 异常情况: [边界场景如何处理]

完成后告诉我："✅ 核心业务规则已补充"
\`\`\`

---

## 第 4 步：补充状态流转

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：补充【🔀 状态流转】章节。

要求：
1. 找出该模块的核心实体（如 Order、Task）
2. 找出状态枚举类
3. 用 Mermaid stateDiagram 绘制状态流转图
4. 列出每个状态可执行的操作

完成后告诉我："✅ 状态流转已补充"
\`\`\`

---

## 第 5 步：补充 Controller 描述

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：为所有 Controller 补充描述。

对于每个 Controller：
1. 阅读代码，理解它负责什么业务
2. 补充【描述】：一句话说明业务功能
3. 补充【业务功能】：列出 2-3 个主要功能
4. 补充【服务场景】：说明谁使用这些 API

对于每个 Controller 方法：
1. 补充【用途】：这个接口做什么
2. 补充【重要业务逻辑】：调用了哪些 Service，有什么关键检查

一个一个 Controller 处理，每处理完一个报告一次。

完成后告诉我："✅ Controller 描述已补充"
\`\`\`

---

## 第 6 步：补充 Service 方法描述

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：为所有 Service 的核心方法补充描述。

只处理 public 方法，对于每个方法：
1. 阅读代码逻辑
2. 补充业务描述，格式如下：

| 方法 | 参数 | 返回类型 | 业务描述 |
|------|------|----------|----------|
| create() | req | String | **订单创建**<br>1. 校验时间<br>2. 检查重复<br>3. 保存订单 |

重点：
- 说明这个方法做什么（业务目的）
- 列出关键步骤（1. 2. 3.）
- 标注重要的业务规则

一个一个 Service 处理，每处理完一个报告一次。

完成后告诉我："✅ Service 方法描述已补充"
\`\`\`

---

## 第 7 步：补充 DTO 字段描述

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：为重要 DTO 的关键字段补充描述。

优先处理：
- 请求参数 DTO（XxxReq）
- 响应结果 DTO（XxxVO、XxxResp）
- 核心实体（Entity）

对于每个重要字段：
1. 补充业务含义
2. 补充示例值
3. 如果有单位，标注单位

格式：
| 字段 | 类型 | 业务含义 | 示例/取值 |
|------|------|----------|----------|
| code | String | 订单编号 | "ORD20250312001234" |
| duration | Long | 行程时长 | 单位：秒，1800=30分钟 |

完成后告诉我："✅ DTO 字段描述已补充"
\`\`\`

---

## 第 8 步：补充 FAQ

\`\`\`
继续编辑 cainiaospec/modules/[模块名].md 文件。

只做这一件事：补充【❓ 常见问题 FAQ】章节。

根据你对代码的理解，添加 3-5 个开发者可能遇到的问题：

格式：
### Q1: [问题]
A: [答案]

### Q2: [问题]
A: [答案]

问题类型建议：
- 状态判断类：如"如何判断订单能否取消？"
- 规则解释类：如"什么情况下会触发重复订单检查？"
- 异常处理类：如"创建订单失败的常见原因？"

完成后告诉我："✅ FAQ 已补充"
\`\`\`

---

## 第 9 步：清理和检查

\`\`\`
请检查 cainiaospec/modules/[模块名].md 文件。

1. 删除所有【请 AI 补充】的占位符
2. 删除所有示例模板文字
3. 确保所有章节都有实际内容
4. 如果有遗漏的描述（显示为 \`-\`），补充完整

检查清单：
- [ ] 业务场景有实际内容
- [ ] 核心业务流程有 Mermaid 图
- [ ] 业务规则有具体内容
- [ ] 所有 Controller 有描述
- [ ] 所有 Controller 方法有用途说明
- [ ] 核心 Service 方法有业务描述
- [ ] 重要 DTO 字段有说明
- [ ] FAQ 有 3-5 个问题

完成后告诉我："✅ 文档检查完成"
\`\`\`

---

## 💡 使用技巧

1. **一次一步**：每次只发一个提示词，等 AI 完成后再发下一个
2. **替换模块名**：把 \`[模块名]\` 替换成实际的模块文件名
3. **大模块分批**：如果模块有很多 Controller，可以分批处理
4. **及时保存**：每完成一步，确认 AI 已保存文件

## 📋 快速清单

按顺序发送：
1. ✅ 业务场景
2. ✅ 核心业务流程
3. ✅ 业务规则
4. ✅ 状态流转
5. ✅ Controller 描述
6. ✅ Service 方法描述
7. ✅ DTO 字段描述
8. ✅ FAQ
9. ✅ 清理和检查
`;
  }
}
