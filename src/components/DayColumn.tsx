import { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealCard } from './MealCard';
import { MealDialog } from './MealDialog';
import { getDayLabel } from '@/lib/fitness-utils';
import { useData } from '@/hooks/useData';
import type { DayOfWeek, Meal, MacroTarget } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { getErrorFeedback } from '@/lib/app-error';

interface DayColumnProps {
  day: DayOfWeek;
  meals: Meal[];
  macroTarget: MacroTarget | null;
}

export function DayColumn({ day, meals, macroTarget }: DayColumnProps) {
  const { saveMealPlan } = useData();
  const { text, language } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: { day },
  });
  
  // Calculate totals for this day
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  const proteinProgress = macroTarget 
    ? Math.min(100, (totals.protein / macroTarget.protein) * 100)
    : 0;
  
  const calorieProgress = macroTarget
    ? Math.min(100, (totals.calories / macroTarget.calories) * 100)
    : 0;
  
  const handleAddMeal = async (mealData: Omit<Meal, 'id' | 'order'>) => {
    const newMeal: Meal = {
      ...mealData,
      id: `meal-${Date.now()}`,
      order: meals.length,
    };

    try {
      await saveMealPlan(day, [...meals, newMeal]);
      setIsAddDialogOpen(false);
      toast.success(text('Comida agregada', 'Meal added'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo agregar la comida.', 'Could not add meal.'));
      toast.error(feedback.message, {
        description: feedback.action,
        id: 'meal-column-error',
      });
    }
  };

  const handleUpdateMeal = async (mealData: Omit<Meal, 'id' | 'order'>) => {
    if (editingMeal) {
      const updatedMeals = meals.map((meal) =>
        meal.id === editingMeal.id ? { ...meal, ...mealData } : meal
      );

      try {
        await saveMealPlan(day, updatedMeals);
        setEditingMeal(null);
        toast.success(text('Comida actualizada', 'Meal updated'));
      } catch (error) {
        const feedback = getErrorFeedback(error, text('No se pudo actualizar la comida.', 'Could not update meal.'));
        toast.error(feedback.message, {
          description: feedback.action,
          id: 'meal-column-error',
        });
      }
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const updatedMeals = meals.filter((meal) => meal.id !== mealId);

    try {
      await saveMealPlan(day, updatedMeals);
      toast.success(text('Comida eliminada', 'Meal deleted'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo eliminar la comida.', 'Could not delete meal.'));
      toast.error(feedback.message, {
        description: feedback.action,
        id: 'meal-column-error',
      });
    }
  };
  
  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col min-w-[200px] max-w-[240px] rounded-lg border border-border/50 bg-card/50
        ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold text-center uppercase text-sm tracking-wider">
          {getDayLabel(day, language)}
        </h3>
        
        {/* Progress bars */}
        {macroTarget && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-400 w-6">P</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
              <span className={`text-xs ${proteinProgress >= 100 ? 'text-semaphore-green' : 'text-muted-foreground'}`}>
                {totals.protein}g
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-orange-400 w-6">Kcal</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${calorieProgress > 100 ? 'bg-semaphore-red' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                />
              </div>
              <span className={`text-xs ${calorieProgress > 100 ? 'text-semaphore-red' : 'text-muted-foreground'}`}>
                {totals.calories}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Meals list */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        <SortableContext 
          items={meals.map(m => m.id)} 
          strategy={verticalListSortingStrategy}
        >
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={() => setEditingMeal(meal)}
              onDelete={() => handleDeleteMeal(meal.id)}
            />
          ))}
        </SortableContext>
        
        {meals.length === 0 && (
          <div className="h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">
                {text('Sin comidas', 'No meals')}
              </p>
            </div>
          )}
      </div>
      
      {/* Add button */}
      <div className="p-2 border-t border-border/50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full gap-1 h-8"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          {text('Agregar', 'Add')}
        </Button>
      </div>
      
      {/* Dialogs */}
      <MealDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddMeal}
        title={text('Nueva comida', 'New meal')}
      />
      
      <MealDialog
        open={!!editingMeal}
        onOpenChange={(open) => !open && setEditingMeal(null)}
        onSave={handleUpdateMeal}
        initialMeal={editingMeal || undefined}
        title={text('Editar comida', 'Edit meal')}
      />
    </div>
  );
}
