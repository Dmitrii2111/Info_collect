# InfoCollect

Локальная система учета и проверки оборудования в здании с мобильным полевым контуром, операторской панелью, ролевым доступом, офлайн-синхронизацией и экспортом данных.

## Что уже есть в проекте

- backend на `FastAPI`
- база данных `PostgreSQL`
- миграции `Alembic`
- импорт плановой Excel-ведомости
- версионирование плана и сравнение версий
- операторская панель на `React + Vite + Ant Design`
- полевой мобильный PWA-контур
- роли `field_worker`, `operator`, `admin`
- управление сотрудниками, назначениями и группами
- базовый экспорт табличных данных
- аудит изменений и событийная модель

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
- `/operator` — старая операторская HTML-версия, сохранена как переходный контур

### API
- `/api/auth/login`
- `/api/rooms/*`
- `/api/items/*`
- `/api/plans/*`
- `/api/users/*`
- `/api/field/*`
- `/api/sync/*`
- `/api/health`

## Структура проекта

- `app/` — backend-код
- `alembic/` — миграции
- `frontend/` — новая операторская панель на React
- `templates/` — серверные HTML-шаблоны
- `static/` — статика и старый клиентский контур
- `docs/` — документация по проекту
- `design/` — все материалы по дизайну и обратной связи
- `scripts/` — служебные скрипты
- `tests/` — backend-тесты

Подробная карта структуры лежит здесь:
- [docs/project_structure.md](/C:/Users/localadmin/Documents/InfoCollect/docs/project_structure.md)

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

Отдельная памятка:
- [docs/testing.md](/C:/Users/localadmin/Documents/InfoCollect/docs/testing.md)

## Документация

- [docs/project_structure.md](/C:/Users/localadmin/Documents/InfoCollect/docs/project_structure.md)
- [docs/testing.md](/C:/Users/localadmin/Documents/InfoCollect/docs/testing.md)
- [docs/frontend_react_vite_migration.md](/C:/Users/localadmin/Documents/InfoCollect/docs/frontend_react_vite_migration.md)
- [data_model_design.md](/C:/Users/localadmin/Documents/InfoCollect/data_model_design.md)
- [designer_brief.md](/C:/Users/localadmin/Documents/InfoCollect/designer_brief.md)

## Дизайн

Все материалы по визуалу складываются в папку:
- [design](/C:/Users/localadmin/Documents/InfoCollect/design)

Там уже лежат:
- исходный PDF от дизайнера
- замечания по `V1`

## Что сейчас стоит делать дальше

1. Продолжать дробить крупные модули frontend и backend на более узкие слои.
2. Расширять тестовое покрытие перед дальнейшей логикой и редизайном.
3. Довести документацию до состояния “разработчик зашел и сразу понял, как все устроено”.
4. После согласования дизайна переносить новые экраны в React-панель без накопления технического долга.
