import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMealTypeLabel } from '@/lib/nutrition-utils';
import type { Meal } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Omit<Meal, 'id' | 'order'>) => void;
  initialMeal?: Meal;
  title: string;
}

export function MealDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialMeal,
  title 
}: MealDialogProps) {
  const { text, language } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<Meal['type']>('lunch');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  
  useEffect(() => {
    if (initialMeal) {
      setName(initialMeal.name);
      setType(initialMeal.type);
      setCalories(initialMeal.calories);
      setProtein(initialMeal.protein);
      setCarbs(initialMeal.carbs);
      setFat(initialMeal.fat);
    } else {
      setName('');
      setType('lunch');
      setCalories(0);
      setProtein(0);
      setCarbs(0);
      setFat(0);
    }
  }, [initialMeal, open]);
  
  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      type,
      calories,
      protein,
      carbs,
      fat,
    });
  };
  
  // Auto-calculate calories from macros
  const calculatedCalories = protein * 4 + carbs * 4 + fat * 9;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{text('Nombre', 'Name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={text('Ej: Pollo con arroz', 'Ex: Chicken and rice')}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{text('Tipo de comida', 'Meal type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as Meal['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">{getMealTypeLabel('breakfast', language)}</SelectItem>
                <SelectItem value="lunch">{getMealTypeLabel('lunch', language)}</SelectItem>
                <SelectItem value="snack">{getMealTypeLabel('snack', language)}</SelectItem>
                <SelectItem value="dinner">{getMealTypeLabel('dinner', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-blue-400">Proteína (g)</Label>
              <Input
                type="number"
                value={protein || ''}
                onChange={(e) => setProtein(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-amber-400">{text('Carbos (g)', 'Carbs (g)')}</Label>
              <Input
                type="number"
                value={carbs || ''}
                onChange={(e) => setCarbs(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-rose-400">{text('Grasa (g)', 'Fat (g)')}</Label>
              <Input
                type="number"
                value={fat || ''}
                onChange={(e) => setFat(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
               <Label className="text-xs text-muted-foreground">{text('Calorias', 'Calories')}</Label>
               <span className="text-xs text-muted-foreground">
                 {text('Calculado', 'Calculated')}: {calculatedCalories} kcal
               </span>
             </div>
            <Input
              type="number"
              value={calories || ''}
              onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
              placeholder={String(calculatedCalories)}
              className="text-center"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {text('Cancelar', 'Cancel')}
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSave}
              disabled={!name.trim()}
            >
              {text('Guardar', 'Save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
