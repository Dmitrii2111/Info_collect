# InfoCollect — project rules

## Main principle

Work with minimal changes.

Do not rewrite working code without a clear reason.
Do not improve unrelated code.
Do not change architecture unless the task explicitly requires it.

The goal is to reduce token usage, keep diffs small, and preserve the existing project structure.

---

## Language and reports

- Reports to the user must be in Russian.
- Keep reports short and structured.
- Do not include large diffs unless explicitly requested.
- Do not print full files unless explicitly requested.
- Do not repeat these rules in reports.

---

## Subagent usage

Use only the subagent explicitly requested by the user.

The expected user command format is:

`Используй subagent <agent-name>.`

When a subagent is requested, follow that role strictly.

Do not:
- create agent teams;
- run multiple subagents in parallel;
- delegate to another subagent;
- launch the full workflow automatically;
- switch roles during the task.

Available project roles:

- product-manager — product scope, MVP, acceptance criteria
- ui-designer — visual review and minimal UI specification
- frontend-developer — frontend implementation
- backend-developer — backend/API/sync/data implementation
- tech-lead-reviewer — code/scope/architecture review
- qa-tester — final verification before commit

If no subagent is explicitly requested, follow these project rules directly and do not self-delegate.

---

## Recommended workflow

This workflow is a reference for the user and for understanding task order.
Do not execute the whole workflow automatically.

For unclear product features:

1. product-manager

For UI / visual tasks:

1. ui-designer
2. frontend-developer
3. tech-lead-reviewer
4. qa-tester

For frontend implementation:

1. frontend-developer
2. tech-lead-reviewer
3. qa-tester

For backend / API / sync / data tasks:

1. backend-developer
2. tech-lead-reviewer
3. qa-tester

For trivial safe changes, the user may skip review steps.

---

## Coding rules

- Preserve existing architecture and naming.
- Prefer small diffs.
- Do not change unrelated files.
- Do not change business logic during visual-only tasks.
- Do not change API, store, sync, routing, backend or database during visual-only tasks.
- Do not rename routes, screen keys, entities or public fields without explicit instruction.
- Do not change package.json or lock files unless the task explicitly requires it.
- Do not add dependencies unless explicitly requested.
- Always report changed files.
- Always mention checks that were run.
- Never commit changes.
- Never run `npm run dev` as a verification command.

---

## Desktop / Stage 3 architecture rules

For desktop page work:

- Prefer a dedicated screen component for each completed desktop page.
- Prefer a dedicated data file for each completed desktop page.
- Prefer a dedicated CSS file when page-specific styles are needed.
- Keep `DesktopScreen.jsx` as a dispatcher/import map, not a place for new page UI logic.
- Keep `desktopScreenData.js` as a data aggregator, not a place for large page datasets.
- Do not grow `genericScreenData.js` with completed full pages if the page should have its own data file.
- Do not put page-specific logic into `DesktopShell.jsx` without a clear reason.
- Do not change `desktopNavigation.js` unless navigation itself is part of the task.
- Do not break existing screen keys/routes.
- Preserve existing sidebar order and naming unless explicitly requested.

---

## Visual implementation rules

When the task is visual-only, the main goal is maximum match with the approved design.

Check:

- layout structure;
- header height and vertical alignment;
- sidebar/content/header spacing;
- right alignment of search and user block;
- card sizes;
- panel spacing;
- button vertical centering;
- typography consistency;
- font-size, font-weight and line-height;
- border-radius;
- shadows;
- borders;
- background colors;
- empty states;
- hover/active states if already present;
- consistency with already completed pages.

Do not:

- change global fonts;
- change `body`, `html`, `:root` or global font-family;
- change `static/styles.css` for desktop page tasks;
- create a new UI-kit;
- introduce a new visual language;
- solve visual mismatch by changing business logic;
- touch API/store/sync/routing/backend for visual-only tasks.

If there is an existing pattern on another finished page, reuse it.

---

## Scope control

Before editing:

1. Identify the relevant files.
2. Check existing patterns.
3. Make the smallest safe change.
4. Avoid touching files outside the requested scope.

After editing:

1. Report changed files.
2. Report what changed.
3. Report checks.
4. Report risks.

When acting as reviewer or QA, explicitly report PASS/FAIL or APPROVE/REQUEST CHANGES.

---

## Checks

Use only finite commands.

Allowed examples:

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git diff --check`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

Do not run:

- `npm run dev`
- watch commands
- long-running servers
- background processes
- expensive checks unless explicitly requested

For implementation tasks, run only relevant available checks.
For review tasks, do not run build/lint/typecheck/test unless the user explicitly asks.
For QA tasks, run the lightweight required checks first, then available project checks if appropriate.

If a check is unavailable or fails because of an existing issue, say so clearly.

---

## Cost control

- Spend as few tokens as possible.
- Do not restate the whole task.
- Do not print large files unless requested.
- Do not print large diffs unless requested.
- Prefer targeted file reads over broad exploration.
- Prefer `Grep` / `Glob` before opening many files.
- Do not inspect unrelated areas of the project.
- Ask for clarification only when the task cannot be safely completed without it.
- If the task is clear enough, make a best-effort implementation without extra questions.

Model guidance:

- Use Haiku for simple review/checklist work.
- Use Sonnet for implementation.
- Use Opus only for complex architecture decisions.

---

## Report format

For implementation agents:

1. Изменённые файлы
2. Что изменено
3. Какие проверки запущены
4. Результат проверок
5. Риски / замечания

For reviewers:

1. Verdict: APPROVE / REQUEST CHANGES
2. Изменённые файлы
3. Scope review
4. Architecture review
5. Risks
6. Что проверить в QA
7. Итоговая рекомендация

For QA:

1. Что проверено
2. Команды
3. Результат
4. Найденные проблемы
5. Вердикт: PASS / FAIL