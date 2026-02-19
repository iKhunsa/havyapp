import type { UserMacroProfile, MacroTarget } from '@/types/fitness';

type Language = 'es' | 'en';

// Mifflin-St Jeor formula for BMR calculation
export const calculateBMR = (profile: UserMacroProfile): number => {
  const { weight, height, age, sex } = profile;
  
  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Activity multipliers
const activityMultipliers: Record<UserMacroProfile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goal adjustments (percentage)
const goalAdjustments: Record<UserMacroProfile['goal'], number> = {
  lose: -0.15, // 15% deficit
  maintain: 0,
  gain: 0.10, // 10% surplus
};

// Calculate TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (profile: UserMacroProfile): number => {
  const bmr = calculateBMR(profile);
  const activityMultiplier = activityMultipliers[profile.activityLevel];
  return Math.round(bmr * activityMultiplier);
};

// Calculate target calories based on goal
export const calculateTargetCalories = (profile: UserMacroProfile): number => {
  const tdee = calculateTDEE(profile);
  const adjustment = goalAdjustments[profile.goal];
  return Math.round(tdee * (1 + adjustment));
};

// Calculate macros based on profile and calories
export const calculateMacros = (profile: UserMacroProfile): MacroTarget => {
  const calories = calculateTargetCalories(profile);
  
  // Protein: 2g per kg for muscle building/maintenance
  const proteinPerKg = profile.goal === 'gain' ? 2.2 : profile.goal === 'maintain' ? 2.0 : 2.2;
  const protein = Math.round(profile.weight * proteinPerKg);
  
  // Fat: 25-30% of calories
  const fatPercent = profile.goal === 'lose' ? 0.25 : 0.28;
  const fatCalories = calories * fatPercent;
  const fat = Math.round(fatCalories / 9);
  
  // Carbs: remaining calories
  const proteinCalories = protein * 4;
  const usedCalories = proteinCalories + fatCalories;
  const carbCalories = calories - usedCalories;
  const carbs = Math.round(carbCalories / 4);
  
  return {
    calories,
    protein,
    carbs,
    fat,
  };
};

// Get activity level label
export const getActivityLabel = (level: UserMacroProfile['activityLevel'], language: Language = 'es'): string => {
  const labelsEs: Record<UserMacroProfile['activityLevel'], string> = {
    sedentary: 'Sedentario (sin ejercicio)',
    light: 'Ligero (1-3 días/semana)',
    moderate: 'Moderado (3-5 días/semana)',
    active: 'Activo (6-7 días/semana)',
    very_active: 'Muy activo (2x al día)',
  };

  const labelsEn: Record<UserMacroProfile['activityLevel'], string> = {
    sedentary: 'Sedentary (no exercise)',
    light: 'Light (1-3 days/week)',
    moderate: 'Moderate (3-5 days/week)',
    active: 'Active (6-7 days/week)',
    very_active: 'Very active (2x per day)',
  };

  return language === 'es' ? labelsEs[level] : labelsEn[level];
};

// Get goal label
export const getGoalLabel = (goal: UserMacroProfile['goal'], language: Language = 'es'): string => {
  const labelsEs: Record<UserMacroProfile['goal'], string> = {
    lose: 'Perder grasa',
    maintain: 'Mantener',
    gain: 'Ganar músculo',
  };

  const labelsEn: Record<UserMacroProfile['goal'], string> = {
    lose: 'Lose fat',
    maintain: 'Maintain',
    gain: 'Gain muscle',
  };

  return language === 'es' ? labelsEs[goal] : labelsEn[goal];
};

// Get meal type label
export const getMealTypeLabel = (type: 'breakfast' | 'lunch' | 'snack' | 'dinner', language: Language = 'es'): string => {
  const labelsEs = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    snack: 'Merienda',
    dinner: 'Cena',
  };

  const labelsEn = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    snack: 'Snack',
    dinner: 'Dinner',
  };

  return language === 'es' ? labelsEs[type] : labelsEn[type];
};
