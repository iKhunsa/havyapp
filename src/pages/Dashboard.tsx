import { Layout } from '@/components/Layout';
import { MetricCard } from '@/components/MetricCard';
import { AlertBanner } from '@/components/AlertBanner';
import { useFitnessStore, useActivePlan, useTodayExercises } from '@/stores/fitnessStore';
import { getCurrentDay, getDayLabel, getMuscleGroupLabel, daysSinceLastStimulus } from '@/lib/fitness-utils';
import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MuscleGroup } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Dashboard() {
  const { alerts, workoutLogs, clearAlerts } = useFitnessStore();
  const { text, locale, language } = useLanguage();
  const plan = useActivePlan();
  const todayExercises = useTodayExercises();
  
  const currentDay = getCurrentDay();
  const todayPlan = plan?.items.find(item => item.day === currentDay);
  const todayMuscleGroups = todayPlan?.muscleGroups || [];
  const isRestDay = todayMuscleGroups.includes('descanso') || todayMuscleGroups.length === 0;
  
  const muscleGroups: MuscleGroup[] = ['pecho', 'espalda', 'piernas', 'hombros'];
  const lastStimulusData = muscleGroups.map(group => ({
    group,
    days: daysSinceLastStimulus(group, workoutLogs)
  }));
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {getDayLabel(currentDay, language)} — {new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{text('Panel de control', 'Dashboard')}</h1>
        </header>
        
        <div className="card-clinical p-6 card-allowed">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Entrenamiento', 'Workout')}</p>
              <h2 className="text-lg font-semibold">{text('Estado diario', 'Daily status')}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {text('Revisa tu plan del dia y registra tus series para llevar progreso consistente.', 'Review your daily plan and log your sets to keep consistent progress.')}
              </p>
            </div>

            <Link to="/">
              <Button variant="default" size="sm" className="gap-2">
                <Dumbbell className="w-4 h-4" />
                {text('Ir a entrenar', 'Start workout')}
              </Button>
            </Link>
          </div>
        </div>
        
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertBanner key={i} alert={alert} onDismiss={() => clearAlerts()} />
            ))}
          </div>
        )}
        
        {!isRestDay && todayPlan && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{text('Hoy:', 'Today:')}</h2>
              {todayMuscleGroups.filter(g => g !== 'descanso').map(group => (
                <Badge key={group} variant="secondary">{getMuscleGroupLabel(group, language)}</Badge>
              ))}
            </div>
            <div className="grid gap-2">
              {todayExercises.slice(0, 4).map((exercise, i) => (
                <div key={exercise.id} className="card-clinical p-3 flex items-center justify-between animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{exercise.restSeconds}s</span>
                </div>
              ))}
            </div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {text('Ver entrenamiento completo', 'See full workout')} <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}
        
        {isRestDay && (
          <div className="card-clinical p-6 text-center">
            <Moon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{text('Dia de descanso programado', 'Scheduled rest day')}</p>
          </div>
        )}
        
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{text('Metricas rapidas', 'Quick metrics')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label={text('Ejercicios hoy', 'Exercises today')} value={todayExercises.length} unit={text('total', 'total')} />
            <MetricCard label={text('Entrenos', 'Workouts')} value={workoutLogs.filter(l => new Date(l.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length} unit="/7d" />
            <MetricCard label={text('Alertas', 'Alerts')} value={alerts.length} unit={text('activas', 'active')} status={alerts.length > 0 ? 'warning' : 'success'} />
            <MetricCard label={text('Estado dia', 'Day status')} value={isRestDay ? text('Descanso', 'Rest') : text('Activo', 'Active')} />
          </div>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{text('Ultimo estimulo por musculo', 'Last stimulus by muscle')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {lastStimulusData.map(({ group, days }) => (
              <div key={group} className="card-clinical p-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{getMuscleGroupLabel(group, language)}</span>
                <div className="flex items-center gap-1">
                  <Zap className={`w-3 h-3 ${days <= 3 ? 'text-semaphore-green' : days <= 6 ? 'text-semaphore-yellow' : 'text-semaphore-red'}`} />
                  <span className="text-sm font-medium">{days > 100 ? '—' : `${days}d`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
