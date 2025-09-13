'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Star,
  Award,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Settings,
  Zap
} from 'lucide-react'
import { 
  AIEngine,
  AIProgress,
  AIOnboardingStep
} from '@/lib/ai-engine'

interface ProgressTrackingDashboardProps {
  companyId: string
  userId: string
  onStepComplete: (stepId: string) => void
}

export function ProgressTrackingDashboard({ 
  companyId, 
  userId, 
  onStepComplete 
}: ProgressTrackingDashboardProps) {
  const [progress, setProgress] = useState<AIProgress | null>(null)
  const [steps, setSteps] = useState<AIOnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadProgressData()
  }, [companyId, userId])

  const loadProgressData = async () => {
    try {
      const [progressResult, stepsResult] = await Promise.all([
        AIEngine.getProgress(userId, companyId),
        AIEngine.getOnboardingSteps(companyId)
      ])

      if (progressResult.success && progressResult.progress) {
        setProgress(progressResult.progress)
      }

      if (stepsResult.success && stepsResult.steps) {
        setSteps(stepsResult.steps)
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'company-info':
        return <Settings className="h-4 w-4" />
      case 'chart-of-accounts':
        return <FileText className="h-4 w-4" />
      case 'first-transaction':
        return <DollarSign className="h-4 w-4" />
      case 'bank-account':
        return <Users className="h-4 w-4" />
      case 'first-invoice':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getStepStatus = (stepId: string) => {
    if (!progress) return 'pending'
    if (progress.completedSteps.includes(stepId)) return 'completed'
    if (progress.currentStep === stepId) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'current':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'current':
        return <Clock className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading progress...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Setup Progress</span>
          </CardTitle>
          <CardDescription>
            Track your progress through the initial setup process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {progress?.completionPercentage || 0}%
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {progress?.completedSteps.length || 0} of {progress?.totalSteps || 0} steps completed
            </div>
            <Progress value={progress?.completionPercentage || 0} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progress?.completedSteps.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progress?.estimatedTimeRemaining || 0}
              </div>
              <div className="text-xs text-muted-foreground">Minutes Left</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {steps.length - (progress?.completedSteps.length || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <span>Setup Steps</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown of your setup progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              return (
                <div
                  key={step.id}
                  className={`p-4 border rounded-lg ${
                    status === 'current' ? 'border-blue-200 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={status === 'completed' ? 'default' : 'outline'}
                        className={getStatusColor(status)}
                      >
                        {status === 'completed' ? 'Completed' : 
                         status === 'current' ? 'Current' : 'Pending'}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {step.estimatedTime}min
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Jump to the next step or explore additional features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              className="h-12"
              onClick={() => setShowDetails(true)}
            >
              <Target className="h-4 w-4 mr-2" />
              Continue Setup
            </Button>
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => onStepComplete('next')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <span>Achievements</span>
          </CardTitle>
          <CardDescription>
            Celebrate your progress milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-sm font-medium">First Steps</div>
              <div className="text-xs text-muted-foreground">
                {progress?.completedSteps.length || 0 > 0 ? 'Earned' : 'In Progress'}
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Halfway There</div>
              <div className="text-xs text-muted-foreground">
                {(progress?.completionPercentage || 0) >= 50 ? 'Earned' : 'In Progress'}
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Almost There</div>
              <div className="text-xs text-muted-foreground">
                {(progress?.completionPercentage || 0) >= 80 ? 'Earned' : 'In Progress'}
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Complete</div>
              <div className="text-xs text-muted-foreground">
                {(progress?.completionPercentage || 0) >= 100 ? 'Earned' : 'In Progress'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detailed Progress</DialogTitle>
            <DialogDescription>
              View detailed information about your setup progress
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {progress && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">Current Step</div>
                    <div className="text-lg font-bold">
                      {steps.find(s => s.id === progress.currentStep)?.title || 'Unknown'}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">Time Remaining</div>
                    <div className="text-lg font-bold">
                      {progress.estimatedTimeRemaining} minutes
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Completed Steps</div>
                  <div className="space-y-1">
                    {progress.completedSteps.map((stepId, index) => {
                      const step = steps.find(s => s.id === stepId)
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{step?.title || stepId}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface QuickActionsProps {
  onAction: (action: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      description: 'Start billing your customers',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      id: 'add-transaction',
      title: 'Add Transaction',
      description: 'Record a new transaction',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Check your financial reports',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your account',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-gray-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Quick Actions</span>
        </CardTitle>
        <CardDescription>
          Jump to common tasks and features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onAction(action.id)}
            >
              <div className={action.color}>
                {action.icon}
              </div>
              <div className="text-xs text-center">
                <div className="font-medium">{action.title}</div>
                <div className="text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
