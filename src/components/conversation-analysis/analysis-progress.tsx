'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

const analysisSteps = [
  "Initializing conversation analysis...",
  "Processing conversation patterns...",
  "Analyzing communication style...",
  "Evaluating language fluency...",
  "Identifying areas for improvement...",
  "Generating detailed insights...",
  "Preparing final analysis report..."
]

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalSteps = analysisSteps.length
    const stepDuration = 6000 / totalSteps // Total animation is ~6 seconds

    const interval = setInterval(() => {
      setCurrentStep(current => {
        if (current >= totalSteps - 1) {
          clearInterval(interval)
          return current
        }
        return current + 1
      })
      
      setProgress(current => {
        const newProgress = current + (100 / totalSteps)
        return Math.min(newProgress, 98) // Never quite reach 100% until complete
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 p-4">
      <div className="text-center text-sm text-muted-foreground mb-2">
        {analysisSteps[currentStep]}
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-center text-xs text-muted-foreground mt-2">
        This may take a minute. We&apos;re conducting a thorough analysis of your conversation.
      </p>
    </div>
  )
}
