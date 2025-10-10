import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Mail,
  UserPlus,
  Loader2
} from 'lucide-react';
import type { Profile } from '../../../shared/services/supabase';
import { getProcessStats } from '../../services/processService';

interface DashboardProps {
  userProfile: Profile;
}

export function Dashboard({ userProfile }: DashboardProps) {
  const [stats, setStats] = useState({
    activeProcesses: 0,
    totalCandidates: 0,
    completedProcesses: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getProcessStats(userProfile.id);

        if (result.success && result.stats) {
          setStats({
            activeProcesses: result.stats.active,
            totalCandidates: 0, // TODO: Conectar con candidatos cuando esté implementado
            completedProcesses: result.stats.closed,
            thisMonth: result.stats.thisMonth
          });
        } else {
          setError(result.error || 'Error al cargar estadísticas');
        }
      } catch (error) {
        setError('Error inesperado al cargar estadísticas');
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userProfile.id]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProcessStats(userProfile.id);

      if (result.success && result.stats) {
        setStats({
          activeProcesses: result.stats.active,
          totalCandidates: 0,
          completedProcesses: result.stats.closed,
          thisMonth: result.stats.thisMonth
        });
      } else {
        setError(result.error || 'Error al cargar estadísticas');
      }
    } catch (error) {
      setError('Error inesperado al cargar estadísticas');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };



  // Nueva actividad reciente con información específica solicitada
  const recentActivity = [
    {
      id: 1,
      type: 'new-candidate',
      message: 'Carlos Mendoza aplicó a Backend Developer',
      time: '15 minutos',
      icon: UserPlus,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 2,
      type: 'new-message',
      message: '3 nuevos mensajes de candidatos recibidos',
      time: '1 hora',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 3,
      type: 'process-closed',
      message: 'Proceso Frontend Developer cerrado - candidato contratado',
      time: '2 horas',
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 4,
      type: 'limit-reached',
      message: 'Límite de postulaciones alcanzado para UX Designer (50/50)',
      time: '4 horas',
      icon: AlertTriangle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 5,
      type: 'new-candidate',
      message: 'Ana López aplicó a Product Manager',
      time: '6 horas',
      icon: UserPlus,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 6,
      type: 'new-message',
      message: '2 candidatos respondieron entrevistas',
      time: '1 día',
      icon: MessageSquare,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 7,
      type: 'process-closed',
      message: 'Proceso de Marketing Manager finalizado',
      time: '1 día',
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 8,
      type: 'new-candidate',
      message: 'Roberto Sánchez aplicó a Data Analyst',
      time: '2 días',
      icon: UserPlus,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];



  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p>Cargando estadísticas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb #f9fafb;
        }
      `}</style>

      {/* Hero Section optimizado */}
      <div className="bg-gradient-to-r from-slate-100 via-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold mb-2 text-slate-700">
              ¡Bienvenido de vuelta, {userProfile.first_name}!
            </h1>
            <p className="text-slate-600 text-sm">
              Tienes {stats.activeProcesses} procesos activos{stats.thisMonth > 0 && ` y ${stats.thisMonth} creados este mes`}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="text-lg font-semibold text-slate-700">{stats.completedProcesses}</div>
              <div className="text-xs text-slate-500">Completados</div>
            </div>
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="text-lg font-semibold text-slate-700">{stats.thisMonth}</div>
              <div className="text-xs text-slate-500">Este mes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeProcesses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProcesses === 0 ? 'Crea tu primer proceso' : 'Procesos en curso'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Próximamente disponible
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedProcesses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedProcesses === 0 ? 'Aún no hay completados' : 'Procesos finalizados'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonth === 0 ? 'Primer proceso del mes' : 'Procesos creados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Solo Actividad Reciente */}
      <div className="max-w-2xl mx-auto">
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimos eventos en tu pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.bgColor} ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">hace {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}