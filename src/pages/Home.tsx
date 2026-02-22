import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { WorkoutRegistrationModal } from '@/components/WorkoutRegistrationModal';
import { getCurrentDay, getDayLabel, getMuscleGroupLabel } from '@/lib/fitness-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Video, ExternalLink, Check, ClipboardEdit } from 'lucide-react';
import type { DayOfWeek, Exercise, MuscleGroup } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/hooks/useData';

const DAYS: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const CHECKED_STORAGE_PREFIX = 'workout_checked_v1';

const createEmptyCheckedByDay = (): Record<DayOfWeek, string[]> => ({
  lunes: [],
  martes: [],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
});

const parseCheckedByDay = (raw: string | null): Record<DayOfWeek, string[]> => {
  if (!raw) return createEmptyCheckedByDay();

  try {
    const parsed = JSON.parse(raw) as Partial<Record<DayOfWeek, string[]>>;
    return {
      lunes: Array.isArray(parsed.lunes) ? parsed.lunes : [],
      martes: Array.isArray(parsed.martes) ? parsed.martes : [],
      miercoles: Array.isArray(parsed.miercoles) ? parsed.miercoles : [],
      jueves: Array.isArray(parsed.jueves) ? parsed.jueves : [],
      viernes: Array.isArray(parsed.viernes) ? parsed.viernes : [],
      sabado: Array.isArray(parsed.sabado) ? parsed.sabado : [],
      domingo: Array.isArray(parsed.domingo) ? parsed.domingo : [],
    };
  } catch {
    return createEmptyCheckedByDay();
  }
};

export default function Home() {
  const { weeklyPlans } = useData();
  const plan = useMemo(
    () => weeklyPlans.find((item) => item.isActive) ?? weeklyPlans[0],
    [weeklyPlans],
  );
  const { text, locale, language } = useLanguage();
  
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDay());
  const [checkedByDay, setCheckedByDay] = useState<Record<DayOfWeek, string[]>>(createEmptyCheckedByDay);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const checkedExercises = useMemo(() => new Set(checkedByDay[selectedDay] ?? []), [checkedByDay, selectedDay]);
  const checkedStorageKey = plan ? `${CHECKED_STORAGE_PREFIX}_${plan.id}` : null;

  useEffect(() => {
    if (!checkedStorageKey) {
      setCheckedByDay(createEmptyCheckedByDay());
      return;
    }

    setCheckedByDay(parseCheckedByDay(localStorage.getItem(checkedStorageKey)));
  }, [checkedStorageKey]);

  useEffect(() => {
    if (!checkedStorageKey) return;
    localStorage.setItem(checkedStorageKey, JSON.stringify(checkedByDay));
  }, [checkedStorageKey, checkedByDay]);
  
  const selectedItem = plan?.items.find(item => item.day === selectedDay);
  const exercises = selectedItem?.exercises || [];
  const muscleGroups = selectedItem?.muscleGroups || [];
  const isRestDay = muscleGroups.includes('descanso') || muscleGroups.length === 0;
  const isToday = selectedDay === getCurrentDay();
  
  const toggleChecked = (exerciseId: string) => {
    setCheckedByDay((prev) => {
      const next = new Set(prev[selectedDay] ?? []);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }

      return {
        ...prev,
        [selectedDay]: Array.from(next),
      };
    });
  };
  
  const openRegisterModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setRegisterModalOpen(true);
  };
  
  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const videoUrl = new URL(url);
      let videoId: string | null = null;
      
      if (videoUrl.hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      } else if (videoUrl.hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.slice(1);
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch {
      return null;
    }
    return null;
  };
  
  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header with status */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {getDayLabel(getCurrentDay(), language)} — {new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{text('Entrenamiento', 'Workout')}</h1>
            </div>
          </div>
        </header>
        
        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {DAYS.map((day) => {
            const dayItem = plan?.items.find(i => i.day === day);
            const isSelected = selectedDay === day;
            const isDayToday = day === getCurrentDay();
            const dayMuscleGroups = dayItem?.muscleGroups || [];
            const isRest = dayMuscleGroups.includes('descanso') || dayMuscleGroups.length === 0;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'snap-start flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors relative min-w-[72px]',
                  isSelected 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
                  isRest && !isSelected && 'opacity-50'
                )}
              >
                {isDayToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-semaphore-green rounded-full" />
                )}
                <span className="block">{getDayLabel(day, language)}</span>
              </button>
            );
          })}
        </div>
        
        {/* Day info */}
        {!isRestDay && (
            <div className="card-clinical p-3 sm:p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{text('Grupos musculares', 'Muscle groups')}</p>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {muscleGroups.filter(g => g !== 'descanso').map(group => (
                  <Badge key={group} variant="secondary">
                    {getMuscleGroupLabel(group, language)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{text('Ejercicios', 'Exercises')}</p>
              <p className="font-medium">{exercises.length}</p>
            </div>
          </div>
        )}
        
        {/* Rest day */}
        {isRestDay && (
          <div className="card-clinical p-8 text-center">
            <p className="text-muted-foreground">{text('Dia de descanso', 'Rest day')}</p>
          </div>
        )}
        
        {/* No exercises message */}
        {!isRestDay && exercises.length === 0 && (
          <div className="card-clinical p-6 text-center space-y-3">
            <Video className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {text('No hay ejercicios configurados para este dia.', 'There are no exercises configured for this day.')}
              </p>
              <Link to="/plan">
                <Button variant="outline" size="sm">
                  {text('Configurar plan', 'Configure plan')}
                </Button>
              </Link>
            </div>
        )}
        
        {/* Exercises list with videos */}
        {exercises.length > 0 && (
          <div className="space-y-4">
            {exercises.map((exercise, i) => {
              const embedUrl = exercise.videoUrl ? getYouTubeEmbedUrl(exercise.videoUrl) : null;
              const isChecked = checkedExercises.has(exercise.id);
              
              return (
                <div 
                  key={exercise.id}
                  className={cn(
                    'card-clinical overflow-hidden animate-slide-in',
                    isChecked && 'opacity-60'
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Exercise header */}
                  <div className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-3 border-b border-border/50">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleChecked(exercise.id)}
                        className={cn(
                          'w-6 h-6 rounded border flex items-center justify-center transition-colors flex-shrink-0',
                          isChecked 
                            ? 'bg-semaphore-green border-semaphore-green' 
                            : 'border-muted-foreground/30 hover:border-muted-foreground'
                        )}
                      >
                        {isChecked && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getMuscleGroupLabel(exercise.muscleGroup, language)} · {exercise.restSeconds}s {text('descanso', 'rest')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 shrink-0 px-2.5 sm:px-3"
                      onClick={() => openRegisterModal(exercise)}
                    >
                      <ClipboardEdit className="w-4 h-4" />
                      <span className="hidden sm:inline">{text('Registrar', 'Log')}</span>
                    </Button>
                  </div>
                  
                  {/* Video embed or link */}
                  {exercise.videoUrl && (
                    <div className="aspect-video bg-muted">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={exercise.name}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <a
                          href={exercise.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                          <span>{text('Ver video externo', 'Watch external video')}</span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  {!exercise.videoUrl && (
                    <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                      <Video className="w-4 h-4" />
                      <span className="text-sm">{text('Sin video', 'No video')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Progress indicator */}
        {exercises.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {checkedExercises.size} {text('de', 'of')} {exercises.length} {text('completados', 'completed')}
          </div>
        )}
      </div>
      
      {/* Registration modal */}
      {selectedExercise && (
        <WorkoutRegistrationModal
          open={registerModalOpen}
          onOpenChange={setRegisterModalOpen}
          exercise={selectedExercise}
          muscleGroups={muscleGroups.filter(g => g !== 'descanso')}
        />
      )}
    </Layout>
  );
}
