export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Modern Accounting
          </h1>
          <h2 className="text-2xl text-blue-600">
            Fortune 500-Grade SaaS
          </h2>
          <p className="text-xl text-gray-600">
            ERPNext-inspired accounting with lightning-fast performance and modern UX
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <a 
              href="/login" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </a>
            <a 
              href="/erpnext-demo" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Demo
            </a>
          </div>
          
          <div className="text-sm text-gray-500 space-x-6">
            <span>✓ No Credit Card Required</span>
            <span>✓ Setup in 2 Minutes</span>
            <span>✓ Enterprise Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">3x Faster</h3>
            <p className="text-sm text-gray-600">716KB bundle vs competitors' 2-3MB</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold mb-2">ERPNext Logic</h3>
            <p className="text-sm text-gray-600">Battle-tested accounting patterns</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold mb-2">Modern UX</h3>
            <p className="text-sm text-gray-600">Mobile-first, accessible design</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Built with Next.js 15, Supabase, and ERPNext-inspired business logic
          </p>
        </div>
      </div>
    </div>
  )
}
