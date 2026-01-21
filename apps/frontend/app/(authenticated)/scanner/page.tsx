/**
 * Scanner Landing Page
 * Route: /scanner
 * Purpose: Mobile-optimized landing page for scanner workflows
 */

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Factory, CheckCircle2, MapPin, ArrowRightLeft } from 'lucide-react'

export const metadata = {
  title: 'Scanner Workflows | MonoPilot',
  description: 'Mobile-optimized workflows for shop floor operations',
}

interface WorkflowCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

const workflows: WorkflowCard[] = [
  {
    title: 'Receive Material',
    description: 'Receive incoming goods into warehouse inventory. Scan items, verify quantities, and create license plates.',
    href: '/scanner/receive',
    icon: <Package className="h-12 w-12 text-blue-600" />,
  },
  {
    title: 'Move LP',
    description: 'Move license plates between warehouse locations. Scan LP and destination to relocate inventory.',
    href: '/scanner/move',
    icon: <ArrowRightLeft className="h-12 w-12 text-cyan-600" />,
  },
  {
    title: 'Putaway',
    description: 'Move received goods to storage locations. Get FIFO/FEFO optimized location suggestions for efficient picking.',
    href: '/scanner/putaway',
    icon: <MapPin className="h-12 w-12 text-purple-600" />,
  },
  {
    title: 'Consume Material',
    description: 'Record material consumption for production work orders. Scan license plates and track usage.',
    href: '/scanner/consume',
    icon: <Factory className="h-12 w-12 text-orange-600" />,
  },
  {
    title: 'Register Output',
    description: 'Register finished goods from production. Create new license plates and record output quantities.',
    href: '/scanner/output',
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
  },
]

export default function ScannerLandingPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scanner Workflows</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Mobile-optimized workflows for shop floor operations
        </p>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {workflows.map((workflow) => (
          <Card
            key={workflow.href}
            className="flex flex-col hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-4">
                {workflow.icon}
              </div>
              <CardTitle className="text-xl text-center">{workflow.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-center text-sm leading-relaxed">
                {workflow.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4">
              <Button asChild className="w-full min-h-[48px] text-base font-medium">
                <Link href={workflow.href}>
                  Start
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
