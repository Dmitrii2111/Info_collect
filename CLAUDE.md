# Project rules

## Main principle

Work with minimal changes. Do not rewrite working code without a clear reason.

## Workflow

1. For unclear features, use product-manager first.
2. For UI tasks, use ui-designer before implementation.
3. For frontend implementation, use frontend-developer.
4. For backend/API/sync/data tasks, use backend-developer.
5. After implementation, use qa-tester before commit.
6. After frontend/backend implementation, use tech-lead-reviewer before qa-tester for non-trivial changes.

## Coding rules

- Preserve existing architecture and naming.
- Prefer small diffs.
- Do not change unrelated files.
- Do not change business logic during visual-only tasks.
- Do not change API, store, sync, routing or backend during visual-only tasks.
- Always report changed files.
- Always run available checks after code changes.
- Never run npm run dev as a verification command.

## Cost control

- Do not create agent teams unless explicitly requested.
- Do not use batch mode unless explicitly requested.
- Prefer project subagents.
- Use Haiku for simple review/checklist work.
- Use Sonnet for implementation.
- Use Opus only for complex architecture decisions.