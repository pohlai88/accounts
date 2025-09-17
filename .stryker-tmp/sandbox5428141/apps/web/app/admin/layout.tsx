// @ts-nocheck
// Admin Layout - Protected admin area
// Uses existing auth patterns with enhanced permission checking

// Admin Layout - Protected admin area
// Simplified for demo purposes

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Simplified for demo - in production you'd check permissions here

  return (
    <div className="min-h-screen bg-[var(--sys-bg-primary)]">
      {/* Admin Header */}
      <header className="bg-[var(--sys-bg-primary)] shadow border-b border-[var(--sys-border-hairline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                Admin Configuration
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[var(--sys-text-secondary)]">
                System Administration
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-[var(--sys-bg-primary)] shadow-sm border-b border-[var(--sys-border-hairline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/admin/settings"
              className="border-b-2 border-[var(--sys-accent)] py-4 px-1 text-sm font-medium text-[var(--sys-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Admin settings page"
            >
              Settings
            </a>
            <a
              href="/admin/users"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:border-[var(--sys-border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Users and roles management page"
            >
              Users & Roles
            </a>
            <a
              href="/admin/audit"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:border-[var(--sys-border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Audit logs page"
            >
              Audit Logs
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
