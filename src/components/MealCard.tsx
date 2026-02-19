import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMealTypeLabel } from '@/lib/nutrition-utils';
import type { Meal } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealCardProps {
  meal: Meal;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const { language } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        card-clinical p-3 space-y-2 
        ${isDragging ? 'ring-2 ring-primary shadow-lg' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {getMealTypeLabel(meal.type, language)}
            </Badge>
          </div>
          <p className="font-medium text-sm truncate">{meal.name}</p>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1 text-xs">
        <div className="text-center p-1 rounded bg-muted/30">
          <p className="text-muted-foreground">Kcal</p>
          <p className="font-medium">{meal.calories}</p>
        </div>
        <div className="text-center p-1 rounded bg-blue-500/10">
          <p className="text-blue-400">P</p>
          <p className="font-medium text-blue-500">{meal.protein}g</p>
        </div>
        <div className="text-center p-1 rounded bg-amber-500/10">
          <p className="text-amber-400">C</p>
          <p className="font-medium text-amber-500">{meal.carbs}g</p>
        </div>
        <div className="text-center p-1 rounded bg-rose-500/10">
          <p className="text-rose-400">G</p>
          <p className="font-medium text-rose-500">{meal.fat}g</p>
        </div>
      </div>
    </div>
  );
}
