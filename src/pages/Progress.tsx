import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useData } from '@/hooks/useData';
import { MetricCard } from '@/components/MetricCard';
import { WeightProgressChart } from '@/components/WeightProgressChart';
import { formatDate } from '@/lib/fitness-utils';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeRange = 'all' | '7d' | '30d' | '90d' | 'custom';

export default function Progress() {
  const { workoutLogs: dataWorkoutLogs, weeklyPlans } = useData();
  const { text, language } = useLanguage();
  const [exerciseTimeRange, setExerciseTimeRange] = useState<TimeRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const activePlan = useMemo(() => {
    return weeklyPlans.find((plan) => plan.isActive) ?? weeklyPlans[0];
  }, [weeklyPlans]);

  const planExercises = useMemo(() => {
    if (!activePlan) return [];
    const seen = new Set<string>();

    return activePlan.items.flatMap((item) =>
      item.exercises.filter((exercise) => {
        const key = `${exercise.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
    );
  }, [activePlan]);
  
  // Filter workout logs by time range for exercises
  const filteredWorkoutLogs = useMemo(() => {
    const now = Date.now();
    let startTime: number;
    let endTime = now;
    
    switch (exerciseTimeRange) {
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        startTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'custom':
        startTime = customStart ? new Date(customStart).getTime() : 0;
        endTime = customEnd ? new Date(customEnd).getTime() : now;
        break;
      case 'all':
      default:
        startTime = 0;
        endTime = Number.POSITIVE_INFINITY;
        break;
    }
    
    return dataWorkoutLogs.filter(log => {
      const logTime = new Date(log.date).getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  }, [dataWorkoutLogs, exerciseTimeRange, customStart, customEnd]);
  
  // Calculate progress data from filtered logs
  const exerciseProgress = useMemo(() => {
    return filteredWorkoutLogs.reduce((acc, log) => {
      if (!acc[log.exerciseId]) {
        acc[log.exerciseId] = {
          name: log.exerciseName,
          points: [],
        };
      }
      const maxWeight = Math.max(...log.sets.map(s => s.weight));
      const totalVolume = log.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      
      acc[log.exerciseId].points.push({
        date: formatDate(new Date(log.date), language),
        fullDate: typeof log.date === 'string' ? log.date : new Date(log.date).toISOString(),
        weight: maxWeight,
        volume: totalVolume
      });
      return acc;
    }, {} as Record<string, { name: string; points: Array<{ date: string; fullDate: string; weight: number; volume: number }> }>);
  }, [filteredWorkoutLogs, language]);
  
  // Sort each exercise's data by date
  const sortedExerciseProgress = useMemo(() => {
    const sorted: Record<string, { name: string; points: Array<{ date: string; fullDate: string; weight: number; volume: number }> }> = {};
    Object.entries(exerciseProgress).forEach(([id, data]) => {
      sorted[id] = {
        name: data.name,
        points: [...data.points].sort((a, b) => 
        new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
        ),
      };
    });
    return sorted;
  }, [exerciseProgress]);

  const exerciseCards = useMemo(() => {
    return planExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      points: sortedExerciseProgress[exercise.id]?.points ?? [],
    }));
  }, [planExercises, sortedExerciseProgress]);
  
  // Weekly workout count
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentLogs = dataWorkoutLogs.filter(l => new Date(l.date).getTime() > thirtyDaysAgo);
  const weeklyWorkouts = dataWorkoutLogs.filter(l => new Date(l.date).getTime() > sevenDaysAgo).length;
  
  // Total volume this week
  const weeklyVolume = recentLogs
    .filter(l => new Date(l.date).getTime() > sevenDaysAgo)
    .reduce((sum, log) => 
      sum + log.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
    );
  
  // Get trend for an exercise
  const getTrend = (exerciseId: string): 'up' | 'down' | 'stable' => {
    const data = sortedExerciseProgress[exerciseId]?.points;
    if (!data || data.length < 2) return 'stable';
    
    const recent = data[data.length - 1].weight;
    const previous = data[data.length - 2].weight;
    
    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  };
  
  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Analisis', 'Analysis')}</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{text('Progreso real', 'Real progress')}</h1>
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" variant="outline"><Link to="/weight">{text('Peso', 'Weight')}</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/volume">{text('Volumen', 'Volume')}</Link></Button>
          </div>
        </header>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard 
             label={text('Entrenos esta semana', 'Workouts this week')}
             value={weeklyWorkouts}
             unit={text('sesiones', 'sessions')}
           />
           <MetricCard 
             label={text('Volumen semanal', 'Weekly volume')}
             value={(weeklyVolume / 1000).toFixed(1)}
             unit={text('toneladas', 'tons')}
           />
        </div>
        
        {/* Weight progress chart */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {text('Peso corporal', 'Body weight')}
          </h2>
          <WeightProgressChart />
        </section>
        
        
        {/* Exercise progress */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
               {text('Progreso por ejercicio', 'Progress by exercise')}
             </h2>
          </div>
          
          {/* Time range filter */}
          <div className="card-clinical p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[120px]">
                 <Label className="text-xs text-muted-foreground">{text('Rango de tiempo', 'Time range')}</Label>
                <Select value={exerciseTimeRange} onValueChange={(v) => setExerciseTimeRange(v as TimeRange)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                     <SelectItem value="all">{text('Todo', 'All')}</SelectItem>
                     <SelectItem value="7d">{text('7 dias', '7 days')}</SelectItem>
                     <SelectItem value="30d">{text('30 dias', '30 days')}</SelectItem>
                     <SelectItem value="90d">{text('90 dias', '90 days')}</SelectItem>
                     <SelectItem value="custom">{text('Personalizado', 'Custom')}</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              
              {exerciseTimeRange === 'custom' && (
                <>
                  <div className="flex-1 min-w-[120px]">
                     <Label className="text-xs text-muted-foreground">{text('Desde', 'From')}</Label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                     <Label className="text-xs text-muted-foreground">{text('Hasta', 'To')}</Label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
               {exerciseCards.length} {text('ejercicios del plan', 'plan exercises')} · {filteredWorkoutLogs.length} {text('registros', 'records')}
              </p>
           </div>

          {exerciseCards.length === 0 ? (
            <div className="card-clinical p-8 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {text('No hay ejercicios configurados en el plan activo.', 'No exercises configured in the active plan.')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {text('Ve a Plan semanal y agrega ejercicios para ver su progreso.', 'Go to Weekly plan and add exercises to see their progress.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exerciseCards.map((exercise) => {
                const trend = getTrend(exercise.id);
                const latestWeight = exercise.points[exercise.points.length - 1]?.weight || 0;
                const firstWeight = exercise.points[0]?.weight || 0;
                const change = latestWeight - firstWeight;
                const percentChange = firstWeight ? ((change / firstWeight) * 100) : 0;

                return (
                  <div key={exercise.id} className="card-clinical p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">{exercise.points.length} {text('registros', 'records')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{latestWeight}kg</span>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-semaphore-green" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-semaphore-red" />}
                        {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">{text('Inicial', 'Initial')}</p>
                        <p className="font-mono text-sm font-bold">{firstWeight}kg</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">{text('Actual', 'Current')}</p>
                        <p className="font-mono text-sm font-bold">{latestWeight}kg</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">{text('Cambio', 'Change')}</p>
                        <p className={`font-mono text-sm font-bold ${
                          change > 0 ? 'text-semaphore-green' :
                          change < 0 ? 'text-semaphore-red' : ''
                        }`}>
                          {change > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {exercise.points.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={exercise.points}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={9}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={9}
                            domain={['dataMin - 2', 'dataMax + 2']}
                            tickLine={false}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number) => [`${value}kg`, text('Peso', 'Weight')]}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 2 }}
                            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                        {text('Se necesitan al menos 2 registros para graficar este ejercicio.', 'At least 2 records are needed to chart this exercise.')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {exerciseCards.length > 0 && filteredWorkoutLogs.length === 0 && (
            <div className="card-clinical p-8 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {text('No hay datos en el rango seleccionado.', 'No data in the selected range.')}
               </p>
               <p className="text-xs text-muted-foreground mt-2">
                  {text('Prueba con un rango mas amplio o registra entrenamientos.', 'Try a wider range or log workouts.')}
                </p>
             </div>
          )}
        </section>
        
        {/* Info */}
        <div className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-lg">
          <p>{text('El progreso real se mide en:', 'Real progress is measured by:')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>{text('Aumento de peso con mismo numero de reps', 'Higher weight with same reps')}</li>
            <li>{text('Aumento de reps con mismo peso', 'More reps with same weight')}</li>
            <li>{text('Volumen total (peso x reps) semanal', 'Total weekly volume (weight x reps)')}</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
