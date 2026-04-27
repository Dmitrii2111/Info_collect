# InfoCollect

Локальная система учета и проверки оборудования в здании с мобильным полевым контуром, операторской панелью, ролевым доступом, офлайн-синхронизацией, складским учетом и экспортом данных.

## Что уже реализовано

- backend на `FastAPI`
- база данных `PostgreSQL`
- миграции `Alembic`
- импорт плановой Excel-ведомости
- версионирование плана и сравнение версий
- операторская панель на `React + Vite + Ant Design`
- мобильный полевой PWA-контур
- роли `operator`, `dispetcher`, `admin`
- управление сотрудниками, назначениями и группами
- вкладки `Контроль`, `Журнал`, `Склады`, `Конфликты`, `Назначения`, `Сотрудники`, `Группы`, `Экспорт`
- аудит событий на базе `domain_events`
- складской модуль с backend-логикой Этапов 1–2:
  - приемка по строкам и количеству
  - излишки и внеплановые позиции
  - follow-up задачи на допоставку

## Текущий стек

### Backend
- `FastAPI`
- `SQLAlchemy`
- `PostgreSQL`
- `Alembic`
- `openpyxl`

### Frontend
- `React`
- `Vite`
- `Ant Design`
- `react-dropzone`

### Mobile
- `PWA`
- `IndexedDB`

## Основные маршруты

### Пользовательские интерфейсы
- `/` — стартовая страница, сейчас ведет на новый экран входа
- `/operator-next` — текущая React-операторка
- `/operator-template` — оригинальный шаблон без адаптации
- `/operator` — старая HTML-версия, оставлена как переходный контур

### API
- `/api/auth/login`
- `/api/health`
- `/api/rooms/*`
- `/api/items/*`
- `/api/plans/*`
- `/api/users/*`
- `/api/field/*`
- `/api/sync/*`
- `/api/stock/*`
- `/api/conflicts/*`
- `/api/audit/*`

## Быстрый запуск

### 1. Python-зависимости

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Dev-зависимости для тестов

```powershell
pip install -r requirements-dev.txt
```

### 3. Frontend-зависимости

```powershell
cd frontend
npm install
cd ..
```

### 4. Запуск backend

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 5. Сборка frontend

```powershell
cd frontend
npm run build
cd ..
```

## Тесты

### Backend

```powershell
pytest
```

### Frontend utility tests

```powershell
cd frontend
npm test
cd ..
```

## Документация

- [docs/project_structure.md](/C:/Users/localadmin/Documents/InfoCollect/docs/project_structure.md)
- [docs/testing.md](/C:/Users/localadmin/Documents/InfoCollect/docs/testing.md)
- [docs/frontend_react_vite_migration.md](/C:/Users/localadmin/Documents/InfoCollect/docs/frontend_react_vite_migration.md)
- [data_model_design.md](/C:/Users/localadmin/Documents/InfoCollect/data_model_design.md)
- [designer_brief.md](/C:/Users/localadmin/Documents/InfoCollect/designer_brief.md)

## Дизайн

Все материалы по визуалу и обратной связи лежат в папке:
- [design](/C:/Users/localadmin/Documents/InfoCollect/design)

## Что дальше

1. Продолжать рефакторинг `App.jsx`, выносить сценарную логику в hooks и отдельные модули.
2. Углублять складской и конфликтный контуры.
3. Расширять тестовое покрытие сервисного слоя и frontend-утилит.
4. Довести документацию до состояния полного developer onboarding.
