import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dinofit:dinofitpass@localhost:5432/dinofit';

export const db = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const initDatabase = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TIMESTAMPTZ NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      muscle_groups JSONB NOT NULL,
      sets JSONB NOT NULL,
      suggested_rest INTEGER NOT NULL,
      notes TEXT,
      PRIMARY KEY (user_id, id)
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, date DESC);`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS body_weight_logs (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TIMESTAMPTZ NOT NULL,
      weight DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (user_id, id)
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_body_weight_logs_user_date ON body_weight_logs(user_id, date DESC);`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      items JSONB NOT NULL,
      PRIMARY KEY (user_id, id)
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_active ON weekly_plans(user_id, is_active);`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS macro_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      weight DOUBLE PRECISION NOT NULL,
      height DOUBLE PRECISION NOT NULL,
      age INTEGER NOT NULL,
      sex TEXT NOT NULL,
      activity_level TEXT NOT NULL,
      goal TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      meals JSONB NOT NULL,
      PRIMARY KEY (user_id, day)
    );
  `);
};
