import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { PostulationDetails } from './PostulationDetails';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  X,
  Settings,
  FileText,
  Users
} from 'lucide-react';

interface Postulation {
  id: string;
  jobTitle: string;
  company: string;
  department: string;
  status: 'activa' | 'cerrada';
  applicants: number;
  dateCreated: string;
  deadline?: string;
  maxApplicants?: number;
}

const mockPostulations: Postulation[] = [
  {
    id: '1',
    jobTitle: 'Frontend Developer',
    company: 'TechCorp',
    department: 'Desarrollo',
    status: 'activa',
    applicants: 24,
    dateCreated: '2024-01-15',
    deadline: '2024-02-15',
    maxApplicants: 50
  },
  {
    id: '2',
    jobTitle: 'Backend Developer',
    company: 'DevStudio',
    department: 'Desarrollo',
    status: 'activa',
    applicants: 18,
    dateCreated: '2024-01-20',
    deadline: '2024-02-20',
    maxApplicants: 30
  },
  {
    id: '3',
    jobTitle: 'UX/UI Designer',
    company: 'DesignLab',
    department: 'Diseño',
    status: 'cerrada',
    applicants: 45,
    dateCreated: '2024-01-10',
    deadline: '2024-01-30',
    maxApplicants: 40
  },
  {
    id: '4',
    jobTitle: 'Full Stack Developer',
    company: 'StartupXYZ',
    department: 'Desarrollo',
    status: 'activa',
    applicants: 12,
    dateCreated: '2024-01-25',
    deadline: '2024-03-01',
    maxApplicants: 25
  },
  {
    id: '5',
    jobTitle: 'DevOps Engineer',
    company: 'CloudTech',
    department: 'Infraestructura',
    status: 'activa',
    applicants: 8,
    dateCreated: '2024-01-30',
    deadline: '2024-02-28',
    maxApplicants: 20
  },
  {
    id: '6',
    jobTitle: 'Data Scientist',
    company: 'DataCorp',
    department: 'Datos',
    status: 'activa',
    applicants: 32,
    dateCreated: '2024-01-12',
    deadline: '2024-02-10',
    maxApplicants: 35
  },
  {
    id: '7',
    jobTitle: 'Mobile Developer',
    company: 'AppFactory',
    department: 'Desarrollo',
    status: 'cerrada',
    applicants: 19,
    dateCreated: '2024-01-08',
    deadline: '2024-01-25',
    maxApplicants: 15
  }
];

export function PostulationsTable() {
  const [postulations, setPostulations] = useState<Postulation[]>(mockPostulations);
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingPostulation, setViewingPostulation] = useState<Postulation | null>(null);

  // Filtrar postulaciones
  const filteredPostulations = postulations.filter(postulation => {
    const matchesCompany = postulation.company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesJobTitle = postulation.jobTitle.toLowerCase().includes(jobTitleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || postulation.status === statusFilter;
    
    return matchesCompany && matchesJobTitle && matchesStatus;
  });

  const handleAction = (postulationId: string, action: string) => {
    const postulation = postulations.find(p => p.id === postulationId);
    
    if (action === 'view-postulation' && postulation) {
      setViewingPostulation(postulation);
      return;
    }
    
    setPostulations(prev => prev.map(postulation => {
      if (postulation.id === postulationId) {
        switch (action) {
          case 'close-postulation':
            return { ...postulation, status: 'cerrada' as const };
          case 'modify-limit':
            // Aquí se abriría un modal para modificar el límite
            console.log('Modificar límite para:', postulation);
            return postulation;
          case 'delete':
            return postulation; // Lo eliminaremos del array después
          default:
            return postulation;
        }
      }
      return postulation;
    }));

    // Eliminar postulación si la acción es delete
    if (action === 'delete') {
      setPostulations(prev => prev.filter(postulation => postulation.id !== postulationId));
    }
  };

  const handleBackToList = () => {
    setViewingPostulation(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activa':
        return <Badge variant="default" style={{ backgroundColor: '#BE56C8', color: 'white' }}>Activa</Badge>;
      case 'cerrada':
        return <Badge variant="secondary" style={{ backgroundColor: '#9E9C9E', color: 'white' }}>Cerrada</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getApplicantsDisplay = (applicants: number, maxApplicants?: number) => {
    if (maxApplicants) {
      const percentage = (applicants / maxApplicants) * 100;
      const getProgressColor = () => {
        if (percentage >= 90) return 'bg-red-600';
        if (percentage >= 70) return 'bg-yellow-600';
        return 'bg-green-600';
      };

      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="font-medium text-sm">{applicants}/{maxApplicants}</span>
        </div>
      );
    }
    
    return <span className="font-medium text-sm">{applicants}</span>;
  };

  return (
    <div className="space-y-6 relative">
      {viewingPostulation ? (
        <PostulationDetails 
          postulation={viewingPostulation} 
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtra postulaciones por empresa, puesto o estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por empresa..."
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Puesto / Rol</label>
                  <Input
                    placeholder="Ej: Frontend Developer"
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado de Postulación</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="activa">Activa</SelectItem>
                      <SelectItem value="cerrada">Cerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de postulaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lista de Postulaciones
              </CardTitle>
              <CardDescription>
                {filteredPostulations.length} postulaciones encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Puesto / Rol</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Estado de Postulación</TableHead>
                      <TableHead>Número de Postulantes</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostulations.map((postulation) => (
                      <TableRow key={postulation.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{postulation.jobTitle}</div>
                            <div className="text-sm text-gray-500">{postulation.department}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{postulation.company}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(postulation.status)}
                        </TableCell>
                        <TableCell>
                          {getApplicantsDisplay(postulation.applicants, postulation.maxApplicants)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(postulation.dateCreated).toLocaleDateString('es-ES')}
                          </div>
                          {postulation.deadline && (
                            <div className="text-xs text-gray-500">
                              Vence: {new Date(postulation.deadline).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleAction(postulation.id, 'view-postulation')}
                            >
                              <Eye className="w-4 h-4" />
                              Ver Postulación
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem 
                                  onClick={() => handleAction(postulation.id, 'close-postulation')}
                                  className="text-red-600"
                                  disabled={postulation.status === 'cerrada'}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cerrar Postulación
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(postulation.id, 'modify-limit')}
                                  className="text-blue-600"
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Modificar Límite
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredPostulations.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron postulaciones
                  </h3>
                  <p className="text-gray-500">
                    Intenta ajustar los filtros para encontrar postulaciones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}