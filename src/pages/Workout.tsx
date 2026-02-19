import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AlertBanner } from '@/components/AlertBanner';
import { useFitnessStore, useActivePlan, useTodayExercises } from '@/stores/fitnessStore';
import { getCurrentDay, getMuscleGroupLabel, detectEgoProgression, detectStagnation, formatTime } from '@/lib/fitness-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Check, Minus } from 'lucide-react';
import type { WorkoutLog, WorkoutSet, AntiEgoAlert } from '@/types/fitness';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/hooks/useData';
import { getErrorFeedback } from '@/lib/app-error';

export default function Workout() {
  const navigate = useNavigate();
  const { text } = useLanguage();
  const { addAlert } = useFitnessStore();
  const { workoutLogs, addWorkoutLog } = useData();
  const todayExercises = useTodayExercises();
  const plan = useActivePlan();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<WorkoutSet[]>([
    { weight: 0, reps: 0, tempo: '3-1-2', toFailure: false }
  ]);
  const [localAlerts, setLocalAlerts] = useState<AntiEgoAlert[]>([]);
  
  const currentExercise = todayExercises[currentExerciseIndex];
  const currentDay = getCurrentDay();
  const todayPlan = plan?.items.find(item => item.day === currentDay);
  
  // No exercises today
  if (todayExercises.length === 0) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <header className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Registro', 'Log')}</p>
            <h1 className="text-2xl font-bold tracking-tight">{text('Entrenar', 'Workout')}</h1>
          </header>
          
          <div className="card-clinical p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              {todayPlan?.muscleGroups.includes('descanso') 
                ? text('Hoy es dia de descanso.', 'Today is a rest day.')
                : text('No hay ejercicios configurados para hoy.', 'There are no exercises configured for today.')
              }
            </p>
            <Button onClick={() => navigate('/plan')} variant="outline">
              {text('Ir al plan semanal', 'Go to weekly plan')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  const updateSet = (index: number, field: keyof WorkoutSet, value: unknown) => {
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
  
  const checkAntiEgo = () => {
    const alerts: AntiEgoAlert[] = [];
    const weight = sets[0]?.weight || 0;
    
    // Check ego progression
    const egoCheck = detectEgoProgression(currentExercise.id, weight, workoutLogs);
    if (egoCheck.isEgo) {
      alerts.push({
        type: 'ego',
        message: egoCheck.message!,
        severity: 'warning',
        exerciseId: currentExercise.id
      });
    }
    
    // Check stagnation
    const stagnationCheck = detectStagnation(currentExercise.id, workoutLogs);
    if (stagnationCheck.isStagnant) {
      alerts.push({
        type: 'stagnation',
        message: text(
          `${stagnationCheck.weeks} semanas con el mismo peso. Considera variar el estimulo.`,
          `${stagnationCheck.weeks} weeks with the same weight. Consider changing the stimulus.`
        ),
        severity: 'warning',
        exerciseId: currentExercise.id
      });
    }
    
    setLocalAlerts(alerts);
    alerts.forEach(a => addAlert(a));
    
    return alerts;
  };
  
  const saveExercise = async () => {
    // Validate
    const hasValidSets = sets.every(s => s.weight > 0 && s.reps > 0);
    if (!hasValidSets) {
      toast.error(text('Completa peso y reps de todas las series', 'Complete weight and reps for all sets'));
      return;
    }
    
    // Check anti-ego (just warns, doesn't block)
    checkAntiEgo();
    
    const log: WorkoutLog = {
      id: `wl-${Date.now()}`,
      date: new Date(),
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      muscleGroups: [currentExercise.muscleGroup],
      sets: sets,
      suggestedRest: currentExercise.restSeconds
    };
    
    try {
      await addWorkoutLog(log);
      toast.success(`${currentExercise.name} ${text('registrado', 'logged')}`);
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo guardar el ejercicio.', 'Could not save exercise.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
      return;
    }
    
    // Move to next exercise or finish
    if (currentExerciseIndex < todayExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setSets([{ weight: 0, reps: 0, tempo: '3-1-2', toFailure: false }]);
      setLocalAlerts([]);
    } else {
      toast.success(text('Entrenamiento completo', 'Workout complete'));
      navigate('/');
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {text('Ejercicio', 'Exercise')} {currentExerciseIndex + 1} {text('de', 'of')} {todayExercises.length}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{currentExercise.name}</h1>
          </div>
        </header>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentExerciseIndex + 1) / todayExercises.length) * 100}%` }}
          />
        </div>
        
        {/* Alerts */}
        {localAlerts.map((alert, i) => (
          <AlertBanner key={i} alert={alert} />
        ))}
        
        {/* Rest indicator */}
        <div className="card-clinical p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{text('Descanso sugerido', 'Suggested rest')}</span>
          <span className="font-medium">{formatTime(currentExercise.restSeconds)}</span>
        </div>
        
        {/* Sets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {text('Series', 'Sets')} ({sets.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={addSet} className="gap-1">
              <Plus className="w-4 h-4" />
              {text('Serie', 'Set')}
            </Button>
          </div>
          
          {sets.map((set, i) => (
            <div key={i} className="card-clinical p-4 space-y-4">
              <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{text('Serie', 'Set')} {i + 1}</span>
                {sets.length > 1 && (
                  <button 
                    onClick={() => removeSet(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{text('Peso (kg)', 'Weight (kg)')}</label>
                  <Input 
                    type="number"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                    className="bg-input text-center"
                    step={2.5}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{text('Reps', 'Reps')}</label>
                  <Input 
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                    className="bg-input text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Tempo</label>
                  <Input 
                    value={set.tempo}
                    onChange={(e) => updateSet(i, 'tempo', e.target.value)}
                    className="bg-input text-center"
                    placeholder="3-1-2"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <label className="text-sm text-muted-foreground">{text('Llegaste al fallo?', 'Reached failure?')}</label>
                <Switch 
                  checked={set.toFailure}
                  onCheckedChange={(checked) => updateSet(i, 'toFailure', checked)}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Save button */}
        <Button 
          onClick={() => void saveExercise()} 
          className="w-full gap-2"
          size="lg"
        >
          <Check className="w-4 h-4" />
          {currentExerciseIndex < todayExercises.length - 1 
            ? text('Guardar y siguiente', 'Save and next')
            : text('Finalizar entrenamiento', 'Finish workout')
          }
        </Button>
      </div>
    </Layout>
  );
}
