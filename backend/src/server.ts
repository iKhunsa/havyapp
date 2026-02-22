import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import fitnessRoutes from './routes/fitness';
import { db, initDatabase } from './db/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const normalizeOrigin = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
};

const envOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter((origin): origin is string => Boolean(origin));

const allowedOrigins = new Set([
  ...envOrigins,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
]);

const isOriginAllowed = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);
  return Boolean(normalizedOrigin && allowedOrigins.has(normalizedOrigin));
};

// Security middleware
app.use(helmet({
  hsts: false,
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 2000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 20 : 500,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiCors = cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    if (!isProduction) {
      console.warn(`Blocked CORS origin: ${origin}`);
    }
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
});

app.use(express.json());

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/', apiCors);
app.options('/api/*', apiCors);
app.use('/api/', (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || isOriginAllowed(origin)) {
    next();
    return;
  }

  res.status(403).json({ error: 'Origin not allowed by CORS' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fitness', fitnessRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const staticDir = process.env.STATIC_DIR || path.resolve(process.cwd(), 'public');
app.use(express.static(staticDir, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
      return;
    }

    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }

  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(staticDir, 'index.html'));
});

const start = async () => {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔒 Security enabled: Helmet + Rate Limiting`);
    console.log(`🌐 CORS enabled for: ${Array.from(allowedOrigins).join(', ')}`);
    console.log('🗄️ PostgreSQL connected and schema ready');
  });
};

void start().catch((error) => {
  console.error('❌ Failed to initialize server', error);
  void db.end().finally(() => process.exit(1));
});
