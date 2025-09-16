import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  UserCheck,
  Briefcase
} from 'lucide-react';

export function Dashboard() {
  const stats = [
    {
      title: 'Postulaciones Activas',
      value: '12',
      description: 'Procesos en curso',
      icon: Briefcase,
      trend: '+2.3%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Candidatos Evaluados',
      value: '89',
      description: 'Este mes',
      icon: Users,
      trend: '+12.5%',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Perfiles Creados',
      value: '24',
      description: 'Total configurados',
      icon: FileText,
      trend: '+5.1%',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Tasa de Conversión',
      value: '68%',
      description: 'Candidatos que avanzan',
      icon: TrendingUp,
      trend: '+8.2%',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Nuevo perfil creado',
      description: 'Frontend Developer - TechCorp',
      time: 'Hace 2 horas',
      status: 'completed',
      icon: FileText
    },
    {
      id: 2,
      action: 'Candidato evaluado',
      description: 'Ana García - React Developer',
      time: 'Hace 4 horas',
      status: 'completed',
      icon: UserCheck
    },
    {
      id: 3,
      action: 'Simulación iniciada',
      description: 'Backend Developer - 15 candidatos',
      time: 'Hace 6 horas',
      status: 'in-progress',
      icon: Target
    },
    {
      id: 4,
      action: 'Postulación publicada',
      description: 'DevOps Engineer - CloudTech',
      time: 'Hace 1 día',
      status: 'completed',
      icon: CheckCircle
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      task: 'Revisar candidatos para Frontend Developer',
      dueDate: 'Hoy, 3:00 PM',
      priority: 'high',
      candidates: 8
    },
    {
      id: 2,
      task: 'Entrevistas programadas - DevOps',
      dueDate: 'Mañana, 10:00 AM',
      priority: 'medium',
      candidates: 3
    },
    {
      id: 3,
      task: 'Configurar perfil - Product Manager',
      dueDate: 'Viernes, 2:00 PM',
      priority: 'low',
      candidates: 0
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-2xl">Bienvenido de vuelta 👋</h2>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tu actividad de reclutamiento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas acciones realizadas en tu panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'completed' 
                        ? 'bg-green-100' 
                        : 'bg-yellow-100'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${
                        activity.status === 'completed' 
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status === 'completed' ? 'Completado' : 'En curso'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tareas Pendientes
            </CardTitle>
            <CardDescription>
              Próximas acciones que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-1.5 rounded-full ${
                    task.priority === 'high' 
                      ? 'bg-red-100' 
                      : task.priority === 'medium'
                        ? 'bg-yellow-100'
                        : 'bg-gray-100'
                  }`}>
                    <AlertCircle className={`w-3 h-3 ${
                      task.priority === 'high' 
                        ? 'text-red-600' 
                        : task.priority === 'medium'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{task.task}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.dueDate}
                    </p>
                    {task.candidates > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {task.candidates} candidatos
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant={
                    task.priority === 'high' 
                      ? 'destructive' 
                      : task.priority === 'medium'
                        ? 'secondary'
                        : 'outline'
                  }>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                Ver todas las tareas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Crear Perfil</p>
                  <p className="text-sm text-muted-foreground">Nuevo requisito de puesto</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Ver Candidatos</p>
                  <p className="text-sm text-muted-foreground">Revisar aplicaciones</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Simular Proceso</p>
                  <p className="text-sm text-muted-foreground">Generar candidatos</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}