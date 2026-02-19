import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useData } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dumbbell, Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, getDayLabel, getMuscleGroupLabel } from '@/lib/fitness-utils';
import type { WorkoutLog, WorkoutSet, MuscleGroup } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeFilter = 'all' | '7d' | '30d' | '90d' | 'month' | 'year' | 'custom';

const getLocalDateInputValue = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function VolumeControl() {
  const { text, language } = useLanguage();
  const {
    workoutLogs: dataWorkoutLogs,
    weeklyPlans,
    updateWorkoutLog,
    deleteWorkoutLog,
    addWorkoutLog,
  } = useData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Edit state
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [editSets, setEditSets] = useState<WorkoutSet[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [manualSets, setManualSets] = useState<WorkoutSet[]>([
    { weight: 0, reps: 0, tempo: '2-0-2', toFailure: false },
  ]);
  const [manualNotes, setManualNotes] = useState('');
  const [manualDate, setManualDate] = useState(() => getLocalDateInputValue());
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const plan = useMemo(() => weeklyPlans.find((item) => item.isActive) ?? weeklyPlans[0], [weeklyPlans]);

  const sortedLogs = useMemo(() => {
    return [...dataWorkoutLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [dataWorkoutLogs]);
  
  const filteredLogs = useMemo(() => {
    if (sortedLogs.length === 0) return [];
    
    const now = new Date();
    let startTime: number;
    let endTime = now.getTime();
    
    switch (timeFilter) {
      case '7d':
        startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        startTime = now.getTime() - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case 'year':
        startTime = new Date(now.getFullYear(), 0, 1).getTime();
        break;
      case 'custom':
        startTime = customStart ? new Date(customStart).getTime() : 0;
        endTime = customEnd ? new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 : now.getTime();
        break;
      case 'all':
      default:
        startTime = 0;
        endTime = Number.POSITIVE_INFINITY;
        break;
    }
    
    return sortedLogs.filter(log => {
      const logTime = new Date(log.date).getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  }, [sortedLogs, timeFilter, customStart, customEnd]);
  
  // Group logs by date
  const logsByDate = useMemo(() => {
    const groups: Record<string, WorkoutLog[]> = {};
    filteredLogs.forEach(log => {
      const logDate = new Date(log.date);
      const dateKey = getLocalDateInputValue(logDate);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const planExercises = useMemo(() => {
    if (!plan) return [];

    return plan.items.flatMap((item) =>
      item.exercises.map((exercise) => ({
        ...exercise,
        day: item.day,
        muscleGroups: (item.muscleGroups.filter((group) => group !== 'descanso').length > 0
          ? item.muscleGroups.filter((group) => group !== 'descanso')
          : [exercise.muscleGroup]) as MuscleGroup[],
      }))
    );
  }, [plan]);

  const selectedExercise = useMemo(
    () => planExercises.find((exercise) => exercise.id === selectedExerciseId),
    [planExercises, selectedExerciseId]
  );
  
  const startEdit = (log: WorkoutLog) => {
    setEditingLog(log);
    setEditSets([...log.sets]);
    setEditNotes(log.notes || '');
  };
  
  const cancelEdit = () => {
    setEditingLog(null);
    setEditSets([]);
    setEditNotes('');
  };
  
  const updateEditSet = (index: number, field: keyof WorkoutSet, value: number | string | boolean) => {
    setEditSets(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ));
  };
  
  const saveEdit = async () => {
    if (!editingLog) return;
    
    const validSets = editSets.filter(s => s.weight > 0 && s.reps > 0);
    if (validSets.length === 0) {
      toast.error(text('Necesitas al menos una serie valida', 'You need at least one valid set'));
      return;
    }
    
    try {
      await updateWorkoutLog(editingLog.id, {
        sets: validSets,
        notes: editNotes.trim() || undefined,
      });
    } catch {
      toast.error(text('No se pudo actualizar el registro', 'Could not update record'));
      return;
    }
    
    setEditingLog(null);
    setEditSets([]);
    setEditNotes('');
    toast.success(text('Registro actualizado', 'Record updated'));
  };
  
  const confirmDelete = async (logId: string) => {
    try {
      await deleteWorkoutLog(logId);
      setDeleteConfirmId(null);
      toast.success(text('Registro eliminado', 'Record deleted'));
    } catch {
      toast.error(text('No se pudo eliminar el registro', 'Could not delete record'));
    }
  };

  const updateManualSet = (index: number, field: keyof WorkoutSet, value: number | string | boolean) => {
    setManualSets((prev) => prev.map((set, i) => (i === index ? { ...set, [field]: value } : set)));
  };

  const addManualSet = () => {
    setManualSets((prev) => [...prev, { weight: 0, reps: 0, tempo: '2-0-2', toFailure: false }]);
  };

  const removeManualSet = (index: number) => {
    setManualSets((prev) => prev.filter((_, i) => i !== index));
  };

  const resetManualDialog = () => {
    setSelectedExerciseId('');
    setManualSets([{ weight: 0, reps: 0, tempo: '2-0-2', toFailure: false }]);
    setManualNotes('');
    setManualDate(getLocalDateInputValue());
    setIsManualDialogOpen(false);
  };

  const saveManualExercise = async () => {
    if (!selectedExercise) {
      toast.error(text('Selecciona un ejercicio', 'Select an exercise'));
      return;
    }

    const parsedManualDate = manualDate ? new Date(`${manualDate}T12:00:00`) : new Date();
    if (Number.isNaN(parsedManualDate.getTime())) {
      toast.error(text('Fecha invalida', 'Invalid date'));
      return;
    }

    const validSets = manualSets.filter((set) => set.weight > 0 && set.reps > 0);
    if (validSets.length === 0) {
      toast.error(text('Necesitas al menos una serie valida', 'You need at least one valid set'));
      return;
    }

    const manualLog: Omit<WorkoutLog, 'id'> = {
      date: parsedManualDate,
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      muscleGroups: selectedExercise.muscleGroups,
      sets: validSets,
      suggestedRest: selectedExercise.restSeconds,
      notes: manualNotes.trim() || undefined,
    };

    try {
      const created = await addWorkoutLog(manualLog);
      setExpandedId(created.id);
    } catch {
      toast.error(text('No se pudo guardar el ejercicio', 'Could not save exercise'));
      return;
    }

    setTimeFilter('all');
    toast.success(text('Ejercicio agregado al historial', 'Exercise added to history'));
    resetManualDialog();
  };
  
  // Calculate volume stats
  const totalSets = filteredLogs.reduce((acc, log) => acc + log.sets.length, 0);
  const totalVolume = filteredLogs.reduce((acc, log) => {
    return acc + log.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0);
  }, 0);
  
  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Control', 'Tracking')}</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{text('Volumen por musculo', 'Volume by muscle')}</h1>
        </header>

        <div className="flex justify-stretch sm:justify-end">
          <Button
            onClick={() => setIsManualDialogOpen(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Dumbbell className="w-4 h-4" />
            {text('Agregar ejercicio manual', 'Add exercise manually')}
          </Button>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card-clinical p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{text('Series totales', 'Total sets')}</p>
            <p className="text-2xl font-bold">{totalSets}</p>
          </div>
          <div className="card-clinical p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{text('Volumen total', 'Total volume')}</p>
            <p className="text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}<span className="text-sm text-muted-foreground ml-1">ton</span></p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">{text('Filtrar por tiempo', 'Filter by time')}</Label>
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{text('Todo', 'All')}</SelectItem>
                <SelectItem value="7d">{text('Ultimos 7 dias', 'Last 7 days')}</SelectItem>
                <SelectItem value="30d">{text('Ultimos 30 dias', 'Last 30 days')}</SelectItem>
                <SelectItem value="90d">{text('Ultimos 90 dias', 'Last 90 days')}</SelectItem>
                <SelectItem value="month">{text('Mes actual', 'Current month')}</SelectItem>
                <SelectItem value="year">{text('Ano actual', 'Current year')}</SelectItem>
                <SelectItem value="custom">{text('Rango personalizado', 'Custom range')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {timeFilter === 'custom' && (
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
        
        {/* History grouped by date */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {text('Historial', 'History')} ({filteredLogs.length} {text('registros', 'records')})
          </h2>
          
          {Object.keys(logsByDate).length === 0 ? (
            <div className="card-clinical p-8 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">{text('No hay registros en este periodo.', 'No records in this period.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(logsByDate).map(([dateKey, logs]) => (
                <div key={dateKey} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {new Date(dateKey).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </h3>
                  
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id;
                    const totalVolume = log.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
                    
                    return (
                      <div key={log.id} className="card-clinical overflow-hidden">
                        <div 
                          className="p-3 flex items-center justify-between gap-2 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{log.exerciseName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {text('Dia', 'Day')}: {getDayLabel(([
                                'domingo',
                                'lunes',
                                'martes',
                                'miercoles',
                                'jueves',
                                'viernes',
                                'sabado',
                              ][new Date(log.date).getDay()] as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'), language)}
                            </p>
                            <div className="flex gap-1 flex-wrap mt-1">
                              {(log.muscleGroups || []).map(group => (
                                <Badge key={group} variant="secondary" className="text-xs">
                                  {getMuscleGroupLabel(group, language)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{log.sets.length} {text('series', 'sets')}</p>
                            <p className="font-mono">{totalVolume.toFixed(0)} kg</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-border/50 p-3 space-y-3 bg-muted/20">
                            {/* Sets detail */}
                            <div className="space-y-1">
                              {log.sets.map((set, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{text('Serie', 'Set')} {i + 1}</span>
                                  <span className="font-mono">
                                    {set.weight}kg × {set.reps} ({set.tempo})
                                    {set.toFailure && <span className="text-destructive ml-1">F</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {log.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                "{log.notes}"
                              </p>
                            )}
                            
                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="flex-1 gap-1"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   startEdit(log);
                                 }}
                              >
                                <Pencil className="w-3 h-3" />
                                {text('Editar', 'Edit')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(log.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      
      {/* Edit dialog */}
      <Dialog open={!!editingLog} onOpenChange={() => cancelEdit()}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{text('Editar', 'Edit')} {editingLog?.exerciseName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {editSets.map((set, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{text('Serie', 'Set')} {index + 1}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{text('Peso', 'Weight')}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={set.weight || ''}
                      onChange={(e) => updateEditSet(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{text('Reps', 'Reps')}</Label>
                    <Input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateEditSet(index, 'reps', parseInt(e.target.value) || 0)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tempo</Label>
                    <Input
                      type="text"
                      value={set.tempo}
                      onChange={(e) => updateEditSet(index, 'tempo', e.target.value)}
                      className="h-9 text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">{text('Notas', 'Notes')}</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                 placeholder={text('Notas opcionales...', 'Optional notes...')}
               />
             </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                {text('Cancelar', 'Cancel')}
              </Button>
               <Button className="flex-1 gap-1" onClick={() => void saveEdit()}>
                <Check className="w-4 h-4" />
                {text('Guardar', 'Save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>{text('Eliminar registro?', 'Delete record?')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {text('Esta accion no se puede deshacer.', 'This action cannot be undone.')}
          </p>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {text('Cancelar', 'Cancel')}
            </Button>
             <Button variant="destructive" onClick={() => deleteConfirmId && void confirmDelete(deleteConfirmId)}>
              {text('Eliminar', 'Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManualDialogOpen} onOpenChange={(open) => (open ? setIsManualDialogOpen(true) : resetManualDialog())}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{text('Agregar ejercicio manual', 'Add exercise manually')}</DialogTitle>
          </DialogHeader>

          {planExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text('Primero agrega ejercicios en tu plan semanal.', 'First add exercises in your weekly plan.')}
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{text('Ejercicio', 'Exercise')}</Label>
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
                    <SelectValue placeholder={text('Selecciona un ejercicio', 'Select an exercise')} />
                  </SelectTrigger>
                  <SelectContent>
                    {planExercises.map((exercise) => (
                      <SelectItem key={`${exercise.id}-${exercise.day}`} value={exercise.id}>
                        {exercise.name} ({getDayLabel(exercise.day, language)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{text('Fecha', 'Date')}</Label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="h-9"
                />
              </div>

              {manualSets.map((set, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{text('Serie', 'Set')} {index + 1}</span>
                    {manualSets.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeManualSet(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{text('Peso', 'Weight')}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={set.weight || ''}
                        onChange={(e) => updateManualSet(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{text('Reps', 'Reps')}</Label>
                      <Input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateManualSet(index, 'reps', parseInt(e.target.value) || 0)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tempo</Label>
                      <Input
                        type="text"
                        value={set.tempo}
                        onChange={(e) => updateManualSet(index, 'tempo', e.target.value)}
                        className="h-9 text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addManualSet}>
                {text('Agregar serie', 'Add set')}
              </Button>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{text('Notas', 'Notes')}</Label>
                <Input
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder={text('Notas opcionales...', 'Optional notes...')}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetManualDialog}>
                  {text('Cancelar', 'Cancel')}
                </Button>
                <Button className="flex-1" onClick={() => void saveManualExercise()}>
                  {text('Guardar', 'Save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
