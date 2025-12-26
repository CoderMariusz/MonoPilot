/**
 * Settings Wizard Page
 * Story: 1.12 Settings Wizard (UX Design)
 * Task: BATCH 2 - 6-Step Wizard UI
 * AC-012.1 through AC-012.10: Full onboarding wizard
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/lib/config/modules'
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react'
import { SettingsHeader } from '@/components/settings/SettingsHeader'

interface WizardData {
  step: number
  organization: {
    company_name: string
    address: string
    city: string
    postal_code: string
    country: string
  }
  regional: {
    timezone: string
    currency: string
    language: string
  }
  warehouse: {
    code: string
    name: string
    address: string
  }
  locations: {
    receiving: { code: string; name: string }
    shipping: { code: string; name: string }
    transit: { code: string; name: string }
    production: { code: string; name: string }
  }
  modules: string[]
  users: Array<{
    email: string
    first_name: string
    last_name: string
    role: string
  }>
}

const INITIAL_WIZARD_DATA: WizardData = {
  step: 1,
  organization: {
    company_name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'PL',
  },
  regional: {
    timezone: 'Europe/Warsaw',
    currency: 'PLN',
    language: 'en',
  },
  warehouse: {
    code: '',
    name: '',
    address: '',
  },
  locations: {
    receiving: { code: 'RCV-01', name: 'Receiving Area' },
    shipping: { code: 'SHP-01', name: 'Shipping Area' },
    transit: { code: 'TRN-01', name: 'Transit Zone' },
    production: { code: 'PRD-01', name: 'Production Floor' },
  },
  modules: ['technical', 'planning', 'production', 'warehouse'],
  users: [],
}

export default function SettingsWizardPage() {
  const [wizardData, setWizardData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const currentStep = wizardData.step
  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  // Fetch existing wizard progress
  useEffect(() => {
    fetchWizardProgress()
  }, [])

  const fetchWizardProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/wizard')
      if (response.ok) {
        const data = await response.json()
        if (data.progress) {
          setWizardData({ ...INITIAL_WIZARD_DATA, ...data.progress })
        }
      }
    } catch (error) {
      console.error('Error fetching wizard progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (section: string, field: string, value: any) => {
    setWizardData((prev) => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value,
      },
    }))
    // Clear error
    const errorKey = `${section}.${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const handleLocationChange = (locationType: string, field: string, value: string) => {
    setWizardData((prev) => ({
      ...prev,
      locations: {
        ...prev.locations,
        [locationType]: {
          ...prev.locations[locationType as keyof typeof prev.locations],
          [field]: value,
        },
      },
    }))
  }

  const handleModuleToggle = (moduleCode: string) => {
    setWizardData((prev) => {
      const modules = prev.modules.includes(moduleCode)
        ? prev.modules.filter((m) => m !== moduleCode)
        : [...prev.modules, moduleCode]
      return { ...prev, modules }
    })
  }

  const handleUserChange = (index: number, field: string, value: string) => {
    setWizardData((prev) => {
      const users = [...prev.users]
      users[index] = { ...users[index], [field]: value }
      return { ...prev, users }
    })
  }

  const addUser = () => {
    setWizardData((prev) => ({
      ...prev,
      users: [...prev.users, { email: '', first_name: '', last_name: '', role: 'user' }],
    }))
  }

  const removeUser = (index: number) => {
    setWizardData((prev) => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!wizardData.organization.company_name || wizardData.organization.company_name.length < 2) {
        newErrors['organization.company_name'] = 'Company name is required (min 2 characters)'
      }
    } else if (currentStep === 2) {
      if (!wizardData.regional.timezone) newErrors['regional.timezone'] = 'Timezone is required'
      if (!wizardData.regional.currency) newErrors['regional.currency'] = 'Currency is required'
      if (!wizardData.regional.language) newErrors['regional.language'] = 'Language is required'
    } else if (currentStep === 3) {
      if (!wizardData.warehouse.code) newErrors['warehouse.code'] = 'Warehouse code is required'
      if (!wizardData.warehouse.name) newErrors['warehouse.name'] = 'Warehouse name is required'
    } else if (currentStep === 4) {
      // Validate locations
      if (!wizardData.locations.receiving.code) newErrors['locations.receiving.code'] = 'Receiving code required'
      if (!wizardData.locations.shipping.code) newErrors['locations.shipping.code'] = 'Shipping code required'
    } else if (currentStep === 5) {
      if (wizardData.modules.length === 0) {
        newErrors['modules'] = 'At least one module must be enabled'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before proceeding',
        variant: 'destructive',
      })
      return
    }

    // Save progress
    try {
      await fetch('/api/settings/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: currentStep, data: wizardData }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }

    if (currentStep < totalSteps) {
      setWizardData((prev) => ({ ...prev, step: prev.step + 1 }))
    } else {
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setWizardData((prev) => ({ ...prev, step: prev.step - 1 }))
    }
  }

  const handleComplete = async () => {
    try {
      setSubmitting(true)

      const response = await fetch('/api/settings/wizard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete wizard')
      }

      toast({
        title: 'Success',
        description: 'Organization setup completed successfully!',
      })

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error completing wizard:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete wizard',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={wizardData.organization.company_name}
                onChange={(e) => handleChange('organization', 'company_name', e.target.value)}
                placeholder="Acme Corp"
                className={errors['organization.company_name'] ? 'border-destructive' : ''}
              />
              {errors['organization.company_name'] && (
                <p className="text-sm text-destructive">{errors['organization.company_name']}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={wizardData.organization.city}
                  onChange={(e) => handleChange('organization', 'city', e.target.value)}
                  placeholder="Warsaw"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={wizardData.organization.postal_code}
                  onChange={(e) => handleChange('organization', 'postal_code', e.target.value)}
                  placeholder="00-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={wizardData.organization.address}
                onChange={(e) => handleChange('organization', 'address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select
                value={wizardData.regional.timezone}
                onValueChange={(value) => handleChange('regional', 'timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Warsaw">Europe/Warsaw (GMT+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={wizardData.regional.currency}
                  onValueChange={(value) => handleChange('regional', 'currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLN">PLN (Polish Złoty)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={wizardData.regional.language}
                  onValueChange={(value) => handleChange('regional', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse_code">Warehouse Code *</Label>
              <Input
                id="warehouse_code"
                value={wizardData.warehouse.code}
                onChange={(e) => handleChange('warehouse', 'code', e.target.value.toUpperCase())}
                placeholder="WH-01"
                className={errors['warehouse.code'] ? 'border-destructive' : ''}
              />
              {errors['warehouse.code'] && (
                <p className="text-sm text-destructive">{errors['warehouse.code']}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_name">Warehouse Name *</Label>
              <Input
                id="warehouse_name"
                value={wizardData.warehouse.name}
                onChange={(e) => handleChange('warehouse', 'name', e.target.value)}
                placeholder="Main Warehouse"
                className={errors['warehouse.name'] ? 'border-destructive' : ''}
              />
              {errors['warehouse.name'] && (
                <p className="text-sm text-destructive">{errors['warehouse.name']}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_address">Address (Optional)</Label>
              <Input
                id="warehouse_address"
                value={wizardData.warehouse.address}
                onChange={(e) => handleChange('warehouse', 'address', e.target.value)}
                placeholder="123 Industrial Park"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {(['receiving', 'shipping', 'transit', 'production'] as const).map((type) => (
              <div key={type} className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold capitalize">{type} Location</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${type}_code`}>Code *</Label>
                    <Input
                      id={`${type}_code`}
                      value={wizardData.locations[type].code}
                      onChange={(e) => handleLocationChange(type, 'code', e.target.value.toUpperCase())}
                      placeholder={`${type.substring(0, 3).toUpperCase()}-01`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${type}_name`}>Name *</Label>
                    <Input
                      id={`${type}_name`}
                      value={wizardData.locations[type].name}
                      onChange={(e) => handleLocationChange(type, 'name', e.target.value)}
                      placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} Area`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.map((module) => (
                <div
                  key={module.code}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={module.code}
                    checked={wizardData.modules.includes(module.code)}
                    onCheckedChange={() => handleModuleToggle(module.code)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={module.code} className="font-semibold cursor-pointer">
                      {module.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors['modules'] && (
              <p className="text-sm text-destructive">{errors['modules']}</p>
            )}
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            {wizardData.users.map((user, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">User {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUser(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Email"
                    value={user.email}
                    onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                  />
                  <Input
                    placeholder="First Name"
                    value={user.first_name}
                    onChange={(e) => handleUserChange(index, 'first_name', e.target.value)}
                  />
                  <Input
                    placeholder="Last Name"
                    value={user.last_name}
                    onChange={(e) => handleUserChange(index, 'last_name', e.target.value)}
                  />
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleUserChange(index, 'role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addUser} className="w-full">
              + Add User
            </Button>

            <p className="text-sm text-muted-foreground">
              Users will receive an email invitation to join your organization.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const stepTitles = [
    'Organization Basics',
    'Regional Settings',
    'First Warehouse',
    'Key Locations',
    'Module Selection',
    'Invite Users',
  ]

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <p>Loading wizard...</p>
      </div>
    )
  }

  return (
    <div>
      <SettingsHeader currentPage="wizard" />
      <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Organization Setup Wizard</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
              >
                {currentStep === totalSteps ? (
                  submitting ? (
                    'Completing...'
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
