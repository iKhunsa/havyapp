# Portainer Stack (.yaml)

```yaml
version: "3.8"

services:
  havyapp:
    image: ghcr.io/ikhunsa/havyapp:v1.0.0
    container_name: havyapp
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      STATIC_DIR: /app/public
      JWT_SECRET: "cambia_esto_por_un_secreto_fuerte"
      CORS_ORIGIN: "http://localhost:3001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
```
