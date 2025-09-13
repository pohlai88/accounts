/**
 * Lifecycle Emails & Templates
 * Welcome, nudge, and onboarding email system
 */

import { supabase } from './supabase'

export interface EmailTemplate {
    id: string
    name: string
    subject: string
    html: string
    text: string
    variables: string[]
}

export interface EmailEvent {
    type: 'welcome_owner' | 'welcome_invite' | 'nudge_d1' | 'nudge_d3' | 'nudge_d7' | 'completion'
    user_id: string
    company_id?: string
    data: Record<string, any>
    scheduled_at?: string
}

// Email Templates
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
    welcome_owner: {
        id: 'welcome_owner',
        name: 'Welcome Email (Owner)',
        subject: 'Welcome to AI-BOS Accounting — your company is live 🚀',
        variables: ['user_name', 'company_name', 'dashboard_url', 'checklist_url'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AI-BOS Accounting</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 20px; }
        .success-badge { background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 20px; }
        .checklist { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .checklist h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 18px; }
        .checklist-item { display: flex; align-items: center; margin: 10px 0; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .checklist-item .number { background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; }
        .checklist-item .content { flex: 1; }
        .checklist-item .title { font-weight: 600; color: #1f2937; margin: 0; }
        .checklist-item .desc { color: #6b7280; font-size: 14px; margin: 2px 0 0 0; }
        .checklist-item .time { color: #9ca3af; font-size: 12px; }
        .cta-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .feature { text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; }
        .feature-icon { font-size: 32px; margin-bottom: 10px; }
        .feature h4 { margin: 0 0 8px 0; color: #1f2937; }
        .feature p { margin: 0; color: #6b7280; font-size: 14px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .trust-indicators { display: flex; justify-content: center; gap: 20px; margin: 20px 0; font-size: 12px; color: #6b7280; }
        @media (max-width: 600px) {
            .features { grid-template-columns: 1fr; }
            .content { padding: 20px 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Welcome to AI-BOS Accounting!</h1>
            <p>Your Malaysia-ready accounting system is live and ready</p>
        </div>
        
        <div class="content">
            <div class="success-badge">🎉 Setup Complete</div>
            
            <h2>Hi {{user_name}},</h2>
            
            <p>Congratulations! Your company <strong>{{company_name}}</strong> is now set up with:</p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🇲🇾</div>
                    <h4>Malaysia-Ready</h4>
                    <p>MYR currency, MFRS COA, SST presets</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <h4>Lightning Fast</h4>
                    <p>Sub-second response times</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🛡️</div>
                    <h4>Enterprise Security</h4>
                    <p>Bank-grade security & compliance</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🤖</div>
                    <h4>AI-Powered</h4>
                    <p>Smart categorization & suggestions</p>
                </div>
            </div>
            
            <div class="checklist">
                <h3>🚀 Next Steps (5-10 minutes):</h3>
                
                <div class="checklist-item">
                    <div class="number">1</div>
                    <div class="content">
                        <div class="title">Send your first invoice</div>
                        <div class="desc">Create and send an invoice to see our MFRS-ready templates</div>
                        <div class="time">⏱️ 3 minutes</div>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <div class="number">2</div>
                    <div class="content">
                        <div class="title">Add a bank account</div>
                        <div class="desc">Connect your bank for automatic reconciliation</div>
                        <div class="time">⏱️ 2 minutes</div>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <div class="number">3</div>
                    <div class="content">
                        <div class="title">Invite your accountant</div>
                        <div class="desc">Give your team access with role-based permissions</div>
                        <div class="time">⏱️ 1 minute</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{checklist_url}}" class="cta-button">Open Your Checklist</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h4 style="margin: 0 0 8px 0; color: #92400e;">💡 Pro Tip</h4>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    Press <strong>⌘K</strong> anywhere in the app to access our AI command palette. 
                    Try typing "Create invoice" to see the magic!
                </p>
            </div>
            
            <p>Need help? Reply to this email or check our <a href="#" style="color: #3b82f6;">help center</a>.</p>
            
            <p>Welcome aboard!<br>
            <strong>The AI-BOS Team</strong></p>
        </div>
        
        <div class="footer">
            <div class="trust-indicators">
                <span>🔒 SOC2 Compliant</span>
                <span>🇲🇾 Malaysia Localized</span>
                <span>⚡ 3x Faster than QuickBooks</span>
            </div>
            <p>AI-BOS Accounting • Kuala Lumpur, Malaysia</p>
        </div>
    </div>
</body>
</html>`,
        text: `Welcome to AI-BOS Accounting!

Hi {{user_name}},

Your company {{company_name}} is now live with Malaysia-ready accounting features:
• MYR currency and MFRS-aligned Chart of Accounts
• SST/GST presets configured
• Enterprise-grade security enabled
• AI-powered smart features

Next Steps (5-10 minutes):
1. Send your first invoice (3 min)
2. Add a bank account (2 min) 
3. Invite your accountant (1 min)

Open your checklist: {{checklist_url}}

Pro Tip: Press ⌘K anywhere to access our AI command palette!

Welcome aboard!
The AI-BOS Team`
    },

    welcome_invite: {
        id: 'welcome_invite',
        name: 'Welcome Email (Invited User)',
        subject: 'You\'ve been invited to {{company_name}} on AI-BOS Accounting',
        variables: ['user_name', 'company_name', 'inviter_name', 'role', 'dashboard_url'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 20px; }
        .role-badge { background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin: 10px 0; }
        .permissions { background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .cta-button { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're Invited!</h1>
        </div>
        
        <div class="content">
            <h2>Hi {{user_name}},</h2>
            
            <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{company_name}}</strong> on AI-BOS Accounting.</p>
            
            <div class="role-badge">{{role}} Access</div>
            
            <div class="permissions">
                <h4>Your Permissions:</h4>
                <ul>
                    <li>Post bills and journal entries</li>
                    <li>View financial reports</li>
                    <li>Reconcile bank transactions</li>
                    <li>Access audit trail</li>
                </ul>
                <p><em>Note: No user administration access</em></p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">Access Your Dashboard</a>
            </div>
            
            <p>Start here: Check your inbox for 2 tasks waiting for you.</p>
            
            <p>Questions? Reply to this email for help.</p>
            
            <p>Best regards,<br>
            <strong>The AI-BOS Team</strong></p>
        </div>
        
        <div class="footer">
            <p>AI-BOS Accounting • Secure • Compliant • Fast</p>
        </div>
    </div>
</body>
</html>`,
        text: `You've been invited to {{company_name}}!

Hi {{user_name}},

{{inviter_name}} has invited you to join {{company_name}} on AI-BOS Accounting.

You have {{role}} access with permissions to:
• Post bills and journal entries
• View financial reports  
• Reconcile bank transactions
• Access audit trail

Access your dashboard: {{dashboard_url}}

Start here: Check your inbox for 2 tasks waiting for you.

Best regards,
The AI-BOS Team`
    },

    nudge_d1: {
        id: 'nudge_d1',
        name: 'Day 1 Nudge Email',
        subject: 'Make it real in 3 minutes ⚡',
        variables: ['user_name', 'company_name', 'dashboard_url'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Make it real in 3 minutes</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 30px 20px; }
        .quick-wins { background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .cta-button { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Make it real in 3 minutes</h1>
        </div>
        
        <div class="content">
            <h2>Hi {{user_name}},</h2>
            
            <p>Your {{company_name}} accounting system is ready, but it needs some real data to show its power.</p>
            
            <div class="quick-wins">
                <h4>🚀 Quick wins (choose one):</h4>
                <ul>
                    <li><strong>Add one bank account</strong> - See reconciliation in action</li>
                    <li><strong>Import sample balances</strong> - Get realistic reports instantly</li>
                    <li><strong>Create your first invoice</strong> - Experience our MFRS templates</li>
                </ul>
            </div>
            
            <p>Once you add real data, the magic happens. Reports become meaningful, reconciliation gets exciting, and you'll see why we're 3x faster than QuickBooks.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">Continue Setup</a>
            </div>
            
            <p>Still have questions? Just reply to this email.</p>
            
            <p>Cheers,<br>
            <strong>The AI-BOS Team</strong></p>
        </div>
        
        <div class="footer">
            <p>AI-BOS Accounting • Making accounting magical since 2024</p>
        </div>
    </div>
</body>
</html>`,
        text: `Make it real in 3 minutes

Hi {{user_name}},

Your {{company_name}} accounting system is ready, but it needs some real data to show its power.

Quick wins (choose one):
• Add one bank account - See reconciliation in action
• Import sample balances - Get realistic reports instantly  
• Create your first invoice - Experience our MFRS templates

Once you add real data, the magic happens!

Continue setup: {{dashboard_url}}

Cheers,
The AI-BOS Team`
    }
}

export class LifecycleEmails {

    /**
     * Send welcome email to new owner
     */
    static async sendWelcomeOwner(data: {
        user_id: string
        user_name: string
        company_name: string
        email: string
    }) {
        const template = EMAIL_TEMPLATES.welcome_owner

        const emailContent = this.processTemplate(template, {
            user_name: data.user_name,
            company_name: data.company_name,
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            checklist_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=checklist`
        })

        return this.sendEmail({
            to: data.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        })
    }

    /**
     * Send welcome email to invited user
     */
    static async sendWelcomeInvite(data: {
        user_id: string
        user_name: string
        company_name: string
        inviter_name: string
        role: string
        email: string
    }) {
        const template = EMAIL_TEMPLATES.welcome_invite

        const emailContent = this.processTemplate(template, {
            user_name: data.user_name,
            company_name: data.company_name,
            inviter_name: data.inviter_name,
            role: data.role.charAt(0).toUpperCase() + data.role.slice(1),
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        })

        return this.sendEmail({
            to: data.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        })
    }

    /**
     * Schedule nudge email
     */
    static async scheduleNudgeEmail(data: {
        user_id: string
        user_name: string
        company_name: string
        email: string
        days: number
    }) {
        const template = EMAIL_TEMPLATES.nudge_d1

        const scheduledAt = new Date()
        scheduledAt.setDate(scheduledAt.getDate() + data.days)

        // Store in database for later processing
        await supabase.from('scheduled_emails').insert({
            user_id: data.user_id,
            template_id: template.id,
            recipient_email: data.email,
            template_data: {
                user_name: data.user_name,
                company_name: data.company_name,
                dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            },
            scheduled_at: scheduledAt.toISOString(),
            status: 'scheduled'
        })
    }

    /**
     * Process email template with variables
     */
    private static processTemplate(
        template: EmailTemplate,
        variables: Record<string, string>
    ) {
        let subject = template.subject
        let html = template.html
        let text = template.text

        // Replace variables in all content
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`
            subject = subject.replace(new RegExp(placeholder, 'g'), value)
            html = html.replace(new RegExp(placeholder, 'g'), value)
            text = text.replace(new RegExp(placeholder, 'g'), value)
        })

        return { subject, html, text }
    }

    /**
     * Send email via Supabase Edge Function or external service
     */
    private static async sendEmail(data: {
        to: string
        subject: string
        html: string
        text: string
    }) {
        try {
            // In production, this would integrate with:
            // - Supabase Edge Function for email sending
            // - SendGrid, Mailgun, or similar service
            // - Or Supabase's built-in email service

            console.log('Sending email:', {
                to: data.to,
                subject: data.subject
            })

            // For now, just log the email content
            // In production, replace with actual email service

            return { success: true }
        } catch (error) {
            console.error('Failed to send email:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Process scheduled emails (would be called by a cron job)
     */
    static async processScheduledEmails() {
        const { data: scheduledEmails } = await supabase
            .from('scheduled_emails')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())

        if (!scheduledEmails) return

        for (const email of scheduledEmails) {
            const template = EMAIL_TEMPLATES[email.template_id]
            if (!template) continue

            const emailContent = this.processTemplate(template, email.template_data)

            const result = await this.sendEmail({
                to: email.recipient_email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
            })

            // Update status
            await supabase
                .from('scheduled_emails')
                .update({
                    status: result.success ? 'sent' : 'failed',
                    sent_at: result.success ? new Date().toISOString() : null,
                    error_message: result.success ? null : result.error
                })
                .eq('id', email.id)
        }
    }
}
