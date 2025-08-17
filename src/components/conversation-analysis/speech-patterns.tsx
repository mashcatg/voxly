import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SpeechPatternsProps {
  fillerWords: {
    words: string[]
    frequency: number
  }
  repetitions: string[]
  hesitationCount: number
}

export function SpeechPatterns({ fillerWords, repetitions, hesitationCount }: SpeechPatternsProps) {
  const fillerData = fillerWords.words.map(word => ({
    word,
    frequency: Math.round(fillerWords.frequency * 100),
  }))

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Speech Patterns</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-4">Filler Words Analysis</h4>
          <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="word" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="frequency" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {fillerWords.words.map((word, i) => (
              <Badge key={i} variant="secondary" className="text-sm">
                {word} ({Math.round(fillerWords.frequency * 100)}%)
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Common Repetitions</h4>
              <ul className="list-disc pl-4 space-y-1">
                {repetitions.map((rep, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{rep}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Hesitation Analysis</h4>
              <div className="text-3xl font-semibold">{hesitationCount}</div>
              <div className="text-sm text-muted-foreground">Total hesitation markers</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
