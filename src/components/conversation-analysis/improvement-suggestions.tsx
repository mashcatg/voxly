import { Card } from '@/components/ui/card'

interface ImprovementSuggestionsProps {
  immediate: string[]
  longTerm: string[]
}

export function ImprovementSuggestions({ immediate, longTerm }: ImprovementSuggestionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Improvement Suggestions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-4">Immediate Actions</h4>
          <ul className="list-disc pl-4 space-y-2">
            {immediate.map((improvement, i) => (
              <li key={i} className="text-sm text-muted-foreground">{improvement}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium mb-4">Long-term Development</h4>
          <ul className="list-disc pl-4 space-y-2">
            {longTerm.map((improvement, i) => (
              <li key={i} className="text-sm text-muted-foreground">{improvement}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
