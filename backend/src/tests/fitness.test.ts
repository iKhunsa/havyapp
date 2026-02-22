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

const authUser = async () => {
  const email = `fitness.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'password123';
  const register = await request(app).post('/api/auth/register').send({ email, password });
  return {
    token: register.body.token as string,
  };
};

describe('Fitness API', () => {
  beforeEach(() => {
    resetMockRepository();
  });

  it('creates, updates and deletes workout logs', async () => {
    const { token } = await authUser();

    const create = await request(app)
      .post('/api/fitness/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date().toISOString(),
        exerciseId: 'e1',
        exerciseName: 'Press banca',
        muscleGroups: ['pecho'],
        sets: [{ weight: 80, reps: 8, tempo: '3-1-2', toFailure: false }],
        suggestedRest: 120,
      });

    expect(create.status).toBe(201);
    const workoutId = create.body.data.id as string;

    const list = await request(app)
      .get('/api/fitness/workouts')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);

    const patch = await request(app)
      .patch(`/api/fitness/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Sesion solida' });
    expect(patch.status).toBe(200);

    const remove = await request(app)
      .delete(`/api/fitness/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);
  });

  it('creates, updates and deletes body weight logs', async () => {
    const { token } = await authUser();

    const create = await request(app)
      .post('/api/fitness/weights')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString(), weight: 78.2 });

    expect(create.status).toBe(201);
    const weightId = create.body.data.id as string;

    const patch = await request(app)
      .patch(`/api/fitness/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ weight: 77.9 });
    expect(patch.status).toBe(200);

    const list = await request(app)
      .get('/api/fitness/weights')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0].weight).toBe(77.9);

    const remove = await request(app)
      .delete(`/api/fitness/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);
  });

  it('creates, updates, activates and deletes plans', async () => {
    const { token } = await authUser();

    const create = await request(app)
      .post('/api/fitness/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plan Fuerza',
        isActive: false,
        items: [
          { id: 'd1', day: 'lunes', muscleGroups: ['pecho'], exercises: [] },
          { id: 'd2', day: 'martes', muscleGroups: ['espalda'], exercises: [] },
        ],
      });

    expect(create.status).toBe(201);
    const planId = create.body.data.id as string;

    const patch = await request(app)
      .patch(`/api/fitness/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plan Fuerza v2' });
    expect(patch.status).toBe(200);

    const activate = await request(app)
      .post(`/api/fitness/plans/${planId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(activate.status).toBe(200);

    const list = await request(app)
      .get('/api/fitness/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((p: { id: string; isActive: boolean }) => p.id === planId && p.isActive)).toBe(true);

    const remove = await request(app)
      .delete(`/api/fitness/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);
  });

  it('saves profile and meals', async () => {
    const { token } = await authUser();

    const profile = await request(app)
      .post('/api/fitness/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        weight: 80,
        height: 178,
        age: 31,
        sex: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
      });
    expect(profile.status).toBe(201);

    const profileGet = await request(app)
      .get('/api/fitness/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileGet.status).toBe(200);
    expect(profileGet.body.data.weight).toBe(80);

    const mealsSave = await request(app)
      .post('/api/fitness/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'lunes',
        meals: [
          { id: 'm1', name: 'Avena', type: 'breakfast', calories: 450, protein: 25, carbs: 60, fat: 12, order: 0 },
        ],
      });
    expect(mealsSave.status).toBe(201);

    const mealsGet = await request(app)
      .get('/api/fitness/meals')
      .set('Authorization', `Bearer ${token}`);
    expect(mealsGet.status).toBe(200);
    expect(mealsGet.body.data.lunes.length).toBe(1);
  });

  it('rejects unauthenticated access to fitness endpoints', async () => {
    const response = await request(app).get('/api/fitness/workouts');
    expect(response.status).toBe(401);
  });
});
