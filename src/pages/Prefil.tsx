import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useData } from '@/hooks/useData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet } from 'lucide-react';
import type { BodyWeightLog, WorkoutLog } from '@/types/fitness';
import { toast } from 'sonner';
import { getErrorFeedback } from '@/lib/app-error';

const toCsvValue = (value: string | number) => {
  const raw = String(value ?? '');
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

const buildWeightCsv = (logs: BodyWeightLog[]) => {
  const rows = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => [
      new Date(log.date).toISOString(),
      log.weight,
    ]);

  const header = ['date_iso', 'weight_kg'];
  return [header, ...rows].map((row) => row.map((item) => toCsvValue(item)).join(',')).join('\n');
};

const buildWorkoutCsv = (logs: WorkoutLog[]) => {
  const rows = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .flatMap((log) =>
      log.sets.map((set, index) => [
        new Date(log.date).toISOString(),
        log.exerciseId,
        log.exerciseName,
        (log.muscleGroups ?? []).join('|'),
        index + 1,
        set.weight,
        set.reps,
        set.tempo,
        set.toFailure ? 'true' : 'false',
        log.suggestedRest,
        log.notes ?? '',
      ])
    );

  const header = [
    'date_iso',
    'exercise_id',
    'exercise_name',
    'muscle_groups',
    'set_number',
    'weight_kg',
    'reps',
    'tempo',
    'to_failure',
    'suggested_rest_seconds',
    'notes',
  ];

  return [header, ...rows].map((row) => row.map((item) => toCsvValue(item)).join(',')).join('\n');
};

const downloadCsv = (fileName: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default function Prefil() {
  const { bodyWeightLogs, workoutLogs } = useData();
  const { user, signOut } = useAuth();
  const { text, language, toggleLanguage } = useLanguage();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rangeStart = useMemo(() => (dateFrom ? new Date(`${dateFrom}T00:00:00`) : null), [dateFrom]);
  const rangeEnd = useMemo(() => (dateTo ? new Date(`${dateTo}T23:59:59`) : null), [dateTo]);

  const isRangeValid = useMemo(() => {
    if (!rangeStart || !rangeEnd) return true;
    return rangeStart.getTime() <= rangeEnd.getTime();
  }, [rangeStart, rangeEnd]);

  const filteredWeightLogs = useMemo(
    () => bodyWeightLogs.filter((log) => {
      const timestamp = new Date(log.date).getTime();
      if (rangeStart && timestamp < rangeStart.getTime()) return false;
      if (rangeEnd && timestamp > rangeEnd.getTime()) return false;
      return true;
    }),
    [bodyWeightLogs, rangeStart, rangeEnd]
  );

  const filteredWorkoutLogs = useMemo(
    () => workoutLogs.filter((log) => {
      const timestamp = new Date(log.date).getTime();
      if (rangeStart && timestamp < rangeStart.getTime()) return false;
      if (rangeEnd && timestamp > rangeEnd.getTime()) return false;
      return true;
    }),
    [workoutLogs, rangeStart, rangeEnd]
  );

  const exportWeightHistory = () => {
    const csv = buildWeightCsv(filteredWeightLogs);
    downloadCsv('historial_peso.csv', csv);
  };

  const exportWorkoutHistory = () => {
    const csv = buildWorkoutCsv(filteredWorkoutLogs);
    downloadCsv('historial_ejercicios.csv', csv);
  };

  const clearExportRange = () => {
    setDateFrom('');
    setDateTo('');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(text('Sesion cerrada', 'Signed out'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo cerrar la sesion.', 'Could not sign out.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Exportacion', 'Export')}</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{text('Prefil', 'Profile')}</h1>
          <p className="text-sm text-muted-foreground">
            {text('Descarga tu historial en formato CSV.', 'Download your history in CSV format.')}
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="card-clinical p-4 space-y-3 md:col-span-2">
            <h2 className="font-medium">{text('Cuenta y preferencias', 'Account and preferences')}</h2>
            <p className="text-sm text-muted-foreground">
              {text('Correo', 'Email')}: {user?.email ?? text('No disponible', 'Not available')}
            </p>
            <Button variant="outline" onClick={toggleLanguage} className="gap-2 w-full sm:w-auto">
              {text('Idioma', 'Language')}: {language.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={() => void handleSignOut()} className="w-full sm:w-auto">
              {text('Cerrar sesion', 'Sign out')}
            </Button>
          </div>

          <div className="card-clinical p-4 space-y-3 md:col-span-2">
            <h2 className="font-medium">{text('Rango de exportacion', 'Export range')}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{text('Desde', 'From')}</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{text('Hasta', 'To')}</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearExportRange}>
                {text('Quitar rango y actualizar', 'Clear range and refresh')}
              </Button>
            </div>
            {!isRangeValid && (
              <p className="text-xs text-destructive">
                {text('La fecha inicial no puede ser mayor que la final.', 'Start date cannot be after end date.')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {text('Si no eliges fechas, se exporta todo el historial.', 'If you do not set dates, the full history is exported.')}
            </p>
          </div>

          <div className="card-clinical p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <h2 className="font-medium">{text('Historial de peso', 'Weight history')}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredWeightLogs.length} {text('registros disponibles', 'records available')}
            </p>
            <Button onClick={exportWeightHistory} className="w-full gap-2" disabled={filteredWeightLogs.length === 0 || !isRangeValid}>
              <Download className="w-4 h-4" />
              {text('Descargar CSV de peso', 'Download weight CSV')}
            </Button>
          </div>

          <div className="card-clinical p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <h2 className="font-medium">{text('Historial de ejercicios', 'Exercise history')}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredWorkoutLogs.length} {text('registros disponibles', 'records available')}
            </p>
            <Button onClick={exportWorkoutHistory} className="w-full gap-2" disabled={filteredWorkoutLogs.length === 0 || !isRangeValid}>
              <Download className="w-4 h-4" />
              {text('Descargar CSV de ejercicios', 'Download exercise CSV')}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
