/**
 * Help Sheet Component (Story 05.19)
 * Purpose: Display help content for scanner workflows
 * BUG-080: Help button shows no content - implemented help modal with workflow instructions
 */

'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CheckCircle2, Package, ScanLine, ClipboardList, MapPin } from 'lucide-react'

interface HelpSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: 'receive' | 'putaway' | 'move' | 'output' | 'consume'
}

const WORKFLOW_HELP = {
  receive: {
    title: 'Receiving Goods',
    description: 'How to receive goods from a Purchase Order',
    steps: [
      {
        icon: ClipboardList,
        title: 'Step 1: Select Purchase Order',
        description: 'Choose a pending PO from the list or scan a PO barcode to begin receiving.',
      },
      {
        icon: Package,
        title: 'Step 2: Review Lines',
        description: 'View all items on the PO. Select a line item to receive, or scan a product barcode.',
      },
      {
        icon: ScanLine,
        title: 'Step 3: Enter Details',
        description: 'Enter the quantity received. If required, add batch number and expiry date. Select the storage location.',
      },
      {
        icon: CheckCircle2,
        title: 'Step 4: Confirm',
        description: 'Review all details and confirm the receipt. A GRN (Goods Receipt Note) will be generated.',
      },
      {
        icon: MapPin,
        title: 'Step 5: Complete',
        description: 'Receipt complete! You can receive more items from the same PO, start a new PO, or finish.',
      },
    ],
    tips: [
      'Use the barcode scanner for faster entry',
      'Batch numbers and expiry dates may be required based on warehouse settings',
      'Over-receiving is allowed up to configured limits',
      'Labels will print automatically if configured',
    ],
  },
  putaway: {
    title: 'Putaway',
    description: 'How to move received goods to storage locations',
    steps: [
      {
        icon: ScanLine,
        title: 'Step 1: Scan License Plate',
        description: 'Scan the LP barcode from the received goods.',
      },
      {
        icon: MapPin,
        title: 'Step 2: Select Location',
        description: 'Choose the destination location or follow the suggested location.',
      },
      {
        icon: CheckCircle2,
        title: 'Step 3: Confirm',
        description: 'Confirm the putaway to complete the move.',
      },
    ],
    tips: [
      'Follow suggested locations for optimal storage',
      'Verify the location barcode matches before confirming',
    ],
  },
  move: {
    title: 'Inventory Move',
    description: 'How to move inventory between locations',
    steps: [],
    tips: [],
  },
  output: {
    title: 'Production Output',
    description: 'How to record production output for work orders',
    steps: [
      {
        icon: ScanLine,
        title: 'Step 1: Scan Work Order',
        description: 'Scan the WO barcode or type it manually. The system will validate the work order status.',
      },
      {
        icon: Package,
        title: 'Step 2: Enter Quantity',
        description: 'Enter the quantity produced using the number pad. You will be warned if over-producing.',
      },
      {
        icon: ClipboardList,
        title: 'Step 3: Select QA Status',
        description: 'Choose the quality status: Approved, On Hold, or Rejected based on quality inspection.',
      },
      {
        icon: CheckCircle2,
        title: 'Step 4: Review & Confirm',
        description: 'Review all details and confirm the output. A License Plate (LP) will be created.',
      },
      {
        icon: MapPin,
        title: 'Step 5: Print Label',
        description: 'Print the LP label for the produced goods. You can skip if printer is not available.',
      },
    ],
    tips: [
      'WO must be in "Started" status to register output',
      'Batch numbers are auto-assigned from the work order',
      'Over-production will show a warning but can be confirmed',
      'By-products can be registered after the main output',
      'LP labels include QR code for easy scanning',
    ],
  },
  consume: {
    title: 'Material Consumption',
    description: 'How to consume materials for a work order',
    steps: [
      {
        icon: ClipboardList,
        title: 'Step 1: Scan Work Order',
        description: 'Scan the WO barcode or enter the work order number to select the production order.',
      },
      {
        icon: ScanLine,
        title: 'Step 2: Scan License Plate',
        description: 'Scan the LP barcode of the material to consume. The system shows required materials and quantities.',
      },
      {
        icon: Package,
        title: 'Step 3: Enter Quantity',
        description: 'Enter the quantity to consume, or use "Consume Full LP" for the entire license plate.',
      },
      {
        icon: CheckCircle2,
        title: 'Step 4: Review & Confirm',
        description: 'Review the consumption details and confirm. The material will be deducted from inventory.',
      },
      {
        icon: MapPin,
        title: 'Step 5: Next Material',
        description: 'Continue with more materials for the same WO, or finish when complete.',
      },
    ],
    tips: [
      'Use the barcode scanner for faster entry',
      'Some materials require consuming the full LP (indicated by a lock icon)',
      'Check the material list to see remaining quantities needed',
      'You can consume from multiple LPs for the same material',
    ],
  },
}

export function HelpSheet({ open, onOpenChange, workflow }: HelpSheetProps) {
  const help = WORKFLOW_HELP[workflow]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl">{help.title}</SheetTitle>
          <SheetDescription>{help.description}</SheetDescription>
        </SheetHeader>

        {/* Workflow Steps */}
        <div className="space-y-4 mt-4">
          <h3 className="font-semibold text-gray-900">Workflow Steps</h3>
          <div className="space-y-3">
            {help.steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {help.tips.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-gray-900">Tips</h3>
            <ul className="space-y-2">
              {help.tips.map((tip, index) => (
                <li key={index} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-blue-600">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close hint */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          Swipe down or tap outside to close
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default HelpSheet
