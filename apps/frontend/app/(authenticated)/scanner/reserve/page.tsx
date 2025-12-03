/**
 * Scanner Material Reservation Page
 * Story 4.8: Material Reservation (Scanner)
 * Mobile-first, touch-optimized, barcode-driven material reservation
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Package,
  Scan,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Volume2,
  VolumeX,
  WifiOff,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Material {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  consume_whole_lp: boolean
}

interface AvailableLP {
  id: string
  lp_number: string
  quantity: number
  current_qty: number
  uom: string
  expiry_date: string | null
  location_name: string | null
}

interface RecentWO {
  id: string
  wo_number: string
  product_name: string
  scanned_at: string
}

interface QueuedReservation {
  wo_id: string
  material_id: string
  lp_id: string
  reserved_qty: number
  timestamp: string
  status: 'pending' | 'syncing' | 'done' | 'error'
  error?: string
}

type ScannerStep = 'home' | 'wo-loading' | 'materials' | 'lp-scan' | 'qty-entry' | 'complete' | 'error'

// ============================================================================
// Constants
// ============================================================================

const RECENT_WOS_KEY = 'scanner_recent_wos'
const OFFLINE_QUEUE_KEY = 'scanner_offline_queue'
const AUDIO_ENABLED_KEY = 'scanner_audio_enabled'
const MAX_RECENT_WOS = 5

// ============================================================================
// Audio Feedback
// ============================================================================

function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {
    // Audio not supported
  }
}

function playErrorBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 300
    osc.type = 'square'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
    // Second beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 300
      osc2.type = 'square'
      gain2.gain.setValueAtTime(0.3, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.15)
    }, 200)
  } catch {
    // Audio not supported
  }
}

// ============================================================================
// Component
// ============================================================================

export default function ScannerReservePage() {
  // State
  const [step, setStep] = useState<ScannerStep>('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)

  // WO State
  const [woSearch, setWoSearch] = useState('')
  const [currentWO, setCurrentWO] = useState<{ id: string; wo_number: string; product_name: string; status: string } | null>(null)
  const [recentWOs, setRecentWOs] = useState<RecentWO[]>([])

  // Materials State
  const [materials, setMaterials] = useState<Material[]>([])
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0)

  // LP State
  const [lpSearch, setLpSearch] = useState('')
  const [selectedLP, setSelectedLP] = useState<AvailableLP | null>(null)
  const [reservedQty, setReservedQty] = useState<number>(0)

  // Settings
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<QueuedReservation[]>([])

  const { toast } = useToast()
  const lpInputRef = useRef<HTMLInputElement>(null)
  const woInputRef = useRef<HTMLInputElement>(null)

  // ============================================================================
  // Effects
  // ============================================================================

  // Load settings from localStorage
  useEffect(() => {
    const savedAudio = localStorage.getItem(AUDIO_ENABLED_KEY)
    if (savedAudio !== null) {
      setAudioEnabled(JSON.parse(savedAudio))
    }

    const savedRecent = localStorage.getItem(RECENT_WOS_KEY)
    if (savedRecent) {
      setRecentWOs(JSON.parse(savedRecent))
    }

    const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue))
    }
  }, [])

  // Network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-focus inputs
  useEffect(() => {
    if (step === 'home' && woInputRef.current) {
      woInputRef.current.focus()
    }
    if (step === 'lp-scan' && lpInputRef.current) {
      lpInputRef.current.focus()
    }
  }, [step])

  // ============================================================================
  // Functions
  // ============================================================================

  const currentMaterial = materials[currentMaterialIndex]

  // Save audio setting
  const toggleAudio = () => {
    const newValue = !audioEnabled
    setAudioEnabled(newValue)
    localStorage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(newValue))
  }

  // Add to recent WOs
  const addToRecentWOs = (wo: { id: string; wo_number: string; product_name: string }) => {
    const recent: RecentWO = { ...wo, scanned_at: new Date().toISOString() }
    const updated = [recent, ...recentWOs.filter(r => r.id !== wo.id)].slice(0, MAX_RECENT_WOS)
    setRecentWOs(updated)
    localStorage.setItem(RECENT_WOS_KEY, JSON.stringify(updated))
  }

  // Sync offline queue
  const syncOfflineQueue = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as QueuedReservation[]
    const pending = queue.filter(q => q.status === 'pending')

    if (pending.length === 0) return

    toast({ title: 'Syncing', description: `Syncing ${pending.length} queued reservations...` })

    for (const item of pending) {
      try {
        const response = await fetch(`/api/production/work-orders/${item.wo_id}/materials/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            material_id: item.material_id,
            lp_id: item.lp_id,
            reserved_qty: item.reserved_qty,
          }),
        })

        if (response.ok) {
          item.status = 'done'
        } else {
          const result = await response.json()
          item.status = 'error'
          item.error = result.message
        }
      } catch {
        item.status = 'error'
        item.error = 'Network error'
      }
    }

    const updated = queue.filter(q => q.status !== 'done')
    setOfflineQueue(updated)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated))

    const errors = updated.filter(q => q.status === 'error')
    if (errors.length > 0) {
      toast({ title: 'Sync Errors', description: `${errors.length} reservations failed`, variant: 'destructive' })
    } else {
      toast({ title: 'Sync Complete', description: 'All queued reservations synced' })
    }
  }, [toast])

  // Queue offline reservation
  const queueReservation = (woId: string, materialId: string, lpId: string, qty: number) => {
    const item: QueuedReservation = {
      wo_id: woId,
      material_id: materialId,
      lp_id: lpId,
      reserved_qty: qty,
      timestamp: new Date().toISOString(),
      status: 'pending',
    }
    const updated = [...offlineQueue, item]
    setOfflineQueue(updated)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated))
  }

  // Lookup WO
  const lookupWO = async (woNumber: string) => {
    if (!woNumber.trim()) return

    setLoading(true)
    setError(null)
    setStep('wo-loading')

    try {
      // Search for WO by number
      const response = await fetch(`/api/planning/work-orders?search=${encodeURIComponent(woNumber)}&limit=1`)

      if (!response.ok) {
        throw new Error('Failed to find work order')
      }

      const result = await response.json()
      const wo = result.data?.[0]

      if (!wo) {
        setError({ code: 'WO_NOT_FOUND', message: `Work order "${woNumber}" not found` })
        setStep('error')
        if (audioEnabled) playErrorBeep()
        return
      }

      if (wo.status !== 'in_progress') {
        setError({ code: 'WO_NOT_IN_PROGRESS', message: `WO ${wo.wo_number} is not in progress (status: ${wo.status})` })
        setStep('error')
        if (audioEnabled) playErrorBeep()
        return
      }

      // Fetch materials
      const materialsResponse = await fetch(`/api/production/work-orders/${wo.id}/materials`)
      if (!materialsResponse.ok) {
        throw new Error('Failed to fetch materials')
      }

      const materialsResult = await materialsResponse.json()

      setCurrentWO({
        id: wo.id,
        wo_number: wo.wo_number,
        product_name: wo.product?.name || 'Unknown Product',
        status: wo.status,
      })
      setMaterials(materialsResult.data || [])
      setCurrentMaterialIndex(0)
      addToRecentWOs({ id: wo.id, wo_number: wo.wo_number, product_name: wo.product?.name || 'Unknown' })

      if (audioEnabled) playSuccessBeep()
      setStep('materials')
    } catch (err) {
      console.error('WO lookup error:', err)
      setError({ code: 'LOOKUP_ERROR', message: 'Failed to load work order' })
      setStep('error')
      if (audioEnabled) playErrorBeep()
    } finally {
      setLoading(false)
    }
  }

  // Lookup LP
  const lookupLP = async (lpNumber: string) => {
    if (!lpNumber.trim() || !currentMaterial) return

    setLoading(true)
    setError(null)

    try {
      // Search for LP
      const response = await fetch(
        `/api/production/work-orders/${currentWO?.id}/materials/available-lps?product_id=${currentMaterial.product_id}&uom=${currentMaterial.uom}&search=${encodeURIComponent(lpNumber)}`
      )

      if (!response.ok) {
        throw new Error('Failed to search LPs')
      }

      const result = await response.json()
      const lp = result.data?.find((l: AvailableLP) => l.lp_number.toLowerCase() === lpNumber.toLowerCase())

      if (!lp) {
        // Check if LP exists but wrong product
        const checkResponse = await fetch(`/api/warehouse/license-plates?search=${encodeURIComponent(lpNumber)}&limit=1`)
        if (checkResponse.ok) {
          const checkResult = await checkResponse.json()
          const existingLP = checkResult.data?.[0]

          if (existingLP && existingLP.product_id !== currentMaterial.product_id) {
            setError({
              code: 'PRODUCT_MISMATCH',
              message: `LP contains different product. Expected: ${currentMaterial.material_name}`,
            })
            setStep('error')
            if (audioEnabled) playErrorBeep()
            return
          }
        }

        setError({ code: 'LP_NOT_FOUND', message: `LP "${lpNumber}" not found or not available` })
        setStep('error')
        if (audioEnabled) playErrorBeep()
        return
      }

      setSelectedLP(lp)

      // Set default qty
      const remaining = Math.max(0, currentMaterial.required_qty - currentMaterial.reserved_qty)
      if (currentMaterial.consume_whole_lp) {
        setReservedQty(lp.current_qty)
      } else {
        setReservedQty(Math.min(remaining, lp.current_qty))
      }

      if (audioEnabled) playSuccessBeep()
      setStep('qty-entry')
    } catch (err) {
      console.error('LP lookup error:', err)
      setError({ code: 'LOOKUP_ERROR', message: 'Failed to search license plates' })
      setStep('error')
      if (audioEnabled) playErrorBeep()
    } finally {
      setLoading(false)
      setLpSearch('')
    }
  }

  // Reserve material
  const reserveMaterial = async () => {
    if (!currentWO || !currentMaterial || !selectedLP) return

    setLoading(true)

    // Offline handling
    if (!isOnline) {
      queueReservation(currentWO.id, currentMaterial.id, selectedLP.id, reservedQty)
      toast({ title: 'Queued', description: 'Reservation queued for sync when online' })

      // Update local state
      const updatedMaterials = [...materials]
      updatedMaterials[currentMaterialIndex] = {
        ...currentMaterial,
        reserved_qty: currentMaterial.reserved_qty + reservedQty,
      }
      setMaterials(updatedMaterials)

      moveToNextMaterial()
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/production/work-orders/${currentWO.id}/materials/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: currentMaterial.id,
          lp_id: selectedLP.id,
          reserved_qty: reservedQty,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError({ code: result.error || 'RESERVE_ERROR', message: result.message || 'Failed to reserve' })
        setStep('error')
        if (audioEnabled) playErrorBeep()
        return
      }

      // Update materials
      const updatedMaterials = [...materials]
      updatedMaterials[currentMaterialIndex] = {
        ...currentMaterial,
        reserved_qty: currentMaterial.reserved_qty + reservedQty,
      }
      setMaterials(updatedMaterials)

      toast({ title: 'Reserved', description: `${reservedQty} ${currentMaterial.uom} reserved` })
      if (audioEnabled) playSuccessBeep()

      moveToNextMaterial()
    } catch (err) {
      console.error('Reserve error:', err)
      setError({ code: 'NETWORK_ERROR', message: 'Network error. Try again.' })
      setStep('error')
      if (audioEnabled) playErrorBeep()
    } finally {
      setLoading(false)
    }
  }

  // Move to next material
  const moveToNextMaterial = () => {
    setSelectedLP(null)
    setReservedQty(0)

    // Check if all materials complete
    const allComplete = materials.every((m, i) => {
      if (i === currentMaterialIndex) {
        return (m.reserved_qty + reservedQty) >= m.required_qty
      }
      return m.reserved_qty >= m.required_qty
    })

    if (allComplete) {
      setStep('complete')
      return
    }

    // Find next incomplete material
    for (let i = currentMaterialIndex + 1; i < materials.length; i++) {
      if (materials[i].reserved_qty < materials[i].required_qty) {
        setCurrentMaterialIndex(i)
        setStep('materials')
        return
      }
    }

    // Wrap around
    for (let i = 0; i < currentMaterialIndex; i++) {
      if (materials[i].reserved_qty < materials[i].required_qty) {
        setCurrentMaterialIndex(i)
        setStep('materials')
        return
      }
    }

    setStep('complete')
  }

  // Reset to home
  const goHome = () => {
    setStep('home')
    setCurrentWO(null)
    setMaterials([])
    setCurrentMaterialIndex(0)
    setSelectedLP(null)
    setError(null)
    setWoSearch('')
    setLpSearch('')
  }

  // Calculate progress
  const getProgress = (m: Material) => {
    if (m.required_qty === 0) return 100
    return Math.min(100, (m.reserved_qty / m.required_qty) * 100)
  }

  const getOverallProgress = () => {
    if (materials.length === 0) return 0
    const total = materials.reduce((sum, m) => sum + getProgress(m), 0)
    return total / materials.length
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-3 flex items-center justify-center gap-2 z-50">
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">Offline - Reservations will be queued</span>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between mb-4 ${!isOnline ? 'mt-12' : ''}`}>
        <div className="flex items-center gap-2">
          {step !== 'home' && (
            <Button variant="ghost" size="icon" onClick={goHome} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Material Reservation</h1>
        </div>
        <div className="flex items-center gap-2">
          {offlineQueue.length > 0 && (
            <Badge variant="secondary" className="h-8">
              {offlineQueue.length} queued
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="h-12 w-12"
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* HOME SCREEN */}
      {step === 'home' && (
        <div className="space-y-4">
          {/* Main Scan Button */}
          <Card className="bg-green-600 text-white">
            <CardContent className="p-6">
              <Button
                className="w-full h-16 text-xl bg-green-700 hover:bg-green-800"
                onClick={() => woInputRef.current?.focus()}
              >
                <Scan className="h-8 w-8 mr-3" />
                Scan WO Barcode
              </Button>
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={woInputRef}
                    placeholder="Enter WO number..."
                    value={woSearch}
                    onChange={(e) => setWoSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupWO(woSearch)}
                    className="pl-10 h-14 text-lg"
                  />
                </div>
                <Button
                  onClick={() => lookupWO(woSearch)}
                  disabled={!woSearch.trim() || loading}
                  className="h-14 px-6"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Go'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent WOs */}
          {recentWOs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Work Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentWOs.map((wo) => (
                  <Button
                    key={wo.id}
                    variant="outline"
                    className="w-full h-14 justify-start text-left"
                    onClick={() => lookupWO(wo.wo_number)}
                  >
                    <Package className="h-5 w-5 mr-3" />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium truncate">{wo.wo_number}</div>
                      <div className="text-sm text-gray-500 truncate">{wo.product_name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* WO LOADING */}
      {step === 'wo-loading' && (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg">Loading work order...</p>
        </div>
      )}

      {/* MATERIALS LIST */}
      {step === 'materials' && currentWO && currentMaterial && (
        <div className="space-y-4">
          {/* WO Header */}
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{currentWO.wo_number}</div>
                  <div className="text-blue-100">{currentWO.product_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{getOverallProgress().toFixed(0)}%</div>
                  <div className="text-blue-100">overall</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Material */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{currentMaterial.material_name}</CardTitle>
                <Badge variant={getProgress(currentMaterial) >= 100 ? 'default' : 'secondary'}>
                  {currentMaterialIndex + 1} / {materials.length}
                </Badge>
              </div>
              {currentMaterial.consume_whole_lp && (
                <Badge variant="outline" className="w-fit text-orange-600 border-orange-600">
                  Whole LP Required
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Required: <strong>{currentMaterial.required_qty} {currentMaterial.uom}</strong></span>
                  <span>Reserved: <strong>{currentMaterial.reserved_qty} {currentMaterial.uom}</strong></span>
                </div>
                <Progress value={getProgress(currentMaterial)} className="h-4" />
                <div className="text-center font-medium text-lg">
                  {getProgress(currentMaterial) >= 100 ? (
                    <span className="text-green-600 flex items-center justify-center gap-2">
                      <Check className="h-5 w-5" /> Complete
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      Remaining: {Math.max(0, currentMaterial.required_qty - currentMaterial.reserved_qty)} {currentMaterial.uom}
                    </span>
                  )}
                </div>
              </div>

              {/* Scan LP Button */}
              {getProgress(currentMaterial) < 100 && (
                <Button
                  className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
                  onClick={() => setStep('lp-scan')}
                >
                  <Scan className="h-6 w-6 mr-3" />
                  Scan LP Barcode
                </Button>
              )}

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-14"
                  disabled={currentMaterialIndex === 0}
                  onClick={() => setCurrentMaterialIndex(currentMaterialIndex - 1)}
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14"
                  disabled={currentMaterialIndex === materials.length - 1}
                  onClick={() => setCurrentMaterialIndex(currentMaterialIndex + 1)}
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Materials Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {materials.map((m, i) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    i === currentMaterialIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentMaterialIndex(i)}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-sm ${
                    getProgress(m) >= 100 ? 'bg-green-500' : getProgress(m) > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {getProgress(m) >= 100 ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{m.material_name}</div>
                    <div className="text-sm text-gray-500">
                      {m.reserved_qty}/{m.required_qty} {m.uom}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {getProgress(m).toFixed(0)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* LP SCAN */}
      {step === 'lp-scan' && currentMaterial && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan LP for {currentMaterial.material_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <div className="text-gray-500 mb-2">Remaining to reserve:</div>
                <div className="text-3xl font-bold">
                  {Math.max(0, currentMaterial.required_qty - currentMaterial.reserved_qty)} {currentMaterial.uom}
                </div>
              </div>

              <div className="relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  ref={lpInputRef}
                  placeholder="Scan or enter LP number..."
                  value={lpSearch}
                  onChange={(e) => setLpSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupLP(lpSearch)}
                  className="pl-10 h-16 text-xl"
                  autoFocus
                />
              </div>

              <Button
                className="w-full h-14"
                onClick={() => lookupLP(lpSearch)}
                disabled={!lpSearch.trim() || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Search LP
              </Button>

              <Button
                variant="outline"
                className="w-full h-14"
                onClick={() => setStep('materials')}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Material
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QTY ENTRY */}
      {step === 'qty-entry' && currentMaterial && selectedLP && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reserve {currentMaterial.material_name}</CardTitle>
              <div className="text-lg font-mono">{selectedLP.lp_number}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-500">Available</div>
                  <div className="text-2xl font-bold">{selectedLP.current_qty} {currentMaterial.uom}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Remaining</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.max(0, currentMaterial.required_qty - currentMaterial.reserved_qty)} {currentMaterial.uom}
                  </div>
                </div>
              </div>

              {currentMaterial.consume_whole_lp ? (
                <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg text-center">
                  <div className="text-orange-600 mb-2">Entire LP Required</div>
                  <div className="text-3xl font-bold">{selectedLP.current_qty} {currentMaterial.uom}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-gray-500 mb-2">Quantity to Reserve</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14"
                        onClick={() => setReservedQty(Math.max(0, reservedQty - 1))}
                        disabled={reservedQty <= 0}
                      >
                        <Minus className="h-6 w-6" />
                      </Button>
                      <Input
                        type="number"
                        value={reservedQty}
                        onChange={(e) => setReservedQty(Math.min(selectedLP.current_qty, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-32 h-16 text-3xl text-center font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14"
                        onClick={() => setReservedQty(Math.min(selectedLP.current_qty, reservedQty + 1))}
                        disabled={reservedQty >= selectedLP.current_qty}
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="text-gray-500 mt-2">{currentMaterial.uom}</div>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
                onClick={reserveMaterial}
                disabled={loading || reservedQty <= 0}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Check className="h-6 w-6 mr-2" />}
                {currentMaterial.consume_whole_lp ? 'Reserve Full LP!' : 'Reserve!'}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14"
                onClick={() => {
                  setSelectedLP(null)
                  setStep('lp-scan')
                }}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Scan Different LP
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COMPLETE */}
      {step === 'complete' && currentWO && (
        <div className="space-y-4">
          <Card className="bg-green-600 text-white">
            <CardContent className="p-8 text-center">
              <Check className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Materials Reserved!</h2>
              <p className="text-green-100">{currentWO.wo_number} is ready for production</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <div className="flex-1">{m.material_name}</div>
                  <div className="font-mono">{m.reserved_qty} / {m.required_qty} {m.uom}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-14" onClick={goHome}>
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700">
              Start Production
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {step === 'error' && error && (
        <div className="space-y-4">
          <Card className="bg-red-600 text-white">
            <CardContent className="p-6 text-center">
              <X className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-xl mb-2">{error.code}</p>
              <p className="text-red-100">{error.message}</p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-14"
              onClick={goHome}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Go Home
            </Button>
            <Button
              className="flex-1 h-14"
              onClick={() => {
                setError(null)
                if (currentWO && currentMaterial) {
                  setStep('lp-scan')
                } else {
                  setStep('home')
                }
              }}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
