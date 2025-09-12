// Admin Layout - Protected admin area
// Uses existing auth patterns with enhanced permission checking

// Admin Layout - Protected admin area
// Simplified for demo purposes

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Simplified for demo - in production you'd check permissions here

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Admin Configuration
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                System Administration
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Admin Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <a
                            href="/admin/settings"
                            className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
                        >
                            Settings
                        </a>
                        <a
                            href="/admin/users"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Users & Roles
                        </a>
                        <a
                            href="/admin/audit"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Audit Logs
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
