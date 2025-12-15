export type SlashCommandId = 'proposal' | 'apply' | 'archive';

const baseGuardrails = `**Guardrails**
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to \`cainiaospec/AGENTS.md\` (located inside the \`cainiaospec/\` directory—run \`ls openspec\` or \`cainiaospec update\` if you don't see it) if you need additional CainiaoSpec conventions or clarifications.`;

const proposalGuardrails = `${baseGuardrails}\n- Identify any vague or ambiguous details and ask the necessary follow-up questions before editing files.
- Do not write any code during the proposal stage. Only create design documents (proposal.md, tasks.md, design.md, and spec deltas). Implementation happens in the apply stage after approval.`;

const proposalSteps = `**Steps**
1. **理解项目结构**: 阅读 \`cainiaospec/project.md\` 了解项目概览。
2. **理解业务逻辑**: 根据用户需求，阅读相关模块的文档：
   - \`cainiaospec/modules/[模块名]/README.md\` - 业务场景、流程图、业务规则
   - \`cainiaospec/modules/[模块名]/controllers.md\` - API 端点、参数格式、错误码
   - \`cainiaospec/modules/[模块名]/services.md\` - 业务方法、异常处理
   - \`cainiaospec/modules/[模块名]/models.md\` - 实体字段、格式约束、示例值
3. **检查现有规范**: 运行 \`cainiaospec list\` 和 \`cainiaospec list --specs\` 查看现有变更和规范。
4. **创建变更目录**: 选择一个唯一的动词开头的 \`change-id\`，在 \`cainiaospec/changes/<id>/\` 下创建 \`proposal.md\`、\`tasks.md\` 和 \`design.md\`（如需）。
5. **设计变更范围**: 将变更拆分为具体的能力或需求，在 \`design.md\` 中记录架构决策。
6. **起草规范变更**: 在 \`changes/<id>/specs/<capability>/spec.md\` 中使用 \`## ADDED|MODIFIED|REMOVED Requirements\` 格式。
7. **起草任务列表**: 在 \`tasks.md\` 中列出有序的、可验证的工作项。
8. **验证提案**: 运行 \`cainiaospec validate <id> --strict\` 并解决所有问题。`;


const proposalReferences = `**Reference**
- Use \`cainiaospec show <id> --json --deltas-only\` or \`cainiaospec show <spec> --type spec\` to inspect details when validation fails.
- Search existing requirements with \`rg -n "Requirement:|Scenario:" cainiaospec/specs\` before writing new ones.
- Explore the codebase with \`rg <keyword>\`, \`ls\`, or direct file reads so proposals align with current implementation realities.`;

const applySteps = `**Steps**
Track these steps as TODOs and complete them one by one.
1. Read \`changes/<id>/proposal.md\`, \`design.md\` (if present), and \`tasks.md\` to confirm scope and acceptance criteria.
2. Work through tasks sequentially, keeping edits minimal and focused on the requested change.
3. Confirm completion before updating statuses—make sure every item in \`tasks.md\` is finished.
4. Update the checklist after all work is done so each task is marked \`- [x]\` and reflects reality.
5. **同步更新模块文档**: 实施完成后，必须更新相关的模块文档：
   - \`cainiaospec/modules/[模块名]/controllers.md\` - 新增/修改的 API 端点、参数格式、错误码
   - \`cainiaospec/modules/[模块名]/services.md\` - 新增/修改的业务方法、异常处理
   - \`cainiaospec/modules/[模块名]/models.md\` - 新增/修改的实体字段、格式约束
   - \`cainiaospec/modules/[模块名]/README.md\` - 如果业务流程有变化
6. Reference \`cainiaospec list\` or \`cainiaospec show <item>\` when additional context is required.`;

const applyReferences = `**Reference**
- Use \`cainiaospec show <id> --json --deltas-only\` if you need additional context from the proposal while implementing.`;

const archiveSteps = `**Steps**
1. Determine the change ID to archive:
   - If this prompt already includes a specific change ID (for example inside a \`<ChangeId>\` block populated by slash-command arguments), use that value after trimming whitespace.
   - If the conversation references a change loosely (for example by title or summary), run \`cainiaospec list\` to surface likely IDs, share the relevant candidates, and confirm which one the user intends.
   - Otherwise, review the conversation, run \`cainiaospec list\`, and ask the user which change to archive; wait for a confirmed change ID before proceeding.
   - If you still cannot identify a single change ID, stop and tell the user you cannot archive anything yet.
2. Validate the change ID by running \`cainiaospec list\` (or \`cainiaospec show <id>\`) and stop if the change is missing, already archived, or otherwise not ready to archive.
3. Run \`cainiaospec archive <id> --yes\` so the CLI moves the change and applies spec updates without prompts (use \`--skip-specs\` only for tooling-only work).
4. Review the command output to confirm the target specs were updated and the change landed in \`changes/archive/\`.
5. **必须同步更新模块文档**（不可跳过）: 
   如果变更涉及新增/修改 Controller、Service 或 Model，必须更新相应的模块文档：
   - \`cainiaospec/modules/[模块名]/controllers.md\` - 新增/修改的 API 端点、参数格式、错误码
   - \`cainiaospec/modules/[模块名]/services.md\` - 新增/修改的业务方法、伪代码、异常处理
   - \`cainiaospec/modules/[模块名]/models.md\` - 新增/修改的实体字段、格式约束、示例值
   - \`cainiaospec/modules/[模块名]/README.md\` - 如果业务流程/规则有变化
   
   **更新要求**:
   - 每个新增的类/方法/字段都必须记录
   - 填写完整的占位符内容，不留 \`[请补充]\`
   - 保持文档与代码同步
6. Validate with \`cainiaospec validate --strict\` and inspect with \`cainiaospec show <id>\` if anything looks off.`;

const archiveReferences = `**Reference**
- Use \`cainiaospec list\` to confirm change IDs before archiving.
- Inspect refreshed specs with \`cainiaospec list --specs\` and address any validation issues before handing off.`;

export const slashCommandBodies: Record<SlashCommandId, string> = {
  proposal: [proposalGuardrails, proposalSteps, proposalReferences].join('\n\n'),
  apply: [baseGuardrails, applySteps, applyReferences].join('\n\n'),
  archive: [baseGuardrails, archiveSteps, archiveReferences].join('\n\n')
};

export function getSlashCommandBody(id: SlashCommandId): string {
  return slashCommandBodies[id];
}
