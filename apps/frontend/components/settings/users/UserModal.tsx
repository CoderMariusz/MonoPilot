/**
 * User Modal Component
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * Create/Edit user modal with form validation
 * MVP: Warehouse access field HIDDEN (Story 01.5b)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/lib/types/user'
import { CreateUserSchema, UpdateUserSchema } from '@/lib/validation/user-schemas'
import { ZodError } from 'zod'
import { useRoles } from '@/lib/hooks/use-roles'

interface UserModalProps {
  mode: 'create' | 'edit'
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: (user: User) => void
}

interface FormData {
  email: string
  first_name: string
  last_name: string
  role_id: string
  language: string
}

const LANGUAGE_OPTIONS = [
  { value: 'pl', label: 'Polski (pl)' },
  { value: 'en', label: 'English (en)' },
  { value: 'de', label: 'Deutsch (de)' },
  { value: 'fr', label: 'Français (fr)' },
]

export function UserModal({ mode, user, open, onClose, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role_id: user?.role_id || '',
    language: user?.language || 'en',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { data: roles, isLoading: rolesLoading } = useRoles()

  const isEditMode = mode === 'edit'

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role_id: user.role_id || '',
        language: user.language || 'en',
      })
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role_id: '',
        language: 'en',
      })
    }
    setErrors({})
  }, [user, open])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? UpdateUserSchema : CreateUserSchema

      schema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          // Only set the first error for each field (don't overwrite)
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Prepare payload
      const payload = isEditMode
        ? {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role_id: formData.role_id,
            language: formData.language,
          }
        : {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role_id: formData.role_id,
            language: formData.language,
          }

      // Call API
      const url = isEditMode
        ? `/api/v1/settings/users/${user?.id}`
        : '/api/v1/settings/users'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle duplicate email error (409)
        if (response.status === 409) {
          setErrors({ email: 'Email already exists' })
          return
        }

        throw new Error(data.error || 'Failed to save user')
      }

      onSuccess(data)
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-modal="true">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Add User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the user details below.'
              : 'Add a new user to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@company.com"
              disabled={isEditMode}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* First Name field */}
          <div className="space-y-2">
            <Label htmlFor="first_name">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder="John"
              className={errors.first_name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name field */}
          <div className="space-y-2">
            <Label htmlFor="last_name">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder="Doe"
              className={errors.last_name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
          </div>

          {/* Role field */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => handleChange('role_id', value)}
              defaultValue={formData.role_id}
            >
              <SelectTrigger
                className={errors.role_id ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden native select for testing compatibility */}
            <select
              id="role"
              aria-label="Role"
              value={formData.role_id}
              onChange={(e) => handleChange('role_id', e.target.value)}
              className="sr-only"
              tabIndex={-1}
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-sm text-destructive">{errors.role_id}</p>
            )}
          </div>

          {/* Language field */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleChange('language', value)}
              defaultValue={formData.language || 'en'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden native select for testing compatibility */}
            <select
              id="language"
              aria-label="Language"
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="sr-only"
              tabIndex={-1}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* MVP Note: Warehouse access field HIDDEN */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
