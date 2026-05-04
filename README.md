# InfoCollect

InfoCollect - локальная система учета, инспекций и контроля оборудования. Проект состоит из FastAPI backend, PostgreSQL-модели, мобильного полевого PWA-контура и нового desktop frontend на React + Vite.

## Текущий фокус

Сейчас frontend переводится на новый desktop-дизайн из `design/Desktop/stitch_infocollect_design_system`. Первый этап верстки - общий каркас:

- левый sidebar с утвержденным набором разделов;
- верхний header с заголовком текущего раздела, поиском, статусом сервера и профилем;
- заглушки основных страниц под будущие UI-состояния.

Старая React-операторка с вкладками удалена из `frontend/src`. Маршрут `/operator` оставлен как redirect на `/operator-next`.

## Стек

Backend:

- `FastAPI`
- `SQLAlchemy`
- `PostgreSQL`
- `Alembic`
- `openpyxl`

Frontend:

- `React`
- `Vite`
- `Ant Design`
- `@ant-design/icons`

Mobile:

- server-rendered PWA на `/field`
- `IndexedDB`
- service worker

## Основные маршруты

- `/` - redirect на `/operator-next`
- `/operator-next` - новый desktop frontend
- `/operator` - redirect на `/operator-next`
- `/field` - мобильный полевой PWA-контур
- `/api/*` - backend API

## Быстрый запуск

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
pnpm install
pnpm dev
```

Preview desktop shell:

```text
http://127.0.0.1:5173/operator-next/
```

## Проверки

Backend:

```powershell
pytest
```

Frontend:

```powershell
cd frontend
pnpm test
pnpm build
```

## Документация

- [Структура проекта](docs/project_structure.md)
- [Frontend desktop shell](docs/frontend_react_vite_migration.md)
- [Тестирование](docs/testing.md)
- [Backend bootstrap](docs/backend_bootstrap.md)
- [ТЗ этапов 1-2](docs/stage_1_2_technical_spec.md)

## Дизайн

Актуальные desktop-макеты лежат в `design/Desktop/stitch_infocollect_design_system`. Источники дизайна не редактируются в кодовых задачах.
