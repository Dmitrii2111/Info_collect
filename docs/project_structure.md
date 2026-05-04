# Project Structure

Карта проекта для разработки и проверки текущего состояния.

## Корень

- `app/` - FastAPI backend.
- `alembic/` - миграции базы данных.
- `frontend/` - новый desktop frontend на React + Vite.
- `templates/` - HTML-шаблоны серверного мобильного контура.
- `static/` - статика мобильного PWA.
- `docs/` - техническая документация.
- `design/` - дизайн-материалы. Актуальный desktop-дизайн находится в `design/Desktop/stitch_infocollect_design_system`.
- `scripts/` - служебные скрипты.
- `tests/` - backend-тесты.
- `db/` - SQL-схема и материалы по структуре БД.
- `data/` - служебные данные проекта.

## Frontend

Текущий frontend очищен от старой операторской вкладочной верстки. В `frontend/src` остался только desktop shell первого этапа.

- `frontend/src/App.jsx` - точка входа React-приложения и настройка Ant Design theme.
- `frontend/src/main.jsx` - монтирование React в DOM.
- `frontend/src/styles.css` - глобальные стили desktop shell.
- `frontend/src/shell/DesktopShell.jsx` - каркас desktop: sidebar, header, profile menu и placeholder основной области.
- `frontend/src/shell/desktopNavigation.js` - утвержденная структура разделов sidebar и метаданные экранов.
- `frontend/tests/desktop-shell.test.mjs` - smoke-тест порядка и адресации пунктов меню.
- `frontend/vite.config.js` - Vite-конфигурация с base `/operator-next/`.

Удалены из frontend:

- старая папка `src/operator/`;
- старый frontend API-слой, привязанный к удаленной операторской панели;
- тесты утилит старой операторки;
- зависимость `react-dropzone`.

## Backend

Основные области:

- `app/api/routes/` - маршруты API.
- `app/services/` - предметная логика.
- `app/models/` - SQLAlchemy ORM-модели.
- `app/schemas/` - Pydantic-схемы запросов и ответов.
- `app/db/` - подключение к БД и session factory.
- `app/server.py` - фабрика FastAPI-приложения, API и frontend-маршруты.
- `app/main.py` - точка входа для `uvicorn`.

Frontend-маршруты backend:

- `/` redirect на `/operator-next`;
- `/operator-next` отдает Vite-сборку или fallback;
- `/operator` redirect на `/operator-next`;
- `/field` отдает мобильный PWA.

## Mobile PWA

Мобильный контур пока остается отдельно от desktop frontend:

- `templates/index.html` - HTML-оболочка `/field`;
- `static/app.js` - логика полевого клиента;
- `static/styles.css` - стили PWA;
- `static/sw.js` - service worker;
- `static/manifest.json` - manifest PWA.

## Дизайн

`design/Desktop/stitch_infocollect_design_system` хранит экспортированные desktop-экраны Stitch. Кодовые изменения не должны редактировать дизайн-исходники.

Старые дизайн-документы V1-V5 считаются архивными и не используются для текущей desktop-верстки.

## Чувствительные файлы

Перед изменениями особенно внимательно проверять:

- `app/server.py`
- `app/core/config.py`
- `frontend/src/App.jsx`
- `frontend/src/shell/DesktopShell.jsx`
- `frontend/src/shell/desktopNavigation.js`
- `frontend/src/styles.css`
- `frontend/vite.config.js`
