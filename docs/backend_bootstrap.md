# Backend Bootstrap

## Что уже подготовлено

- логическая модель данных;
- физическая схема PostgreSQL в `db/schema.sql`;
- каркас FastAPI backend;
- Alembic-конфигурация;
- первая ревизия схемы БД.

## Как запустить миграции

1. Создать PostgreSQL-базу `infocollect`.
2. При необходимости скопировать `.env.example` в `.env` и поменять реквизиты подключения.
3. Установить зависимости:

```powershell
pip install -r requirements.txt
```

4. Применить миграции:

```powershell
python manage.py migrate
```

## Как запустить backend

```powershell
python -m uvicorn app.main:app --reload
```

## Как импортировать исходную ведомость

```powershell
python manage.py import-plan --source-path source.xlsx --version-label "v1"
```

## Как посмотреть версии плана и diff-наборы

```powershell
python manage.py plan-versions
python manage.py plan-changes
```

## Следующий шаг

После применения миграций можно переходить к:

- настройке ORM-моделей под реальные CRUD-сценарии;
- импорту исходной Excel-ведомости;
- созданию первых сервисов для пользователей, помещений и версий плана.
