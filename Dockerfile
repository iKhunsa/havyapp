FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_DIR=/app/public

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/dist ./public

EXPOSE 3001
CMD ["node", "backend/dist/server.js"]
