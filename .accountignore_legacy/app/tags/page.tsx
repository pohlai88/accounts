import { TagTracking } from '@/components/accounts/tag-tracking'

export default function TagsPage() {
    // In a real app, get companyId from auth context
    const companyId = 'default-company-id'

    return (
        <div className="container mx-auto py-6">
            <TagTracking companyId={companyId} />
        </div>
    )
}
