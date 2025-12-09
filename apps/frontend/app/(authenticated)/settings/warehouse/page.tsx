/**
 * Warehouse Settings Page
 * Story 5.31: Warehouse Settings Configuration
 *
 * Sections: LP Config, Scanner Config, Barcode Config
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Package,
  Smartphone,
  Barcode,
  Printer,
  Loader2,
  Save,
  Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WarehouseSettings {
  id: string
  org_id: string
  // LP Configuration
  lp_number_format: string
  auto_print_labels: boolean
  allow_over_receipt: boolean
  over_receipt_tolerance_pct: number
  // Scanner Configuration
  scanner_session_timeout_mins: number
  scanner_warning_timeout_secs: number
  max_offline_operations: number
  offline_warning_threshold_pct: number
  // Barcode Configuration
  barcode_format_lp: string
  barcode_format_product: string
  barcode_format_location: string
  // Printer Configuration
  printer_config: PrinterConfig | null
  // ZPL Template
  zpl_label_template: string | null
  // Barcode patterns
  barcode_patterns: BarcodePatterns | null
  created_at: string
  updated_at: string
}

interface PrinterConfig {
  ip?: string
  port?: number
  model?: string
  dpi?: number
}

interface BarcodePatterns {
  lp_pattern?: string
  product_pattern?: string
  location_pattern?: string
}

const BARCODE_FORMATS = [
  { value: 'EAN128', label: 'EAN-128 (GS1-128)' },
  { value: 'CODE128', label: 'Code 128' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'QR', label: 'QR Code' },
  { value: 'DATAMATRIX', label: 'Data Matrix' },
]

export default function WarehouseSettingsPage() {
  const [settings, setSettings] = useState<WarehouseSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [printerModalOpen, setPrinterModalOpen] = useState(false)
  const [printerForm, setPrinterForm] = useState<PrinterConfig>({
    ip: '',
    port: 9100,
    model: '',
    dpi: 203,
  })
  const { toast } = useToast()

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouse/org-settings')

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.settings)

      // Initialize printer form if config exists
      if (data.settings.printer_config) {
        setPrinterForm(data.settings.printer_config)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load warehouse settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Save settings
  const saveSettings = async (updatedSettings: Partial<WarehouseSettings>) => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/warehouse/org-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data.settings)

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // LP Format preview
  const getLPFormatPreview = () => {
    if (!settings) return ''
    const format = settings.lp_number_format
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    return format
      .replace('{WH}', 'WH01')
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('NNNN', '0001')
  }

  // Handle printer config save
  const handleSavePrinterConfig = () => {
    saveSettings({ printer_config: printerForm })
    setPrinterModalOpen(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-gray-500">Failed to load settings</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Warehouse Settings</h1>
        {saving && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </div>
        )}
      </div>

      <Tabs defaultValue="lp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lp" className="gap-2">
            <Package className="h-4 w-4" />
            LP Configuration
          </TabsTrigger>
          <TabsTrigger value="scanner" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Scanner Configuration
          </TabsTrigger>
          <TabsTrigger value="barcode" className="gap-2">
            <Barcode className="h-4 w-4" />
            Barcode Configuration
          </TabsTrigger>
        </TabsList>

        {/* LP Configuration Tab */}
        <TabsContent value="lp" className="space-y-6">
          {/* LP Number Format */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">LP Number Format</h2>

            <div className="space-y-2">
              <Label htmlFor="lp-format">Format Template</Label>
              <Input
                id="lp-format"
                value={settings.lp_number_format}
                onChange={(e) =>
                  setSettings({ ...settings, lp_number_format: e.target.value })
                }
                onBlur={() => saveSettings({ lp_number_format: settings.lp_number_format })}
                placeholder="LP-{WH}-YYYYMMDD-NNNN"
              />
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Placeholders: {'{WH}'} = warehouse code, YYYY/MM/DD = date, NNNN = sequence
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded border">
              <Label className="text-sm text-gray-600">Preview</Label>
              <p className="text-lg font-mono mt-1">{getLPFormatPreview()}</p>
            </div>
          </div>

          {/* Auto-print & Over-receipt */}
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">LP Settings</h2>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-print">Auto-print Labels</Label>
                <p className="text-sm text-gray-500">
                  Automatically print LP labels after creation
                </p>
              </div>
              <Switch
                id="auto-print"
                checked={settings.auto_print_labels}
                onCheckedChange={(checked) =>
                  saveSettings({ auto_print_labels: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-over-receipt">Allow Over-receipt</Label>
                <p className="text-sm text-gray-500">
                  Allow receiving more than ordered quantity
                </p>
              </div>
              <Switch
                id="allow-over-receipt"
                checked={settings.allow_over_receipt}
                onCheckedChange={(checked) =>
                  saveSettings({ allow_over_receipt: checked })
                }
              />
            </div>

            {settings.allow_over_receipt && (
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="over-receipt-tolerance">Over-receipt Tolerance</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="over-receipt-tolerance"
                      type="number"
                      value={settings.over_receipt_tolerance_pct}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          over_receipt_tolerance_pct: Number(e.target.value),
                        })
                      }
                      onBlur={() =>
                        saveSettings({ over_receipt_tolerance_pct: settings.over_receipt_tolerance_pct })
                      }
                      min="0"
                      max="100"
                      step="1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum percentage over PO quantity allowed (0-100%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Scanner Configuration Tab */}
        <TabsContent value="scanner" className="space-y-6">
          {/* Session Timeout */}
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">Session Timeout</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="session-timeout">Session Timeout</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.scanner_session_timeout_mins}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        scanner_session_timeout_mins: Number(e.target.value),
                      })
                    }
                    onBlur={() =>
                      saveSettings({ scanner_session_timeout_mins: settings.scanner_session_timeout_mins })
                    }
                    min="1"
                    max="60"
                    step="1"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Scanner session expires after inactivity (1-60 min)
                </p>
              </div>

              <div>
                <Label htmlFor="warning-timeout">Warning Before Timeout</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="warning-timeout"
                    type="number"
                    value={settings.scanner_warning_timeout_secs}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        scanner_warning_timeout_secs: Number(e.target.value),
                      })
                    }
                    onBlur={() =>
                      saveSettings({ scanner_warning_timeout_secs: settings.scanner_warning_timeout_secs })
                    }
                    min="1"
                    max="60"
                    step="1"
                  />
                  <span className="text-sm text-gray-500">seconds</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Show warning before session expires (1-60 sec)
                </p>
              </div>
            </div>
          </div>

          {/* Offline Operations */}
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">Offline Operations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="max-offline">Max Offline Operations</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="max-offline"
                    type="number"
                    value={settings.max_offline_operations}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        max_offline_operations: Number(e.target.value),
                      })
                    }
                    onBlur={() =>
                      saveSettings({ max_offline_operations: settings.max_offline_operations })
                    }
                    min="10"
                    max="1000"
                    step="10"
                  />
                  <span className="text-sm text-gray-500">ops</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum operations to queue when offline
                </p>
              </div>

              <div>
                <Label htmlFor="offline-warning">Warning Threshold</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="offline-warning"
                    type="number"
                    value={settings.offline_warning_threshold_pct}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        offline_warning_threshold_pct: Number(e.target.value),
                      })
                    }
                    onBlur={() =>
                      saveSettings({ offline_warning_threshold_pct: settings.offline_warning_threshold_pct })
                    }
                    min="0"
                    max="100"
                    step="5"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Show warning at this threshold (0-100%)
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Barcode Configuration Tab */}
        <TabsContent value="barcode" className="space-y-6">
          {/* Barcode Formats */}
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">Barcode Formats</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="barcode-lp">License Plate Format</Label>
                <Select
                  value={settings.barcode_format_lp}
                  onValueChange={(value) =>
                    saveSettings({ barcode_format_lp: value })
                  }
                >
                  <SelectTrigger id="barcode-lp" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="barcode-product">Product Format</Label>
                <Select
                  value={settings.barcode_format_product}
                  onValueChange={(value) =>
                    saveSettings({ barcode_format_product: value })
                  }
                >
                  <SelectTrigger id="barcode-product" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="barcode-location">Location Format</Label>
                <Select
                  value={settings.barcode_format_location}
                  onValueChange={(value) =>
                    saveSettings({ barcode_format_location: value })
                  }
                >
                  <SelectTrigger id="barcode-location" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Printer Configuration */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Printer Configuration</h2>
              <Button onClick={() => setPrinterModalOpen(true)} size="sm" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Configure Printer
              </Button>
            </div>

            {settings.printer_config && (
              <div className="bg-gray-50 p-4 rounded border space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">IP Address:</div>
                  <div className="font-mono">{settings.printer_config.ip || '-'}</div>
                  <div className="text-gray-600">Port:</div>
                  <div className="font-mono">{settings.printer_config.port || '-'}</div>
                  <div className="text-gray-600">Model:</div>
                  <div>{settings.printer_config.model || '-'}</div>
                  <div className="text-gray-600">DPI:</div>
                  <div>{settings.printer_config.dpi || '-'}</div>
                </div>
              </div>
            )}
          </div>

          {/* ZPL Template (Placeholder) */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">ZPL Label Template</h2>
            <div className="text-center py-4 text-gray-500">
              <p>ZPL template editor will be available in a future update.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Printer Configuration Modal */}
      <Dialog open={printerModalOpen} onOpenChange={setPrinterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Printer</DialogTitle>
            <DialogDescription>
              Configure network printer settings for label printing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="printer-ip">IP Address</Label>
              <Input
                id="printer-ip"
                value={printerForm.ip || ''}
                onChange={(e) =>
                  setPrinterForm((prev) => ({ ...prev, ip: e.target.value }))
                }
                placeholder="192.168.1.100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer-port">Port</Label>
              <Input
                id="printer-port"
                type="number"
                value={printerForm.port || 9100}
                onChange={(e) =>
                  setPrinterForm((prev) => ({ ...prev, port: Number(e.target.value) }))
                }
                placeholder="9100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer-model">Printer Model</Label>
              <Input
                id="printer-model"
                value={printerForm.model || ''}
                onChange={(e) =>
                  setPrinterForm((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="Zebra ZD420"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer-dpi">DPI</Label>
              <Select
                value={printerForm.dpi?.toString() || '203'}
                onValueChange={(value) =>
                  setPrinterForm((prev) => ({ ...prev, dpi: Number(value) }))
                }
              >
                <SelectTrigger id="printer-dpi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="203">203 DPI</SelectItem>
                  <SelectItem value="300">300 DPI</SelectItem>
                  <SelectItem value="600">600 DPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrinterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrinterConfig} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
