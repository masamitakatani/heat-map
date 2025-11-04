# Heatmap & Funnel Analysis Backend

FastAPI + SQLAlchemy 2.0 (async) backend for heatmap and funnel analysis tool.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 14+

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🗄️ Database Schema

See `docs/DATABASE_SCHEMA.md` for complete schema documentation.

### Tables
- users - Anonymous user management
- pages - Analyzed pages
- sessions - User sessions
- click_events - Click tracking
- scroll_events - Scroll depth tracking
- mouse_move_events - Mouse movement tracking
- funnels - Funnel definitions
- funnel_steps - Funnel step definitions
- funnel_events - Funnel progression events
- webhook_logs - Webhook delivery logs

## 🔐 Authentication

All endpoints require API key authentication:

```http
Authorization: Bearer YOUR_API_KEY
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_users.py
```

## 📦 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── middlewares/         # Authentication, CORS, etc.
│   └── utils/               # Helper functions
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── requirements.txt         # Dependencies
└── README.md
```

## 🔧 Development

### Code Formatting
```bash
black app/
```

### Type Checking
```bash
mypy app/
```

### Linting
```bash
flake8 app/
```

## 📝 License

MIT License
