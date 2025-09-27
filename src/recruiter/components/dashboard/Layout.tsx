import { Search, Bell, Plus, LogOut, ArrowLeft } from 'lucide-react';
import { Input } from '../../../ui/components/ui/input';
import { Button } from '../../../ui/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../ui/components/ui/avatar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  title?: string;
  subtitle?: string;
  userData?: { firstName: string; lastName: string; email: string } | null;
  onLogout?: () => void;
  onBackToRoleSelection?: () => void;
}

export function Layout({ 
  children, 
  activeSection = 'applications', 
  onSectionChange,
  title = 'Definición del perfil',
  subtitle = 'Configura los requisitos del perfil buscado',
  userData,
  onLogout,
  onBackToRoleSelection
}: LayoutProps) {
  
  const handleCreateApplication = () => {
    onSectionChange?.('applications');
  };
  

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Fixed width and position */}
      <div className="fixed left-0 top-0 h-full w-64 z-10 bg-[rgba(0,0,0,0)]">
        <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      </div>
      
      {/* Main Content Area - With left margin to account for fixed sidebar */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-5">
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b1c2?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback>
                  {userData ? `${userData.firstName[0]}${userData.lastName[0]}` : 'AM'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {userData ? `${userData.firstName} ${userData.lastName}` : 'Arlene McCoy'}
                </p>
                <p className="text-xs text-gray-500">Reclutador</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onBackToRoleSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToRoleSelection}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Cambiar Rol</span>
                </Button>
              )}
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              )}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Page Title */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl mb-2">{title}</h1>
                <p className="text-muted-foreground">
                  {subtitle}
                </p>
              </div>
              
              {/* Quick Action Button - Only show on dashboard */}
              {activeSection === 'dashboard' && (
                <Button 
                  onClick={handleCreateApplication}
                  className="bg-[#7572FF] hover:bg-[#6863E8] text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear Postulación
                </Button>
              )}
            </div>
            
            {/* Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}