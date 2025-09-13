import { IntercompanyManagement } from '@/components/accounts/intercompany-management'

export default function IntercompanyPage() {
    // In a real app, get companyId from auth context
    const companyId = 'default-company-id'

    return (
        <div className="container mx-auto py-6">
            <IntercompanyManagement companyId={companyId} />
        </div>
    )
}
