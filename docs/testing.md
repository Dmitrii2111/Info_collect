# Testing

Текущий тестовый контур разделен на backend-проверки и frontend smoke-тесты.

## Backend

Backend-тесты находятся в `tests/` и запускаются через `pytest`.

```powershell
pytest
```

Покрываются API-контракты и сервисные сценарии без полноценного PostgreSQL integration run.

## Frontend

Frontend-тесты находятся в `frontend/tests/` и запускаются встроенным `node --test` через npm/pnpm script.

```powershell
cd frontend
pnpm test
```

На текущем этапе есть smoke-тест `desktop-shell.test.mjs`, который фиксирует:

- утвержденный порядок пунктов sidebar;
- наличие метаданных для ключевых разделов.

## Сборка frontend

```powershell
cd frontend
pnpm build
```

В локальной среде Codex также можно запускать Vite напрямую через bundled Node, если глобальные npm-команды недоступны:

```powershell
& "C:\Users\localadmin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\vite\bin\vite.js" build
```

## Dev server

```powershell
cd frontend
pnpm dev
```

Локальный адрес:

```text
http://127.0.0.1:5173/operator-next/
```

## Что проверять визуально

После изменений desktop shell нужно открыть frontend и проверить:

- sidebar не растягивает страницу по горизонтали;
- header находится в основной области справа от sidebar;
- контентная заглушка видна под header;
- переключение пунктов меню меняет заголовок и subtitle;
- скролл основной области не двигает sidebar/header как отдельный второй экран.
