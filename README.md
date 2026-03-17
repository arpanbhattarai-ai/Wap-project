# College Election Voting App

A full-stack web voting system with:
- **Backend:** Django + Django REST Framework + JWT authentication
- **Frontend:** React + Vite
- **Database:** SQLite (default)

This project allows users to register, log in, vote once, and view election results.

---

## Project Structure

```text
Wap-project/
├── backend/    # Django API and admin
└── frontend/   # React client
```

---

## Features

- User registration and JWT-based login
- Protected frontend routes (must be logged in)
- Election status handling (`upcoming`, `ongoing`, `paused`, `ended`)
- Candidate listing and one-vote-per-user restriction
- Results dashboard with bar chart and pie chart
- Django admin support for managing elections/candidates

---

## Prerequisites

Install these on your machine:
- **Python 3.10+** (recommended)
- **Node.js 18+** and npm
- Git

---

## Backend Setup (Django)

Open a terminal in the backend folder:

```bash
cd backend
```

### 1) Create and activate virtual environment

**macOS/Linux**
```bash
python -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Run migrations

```bash
python manage.py migrate
```

### 4) Create admin user (recommended)

```bash
python manage.py createsuperuser
```

### 5) Start backend server

```bash
python manage.py runserver
```

Backend runs at:
- `http://127.0.0.1:8000`
- Admin panel: `http://127.0.0.1:8000/admin/`

---

## Frontend Setup (React + Vite)

Open a second terminal in the frontend folder:

```bash
cd frontend
```

### 1) Install dependencies

```bash
npm install
```

### 2) Start frontend server

```bash
npm run dev
```

Frontend will run at a Vite URL like:
- `http://127.0.0.1:5173` (or shown in terminal)

> The frontend API client is configured to use `http://127.0.0.1:8000/api/`, so keep the backend running on port 8000 unless you also update `frontend/src/api/axios.js`.

---

## First-Time App Usage

1. Start **backend** and **frontend** servers.
2. Open frontend URL in your browser.
3. Register a new user account.
4. Log in.
5. Go to **Vote** page and cast your vote.
6. Go to **Results** page to view election outcome (depends on election state).

---

## Configure Election and Candidates (Admin)

To make the app usable, you should create an election and candidates in Django admin.

1. Open `http://127.0.0.1:8000/admin/`
2. Log in with your superuser account.
3. Create an **Election** with:
   - `title`
   - `start_time`
   - `end_time`
   - `is_active` checked if voting should be enabled
4. Create **Candidate** records and assign each candidate to that election.

### Election status behavior

- **upcoming:** before `start_time`
- **ongoing:** between `start_time` and `end_time` while active
- **paused:** election exists but `is_active = false`
- **ended:** after `end_time`

---

## API Endpoints (Backend)

Base URL: `http://127.0.0.1:8000/api/`

- `POST /api/register/` → Create user
- `POST /api/token/` → Get JWT access/refresh token
- `POST /api/token/refresh/` → Refresh access token
- `GET /api/election/` → Get current/relevant election
- `GET /api/candidates/` → Get candidates (supports `?election_id=<id>`)
- `POST /api/vote/<candidate_id>/` → Cast vote (**requires JWT auth**)

For protected routes, send:
```http
Authorization: Bearer <access_token>
```

---

## Common Commands

### Backend

```bash
cd backend
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

---

## Troubleshooting

- **Frontend cannot connect to backend**
  - Ensure backend is running at `127.0.0.1:8000`
  - Check `frontend/src/api/axios.js` base URL

- **`Unauthorized` while voting**
  - Log in again to refresh token in browser storage

- **No candidates/election shown**
  - Add Election and Candidate records in Django admin

- **`pip install -r requirements.txt` encoding issue on some systems**
  - If needed, recreate `requirements.txt` in UTF-8 format and reinstall.

---

## Notes for Development

- CORS is currently open to all origins in development.
- SQLite is used by default (`backend/db.sqlite3`).
- JWT access token lifetime is set to 60 minutes.

For production, update secret key management, allowed hosts, CORS, debug mode, and database settings.
