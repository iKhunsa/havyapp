# DinoFit - Guía de Entrenamiento y Progreso

Aplicación web full-stack para planificar entrenamientos, registrar sesiones, controlar volumen, gestionar nutrición y seguir el progreso físico con enfoque práctico y visual.

## Qué hace este proyecto

- Plan semanal por días con grupos musculares, orden de ejercicios y videos de referencia.
- Registro de entrenamiento por ejercicio (series, peso, repeticiones, tempo, notas y fallo).
- Control de volumen con historial editable, filtros por tiempo y carga manual de sesiones.
- Seguimiento de peso corporal con métricas y visualización de tendencia.
- Módulo de nutrición con perfil de macros y planificación de comidas por día.
- Perfil con exportación CSV de historial (entrenos y peso), idioma y ajustes de cuenta.

## Módulos principales (frontend)

- `Entrenamiento` (`/`): rutina del día, checklist persistente por día y registro rápido.
- `Plan semanal` (`/plan`): crear/editar plan activo, ejercicios y orden.
- `Nutrición` (`/nutrition`): objetivos y comidas por día.
- `Peso` (`/weight`): evolución corporal.
- `Volumen` (`/volume`): historial técnico de entrenamientos.
- `Progreso` (`/progress`): análisis por ejercicio con gráficas.
- `Perfil` (`/prefil`): exportación de datos y preferencias.

## Arquitectura

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui.
- Estado y datos: `DataProvider` con persistencia local por usuario (`localStorage`) y sincronización de estado UI mediante `StoreSync`.
- Autenticación actual: local (en navegador), con sesiones persistentes por token local.
- Backend (Node/Express): API de auth y fitness con JWT, CORS, Helmet y rate limiting.
- Testing: Vitest + Testing Library (frontend) y Vitest + Supertest (backend).

## Stack técnico

- UI/UX: `tailwindcss`, `radix-ui`, `lucide-react`, `sonner`.
- Datos/Charts: `recharts`, utilidades de cálculo fitness/nutrición.
- DnD/Reordenamiento: `@dnd-kit/*`.
- Backend: `express`, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`.

## Estructura del repositorio

```txt
.
├─ src/                 # Frontend React
│  ├─ pages/            # Pantallas principales
│  ├─ components/       # Componentes UI y feature components
│  ├─ contexts/         # Auth, data, language
│  ├─ hooks/            # Hooks de acceso a estado y datos
│  ├─ lib/              # Utilidades y manejo de errores
│  └─ stores/           # Store auxiliar (zustand)
├─ backend/             # API Express + tests
│  ├─ src/routes/       # auth y fitness endpoints
│  ├─ src/middleware/   # auth JWT
│  ├─ src/stores/       # store en memoria por usuario
│  └─ src/tests/        # tests backend
└─ supabase/            # migraciones históricas incluidas en repo
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalación y ejecución

### 1) Frontend

```bash
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`.

### 2) Backend (opcional pero recomendado)

```bash
cd backend
npm install
npm run dev
```

Backend disponible en `http://localhost:3001`.

### 3) Levantar ambos juntos

Desde la raíz:

```bash
npm run dev:full
```

## Variables de entorno

### Backend (`backend/.env`)

```env
PORT=3001
JWT_SECRET=change_this_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_ENABLE_BACKEND_SYNC=true
```

Nota: el frontend funciona en modo local-first, por lo que también puede operar sin backend para persistencia en el navegador.

## Docker (Portainer)

Este proyecto incluye despliegue estable en un solo servicio (`app`) usando la imagen publicada en GHCR.

### Build local

```bash
docker pull ghcr.io/ikhunsa/havyapp:v1.0.4
```

### Run local

```bash
JWT_SECRET=change_this_secret CORS_ORIGIN=http://localhost:18743 APP_PORT=18743 TAG=v1.0.4 docker compose up -d
```

Abrir: `http://localhost:18743`

### Deploy en Portainer

- Build method: `Git repository`.
- Compose path: `docker-compose.yml`.
- Variables recomendadas: `JWT_SECRET`, `CORS_ORIGIN`, `APP_PORT`, `TAG`.

## Publicacion en GitHub Packages + Release

Existe un workflow unico: `.github/workflows/docker-package-release.yml`.

- Al crear un tag `v*` (ej. `v1.0.0`), el workflow:
  - construye y publica la imagen en GHCR,
  - crea el Release en GitHub,
  - incluye el digest de la imagen.

Comando sugerido para lanzar release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Scripts útiles

- `npm run dev`: desarrollo frontend.
- `npm run build`: build producción frontend.
- `npm run test`: tests frontend.
- `npm run lint`: lint frontend.
- `npm run typecheck`: type checking frontend.
- `npm run check`: pipeline completo frontend + backend (build, test, lint).

En `backend/`:

- `npm run dev`: desarrollo backend.
- `npm run build`: compilar backend.
- `npm run test`: tests backend.

## Endpoints principales (backend)

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Fitness:
  - Workouts: `GET/POST/PATCH/DELETE /api/fitness/workouts`
  - Weights: `GET/POST/PATCH/DELETE /api/fitness/weights`
  - Plans: `GET/POST/PATCH/DELETE /api/fitness/plans`, `POST /api/fitness/plans/:id/activate`
  - Profile: `GET/POST /api/fitness/profile`
  - Meals: `GET/POST /api/fitness/meals`

## Seguridad y validación

- JWT para endpoints protegidos.
- Rate limiting general y específico de auth.
- Helmet + CORS por origen permitido.
- Validación de email/password y manejo explícito de errores de almacenamiento.

## Estado actual del producto

- App funcional para uso diario personal y tracking progresivo.
- Flujo de datos unificado entre módulos de entrenamiento, volumen y progreso.
- Diseñada para iterar rápido con enfoque local-first y backend extensible.

## Licencia

Pendiente de definir (`MIT` recomendado si deseas hacerlo open-source).
