import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import WeeklyPlan from '../WeeklyPlan';
import Nutrition from '../Nutrition';
import BodyWeight from '../BodyWeight';

const saveWeeklyPlanMock = vi.fn();
const setActivePlanMock = vi.fn();
const addBodyWeightLogMock = vi.fn();
const updateBodyWeightLogMock = vi.fn();
const deleteBodyWeightLogMock = vi.fn();
const navigateMock = vi.fn();

const activePlanMock = {
  id: 'plan-1',
  name: 'Plan Test',
  createdAt: new Date(),
  isActive: true,
  items: [
    { id: 'mon', day: 'lunes', muscleGroups: ['descanso'], exercises: [] },
    { id: 'tue', day: 'martes', muscleGroups: ['espalda'], exercises: [] },
    { id: 'wed', day: 'miercoles', muscleGroups: ['piernas'], exercises: [] },
    { id: 'thu', day: 'jueves', muscleGroups: ['descanso'], exercises: [] },
    { id: 'fri', day: 'viernes', muscleGroups: ['pecho'], exercises: [] },
    { id: 'sat', day: 'sabado', muscleGroups: ['hombros'], exercises: [] },
    { id: 'sun', day: 'domingo', muscleGroups: ['descanso'], exercises: [] },
  ],
};

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useData', () => ({
  useData: () => ({
    weeklyPlans: [activePlanMock],
    bodyWeightLogs: [],
    addBodyWeightLog: addBodyWeightLogMock,
    updateBodyWeightLog: updateBodyWeightLogMock,
    deleteBodyWeightLog: deleteBodyWeightLogMock,
    mealPlans: {
      lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: [],
    },
    macroProfile: null,
    saveMealPlan: vi.fn(),
    saveMacroProfile: vi.fn(),
    saveWeeklyPlan: saveWeeklyPlanMock,
    setActivePlan: setActivePlanMock,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    text: (spanish: string, _english: string) => spanish,
    locale: 'es-ES',
  }),
}));

describe('Feature smoke tests', () => {
  beforeEach(() => {
    saveWeeklyPlanMock.mockReset();
    setActivePlanMock.mockReset();
    addBodyWeightLogMock.mockReset();
    updateBodyWeightLogMock.mockReset();
    deleteBodyWeightLogMock.mockReset();
    navigateMock.mockReset();
  });

  it('weekly plan updates muscle groups', async () => {
    saveWeeklyPlanMock.mockResolvedValue({ id: 'plan-1' });

    render(<WeeklyPlan />);

    fireEvent.click(screen.getByRole('button', { name: /Pecho/i }));

    await waitFor(() => {
      expect(saveWeeklyPlanMock).toHaveBeenCalled();
    });
  });

  it('nutrition page renders planner and calculator tabs', () => {
    render(<Nutrition />);
    expect(screen.getByText('Nutricion')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Plan semanal/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Calculadora/i })).toBeInTheDocument();
  });

  it('weight page sends new log through data layer', async () => {
    addBodyWeightLogMock.mockResolvedValueOnce({ id: 'bw-1', date: new Date(), weight: 78.4 });
    render(<BodyWeight />);

    fireEvent.change(screen.getByPlaceholderText('Ej: 75.5'), { target: { value: '78.4' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(addBodyWeightLogMock).toHaveBeenCalled();
    });
  });
});
