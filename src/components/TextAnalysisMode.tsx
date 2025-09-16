import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Bot, Sparkles, ChevronRight, Plus, Trash2, AlertCircle, Wrench, Brain, Star, Edit3, X } from 'lucide-react';
import { CustomPromptBox } from './CustomPromptBox';
import type { JobProfile, ProfileRequirement } from '../App';

interface TextAnalysisModeProps {
  onProfileCreated: (profile: JobProfile) => void;
}

export function TextAnalysisMode({ onProfileCreated }: TextAnalysisModeProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedRequirements, setAnalyzedRequirements] = useState<ProfileRequirement[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [profileTitle, setProfileTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [expandedSynonyms, setExpandedSynonyms] = useState<Record<string, boolean>>({});
  const [synonymsData, setSynonymsData] = useState<Record<string, string[]>>({});
  const [newSynonym, setNewSynonym] = useState<Record<string, string>>({});

  // Simulación de análisis de IA
  const analyzeJobDescription = async () => {
    setIsAnalyzing(true);
    
    // Simular delay de análisis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Análisis simulado basado en palabras clave comunes
    const mockAnalysis = extractRequirementsFromText(jobDescription);
    
    setAnalyzedRequirements(mockAnalysis.requirements);
    setProfileTitle(mockAnalysis.title);
    setShowResults(true);
    setIsAnalyzing(false);
  };

  const extractRequirementsFromText = (text: string) => {
    const lowercaseText = text.toLowerCase();
    const requirements: ProfileRequirement[] = [];
    let id = 0;
    
    // Determinar título del puesto
    let title = 'Perfil Personalizado';
    if (lowercaseText.includes('desarrollador') || lowercaseText.includes('developer')) {
      title = 'Desarrollador';
    } else if (lowercaseText.includes('diseñador') || lowercaseText.includes('designer')) {
      title = 'Diseñador';
    } else if (lowercaseText.includes('ventas') || lowercaseText.includes('sales')) {
      title = 'Especialista en Ventas';
    } else if (lowercaseText.includes('marketing')) {
      title = 'Especialista en Marketing';
    }

    // Experiencia
    const experienceMatches = text.match(/(\d+)\s*años?\s*(de\s*)?experiencia/gi);
    if (experienceMatches) {
      const years = parseInt(experienceMatches[0].match(/\d+/)?.[0] || '3');
      requirements.push({
        id: `req-${id++}`,
        category: 'experience',
        title: 'Experiencia relevante',
        years,
        required: true
      });
    }

    // Herramientas y tecnologías
    const tools = [
      { keywords: ['figma'], title: 'Figma', level: 'intermedio' as const },
      { keywords: ['photoshop', 'adobe'], title: 'Adobe Creative Suite', level: 'intermedio' as const },
      { keywords: ['javascript', 'js'], title: 'JavaScript', level: 'avanzado' as const },
      { keywords: ['react'], title: 'React', level: 'avanzado' as const },
      { keywords: ['python'], title: 'Python', level: 'avanzado' as const },
      { keywords: ['sql', 'base de datos', 'database'], title: 'Bases de datos SQL', level: 'intermedio' as const },
      { keywords: ['git'], title: 'Git', level: 'intermedio' as const },
      { keywords: ['excel'], title: 'Excel', level: 'intermedio' as const },
      { keywords: ['crm', 'salesforce', 'hubspot'], title: 'CRM', level: 'intermedio' as const },
      { keywords: ['google ads', 'adwords'], title: 'Google Ads', level: 'intermedio' as const },
    ];

    tools.forEach(tool => {
      if (tool.keywords.some(keyword => lowercaseText.includes(keyword))) {
        requirements.push({
          id: `req-${id++}`,
          category: 'tools',
          title: tool.title,
          level: tool.level,
          required: true
        });
      }
    });

    // Habilidades técnicas
    const technicalSkills = [
      { keywords: ['seo'], title: 'SEO', level: 'intermedio' as const },
      { keywords: ['ui', 'ux', 'user experience'], title: 'Diseño UX/UI', level: 'avanzado' as const },
      { keywords: ['api', 'rest'], title: 'APIs REST', level: 'intermedio' as const },
      { keywords: ['docker'], title: 'Docker', level: 'básico' as const },
      { keywords: ['scrum', 'agile'], title: 'Metodologías Ágiles', level: 'básico' as const },
    ];

    technicalSkills.forEach(skill => {
      if (skill.keywords.some(keyword => lowercaseText.includes(keyword))) {
        requirements.push({
          id: `req-${id++}`,
          category: 'technical',
          title: skill.title,
          level: skill.level,
          required: true
        });
      }
    });

    // Otras habilidades (consolidando idiomas, habilidades blandas y certificaciones)
    const otherSkills = [
      { keywords: ['inglés', 'english'], title: 'Inglés', level: 'intermedio' as const },
      { keywords: ['comunicación', 'communication'], title: 'Comunicación efectiva', level: 'intermedio' as const },
      { keywords: ['liderazgo', 'leadership'], title: 'Liderazgo', level: 'intermedio' as const },
      { keywords: ['trabajo en equipo', 'teamwork'], title: 'Trabajo en equipo', level: 'intermedio' as const },
      { keywords: ['creatividad', 'creativity'], title: 'Creatividad', level: 'intermedio' as const },
      { keywords: ['resolución de problemas', 'problem solving'], title: 'Resolución de problemas', level: 'intermedio' as const },
      { keywords: ['certificación', 'certification'], title: 'Certificaciones profesionales', level: 'básico' as const },
      { keywords: ['pmp', 'scrum master'], title: 'Certificación PMP/Scrum', level: 'básico' as const }
    ];

    otherSkills.forEach(skill => {
      if (skill.keywords.some(keyword => lowercaseText.includes(keyword))) {
        requirements.push({
          id: `req-${id++}`,
          category: 'other-skills',
          title: skill.title,
          level: skill.level,
          required: false
        });
      }
    });

    return { title, requirements };
  };

  const updateRequirement = (id: string, updates: Partial<ProfileRequirement>) => {
    setAnalyzedRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const toggleSynonyms = (reqId: string) => {
    setExpandedSynonyms(prev => ({ ...prev, [reqId]: !prev[reqId] }));
    
    // Si no hay sinónimos para este requisito, generar algunos iniciales
    if (!synonymsData[reqId]) {
      const requirement = analyzedRequirements.find(req => req.id === reqId);
      if (requirement) {
        const initialSynonyms = generateInitialSynonyms(requirement.title);
        setSynonymsData(prev => ({ ...prev, [reqId]: initialSynonyms }));
      }
    }
  };

  const generateInitialSynonyms = (title: string): string[] => {
    const synonymsMap: Record<string, string[]> = {
      'javascript': ['JS', 'ECMAScript', 'Node.js', 'Javascript'],
      'react': ['ReactJS', 'React.js', 'React Native'],
      'python': ['Python3', 'Py', 'Python 3'],
      'figma': ['Figma Design', 'Figma UI'],
      'photoshop': ['Adobe Photoshop', 'PS', 'Photoshop CC'],
      'excel': ['Microsoft Excel', 'MS Excel', 'Spreadsheets'],
      'sql': ['MySQL', 'PostgreSQL', 'Database', 'Structured Query Language'],
      'git': ['Version Control', 'GitHub', 'GitLab', 'Git SCM'],
      'inglés': ['English', 'Inglés fluido', 'Bilingual'],
      'comunicación': ['Comunicación oral', 'Habilidades de comunicación', 'Communication skills'],
      'liderazgo': ['Leadership', 'Team Lead', 'Management'],
      'trabajo en equipo': ['Teamwork', 'Colaboración', 'Team collaboration'],
      'ux/ui': ['User Experience', 'User Interface', 'UX Design', 'UI Design'],
      'api': ['REST API', 'Web API', 'API Development'],
      'docker': ['Containerization', 'Docker containers'],
      'scrum': ['Agile', 'Scrum Master', 'Agile methodology']
    };

    const lowerTitle = title.toLowerCase();
    for (const [key, synonyms] of Object.entries(synonymsMap)) {
      if (lowerTitle.includes(key)) {
        return synonyms;
      }
    }
    
    // Sinónimos genéricos basados en palabras clave
    if (lowerTitle.includes('experiencia')) {
      return ['Exp.', 'Años de experiencia', 'Background', 'Trayectoria'];
    }
    
    return [`${title} avanzado`, `${title} profesional`, `Experto en ${title}`];
  };

  const addSynonym = (reqId: string) => {
    const synonym = newSynonym[reqId]?.trim();
    if (synonym) {
      setSynonymsData(prev => ({
        ...prev,
        [reqId]: [...(prev[reqId] || []), synonym]
      }));
      setNewSynonym(prev => ({ ...prev, [reqId]: '' }));
    }
  };

  const removeSynonym = (reqId: string, synonymIndex: number) => {
    setSynonymsData(prev => ({
      ...prev,
      [reqId]: prev[reqId]?.filter((_, index) => index !== synonymIndex) || []
    }));
  };

  const generateMoreSynonyms = async (reqId: string) => {
    const requirement = analyzedRequirements.find(req => req.id === reqId);
    if (!requirement) return;

    // Simular generación de IA
    const additionalSynonyms = [
      `${requirement.title} experto`,
      `Especialista en ${requirement.title}`,
      `${requirement.title} senior`,
      `Conocimiento en ${requirement.title}`
    ];

    setSynonymsData(prev => ({
      ...prev,
      [reqId]: [...(prev[reqId] || []), ...additionalSynonyms]
    }));
  };

  const toggleRequirement = (id: string) => {
    setAnalyzedRequirements(prev =>
      prev.map(req => req.id === id ? { ...req, required: !req.required } : req)
    );
  };

  const removeRequirement = (id: string) => {
    setAnalyzedRequirements(prev => prev.filter(req => req.id !== id));
  };

  const addRequirement = (category: ProfileRequirement['category']) => {
    const newReq: ProfileRequirement = {
      id: `custom-${Date.now()}`,
      category,
      title: 'Nuevo requisito',
      level: category === 'experience' ? undefined : 'intermedio',
      years: category === 'experience' ? 1 : undefined,
      required: false
    };
    setAnalyzedRequirements(prev => [...prev, newReq]);
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      experience: 'Experiencia',
      tools: 'Herramientas',
      technical: 'Conocimientos Técnicos',
      'other-skills': 'Otras Habilidades'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      experience: 'bg-blue-100 text-blue-800',
      tools: 'bg-green-100 text-green-800',
      technical: 'bg-purple-100 text-purple-800',
      'other-skills': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateProfile = () => {
    const profile: JobProfile = {
      title: profileTitle,
      requirements: analyzedRequirements,
      customPrompt: customPrompt.trim() || undefined
    };
    onProfileCreated(profile);
  };

  const groupedRequirements = analyzedRequirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, ProfileRequirement[]>);

  const categories: ProfileRequirement['category'][] = ['experience', 'tools', 'technical', 'other-skills'];

  return (
    <div className="space-y-6">
      {!showResults ? (
        <div className="space-y-4">
          <div>
            <Textarea
              id="description"
              placeholder="Pega aquí la descripción completa del puesto, requisitos del candidato ideal, o cualquier información relevante del perfil que buscas..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px]"
            />
            <p className="text-sm text-muted-foreground mt-2">
              La IA analizará el texto y extraerá automáticamente los requisitos del candidato ideal.
            </p>
          </div>
          
          <Button 
            onClick={analyzeJobDescription}
            disabled={!jobDescription.trim() || isAnalyzing}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Analizando perfil con IA...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Analizar y configurar requisitos
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-100">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Análisis completado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-700">
                La IA ha extraído y categorizado automáticamente los requisitos del perfil. 
                Puedes editar, eliminar o agregar nuevos requisitos según sea necesario.
              </CardDescription>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Input
                id="title"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder="Título del perfil detectado"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h4>Requisitos detectados y categorizados</h4>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Marca como obligatorio los requisitos indispensables para el candidato
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addRequirement('tools')}
                  className="flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  Agregar Herramienta
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addRequirement('technical')}
                  className="flex items-center gap-1"
                >
                  <Brain className="w-3 h-3" />
                  Agregar Conocimiento
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addRequirement('other-skills')}
                  className="flex items-center gap-1"
                >
                  <Star className="w-3 h-3" />
                  Agregar Habilidad
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {categories.map((category) => {
                const categoryReqs = groupedRequirements[category] || [];
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className={getCategoryColor(category)}>
                        {getCategoryLabel(category)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 pl-4">
                      {categoryReqs.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2 border-2 border-dashed border-muted rounded-lg text-center">
                          No hay requisitos en esta categoría.
                        </div>
                      ) : (
                        categoryReqs.map((req) => (
                          <div key={req.id} className="space-y-3">
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="flex-1">
                                <Input
                                  value={req.title}
                                  onChange={(e) => updateRequirement(req.id, { title: e.target.value })}
                                  className="border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                                  placeholder="Nombre del requisito"
                                />
                              </div>

                              {req.level !== undefined && (
                                <Select
                                  value={req.level}
                                  onValueChange={(value) => 
                                    updateRequirement(req.id, { level: value as any })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="básico">Básico</SelectItem>
                                    <SelectItem value="intermedio">Intermedio</SelectItem>
                                    <SelectItem value="avanzado">Avanzado</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}

                              {req.years !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={req.years}
                                    onChange={(e) => 
                                      updateRequirement(req.id, { years: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-16"
                                    min="0"
                                    max="20"
                                  />
                                  <span className="text-sm text-muted-foreground">años</span>
                                </div>
                              )}

                              <div className="flex flex-col items-center gap-1">
                                <Switch
                                  checked={req.required}
                                  onCheckedChange={() => toggleRequirement(req.id)}
                                />
                                <span className="text-xs text-muted-foreground text-center">
                                  {req.required ? 'Obligatorio' : 'Opcional'}
                                </span>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSynonyms(req.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Configurar sinónimos"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRequirement(req.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Panel de sinónimos */}
                            {expandedSynonyms[req.id] && (
                              <div className="ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                                <div className="mb-3">
                                  <h5 className="font-medium text-gray-900 mb-1">Sinónimos y palabras similares</h5>
                                  <p className="text-sm text-gray-600">
                                    La IA buscará estas palabras en los CVs para detectar este requisito
                                  </p>
                                </div>

                                {/* Lista de sinónimos existentes */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {(synonymsData[req.id] || []).map((synonym, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border text-sm">
                                      <span>{synonym}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSynonym(req.id, index)}
                                        className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                {/* Agregar nuevo sinónimo */}
                                <div className="flex gap-2 mb-3">
                                  <Input
                                    placeholder="Agregar sinónimo..."
                                    value={newSynonym[req.id] || ''}
                                    onChange={(e) => setNewSynonym(prev => ({ ...prev, [req.id]: e.target.value }))}
                                    className="flex-1"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addSynonym(req.id);
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => addSynonym(req.id)}
                                    disabled={!newSynonym[req.id]?.trim()}
                                  >
                                    Agregar
                                  </Button>
                                </div>

                                {/* Botón para sugerir más sinónimos */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateMoreSynonyms(req.id)}
                                  className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Sugerir similares con IA
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addRequirement(category)}
                        className="w-full flex items-center gap-1 mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar {getCategoryLabel(category)}
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(groupedRequirements).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No se detectaron requisitos automáticamente.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agrega requisitos manualmente usando los botones superiores.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <CustomPromptBox 
              value={customPrompt}
              onChange={setCustomPrompt}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                  setAnalyzedRequirements([]);
                  setProfileTitle('');
                  setCustomPrompt('');
                }}
              >
                Analizar nuevo texto
              </Button>
              <Button 
                onClick={handleCreateProfile}
                disabled={analyzedRequirements.length === 0}
                className="flex items-center gap-2 flex-1"
              >
                Continuar al Resumen
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}