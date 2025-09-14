import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { method, url } = req
        const urlObj = new URL(url)
        const path = urlObj.pathname

        // Get authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: corsHeaders }
            )
        }

        // Verify JWT token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 401, headers: corsHeaders }
            )
        }

        // Route handling
        if (method === 'GET' && path === '/tenants') {
            // Get user's tenants
            const { data: memberships, error } = await supabaseClient
                .from('memberships')
                .select(`
          tenant_id,
          role,
          permissions,
          tenants!inner(id, name, slug),
          companies(id, name, code)
        `)
                .eq('user_id', user.id)
                .eq('status', 'active')

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: corsHeaders }
                )
            }

            return new Response(
                JSON.stringify({ tenants: memberships }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (method === 'POST' && path === '/tenants/switch') {
            // Switch active tenant
            const { tenantId } = await req.json()

            // Verify user has access to this tenant
            const { data: membership, error: membershipError } = await supabaseClient
                .from('memberships')
                .select('tenant_id, role')
                .eq('user_id', user.id)
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single()

            if (membershipError || !membership) {
                return new Response(
                    JSON.stringify({ error: 'Access denied to tenant' }),
                    { status: 403, headers: corsHeaders }
                )
            }

            // Update user's active tenant
            const { error: updateError } = await supabaseClient
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    active_tenant_id: tenantId,
                    updated_at: new Date().toISOString()
                })

            if (updateError) {
                return new Response(
                    JSON.stringify({ error: updateError.message }),
                    { status: 500, headers: corsHeaders }
                )
            }

            return new Response(
                JSON.stringify({ success: true, tenantId }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (method === 'POST' && path === '/tenants/invite') {
            // Invite user to tenant
            const { tenantId, email, role } = await req.json()

            // Verify user has admin/manager role in this tenant
            const { data: membership, error: membershipError } = await supabaseClient
                .from('memberships')
                .select('role')
                .eq('user_id', user.id)
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single()

            if (membershipError || !membership || !['admin', 'manager'].includes(membership.role)) {
                return new Response(
                    JSON.stringify({ error: 'Insufficient permissions' }),
                    { status: 403, headers: corsHeaders }
                )
            }

            // Check if user already exists
            const { data: existingUser } = await supabaseClient
                .from('users')
                .select('id')
                .eq('email', email)
                .single()

            let userId: string

            if (existingUser) {
                userId = existingUser.id
            } else {
                // Invite new user
                const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(
                    email,
                    {
                        redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback`,
                        data: { tenant_id: tenantId, role: role }
                    }
                )

                if (authError || !authData.user) {
                    return new Response(
                        JSON.stringify({ error: 'Failed to invite user' }),
                        { status: 400, headers: corsHeaders }
                    )
                }

                userId = authData.user.id

                // Create user profile
                await supabaseClient
                    .from('users')
                    .insert({
                        id: userId,
                        email: email,
                        first_name: '',
                        last_name: ''
                    })
            }

            // Create membership
            const { error: membershipError2 } = await supabaseClient
                .from('memberships')
                .upsert({
                    user_id: userId,
                    tenant_id: tenantId,
                    role: role,
                    status: 'active',
                    created_at: new Date().toISOString()
                })

            if (membershipError2) {
                return new Response(
                    JSON.stringify({ error: 'Failed to create membership' }),
                    { status: 500, headers: corsHeaders }
                )
            }

            return new Response(
                JSON.stringify({ success: true, userId, email, role }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Not found' }),
            { status: 404, headers: corsHeaders }
        )

    } catch (error) {
        console.error('Tenant management error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: corsHeaders }
        )
    }
})
