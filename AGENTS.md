# InfoCollect Project Rules

## Project priority

Follow these rules together with the global Codex rules.

If there is a conflict, this project file has priority for the InfoCollect repository.

## Current project stage

Current focus: Stage 3.

Stage 3 is the controlled frontend shell refactor/redesign stage.

Already completed and committed in Stage 3 / Package 1:

- dashboard
- registry
- objects

Do not rewrite these completed pages unless the user explicitly asks for it.

## Main goals

- Match the approved Stitch design as closely as possible.
- Keep diffs small.
- Avoid unnecessary refactors.
- Avoid token-heavy exploration.
- Preserve existing working behavior unless the task explicitly says otherwise.
- Do not create background workers, autonomous agents, parallel agents, or extra subagents unless explicitly requested by the user.

## Token discipline

- Do not scan the entire repo unless required.
- Start from the files named in the task.
- Use targeted search with `rg`.
- Read only relevant files.
- Do not paste full files in the final response.
- Do not repeat long diffs in the final response.
- Prefer concise summaries with file paths.
- Ask for permission only in extreme cases:
  - unclear scope;
  - destructive action;
  - dependency installation;
  - large refactor;
  - irreversible git operation.

## Stage 3 architecture

Stage 3 frontend shell architecture must follow this structure:

```text
frontend/src/shell/
  DesktopScreen.jsx
  screens/
  data/
  components/
  styles/
```

## DesktopScreen.jsx rules

`DesktopScreen.jsx` must stay a dispatcher only.

Allowed responsibilities:

- select the active screen;
- pass data/props to screen components;
- keep high-level shell routing/switching logic;
- connect screen keys to screen components.

Forbidden responsibilities:

- large page markup;
- page-specific layout;
- page-specific mock data;
- duplicated cards, tables, timelines, or panels;
- screen-specific visual logic;
- long JSX sections for individual pages.

If a page grows beyond dispatcher logic, move it into `screens/`.

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
- preserve visual consistency with completed Stage 3 pages.

## data/ rules

Use `data/` for screen data and mock/demo data.

Rules:

- page-specific data belongs in page-specific data files;
- do not put large page-specific datasets into `DesktopScreen.jsx`;
- do not duplicate the same data across multiple files unless necessary;
- keep data files simple and readable.

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
- do not change shared components in a way that breaks completed pages.

## styles/ rules

Use `styles/` for shell, screen, and component styles when the project structure supports it.

Rules:

- preserve visual consistency with completed Stage 3 pages;
- do not introduce unrelated global style changes;
- do not change typography globally unless explicitly requested;
- avoid breaking the font, spacing, card style, and panel rhythm already approved on dashboard, registry, and objects;
- avoid page-specific CSS leaking into unrelated screens.

## Visual consistency rules

When creating or updating Stage 3 pages, use completed Package 1 pages as reference:

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
- visual density.

Do not introduce a new visual language for each page.

## Implementation rules

When implementing:

1. Work only on the requested page or package.
2. Keep `DesktopScreen.jsx` as dispatcher.
3. Move page markup into `screens/`.
4. Move page-specific data into `data/`.
5. Reuse existing `components/` where reasonable.
6. Add new components only when useful.
7. Keep `desktopScreenData.js` as aggregator only.
8. Avoid large refactors outside the requested scope.
9. Do not change dependencies.
10. Do not run `npm install`.
11. Do not run format-all commands.
12. Do not create background workers or extra subagents.
13. Do not commit unless explicitly requested.
14. Do not stage files unless explicitly requested.

## Review rules

A tech lead review must check:

- scope compliance;
- no unrelated files changed;
- Stage 3 architecture;
- `DesktopScreen.jsx` dispatcher-only rule;
- `screens/`, `data/`, `components/`, `styles/` usage;
- `desktopScreenData.js` aggregator-only rule;
- visual consistency with Package 1;
- unnecessary diffs;
- risky changes;
- broken imports;
- dead code;
- over-abstraction;
- encoding/mojibake issues.

## QA rules

QA must verify:

- `git status --short`;
- no unrelated unstaged files;
- no accidental untracked files;
- scope matches the requested task;
- `git diff --check`;
- `git diff --cached --check` if files are staged;
- no blank-line-at-EOF warnings;
- no mojibake or broken Cyrillic text;
- no obvious broken imports;
- no architecture regression;
- cheap project check if available and appropriate.

QA must not modify files.

QA must not commit.

## Windows / PowerShell / UTF-8

The environment is Windows/PowerShell unless stated otherwise.

Before commands involving Cyrillic or file output, use:

```powershell
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
chcp 65001 > $null
```

Encoding rules:

- preserve existing file encoding;
- prefer UTF-8 without BOM for source files;
- avoid mojibake in Russian text;
- do not rewrite files just to fix encoding unless explicitly requested;
- do not use broad PowerShell rewrites that may silently change encoding;
- when reading Cyrillic text, prefer `Get-Content -Encoding UTF8` or UTF-8-safe Node/Python commands.

## Final response format for implementation

Use this format:

```text
Done / Not done

Changed:
- path
- path

Checks:
- command: result
- command: result

Notes:
- short note if needed
```

## Final response format for review and QA

Use this format:

```text
Result: PASS / FAIL / PARTIAL

Findings:
- concise finding

Required fixes:
- only if needed

Commands run:
- command
```

## Commit behavior

Do not commit unless the user explicitly asks.

Do not run:

- `git commit`
- `git add`
- `git reset`
- `git clean`
- `git stash`
- `git rebase`
- `git push`

unless explicitly requested.

For commit readiness, only inspect and report.

## Default assumption

If the user request is clear, proceed without asking for permission.

If the scope is unclear, ask one short clarifying question.

If the task can be done safely with minimal changes, do it directly.