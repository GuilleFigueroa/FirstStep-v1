import { useState } from 'react';
import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  LogOut,
  CreditCard,
  Tag
} from 'lucide-react';
import type { Profile } from '../../../shared/services/supabase';
import { PricingModal } from '../subscription/PricingModal';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  userProfile?: Profile | null;
  onLogout?: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Crear Postulación', icon: FileText },
  { id: 'candidates', label: 'Candidatos', icon: Users },
  { id: 'postulation-processes', label: 'Gestión de Postulaciones', icon: Clock },
];

export function Sidebar({ activeSection = 'applications', onSectionChange, userProfile, onLogout }: SidebarProps) {
  const [loading, setLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleManageSubscription = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-customer-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ recruiterId: userProfile.id })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener portal');
      }

      // Abrir customer portal en nueva pestaña
      window.open(data.portalUrl, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Error al abrir portal de suscripción. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
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
      <div className="p-4 border-t border-white/20 space-y-2">
        {/* Mi Suscripción - Solo si tiene suscripción activa */}
        {userProfile?.subscription_status === 'active' && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            onClick={handleManageSubscription}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm font-medium">Cargando...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">Mi Suscripción</span>
              </>
            )}
          </div>
        )}

        {/* Ver Planes - Solo durante trial */}
        {userProfile?.subscription_status === 'trialing' && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            onClick={() => setShowPricingModal(true)}
          >
            <Tag className="w-5 h-5" />
            <span className="text-sm font-medium">Ver Planes</span>
          </div>
        )}

        {/* Salir */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Salir</span>
        </div>
      </div>

      {/* Modal de Pricing */}
      {showPricingModal && userProfile && (
        <PricingModal
          userProfile={userProfile}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </div>
  );
}