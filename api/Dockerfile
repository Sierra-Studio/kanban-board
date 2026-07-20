FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source.
COPY . .

# Directory for the SQLite database (mounted as a volume in compose).
RUN mkdir -p /data

EXPOSE 8000

# Apply migrations, run idempotent seeding, then start the server.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seeding.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
