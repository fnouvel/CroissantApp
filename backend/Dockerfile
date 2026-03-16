FROM python:3.12-slim

# libheif-dev for pillow-heif HEIC support
RUN apt-get update && \
    apt-get install -y --no-install-recommends libheif-dev libjpeg62-turbo-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD alembic upgrade head && gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}
