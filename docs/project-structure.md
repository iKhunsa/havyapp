# Estructura del Proyecto DinoFit

```txt
mindful-training-guide-main/
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ components/
│  │  ├─ AuthGuard.tsx
│  │  ├─ Layout.tsx
│  │  ├─ Navigation.tsx
│  │  ├─ WorkoutRegistrationModal.tsx
│  │  ├─ WeightProgressChart.tsx
│  │  ├─ MealPlanner.tsx
│  │  ├─ MacroCalculator.tsx
│  │  └─ ui/                      # Componentes base (shadcn/ui)
│  ├─ contexts/
│  │  ├─ AuthContext.tsx
│  │  ├─ DataContext.tsx
│  │  ├─ LanguageContext.tsx
│  │  ├─ auth-context.ts
│  │  └─ data-context.ts
│  ├─ hooks/
│  │  ├─ useAuth.ts
│  │  ├─ useData.ts
│  │  ├─ useLocalData.tsx         # Backend-first + migracion legacy localStorage
│  │  └─ __tests__/
│  ├─ lib/
│  │  ├─ api-url.ts
│  │  ├─ app-error.ts
│  │  ├─ fitness-utils.ts
│  │  └─ nutrition-utils.ts
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ WeeklyPlan.tsx
│  │  ├─ Nutrition.tsx
│  │  ├─ BodyWeight.tsx
│  │  ├─ VolumeControl.tsx
│  │  ├─ Progress.tsx
│  │  ├─ Profile.tsx
│  │  ├─ Login.tsx
│  │  ├─ NotFound.tsx
│  │  └─ __tests__/
│  ├─ test/
│  └─ types/
├─ backend/
│  ├─ src/
│  │  ├─ server.ts
│  │  ├─ db/
│  │  │  ├─ client.ts             # Pool PostgreSQL + init schema
│  │  │  └─ repository.ts         # Acceso a datos persistente
│  │  ├─ middleware/
│  │  │  └─ auth.ts
│  │  ├─ routes/
│  │  │  ├─ auth.ts
│  │  │  └─ fitness.ts
│  │  ├─ tests/
│  │  │  ├─ auth.test.ts
│  │  │  ├─ fitness.test.ts
│  │  │  ├─ frontend-contract.test.ts
│  │  │  └─ mockRepository.ts
│  │  └─ types/
│  ├─ package.json
│  └─ tsconfig.json
├─ public/
│  ├─ favicon.ico
│  ├─ logo.svg
│  ├─ logo-compact.svg
│  ├─ manifest.webmanifest
│  ├─ robots.txt
│  └─ sitemap.xml
├─ docs/
│  ├─ project-structure.md
│  ├─ cleanup-refactor-phases.md
│  ├─ persistence-rollout-phases.md
│  └─ portainer-stack.md
├─ docker-compose.yml             # app + postgres
├─ stack.env
├─ Dockerfile
├─ index.html
└─ README.md
```

Notas:
- La persistencia principal es PostgreSQL (no localStorage como fuente de verdad).
- `useLocalData.tsx` conserva migracion automatica de datos legacy locales al backend.
- El despliegue recomendado en Portainer usa `docker-compose.yml`.
