/**
 * Step 6: Next Material or Done (Story 04.6b)
 * Purpose: Success state with next actions
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import { Check, ArrowRight, Home, Package, PartyPopper } from 'lucide-react'
import type { WOData, WOMaterial } from '@/lib/hooks/use-scanner-flow'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

interface Step6NextProps {
  woData: WOData
  consumedMaterial?: ConsumptionMaterial
  consumeQty: number
  onNextMaterial: () => void
  onDone: () => void
}

export function Step6Next({
  woData,
  consumedMaterial,
  consumeQty,
  onNextMaterial,
  onDone,
}: Step6NextProps) {
  // Count completed and remaining materials
  const materials = woData.materials || []
  const completedMaterials = materials.filter((m) => m.consumed_qty >= m.required_qty)
  const remainingMaterials = materials.filter((m) => m.consumed_qty < m.required_qty)
  const allComplete = remainingMaterials.length === 0

  // Calculate overall progress
  const totalRequired = materials.reduce((sum, m) => sum + m.required_qty, 0)
  const totalConsumed = materials.reduce((sum, m) => sum + m.consumed_qty, 0)
  const overallProgress = totalRequired > 0 ? Math.round((totalConsumed / totalRequired) * 100) : 0

  // Next material (first remaining)
  const nextMaterial = remainingMaterials[0]

  return (
    <div className="flex-1 flex flex-col p-4 overflow-auto">
      {allComplete ? (
        // All materials consumed
        <>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <PartyPopper className="h-24 w-24 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">All materials consumed!</h2>
            <p className="text-gray-500 mb-6">Work order ready for output registration.</p>

            {/* WO Summary Card */}
            <div className="w-full bg-slate-800 text-white p-4 rounded-lg mb-4">
              <div className="font-medium text-lg">{woData.wo_number}</div>
              <div className="text-slate-400">{woData.product_name}</div>

              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Materials consumed</span>
                  <span>
                    {completedMaterials.length} of {materials.length}
                  </span>
                </div>
                <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {completedMaterials.map((mat) => (
                  <div key={mat.id} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>
                      {mat.material_name}: {mat.consumed_qty} {(mat as WOMaterial & { uom?: string }).uom || 'units'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Next Steps:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Register output (finished goods)</li>
                <li>Complete work order</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-safe">
            <Button variant="outline" onClick={onDone} className="w-[30%] h-12 min-h-[48px] font-semibold">
              Done
            </Button>
            <Button
              onClick={onDone}
              className={cn(
                'flex-1 h-14 min-h-[56px] text-lg font-semibold',
                'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              <Home className="h-5 w-5 mr-2" />
              Register Output
            </Button>
          </div>
        </>
      ) : (
        // More materials remaining
        <>
          <div className="text-center mb-6">
            <SuccessAnimation show size={96} duration={2000} />
            <h2 className="text-2xl font-bold text-green-600 mt-4 mb-2">Material Consumed Successfully</h2>
          </div>

          {/* Consumed Material Card */}
          {consumedMaterial && (
            <div className="bg-green-900/20 border border-green-600 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                <span className="font-medium text-green-300">{consumedMaterial.material_name}</span>
              </div>
              <p className="text-sm text-green-400 mt-1">
                Consumed: {consumeQty} {consumedMaterial.uom}
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-green-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((consumedMaterial.consumed_qty / consumedMaterial.required_qty) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Materials consumed</span>
              <span className="text-gray-900 font-medium">
                {completedMaterials.length} of {materials.length}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{overallProgress}% complete</p>
          </div>

          {/* Remaining Materials */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Remaining Materials:</h3>
            <div className="space-y-2">
              {remainingMaterials.map((mat, idx) => {
                const isNext = idx === 0
                const progress =
                  mat.required_qty > 0 ? Math.round((mat.consumed_qty / mat.required_qty) * 100) : 0

                return (
                  <div
                    key={mat.id}
                    className={cn(
                      'p-3 rounded-lg border min-h-[64px]',
                      isNext ? 'bg-cyan-900/10 border-cyan-600' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Package className={cn('h-5 w-5 mt-0.5', isNext ? 'text-cyan-600' : 'text-slate-500')} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn('font-medium', isNext && 'text-cyan-700')}>{mat.material_name}</span>
                          {isNext && (
                            <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">Next</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Required: {mat.required_qty} {(mat as ConsumptionMaterial).uom || 'units'}
                        </p>
                        <p className="text-sm text-gray-500">Consumed: {mat.consumed_qty} ({progress}%)</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-sm text-gray-500 mb-4">
            <p>Quick Stats:</p>
            <ul className="mt-1">
              <li>Materials completed: {completedMaterials.length}</li>
              <li>Materials remaining: {remainingMaterials.length}</li>
            </ul>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex gap-3 pb-safe">
            <Button variant="outline" onClick={onDone} className="w-[30%] h-12 min-h-[48px] font-semibold">
              Done
            </Button>
            <Button
              onClick={onNextMaterial}
              className={cn(
                'flex-1 h-12 min-h-[48px] text-lg font-semibold',
                'bg-cyan-600 hover:bg-cyan-700 text-white'
              )}
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Next Material
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default Step6Next
