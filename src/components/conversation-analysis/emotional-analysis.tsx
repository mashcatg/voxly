import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EmotionalAnalysisProps {
  emotionalStates: string[]
  mandatoryPhrases: string[]
}

export function EmotionalAnalysis({ emotionalStates, mandatoryPhrases }: EmotionalAnalysisProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Additional Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-4">Emotional States</h4>
          <div className="flex flex-wrap gap-2">
            {emotionalStates.map((emotion, i) => (
              <Badge key={i} variant="secondary">{emotion}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium mb-4">Key Phrases Used</h4>
          <ul className="list-disc list-inside space-y-2">
            {mandatoryPhrases.map((phrase, i) => (
              <li key={i} className="text-sm text-muted-foreground">{phrase}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
