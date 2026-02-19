import { cn } from '@/lib/utils';
import type { AntiEgoAlert } from '@/types/fitness';
import { AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AlertBannerProps {
  alert: AntiEgoAlert;
  onDismiss?: () => void;
  className?: string;
}

const iconMap = {
  stagnation: AlertTriangle,
  ego: AlertOctagon,
  overtraining: XCircle,
  blocked: XCircle,
};

export function AlertBanner({ alert, onDismiss, className }: AlertBannerProps) {
  const { text } = useLanguage();
  const Icon = iconMap[alert.type];
  
  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border animate-fade-in',
      alert.severity === 'critical' 
        ? 'bg-semaphore-red/10 border-semaphore-red/30 text-semaphore-red'
        : 'bg-semaphore-yellow/10 border-semaphore-yellow/30 text-semaphore-yellow',
      className
    )}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide">
          {alert.type === 'stagnation' && text('Estancamiento detectado', 'Stagnation detected')}
          {alert.type === 'ego' && text('Alerta anti-ego', 'Anti-ego alert')}
          {alert.type === 'overtraining' && text('Sobreentrenamiento', 'Overtraining')}
          {alert.type === 'blocked' && text('Entrenamiento bloqueado', 'Workout blocked')}
        </p>
        <p className="text-sm opacity-80">{alert.message}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
