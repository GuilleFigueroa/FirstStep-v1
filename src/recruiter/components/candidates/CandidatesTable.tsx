import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { CandidateService } from '../../../shared/services/candidateService';
import { Input } from '../../../ui/components/ui/input';
import { Badge } from '../../../ui/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../ui/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../../ui/components/ui/avatar';
import { Progress } from '../../../ui/components/ui/progress';
import { CandidateProfile } from './CandidateProfile';
import { PaginationControls } from '../../../ui/components/ui/pagination-controls';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  Star,
  Trash2,
  Users,
  Phone
} from 'lucide-react';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  linkedin_url?: string;
  cv_url?: string;
  score?: number;  // Opcional - coincide con servicio
  status: string; // 'completed' | 'rejected'
  created_at: string;
  process_id: string;
  process_title: string;
  process_company: string;
  process_status: string; // 'active' | 'closed' | 'paused'
  // UI state (local)
  actionStatus?: 'reviewed' | 'contacted' | 'sent' | 'none';
  isFavorite?: boolean;
}

// Mock data temporal - será reemplazado por datos reales
const mockCandidates: Candidate[] = [];

interface CandidatesTableProps {
  recruiterId: string; // ID del reclutador actual
  initialProcessFilter?: string; // Filtro opcional por ID de proceso
}

export function CandidatesTable({ recruiterId, initialProcessFilter }: CandidatesTableProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>(initialProcessFilter || '');
  const [profileViewCandidate, setProfileViewCandidate] = useState<Candidate | null>(null);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    hasMore: false
  });

  // Actualizar filtro cuando initialProcessFilter cambia
  useEffect(() => {
    setProcessFilter(initialProcessFilter || '');
  }, [initialProcessFilter]);

  // Reset página cuando cambia filtro de proceso
  useEffect(() => {
    setCurrentPage(0);
  }, [processFilter]);

  // Cargar candidatos cuando cambia el recruiterId
  useEffect(() => {
    if (!recruiterId) {
      setCandidates([]);
      return;
    }

    const loadCandidates = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await CandidateService.getCandidatesByRecruiter(
          recruiterId,
          { page: currentPage, limit: 50 }
        );

        if (!result.success || !result.candidates) {
          setError(result.error || 'Error al cargar candidatos');
          setCandidates([]);
          return;
        }

        // Los candidatos ya vienen con action_status e is_favorite desde la BD
        const candidatesWithDefaults = result.candidates.map(c => ({
          ...c,
          process_id: c.process_id || '',
          actionStatus: c.action_status || 'none',
          isFavorite: c.is_favorite || false
        }));

        setCandidates(candidatesWithDefaults);

        // Guardar metadatos de paginación
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err) {
        console.error('Error loading candidates:', err);
        setError('Error al cargar candidatos');
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, [recruiterId, currentPage]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CandidateService.getCandidatesByRecruiter(
        recruiterId,
        { page: currentPage, limit: 50 }
      );

      if (!result.success || !result.candidates) {
        setError(result.error || 'Error al cargar candidatos');
        setCandidates([]);
        return;
      }

      const candidatesWithDefaults = result.candidates.map(c => ({
        ...c,
        process_id: c.process_id || '',
        actionStatus: c.action_status || 'none',
        isFavorite: c.is_favorite || false
      }));

      setCandidates(candidatesWithDefaults);

      // Guardar metadatos de paginación
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error al cargar candidatos');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler para cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll suave al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtrar candidatos
  const filteredCandidates = candidates.filter(candidate => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
    const matchesName = fullName.includes(nameFilter.toLowerCase());
    const matchesPosition = candidate.process_title.toLowerCase().includes(positionFilter.toLowerCase());
    const matchesCompany = candidate.process_company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.process_status === statusFilter;
    const matchesProcess = !processFilter || candidate.process_id === processFilter;

    return matchesName && matchesPosition && matchesCompany && matchesStatus && matchesProcess;
  });

  const handleAction = async (candidateId: string, action: string) => {
    const candidate = candidates.find(c => c.id === candidateId);

    if (!candidate) return;

    // Actualizar estado local inmediatamente (optimistic update)
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        switch (action) {
          case 'view-profile':
            setProfileViewCandidate(candidate);
            return c;
          case 'mark-reviewed':
            return { ...c, actionStatus: 'reviewed' as const };
          case 'mark-contacted':
            return { ...c, actionStatus: 'contacted' as const };
          case 'mark-favorite':
            return { ...c, isFavorite: !c.isFavorite };
          case 'delete':
            return c; // Lo eliminaremos del array después
          default:
            return c;
        }
      }
      return c;
    }));

    // Persistir cambios en BD
    try {
      switch (action) {
        case 'mark-reviewed':
          await CandidateService.updateActionStatus(candidateId, 'reviewed');
          break;
        case 'mark-contacted':
          await CandidateService.updateActionStatus(candidateId, 'contacted');
          break;
        case 'mark-favorite':
          await CandidateService.updateFavoriteStatus(candidateId, !candidate.isFavorite);
          break;
        case 'delete':
          // Eliminar del array local
          setCandidates(prev => prev.filter(c => c.id !== candidateId));
          // TODO: Implementar soft delete en BD si es necesario
          break;
      }
    } catch (error) {
      console.error('Error persisting action:', error);
      // Revertir cambio local si falla la BD
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          return candidate; // Restaurar estado original
        }
        return c;
      }));
    }
  };

  const handleCloseProfile = () => {
    setProfileViewCandidate(null);
  };

  const handleProfileAction = (action: string) => {
    if (profileViewCandidate) {
      handleAction(profileViewCandidate.id, action);
    }
  };

  const getRowClassName = (candidate: Candidate) => {
    switch (candidate.actionStatus) {
      case 'reviewed':
        return 'hover:opacity-90';
      case 'sent':
        return 'hover:opacity-90';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const getRowStyle = (candidate: Candidate) => {
    // Si es favorito, priorizar el color amarillo más fuerte
    if (candidate.isFavorite) {
      return { backgroundColor: '#FDE68A' }; // Amarillo más intenso y cálido para favoritos
    }

    switch (candidate.actionStatus) {
      case 'reviewed':
        return { backgroundColor: '#DDD6FE' }; // Violeta más intenso para revisado
      case 'contacted':
        return { backgroundColor: '#BBF7D0' }; // Verde más intenso para contactado
      case 'sent':
        return { backgroundColor: '#C9F2C9' }; // Verde claro para enviado
      default:
        return {};
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge variant="default" style={{ backgroundColor: '#BE56C8', color: 'white' }}>Activo</Badge>;
    } else if (status === 'closed') {
      return <Badge variant="secondary" style={{ backgroundColor: '#9E9C9E', color: 'white' }}>Cerrado</Badge>;
    } else if (status === 'paused') {
      return <Badge variant="outline" style={{ borderColor: '#FFA500', color: '#FFA500' }}>Pausado</Badge>;
    }
    return <Badge variant="secondary">Desconocido</Badge>;
  };

  const getFitColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-blue-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6 relative">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtra candidatos por nombre, puesto, empresa o estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Puesto / Rol</label>
              <Input
                placeholder="Ej: Frontend Developer"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Input
                placeholder="Ej: TechCorp"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
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
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de candidatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Candidatos
          </CardTitle>
          <CardDescription>
            {filteredCandidates.length} candidatos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7572FF] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando candidatos...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-800">{error}</p>
                <Button
                  onClick={handleRetry}
                  className="mt-4 bg-[#7572FF] hover:bg-[#6863E8]"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Tabla de candidatos */}
          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Puesto / Rol</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado de Postulación</TableHead>
                  <TableHead>Fit parcial %</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className={getRowClassName(candidate)} style={getRowStyle(candidate)}>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {candidate.first_name[0]}{candidate.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{candidate.first_name} {candidate.last_name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="font-medium">{candidate.process_title}</div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="font-medium">{candidate.process_company}</div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      {getStatusBadge(candidate.process_status)}
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getFitColor(candidate.score || 0)}`}
                            style={{ width: `${candidate.score || 0}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm">{candidate.score || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => handleAction(candidate.id, 'view-profile')}
                        >
                          <Eye className="w-4 h-4" />
                          Ver perfil
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem 
                              onClick={() => handleAction(candidate.id, 'mark-reviewed')}
                              className="text-purple-600"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Marcar como revisado
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAction(candidate.id, 'mark-contacted')}
                              className="text-green-600"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Marcar como contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAction(candidate.id, 'mark-favorite')}
                              className="text-yellow-600"
                            >
                              <Star className={`w-4 h-4 mr-2 ${candidate.isFavorite ? 'fill-current' : ''}`} />
                              {candidate.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleAction(candidate.id, 'delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar perfil
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
          )}

          {/* Paginación */}
          {!loading && !error && candidates.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={50}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}

          {/* Mensaje cuando hay candidatos pero los filtros no coinciden */}
          {!loading && !error && candidates.length > 0 && filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron candidatos
              </h3>
              <p className="text-gray-500">
                Intenta ajustar los filtros para encontrar candidatos
              </p>
            </div>
          )}

          {/* Mensaje cuando no hay candidatos */}
          {!loading && !error && candidates.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay candidatos aún
              </h3>
              <p className="text-gray-500">
                Los candidatos aparecerán aquí cuando completen el proceso de aplicación
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Profile View */}
      {profileViewCandidate && (
        <CandidateProfile
          candidate={profileViewCandidate}
          recruiterId={recruiterId}
          onClose={handleCloseProfile}
          onAction={handleProfileAction}
        />
      )}
    </div>
  );
}