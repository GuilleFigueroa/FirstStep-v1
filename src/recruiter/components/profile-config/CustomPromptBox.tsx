import { useState } from 'react';
import { Textarea } from '../../../ui/components/ui/textarea';
import { Label } from '../../../ui/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Badge } from '../../../ui/components/ui/badge';
import { Sparkles, Lightbulb } from 'lucide-react';

interface CustomPromptBoxProps {
  value: string;
  onChange: (value: string) => void;
}

const promptExamples = [
  "Priorizar candidatos con experiencia en SaaS",
  "Buscar perfiles que hayan trabajado en startups de menos de 100 empleados",
  "Valorar especialmente candidatos con experiencia internacional",
  "Dar preferencia a candidatos que muestren liderazgo técnico",
  "Priorizar candidatos con experiencia en metodologías ágiles",
  "Buscar perfiles con experiencia en industrias reguladas",
  "Valorar candidatos con certificaciones en la nube (AWS, Azure, GCP)",
  "Priorizar candidatos que hayan trabajado en equipos remotos",
];

export function CustomPromptBox({ value, onChange }: CustomPromptBoxProps) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const handleExampleClick = (example: string) => {
    if (value && !value.endsWith('. ') && !value.endsWith('.\n') && value.trim()) {
      onChange(value + '. ' + example);
    } else {
      onChange(value + example);
    }
    setSelectedExample(example);
    setTimeout(() => setSelectedExample(null), 1000);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-purple-100">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <CardTitle className="text-purple-800">Instrucciones Personalizadas para la IA</CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          Agrega instrucciones específicas para que la IA evalúe los candidatos según tus criterios únicos.
          Estas indicaciones se aplicarán durante el análisis de los CVs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="custom-prompt" className="text-purple-800">
            Prompt personalizado (opcional)
          </Label>
          <Textarea
            id="custom-prompt"
            placeholder="Ejemplo: Priorizar candidatos con experiencia en SaaS, que hayan trabajado en startups de menos de 100 empleados, y que demuestren capacidad de adaptación a entornos de rápido crecimiento..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 min-h-[120px] border-purple-200 focus:border-purple-400 bg-white/70"
          />
          <p className="text-sm text-purple-600 mt-2">
            La IA utilizará estas instrucciones junto con los requisitos configurados para evaluar candidatos.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-purple-800">Ejemplos para inspirarte:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {promptExamples.map((example, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`cursor-pointer transition-all hover:bg-purple-100 hover:border-purple-300 ${
                  selectedExample === example 
                    ? 'bg-purple-100 border-purple-300 text-purple-800' 
                    : 'bg-white/70 border-purple-200 text-purple-700'
                }`}
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Haz clic en cualquier ejemplo para agregarlo a tu prompt personalizado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}