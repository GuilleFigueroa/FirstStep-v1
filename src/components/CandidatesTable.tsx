import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { CandidateProfile } from './CandidateProfile';
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
  name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  status: 'activo' | 'cerrado';
  fitPercentage: number;
  avatar?: string;
  actionStatus?: 'reviewed' | 'contacted' | 'sent' | 'none';
  isFavorite?: boolean;
  linkedInUrl?: string;
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@email.com',
    phone: '+34 666 123 456',
    position: 'Frontend Developer',
    company: 'TechCorp',
    status: 'activo',
    fitPercentage: 92,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/ana-garcia-frontend'
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 677 234 567',
    position: 'Backend Developer',
    company: 'DevStudio',
    status: 'activo',
    fitPercentage: 87,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/carlos-rodriguez-backend'
  },
  {
    id: '3',
    name: 'María López',
    email: 'maria.lopez@email.com',
    phone: '+34 688 345 678',
    position: 'UX/UI Designer',
    company: 'DesignLab',
    status: 'cerrado',
    fitPercentage: 95,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/maria-lopez-uxui'
  },
  {
    id: '4',
    name: 'David Martín',
    email: 'david.martin@email.com',
    phone: '+34 699 456 789',
    position: 'Full Stack Developer',
    company: 'StartupXYZ',
    status: 'activo',
    fitPercentage: 78,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/david-martin-fullstack'
  },
  {
    id: '5',
    name: 'Laura Fernández',
    email: 'laura.fernandez@email.com',
    phone: '+34 610 567 890',
    position: 'DevOps Engineer',
    company: 'CloudTech',
    status: 'activo',
    fitPercentage: 84,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/laura-fernandez-devops'
  },
  {
    id: '6',
    name: 'Javier Sánchez',
    email: 'javier.sanchez@email.com',
    phone: '+34 621 678 901',
    position: 'Data Scientist',
    company: 'DataCorp',
    status: 'cerrado',
    fitPercentage: 89,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/javier-sanchez-datascience'
  },
  {
    id: '7',
    name: 'Elena Ruiz',
    email: 'elena.ruiz@email.com',
    phone: '+34 632 789 012',
    position: 'Mobile Developer',
    company: 'AppFactory',
    status: 'activo',
    fitPercentage: 91,
    actionStatus: 'none',
    isFavorite: false,
    linkedInUrl: 'https://www.linkedin.com/in/elena-ruiz-mobile'
  }
];

export function CandidatesTable() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profileViewCandidate, setProfileViewCandidate] = useState<Candidate | null>(null);

  // Filtrar candidatos
  const filteredCandidates = candidates.filter(candidate => {
    const matchesName = candidate.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesPosition = candidate.position.toLowerCase().includes(positionFilter.toLowerCase());
    const matchesCompany = candidate.company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesName && matchesPosition && matchesCompany && matchesStatus;
  });

  const handleAction = (candidateId: string, action: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    
    setCandidates(prev => prev.map(candidate => {
      if (candidate.id === candidateId) {
        switch (action) {
          case 'view-profile':
            setProfileViewCandidate(candidate);
            return candidate;
          case 'mark-reviewed':
            return { ...candidate, actionStatus: 'reviewed' };
          case 'mark-contacted':
            return { ...candidate, actionStatus: 'contacted' };
          case 'mark-favorite':
            return { ...candidate, isFavorite: !candidate.isFavorite };
          case 'delete':
            return candidate; // Lo eliminaremos del array después
          default:
            return candidate;
        }
      }
      return candidate;
    }));

    // Eliminar candidato si la acción es delete
    if (action === 'delete') {
      setCandidates(prev => prev.filter(candidate => candidate.id !== candidateId));
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
    // Si es favorito, priorizar el color amarillo anaranjado
    if (candidate.isFavorite) {
      return { backgroundColor: '#FEF3C7' }; // Amarillo anaranjado claro para favoritos
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
    return status === 'activo' 
      ? <Badge variant="default" style={{ backgroundColor: '#BE56C8', color: 'white' }}>Activo</Badge>
      : <Badge variant="secondary" style={{ backgroundColor: '#9E9C9E', color: 'white' }}>Cerrado</Badge>;
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
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
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
                          <AvatarImage src={candidate.avatar} />
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="font-medium">{candidate.position}</div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="font-medium">{candidate.company}</div>
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      {getStatusBadge(candidate.status)}
                    </TableCell>
                    <TableCell style={getRowStyle(candidate)}>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${getFitColor(candidate.fitPercentage)}`}
                            style={{ width: `${candidate.fitPercentage}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm">{candidate.fitPercentage}%</span>
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
          
          {filteredCandidates.length === 0 && (
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
        </CardContent>
      </Card>

      {/* Candidate Profile View */}
      {profileViewCandidate && (
        <CandidateProfile
          candidate={profileViewCandidate}
          onClose={handleCloseProfile}
          onAction={handleProfileAction}
        />
      )}
    </div>
  );
}