import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="container max-w-4xl py-6 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
