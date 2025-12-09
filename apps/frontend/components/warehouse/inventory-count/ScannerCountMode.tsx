'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Scan } from 'lucide-react'

interface ScanResult {
  success: boolean
  message: string
  variance?: 'found' | 'missing' | 'extra'
  item?: {
    lp?: {
      lp_number: string
      product?: {
        code: string
        name: string
      }
    }
  }
}

interface ScannerCountModeProps {
  countId: string
  onScan: (lpNumber: string) => Promise<ScanResult>
  disabled?: boolean
}

export function ScannerCountMode({ countId, onScan, disabled }: ScannerCountModeProps) {
  const [input, setInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  async function handleScan() {
    if (!input.trim() || scanning || disabled) return

    setScanning(true)
    try {
      const result = await onScan(input.trim())
      setLastResult(result)
      setRecentScans((prev) => [result, ...prev].slice(0, 10))
      setInput('')
    } catch (err) {
      setLastResult({
        success: false,
        message: err instanceof Error ? err.message : 'Scan failed',
      })
    } finally {
      setScanning(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  function getVarianceIcon(variance?: string) {
    switch (variance) {
      case 'found':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'extra':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Barcode Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan or enter LP number..."
            disabled={disabled || scanning}
            className="font-mono"
            autoComplete="off"
          />
          <Button onClick={handleScan} disabled={disabled || scanning || !input.trim()}>
            {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Scan
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div
            className={`p-4 rounded-lg border ${
              lastResult.success
                ? lastResult.variance === 'found'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {lastResult.success ? (
                getVarianceIcon(lastResult.variance)
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <div className="font-medium">
                  {lastResult.item?.lp?.lp_number || 'Unknown LP'}
                </div>
                <div className="text-sm text-muted-foreground">{lastResult.message}</div>
                {lastResult.item?.lp?.product && (
                  <div className="text-sm">
                    {lastResult.item.lp.product.code} - {lastResult.item.lp.product.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Recent Scans</div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {recentScans.map((scan, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded border bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {getVarianceIcon(scan.variance)}
                    <span className="font-mono text-sm">
                      {scan.item?.lp?.lp_number || 'Unknown'}
                    </span>
                  </div>
                  <Badge
                    variant={
                      scan.variance === 'found'
                        ? 'default'
                        : scan.variance === 'extra'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {scan.variance || 'error'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
