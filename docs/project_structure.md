# Project Structure

Краткая карта проекта для разработчика, который впервые открывает репозиторий.

## Корень проекта

- `app/` — backend на FastAPI
- `alembic/` — миграции базы данных
- `frontend/` — новая операторская панель на React
- `templates/` — HTML-шаблоны серверного контура
- `static/` — статические файлы и старый клиентский слой
- `docs/` — техническая документация
- `design/` — дизайн-материалы и обратная связь
- `scripts/` — служебные скрипты
- `tests/` — backend-тесты
- `db/` — SQL-схема и материалы по структуре БД
- `data/` — служебные данные проекта

## Backend

### `app/api/routes/`
Маршруты API:
- `auth.py`
- `users.py`
- `rooms.py`
- `items.py`
- `plans.py`
- `field.py`
- `sync.py`
- `stock.py`
- `health.py`

### `app/services/`
Сервисный слой.
Здесь находится основная предметная логика:
- пользователи
- назначения
- группы
- импорт плана
- чтение помещений и экземпляров
- действия поля
- синхронизация
- diff между версиями плана

### `app/models/`
ORM-модели SQLAlchemy:
- организационные сущности
- план
- экземпляры оборудования
- склады
- синхронизация

### `app/schemas/`
Pydantic-схемы запросов и ответов.

### `app/db/`
Инициализация подключения к БД и session factory.

### `app/server.py`
Фабрика приложения FastAPI и frontend-маршруты.

### `app/main.py`
Точка входа для `uvicorn`.

## Frontend

### `frontend/src/App.jsx`
Главный orchestration-контейнер React-операторки:
- shell
- общие состояния
- загрузка данных
- модалки
- ролевая маршрутизация вкладок

### `frontend/src/lib/api.js`
HTTP-слой frontend.

### `frontend/src/operator/constants.js`
Константы интерфейса:
- роли
- фильтры
- labels
- пустые формы

### `frontend/src/operator/utils.js`
Чистые утилиты:
- форматирование
- summary-вычисления
- label/tone helpers
- form validation
- storage helpers

### `frontend/src/operator/components.jsx`
Переиспользуемые UI-компоненты:
- карточки
- badges
- login screen
- drawer/modal helpers
- assignment tree

### `frontend/src/operator/tabs/`
Изолированные модули вкладок операторской панели:
- `ControlTab.jsx`
- `UsersTab.jsx`
- `AssignmentsTab.jsx`
- `GroupsTab.jsx`
- `ExportTab.jsx`

### `frontend/src/styles.css`
Глобальные стили текущей версии React-панели.

### `frontend/tests/`
Тесты frontend-утилит на встроенном `node --test`.

## Документация

- `README.md` — быстрый вход в проект
- `docs/frontend_react_vite_migration.md` — статус новой операторки
- `docs/testing.md` — как запускать тесты
- `data_model_design.md` — модель данных
- `designer_brief.md` — бриф для дизайнера

## Дизайн

Папка `design/` используется как единое место хранения:
- входящих материалов от дизайнера
- PDF-концептов
- markdown-замечаний и обратной связи

## Что сейчас считается самыми чувствительными файлами

Если разработчик начинает работу, в первую очередь нужно понимать влияние правок в:

- `app/services/user_admin.py`
- `app/services/field_actions.py`
- `app/services/plan_import.py`
- `app/services/item_queries.py`
- `app/services/room_queries.py`
- `frontend/src/App.jsx`
- `frontend/src/styles.css`

## Рекомендация по дальнейшему развитию структуры

Следующий шаг по упрощению архитектуры:
- дальше дробить `App.jsx`, вынося hooks и сценарные блоки
- расширить покрытие тестами сервисов и frontend-утилит
- постепенно сокращать UI-зависимости в initial bundle
