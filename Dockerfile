# Multi-stage Dockerfile for Na Winie (Grab & Cook) Application
# This Dockerfile builds both the Astro frontend and FastAPI backend

# Stage 1: Build Frontend (Astro + React)
FROM node:18-slim AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY astro.config.mjs ./
COPY tailwind.config.mjs ./
COPY vitest.config.ts ./

# Install dependencies including dev deps needed for Astro build
# Astro/Rollup needs platform-specific optional dependencies
RUN npm ci --include=optional

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/

# Build the Astro frontend
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 3: Production Runtime
FROM python:3.11-slim AS production

WORKDIR /app

# Install system dependencies for runtime
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser

# Copy Python dependencies from builder stage
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend source code
COPY backend/ ./backend/
COPY db/ ./db/

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist ./frontend/dist
COPY --from=frontend-builder /app/node_modules ./frontend/node_modules

# Create necessary directories
RUN mkdir -p /app/logs /app/backend/images && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port that FastAPI will run on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Default environment variables (can be overridden with .env file)
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    CORS_ORIGINS=http://localhost:3000,http://localhost:4321,http://localhost:8000 \
    DATABASE_URL=sqlite:///./backend/nawinie.db

# Create startup script for both services
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting FastAPI backend..."\n\
uvicorn backend.main:app --host 127.0.0.1 --port 8000 &\n\
BACKEND_PID=$!\n\
echo "Starting Astro frontend..."\n\
cd frontend && HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs &\n\
FRONTEND_PID=$!\n\
echo "Both servers started. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"\n\
wait $BACKEND_PID $FRONTEND_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose both ports
EXPOSE 4321 8000

# Command to run both servers
CMD ["/app/start.sh"] 