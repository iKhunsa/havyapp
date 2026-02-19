import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getMuscleGroupLabel } from '@/lib/fitness-utils';
import type { Exercise, WorkoutSet, MuscleGroup } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/hooks/useData';
import { getErrorFeedback } from '@/lib/app-error';

interface WorkoutRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise;
  muscleGroups: MuscleGroup[];
}

export function WorkoutRegistrationModal({
  open,
  onOpenChange,
  exercise,
  muscleGroups,
}: WorkoutRegistrationModalProps) {
  const { addWorkoutLog } = useData();
  const { text, language } = useLanguage();
  const [sets, setSets] = useState<WorkoutSet[]>([
    { weight: 0, reps: 8, tempo: '3-1-2', toFailure: false }
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateSet = (index: number, field: keyof WorkoutSet, value: number | string | boolean) => {
    setSets(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets(prev => [...prev, { ...lastSet, toFailure: false }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    // Validate sets
    const validSets = sets.filter(s => s.weight > 0 && s.reps > 0);
    if (validSets.length === 0) {
      toast.error(text('Ingresa al menos una serie valida', 'Enter at least one valid set'));
      return;
    }

    setSaving(true);

    try {
      await addWorkoutLog({
        date: new Date(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroups,
        sets: validSets,
        suggestedRest: exercise.restSeconds,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo guardar el ejercicio.', 'Could not save exercise.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
      setSaving(false);
      return;
    }

    setSaving(false);
    toast.success(text('Ejercicio registrado', 'Exercise logged'));
    
    // Reset and close
    setSets([{ weight: 0, reps: 8, tempo: '3-1-2', toFailure: false }]);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span>{exercise.name}</span>
            <div className="flex gap-1 flex-wrap">
              {muscleGroups.filter(g => g !== 'descanso').map(group => (
                <Badge key={group} variant="secondary" className="text-xs">
                  {getMuscleGroupLabel(group, language)}
                </Badge>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Sets */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              {text('Series', 'Sets')} ({sets.length})
            </Label>
            
            {sets.map((set, index) => (
              <div 
                key={index} 
                className="bg-muted/30 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{text('Serie', 'Set')} {index + 1}</span>
                  {sets.length > 1 && (
                    <button
                      onClick={() => removeSet(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                     <Label className="text-xs text-muted-foreground">{text('Peso (kg)', 'Weight (kg)')}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="h-10 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                     <Label className="text-xs text-muted-foreground">{text('Reps', 'Reps')}</Label>
                    <Input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                      className="h-10 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tempo</Label>
                    <Input
                      type="text"
                      value={set.tempo}
                      onChange={(e) => updateSet(index, 'tempo', e.target.value)}
                      className="h-10 text-center"
                      placeholder="3-1-2"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                   <span className="text-xs text-muted-foreground">{text('Al fallo', 'To failure')}</span>
                   <Switch
                    checked={set.toFailure}
                    onCheckedChange={(checked) => updateSet(index, 'toFailure', checked)}
                  />
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={addSet}
            >
              <Plus className="w-4 h-4" />
               {text('Anadir serie', 'Add set')}
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
               {text('Notas (opcional)', 'Notes (optional)')}
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={text('Ej: Buena sensacion, subir peso...', 'Ex: Good feeling, increase weight...')}
              className="bg-input"
            />
          </div>

          {/* Save button */}
            <Button 
              onClick={() => void handleSave()} 
              className="w-full gap-2"
              disabled={saving}
            >
            {saving ? (
               text('Guardando...', 'Saving...')
             ) : (
              <>
                <Check className="w-4 h-4" />
                {text('Guardar', 'Save')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
