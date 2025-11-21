'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { OrganizationSchema, type OrganizationInput, type Organization } from '@/lib/validation/organization-schemas'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export function OrganizationForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(OrganizationSchema),
    defaultValues: {
      company_name: '',
      address: '',
      city: '',
      postal_code: '',
      country: '',
      nip_vat: '',
      date_format: 'DD/MM/YYYY',
      number_format: '1,234.56',
      unit_system: 'metric',
      timezone: 'UTC',
      default_currency: 'EUR',
      default_language: 'EN',
    },
  })

  // Fetch organization data on mount
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch('/api/settings/organization')

        if (response.ok) {
          const data: Organization = await response.json()
          // Convert null values to empty strings for React controlled inputs
          form.reset({
            company_name: data.company_name ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            postal_code: data.postal_code ?? '',
            country: data.country ?? '',
            nip_vat: data.nip_vat ?? '',
            date_format: data.date_format ?? 'DD/MM/YYYY',
            number_format: data.number_format ?? '1,234.56',
            unit_system: data.unit_system ?? 'metric',
            timezone: data.timezone ?? 'UTC',
            default_currency: data.default_currency ?? 'EUR',
            default_language: data.default_language ?? 'EN',
          })
          setLogoUrl(data.logo_url || null)
        } else if (response.status === 404) {
          // No organization yet - use defaults
          console.log('No organization found, using defaults')
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load organization settings',
          })
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred',
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchOrganization()
  }, [form, toast])

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only JPG, PNG, and WebP images are allowed',
      })
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Logo must be less than 2MB',
      })
      return
    }

    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/settings/organization/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      setLogoUrl(data.url)
      form.setValue('logo_url', data.url)

      toast({
        title: 'Logo uploaded',
        description: 'Your organization logo has been updated',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
      })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleLogoDelete() {
    setIsUploadingLogo(true)

    try {
      const response = await fetch('/api/settings/organization/logo', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete logo')
      }

      setLogoUrl(null)
      form.setValue('logo_url', '')

      toast({
        title: 'Logo deleted',
        description: 'Your organization logo has been removed',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Failed to delete logo',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  async function onSubmit(data: OrganizationInput) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to update organization',
        })
        return
      }

      const updatedOrg: Organization = await response.json()
      // Convert null values to empty strings for React controlled inputs
      form.reset({
        company_name: updatedOrg.company_name ?? '',
        address: updatedOrg.address ?? '',
        city: updatedOrg.city ?? '',
        postal_code: updatedOrg.postal_code ?? '',
        country: updatedOrg.country ?? '',
        nip_vat: updatedOrg.nip_vat ?? '',
        date_format: updatedOrg.date_format ?? 'DD/MM/YYYY',
        number_format: updatedOrg.number_format ?? '1,234.56',
        unit_system: updatedOrg.unit_system ?? 'metric',
        timezone: updatedOrg.timezone ?? 'UTC',
        default_currency: updatedOrg.default_currency ?? 'EUR',
        default_language: updatedOrg.default_language ?? 'EN',
      })

      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Logo</h3>

          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              {logoUrl ? (
                <div className="relative h-full w-full">
                  <Image
                    src={logoUrl}
                    alt="Company logo"
                    fill
                    className="rounded-lg object-contain p-2"
                  />
                </div>
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </Button>

              {logoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogoDelete}
                  disabled={isUploadingLogo}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP. Max 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Data Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Data</h3>

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Warsaw" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="00-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="PL" maxLength={2} {...field} />
                  </FormControl>
                  <FormDescription>ISO 2-letter code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nip_vat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP/VAT</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Business Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Business Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="number_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number Format</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="1,234.56">1,234.56</option>
                      <option value="1.234,56">1.234,56</option>
                      <option value="1 234.56">1 234.56</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="unit_system"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit System</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Regional Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Regional Settings</h3>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="UTC" {...field} />
                  </FormControl>
                  <FormDescription>IANA timezone</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="PLN">PLN</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="PL">Polish</option>
                      <option value="EN">English</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  )
}
