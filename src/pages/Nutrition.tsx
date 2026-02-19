import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { MacroCalculator } from '@/components/MacroCalculator';
import { MealPlanner } from '@/components/MealPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState('planner');
  const { text } = useLanguage();
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{text('Funcional', 'Functional')}</p>
          <h1 className="text-2xl font-bold tracking-tight">{text('Nutricion', 'Nutrition')}</h1>
          <p className="text-sm text-muted-foreground">
            {text('Calcula tus macros y planifica tus comidas semanales.', 'Calculate your macros and plan your weekly meals.')}
          </p>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planner" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              {text('Plan semanal', 'Weekly plan')}
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="w-4 h-4" />
              {text('Calculadora', 'Calculator')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="mt-6">
            <MacroCalculator />
          </TabsContent>
          
          <TabsContent value="planner" className="mt-6">
            <MealPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
