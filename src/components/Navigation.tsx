import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Dumbbell, 
  TrendingUp, 
  Apple,
  Scale,
  BarChart3,
  ChevronDown,
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { getErrorFeedback } from '@/lib/app-error';

export function Navigation() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { text } = useLanguage();
  const isProgressSection = ['/progress', '/volume', '/weight'].includes(location.pathname);
  const [isProgressExpanded, setIsProgressExpanded] = useState(isProgressSection);

  useEffect(() => {
    if (isProgressSection) {
      setIsProgressExpanded(true);
    }
  }, [isProgressSection]);

  const navItems = [
    { path: '/', label: text('Entreno', 'Workout'), icon: Dumbbell },
    { path: '/plan', label: text('Plan', 'Plan'), icon: Calendar },
    { path: '/nutrition', label: text('Nutricion', 'Nutrition'), icon: Apple },
    {
      path: '/progress',
      label: text('Progreso', 'Progress'),
      icon: TrendingUp,
      children: [
        { path: '/weight', label: text('Peso', 'Weight'), icon: Scale },
        { path: '/volume', label: text('Volumen', 'Volume'), icon: BarChart3 },
      ],
    },
  ];

  const mobileNavItems = useMemo(
    () => [
      { path: '/', label: text('Entreno', 'Workout'), icon: Dumbbell },
      { path: '/plan', label: text('Plan', 'Plan'), icon: Calendar },
      { path: '/nutrition', label: text('Nutricion', 'Nutrition'), icon: Apple },
      { path: '/progress', label: text('Progreso', 'Progress'), icon: TrendingUp },
      { path: '/prefil', label: text('Perfil', 'Profile'), icon: UserCircle },
    ],
    [text],
  );
  
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur border-t border-sidebar-border md:relative md:border-t-0 md:border-r">
      <div className="hidden md:flex md:flex-col md:h-screen md:w-24 lg:w-56">
        <div className="hidden md:flex items-center justify-center lg:justify-start gap-3 h-16 border-b border-sidebar-border px-4">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-foreground" />
          </div>
          <span className="hidden lg:block font-semibold text-sm tracking-wide">ANTIEGO</span>
        </div>
        
        <div className="flex md:flex-col flex-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto py-1 md:py-4 gap-1 px-2 md:px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const hasChildren = !!item.children?.length;
            const showChildren = hasChildren && isProgressExpanded;

            return (
              <Fragment key={item.path}>
                {hasChildren ? (
                  <div
                    className={cn(
                      'flex items-center rounded-md transition-colors',
                      'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsProgressExpanded(true)}
                      className="flex flex-1 items-center justify-center lg:justify-start gap-3 px-3 py-3"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="hidden lg:block text-sm">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setIsProgressExpanded((prev) => !prev);
                      }}
                      className="hidden lg:flex items-center justify-center px-2 py-2 mr-2 rounded hover:bg-sidebar-accent"
                      aria-label={text('Expandir progreso', 'Toggle progress submenu')}
                    >
                      <ChevronDown className={cn('w-4 h-4 transition-transform', isProgressExpanded && 'rotate-180')} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-md transition-colors',
                      'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:block text-sm">{item.label}</span>
                  </Link>
                )}

                {showChildren && item.children?.map((child) => {
                  const childActive = location.pathname === child.path;
                  const ChildIcon = child.icon;

                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={cn(
                        'flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md transition-colors',
                        'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'lg:pl-10',
                        childActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                    >
                      <ChildIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden lg:block text-sm">{child.label}</span>
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}
        </div>

        {/* User section with sign out */}
        <div className="hidden md:flex flex-col items-center lg:items-stretch gap-2 p-4 border-t border-sidebar-border">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-center lg:justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link to="/prefil">
              <UserCircle className="w-4 h-4" />
              <span className="hidden lg:block">{text('Prefil', 'Profile')}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-center lg:justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:block">{text('Cerrar sesion', 'Sign out')}</span>
          </Button>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-5 gap-1 px-2 py-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/progress' && isProgressSection);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 rounded-md transition-colors',
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
