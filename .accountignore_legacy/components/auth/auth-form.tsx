'use client'

/**
 * Modern Authentication Form
 * Fortune 500-grade security with beautiful UX
 */

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    Mail,
    Lock,
    User,
    Globe,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from 'lucide-react'

interface AuthFormProps {
    onSuccess?: () => void
    redirectTo?: string
}

export function AuthForm({ onSuccess, redirectTo }: AuthFormProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    // Sign up form state
    const [signUpForm, setSignUpForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        company_name: '',
        company_currency: 'USD',
        company_country: 'United States'
    })

    // Sign in form state
    const [signInForm, setSignInForm] = useState({
        email: '',
        password: ''
    })

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        // Validation
        if (signUpForm.password !== signUpForm.confirmPassword) {
            setResult({ success: false, message: 'Passwords do not match' })
            setLoading(false)
            return
        }

        if (signUpForm.password.length < 8) {
            setResult({ success: false, message: 'Password must be at least 8 characters' })
            setLoading(false)
            return
        }

        try {
            const response = await AuthService.signUp(
                signUpForm.email,
                signUpForm.password,
                {
                    full_name: signUpForm.full_name,
                    company_name: signUpForm.company_name,
                    company_currency: signUpForm.company_currency,
                    company_country: signUpForm.company_country
                }
            )

            if (response.success) {
                setResult({
                    success: true,
                    message: 'Account created successfully! Please check your email to verify your account.'
                })

                // Redirect to email verification page
                setTimeout(() => {
                    window.location.href = `/verify-email?email=${encodeURIComponent(signUpForm.email)}`
                }, 2000)
            } else {
                setResult({ success: false, message: response.error || 'Sign up failed' })
            }
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Sign up failed'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const response = await AuthService.signIn(signInForm.email, signInForm.password)

            if (response.success) {
                setResult({ success: true, message: 'Signed in successfully!' })

                if (onSuccess) {
                    setTimeout(onSuccess, 1000)
                } else if (redirectTo) {
                    window.location.href = redirectTo
                }
            } else {
                setResult({ success: false, message: response.error || 'Sign in failed' })
            }
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Sign in failed'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold">Modern Accounting</h1>
                </div>
                <p className="text-muted-foreground">
                    Fortune 500-grade accounting with modern UX
                </p>
                <div className="flex items-center justify-center space-x-2">
                    <Badge variant="secondary">ERPNext-Inspired</Badge>
                    <Badge variant="outline">Enterprise Ready</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent>
                    <Tabs value={mode}>
                        {/* Sign In Tab */}
                        <TabsContent value="signin">
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signin-email" className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4" />
                                        <span>Email</span>
                                    </Label>
                                    <Input
                                        id="signin-email"
                                        type="email"
                                        value={signInForm.email}
                                        onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signin-password" className="flex items-center space-x-2">
                                        <Lock className="h-4 w-4" />
                                        <span>Password</span>
                                    </Label>
                                    <Input
                                        id="signin-password"
                                        type="password"
                                        value={signInForm.password}
                                        onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Sign Up Tab */}
                        <TabsContent value="signup">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full-name" className="flex items-center space-x-2">
                                            <User className="h-4 w-4" />
                                            <span>Full Name</span>
                                        </Label>
                                        <Input
                                            id="full-name"
                                            value={signUpForm.full_name}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, full_name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center space-x-2">
                                            <Mail className="h-4 w-4" />
                                            <span>Email</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={signUpForm.email}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                                            placeholder="john@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company-name" className="flex items-center space-x-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>Company Name</span>
                                    </Label>
                                    <Input
                                        id="company-name"
                                        value={signUpForm.company_name}
                                        onChange={(e) => setSignUpForm({ ...signUpForm, company_name: e.target.value })}
                                        placeholder="Your Company Ltd"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency" className="flex items-center space-x-2">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Currency</span>
                                        </Label>
                                        <select
                                            id="currency"
                                            value={signUpForm.company_currency}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, company_currency: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - British Pound</option>
                                            <option value="CAD">CAD - Canadian Dollar</option>
                                            <option value="AUD">AUD - Australian Dollar</option>
                                            <option value="JPY">JPY - Japanese Yen</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="flex items-center space-x-2">
                                            <Globe className="h-4 w-4" />
                                            <span>Country</span>
                                        </Label>
                                        <select
                                            id="country"
                                            value={signUpForm.company_country}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, company_country: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Canada">Canada</option>
                                            <option value="Australia">Australia</option>
                                            <option value="Germany">Germany</option>
                                            <option value="France">France</option>
                                            <option value="Japan">Japan</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="flex items-center space-x-2">
                                            <Lock className="h-4 w-4" />
                                            <span>Password</span>
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={signUpForm.password}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                                            placeholder="Min 8 characters"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={signUpForm.confirmPassword}
                                            onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                                            placeholder="Confirm password"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? 'Creating account...' : 'Create Account & Company'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Result Display */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center space-x-2">
                                {result.success ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {result.message}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Features Preview */}
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">What you get:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="text-xs">ERPNext Business Logic</Badge>
                    <Badge variant="outline" className="text-xs">Real-time Validation</Badge>
                    <Badge variant="outline" className="text-xs">Mobile Optimized</Badge>
                    <Badge variant="outline" className="text-xs">Multi-currency</Badge>
                    <Badge variant="outline" className="text-xs">Audit Compliance</Badge>
                </div>
            </div>
        </div>
    )
}
