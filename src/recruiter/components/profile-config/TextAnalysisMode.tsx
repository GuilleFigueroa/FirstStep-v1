import { useState } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Textarea } from '../../../ui/components/ui/textarea';
import { Label } from '../../../ui/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Badge } from '../../../ui/components/ui/badge';
import { Switch } from '../../../ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { Input } from '../../../ui/components/ui/input';
import { Separator } from '../../../ui/components/ui/separator';
import { Bot, Sparkles, ChevronRight, Plus, Trash2, AlertCircle, AlertTriangle, Wrench, Brain, Star, Edit3, X, Info, Award, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../ui/components/ui/tooltip';
import { CustomPromptBox } from './CustomPromptBox';
import type { JobProfile, ProfileRequirement } from '../../../app/App';

interface TextAnalysisModeProps {
  onProfileCreated: (profile: JobProfile) => void;
}

export function TextAnalysisMode({ onProfileCreated }: TextAnalysisModeProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mandatoryRequirements, setMandatoryRequirements] = useState<ProfileRequirement[]>([]);
  const [optionalRequirements, setOptionalRequirements] = useState<ProfileRequirement[]>([]);
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

    const mandatory = mockAnalysis.requirements.filter(r => r.required);
    const optional = mockAnalysis.requirements.filter(r => !r.required);

    setMandatoryRequirements(mandatory);
    setOptionalRequirements(optional);
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

    // Tech/IT - Específicos primero, genéricos al final
    if (lowercaseText.includes('fullstack developer') || lowercaseText.includes('full stack developer') || lowercaseText.includes('full-stack developer')) {
      title = 'Fullstack Developer';
    } else if (lowercaseText.includes('frontend developer') || lowercaseText.includes('front-end developer')) {
      title = 'Frontend Developer';
    } else if (lowercaseText.includes('backend developer') || lowercaseText.includes('back-end developer')) {
      title = 'Backend Developer';
    } else if (lowercaseText.includes('mobile developer') || lowercaseText.includes('desarrollador móvil')) {
      title = 'Desarrollador Mobile';
    } else if (lowercaseText.includes('fullstack') || lowercaseText.includes('full stack')) {
      title = 'Desarrollador Full Stack';
    } else if (lowercaseText.includes('frontend') || lowercaseText.includes('front-end')) {
      title = 'Desarrollador Frontend';
    } else if (lowercaseText.includes('backend') || lowercaseText.includes('back-end')) {
      title = 'Desarrollador Backend';
    } else if (lowercaseText.includes('data scientist') || lowercaseText.includes('científico de datos')) {
      title = 'Data Scientist';
    } else if (lowercaseText.includes('data engineer') || lowercaseText.includes('ingeniero de datos')) {
      title = 'Data Engineer';
    } else if (lowercaseText.includes('software architect') || lowercaseText.includes('arquitecto de software')) {
      title = 'Arquitecto de Software';
    } else if (lowercaseText.includes('devops') || lowercaseText.includes('sre')) {
      title = 'DevOps Engineer';
    } else if (lowercaseText.includes('quality assurance') || lowercaseText.includes('qa') || lowercaseText.includes('tester')) {
      title = 'QA Engineer';
    } else if (lowercaseText.includes('tech lead') || lowercaseText.includes('líder técnico')) {
      title = 'Tech Lead';
    } else if (lowercaseText.includes('desarrollador') || lowercaseText.includes('developer') || lowercaseText.includes('programmer')) {
      title = 'Desarrollador';

    // Diseño/UX - Específicos primero, genéricos al final
    } else if (lowercaseText.includes('product designer') || lowercaseText.includes('diseñador de producto')) {
      title = 'Product Designer';
    } else if (lowercaseText.includes('graphic designer') || lowercaseText.includes('diseñador gráfico')) {
      title = 'Diseñador Gráfico';
    } else if (lowercaseText.includes('ux') || lowercaseText.includes('user experience')) {
      title = 'Diseñador UX/UI';
    } else if (lowercaseText.includes('diseñador') || lowercaseText.includes('designer')) {
      title = 'Diseñador';

    // Marketing/Growth - Específicos primero, genéricos al final
    } else if (lowercaseText.includes('digital marketing') || lowercaseText.includes('marketing digital')) {
      title = 'Especialista en Marketing Digital';
    } else if (lowercaseText.includes('content marketing') || lowercaseText.includes('marketing de contenidos')) {
      title = 'Content Marketer';
    } else if (lowercaseText.includes('seo specialist') || lowercaseText.includes('especialista seo')) {
      title = 'Especialista SEO';
    } else if (lowercaseText.includes('growth hacker') || lowercaseText.includes('growth')) {
      title = 'Growth Hacker';
    } else if (lowercaseText.includes('marketing')) {
      title = 'Especialista en Marketing';

    // Ventas - Específicos primero, genéricos al final
    } else if (lowercaseText.includes('account executive') || lowercaseText.includes('ejecutivo de cuentas')) {
      title = 'Account Executive';
    } else if (lowercaseText.includes('sales manager') || lowercaseText.includes('gerente de ventas')) {
      title = 'Gerente de Ventas';
    } else if (lowercaseText.includes('business development') || lowercaseText.includes('bdr')) {
      title = 'Business Development Representative';
    } else if (lowercaseText.includes('sales development') || lowercaseText.includes('sdr')) {
      title = 'Sales Development Representative';
    } else if (lowercaseText.includes('ventas') || lowercaseText.includes('sales')) {
      title = 'Especialista en Ventas';

    // Finanzas/Contabilidad
    } else if (lowercaseText.includes('contador') || lowercaseText.includes('accountant')) {
      title = 'Contador';
    } else if (lowercaseText.includes('analista financiero') || lowercaseText.includes('financial analyst')) {
      title = 'Analista Financiero';
    } else if (lowercaseText.includes('controller') || lowercaseText.includes('controlador')) {
      title = 'Controller';
    } else if (lowercaseText.includes('cfo') || lowercaseText.includes('director financiero')) {
      title = 'CFO';
    } else if (lowercaseText.includes('auditor') || lowercaseText.includes('auditoría')) {
      title = 'Auditor';
    } else if (lowercaseText.includes('tesorero') || lowercaseText.includes('treasurer')) {
      title = 'Tesorero';

    // RRHH
    } else if (lowercaseText.includes('recruiter') || lowercaseText.includes('reclutador')) {
      title = 'Reclutador';
    } else if (lowercaseText.includes('hr manager') || lowercaseText.includes('gerente de rrhh')) {
      title = 'HR Manager';
    } else if (lowercaseText.includes('talent acquisition') || lowercaseText.includes('adquisición de talento')) {
      title = 'Talent Acquisition Specialist';
    } else if (lowercaseText.includes('hr business partner') || lowercaseText.includes('hrbp')) {
      title = 'HR Business Partner';

    // Legal
    } else if (lowercaseText.includes('abogado') || lowercaseText.includes('lawyer') || lowercaseText.includes('attorney')) {
      title = 'Abogado';
    } else if (lowercaseText.includes('legal counsel') || lowercaseText.includes('asesor legal')) {
      title = 'Legal Counsel';
    } else if (lowercaseText.includes('compliance officer') || lowercaseText.includes('oficial de cumplimiento')) {
      title = 'Compliance Officer';

    // Operaciones/Logística
    } else if (lowercaseText.includes('operations manager') || lowercaseText.includes('gerente de operaciones')) {
      title = 'Gerente de Operaciones';
    } else if (lowercaseText.includes('supply chain') || lowercaseText.includes('cadena de suministro')) {
      title = 'Supply Chain Manager';
    } else if (lowercaseText.includes('logistics') || lowercaseText.includes('logística')) {
      title = 'Coordinador de Logística';
    } else if (lowercaseText.includes('procurement') || lowercaseText.includes('comprador')) {
      title = 'Procurement Specialist';

    // Product Management
    } else if (lowercaseText.includes('product manager') || lowercaseText.includes('gerente de producto')) {
      title = 'Product Manager';
    } else if (lowercaseText.includes('product owner') || lowercaseText.includes('dueño de producto')) {
      title = 'Product Owner';
    } else if (lowercaseText.includes('scrum master')) {
      title = 'Scrum Master';
    } else if (lowercaseText.includes('project manager') || lowercaseText.includes('gerente de proyectos')) {
      title = 'Project Manager';

    // Customer Success/Support
    } else if (lowercaseText.includes('customer success') || lowercaseText.includes('éxito del cliente')) {
      title = 'Customer Success Manager';
    } else if (lowercaseText.includes('customer support') || lowercaseText.includes('soporte al cliente')) {
      title = 'Customer Support Specialist';
    } else if (lowercaseText.includes('customer service') || lowercaseText.includes('servicio al cliente')) {
      title = 'Customer Service Representative';

    // Administración
    } else if (lowercaseText.includes('executive assistant') || lowercaseText.includes('asistente ejecutivo')) {
      title = 'Executive Assistant';
    } else if (lowercaseText.includes('office manager') || lowercaseText.includes('gerente de oficina')) {
      title = 'Office Manager';
    } else if (lowercaseText.includes('administrative assistant') || lowercaseText.includes('asistente administrativo')) {
      title = 'Administrative Assistant';
    }

    // Experiencia
    const experienceMatches = text.match(/(\d+)\s*años?\s*(de\s*)?experiencia/gi);
    if (experienceMatches) {
      const years = parseInt(experienceMatches[0].match(/\d+/)?.[0] || '3');
      requirements.push({
        id: `req-${id++}`,
        category: 'experience',
        title: `Experiencia como ${title}`,
        years,
        required: true
      });
    }

    // Herramientas y tecnologías
    const tools = [
      // Frontend
      { keywords: ['javascript', 'js'], title: 'JavaScript', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['typescript', 'ts'], title: 'TypeScript', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['react', 'reactjs'], title: 'React', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['angular', 'angularjs'], title: 'Angular', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['vue', 'vuejs', 'vue.js'], title: 'Vue.js', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['next', 'nextjs', 'next.js'], title: 'Next.js', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['html', 'html5'], title: 'HTML/HTML5', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['css', 'css3'], title: 'CSS/CSS3', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['bootstrap'], title: 'Bootstrap', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['tailwind', 'tailwindcss'], title: 'Tailwind CSS', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['sass', 'scss'], title: 'Sass/SCSS', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['webpack'], title: 'Webpack', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['jquery'], title: 'jQuery', level: 'intermedio (2-4 años de experiencia)' as const },

      // Backend
      { keywords: ['node', 'nodejs', 'node.js'], title: 'Node.js', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['python'], title: 'Python', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['java'], title: 'Java', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['c#', 'csharp'], title: 'C#', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['.net', 'dotnet'], title: '.NET', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['php'], title: 'PHP', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['laravel'], title: 'Laravel', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['symfony'], title: 'Symfony', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['ruby', 'rails', 'ruby on rails'], title: 'Ruby on Rails', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['go', 'golang'], title: 'Go', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['django'], title: 'Django', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['flask'], title: 'Flask', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['spring', 'spring boot'], title: 'Spring Boot', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['express', 'expressjs'], title: 'Express.js', level: 'intermedio (2-4 años de experiencia)' as const },

      // Bases de datos
      { keywords: ['sql', 'base de datos', 'database'], title: 'Bases de datos SQL', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['mongodb', 'mongo'], title: 'MongoDB', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['postgresql', 'postgres'], title: 'PostgreSQL', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['mysql'], title: 'MySQL', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['redis'], title: 'Redis', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['oracle'], title: 'Oracle Database', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['firebase'], title: 'Firebase', level: 'básico (0-2 años de experiencia)' as const },

      // Cloud & DevOps
      { keywords: ['aws', 'amazon web services'], title: 'AWS', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['azure', 'microsoft azure'], title: 'Azure', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['gcp', 'google cloud'], title: 'Google Cloud Platform', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['kubernetes', 'k8s'], title: 'Kubernetes', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['jenkins'], title: 'Jenkins', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['ci/cd', 'continuous integration'], title: 'CI/CD', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['terraform'], title: 'Terraform', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['git', 'github', 'gitlab', 'bitbucket'], title: 'Git', level: 'intermedio (2-4 años de experiencia)' as const },

      // Diseño
      { keywords: ['figma'], title: 'Figma', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['photoshop', 'adobe photoshop'], title: 'Adobe Photoshop', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['sketch'], title: 'Sketch', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['xd', 'adobe xd'], title: 'Adobe XD', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['illustrator', 'adobe illustrator'], title: 'Adobe Illustrator', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['indesign', 'adobe indesign'], title: 'Adobe InDesign', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['canva'], title: 'Canva', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['framer'], title: 'Framer', level: 'básico (0-2 años de experiencia)' as const },

      // Herramientas de colaboración
      { keywords: ['jira'], title: 'Jira', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['confluence'], title: 'Confluence', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['trello'], title: 'Trello', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['asana'], title: 'Asana', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['slack'], title: 'Slack', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['teams', 'microsoft teams'], title: 'Microsoft Teams', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['notion'], title: 'Notion', level: 'básico (0-2 años de experiencia)' as const },

      // Analytics & BI
      { keywords: ['tableau'], title: 'Tableau', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['power bi', 'powerbi'], title: 'Power BI', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['google analytics', 'analytics'], title: 'Google Analytics', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['looker'], title: 'Looker', level: 'intermedio (2-4 años de experiencia)' as const },

      // Office & Productivity
      { keywords: ['excel', 'microsoft excel', 'spreadsheets'], title: 'Excel', level: 'intermedio (2-4 años de experiencia)' as const },

      // CRM & Marketing
      { keywords: ['crm', 'salesforce', 'hubspot'], title: 'CRM (Salesforce/HubSpot)', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['zoho'], title: 'Zoho CRM', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['pipedrive'], title: 'Pipedrive', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['google ads', 'adwords'], title: 'Google Ads', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['mailchimp'], title: 'Mailchimp', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['facebook ads', 'meta ads'], title: 'Facebook Ads', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['linkedin ads'], title: 'LinkedIn Ads', level: 'básico (0-2 años de experiencia)' as const },

      // RRHH & Recruiting
      { keywords: ['workday'], title: 'Workday', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['bamboohr'], title: 'BambooHR', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['greenhouse'], title: 'Greenhouse', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['lever'], title: 'Lever', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['linkedin recruiter'], title: 'LinkedIn Recruiter', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['ats', 'applicant tracking system'], title: 'ATS', level: 'básico (0-2 años de experiencia)' as const },

      // Contabilidad & Finanzas
      { keywords: ['quickbooks'], title: 'QuickBooks', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['sap', 'sap erp'], title: 'SAP', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['netsuite'], title: 'NetSuite', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['xero'], title: 'Xero', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['sage'], title: 'Sage', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['oracle financials'], title: 'Oracle Financials', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['contabilidad', 'accounting'], title: 'Contabilidad', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['gaap'], title: 'GAAP', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['ifrs'], title: 'IFRS', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['financial modeling', 'modelado financiero'], title: 'Modelado Financiero', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['bloomberg', 'bloomberg terminal'], title: 'Bloomberg Terminal', level: 'avanzado (5+ años de experiencia)' as const },

      // ERP Systems
      { keywords: ['erp'], title: 'ERP Systems', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['odoo'], title: 'Odoo', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['microsoft dynamics'], title: 'Microsoft Dynamics', level: 'intermedio (2-4 años de experiencia)' as const },

      // Operaciones & Logística
      { keywords: ['supply chain', 'cadena de suministro'], title: 'Supply Chain Management', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['logistics', 'logística'], title: 'Logística', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['inventory management', 'gestión de inventario'], title: 'Gestión de Inventario', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['warehouse management', 'wms'], title: 'Warehouse Management', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['procurement', 'compras'], title: 'Procurement', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['lean', 'lean manufacturing'], title: 'Lean Manufacturing', level: 'intermedio (2-4 años de experiencia)' as const },

      // Atención al Cliente
      { keywords: ['zendesk'], title: 'Zendesk', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['intercom'], title: 'Intercom', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['freshdesk'], title: 'Freshdesk', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['customer service', 'servicio al cliente'], title: 'Customer Service', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['help desk'], title: 'Help Desk', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['ticketing system'], title: 'Ticketing Systems', level: 'básico (0-2 años de experiencia)' as const },

      // Office Suite
      { keywords: ['word', 'microsoft word'], title: 'Microsoft Word', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['powerpoint', 'microsoft powerpoint'], title: 'PowerPoint', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['outlook', 'microsoft outlook'], title: 'Outlook', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['google workspace', 'google docs', 'google sheets'], title: 'Google Workspace', level: 'básico (0-2 años de experiencia)' as const },
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
      // Diseño & UX
      { keywords: ['ui', 'ux', 'user experience', 'user interface'], title: 'Diseño UX/UI', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['user research', 'investigación de usuarios'], title: 'Investigación de Usuarios', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['usability', 'usabilidad'], title: 'Usabilidad', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['wireframes', 'wireframing'], title: 'Wireframing', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['prototyping', 'prototipado'], title: 'Prototipado', level: 'intermedio (2-4 años de experiencia)' as const },

      // APIs & Web Services
      { keywords: ['api', 'rest', 'restful'], title: 'APIs REST', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['api design', 'diseño de apis'], title: 'Diseño de APIs', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['graphql'], title: 'GraphQL', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['websockets', 'real-time'], title: 'WebSockets', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['soap', 'xml'], title: 'SOAP/XML', level: 'intermedio (2-4 años de experiencia)' as const },

      // Metodologías & Prácticas
      { keywords: ['scrum', 'agile', 'metodologías ágiles'], title: 'Metodologías Ágiles', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['tdd', 'test driven development'], title: 'TDD', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['testing', 'unit testing', 'pruebas'], title: 'Testing', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['clean code', 'código limpio'], title: 'Clean Code', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['refactoring', 'refactorización'], title: 'Refactoring', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['microservices', 'microservicios'], title: 'Microservicios', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['software architecture', 'arquitectura de software', 'design patterns'], title: 'Arquitectura de Software', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['devops'], title: 'DevOps', level: 'intermedio (2-4 años de experiencia)' as const },

      // Desarrollo Móvil
      { keywords: ['react native', 'mobile development'], title: 'React Native', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['flutter', 'dart'], title: 'Flutter', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['ios', 'swift', 'objective-c'], title: 'Desarrollo iOS', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['android', 'kotlin'], title: 'Desarrollo Android', level: 'avanzado (5+ años de experiencia)' as const },

      // Seguridad
      { keywords: ['cybersecurity', 'ciberseguridad', 'security'], title: 'Ciberseguridad', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['oauth', 'authentication', 'autenticación'], title: 'OAuth/Autenticación', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['encryption', 'encriptación', 'ssl', 'tls'], title: 'Encriptación/SSL', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['penetration testing', 'pentesting'], title: 'Pentesting', level: 'avanzado (5+ años de experiencia)' as const },

      // Data Science & AI
      { keywords: ['machine learning', 'ml', 'aprendizaje automático'], title: 'Machine Learning', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['data science', 'ciencia de datos'], title: 'Data Science', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['big data', 'hadoop', 'spark'], title: 'Big Data', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['artificial intelligence', 'ai', 'inteligencia artificial'], title: 'Inteligencia Artificial', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['deep learning', 'neural networks'], title: 'Deep Learning', level: 'avanzado (5+ años de experiencia)' as const },

      // Performance & Optimization
      { keywords: ['optimization', 'optimización', 'performance'], title: 'Optimización de Performance', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['caching', 'cache'], title: 'Caching', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['load balancing', 'balanceo de carga'], title: 'Load Balancing', level: 'intermedio (2-4 años de experiencia)' as const },

      // Marketing Digital
      { keywords: ['seo', 'search engine optimization'], title: 'SEO', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['sem', 'search engine marketing'], title: 'SEM', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['marketing automation'], title: 'Marketing Automation', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['content marketing', 'marketing de contenidos'], title: 'Marketing de Contenidos', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['social media marketing', 'redes sociales'], title: 'Social Media Marketing', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['email marketing'], title: 'Email Marketing', level: 'básico (0-2 años de experiencia)' as const },

      // Ventas
      { keywords: ['sales pipeline', 'pipeline de ventas'], title: 'Sales Pipeline Management', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['lead generation', 'generación de leads'], title: 'Generación de Leads', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['prospecting', 'prospección'], title: 'Prospección', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['cold calling'], title: 'Cold Calling', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['account management', 'gestión de cuentas'], title: 'Account Management', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['sales forecasting', 'pronóstico de ventas'], title: 'Sales Forecasting', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['negotiation', 'negociación'], title: 'Negociación', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['closing', 'cierre de ventas'], title: 'Cierre de Ventas', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['b2b sales', 'ventas b2b'], title: 'Ventas B2B', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['b2c sales', 'ventas b2c'], title: 'Ventas B2C', level: 'intermedio (2-4 años de experiencia)' as const },

      // Finanzas & Contabilidad
      { keywords: ['financial analysis', 'análisis financiero'], title: 'Análisis Financiero', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['budgeting', 'presupuestos'], title: 'Presupuestos', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['forecasting', 'pronósticos'], title: 'Pronósticos Financieros', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['auditing', 'auditoría'], title: 'Auditoría', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['tax', 'impuestos', 'taxation'], title: 'Impuestos', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['accounts payable', 'cuentas por pagar'], title: 'Cuentas por Pagar', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['accounts receivable', 'cuentas por cobrar'], title: 'Cuentas por Cobrar', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['reconciliation', 'conciliación'], title: 'Conciliación Bancaria', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['payroll', 'nómina'], title: 'Nómina', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['valuation', 'valuación'], title: 'Valuación', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['m&a', 'mergers and acquisitions', 'fusiones'], title: 'M&A', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['investment analysis', 'análisis de inversiones'], title: 'Análisis de Inversiones', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['risk management', 'gestión de riesgos'], title: 'Gestión de Riesgos', level: 'avanzado (5+ años de experiencia)' as const },

      // Legal & Compliance
      { keywords: ['contract law', 'derecho contractual'], title: 'Derecho Contractual', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['compliance', 'cumplimiento normativo'], title: 'Compliance', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['regulatory', 'regulatorio'], title: 'Regulatorio', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['due diligence'], title: 'Due Diligence', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['intellectual property', 'propiedad intelectual'], title: 'Propiedad Intelectual', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['corporate law', 'derecho corporativo'], title: 'Derecho Corporativo', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['litigation', 'litigio'], title: 'Litigio', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['labor law', 'derecho laboral'], title: 'Derecho Laboral', level: 'avanzado (5+ años de experiencia)' as const },
      { keywords: ['gdpr', 'data protection'], title: 'GDPR/Protección de Datos', level: 'intermedio (2-4 años de experiencia)' as const },

      // RRHH
      { keywords: ['recruiting', 'reclutamiento'], title: 'Reclutamiento', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['talent acquisition', 'adquisición de talento'], title: 'Adquisición de Talento', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['onboarding'], title: 'Onboarding', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['employee relations', 'relaciones laborales'], title: 'Relaciones Laborales', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['compensation', 'compensación'], title: 'Compensación y Beneficios', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['performance management', 'gestión del desempeño'], title: 'Gestión del Desempeño', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['training', 'capacitación'], title: 'Capacitación', level: 'básico (0-2 años de experiencia)' as const },

      // Administración & Operaciones
      { keywords: ['project management', 'gestión de proyectos'], title: 'Gestión de Proyectos', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['process improvement', 'mejora de procesos'], title: 'Mejora de Procesos', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['quality assurance', 'aseguramiento de calidad'], title: 'Aseguramiento de Calidad', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['vendor management', 'gestión de proveedores'], title: 'Gestión de Proveedores', level: 'intermedio (2-4 años de experiencia)' as const },

      // Contenedores & Orquestación (ya incluido Docker en tools, pero agregamos conceptos)
      { keywords: ['containerization', 'contenedores'], title: 'Containerización', level: 'intermedio (2-4 años de experiencia)' as const },
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

    // Otras habilidades (idiomas y certificaciones - opcionales por defecto)
    const otherSkills = [
      // Idiomas
      { keywords: ['inglés', 'english', 'inglés fluido', 'english fluent', 'business english'], title: 'Inglés', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['francés', 'french', 'français'], title: 'Francés', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['alemán', 'german', 'deutsch'], title: 'Alemán', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['portugués', 'portuguese', 'português'], title: 'Portugués', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['chino', 'mandarín', 'chinese', 'mandarin'], title: 'Chino/Mandarín', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['italiano', 'italian'], title: 'Italiano', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['bilingüe', 'bilingual'], title: 'Bilingüe', level: 'avanzado (5+ años de experiencia)' as const },

      // Certificaciones Cloud
      { keywords: ['aws certified', 'aws certification'], title: 'AWS Certified', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['azure certified', 'microsoft certified'], title: 'Microsoft Azure Certified', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['gcp certified', 'google certified'], title: 'Google Cloud Certified', level: 'intermedio (2-4 años de experiencia)' as const },

      // Certificaciones Ágiles & PM
      { keywords: ['csm', 'certified scrum master'], title: 'Certified Scrum Master', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['psm', 'professional scrum master'], title: 'Professional Scrum Master', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['cspo', 'certified scrum product owner'], title: 'Certified Scrum Product Owner', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['pmp', 'project management professional'], title: 'PMP', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['prince2'], title: 'PRINCE2', level: 'intermedio (2-4 años de experiencia)' as const },
      { keywords: ['safe', 'scaled agile'], title: 'SAFe', level: 'básico (0-2 años de experiencia)' as const },

      // Certificaciones Calidad
      { keywords: ['six sigma', 'lean six sigma'], title: 'Six Sigma', level: 'intermedio (2-4 años de experiencia)' as const },

      // Certificaciones IT & Seguridad
      { keywords: ['itil', 'itil certified'], title: 'ITIL', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['comptia', 'comptia security+'], title: 'CompTIA', level: 'básico (0-2 años de experiencia)' as const },
      { keywords: ['cissp', 'certified information systems security'], title: 'CISSP', level: 'avanzado (5+ años de experiencia)' as const },

      // Certificaciones Genéricas
      { keywords: ['certificación', 'certification', 'certified'], title: 'Certificaciones profesionales', level: 'básico (0-2 años de experiencia)' as const },
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
    setMandatoryRequirements(prev =>
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
    setOptionalRequirements(prev =>
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const toggleSynonyms = (reqId: string) => {
    setExpandedSynonyms(prev => ({ ...prev, [reqId]: !prev[reqId] }));

    // Si no hay sinónimos para este requisito, generar algunos iniciales
    if (!synonymsData[reqId]) {
      const requirement = allRequirements.find(req => req.id === reqId);
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
    const requirement = allRequirements.find(req => req.id === reqId);
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
    // Buscar en qué array está el requisito
    const mandatoryReq = mandatoryRequirements.find(r => r.id === id);
    const optionalReq = optionalRequirements.find(r => r.id === id);

    if (mandatoryReq) {
      // Mover de mandatory a optional - actualizar ambos arrays en batch
      const newMandatory = mandatoryRequirements.filter(r => r.id !== id);
      const newOptional = [...optionalRequirements, { ...mandatoryReq, required: false }];
      setMandatoryRequirements(newMandatory);
      setOptionalRequirements(newOptional);
    } else if (optionalReq) {
      // Mover de optional a mandatory - actualizar ambos arrays en batch
      const newOptional = optionalRequirements.filter(r => r.id !== id);
      const newMandatory = [...mandatoryRequirements, { ...optionalReq, required: true }];
      setOptionalRequirements(newOptional);
      setMandatoryRequirements(newMandatory);
    }
  };

  const removeRequirement = (id: string) => {
    setMandatoryRequirements(prev => prev.filter(req => req.id !== id));
    setOptionalRequirements(prev => prev.filter(req => req.id !== id));
  };

  const addRequirement = (category: ProfileRequirement['category']) => {
    const newReq: ProfileRequirement = {
      id: `custom-${Date.now()}`,
      category,
      title: 'Nuevo requisito',
      level: category === 'experience' || category === 'certifications' ? undefined : 'intermedio',
      years: category === 'experience' ? 1 : undefined,
      required: false
    };
    setOptionalRequirements(prev => [...prev, newReq]);
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      experience: 'Experiencia',
      tools: 'Herramientas',
      technical: 'Conocimientos Técnicos',
      certifications: 'Certificaciones',
      'other-skills': 'Otras Habilidades'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      experience: 'bg-blue-100 text-blue-800',
      tools: 'bg-green-100 text-green-800',
      technical: 'bg-purple-100 text-purple-800',
      certifications: 'bg-yellow-100 text-yellow-800',
      'other-skills': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateProfile = () => {
    const profile: JobProfile = {
      title: profileTitle,
      mandatoryRequirements,
      optionalRequirements,
      customPrompt: customPrompt.trim() || undefined
    };
    onProfileCreated(profile);
  };

  const allRequirements = [...mandatoryRequirements, ...optionalRequirements].sort((a, b) => {
    // Mantener orden de inserción original basado en el ID
    const aNum = parseInt(a.id.split('-')[1] || '0');
    const bNum = parseInt(b.id.split('-')[1] || '0');
    return aNum - bNum;
  });

  const groupedRequirements = allRequirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, ProfileRequirement[]>);

  const categories: ProfileRequirement['category'][] = ['experience', 'tools', 'technical', 'certifications', 'other-skills'];

  return (
    <div className="space-y-6">
      {!showResults ? (
        <div className="space-y-4">
          <Textarea
            id="description"
            placeholder="Pega aquí la descripción completa del puesto, requisitos del candidato ideal, o cualquier información relevante del perfil que buscas..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[200px]"
          />

          <Button
            onClick={analyzeJobDescription}
            disabled={!jobDescription.trim() || isAnalyzing}
            className="flex items-center justify-center gap-2 mx-auto"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Analizando perfil...
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
          {/* Badge de análisis completado */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg w-fit">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Análisis completado</span>
          </div>

          {/* Card de advertencia */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <CardTitle className="text-red-800">Importante</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-red-700 space-y-2 list-disc list-inside">
                <li>
                  Los <strong>requisitos obligatorios</strong> funcionan como filtro. Si los candidatos no comprueban
                  claramente tener esos requisitos serán descartados del proceso.
                </li>
                <li>
                  Se recomienda seleccionar hasta un <strong>máximo de 5 requisitos obligatorios</strong>.
                </li>
                <li>
                  Los <strong>requisitos opcionales</strong> también se analizan pero en un orden de prioridad inferior
                  a los obligatorios y forman parte de la evaluación final.
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Nombre del Puesto
              </Label>
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
                  onClick={() => addRequirement('certifications')}
                  className="flex items-center gap-1"
                >
                  <Award className="w-3 h-3" />
                  Agregar Certificación
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
                                    <SelectValue>
                                      {req.level?.includes('básico') && 'Básico'}
                                      {req.level?.includes('intermedio') && 'Intermedio'}
                                      {req.level?.includes('avanzado') && 'Avanzado'}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="básico (0-2 años de experiencia)">
                                      <div className="flex flex-col">
                                        <span className="font-medium">Básico</span>
                                        <span className="text-xs text-muted-foreground">0-2 años de experiencia</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="intermedio (2-4 años de experiencia)">
                                      <div className="flex flex-col">
                                        <span className="font-medium">Intermedio</span>
                                        <span className="text-xs text-muted-foreground">2-4 años de experiencia</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="avanzado (5+ años de experiencia)">
                                      <div className="flex flex-col">
                                        <span className="font-medium">Avanzado</span>
                                        <span className="text-xs text-muted-foreground">5+ años de experiencia</span>
                                      </div>
                                    </SelectItem>
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
                                  style={!req.required ? { backgroundColor: '#E879F9' } : undefined}
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
                                  <div className="flex items-center gap-1">
                                    <p className="text-sm text-gray-600">
                                      El sistema ya reconoce variaciones y sinónimos automáticamente
                                    </p>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="w-4 h-4 text-red-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>El sistema ya reconoce variaciones y sinónimos automáticamente</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
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
                  setMandatoryRequirements([]);
                  setOptionalRequirements([]);
                  setProfileTitle('');
                  setCustomPrompt('');
                }}
              >
                Analizar nuevo texto
              </Button>
              <Button
                onClick={handleCreateProfile}
                disabled={mandatoryRequirements.length === 0 && optionalRequirements.length === 0}
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