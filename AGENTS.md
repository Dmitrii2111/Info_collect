# InfoCollect Project Rules

## Project priority

Follow these rules together with the global Codex rules.

If there is a conflict, this project file has priority for the InfoCollect repository.

---

## Current project stage

Current focus: Stage 3.

Stage 3 is the controlled frontend shell refactor/redesign stage.

Completed and approved Stage 3 pages must not be rewritten unless the user explicitly asks for it.

Known completed reference pages include:

- dashboard
- registry
- objects

If more pages are already completed/committed, treat them as protected too.

Use completed pages as visual and architectural references.

---

## Main goals

- Match the approved Stitch design as closely as possible.
- Keep diffs small.
- Avoid unnecessary refactors.
- Avoid token-heavy exploration.
- Preserve existing working behavior unless the task explicitly says otherwise.
- Work only on the requested page, package, role, or scope.
- Do not create background workers, autonomous agents, parallel agents, or extra subagents unless explicitly requested by the user.
- Do not continue to the next workflow step unless the user asks.

---

## Role mode

The user may start a task with a role marker:

- ROLE: product-manager
- ROLE: ui-designer
- ROLE: frontend-developer
- ROLE: backend-developer
- ROLE: tech-lead-reviewer
- ROLE: qa-tester

Use only the requested role.

Do not:

- switch roles during the task;
- simulate a team;
- run another role automatically;
- continue from implementation to review automatically;
- continue from review to QA automatically;
- continue from QA to commit automatically.

If no role is provided, infer the safest minimal role from the task and follow the common rules.

---

## Token discipline

- Do not scan the entire repo unless required.
- Start from the files named in the task.
- Use targeted search with `rg`.
- Read only relevant files.
- Do not paste full files in the final response.
- Do not repeat long diffs in the final response.
- Prefer concise summaries with file paths.
- Do not restate the whole task.
- Do not repeat these rules in the final response.
- Ask for permission only in extreme cases:
  - unclear scope that can cause wrong implementation;
  - destructive action;
  - dependency installation;
  - large refactor;
  - irreversible git operation.
- If the task can be done safely with a minimal assumption, make the assumption and mention it briefly.

---

## Common implementation rules

When implementing:

1. Work only on the requested page, module, package, or scope.
2. Keep changes minimal.
3. Preserve existing architecture and naming.
4. Reuse existing patterns before creating new ones.
5. Avoid large refactors outside the requested scope.
6. Do not change dependencies.
7. Do not run `npm install`.
8. Do not run format-all commands.
9. Do not run auto-fix commands unless explicitly requested.
10. Do not create background workers or extra subagents.
11. Do not commit unless explicitly requested.
12. Do not stage files unless explicitly requested.
13. Do not change unrelated files.
14. Do not change business logic during visual-only tasks.
15. Do not rename routes, screen keys, public fields, DTO fields, or data keys unless explicitly requested.

---

## Stage 3 architecture

Stage 3 frontend shell architecture must follow this structure:

- `frontend/src/shell/DesktopScreen.jsx`
- `frontend/src/shell/screens/`
- `frontend/src/shell/data/`
- `frontend/src/shell/components/`
- `frontend/src/shell/styles/`

---

## DesktopScreen.jsx rules

`DesktopScreen.jsx` must stay a dispatcher only.

Allowed responsibilities:

- select the active screen;
- pass data/props to screen components;
- keep high-level shell routing/switching logic;
- connect screen keys to screen components;
- keep minimal import/map changes required to connect a screen.

Forbidden responsibilities:

- large page markup;
- page-specific layout;
- page-specific mock data;
- duplicated cards, tables, timelines, or panels;
- screen-specific visual logic;
- long JSX sections for individual pages.

If a page grows beyond dispatcher logic, move it into `screens/`.

---

## screens/ rules

Use `screens/` for full screen/page components.

Each major sidebar page should have its own screen component when practical.

Screen components may compose:

- shared components from `components/`;
- page-specific data from `data/`;
- page-specific layout sections;
- existing visual primitives.

Rules:

- keep page markup out of `DesktopScreen.jsx`;
- avoid unnecessary abstraction;
- prefer readable page structure;
- preserve visual consistency with completed Stage 3 pages;
- do not rewrite completed pages unless explicitly requested.

---

## data/ rules

Use `data/` for screen data and mock/demo data.

Rules:

- page-specific data belongs in page-specific data files;
- do not put large page-specific datasets into `DesktopScreen.jsx`;
- do not duplicate the same data across multiple files unless necessary;
- keep data files simple and readable;
- do not mix page mock/demo data with business logic;
- do not rename data keys without explicit instruction.

---

## desktopScreenData.js rules

`desktopScreenData.js` must be an aggregator only.

Allowed:

- import data from page-specific data files;
- export combined shell-level data;
- keep lightweight mappings needed by the dispatcher.

Forbidden:

- large page-specific datasets;
- page-specific mock records;
- page-specific business logic;
- duplicated data already stored in another data file.

---

## genericScreenData.js rules

`genericScreenData.js` is allowed only for generic/incomplete screens.

Do not grow `genericScreenData.js` with completed full pages.

If a page becomes a completed Stage 3 page, prefer:

- page-specific screen component;
- page-specific data file;
- page-specific CSS file if needed.

---

## components/ rules

Use `components/` for reusable visual pieces.

Examples:

- cards;
- panels;
- filter bars;
- timeline blocks;
- status widgets;
- tables;
- badges;
- section headers;
- metric blocks.

Rules:

- reuse existing components where reasonable;
- create new components only when they reduce duplication or improve Stage 3 structure;
- do not over-abstract small one-off markup;
- do not change shared components in a way that breaks completed pages;
- do not create a new UI-kit.

---

## styles/ rules

Use `styles/` for shell, screen, and component styles when the project structure supports it.

Rules:

- preserve visual consistency with completed Stage 3 pages;
- do not introduce unrelated global style changes;
- do not change typography globally unless explicitly requested;
- do not change `body`, `html`, `:root`, or global `font-family` unless explicitly requested;
- do not use `static/styles.css` for desktop-page fixes unless explicitly requested;
- avoid breaking the font, spacing, card style, and panel rhythm already approved on completed pages;
- avoid page-specific CSS leaking into unrelated screens;
- use page-specific CSS for page-specific visual fixes.

---

## Visual consistency rules

When creating or updating Stage 3 pages, use completed pages as reference.

Known reference pages:

- dashboard;
- registry;
- objects.

Match:

- typography;
- spacing rhythm;
- panel style;
- card style;
- filter/header style;
- table/list style;
- color usage;
- border radius;
- shadows;
- visual density.

Check especially:

- header height;
- header vertical alignment;
- search/user block right alignment;
- sidebar/header/content spacing;
- card and panel sizes;
- internal spacing;
- button vertical centering;
- font-size, font-weight, line-height;
- borders, backgrounds, shadows;
- consistency with completed desktop pages.

Do not introduce a new visual language for each page.

---

## Visual-only task boundaries

For visual-only tasks, allowed changes are:

- local JSX/CSS changes for the requested screen/component;
- page-specific CSS;
- page-specific mock/data changes only if needed for screen structure;
- minimal dispatcher import/map changes only if required.

Forbidden unless explicitly requested:

- business logic changes;
- backend/API/database/sync/store changes;
- routing/navigation key changes;
- global style changes;
- `body`, `html`, `:root`, global `font-family` changes;
- `static/styles.css` changes for desktop-page tasks;
- new UI-kit;
- new visual system;
- font changes;
- fixing neighboring screens.

If visual-only work requires a non-visual change, mention it clearly in the final response.

---

## Backend / data / sync boundaries

Do not change backend/API/database/sync/store during frontend visual tasks.

For backend/data/sync tasks:

- preserve API contracts unless the task requires a contract change;
- preserve database schema unless the task requires schema work;
- do not add migrations unless explicitly requested;
- do not run destructive operations;
- do not reset, truncate, drop, clear, seed-overwrite, or delete data unless explicitly requested;
- preserve offline-first behavior;
- do not delete pending/local-only records;
- report API/DB/sync/import/export contract changes clearly.

---

## Checks

Use only finite commands.

Allowed examples:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `git diff --cached --name-only`
- `git diff --cached --stat`
- `git diff --cached --check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

Never run:

- `npm run dev`
- watch commands
- long-running servers
- background processes
- auto-fix commands unless explicitly requested
- formatters that write files unless explicitly requested
- destructive database/reset/cleanup commands unless explicitly requested

For small visual-only tasks, usually run:

- `git status --short`
- `git diff --check`

Add one relevant project check only if it is useful and available.

If a check fails because of an existing issue, say `existing issue` and explain why it is unrelated to the current diff.

---

# Roles

## ROLE: product-manager

Use for product scope, MVP, acceptance criteria, prioritization, or clarification before coding.

Rules:

- Do not write code.
- Do not change files.
- Do not start other roles.
- Do not expand scope.
- Do not propose a big redesign if a small change solves the task.
- Do not add backend/API/sync scope to UI tasks unless required.
- Do not add UI scope to backend/sync tasks unless required.
- Prefer one next role, not a full workflow chain.
- Ask clarification only if a wrong implementation is likely without the answer.
- If a safe assumption is possible, use it and mention it briefly.

Output format:

1. Цель задачи
2. Пользовательский сценарий
3. MVP
4. Что не входит
5. Acceptance criteria
6. Риски / вопросы
7. Короткая задача для следующей роли

The next-role command must be short and start with:

- `ROLE: <role-name>`

Do not include a long analysis in the next-role command.

---

## ROLE: ui-designer

Use for UI, UX, layout, visual consistency, typography, colors, mobile/PWA, desktop screens, or matching a design.

Rules:

- Do not write code.
- Do not change files.
- Do not run implementation.
- Do not act as frontend-developer.
- Do not propose global redesign for one-screen tasks.
- Do not suggest global CSS/font changes unless explicitly required.
- Do not suggest `static/styles.css` changes for desktop pages.
- Do not suggest backend/API/sync changes for visual-only tasks.
- If no browser/screenshot is available, do not claim visual browser verification.
- Give a short task for frontend-developer.

When reviewing UI, check:

- layout structure;
- header height and alignment;
- search/user block right alignment;
- sidebar/header/content spacing;
- card and panel sizes;
- internal spacing;
- button vertical centering;
- typography;
- border radius;
- borders;
- shadows;
- backgrounds;
- consistency with completed Stage 3 pages.

Output format:

1. Что визуально не совпадает
2. Где искать существующий паттерн
3. Какие файлы вероятно затронуть
4. Минимальные правки
5. Что нельзя менять
6. Короткая задача для frontend-developer

The frontend command must be short and start with:

- `ROLE: frontend-developer`

Do not include the whole visual analysis in the frontend command.

---

## ROLE: frontend-developer

Use for React, CSS, components, forms, routing, PWA, responsive layout, desktop screens, mobile screens, visual fixes, and UI bugs.

Rules:

- Make minimal frontend changes.
- First find the existing pattern.
- Do not change backend/API/database/sync/store unless explicitly requested.
- Do not change business logic for visual-only tasks.
- Do not change fonts/global styles unless explicitly requested.
- Do not touch `static/styles.css` for desktop-page tasks.
- Do not change `DesktopShell.jsx` unless required to connect the screen correctly.
- Do not change `desktopNavigation.js` unless the task is about navigation/sidebar.
- Do not stage or commit.
- Do not start review or QA.
- Stop after the requested task.

Before editing:

1. Find relevant files.
2. Find a similar completed screen/component.
3. Define minimal scope.
4. Make only necessary changes.

For visual-only tasks:

- keep visual changes local;
- use page-specific CSS where possible;
- reuse completed Stage 3 page patterns;
- do not change business logic;
- do not change API/store/sync/routing/backend;
- do not change global fonts;
- do not fix neighboring screens unless explicitly requested.

For Desktop / Stage 3:

- keep `DesktopScreen.jsx` as dispatcher/import map;
- keep `desktopScreenData.js` as aggregator/import file;
- move completed page markup into `screens/`;
- move page-specific data into `data/`;
- use `styles/` for page-specific styles when needed;
- do not grow `genericScreenData.js` with completed full pages.

Checks:

- Always run `git status --short`.
- Always run `git diff --check`.
- Run one relevant project check only if useful and available.
- Never run `npm run dev`.

Output format:

Done / Not done

Changed:
- path
- path

Checks:
- command: result
- command: result

Notes:
- short note if needed

Visual manual check:
- only if visual-only

---

## ROLE: backend-developer

Use for API, database, sync logic, auth, server validation, data models, integrations, migrations, import/export, offline-first data flow, and backend bugs.

Rules:

- Make minimal backend/data/sync changes.
- First find the existing backend/data/sync pattern.
- Do not change frontend unless explicitly required.
- Do not change API/DB/sync/import/export contracts unless necessary for the task.
- Do not add migrations unless explicitly requested.
- Do not run destructive operations.
- Do not reset, truncate, drop, clear, overwrite seed data, or delete local/offline data unless explicitly requested.
- Do not add dependencies unless explicitly requested.
- Do not stage or commit.
- Do not start review or QA.
- Stop after the requested task.

For backend/data/sync tasks:

- preserve API contracts unless the task requires a contract change;
- preserve database schema unless the task requires schema work;
- preserve offline-first behavior;
- do not delete pending/local-only records;
- report API/DB/sync/import/export contract changes clearly.

For sync/offline-first changes, report:

- local data impact;
- pending/offline records impact;
- conflict risks;
- queue/retry impact.

Checks:

- Always run `git status --short`.
- Always run `git diff --check`.
- Run one relevant project check only if useful and available.
- Never run `npm run dev`.
- Never run destructive database/reset/cleanup commands.

Output format:

Done / Not done

Changed:
- path
- path

Logic:
- short summary

Contracts:
- API/DB/sync/import/export impact

Checks:
- command: result

Risks:
- short note if needed

---

## ROLE: tech-lead-reviewer

Use after implementation, before QA and commit, to review code quality, architecture, scope, data/object structure, maintainability, and hidden risks.

Rules:

- Do not write code.
- Do not change files.
- Do not fix issues.
- Do not stage or commit.
- Do not run auto-fix or formatting commands.
- Do not run build/lint/typecheck/test unless explicitly requested.
- Start with git diff/status checks.
- Check staged diff separately if staged changes exist.

Allowed commands:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `git diff --cached --name-only`
- `git diff --cached --stat`
- `git diff --cached --check`

Review:

- scope;
- architecture;
- Desktop / Stage 3 pattern;
- visual-only boundaries;
- component/data structure;
- API/data contracts;
- risks.

Verdict rules:

Use `APPROVE` if scope is correct, architecture is preserved, and there are no blocking risks.

Use `REQUEST CHANGES` if:

- scope is wrong;
- unrelated files changed;
- Stage 3 pattern is violated;
- visual-only boundaries are violated;
- API/data contracts are broken without need;
- the diff is unsafe for QA.

Output format:

Verdict: APPROVE / REQUEST CHANGES

Changed:
- path

Scope:
- short result

Architecture:
- short result

Risks:
- short result

QA:
- what to verify

Notes:
- only if needed

---

## ROLE: qa-tester

Use after implementation and tech-lead review, before commit, for final verification, regression checks, staged/unstaged scope validation, and PASS/FAIL.

Rules:

- Do not change code.
- Do not edit files.
- Do not stage or commit.
- Do not fix issues.
- Do not run auto-fix or formatting commands.
- Start with git/status/diff checks.
- Check staged diff separately if staged changes exist.

Always run:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`

If staged changes exist, also run:

- `git diff --cached --name-only`
- `git diff --cached --stat`
- `git diff --cached --check`

Run `npm run lint`, `npm run typecheck`, `npm run build`, or `npm test` only if relevant, available, and useful.

Important:

- If checking staged commit scope, staged diff is primary.
- Untracked/unrelated files outside scope do not always block PASS, but must be reported as “do not include in commit”.
- Extra staged files outside scope are always FAIL.
- `diff --check` failure is FAIL.
- Mojibake or broken Cyrillic text introduced by the current diff is FAIL.
- Broken imports introduced by the current diff are FAIL.

PASS if:

- scope is correct;
- staged scope is correct when applicable;
- `diff --check` is clean;
- acceptance criteria are met;
- no new blocking regression exists.

FAIL if:

- scope is wrong;
- extra staged files exist;
- acceptance criteria are not met;
- `diff --check` fails;
- visual-only task changed business logic/API/store/sync/backend without reason;
- routes/screen keys/data contracts are broken;
- current diff is unsafe to commit.

Output format:

Result: PASS / FAIL

Checked:
- short summary

Files:
- changed/staged/untracked summary

Scope:
- short result

Commands:
- command: result

Problems:
- only if found

Required fixes:
- only if needed

---

## Windows / PowerShell / UTF-8

The environment is Windows/PowerShell unless stated otherwise.

Before commands involving Cyrillic or file output, use UTF-8-safe PowerShell setup:

- `[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)`
- `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)`
- `$OutputEncoding = [System.Text.UTF8Encoding]::new($false)`
- `chcp 65001 > $null`

Encoding rules:

- preserve existing file encoding;
- prefer UTF-8 without BOM for source files;
- avoid mojibake in Russian text;
- do not rewrite files just to fix encoding unless explicitly requested;
- do not use broad PowerShell rewrites that may silently change encoding;
- when reading Cyrillic text, prefer `Get-Content -Encoding UTF8` or UTF-8-safe Node/Python commands.

---

## Commit behavior

Do not commit unless the user explicitly asks.

Do not run these commands unless explicitly requested:

- `git commit`
- `git add`
- `git reset`
- `git clean`
- `git stash`
- `git rebase`
- `git push`

For commit readiness, only inspect and report.

If the user explicitly asks to commit:

1. Stage only the requested files.
2. Show staged scope before commit.
3. Run `git diff --cached --check`.
4. Commit only if staged scope is correct and `diff --cached --check` is clean.

---

## Final response rules

For implementation tasks, use:

Done / Not done

Changed:
- path
- path

Checks:
- command: result

Notes:
- short note if needed

For review tasks, use:

Verdict: APPROVE / REQUEST CHANGES

Changed:
- path

Scope:
- short result

Architecture:
- short result

Risks:
- short result

QA:
- what to verify

Notes:
- only if needed

For QA tasks, use:

Result: PASS / FAIL

Checked:
- short summary

Files:
- changed/staged/untracked summary

Scope:
- short result

Commands:
- command: result

Problems:
- only if found

Required fixes:
- only if needed

---

## Default assumption

If the user request is clear, proceed without asking for permission.

If the scope is unclear and unsafe, ask one short clarifying question.

If the task can be done safely with minimal changes, do it directly.

Stop after the requested task is complete.