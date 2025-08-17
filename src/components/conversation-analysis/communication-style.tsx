import { Card } from '@/components/ui/card'
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PolarGrid,
} from 'recharts'

interface CommunicationStyleProps {
  clarity: number
  confidence: number
  fluency: number
  description: string
}

export function CommunicationStyle({ clarity, confidence, fluency, description }: CommunicationStyleProps) {
  const data = [
    {
      name: 'Clarity',
      value: clarity * 100,
      fill: '#22c55e',
    },
    {
      name: 'Confidence',
      value: confidence * 100,
      fill: '#3b82f6',
    },
    {
      name: 'Fluency',
      value: fluency * 100,
      fill: '#a855f7',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Communication Style</h3>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={10}
                data={data}
              >
                <PolarGrid />
                <RadialBar
                  background
                  dataKey="value"
                  angleAxisId={0}
                  fill="#8884d8"
                />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {data.map((item) => (
                <div key={item.name} className="text-sm">
                  <div className="text-muted-foreground mb-1">{item.name}</div>
                  <div className="font-semibold">{item.value.toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
