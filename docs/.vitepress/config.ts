import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

const isCI = process.env.CI === 'true'

function autoSidebar(dir: string) {
    const root = path.resolve(process.cwd(), 'docs', dir)
    if (!fs.existsSync(root)) return []
    return fs.readdirSync(root)
        .filter(f => f.endsWith('.md') || fs.statSync(path.join(root, f)).isDirectory())
        .map(f => {
            const p = path.join(dir, f)
            if (p.endsWith('.md')) return { text: f.replace('.md', ''), link: `/${p}` }
            // folder section
            const items = fs.readdirSync(path.join(root, f))
                .filter(x => x.endsWith('.md'))
                .map(x => ({ text: x.replace('.md', ''), link: `/${dir}/${f}/${x}` }))
            return { text: f, items }
        })
}

export default defineConfig({
    title: 'AI-BOS Accounts',
    description: 'Complete accounting system documentation',

    // Base URL for deployment
    // base: '/docs/',

    // Theme configuration
    themeConfig: {
        // Navigation
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Packages', link: '/packages/' },
            { text: 'API', link: '/api/' },
            { text: 'Guides', link: '/guides/' }
        ],

        // Sidebar with auto-generation
        sidebar: {
            '/guides/': autoSidebar('guides'),
            '/api/': autoSidebar('api'),
            '/packages/': autoSidebar('packages'),
            '/': [{ text: 'Getting Started', link: '/index' }]
        },

        // Social links
        socialLinks: [
            { icon: 'github', link: 'https://github.com/aibos/accounts' }
        ],

        // Footer
        footer: {
            message: 'AI-BOS Accounts Documentation © 2024',
            copyright: 'Built with VitePress'
        },

        // Search
        search: {
            provider: 'local'
        },

        // Edit link
        editLink: {
            pattern: 'https://github.com/aibos/accounts/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },

        // Last updated
        lastUpdated: {
            text: 'Last updated',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium'
            }
        }
    },

    // Markdown configuration
    markdown: {
        lineNumbers: true,
        theme: 'github-dark'
    },

    // Build configuration
    build: {
        outDir: '../dist/docs'
    },

    // Redirects for moved/renamed pages
    rewrites: {
        'guides/contributing.md': 'guides/how-to-contribute.md',
        'api/index.md': 'api/overview.md',
    },

    // Sitemap for SEO
    sitemap: { hostname: 'https://docs.aibos.example.com' },

    // Vite configuration without Vue plugin (let VitePress handle Vue internally)
    vite: {
        // if you import local workspace pkgs in docs, keep these fences:
        ssr: { noExternal: ['@aibos/*'] },
        optimizeDeps: { exclude: ['@aibos/*'] },
        resolve: {
            // dedupe avoids accidental double-Vue on Windows monorepos
            dedupe: ['vue']
        },
        cacheDir: '.vitepress/cache'
    },

    // Dead link policy: soft during dev, strict in CI
    ignoreDeadLinks: !isCI
        ? true
        : [
            // allow anchors generated at runtime, or external services that rate limit
            /localhost/,
            /example\.com/,
            // allow missing guide pages that will be created later
            /getting-started/,
            /user-manual/,
            /troubleshooting/,
            /architecture/,
            /performance/,
            /security/,
        ]
})
