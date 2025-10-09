import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin-dashboard'
import { isAdminSessionActive } from '@/lib/auth'

export default function AdminPage() {
  if (!isAdminSessionActive()) {
    redirect('/?admin=1')
  }

  return <AdminDashboard />
}
