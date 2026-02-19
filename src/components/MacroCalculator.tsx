import { useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  calculateMacros, 
  calculateBMR, 
  calculateTDEE,
  getActivityLabel,
  getGoalLabel 
} from '@/lib/nutrition-utils';
import { Check, Calculator, Target, Flame } from 'lucide-react';
import { toast } from 'sonner';
import type { UserMacroProfile, MacroTarget } from '@/types/fitness';
import { useLanguage } from '@/contexts/LanguageContext';
import { getErrorFeedback } from '@/lib/app-error';

export function MacroCalculator() {
  const { macroProfile, bodyWeightLogs, saveMacroProfile } = useData();
  const { text, language } = useLanguage();
  
  // Get latest weight from logs if available
  const latestWeight = bodyWeightLogs.length > 0 
    ? [...bodyWeightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : 75;
  
  const [profile, setProfile] = useState<UserMacroProfile>(
    macroProfile || {
      weight: latestWeight,
      height: 175,
      age: 30,
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
    }
  );
  
  const [calculatedMacros, setCalculatedMacros] = useState<MacroTarget | null>(null);
  const [showResults, setShowResults] = useState(!!macroProfile);
  
  useEffect(() => {
    if (macroProfile) {
      setProfile(macroProfile);
      setCalculatedMacros(calculateMacros(macroProfile));
      setShowResults(true);
    }
  }, [macroProfile]);
  
  const handleCalculate = () => {
    if (profile.weight <= 0 || profile.height <= 0 || profile.age <= 0) {
      toast.error(text('Completa peso, altura y edad con valores validos.', 'Enter valid weight, height, and age values.'));
      return;
    }

    const macros = calculateMacros(profile);
    setCalculatedMacros(macros);
    setShowResults(true);
  };
  
  const handleSave = async () => {
    try {
      await saveMacroProfile(profile);
      toast.success(text('Perfil de macros guardado', 'Macro profile saved'));
    } catch (error) {
      const feedback = getErrorFeedback(error, text('No se pudo guardar el perfil de macros.', 'Could not save macro profile.'));
      toast.error(feedback.message, {
        description: feedback.action,
      });
    }
  };
  
  const updateProfile = <K extends keyof UserMacroProfile>(
    key: K, 
    value: UserMacroProfile[K]
  ) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setShowResults(false);
  };
  
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  
  return (
    <div className="space-y-6">
      {/* Profile inputs */}
      <div className="card-clinical p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{text('Datos personales', 'Personal data')}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">{text('Peso (kg)', 'Weight (kg)')}</Label>
            <Input
              type="number"
              value={profile.weight}
              onChange={(e) => updateProfile('weight', parseFloat(e.target.value) || 0)}
              step={0.5}
            />
          </div>
          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">{text('Altura (cm)', 'Height (cm)')}</Label>
            <Input
              type="number"
              value={profile.height}
              onChange={(e) => updateProfile('height', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">{text('Edad', 'Age')}</Label>
            <Input
              type="number"
              value={profile.age}
              onChange={(e) => updateProfile('age', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">{text('Sexo', 'Sex')}</Label>
            <Select 
              value={profile.sex} 
              onValueChange={(v) => updateProfile('sex', v as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{text('Nivel de actividad', 'Activity level')}</Label>
          <Select 
            value={profile.activityLevel} 
            onValueChange={(v) => updateProfile('activityLevel', v as UserMacroProfile['activityLevel'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="sedentary">{getActivityLabel('sedentary', language)}</SelectItem>
               <SelectItem value="light">{getActivityLabel('light', language)}</SelectItem>
               <SelectItem value="moderate">{getActivityLabel('moderate', language)}</SelectItem>
               <SelectItem value="active">{getActivityLabel('active', language)}</SelectItem>
               <SelectItem value="very_active">{getActivityLabel('very_active', language)}</SelectItem>
             </SelectContent>
           </Select>
         </div>
        
        <div className="space-y-2">
           <Label className="text-xs text-muted-foreground">{text('Objetivo', 'Goal')}</Label>
          <Select 
            value={profile.goal} 
            onValueChange={(v) => updateProfile('goal', v as UserMacroProfile['goal'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="lose">{getGoalLabel('lose', language)}</SelectItem>
               <SelectItem value="maintain">{getGoalLabel('maintain', language)}</SelectItem>
               <SelectItem value="gain">{getGoalLabel('gain', language)}</SelectItem>
             </SelectContent>
           </Select>
         </div>
        
        <Button onClick={handleCalculate} className="w-full gap-2">
          <Calculator className="w-4 h-4" />
          {text('Calcular macros', 'Calculate macros')}
        </Button>
      </div>
      
      {/* Results */}
      {showResults && calculatedMacros && (
        <div className="space-y-4 animate-fade-in">
          {/* BMR & TDEE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-clinical p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TMB</p>
              <p className="text-xl font-bold">{Math.round(bmr)}</p>
              <p className="text-xs text-muted-foreground">kcal/día</p>
            </div>
            <div className="card-clinical p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TDEE</p>
              <p className="text-xl font-bold">{tdee}</p>
              <p className="text-xs text-muted-foreground">kcal/día</p>
            </div>
          </div>
          
          {/* Target macros */}
          <div className="card-clinical p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{text('Tus macros objetivo', 'Your target macros')}</h3>
            </div>
            
            <div className="flex items-center justify-center gap-2 py-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="text-3xl font-bold">{calculatedMacros.calories}</span>
              <span className="text-muted-foreground">kcal</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">{text('Proteina', 'Protein')}</p>
                <p className="text-2xl font-bold text-blue-500">{calculatedMacros.protein}g</p>
                <p className="text-xs text-muted-foreground">{calculatedMacros.protein * 4} kcal</p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">{text('Carbos', 'Carbs')}</p>
                <p className="text-2xl font-bold text-amber-500">{calculatedMacros.carbs}g</p>
                <p className="text-xs text-muted-foreground">{calculatedMacros.carbs * 4} kcal</p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-3 text-center">
                <p className="text-xs text-rose-400 uppercase tracking-wider mb-1">{text('Grasa', 'Fat')}</p>
                <p className="text-2xl font-bold text-rose-500">{calculatedMacros.fat}g</p>
                <p className="text-xs text-muted-foreground">{calculatedMacros.fat * 9} kcal</p>
              </div>
            </div>
            
            <Button onClick={handleSave} className="w-full gap-2" variant="outline">
              <Check className="w-4 h-4" />
              {text('Guardar perfil', 'Save profile')}
            </Button>
          </div>
          
          {/* Info */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg space-y-1">
             <p>{text('• ', '• ')}<strong>TMB</strong>{text(': Metabolismo basal (calorias en reposo)', ': Basal metabolic rate (resting calories)')}</p>
             <p>{text('• ', '• ')}<strong>TDEE</strong>{text(': Gasto calorico total diario', ': Total daily energy expenditure')}</p>
             <p>{text('• Formula: Mifflin-St Jeor (la mas precisa)', '• Formula: Mifflin-St Jeor (most accurate)')}</p>
           </div>
        </div>
      )}
    </div>
  );
}
