import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Code splitting: Lazy load rutas principales
const RecruiterApp = lazy(() => import("../recruiter/components/RecruiterApp").then(m => ({ default: m.RecruiterApp })));
const CandidateApplication = lazy(() => import("../candidate/components/CandidateApplication").then(m => ({ default: m.CandidateApplication })));

// Re-export types for backward compatibility
export type {
  ProfileRequirement,
  FormQuestion,
  JobProfile,
  JobPosting,
  UserData
} from "../shared/types/recruitment";

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#7572FF]/30 border-t-[#7572FF] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Ruta del candidato - acceso por link único */}
        <Route path="/apply/:processId" element={<CandidateApplication />} />

        {/* Ruta del reclutador - pantalla principal */}
        <Route path="/" element={<RecruiterApp />} />
      </Routes>
    </Suspense>
  );
}