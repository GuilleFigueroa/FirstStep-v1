import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Crear Postulación', icon: FileText },
  { id: 'candidates', label: 'Candidatos', icon: Users },
  { id: 'postulation-processes', label: 'Gestión de Postulaciones', icon: Clock },
];

export function Sidebar({ activeSection = 'applications', onSectionChange }: SidebarProps) {
  return (
    <div className="w-64 h-screen text-white flex flex-col" style={{ background: 'linear-gradient(to bottom, #7572FF, #5855E6)' }}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#353535' }}>
            <img src="/Icono-rayo-firststep.png" alt="FirstStep" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h2 className="font-semibold text-white">FirstStep</h2>
            <p className="text-xs text-white/70">Plataforma de Reclutamiento</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <div 
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer
                    ${activeSection === item.id 
                      ? 'bg-white/20 text-white shadow-sm' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  onClick={() => onSectionChange?.(item.id)}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Bottom Section */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Salir</span>
        </div>
      </div>
    </div>
  );
}