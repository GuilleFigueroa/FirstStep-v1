import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Input } from '../../../ui/components/ui/input';
import { Badge } from '../../../ui/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../ui/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/components/ui/dialog';
import { PostulationDetailView } from './PostulationDetailView';
import { ModifyLimitDialog } from './ModifyLimitDialog';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  X,
  Check,
  Settings,
  FileText,
  Users,
  ExternalLink,
  Copy,
  AlertTriangle,
  Trash
} from 'lucide-react';
import type { Profile, Process } from '../../../shared/services/supabase';
import { getProcessesByRecruiter, updateProcessStatus, updateProcessLimit, deleteProcess } from '../../services/processService';

interface PostulationsTableProps {
  userProfile: Profile;
  onNavigateToCandidates: (processId: string) => void;
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

export function PostulationsTable({ userProfile, onNavigateToCandidates }: PostulationsTableProps) {
  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingPostulation, setViewingPostulation] = useState<Postulation | null>(null);

  // Estados para diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<Postulation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar procesos del reclutador
  useEffect(() => {
    if (!userProfile?.id) {
      setError('Error: Usuario no válido');
      setLoading(false);
      return;
    }

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

    loadProcesses();
  }, [userProfile?.id]);

  const handleRetry = async () => {
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
        handleRetry();
      } else {
        alert(result.error || 'Error al actualizar estado');
      }
    } catch (error) {
      alert('Error inesperado al actualizar estado');
      console.error('Error updating status:', error);
    }
  };

  // Abrir diálogo de eliminación
  const handleDeleteProcess = (processId: string) => {
    const process = postulations.find(p => p.id === processId);
    if (process) {
      setProcessToDelete(process);
      setDeleteDialogOpen(true);
    }
  };

  // Confirmar eliminación de proceso
  const handleConfirmDelete = async () => {
    if (!processToDelete) return;

    setDeleting(true);

    try {
      const result = await deleteProcess(processToDelete.id, userProfile.id);
      if (result.success) {
        // Remover de la lista local
        setPostulations(prev => prev.filter(p => p.id !== processToDelete.id));

        // Cerrar diálogo
        setDeleteDialogOpen(false);
        setProcessToDelete(null);
      } else {
        alert(result.error || 'Error al eliminar proceso');
      }
    } catch (error) {
      alert('Error inesperado al eliminar proceso');
      console.error('Error deleting process:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Modificar límite de candidatos
  const handleConfirmLimitChange = async (processId: string, newLimit: number | null) => {
    const result = await updateProcessLimit(processId, newLimit);
    if (result.success) {
      // Recargar procesos para reflejar el cambio
      await handleRetry();
    } else {
      throw new Error(result.error || 'Error al actualizar límite');
    }
  };

  // Filtrar postulaciones
  const filteredPostulations = postulations.filter(postulation => {
    const matchesCompany = postulation.company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesJobTitle = postulation.jobTitle.toLowerCase().includes(jobTitleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || postulation.status === statusFilter;
    
    return matchesCompany && matchesJobTitle && matchesStatus;
  });

  const handleAction = async (postulationId: string, action: string) => {
    const postulation = postulations.find(p => p.id === postulationId);

    if (!postulation) return;

    if (action === 'view-postulation') {
      setViewingPostulation(postulation);
      return;
    }

    // Manejar acciones que requieren persistencia en BD
    switch (action) {
      case 'close-postulation':
        await handleStatusChange(postulationId, 'closed');
        break;
      case 'activate-postulation':
        await handleStatusChange(postulationId, 'active');
        break;
      case 'pause-postulation':
        await handleStatusChange(postulationId, 'paused');
        break;
      default:
        break;
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
            <Button onClick={handleRetry} className="mt-4">
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
        <PostulationDetailView
          processId={viewingPostulation.id}
          onBack={handleBackToList}
          onNavigateToCandidates={onNavigateToCandidates}
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
                                {/* Mostrar "Activar" o "Cerrar" según el estado */}
                                {postulation.status === 'closed' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleAction(postulation.id, 'activate-postulation')}
                                    className="text-green-600"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Activar Postulación
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleAction(postulation.id, 'close-postulation')}
                                    className="text-red-600"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cerrar Postulación
                                  </DropdownMenuItem>
                                )}

                                {/* Pausar/Reactivar postulación */}
                                {postulation.status === 'paused' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleAction(postulation.id, 'activate-postulation')}
                                    className="text-green-600"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Reactivar Postulación
                                  </DropdownMenuItem>
                                ) : postulation.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => handleAction(postulation.id, 'pause-postulation')}
                                    className="text-yellow-600"
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Pausar Postulación
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <ModifyLimitDialog
                                  currentLimit={postulation.maxApplicants}
                                  currentApplicants={postulation.applicants}
                                  onConfirm={(newLimit) => handleConfirmLimitChange(postulation.id, newLimit)}
                                >
                                  <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-blue-600">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Modificar Límite
                                  </div>
                                </ModifyLimitDialog>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleDeleteProcess(postulation.id)}
                                  className="text-red-600"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Eliminar Proceso
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

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Proceso
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el proceso y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>

          {processToDelete && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {processToDelete.jobTitle}
                </h3>
                <p className="text-sm text-gray-600">{processToDelete.company}</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Se eliminará permanentemente:
                </h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>El proceso y toda su configuración</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span><strong>{processToDelete.applicants}</strong> candidato{processToDelete.applicants !== 1 ? 's' : ''} registrado{processToDelete.applicants !== 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Todos los CVs subidos por los candidatos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Todas las preguntas y respuestas del proceso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>El link de postulación dejará de funcionar</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Esta acción NO se puede deshacer
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <span className="mr-2">Eliminando...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  Eliminar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}