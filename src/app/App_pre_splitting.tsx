import { Routes, Route } from "react-router-dom";
import { RecruiterApp } from "../recruiter/components/RecruiterApp";
import { CandidateApplication } from "../candidate/components/CandidateApplication";

// Re-export types for backward compatibility
export type {
  ProfileRequirement,
  FormQuestion,
  JobProfile,
  JobPosting,
  UserData
} from "../shared/types/recruitment";

export default function App() {
  return (
    <Routes>
      {/* Ruta del candidato - acceso por link único */}
      <Route path="/apply/:processId" element={<CandidateApplication />} />

      {/* Ruta del reclutador - pantalla principal */}
      <Route path="/" element={<RecruiterApp />} />
    </Routes>
  );
}