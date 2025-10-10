import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin-dashboard'
import { isAdminSessionActive } from '@/lib/auth'

export default async function AdminPage() {
  const authenticated = await isAdminSessionActive()

  if (!authenticated) {
    redirect('/?admin=1')
  }

  return <AdminDashboard />
}
