# Portainer Stack (.yaml)

```yaml
version: "3.8"

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: havyapp-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}
    expose:
      - "3001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: /api
    container_name: havyapp-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${APP_PORT:-80}:80"
```
