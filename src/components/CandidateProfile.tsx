import { useState } from 'react';
import { 
  X, 
  Trash2, 
  Heart, 
  Download,
  FileText,
  User,
  Briefcase,
  Calendar,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Star,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  Plus,
  MessageCircle,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Textarea } from './ui/textarea';


interface CandidateProfileProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    company: string;
    status: 'activo' | 'cerrado';
    fitPercentage: number;
    avatar?: string;
    actionStatus?: 'reviewed' | 'sent' | 'none';
    isFavorite?: boolean;
    linkedInUrl?: string;
  };
  onClose: () => void;
  onAction: (action: string) => void;
}

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
}

export function CandidateProfile({ candidate, onClose, onAction }: CandidateProfileProps) {
  const [isFavorite, setIsFavorite] = useState(candidate.isFavorite || false);
  const [answersExpanded, setAnswersExpanded] = useState(false);
  const [compatibilityExpanded, setCompatibilityExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      content: 'Candidato con muy buena actitud durante la entrevista inicial. Mostró gran interés en el puesto y la empresa.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      author: 'Arlene McCoy'
    },
    {
      id: '2',
      content: 'Pendiente: Verificar referencias laborales de su puesto anterior.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
      author: 'Arlene McCoy'
    }
  ]);

  // Datos simulados del perfil completo
  const fullProfile = {
    personalInfo: {
      age: 28,
      location: 'Madrid, España',
      experience: '5 años',
      education: 'Ingeniería en Sistemas - Universidad Complutense Madrid',
      linkedin: 'linkedin.com/in/' + candidate.name.toLowerCase().replace(' ', ''),
      github: 'github.com/' + candidate.name.toLowerCase().replace(' ', '')
    },
    skills: {
      technical: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'AWS'],
      tools: ['VS Code', 'Git', 'Docker', 'Figma', 'Jira', 'Slack'],
      languages: ['Español (Nativo)', 'Inglés (Avanzado)', 'Francés (Básico)']
    },
    experience: [
      {
        company: candidate.company,
        position: candidate.position,
        period: '2022 - Presente',
        description: 'Desarrollo de aplicaciones web usando React y Node.js. Liderazgo de equipo de 3 desarrolladores junior.',
        achievements: ['Mejoró performance de la app en 40%', 'Implementó nuevas funcionalidades críticas']
      },
      {
        company: 'StartupTech',
        position: 'Frontend Developer',
        period: '2020 - 2022',
        description: 'Desarrollo de interfaces de usuario responsive y componentes reutilizables.',
        achievements: ['Desarrolló sistema de componentes usado por toda la empresa']
      }
    ],
    requirements: {
      mandatory: [
        { name: 'React', fulfilled: true, level: 'avanzado' },
        { name: '3+ años experiencia', fulfilled: true, level: 'cumplido' },
        { name: 'TypeScript', fulfilled: true, level: 'intermedio' },
        { name: 'Git', fulfilled: true, level: 'avanzado' }
      ],
      desirable: [
        { name: 'Node.js', fulfilled: true, level: 'intermedio' },
        { name: 'Python', fulfilled: true, level: 'básico' },
        { name: 'AWS', fulfilled: true, level: 'básico' },
        { name: 'Docker', fulfilled: false, level: 'no cumple' },
        { name: 'Kubernetes', fulfilled: false, level: 'no cumple' }
      ]
    },
    applicationAnswers: [
      {
        question: '¿Cuál es tu experiencia con React?',
        answer: 'Tengo 4 años de experiencia con React, he trabajado con hooks, context API, y librerías como Redux. He liderado la migración de una aplicación legacy a React en mi trabajo actual.',
        improvement: 'Respuesta completa y específica que demuestra experiencia sólida'
      },
      {
        question: '¿Has trabajado con TypeScript?',
        answer: 'Sí, he usado TypeScript en los últimos 2 años. Me ha ayudado mucho a escribir código más seguro y mantenible.',
        improvement: 'Demostró conocimiento práctico, aunque podría haber dado más ejemplos específicos'
      },
      {
        question: 'Cuéntanos sobre tu experiencia en liderazgo',
        answer: 'Actualmente lidero un equipo de 3 desarrolladores junior. He implementado procesos de code review y mentoring que han mejorado la calidad del código significativamente.',
        improvement: 'Excelente respuesta que muestra liderazgo técnico y habilidades de mentoring'
      }
    ]
  };

  const handleAction = (action: string) => {
    if (action === 'favorite') {
      setIsFavorite(!isFavorite);
      onAction('mark-favorite');
    } else {
      onAction(action);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: new Date(),
      author: 'Arlene McCoy'
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote('');
    setIsAddingNote(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    }
  };

  const getFitColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFitBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-blue-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <>
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={candidate.avatar} />
                <AvatarFallback>
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{candidate.name}</h1>
                  {candidate.linkedInUrl && (
                    <a
                      href={candidate.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="font-medium">LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-gray-600">Postulante a {candidate.position}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <span className={`font-semibold ${getFitColor(candidate.fitPercentage)}`}>
                {candidate.fitPercentage}% Fit
              </span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getFitBgColor(candidate.fitPercentage)}`}
                  style={{ width: `${candidate.fitPercentage}%` }}
                />
              </div>
            </div>
            
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={() => handleAction('favorite')}
              className={isFavorite ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Favorito' : 'Marcar favorito'}
            </Button>
            
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* CV Visual - Lado Izquierdo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Curriculum Vitae
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>

              {/* CV Visual Mockup */}
              <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-[8.5/11] bg-white p-8 text-sm">
                  {/* CV Header */}
                  <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{candidate.name.toUpperCase()}</h1>
                    <p className="text-blue-600 font-semibold text-lg mb-2">{candidate.position}</p>
                    <div className="flex justify-center items-center gap-4 text-gray-600 text-xs">
                      <span>📧 {candidate.email}</span>
                      <span>📱 {candidate.phone}</span>
                      <span>📍 Madrid, España</span>
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300">EXPERIENCIA PROFESIONAL</h2>
                    <div className="space-y-3">
                      {fullProfile.experience.map((job, idx) => (
                        <div key={idx} className="mb-3">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-gray-800">{job.position}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{job.period}</span>
                          </div>
                          <p className="text-blue-600 font-medium text-sm mb-1">{job.company}</p>
                          <p className="text-gray-600 text-xs leading-relaxed">{job.description}</p>
                          <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                            {job.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300">HABILIDADES TÉCNICAS</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 text-sm mb-2">Tecnologías:</h4>
                        <p className="text-xs text-gray-600">{fullProfile.skills.technical.join(', ')}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 text-sm mb-2">Herramientas:</h4>
                        <p className="text-xs text-gray-600">{fullProfile.skills.tools.join(', ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300">EDUCACIÓN</h2>
                    <p className="text-xs text-gray-600">{fullProfile.personalInfo.education}</p>
                  </div>

                  {/* Languages Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300">IDIOMAS</h2>
                    <div className="space-y-1">
                      {fullProfile.skills.languages.map((lang, idx) => (
                        <p key={idx} className="text-xs text-gray-600">{lang}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis y Opciones - Lado Derecho */}
            <div className="space-y-4">
              {/* Análisis de Compatibilidad - Desplegable */}
              <Card>
                <Collapsible open={compatibilityExpanded} onOpenChange={setCompatibilityExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Análisis de Compatibilidad
                        </span>
                        {compatibilityExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Fit General</span>
                            <span className={`font-semibold ${getFitColor(candidate.fitPercentage)}`}>
                              {candidate.fitPercentage}%
                            </span>
                          </div>
                          <Progress value={candidate.fitPercentage} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">100%</div>
                            <div className="text-sm text-gray-600">Req. Obligatorios</div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                              {Math.round((fullProfile.requirements.desirable.filter(req => req.fulfilled).length / fullProfile.requirements.desirable.length) * 100)}%
                            </div>
                            <div className="text-sm text-gray-600">Req. Deseables</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Requisitos Cumplidos
                            </h4>
                            <div className="space-y-2">
                              {[...fullProfile.requirements.mandatory, ...fullProfile.requirements.desirable.filter(req => req.fulfilled)].map((req, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{req.name}</span>
                                  <Badge variant="secondary" className="text-xs">{req.level}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Requisitos Faltantes
                            </h4>
                            <div className="space-y-2">
                              {fullProfile.requirements.desirable.filter(req => !req.fulfilled).map((req, index) => (
                                <div key={index} className="flex items-center justify-between text-sm text-gray-500">
                                  <span>{req.name}</span>
                                  <Badge variant="outline" className="text-xs">{req.level}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Respuestas del Proceso - Desplegable */}
              <Card>
                <Collapsible open={answersExpanded} onOpenChange={setAnswersExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          Respuestas del Proceso
                        </span>
                        {answersExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Respuestas y mejoras durante la postulación
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {fullProfile.applicationAnswers.map((qa, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-600 mb-2">{qa.question}</h4>
                            <p className="text-gray-700 mb-3 text-sm">{qa.answer}</p>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                              <p className="text-sm text-blue-800">
                                <strong>Análisis:</strong> {qa.improvement}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Notas - Desplegable */}
              <Card>
                <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-orange-600" />
                          Notas
                          <Badge variant="secondary" className="ml-2">{notes.length}</Badge>
                        </span>
                        {notesExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Observaciones y comentarios del candidato
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Botón para agregar nueva nota */}
                        {!isAddingNote ? (
                          <Button
                            onClick={() => setIsAddingNote(true)}
                            variant="outline"
                            className="w-full border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar nota
                          </Button>
                        ) : (
                          <div className="space-y-3 border border-orange-200 rounded-lg p-4 bg-orange-50">
                            <Textarea
                              placeholder="Escribe tu nota sobre este candidato..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="min-h-20 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsAddingNote(false);
                                  setNewNote('');
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Guardar nota
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Lista de notas existentes */}
                        {notes.length > 0 && (
                          <div className="space-y-3">
                            <Separator />
                            {notes.map((note) => (
                              <div key={note.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {note.author.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">{note.author}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(note.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {note.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}