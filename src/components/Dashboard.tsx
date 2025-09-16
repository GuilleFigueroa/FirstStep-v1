import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  AlertTriangle,
  Mail,
  UserPlus
} from 'lucide-react';

export function Dashboard() {
  // Datos simulados para las estadísticas
  const stats = {
    activeProcesses: 12,
    totalCandidates: 89,
    completedProcesses: 34,
    averageTime: 4.5,
    successRate: 78
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
            <h1 className="text-xl font-semibold mb-2 text-slate-700">¡Bienvenido de vuelta, Arlene!</h1>
            <p className="text-slate-600 text-sm">
              Tienes {stats.activeProcesses} procesos activos y {stats.totalCandidates} candidatos en tu pipeline
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="text-lg font-semibold text-slate-700">{stats.successRate}%</div>
              <div className="text-xs text-slate-500">Tasa de éxito</div>
            </div>
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="text-lg font-semibold text-slate-700">{stats.averageTime}d</div>
              <div className="text-xs text-slate-500">Tiempo promedio</div>
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
              <span className="text-green-600">+2</span> desde la semana pasada
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
              <span className="text-green-600">+12</span> nuevos esta semana
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
              <span className="text-blue-600">+5</span> este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.averageTime}d</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-1.5d</span> vs mes anterior
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