import { Textarea } from '../../../ui/components/ui/textarea';
import { Label } from '../../../ui/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Sparkles } from 'lucide-react';

interface CustomPromptBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomPromptBox({ value, onChange }: CustomPromptBoxProps) {

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
      <CardContent>
        <div>
          <Label htmlFor="custom-prompt" className="text-purple-800">
            Prompt personalizado (opcional)
          </Label>
          <Textarea
            id="custom-prompt"
            placeholder="Ej: Priorizar candidatos con experiencia en fintech"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 min-h-[100px] border-purple-200 focus:border-purple-400 bg-white/70"
          />
          <p className="text-sm text-purple-600 mt-2">
            La IA utilizará estas instrucciones junto con los requisitos configurados para evaluar candidatos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}