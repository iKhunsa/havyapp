import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useActivePlan } from '@/stores/fitnessStore';
import { getDayLabel, getMuscleGroupLabel } from '@/lib/fitness-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Video, GripVertical, Trash2, Pencil } from 'lucide-react';
import type { DayOfWeek, MuscleGroup, Exercise, PlanItem } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/hooks/useData';
import { toast } from 'sonner';
import { getErrorFeedback } from '@/lib/app-error';

const DAYS: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const MUSCLE_GROUPS: MuscleGroup[] = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'piernas', 'gluteos', 'core', 'cardio', 'descanso'];

export default function WeeklyPlan() {
  const { text, language } = useLanguage();
  const plan = useActivePlan();
  const { saveWeeklyPlan, setActivePlan } = useData();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('lunes');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', videoUrl: '' });
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState({ name: '', videoUrl: '' });
  
  const selectedItem = plan?.items.find(item => item.day === selectedDay);
  const selectedMuscleGroups = selectedItem?.muscleGroups || [];
  
  const persistPlanItems = async (items: PlanItem[]) => {
    if (!plan) return;
    try {
      await saveWeeklyPlan({ ...plan, items });
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo guardar el plan semanal.', 'Could not save weekly plan.'));
      toast.error(feedback.message, {
        description: feedback.action,
        id: 'weekly-plan-save-error',
      });
    }
  };

  const toggleMuscleGroup = (group: MuscleGroup) => {
    if (!plan) return;
    
    let newGroups: MuscleGroup[];
    if (group === 'descanso') {
      newGroups = ['descanso'];
    } else {
      const filtered = selectedMuscleGroups.filter(g => g !== 'descanso');
      if (filtered.includes(group)) {
        newGroups = filtered.filter(g => g !== group);
      } else {
        newGroups = [...filtered, group];
      }
      if (newGroups.length === 0) newGroups = ['descanso'];
    }
    
    const updatedItems = plan.items.map(item =>
      item.day === selectedDay
        ? { ...item, muscleGroups: newGroups, exercises: newGroups.includes('descanso') ? [] : item.exercises }
        : item
    );
    void persistPlanItems(updatedItems);
  };
  
  const handleAddExercise = () => {
    if (!plan || !newExercise.name.trim()) return;
    
    const exercise: Exercise = {
      id: `e-${Date.now()}`,
      name: newExercise.name.trim(),
      muscleGroup: selectedMuscleGroups.find(g => g !== 'descanso') || 'pecho',
      videoUrl: newExercise.videoUrl.trim() || undefined,
      restSeconds: 120,
      order: (selectedItem?.exercises.length || 0) + 1,
    };
    
    const updatedItems = plan.items.map(item =>
      item.day === selectedDay ? { ...item, exercises: [...item.exercises, exercise] } : item
    );
    
    void persistPlanItems(updatedItems);
    setNewExercise({ name: '', videoUrl: '' });
    setIsAddingExercise(false);
  };
  
  const handleRemoveExercise = (exerciseId: string) => {
    if (!plan) return;
    const updatedItems = plan.items.map(item =>
      item.day === selectedDay ? { ...item, exercises: item.exercises.filter(e => e.id !== exerciseId) } : item
    );
    void persistPlanItems(updatedItems);
  };

  const openEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setEditExercise({
      name: exercise.name,
      videoUrl: exercise.videoUrl ?? '',
    });
    setIsEditingExercise(true);
  };

  const handleSaveExerciseEdit = () => {
    if (!plan || !editingExerciseId || !editExercise.name.trim()) return;

    const updatedItems = plan.items.map((item) =>
      item.day === selectedDay
        ? {
            ...item,
            exercises: item.exercises.map((exercise) =>
              exercise.id === editingExerciseId
                ? {
                    ...exercise,
                    name: editExercise.name.trim(),
                    videoUrl: editExercise.videoUrl.trim() || undefined,
                  }
                : exercise,
            ),
          }
        : item,
    );

    void persistPlanItems(updatedItems);
    setIsEditingExercise(false);
    setEditingExerciseId(null);
    setEditExercise({ name: '', videoUrl: '' });
  };

  const createInitialPlan = async () => {
    try {
      const baseItems = DAYS.map((day) => ({
        id: `item-${day}-${Date.now()}`,
        day,
        muscleGroups: ['descanso'] as MuscleGroup[],
        exercises: [],
      }));

      const created = await saveWeeklyPlan({
        name: text('Plan base', 'Base plan'),
        isActive: true,
        items: baseItems,
      });

      await setActivePlan(created.id);
      toast.success(text('Plan semanal creado', 'Weekly plan created'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo crear el plan semanal.', 'Could not create weekly plan.'));
      toast.error(feedback.message, {
        description: feedback.action,
        id: 'weekly-plan-create-error',
      });
    }
  };

  if (!plan) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <header className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Configuracion', 'Settings')}</p>
            <h1 className="text-2xl font-bold tracking-tight">{text('Plan semanal', 'Weekly plan')}</h1>
          </header>
          <div className="card-clinical p-6 text-center text-sm text-muted-foreground">
            <p>{text('No hay un plan semanal disponible todavia.', 'There is no weekly plan available yet.')}</p>
            <Button className="mt-4" onClick={() => void createInitialPlan()}>
              {text('Crear plan semanal', 'Create weekly plan')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Configuracion', 'Settings')}</p>
          <h1 className="text-2xl font-bold tracking-tight">{text('Plan semanal', 'Weekly plan')}</h1>
        </header>
        
        <div className="flex gap-1 overflow-x-auto pb-2">
          {DAYS.map((day) => {
            const dayItem = plan?.items.find(i => i.day === day);
            const isSelected = selectedDay === day;
            const dayGroups = dayItem?.muscleGroups || [];
            const isRest = dayGroups.includes('descanso') || dayGroups.length === 0;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'flex-shrink-0 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
                  isRest && !isSelected && 'opacity-50'
                )}
              >
                <span className="block">{getDayLabel(day, language)}</span>
                <span className="block text-xs mt-1 opacity-70">
                  {isRest ? text('Descanso', 'Rest') : dayGroups.filter(g => g !== 'descanso').map(g => getMuscleGroupLabel(g, language).slice(0, 3)).join('+')}
                </span>
              </button>
            );
          })}
        </div>
        
        <section className="space-y-4">
          <div className="card-clinical p-4 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{text('Grupos musculares (selecciona multiples)', 'Muscle groups (select multiple)')}</h3>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => toggleMuscleGroup(group)}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide transition-colors',
                    selectedMuscleGroups.includes(group)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {getMuscleGroupLabel(group, language)}
                </button>
              ))}
            </div>
          </div>
          
          {!selectedMuscleGroups.includes('descanso') && (
            <div className="card-clinical p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {text('Ejercicios', 'Exercises')} ({selectedItem?.exercises.length || 0})
                </h3>
                <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
                  <DialogTrigger asChild>
                     <Button variant="ghost" size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{text('Anadir', 'Add')}</Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card border-border">
                     <DialogHeader><DialogTitle>{text('Anadir ejercicio', 'Add exercise')}</DialogTitle></DialogHeader>
                     <div className="space-y-4 pt-4">
                       <div className="space-y-2">
                         <label className="text-sm text-muted-foreground">{text('Nombre', 'Name')}</label>
                         <Input value={newExercise.name} onChange={(e) => setNewExercise(p => ({ ...p, name: e.target.value }))} placeholder={text('Ej: Press banca', 'Ex: Bench press')} className="bg-input" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-sm text-muted-foreground">{text('URL del video (opcional)', 'Video URL (optional)')}</label>
                         <Input value={newExercise.videoUrl} onChange={(e) => setNewExercise(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." className="bg-input" />
                       </div>
                       <Button onClick={handleAddExercise} className="w-full">{text('Anadir', 'Add')}</Button>
                     </div>
                   </DialogContent>
                  </Dialog>
                  <Dialog open={isEditingExercise} onOpenChange={setIsEditingExercise}>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader><DialogTitle>{text('Editar ejercicio', 'Edit exercise')}</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">{text('Nombre', 'Name')}</label>
                          <Input
                            value={editExercise.name}
                            onChange={(e) => setEditExercise((p) => ({ ...p, name: e.target.value }))}
                            placeholder={text('Ej: Press banca', 'Ex: Bench press')}
                            className="bg-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">{text('URL del video (opcional)', 'Video URL (optional)')}</label>
                          <Input
                            value={editExercise.videoUrl}
                            onChange={(e) => setEditExercise((p) => ({ ...p, videoUrl: e.target.value }))}
                            placeholder="https://youtube.com/..."
                            className="bg-input"
                          />
                        </div>
                        <Button onClick={handleSaveExerciseEdit} className="w-full">{text('Guardar cambios', 'Save changes')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
               </div>
              
              <div className="space-y-2">
                {selectedItem?.exercises.map((exercise, i) => (
                  <div key={exercise.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md group">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                    <span className="flex-1 text-sm">{exercise.name}</span>
                    {exercise.videoUrl && <Video className="w-4 h-4 text-status-info" />}
                    <span className="text-xs text-muted-foreground">{exercise.restSeconds}s</span>
                    <button
                      onClick={() => openEditExercise(exercise)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemoveExercise(exercise.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {selectedItem?.exercises.length === 0 && (
                   <p className="text-sm text-muted-foreground text-center py-6">{text('No hay ejercicios configurados', 'No exercises configured')}</p>
                 )}
               </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
