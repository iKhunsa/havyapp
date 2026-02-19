import { useState, useMemo } from 'react';
import { useFitnessStore } from '@/stores/fitnessStore';
import { formatDate } from '@/lib/fitness-utils';
import { Scale, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
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
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeRange = 'all' | '7d' | '30d' | '90d' | 'custom';

export function WeightProgressChart() {
  const { bodyWeightLogs } = useFitnessStore();
  const { text, language } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const sortedLogs = useMemo(() => {
    return [...bodyWeightLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [bodyWeightLogs]);
  
  const filteredLogs = useMemo(() => {
    if (sortedLogs.length === 0) return [];
    
    const now = Date.now();
    let startTime: number;
    let endTime = now;
    
    switch (timeRange) {
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
        break;
    }
    
    return sortedLogs.filter(log => {
      const logTime = new Date(log.date).getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  }, [sortedLogs, timeRange, customStart, customEnd]);
  
  const chartData = useMemo(() => {
    return filteredLogs.map(log => ({
      date: formatDate(new Date(log.date), language),
      fullDate: new Date(log.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US'),
      weight: log.weight,
    }));
  }, [filteredLogs, language]);
  
  // Calculate stats for filtered range
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      return { first: 0, last: 0, change: 0, percentChange: 0, trend: 'stable' as const };
    }
    
    const first = filteredLogs[0].weight;
    const last = filteredLogs[filteredLogs.length - 1].weight;
    const change = last - first;
    const percentChange = first ? ((change / first) * 100) : 0;
    const trend = change < -0.1 ? 'down' : change > 0.1 ? 'up' : 'stable';
    
    return { first, last, change, percentChange, trend };
  }, [filteredLogs]);
  
  if (bodyWeightLogs.length === 0) {
    return (
      <div className="card-clinical p-8 text-center">
        <Scale className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">{text('No hay datos de peso registrados.', 'No weight data recorded.')}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {text('Registra tu peso en la seccion "Peso" para ver tu progreso.', 'Log your weight in the "Weight" section to see your progress.')}
        </p>
      </div>
    );
  }
  
  return (
    <div className="card-clinical p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{text('Progreso de peso', 'Weight progress')}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {stats.trend === 'down' && <TrendingDown className="w-4 h-4 text-semaphore-green" />}
          {stats.trend === 'up' && <TrendingUp className="w-4 h-4 text-semaphore-red" />}
          {stats.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
          <span className={`font-mono text-sm ${
            stats.percentChange < 0 ? 'text-semaphore-green' : 
            stats.percentChange > 0 ? 'text-semaphore-red' : ''
          }`}>
            {stats.percentChange > 0 ? '+' : ''}{stats.percentChange.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Time range selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[120px]">
          <Label className="text-xs text-muted-foreground">{text('Rango', 'Range')}</Label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">{text('Todo', 'All')}</SelectItem>
               <SelectItem value="7d">{text('7 dias', '7 days')}</SelectItem>
               <SelectItem value="30d">{text('30 dias', '30 days')}</SelectItem>
               <SelectItem value="90d">{text('90 dias', '90 days')}</SelectItem>
               <SelectItem value="custom">{text('Personalizado', 'Custom')}</SelectItem>
             </SelectContent>
           </Select>
         </div>
        
        {timeRange === 'custom' && (
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
      
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{text('Inicial', 'Initial')}</p>
          <p className="font-mono font-bold">{stats.first.toFixed(1)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{text('Actual', 'Current')}</p>
          <p className="font-mono font-bold">{stats.last.toFixed(1)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{text('Cambio', 'Change')}</p>
          <p className={`font-mono font-bold ${
            stats.change < 0 ? 'text-semaphore-green' : 
            stats.change > 0 ? 'text-semaphore-red' : ''
          }`}>
            {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} kg
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {chartData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
               formatter={(value: number) => [`${value.toFixed(1)} kg`, text('Peso', 'Weight')]}
               labelFormatter={(label) => label}
             />
            <ReferenceLine 
              y={stats.first} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5" 
              strokeOpacity={0.5}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          {text('Se necesitan al menos 2 registros para mostrar la grafica', 'At least 2 records are needed to show the chart')}
        </div>
      )}
    </div>
  );
}
