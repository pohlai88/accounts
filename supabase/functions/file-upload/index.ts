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

        const { method, url } = req
        const urlObj = new URL(url)
        const path = urlObj.pathname

        if (method === 'POST' && path === '/upload') {
            // Handle file upload
            const formData = await req.formData()
            const file = formData.get('file') as File
            const bucket = formData.get('bucket') as string || 'tenant-documents'
            const folder = formData.get('folder') as string || 'documents'

            if (!file) {
                return new Response(
                    JSON.stringify({ error: 'No file provided' }),
                    { status: 400, headers: corsHeaders }
                )
            }

            // Get tenant_id from JWT
            const tenantId = user.app_metadata?.tenant_id
            if (!tenantId) {
                return new Response(
                    JSON.stringify({ error: 'No active tenant' }),
                    { status: 400, headers: corsHeaders }
                )
            }

            // Generate unique filename
            const timestamp = Date.now()
            const randomId = Math.random().toString(36).substring(2, 15)
            const fileExtension = file.name.split('.').pop()
            const fileName = `${timestamp}_${randomId}.${fileExtension}`
            const filePath = `${tenantId}/${folder}/${fileName}`

            // Upload file to storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from(bucket)
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false
                })

            if (uploadError) {
                return new Response(
                    JSON.stringify({ error: uploadError.message }),
                    { status: 500, headers: corsHeaders }
                )
            }

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from(bucket)
                .getPublicUrl(filePath)

            return new Response(
                JSON.stringify({
                    success: true,
                    file: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: filePath,
                        url: urlData.publicUrl
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (method === 'GET' && path.startsWith('/signed-url/')) {
            // Generate signed URL for file access
            const filePath = path.replace('/signed-url/', '')
            const bucket = urlObj.searchParams.get('bucket') || 'tenant-documents'
            const expiresIn = parseInt(urlObj.searchParams.get('expires') || '3600')

            // Get tenant_id from JWT
            const tenantId = user.app_metadata?.tenant_id
            if (!tenantId) {
                return new Response(
                    JSON.stringify({ error: 'No active tenant' }),
                    { status: 400, headers: corsHeaders }
                )
            }

            // Verify file belongs to tenant
            if (!filePath.startsWith(`${tenantId}/`)) {
                return new Response(
                    JSON.stringify({ error: 'Access denied' }),
                    { status: 403, headers: corsHeaders }
                )
            }

            // Generate signed URL
            const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
                .from(bucket)
                .createSignedUrl(filePath, expiresIn)

            if (signedUrlError) {
                return new Response(
                    JSON.stringify({ error: signedUrlError.message }),
                    { status: 500, headers: corsHeaders }
                )
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    signedUrl: signedUrlData.signedUrl,
                    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (method === 'DELETE' && path.startsWith('/delete/')) {
            // Delete file
            const filePath = path.replace('/delete/', '')
            const bucket = urlObj.searchParams.get('bucket') || 'tenant-documents'

            // Get tenant_id from JWT
            const tenantId = user.app_metadata?.tenant_id
            if (!tenantId) {
                return new Response(
                    JSON.stringify({ error: 'No active tenant' }),
                    { status: 400, headers: corsHeaders }
                )
            }

            // Verify file belongs to tenant
            if (!filePath.startsWith(`${tenantId}/`)) {
                return new Response(
                    JSON.stringify({ error: 'Access denied' }),
                    { status: 403, headers: corsHeaders }
                )
            }

            // Delete file
            const { error: deleteError } = await supabaseClient.storage
                .from(bucket)
                .remove([filePath])

            if (deleteError) {
                return new Response(
                    JSON.stringify({ error: deleteError.message }),
                    { status: 500, headers: corsHeaders }
                )
            }

            return new Response(
                JSON.stringify({ success: true, message: 'File deleted' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Not found' }),
            { status: 404, headers: corsHeaders }
        )

    } catch (error) {
        console.error('File upload error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: corsHeaders }
        )
    }
})
