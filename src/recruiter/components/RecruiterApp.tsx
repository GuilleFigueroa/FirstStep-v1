import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/components/ui/card";
import { TextAnalysisMode } from "./profile-config/TextAnalysisMode";
import { ProfileSummary } from "./profile-config/ProfileSummary";
import { JobPostingConfig } from "./profile-config/JobPostingConfig";
import { CandidateSimulation } from "./candidates/CandidateSimulation";
import { CustomQuestionConfig } from "./profile-config/CustomQuestionConfig";
import { CandidatesTable } from "./candidates/CandidatesTable";
import { PostulationsTable } from "./postulations/PostulationsTable";
import { Dashboard } from "./dashboard/Dashboard";
import { Layout } from "./dashboard/Layout";
import { AuthScreen } from "./auth/AuthScreen";
import { FileText } from "lucide-react";
import { getCurrentUser, signOut } from "../services/authService";
import type { Profile } from "../../shared/services/supabase";
import type {
  ProfileRequirement,
  FormQuestion,
  JobProfile,
  JobPosting,
  UserData
} from "../../app/App_backup";

// Función para convertir Profile a UserData
function profileToUserData(profile: Profile): UserData {
  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email
  };
}

export function RecruiterApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [profileData, setProfileData] = useState<JobProfile>({
    title: '',
    requirements: [],
    customPrompt: '',
    formQuestions: []
  });
  const [postingData, setPostingData] = useState<JobPosting>({
    profile: profileData,
    companyName: '',
    jobTitle: '',
    candidateLimit: 50
  });
  const [loading, setLoading] = useState(true);

  // Estados para el flujo de configuración
  const [currentProfile, setCurrentProfile] = useState<JobProfile | null>(null);
  const [currentPosting, setCurrentPosting] = useState<JobPosting | null>(null);
  const [currentStep, setCurrentStep] = useState<
    | "config"
    | "summary"
    | "custom-question"
    | "posting"
    | "simulation"
  >("config");

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
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (profile: Profile) => {
    setUserProfile(profile);
    setUserData(profileToUserData(profile));
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserData(null);
      setUserProfile(null);
      setActiveSection('dashboard');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Reset a config cuando cambiamos de sección a applications
    if (section === "applications") {
      setCurrentStep("config");
    }
  };

  // Handlers para el flujo de configuración
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

  const handleCustomQuestionConfigured = (profile: JobProfile) => {
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

  const handleProfileUpdate = (updatedProfile: JobProfile) => {
    setProfileData(updatedProfile);
    setPostingData(prev => ({
      ...prev,
      profile: updatedProfile
    }));
  };

  const handlePostingUpdate = (updatedPosting: JobPosting) => {
    setPostingData(updatedPosting);
  };

  const getSectionTitle = (section: string): string => {
    switch (section) {
      case "dashboard":
        return "Dashboard";
      case "candidates":
        return "Candidatos";
      case "applications":
        return "Definición del perfil";
      case "postulation-processes":
        return "Gestión de postulaciones";
      default:
        return "Dashboard";
    }
  };

  const getSectionDescription = (section: string): string => {
    switch (section) {
      case "dashboard":
        return "Resumen general de tu actividad de reclutamiento";
      case "candidates":
        return "Administra los procesos de cada candidato";
      case "applications":
        return "Configura los requisitos del perfil buscado";
      case "postulation-processes":
        return "Gestiona tus procesos de postulación activos";
      default:
        return "Panel principal";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#7572FF]/30 border-t-[#7572FF] rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={handleLogin} />;
  }

  return (
    <Layout
      userData={userData}
      userProfile={userProfile}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      onLogout={handleLogout}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-[#7572FF]" />
          <h1 className="text-3xl font-bold text-gray-900">
            {getSectionTitle(activeSection)}
          </h1>
        </div>
        <p className="text-gray-600">
          {getSectionDescription(activeSection)}
        </p>
      </div>

      {/* Dashboard Section */}
      {activeSection === "dashboard" && userProfile && <Dashboard userProfile={userProfile} />}

      {/* Candidates Section */}
      {activeSection === "candidates" && <CandidatesTable />}

      {/* Applications Section - Flujo de configuración por pasos */}
      {activeSection === "applications" && (
        <div className="space-y-6">
          {currentStep === "config" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis del Perfil</CardTitle>
                    <CardDescription>
                      Describe el perfil que buscas y la IA extraerá automáticamente los requisitos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <TextAnalysisMode
                      onProfileCreated={handleProfileCreated}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === "summary" && currentProfile && (
            <ProfileSummary
              profile={currentProfile}
              onBack={handleBackToConfig}
              onSaveAsTemplate={handleSaveAsTemplate}
              onContinue={handleContinueToCustomQuestion}
            />
          )}

          {currentStep === "custom-question" && currentProfile && (
            <CustomQuestionConfig
              profile={currentProfile}
              onBack={handleBackToSummary}
              onContinue={handleCustomQuestionConfigured}
            />
          )}

          {currentStep === "posting" && currentProfile && userProfile && (
            <JobPostingConfig
              profile={currentProfile}
              onBack={handleBackToCustomQuestion}
              onCreatePosting={handleCreatePosting}
              onStartSimulation={handleStartSimulation}
              userProfile={userProfile}
            />
          )}

          {currentStep === "simulation" && currentPosting && (
            <CandidateSimulation
              profile={currentPosting.profile}
              onBack={handleBackToPosting}
            />
          )}
        </div>
      )}

      {/* Postulations Section */}
      {activeSection === "postulation-processes" && userProfile && <PostulationsTable userProfile={userProfile} />}
    </Layout>
  );
}