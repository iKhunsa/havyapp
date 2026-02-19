import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

const statusColors = {
  normal: 'text-foreground',
  warning: 'text-semaphore-yellow',
  danger: 'text-semaphore-red',
  success: 'text-semaphore-green',
};

export function MetricCard({ 
  label, 
  value, 
  unit, 
  status = 'normal',
  trend,
  className 
}: MetricCardProps) {
  return (
    <div className={cn(
      'card-clinical p-4 space-y-2',
      className
    )}>
      <p className="metric-label">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn('metric-value', statusColors[status])}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
        {trend && (
          <span className={cn(
            'ml-2 text-xs',
            trend === 'up' && 'text-semaphore-green',
            trend === 'down' && 'text-semaphore-red',
            trend === 'stable' && 'text-muted-foreground',
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
