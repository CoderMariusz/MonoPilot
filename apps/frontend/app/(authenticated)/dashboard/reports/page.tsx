/**
 * Dashboard Reports Page
 * Route: /dashboard/reports
 * Purpose: Report generation and management
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Download, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Reports | Dashboard | MonoPilot',
  description: 'Generate and manage business reports',
}

export default function DashboardReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage business reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Scheduled Reports
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Center
          </CardTitle>
          <CardDescription>
            This feature is under development. Check back soon for comprehensive reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              The report center will allow you to generate, schedule, and export 
              comprehensive reports including inventory, production, shipping, and financial data.
            </p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" asChild>
                <Link href="/dashboard/analytics">
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
