import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useData } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Scale, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/fitness-utils';
import type { BodyWeightLog } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { getErrorFeedback } from '@/lib/app-error';

type TimeFilter = 'all' | '7d' | '30d' | '90d' | 'month' | 'year' | 'custom';

const getLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BodyWeight() {
  const { text, language } = useLanguage();
  const {
    bodyWeightLogs: dataWeightLogs,
    addBodyWeightLog,
    updateBodyWeightLog,
    deleteBodyWeightLog,
  } = useData();
  const [weight, setWeight] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const sortedLogs = useMemo(() => {
    return [...dataWeightLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [dataWeightLogs]);
  
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
        break;
    }
    
    return sortedLogs.filter(log => {
      const logTime = new Date(log.date).getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  }, [sortedLogs, timeFilter, customStart, customEnd]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error(text('Ingresa un peso valido', 'Enter a valid weight'));
      return;
    }
    
    try {
      const created = await addBodyWeightLog({
        date: new Date(),
        weight: weightValue,
      });

      if (!created) {
        toast.error(text('No se pudo registrar el peso. Verifica sesion y backend.', 'Could not log weight. Check session and backend.'));
        return;
      }

      setWeight('');
      toast.success(text('Peso registrado', 'Weight logged'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo registrar el peso.', 'Could not log weight.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
    }
  };
  
  const startEdit = (log: BodyWeightLog) => {
    setEditingId(log.id);
    setEditWeight(log.weight.toString());
    setEditDate(getLocalDateInputValue(new Date(log.date)));
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditWeight('');
    setEditDate('');
  };
  
  const saveEdit = async (logId: string) => {
    const weightValue = parseFloat(editWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error(text('Ingresa un peso valido', 'Enter a valid weight'));
      return;
    }

    const parsedDate = editDate ? new Date(`${editDate}T12:00:00`) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      toast.error(text('Selecciona una fecha valida', 'Select a valid date'));
      return;
    }
    
    try {
      await updateBodyWeightLog(logId, { weight: weightValue, date: parsedDate });
      setEditingId(null);
      setEditWeight('');
      setEditDate('');
      toast.success(text('Peso actualizado', 'Weight updated'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo actualizar el peso.', 'Could not update weight.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
    }
  };
  
  const confirmDelete = async (logId: string) => {
    try {
      await deleteBodyWeightLog(logId);
      setDeleteConfirmId(null);
      toast.success(text('Registro eliminado', 'Record deleted'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo eliminar el registro.', 'Could not delete record.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
    }
  };
  
  // Calculate stats
  const latestWeight = filteredLogs[0]?.weight || 0;
  const firstWeight = filteredLogs[filteredLogs.length - 1]?.weight || latestWeight;
  const totalChange = latestWeight - firstWeight;
  const percentChange = firstWeight ? ((totalChange / firstWeight) * 100) : 0;
  
  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Control', 'Tracking')}</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{text('Peso corporal', 'Body weight')}</h1>
        </header>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card-clinical p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{text('Peso actual', 'Current weight')}</p>
            <p className="text-2xl font-bold">{latestWeight.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">kg</span></p>
          </div>
          <div className="card-clinical p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{text('Cambio', 'Change')}</p>
            <p className={`text-2xl font-bold ${totalChange < 0 ? 'text-semaphore-green' : totalChange > 0 ? 'text-semaphore-red' : ''}`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">kg</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
            </p>
          </div>
        </div>
        
        {/* Register weight form */}
        <form onSubmit={handleSubmit} className="card-clinical p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Scale className="w-4 h-4" />
            <span>{text('Registrar peso de hoy', "Log today's weight")}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="weight" className="sr-only">{text('Peso (kg)', 'Weight (kg)')}</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={text('Ej: 75.5', 'Ex: 75.5')}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button type="submit" className="sm:w-auto w-full gap-2" size="sm">
              <Plus className="w-5 h-5" />
              <span>{text('Anadir', 'Add')}</span>
            </Button>
          </div>
        </form>
        
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
        
        {/* History */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {text('Historial', 'History')} ({filteredLogs.length} {text('registros', 'records')})
          </h2>
          
          {filteredLogs.length === 0 ? (
            <div className="card-clinical p-8 text-center">
              <Scale className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">{text('No hay registros en este periodo.', 'No records in this period.')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => {
                const prevLog = filteredLogs[index + 1];
                const diff = prevLog ? log.weight - prevLog.weight : 0;
                const isEditing = editingId === log.id;
                
                return (
                  <div key={log.id} className="card-clinical p-3 flex items-center justify-between gap-2">
                    {isEditing ? (
                      <>
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-24 h-8"
                            autoFocus
                          />
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-40 h-8"
                          />
                          <span className="text-sm text-muted-foreground">kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-semaphore-green"
                            onClick={() => saveEdit(log.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={cancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-mono text-lg">{log.weight.toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">
                             {formatDate(new Date(log.date), language)}
                           </p>
                        </div>
                        {diff !== 0 && (
                          <span className={`text-sm font-mono ${diff < 0 ? 'text-semaphore-green' : 'text-semaphore-red'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => startEdit(log)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(log.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      
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
            <Button variant="destructive" onClick={() => deleteConfirmId && confirmDelete(deleteConfirmId)}>
              {text('Eliminar', 'Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
