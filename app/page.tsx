import DashboardShell from '@/components/DashboardShell'

export default function Home() {
  return <DashboardShell generatedAt={new Date().toISOString().replace('T', ' ').substring(0, 19)} />
}
