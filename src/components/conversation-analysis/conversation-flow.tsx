import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ConversationFlowProps {
  turnCount: number
  userResponseTimes: number[]
  averageTurnLength: number
  topicCoherence: number
  description: string
}

export function ConversationFlow({
  turnCount,
  userResponseTimes,
  averageTurnLength,
  topicCoherence,
  description,
}: ConversationFlowProps) {
  const responseTimeData = userResponseTimes.map((time, index) => ({
    turn: index + 1,
    responseTime: time,
  }))

  const avgResponseTime = Math.round(
    userResponseTimes.reduce((a, b) => a + b, 0) / userResponseTimes.length
  )

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Conversation Flow</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h4 className="font-medium mb-4">Response Time Analysis</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Conversation Metrics</h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Total Turns</dt>
                  <dd className="text-2xl font-semibold">{turnCount}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Avg Response Time</dt>
                  <dd className="text-2xl font-semibold">{avgResponseTime}s</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Avg Words per Turn</dt>
                  <dd className="text-2xl font-semibold">{Math.round(averageTurnLength)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Topic Coherence</dt>
                  <dd className="text-2xl font-semibold">{(topicCoherence * 100).toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-medium mb-2">Analysis Overview</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  )
}
