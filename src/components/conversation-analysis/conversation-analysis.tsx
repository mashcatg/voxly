import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart } from 'lucide-react'
import { ConversationStates } from '@/types/conversation-states'
import { CommunicationStyle } from './communication-style'
import { SpeechPatterns } from './speech-patterns'
import { ConversationFlow } from './conversation-flow'
import { ImprovementSuggestions } from './improvement-suggestions'
import { EmotionalAnalysis } from './emotional-analysis'
import { AnalyticsDashboard } from './analytics-dashboard'

interface ConversationAnalysisProps {
  states: ConversationStates | null
  onGenerateStates: () => void
  isGenerating: boolean
}

export function ConversationAnalysis({
  states,
  onGenerateStates,
  isGenerating
}: ConversationAnalysisProps) {
  console.log('Analysis states:', states); // Debug log
  
  if (!states || !states.userAnalysis) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <BarChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Analytics Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate analytics to get insights about this conversation.
          </p>
          <Button 
            onClick={onGenerateStates}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Analytics'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <AnalyticsDashboard states={states} />

      <div className="grid gap-8 mt-8">
        <CommunicationStyle
          clarity={states.userAnalysis.communicationStyle.clarity}
          confidence={states.userAnalysis.communicationStyle.confidence}
          fluency={states.userAnalysis.communicationStyle.fluency}
          description={states.userAnalysis.communicationStyle.description}
        />

        <SpeechPatterns
          fillerWords={states.speechPatterns.fillers}
          repetitions={states.speechPatterns.repetitions}
          hesitationCount={states.speechPatterns.pacingMetrics.hesitation_marker_count}
        />

        <ConversationFlow
          turnCount={states.conversationFlow.turnCount}
          userResponseTimes={states.conversationFlow.userResponseTimes}
          averageTurnLength={states.conversationFlow.averageTurnLength}
          topicCoherence={states.conversationFlow.topicCoherence}
          description={states.conversationFlow.description}
        />

        <ImprovementSuggestions
          immediate={states.userAnalysis.improvements.immediate}
          longTerm={states.userAnalysis.improvements.longTerm}
        />

        <EmotionalAnalysis
          emotionalStates={states.emotionalState}
          mandatoryPhrases={states.mandatoryPhrasesUsed}
        />
      </div>
    </div>
  )
}
