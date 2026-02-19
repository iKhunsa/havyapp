import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { DayColumn } from './DayColumn';
import { MealCard } from './MealCard';
import { calculateMacros } from '@/lib/nutrition-utils';
import type { DayOfWeek, Meal } from '@/types/fitness';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { getErrorFeedback } from '@/lib/app-error';

const DAYS: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export function MealPlanner() {
  const { mealPlans, macroProfile, saveMealPlan } = useData();
  const { text } = useLanguage();
  const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
  const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null);

  const saveMealPlanSafely = async (day: DayOfWeek, meals: Meal[]) => {
    try {
      await saveMealPlan(day, meals);
      return true;
    } catch (error) {
      const feedback = getErrorFeedback(
        error,
        text('No se pudo guardar el plan de comidas.', 'Could not save meal plan.')
      );
      toast.error(feedback.message, {
        description: feedback.action,
        id: 'meal-plan-save-error',
      });
      return false;
    }
  };
  
  const macroTarget = useMemo(() => {
    if (!macroProfile) return null;
    return calculateMacros(macroProfile);
  }, [macroProfile]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const findMealDay = (mealId: string): DayOfWeek | null => {
    for (const day of DAYS) {
      if (mealPlans[day]?.find(m => m.id === mealId)) {
        return day;
      }
    }
    return null;
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const day = findMealDay(active.id as string);
    if (day) {
      const meal = mealPlans[day]?.find(m => m.id === active.id);
      if (meal) {
        setActiveMeal(meal);
        setActiveDay(day);
      }
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find which day each item belongs to
    const activeDay = findMealDay(activeId);
    let overDay: DayOfWeek | null = null;
    
    // Check if dropping on a day column
    if (overId.startsWith('day-')) {
      overDay = overId.replace('day-', '') as DayOfWeek;
    } else {
      overDay = findMealDay(overId);
    }
    
    // If moving between days
    if (activeDay && overDay && activeDay !== overDay) {
      const activeDayMeals = mealPlans[activeDay] || [];
      const overDayMeals = mealPlans[overDay] || [];
      
      const meal = activeDayMeals.find(m => m.id === activeId);
      if (meal) {
        const applyMove = async () => {
          const newActiveMeals = activeDayMeals.filter(m => m.id !== activeId);
          const sourceSaved = await saveMealPlanSafely(activeDay, newActiveMeals);
          if (!sourceSaved) return;

          const newOverMeals = [...overDayMeals, { ...meal, order: overDayMeals.length }];
          const targetSaved = await saveMealPlanSafely(overDay, newOverMeals);
          if (!targetSaved) return;

          setActiveDay(overDay);
        };

        void applyMove();
      }
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveMeal(null);
      setActiveDay(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Same column reorder
    if (activeId !== overId && !overId.startsWith('day-')) {
      const day = findMealDay(activeId);
      if (day) {
        const dayMeals = mealPlans[day] || [];
        const oldIndex = dayMeals.findIndex(m => m.id === activeId);
        const newIndex = dayMeals.findIndex(m => m.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newMeals = [...dayMeals];
          const [removed] = newMeals.splice(oldIndex, 1);
          newMeals.splice(newIndex, 0, removed);
          
          void saveMealPlanSafely(day, newMeals.map((m, i) => ({ ...m, order: i })));
        }
      }
    }
    
    setActiveMeal(null);
    setActiveDay(null);
  };
  
  return (
    <div className="space-y-4">
      {!macroProfile && (
        <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {text('Configura tu perfil de macros arriba para ver objetivos por dia.', 'Set up your macro profile above to see daily targets.')}
            </p>
          </div>
        )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full pb-4">
          <div className="flex gap-3 pb-4 min-w-max">
            {DAYS.map((day) => {
              const dayMeals = mealPlans[day] || [];
              return (
                <DayColumn
                  key={day}
                  day={day}
                  meals={dayMeals}
                  macroTarget={macroTarget}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <DragOverlay>
          {activeMeal && (
            <div className="w-[200px]">
              <MealCard
                meal={activeMeal}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
