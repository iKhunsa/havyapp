import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/hooks/useAuth";
import { StoreSync } from "@/components/StoreSync";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./pages/Home";
import WeeklyPlan from "./pages/WeeklyPlan";
import Workout from "./pages/Workout";
import Nutrition from "./pages/Nutrition";
import BodyWeight from "./pages/BodyWeight";
import VolumeControl from "./pages/VolumeControl";
import Progress from "./pages/Progress";
import Prefil from "./pages/Prefil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthGuard>
              <DataProvider>
                <StoreSync />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/plan" element={<WeeklyPlan />} />
                  <Route path="/workout" element={<Workout />} />
                  <Route path="/nutrition" element={<Nutrition />} />
                  <Route path="/weight" element={<BodyWeight />} />
                  <Route path="/volume" element={<VolumeControl />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/prefil" element={<Prefil />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DataProvider>
            </AuthGuard>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
