'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Modern Accounting</h1>
            <Badge variant="secondary">ERPNext-Inspired</Badge>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/erpnext-demo')}>
              View Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Fortune 500-Grade Accounting
              <br />
              <span className="text-primary">With Modern UX</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience ERPNext-level accounting depth with lightning-fast performance, 
              beautiful design, and mobile-first experience that crushes the competition.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" onClick={() => router.push('/login')} className="text-lg px-8 py-6">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/erpnext-demo')} className="text-lg px-8 py-6">
              Interactive Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Setup in 2 Minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-yellow-500" />
              <CardTitle>3x Faster Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                716KB bundle vs competitors' 2-3MB. Sub-second response times 
                vs 2-5 second delays. Built for speed.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-green-500" />
              <CardTitle>ERPNext Business Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Battle-tested accounting patterns from ERPNext. Separate payment 
                ledger, immutable audit trails, advanced reconciliation.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-blue-500" />
              <CardTitle>Modern UX/UI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dark-first design, mobile-optimized, real-time validation. 
                WCAG 2.2 AAA accessible. Beautiful and functional.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Competitive Comparison */}
        <div className="mt-20 text-center space-y-8">
          <h3 className="text-3xl font-bold">Why Choose Modern Accounting?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">vs. QuickBooks</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>3x faster performance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Modern mobile design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Advanced reconciliation</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">vs. Xero</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>ERPNext-level depth</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Real-time validation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Better pricing</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">vs. Zoho</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Superior UX design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Faster implementation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Better support</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">vs. Odoo</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Focused on accounting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Easier to use</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Modern technology</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to Transform Your Accounting?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses already using Modern Accounting to streamline 
            their financial operations with Fortune 500-grade tools.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => router.push('/login')} className="text-lg px-8 py-6">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/erpnext-demo')} className="text-lg px-8 py-6">
              Explore Features
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Modern Accounting. Built with Next.js 15, Supabase, and ERPNext-inspired business logic.</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Supabase</Badge>
              <Badge variant="outline">ERPNext Patterns</Badge>
              <Badge variant="outline">Fortune 500 Ready</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
