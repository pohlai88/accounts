/**
 * 🔒 Centralized Security Configuration
 * 
 * Production-ready security configuration with feature flags,
 * environment awareness, and comprehensive customization options.
 */

export interface RateLimitRule {
    requests: number
    window: number
}

export interface SecurityEvent {
    timestamp: string
    ip: string
    method: string
    path: string
    userAgent: string
    eventType: 'rate_limit' | 'csrf_failure' | 'bot_detected' | 'csp_violation' | 'invalid_origin'
    details: Record<string, any>
}

export interface CSPConfig {
    'default-src': string[]
    'script-src': string[]
    'style-src': string[]
    'font-src': string[]
    'img-src': string[]
    'connect-src': string[]
    'worker-src': string[]
    'media-src': string[]
    'manifest-src': string[]
    'frame-src': string[]
    'object-src': string[]
    'base-uri': string[]
    'form-action': string[]
    'frame-ancestors': string[]
    'report-uri'?: string[]
    'report-to'?: string[]
    'upgrade-insecure-requests'?: string[]
}

export const SecurityConfig = {
    // Environment detection
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',

    // Rate limiting configuration
    rateLimits: {
        '/api/auth/login': { requests: 5, window: 15 * 60 * 1000 } as RateLimitRule,
        '/api/auth/register': { requests: 3, window: 60 * 60 * 1000 } as RateLimitRule,
        '/api/auth/forgot-password': { requests: 3, window: 60 * 60 * 1000 } as RateLimitRule,
        '/api/reports': { requests: 100, window: 60 * 1000 } as RateLimitRule,
        '/api/webhooks': { requests: 1000, window: 60 * 1000 } as RateLimitRule,
        '/api/health': { requests: 100, window: 60 * 1000 } as RateLimitRule,
        default: { requests: 1000, window: 60 * 1000 } as RateLimitRule,
    },

    // Bot rate limiting (more restrictive)
    botRateLimits: {
        '/api/auth': { requests: 1, window: 60 * 1000 } as RateLimitRule,
        '/api/reports': { requests: 10, window: 60 * 1000 } as RateLimitRule,
        default: { requests: 50, window: 60 * 1000 } as RateLimitRule,
    },

    // Content Security Policy configuration
    csp: (nonce: string, isProd: boolean): CSPConfig => {
        const baseCsp: CSPConfig = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                `'nonce-${nonce}'`,
                ...(isProd ? [] : ["'unsafe-eval'"]), // Only allow unsafe-eval in dev
                "https://vercel.live",
                "https://va.vercel-scripts.com",
            ].filter(Boolean),
            'style-src': [
                "'self'",
                "'unsafe-inline'", // Needed for styled-jsx/Tailwind
                "https://fonts.googleapis.com",
            ],
            'font-src': [
                "'self'",
                "https://fonts.gstatic.com",
                "data:",
            ],
            'img-src': [
                "'self'",
                "data:",
                "blob:",
                "https:",
            ],
            'connect-src': [
                "'self'",
                "https://*.supabase.co",
                "wss://*.supabase.co",
                "https://vercel.live",
                "wss://ws.vercel.live",
                ...(isProd ? [] : ["ws://localhost:3000", "ws://localhost:3001"]), // Allow local dev websocket
            ],
            'worker-src': ["'self'", "blob:"],
            'media-src': ["'self'", "blob:"],
            'manifest-src': ["'self'"],
            'frame-src': ["'none'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
        }

        // Add reporting in production
        if (isProd && SecurityConfig.features.enableCspReporting) {
            baseCsp['report-uri'] = ['/api/csp-violation']
            baseCsp['report-to'] = ['csp-endpoint']
        }

        // Add upgrade-insecure-requests only in production
        if (isProd) {
            baseCsp['upgrade-insecure-requests'] = []
        }

        return baseCsp
    },

    // Security headers configuration
    headers: (isProd: boolean) => ({
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',

        // Prevent MIME sniffing
        'X-Content-Type-Options': 'nosniff',

        // Referrer policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // DNS prefetch control
        'X-DNS-Prefetch-Control': 'off',

        // Permissions policy (comprehensive)
        'Permissions-Policy': [
            'browsing-topics=()',
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
            'ambient-light-sensor=()',
        ].join(', '),

        // Cross-domain policies
        'X-Permitted-Cross-Domain-Policies': 'none',

        // Production-only headers
        ...(isProd && SecurityConfig.features.enableStrictTransportSecurity ? {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Expect-CT': 'max-age=86400, enforce',
        } : {}),

        // Cross-origin isolation (optional, can break some integrations)
        ...(SecurityConfig.features.enableCrossOriginIsolation ? {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin',
        } : {}),
    }),

    // Allowed origins for CORS and CSRF validation
    allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_APP_URL?.replace('https://', 'http://'),
        'https://*.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ].filter(Boolean) as string[],

    // Feature flags for security features
    features: {
        enableCrossOriginIsolation: process.env.ENABLE_CROSS_ORIGIN_ISOLATION === 'true',
        enableCspReporting: process.env.ENABLE_CSP_REPORTING === 'true',
        enableStrictTransportSecurity: process.env.ENABLE_HSTS !== 'false', // Default true
        enableBotDetection: process.env.ENABLE_BOT_DETECTION !== 'false', // Default true
        enableStructuredLogging: process.env.ENABLE_STRUCTURED_LOGGING !== 'false', // Default true
        enableRedisRateLimit: process.env.ENABLE_REDIS_RATE_LIMIT === 'true',
        enableOriginValidation: process.env.ENABLE_ORIGIN_VALIDATION !== 'false', // Default true
    },

    // Bot detection patterns
    botPatterns: [
        'bot', 'crawl', 'spider', 'slurp', 'search', 'archiver', 'scan',
        'python', 'java', 'curl', 'wget', 'php', 'ruby', 'go-http',
        'postman', 'insomnia', 'httpie', 'axios', 'fetch',
        'googlebot', 'bingbot', 'slackbot', 'twitterbot', 'facebookbot',
        'linkedinbot', 'whatsapp', 'telegram', 'discord',
    ],

    // Paths that should skip certain security checks
    exemptPaths: {
        csrf: ['/api/webhooks', '/api/health', '/api/csp-violation'],
        rateLimit: ['/api/health'],
        headers: ['/_next/static', '/_next/image', '/favicon.ico', '/robots.txt', '/sitemap.xml'],
    },

    // Redis configuration (if enabled)
    redis: {
        keyPrefix: 'security:',
        rateLimitPrefix: 'rate_limit:',
        botPrefix: 'bot:',
        defaultTtl: 3600, // 1 hour
    },

    // Logging configuration
    logging: {
        enableConsoleLogging: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
        enableStructuredLogging: process.env.NODE_ENV === 'production',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
}

// Helper functions for configuration
export const SecurityHelpers = {
    /**
     * Check if a path should skip CSRF validation
     */
    shouldSkipCSRF(path: string): boolean {
        return SecurityConfig.exemptPaths.csrf.some(exemptPath =>
            path.startsWith(exemptPath)
        )
    },

    /**
     * Check if a path should skip rate limiting
     */
    shouldSkipRateLimit(path: string): boolean {
        return SecurityConfig.exemptPaths.rateLimit.some(exemptPath =>
            path.startsWith(exemptPath)
        )
    },

    /**
     * Check if a path should skip security headers
     */
    shouldSkipHeaders(path: string): boolean {
        return SecurityConfig.exemptPaths.headers.some(exemptPath =>
            path.startsWith(exemptPath)
        )
    },

    /**
     * Get rate limit rule for a path
     */
    getRateLimitRule(path: string, isBot: boolean = false): RateLimitRule {
        const limits = isBot ? SecurityConfig.botRateLimits : SecurityConfig.rateLimits

        const rule = Object.entries(limits).find(([prefix]) =>
            path.startsWith(prefix)
        )?.[1]

        return rule || limits.default
    },

    /**
     * Check if user agent indicates a bot
     */
    isLikelyBot(userAgent: string): boolean {
        if (!SecurityConfig.features.enableBotDetection) return false

        const ua = userAgent.toLowerCase()
        return SecurityConfig.botPatterns.some(pattern => ua.includes(pattern))
    },

    /**
     * Validate if origin is allowed
     */
    isAllowedOrigin(origin: string): boolean {
        if (!SecurityConfig.features.enableOriginValidation) return true

        return SecurityConfig.allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin.includes('*')) {
                // Handle wildcard domains like *.vercel.app
                const pattern = allowedOrigin.replace(/\*/g, '.*')
                return new RegExp(`^${pattern}$`).test(origin)
            }
            return origin === allowedOrigin
        })
    },

    /**
     * Build CSP string from configuration
     */
    buildCSP(cspConfig: CSPConfig): string {
        return Object.entries(cspConfig)
            .map(([directive, sources]) => {
                if (!sources || sources.length === 0) return directive
                return `${directive} ${sources.join(' ')}`
            })
            .join('; ')
    },

    /**
     * Generate a cryptographically secure nonce
     */
    generateNonce(): string {
        // Edge runtime has Web Crypto
        return crypto.randomUUID().replace(/-/g, '')
    },

    /**
     * Validate IP address format
     */
    isValidIP(ip: string): boolean {
        // IPv4 and IPv6 basic validation
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
        const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i

        if (ipv4Regex.test(ip)) {
            // Additional IPv4 validation
            const parts = ip.split('.')
            return parts.every(part => {
                const num = parseInt(part, 10)
                return num >= 0 && num <= 255
            })
        }

        return ipv6Regex.test(ip)
    },
}

// Types are already exported above
