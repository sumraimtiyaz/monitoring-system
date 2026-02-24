# 📡 Cloud Monitoring System

A lightweight, production-quality monitoring system for cloud services — real-time metrics ingestion, threshold alerting, and an intuitive live dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Metrics Ingestion** | POST /metrics — auto-registers services on first ingest |
| **Alerting Engine** | Threshold rules (> / <) with configurable consecutive breach detection |
| **Alert Notifications** | SMTP email + structured logging (abstracted for Slack/Webhooks) |
| **Live Dashboard** | Global health overview + per-service detail with charts, 5s polling |
| **Simulator** | Realistic pattern generator: steady → spike → degradation → recovery |
| **Containerized** | One-command startup via Docker Compose |

---

## 🧰 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Core language |
| **FastAPI** | 0.110+ | REST API framework — async-ready, auto Swagger docs |
| **SQLAlchemy** | 2.0+ | ORM — maps Python classes to PostgreSQL tables |
| **Pydantic** | 2.0+ | Request/response validation and serialisation |
| **Uvicorn** | 0.29+ | ASGI server that runs FastAPI |
| **PostgreSQL** | 15+ | Primary database — stores services, metrics, rules, alerts |
| **psycopg2** | 2.9+ | PostgreSQL driver used by SQLAlchemy |
| **smtplib** | stdlib | Email delivery for alert notifications (built into Python) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18+ | UI framework |
| **TypeScript** | 5+ | Type-safe JavaScript |
| **Vite** | 5+ | Build tool — fast dev server with hot reload |
| **React Router** | 6+ | Client-side routing (`/` dashboard, `/service/:id` detail) |
| **Recharts** | 2+ | Time-series area charts and sparklines |
| **Tailwind CSS** | 3+ | Utility-first CSS framework |
| **Lucide React** | 0.3+ | Icon library |
| **clsx** | 2+ | Conditional CSS class utility |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerises backend, frontend, and database |
| **Docker Compose** | Orchestrates all three containers with one command |
| **Nginx** | Serves the compiled React app; proxies `/api/` to the backend |

### Simulator
| Technology | Purpose |
|---|---|
| **Python stdlib only** | `urllib.request` for HTTP, `math` + `random` for pattern generation — no pip install needed |

---

### Prerequisites

You need the following tools installed before running anything:

| Tool | Minimum version | Verify |
|---|---|---|
| Git | any | `git --version` |
| Python | 3.11 | `python3 --version` _(macOS/Linux)_ · `python --version` _(Windows)_ |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |
| Docker Desktop | latest | `docker --version` |

> PostgreSQL does **not** need to be installed locally — Docker provides it.

---

## 🚀 Quick Start

### 1. Configure environment

Then open `.env` and fill in your values — see the **[Configuration]** section below for a full explanation of every variable.

### 2. Start the stack

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Backend health | http://localhost:8000/health |

First Time it will take some time

### 3. Run the simulator

```bash
# In a separate terminal
cd simulator
python simulator.py
# Optional flags:
#   --url http://localhost:8000/metrics
#   --interval 2          (seconds between batches)
#   --services 2          (number of services, default: 4)
#   --verbose             (print each metric)
```

Within seconds you'll see services appearing on the dashboard with live metric charts.

### 4. Create alert rules

Using the dashboard UI: open any service → "Alert Rules" → "New Rule"

Using the API directly:
```bash
# Get service IDs
curl http://localhost:8000/services

# Create a rule
curl -X POST http://localhost:8000/alerts/rules \
  -H 'Content-Type: application/json' \
  -d '{
    "service_id": "<id>",
    "metric_name": "cpu",
    "operator": ">",
    "threshold": 80,
    "consecutive_required": 3
  }'
```

---


### Run backend locally (without Docker)

**Step 1 — Create and activate a virtual environment**

A virtual environment isolates the project's Python packages from your system Python, preventing version conflicts between projects.

```bash
# macOS / Linux
cd backend
python3 -m venv .venv

# Windows (PowerShell or CMD)
cd backend
python -m venv .venv
```

**Step 2 — Activate the virtual environment**

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

You'll see `(.venv)` appear at the start of your terminal prompt — this confirms the environment is active. All `pip install` and `python` commands now run inside it.

**Step 3 — Install dependencies**

```bash
pip install -r requirements.txt
```

**Step 4 — Set environment variables**

The backend reads config from environment variables. You can either export them manually or point to a `.env` file:

```bash
# macOS / Linux — Option A: export individually
export DATABASE_URL=postgresql://monitor:monitor@localhost:5432/monitoring
export SMTP_USER=
export SMTP_PASSWORD=

# macOS / Linux — Option B: load from .env file
export $(grep -v '^#' ../.env | xargs)

# Windows (PowerShell) — Option A: set individually
$env:DATABASE_URL="postgresql://monitor:monitor@localhost:5432/monitoring"
$env:SMTP_USER=""
$env:SMTP_PASSWORD=""

# Windows (CMD) — Option A: set individually
set DATABASE_URL=postgresql://monitor:monitor@localhost:5432/monitoring
set SMTP_USER=
set SMTP_PASSWORD=
```

> You still need a running PostgreSQL instance. The easiest way is to spin up just the database container:
> ```bash
> docker-compose up db -d
> ```

**Step 5 — Run the backend**

```bash
uvicorn app.main:app --reload --port 8000
```

`--reload` means the server automatically restarts whenever you save a Python file — essential for development.

The API is now live at http://localhost:8000 and Swagger docs at http://localhost:8000/docs.

**Step 6 — Deactivate when done**

```bash
deactivate
```

---

### Run frontend locally

**Step 1 — Install dependencies**

```bash
cd frontend
npm install
```

**Step 2 — Start the dev server**

```bash
npm run dev
```

Vite starts at http://localhost:5173 and automatically proxies `/api/` calls to the backend at `localhost:8000`, so both can run side by side without CORS issues.

The browser auto-refreshes whenever you save a file (hot module replacement).

**Step 3 — Build for production (optional)**

```bash
npm run build
# Output is in frontend/dist/
```

---

### Run simulator locally

The simulator has **no external dependencies** — it uses only Python's standard library, so no virtual environment is needed.

```bash
# macOS / Linux
python3 simulator/simulator.py

# Windows
python simulator/simulator.py

# With all options (macOS / Linux)
python3 simulator/simulator.py \
  --url http://localhost:8000/metrics \
  --interval 1 \
  --services 2 \
  --verbose

# With all options (Windows)
python simulator/simulator.py `
  --url http://localhost:8000/metrics `
  --interval 1 `
  --services 2 `
  --verbose
```

| Flag | Default | Description |
|---|---|---|
| `--url` | `http://localhost:8000/metrics` | Backend endpoint |
| `--interval` | `2.0` | Seconds between metric batches |
| `--services` | `4` | Number of services to simulate (max 4) |
| `--verbose` | off | Print every metric as it is sent |

---

## ⚙️ Configuration

All configuration lives in the `.env` file at the project root.

Below is the complete `.env` with every variable explained:

```dotenv
# ─────────────────────────────────────────────────────────────
# DATABASE
# Used internally by Docker Compose to create the PostgreSQL
# database. Do not change these unless you are connecting to an
# external Postgres instance.
# ─────────────────────────────────────────────────────────────
POSTGRES_DB=monitoring
POSTGRES_USER=monitor
POSTGRES_PASSWORD=monitor

# ─────────────────────────────────────────────────────────────
# SMTP — EMAIL ALERT NOTIFICATIONS
# Leave SMTP_USER and SMTP_PASSWORD blank to disable email.
# Alerts will still be written to the backend logs regardless.
# ─────────────────────────────────────────────────────────────

# SMTP server hostname — Gmail shown; change for Outlook/SendGrid etc.
SMTP_HOST=smtp.gmail.com

# Port 587 uses STARTTLS (recommended). Use 465 for SSL-only servers.
SMTP_PORT=587

# The Gmail account used to send alert emails.
SMTP_USER=your-email@gmail.com

# For Gmail: use an App Password, NOT your normal account password.
# See instructions below on how to generate one.
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# The "From" address shown in the alert email (usually same as SMTP_USER).
ALERT_FROM_EMAIL=your-email@gmail.com

# The address that receives the alert emails.
ALERT_TO_EMAIL=recipient@example.com
```

---

### 📧 Setting up Gmail for alert emails

Gmail blocks direct login from apps by default. You need to create an **App Password** — a 16-character token that works in place of your real password.

**Step 1 — Enable 2-Step Verification** (required for App Passwords)

1. Go to your [Google Account](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to turn it on

**Step 2 — Generate an App Password**

1. Go to your [Google Account → Security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", click **App passwords**
   _(This option only appears once 2-Step Verification is enabled)_
3. In the "App name" field, type something like `Cloud Monitor`
4. Click **Create**
5. Google shows a **16-character password** like `gqpu ebar vohy blbm`
6. Copy it exactly (spaces are fine — Google includes them for readability)

**Step 3 — Paste into .env**

```dotenv
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=gqpu ebar tgyh blbm    # paste the App Password here
ALERT_FROM_EMAIL=your-gmail@gmail.com
ALERT_TO_EMAIL=whoever-should-get-alerts@example.com
```

> **Security note:** Never commit your `.env` file to Git. It is already listed in `.gitignore`. If you accidentally expose credentials, revoke the App Password immediately in your Google Account and generate a new one.

---

### 📭 Running without email (log-only mode)

Email is completely optional. If you leave `SMTP_USER` and `SMTP_PASSWORD` blank, the system skips email silently and writes all alert events to the backend logs instead:

```dotenv
SMTP_USER=
SMTP_PASSWORD=
```

You can watch alerts fire and resolve in real time with:

```bash
docker-compose logs -f backend
```

You'll see lines like:
```
[ALERT FIRED]    api-gateway: latency is 823.4 (> 500) for 3 consecutive readings
[ALERT RESOLVED] api-gateway/latency
```

---

### 🔄 Applying config changes

If you change `.env` after the stack is already running, restart the backend to pick up the new values:

```bash
docker-compose restart backend
```

Or do a full restart:

```bash
docker-compose down && docker-compose up --build
```

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────┐
│                    Frontend (React)                    │
│  Dashboard · ServiceDetail · Charts · AlertRules       │
│  5-second polling · Recharts · Tailwind CSS            │
└─────────────────────┬─────────────────────────────────┘
                      │ HTTP / REST
┌─────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend                      │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  API Layer │  │ Service Layer│  │  Alert Engine │  │
│  │  /metrics  │  │MetricService │  │  AlertService │  │
│  │  /services │  │              │  │  (rule eval)  │  │
│  │  /alerts   │  └──────────────┘  └───────┬───────┘  │
│  └─────┬──────┘                            │          │
│        │         ┌────────────────┐        │          │
│  ┌─────▼─────────▼──────┐         │  NotifService    │
│  │   Repository Layer    │         │  (SMTP/Log/…)   │
│  │  ServiceRepo          │         └────────────────  │
│  │  MetricRepo           │                            │
│  │  AlertRepo            │                            │
│  └───────────┬───────────┘                            │
└──────────────┼─────────────────────────────────────────┘
               │ SQLAlchemy ORM
┌──────────────▼─────────────────────────────────────────┐
│              PostgreSQL                                 │
│  services · metrics · alert_rules · alerts              │
└────────────────────────────────────────────────────────┘

       Simulator (standalone Python script)
       → POST /metrics every N seconds
```

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| **API** | HTTP request/response, validation, routing |
| **Service** | Business logic, orchestration between repos |
| **Repository** | All DB queries — isolated from business logic |
| **Alert Engine** | Stateful breach tracking, fire/resolve logic |
| **Notification Service** | Dispatch to all registered channels |
| **Models** | SQLAlchemy ORM schema |

---

## 📐 Database Schema

```sql
services     (id, name, created_at)
metrics      (id, service_id, name, value, timestamp)
             -- indexed: service_id, name, timestamp
alert_rules  (id, service_id, metric_name, operator, threshold,
              consecutive_required, consecutive_count, enabled)
alerts       (id, rule_id, service_id, status, message, fired_at, resolved_at)
```

---

## 🔌 API Reference

### Metrics
| Method | Path | Description |
|---|---|---|
| POST | /metrics | Ingest a metric data point |
| GET | /metrics/{service_id}/{name}?window=1h | Time-series data (5m/1h/24h) |
| GET | /metrics/{service_id}/available/names | List metric names for a service |

### Services
| Method | Path | Description |
|---|---|---|
| GET | /services | List all services |
| GET | /services/dashboard | Global health overview |
| GET | /services/{id} | Single service health + latest metrics |

### Alerts
| Method | Path | Description |
|---|---|---|
| GET | /alerts | Active alerts (optional ?service_id=) |
| GET | /alerts/{service_id}/history | Alert history for a service |
| POST | /alerts/rules | Create alert rule |
| GET | /alerts/rules | List rules (optional ?service_id=) |
| DELETE | /alerts/rules/{id} | Delete a rule |

Full interactive documentation: http://localhost:8000/docs

---

## 🎬 Alert Lifecycle

```
Metric comes in
     │
     ├─ Does it breach the threshold?
     │   ├─ YES → increment consecutive_count
     │   │         if count >= required AND no active alert → FIRE alert → notify
     │   │
     │   └─ NO  → reset consecutive_count
     │             if active FIRING alert → RESOLVE it → notify
     │
     └─ Repeat on next metric
```

Default: 3 consecutive breaches required to avoid false positives.

---

## 🔔 Notifications

The `NotificationService` dispatches through all registered channels:

1. **LogChannel** (always active) — structured log entry
2. **SMTPChannel** (when credentials provided) — email alert

To add Slack/Webhook:
```python
class SlackChannel(NotificationChannel):
    def send(self, subject, body):
        # POST to Slack webhook
        ...

notification_service.add_channel(SlackChannel(webhook_url))
```

---

## ⚙️ Design Decisions & Tradeoffs

| Decision | Rationale |
|---|---|
| Auto-register services on first metric | Simpler ingestion UX; no pre-registration step |
| 3 consecutive breaches before alerting | Avoid transient spikes causing false positives |
| Polling (5s) instead of WebSockets | Simpler MVP; WebSocket upgrade path is clear |
| Raw metric storage in PostgreSQL | Flexible for future aggregations; no extra infra |
| Synchronous alert evaluation | Sufficient for MVP; async worker extraction is straightforward |

---

## 🔌 Modularity & Database Portability

### Is it modular? ✅ Yes, genuinely

The Repository Pattern is what makes this true. Every single database query is isolated inside `repositories/` — the service layer and API layer have **zero SQL in them**. For example, `AlertService.evaluate()` calls `self.alert_repo.resolve_all_firing_alerts_for_rule(rule.id)` — it has no idea how that's implemented underneath.

That's the key contract: **services talk to repositories, repositories talk to the database. Nothing else crosses that boundary.**

---

### Can it swap databases?

#### Swapping PostgreSQL → another SQL database — ✅ Very easy

SQLAlchemy abstracts the SQL dialect. You'd change exactly **one line** in `core/database.py`:

```python
# Current (PostgreSQL)
DATABASE_URL = "postgresql://monitor:monitor@db:5432/monitoring"

# Switch to MySQL
DATABASE_URL = "mysql+pymysql://user:pass@host/monitoring"

# Switch to SQLite (great for local dev/testing — no server needed)
DATABASE_URL = "sqlite:///./monitoring.db"
```

That's it. No repository code changes, no model changes, no service changes. SQLAlchemy handles the rest.

Databases that work this way with zero code changes:

| Database | Driver to install | URL prefix |
|---|---|---|
| PostgreSQL (current) | `psycopg2-binary` | `postgresql://` |
| MySQL / MariaDB | `pymysql` | `mysql+pymysql://` |
| SQLite | built-in | `sqlite:///` |
| CockroachDB | `psycopg2-binary` | `cockroachdb://` |
| MS SQL Server | `pyodbc` | `mssql+pyodbc://` |

---

#### Swapping PostgreSQL → MongoDB — ✅ Possible, but it's real work

MongoDB is a document database, not relational, so SQLAlchemy doesn't support it. You'd need to replace SQLAlchemy with a MongoDB driver like `motor` or `pymongo`. Here's exactly what changes and what stays untouched:

| What changes (~6 files) | What stays exactly the same (~20 files) |
|---|---|
| `core/database.py` — new MongoDB connection setup | All 3 service files (`metric_service.py`, `alert_service.py`, `notification_service.py`) |
| All 3 repository files — rewrite queries using MongoDB syntax | All 3 API files (`metrics.py`, `services.py`, `alerts.py`) |
| `models/models.py` — replace SQLAlchemy models with Mongo document schemas | All schemas (`schemas.py`) |
| `docker-compose.yml` — swap `db` service from postgres to mongo | Frontend entirely |
| `requirements.txt` — swap `sqlalchemy psycopg2` for `motor` | Simulator entirely |

The blast radius of a database swap is contained entirely to the data access layer — that's the payoff of the layered architecture.

> **One thing to note:** The `consecutive_count` field on `AlertRule` is updated in-place with a SQL `UPDATE`. In MongoDB you'd use `$inc` for the same atomic increment. The logic doesn't change, just the syntax inside `alert_repo.py`.

---

## 🚧 Future Secure

- **Async alert processing** via Celery or ARQ background workers
- **Time-series database** — TimescaleDB or InfluxDB for efficient aggregation at scale
- **WebSocket streaming** for true real-time dashboard updates
- **Alert deduplication & cooldown** — prevent notification storms
- **Multi-channel notifications** — Slack, PagerDuty, webhooks
- **Anomaly detection** — ML-based instead of static thresholds
- **Multi-tenancy** — per-organisation isolation
- **Metric aggregation** — pre-computed 1m/5m/1h rollups
- **Authentication** — JWT or API key middleware
