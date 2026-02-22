import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { fitnessRepository } from '../db/repository';
import type { AuthRequest } from '../types';
import type { DayOfWeek, Meal } from '../types/fitness';

const router = Router();

// Helper to generate ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// ============ WORKOUT LOGS ============

// GET /api/fitness/workouts
router.get('/workouts', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const workouts = await fitnessRepository.getWorkoutLogs(userId);
    res.json({ data: workouts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// POST /api/fitness/workouts
router.post('/workouts', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const workoutData = req.body;
    
    const newWorkout = await fitnessRepository.saveWorkoutLog(userId, {
      ...workoutData,
      id: typeof workoutData.id === 'string' && workoutData.id.trim().length > 0
        ? workoutData.id
        : generateId(),
      date: new Date(workoutData.date || Date.now()),
    });
    
    res.status(201).json({ data: newWorkout });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PATCH /api/fitness/workouts/:id
router.patch('/workouts/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.date) {
      updates.date = new Date(updates.date);
    }
    
    const success = await fitnessRepository.updateWorkoutLog(userId, id, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE /api/fitness/workouts/:id
router.delete('/workouts/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const success = await fitnessRepository.deleteWorkoutLog(userId, id);
    
    if (!success) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// ============ BODY WEIGHT LOGS ============

// GET /api/fitness/weights
router.get('/weights', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const weights = await fitnessRepository.getBodyWeightLogs(userId);
    res.json({ data: weights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weights' });
  }
});

// POST /api/fitness/weights
router.post('/weights', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const weightData = req.body;
    
    const newWeight = await fitnessRepository.saveBodyWeightLog(userId, {
      ...weightData,
      id: typeof weightData.id === 'string' && weightData.id.trim().length > 0
        ? weightData.id
        : generateId(),
      date: new Date(weightData.date || Date.now()),
    });
    
    res.status(201).json({ data: newWeight });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create weight log' });
  }
});

// PATCH /api/fitness/weights/:id
router.patch('/weights/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.date) {
      updates.date = new Date(updates.date);
    }
    
    const success = await fitnessRepository.updateBodyWeightLog(userId, id, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Weight log not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update weight log' });
  }
});

// DELETE /api/fitness/weights/:id
router.delete('/weights/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const success = await fitnessRepository.deleteBodyWeightLog(userId, id);
    
    if (!success) {
      return res.status(404).json({ error: 'Weight log not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete weight log' });
  }
});

// ============ WEEKLY PLANS ============

// GET /api/fitness/plans
router.get('/plans', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const plans = await fitnessRepository.getWeeklyPlans(userId);
    res.json({ data: plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// POST /api/fitness/plans
router.post('/plans', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const planData = req.body;
    
    const newPlan = await fitnessRepository.saveWeeklyPlan(userId, {
      ...planData,
      id: typeof planData.id === 'string' && planData.id.trim().length > 0
        ? planData.id
        : generateId(),
      createdAt: new Date(planData.createdAt || Date.now()),
    });
    
    res.status(201).json({ data: newPlan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// PATCH /api/fitness/plans/:id
router.patch('/plans/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.createdAt) {
      updates.createdAt = new Date(updates.createdAt);
    }
    
    const success = await fitnessRepository.updateWeeklyPlan(userId, id, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// DELETE /api/fitness/plans/:id
router.delete('/plans/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const success = await fitnessRepository.deleteWeeklyPlan(userId, id);
    
    if (!success) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// POST /api/fitness/plans/:id/activate
router.post('/plans/:id/activate', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const success = await fitnessRepository.setActivePlan(userId, id);
    
    if (!success) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

// ============ MACRO PROFILE ============

// GET /api/fitness/profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = await fitnessRepository.getMacroProfile(userId);
    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/fitness/profile
router.post('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const profileData = req.body;
    
    const profile = await fitnessRepository.saveMacroProfile(userId, profileData);
    
    res.status(201).json({ data: profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ============ MEAL PLANS ============

// GET /api/fitness/meals
router.get('/meals', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const mealPlans = await fitnessRepository.getMealPlans(userId);

    const mealsByDay: Record<DayOfWeek, Meal[]> = {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
      domingo: [],
    };

    mealPlans.forEach((meals, day) => {
      mealsByDay[day] = meals;
    });
    
    res.json({ data: mealsByDay });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// POST /api/fitness/meals
router.post('/meals', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { day, meals } = req.body;
    
    await fitnessRepository.saveMealPlan(userId, day, meals);
    
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save meals' });
  }
});

router.post('/import', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await fitnessRepository.importAll(userId, req.body ?? {});
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;
