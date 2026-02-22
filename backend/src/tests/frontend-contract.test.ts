import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fitnessRepositoryMock, resetMockRepository, userRepositoryMock } from './mockRepository';

vi.mock('../db/repository', () => ({
  userRepository: userRepositoryMock,
  fitnessRepository: fitnessRepositoryMock,
}));

import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import fitnessRoutes from '../routes/fitness';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/fitness', fitnessRoutes);

const createFrontendSession = async () => {
  const email = `frontend.flow.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'password123';
  const register = await request(app).post('/api/auth/register').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return {
    token: login.body.token as string,
    userId: register.body.user.id as string,
  };
};

describe('Frontend -> Backend contract', () => {
  beforeEach(() => {
    resetMockRepository();
  });

  it('auth flow used by login/register UI works', async () => {
    const email = `ui.auth.${Date.now()}@example.com`;
    const password = 'password123';

    const register = await request(app).post('/api/auth/register').send({ email, password });
    expect(register.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token as string}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it('weight feature payloads persist correctly', async () => {
    const { token } = await createFrontendSession();

    const addWeight = await request(app)
      .post('/api/fitness/weights')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString(), weight: 76.5 });
    expect(addWeight.status).toBe(201);

    const listWeight = await request(app)
      .get('/api/fitness/weights')
      .set('Authorization', `Bearer ${token}`);
    expect(listWeight.status).toBe(200);
    expect(listWeight.body.data.some((w: { weight: number }) => w.weight === 76.5)).toBe(true);
  });

  it('nutrition feature payloads persist correctly', async () => {
    const { token } = await createFrontendSession();

    const saveProfile = await request(app)
      .post('/api/fitness/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weight: 75, height: 172, age: 28, sex: 'female', activityLevel: 'active', goal: 'gain' });
    expect(saveProfile.status).toBe(201);

    const saveMeals = await request(app)
      .post('/api/fitness/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'martes',
        meals: [
          { id: 'meal-1', name: 'Huevos', type: 'breakfast', calories: 320, protein: 24, carbs: 4, fat: 20, order: 0 },
        ],
      });
    expect(saveMeals.status).toBe(201);

    const getMeals = await request(app)
      .get('/api/fitness/meals')
      .set('Authorization', `Bearer ${token}`);
    expect(getMeals.status).toBe(200);
    expect(getMeals.body.data.martes.length).toBe(1);
  });

  it('workout and weekly-plan feature payloads persist correctly', async () => {
    const { token } = await createFrontendSession();
    const clientPlanId = `plan-ui-${Date.now()}`;

    const createPlan = await request(app)
      .post('/api/fitness/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: clientPlanId,
        name: 'Plan UI',
        isActive: false,
        items: [{ id: 'd-lun', day: 'lunes', muscleGroups: ['pecho'], exercises: [] }],
      });
    expect(createPlan.status).toBe(201);
    expect(createPlan.body.data.id).toBe(clientPlanId);

    const updatePlan = await request(app)
      .patch(`/api/fitness/plans/${clientPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plan UI Actualizado' });
    expect(updatePlan.status).toBe(200);

    const activate = await request(app)
      .post(`/api/fitness/plans/${clientPlanId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(activate.status).toBe(200);

    const createWorkout = await request(app)
      .post('/api/fitness/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date().toISOString(),
        exerciseId: 'e-bench',
        exerciseName: 'Press banca',
        muscleGroups: ['pecho'],
        sets: [{ weight: 82.5, reps: 6, tempo: '3-1-2', toFailure: false }],
        suggestedRest: 180,
      });
    expect(createWorkout.status).toBe(201);

    const listWorkout = await request(app)
      .get('/api/fitness/workouts')
      .set('Authorization', `Bearer ${token}`);
    expect(listWorkout.status).toBe(200);
    expect(listWorkout.body.data.length).toBeGreaterThan(0);
  });
});
