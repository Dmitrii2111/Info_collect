# InfoCollect

InfoCollect is a self-hosted MVP for collecting information from Android and iOS devices through a mobile web app and processing data on a local server.

## Why this architecture

- No paid mobile backend services are required.
- Android and iOS access the same interface through a browser or installed PWA.
- Data is stored locally in SQLite, which is enough for a pilot or small team.
- The backend can later be extended with authentication, file uploads, analytics, and ERP/CRM integration.

## Stack

- Backend: FastAPI
- Storage: SQLite
- Frontend: HTML, CSS, vanilla JavaScript, PWA manifest

## Quick start

1. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Run the server:

   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Open the service:

   - On the server: `http://127.0.0.1:8000`
   - On mobile devices in the same Wi-Fi network: `http://SERVER_IP:8000`

## Available endpoints

- `GET /` - mobile UI
- `GET /api/health` - healthcheck
- `POST /api/submissions` - create a submission
- `GET /api/submissions` - list recent submissions
- `GET /api/submissions/export` - export all submissions to CSV

## Suggested next steps

1. Add authentication for operators and administrators.
2. Add file and photo uploads from mobile devices.
3. Add validation rules per form type.
4. Add background processing for reports and integrations.
5. Replace SQLite with PostgreSQL if concurrent load grows.
