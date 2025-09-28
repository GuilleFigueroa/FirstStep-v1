import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/components/ui/card";
import { TextAnalysisMode } from "../recruiter/components/profile-config/TextAnalysisMode";
import { ProfileSummary } from "../recruiter/components/profile-config/ProfileSummary";
import { JobPostingConfig } from "../recruiter/components/profile-config/JobPostingConfig";
import { CandidateSimulation } from "../recruiter/components/candidates/CandidateSimulation";
import { CustomQuestionConfig } from "../recruiter/components/profile-config/CustomQuestionConfig";
import { CandidatesTable } from "../recruiter/components/candidates/CandidatesTable";
import { PostulationsTable } from "../recruiter/components/postulations/PostulationsTable";
import { Dashboard } from "../recruiter/components/dashboard/Dashboard";
import { Layout } from "../recruiter/components/dashboard/Layout";
import { AuthScreen } from "../recruiter/components/auth/AuthScreen";
import { RoleSelection } from "../shared/components/RoleSelection";
import { CandidateFlow } from "../candidate/components/CandidateFlow";
import { FileText } from "lucide-react";
import { getCurrentUser, signOut } from "../recruiter/services/authService";
import type { Profile } from "../shared/services/supabase";

export interface ProfileRequirement {
  id: string;
  category:
    | "experience"
    | "tools"
    | "technical"
    | "other-skills";
  title: string;
  level?: "básico" | "intermedio" | "avanzado";
  required: boolean;
  years?: number;
}

export interface FormQuestion {
  id: string;
  question: string;
  type: 'open' | 'multiple-choice';
  options?: string[];
  required: boolean;
}

export interface JobProfile {
  title: string;
  requirements: ProfileRequirement[];
  customPrompt?: string;
  customQuestion?: string;
  formQuestions?: FormQuestion[];
}

export interface JobPosting {
  profile: JobProfile;
  companyName: string;
  jobTitle: string;
  candidateLimit?: number;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

// Para compatibilidad con UserData existente
function profileToUserData(profile: Profile): UserData {
  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email
  };
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState("dashboard"); // Cambiado a dashboard por defecto

  const [currentProfile, setCurrentProfile] =
    useState<JobProfile | null>(null);
  const [currentPosting, setCurrentPosting] =
    useState<JobPosting | null>(null);
  const [currentStep, setCurrentStep] = useState<
    | "config"
    | "summary"
    | "custom-question"
    | "posting"
    | "simulation"
  >("config");

  // Verificar sesión al cargar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserProfile(user);
        setUserData(profileToUserData(user));
        setIsAuthenticated(true);
        setSelectedRole('recruiter');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCreated = (profile: JobProfile) => {
    setCurrentProfile(profile);
    setCurrentStep("summary");
  };

  const handleBackToConfig = () => {
    setCurrentStep("config");
  };

  const handleSaveAsTemplate = () => {
    alert(
      "¡Plantilla guardada exitosamente! Podrás usarla en futuros perfiles.",
    );
  };

  const handleContinueToCustomQuestion = () => {
    setCurrentStep("custom-question");
  };

  const handleContinueToPosting = () => {
    setCurrentStep("posting");
  };

  const handleBackToSummary = () => {
    setCurrentStep("summary");
  };

  const handleBackToCustomQuestion = () => {
    setCurrentStep("custom-question");
  };

  const handleCustomQuestionConfigured = (
    profile: JobProfile,
  ) => {
    setCurrentProfile(profile);
    setCurrentStep("posting");
  };

  const handleCreatePosting = (jobPosting: JobPosting) => {
    setCurrentPosting(jobPosting);
    console.log("Job posting created:", jobPosting);
  };

  const handleStartSimulation = () => {
    setCurrentStep("simulation");
  };

  const handleBackToPosting = () => {
    setCurrentStep("posting");
  };

  const handleAuthenticate = (profile: Profile) => {
    setUserProfile(profile);
    setUserData(profileToUserData(profile));
    setIsAuthenticated(true);
  };

  const handleRoleSelect = (role: 'recruiter' | 'candidate') => {
    setSelectedRole(role);
  };

  const handleBackToRoleSelection = async () => {
    try {
      await signOut();
      setSelectedRole(null);
      setIsAuthenticated(false);
      setUserData(null);
      setUserProfile(null);
      // Reset application state
      setActiveSection("dashboard");
      setCurrentStep("config");
      setCurrentProfile(null);
      setCurrentPosting(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserData(null);
      setUserProfile(null);
      // Reset application state when logging out
      setActiveSection("dashboard");
      setCurrentStep("config");
      setCurrentProfile(null);
      setCurrentPosting(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Reset a config cuando cambiamos de sección a applications
    if (section === "applications") {
      setCurrentStep("config");
    }
  };

  const getPageTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Dashboard";
      case "candidates":
        return "Candidatos";
      case "applications":
        return "Definición del perfil";
      case "active-processes":
        return "Gestión de Postulaciones";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Resumen general de tu actividad de reclutamiento";
      case "candidates":
        return "Administra los procesos de cada candidato";
      case "applications":
        return "Configura los requisitos del perfil buscado";
      case "active-processes":
        return "Administra y controla tus postulaciones activas";
      default:
        return "Resumen general de tu actividad de reclutamiento";
    }
  };

  // Contenido del configurador
  const ConfiguratorContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Escribir o Pegar Descripción del Perfil
        </CardTitle>
        <CardDescription>
          Describe el perfil del candidato ideal o pega una descripción de trabajo existente
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6">
        <TextAnalysisMode
          onProfileCreated={handleProfileCreated}
        />
      </CardContent>
    </Card>
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#7572FF] rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-600">Cargando FirstStep...</p>
        </div>
      </div>
    );
  }

  // Mostrar selección de rol si no se ha seleccionado
  if (!selectedRole) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  // Mostrar flujo del candidato (placeholder)
  if (selectedRole === 'candidate') {
    return <CandidateFlow onBack={handleBackToRoleSelection} />;
  }

  // Para reclutador: mostrar pantalla de autenticación si no está autenticado
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      userData={userData}
      onLogout={handleLogout}
      onBackToRoleSelection={handleBackToRoleSelection}
    >
      {/* Dashboard Section */}
      {activeSection === "dashboard" && <Dashboard />}

      {/* Candidates Section */}
      {activeSection === "candidates" && <CandidatesTable />}

      {/* Applications Section */}
      {activeSection === "applications" && (
        <>
          {currentStep === "config" && <ConfiguratorContent />}

          {currentStep === "summary" && currentProfile && (
            <div className="max-w-4xl mx-auto">
              <ProfileSummary
                profile={currentProfile}
                onBack={handleBackToConfig}
                onSaveAsTemplate={handleSaveAsTemplate}
                onContinue={handleContinueToCustomQuestion}
              />
            </div>
          )}

          {currentStep === "custom-question" &&
            currentProfile && (
              <div className="max-w-4xl mx-auto">
                <CustomQuestionConfig
                  profile={currentProfile}
                  onBack={handleBackToSummary}
                  onContinue={handleCustomQuestionConfigured}
                />
              </div>
            )}

          {currentStep === "posting" && currentProfile && (
            <div className="max-w-4xl mx-auto">
              <JobPostingConfig
                profile={currentProfile}
                onBack={handleBackToCustomQuestion}
                onCreatePosting={handleCreatePosting}
                onStartSimulation={handleStartSimulation}
              />
            </div>
          )}

          {currentStep === "simulation" && currentPosting && (
            <CandidateSimulation
              jobPosting={currentPosting}
              onBack={handleBackToPosting}
            />
          )}
        </>
      )}

      {/* Active Processes Section */}
      {activeSection === "active-processes" && <PostulationsTable />}
    </Layout>
  );
}