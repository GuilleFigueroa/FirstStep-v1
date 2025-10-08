import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Input } from '../../../ui/components/ui/input';
import { Badge } from '../../../ui/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../ui/components/ui/dropdown-menu';
import { PostulationDetails } from './PostulationDetails';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  X,
  Settings,
  FileText,
  Users,
  ExternalLink,
  Copy
} from 'lucide-react';
import type { Profile, Process } from '../../../shared/services/supabase';
import { getProcessesByRecruiter, updateProcessStatus, deleteProcess } from '../../services/processService';

interface PostulationsTableProps {
  userProfile: Profile;
}

interface Postulation {
  id: string;
  jobTitle: string;
  company: string;
  department: string;
  status: 'active' | 'closed' | 'paused';
  applicants: number;
  dateCreated: string;
  deadline?: string;
  maxApplicants?: number;
  uniqueLink: string;
}

// Tipo extendido para procesos con conteo de candidatos (retornado por getProcessesByRecruiter)
type ProcessWithCount = Process & { candidate_count?: number };

// Función para convertir Process a Postulation para compatibilidad con la UI existente
function processToPostulation(process: ProcessWithCount): Postulation {
  return {
    id: process.id,
    jobTitle: process.title,
    company: process.company_name,
    department: 'General', // TODO: Agregar department al esquema en el futuro
    status: process.status,
    applicants: process.candidate_count || 0,
    dateCreated: new Date(process.created_at).toISOString().split('T')[0],
    maxApplicants: process.candidate_limit,
    uniqueLink: process.unique_link
  };
}

export function PostulationsTable({ userProfile }: PostulationsTableProps) {
  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingPostulation, setViewingPostulation] = useState<Postulation | null>(null);

  // Cargar procesos del reclutador
  useEffect(() => {
    if (userProfile?.id) {
      loadProcesses();
    } else {
      setError('Error: Usuario no válido');
      setLoading(false);
    }
  }, [userProfile?.id]);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProcessesByRecruiter(userProfile.id);

      if (result.success && result.processes) {
        const postulationsData = result.processes.map(processToPostulation);
        setPostulations(postulationsData);
      } else {
        setError(result.error || 'Error al cargar procesos');
      }
    } catch (error) {
      setError('Error inesperado al cargar procesos');
      console.error('Error loading processes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de proceso
  const handleStatusChange = async (processId: string, newStatus: 'active' | 'closed' | 'paused') => {
    try {
      const result = await updateProcessStatus(processId, newStatus);
      if (result.success) {
        // Recargar procesos para reflejar el cambio
        loadProcesses();
      } else {
        alert(result.error || 'Error al actualizar estado');
      }
    } catch (error) {
      alert('Error inesperado al actualizar estado');
      console.error('Error updating status:', error);
    }
  };

  // Eliminar proceso
  const handleDeleteProcess = async (processId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proceso? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await deleteProcess(processId);
      if (result.success) {
        // Recargar procesos para reflejar el cambio
        loadProcesses();
      } else {
        alert(result.error || 'Error al eliminar proceso');
      }
    } catch (error) {
      alert('Error inesperado al eliminar proceso');
      console.error('Error deleting process:', error);
    }
  };

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

  const extractUniqueId = (uniqueLink: string): string => {
    // Extraer solo el ID del link completo
    // Formato: http://domain/apply/unique-id -> unique-id
    const parts = uniqueLink.split('/apply/');
    return parts.length > 1 ? parts[1] : uniqueLink;
  };

  const copyLinkToClipboard = (uniqueLink: string) => {
    const uniqueId = extractUniqueId(uniqueLink);
    const fullLink = `${window.location.origin}/apply/${uniqueId}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      alert('¡Link copiado al portapapeles!');
    }).catch(() => {
      alert('Error al copiar el link');
    });
  };

  const openLinkInNewTab = (uniqueLink: string) => {
    const uniqueId = extractUniqueId(uniqueLink);
    const fullLink = `${window.location.origin}/apply/${uniqueId}`;
    window.open(fullLink, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" style={{ backgroundColor: '#BE56C8', color: 'white' }}>Activa</Badge>;
      case 'closed':
        return <Badge variant="secondary" style={{ backgroundColor: '#9E9C9E', color: 'white' }}>Cerrada</Badge>;
      case 'paused':
        return <Badge variant="outline" style={{ backgroundColor: '#FFA500', color: 'white' }}>Pausada</Badge>;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Cargando procesos...</p>
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
            <Button onClick={loadProcesses} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="closed">Cerrada</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
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
                      <TableHead>Link de Postulación</TableHead>
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
                              className="flex items-center gap-1 text-xs"
                              onClick={() => openLinkInNewTab(postulation.uniqueLink)}
                              title="Abrir link en nueva pestaña"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-xs"
                              onClick={() => copyLinkToClipboard(postulation.uniqueLink)}
                              title="Copiar link al portapapeles"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar
                            </Button>
                          </div>
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