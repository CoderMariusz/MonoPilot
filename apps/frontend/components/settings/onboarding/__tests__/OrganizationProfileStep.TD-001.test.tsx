/**
 * Story 01.4 - Tech Debt TD-001: Organization Profile Missing Fields
 * Sprint 1, Track B - RED Phase Tests
 * Epic: 01-settings
 * Type: Component Tests (FAILING)
 * Status: RED (Tests MUST fail until frontend-dev implements)
 *
 * Tests for 8 MISSING fields in Organization Profile form:
 * Current: 4 fields (name, timezone, language, currency) - 40% complete
 * Missing: 8 fields (address_line1, address_line2, city, postal_code, country*, contact_email, contact_phone, date_format*) - 60% incomplete
 * (*required fields)
 *
 * These tests SHOULD FAIL until the frontend component is updated.
 *
 * Related Wireframes:
 * - SET-002: Onboarding Wizard - Organization Profile Step (Complete wireframe)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrganizationProfileStep } from '../OrganizationProfileStep'
import type { OrganizationProfileStepData } from '@/lib/validation/organization-profile-step'

/**
 * Mock browser detection utilities
 */
vi.mock('@/lib/utils/browser-detection', () => ({
  getBrowserTimezone: vi.fn(() => 'Europe/Warsaw'),
  getBrowserLanguage: vi.fn(() => 'pl'),
}))

describe('TD-001: Organization Profile Missing Fields (RED Phase)', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Missing Fields - Component Rendering', () => {
    it('should render all 12 fields (currently only renders 4 - WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // EXISTING fields (these should pass)
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()

      // MISSING fields (these WILL FAIL until implemented)
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date format/i)).toBeInTheDocument()
    })

    it('should display Address section header (WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Should have 3 sections: Basic Information, Address, Regional Settings
      expect(screen.getByText(/basic information/i)).toBeInTheDocument()
      expect(screen.getByText(/address/i)).toBeInTheDocument() // MISSING
      expect(screen.getByText(/regional settings/i)).toBeInTheDocument()
    })

    it('should display Contact Information section header (WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Should have Contact Information section
      expect(screen.getByText(/contact information/i)).toBeInTheDocument() // MISSING
    })

    it('should show required indicators for country and date_format (WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Country field should have required indicator
      const countryLabel = screen.getByText(/country/i)
      expect(countryLabel).toHaveTextContent('*')

      // Date format field should have required indicator
      const dateFormatLabel = screen.getByText(/date format/i)
      expect(dateFormatLabel).toHaveTextContent('*')
    })

    it('should render CountrySelect component (WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // CountrySelect should be present with searchable dropdown
      const countrySelect = screen.getByLabelText(/country/i)
      expect(countrySelect).toBeInTheDocument()
      expect(countrySelect).toHaveAttribute('role', 'combobox')
    })

    it('should render DateFormatSelect component (WILL FAIL)', () => {
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // DateFormatSelect should be present
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      expect(dateFormatSelect).toBeInTheDocument()
    })
  })

  describe('Validation Tests - Required Fields', () => {
    it('should validate country field is required (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill only name field, leave country empty
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Organization')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // SHOULD show error for missing country
      await waitFor(() => {
        expect(screen.getByText(/country is required/i)).toBeInTheDocument()
      })

      // Should not advance wizard
      expect(mockOnComplete).not.toHaveBeenCalled()
    })

    it('should validate date_format field is required (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill only name field, leave date_format empty
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Organization')

      // Fill country (required)
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const polandOption = screen.getByText('Poland')
      await user.click(polandOption)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // SHOULD show error for missing date_format
      await waitFor(() => {
        expect(screen.getByText(/date format is required/i)).toBeInTheDocument()
      })

      // Should not advance wizard
      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  describe('Validation Tests - Field Formats', () => {
    it('should validate country must be 2-character ISO code (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Try to enter invalid country code
      const countryInput = screen.getByLabelText(/country/i)

      // Attempt to set invalid value (this should be prevented by CountrySelect)
      // Or if manual input is allowed, should show error
      await user.type(countryInput, 'XYZ') // Invalid 3-letter code

      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/country must be a valid 2-character ISO code/i)).toBeInTheDocument()
      })
    })

    it('should validate date_format must be one of allowed values (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill country
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const polandOption = screen.getByText('Poland')
      await user.click(polandOption)

      // Select valid date format
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)

      // Should show 3 options: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
      expect(screen.getByText('MM/DD/YYYY')).toBeInTheDocument()
      expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument()
      expect(screen.getByText('YYYY-MM-DD')).toBeInTheDocument()

      // Select DD/MM/YYYY
      const ddmmyyyyOption = screen.getByText('DD/MM/YYYY')
      await user.click(ddmmyyyyOption)

      // Submit - should accept
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            date_format: 'DD/MM/YYYY',
          })
        )
      })
    })

    it('should validate contact_email format if provided (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill contact email with invalid format
      const contactEmailInput = screen.getByLabelText(/contact email/i)
      await user.type(contactEmailInput, 'invalid-email-format')

      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should accept valid contact_email format (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill country (required)
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const usOption = screen.getByText('United States')
      await user.click(usOption)

      // Fill date_format (required)
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('MM/DD/YYYY')
      await user.click(formatOption)

      // Fill valid contact email
      const contactEmailInput = screen.getByLabelText(/contact email/i)
      await user.type(contactEmailInput, 'contact@bakery.com')

      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should submit successfully
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            contact_email: 'contact@bakery.com',
          })
        )
      })
    })
  })

  describe('Validation Tests - Optional Fields', () => {
    it('should allow empty address_line1 field (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill required fields
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Leave address_line1 empty
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should submit successfully (address_line1 is optional)
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should allow empty address_line2 field (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill required fields
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Leave address_line2 empty (it's optional)
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should allow empty city field (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill required fields
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Leave city empty
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should allow empty postal_code field (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill required fields
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Leave postal_code empty
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should allow empty contact_phone field (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Fill required fields
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Leave contact_phone empty
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission - All Fields', () => {
    it('should submit all 12 fields in payload (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill all fields
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Bakery Fresh Ltd')

      // Address fields
      const address1Input = screen.getByLabelText(/address line 1/i)
      await user.type(address1Input, '123 Main Street')

      const address2Input = screen.getByLabelText(/address line 2/i)
      await user.type(address2Input, 'Suite 200')

      const cityInput = screen.getByLabelText(/city/i)
      await user.type(cityInput, 'Warsaw')

      const postalCodeInput = screen.getByLabelText(/postal code/i)
      await user.type(postalCodeInput, '00-001')

      // Country (required)
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const polandOption = screen.getByText('Poland')
      await user.click(polandOption)

      // Contact fields
      const contactEmailInput = screen.getByLabelText(/contact email/i)
      await user.type(contactEmailInput, 'info@bakeryfresh.pl')

      const contactPhoneInput = screen.getByLabelText(/contact phone/i)
      await user.type(contactPhoneInput, '+48 22 123 4567')

      // Regional settings (timezone, language, currency are auto-detected)
      // Date format (required)
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Submit
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Verify all 12 fields are included in payload
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          // Existing 4 fields
          name: 'Bakery Fresh Ltd',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'EUR',
          // NEW 8 fields
          address_line1: '123 Main Street',
          address_line2: 'Suite 200',
          city: 'Warsaw',
          postal_code: '00-001',
          country: 'PL',
          contact_email: 'info@bakeryfresh.pl',
          contact_phone: '+48 22 123 4567',
          date_format: 'DD/MM/YYYY',
        })
      })
    })

    it('should submit with only required fields filled (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill only required fields
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Minimal Org')

      // Country (required)
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const usOption = screen.getByText('United States')
      await user.click(usOption)

      // Date format (required)
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('MM/DD/YYYY')
      await user.click(formatOption)

      // Submit
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should submit with only required + auto-detected fields
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Minimal Org',
            country: 'US',
            date_format: 'MM/DD/YYYY',
            timezone: 'Europe/Warsaw', // Auto-detected
            language: 'pl', // Auto-detected
            currency: 'EUR', // Default
          })
        )
      })
    })
  })

  describe('Integration - API Endpoint', () => {
    it('should POST to API with all 12 fields (WILL FAIL)', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      )
      global.fetch = mockFetch as any

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill required fields
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Fill address
      const address1Input = screen.getByLabelText(/address line 1/i)
      await user.type(address1Input, '123 Main St')

      const cityInput = screen.getByLabelText(/city/i)
      await user.type(cityInput, 'Warsaw')

      // Submit
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Verify API was called with all fields
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/settings/organization'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"country":"PL"'),
          })
        )
      })
    })
  })

  describe('Database Persistence', () => {
    it('should persist new fields to organizations table (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Fill all fields
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Bakery')

      const address1Input = screen.getByLabelText(/address line 1/i)
      await user.type(address1Input, '456 Baker St')

      const cityInput = screen.getByLabelText(/city/i)
      await user.type(cityInput, 'Krakow')

      const postalCodeInput = screen.getByLabelText(/postal code/i)
      await user.type(postalCodeInput, '30-001')

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const plOption = screen.getByText('Poland')
      await user.click(plOption)

      const contactEmailInput = screen.getByLabelText(/contact email/i)
      await user.type(contactEmailInput, 'hello@testbakery.pl')

      const contactPhoneInput = screen.getByLabelText(/contact phone/i)
      await user.type(contactPhoneInput, '+48 12 345 6789')

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      // Submit
      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Data should be passed to onComplete handler
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line1: '456 Baker St',
            city: 'Krakow',
            postal_code: '30-001',
            country: 'PL',
            contact_email: 'hello@testbakery.pl',
            contact_phone: '+48 12 345 6789',
            date_format: 'DD/MM/YYYY',
          })
        )
      })

      // NOTE: Integration test with actual DB would verify these columns exist
      // in organizations table and data is persisted correctly
    })
  })

  describe('CountrySelect Component', () => {
    it('should render searchable country dropdown (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)

      // Should show search input
      const searchInput = screen.getByPlaceholderText(/search country/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should filter countries when typing (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)

      const searchInput = screen.getByPlaceholderText(/search country/i)
      await user.type(searchInput, 'pol')

      // Should show Poland in results
      await waitFor(() => {
        expect(screen.getByText('Poland')).toBeInTheDocument()
      })

      // Should not show unrelated countries
      expect(screen.queryByText('United States')).not.toBeInTheDocument()
    })

    it('should display country with ISO code (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)

      // Countries should show name and code
      expect(screen.getByText(/Poland \(PL\)/i)).toBeInTheDocument()
      expect(screen.getByText(/United States \(US\)/i)).toBeInTheDocument()
    })

    it('should select country and store ISO code (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)

      const polandOption = screen.getByText(/Poland \(PL\)/i)
      await user.click(polandOption)

      // Fill date_format
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const formatOption = screen.getByText('DD/MM/YYYY')
      await user.click(formatOption)

      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should store as 2-letter ISO code
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            country: 'PL', // ISO code, not full name
          })
        )
      })
    })
  })

  describe('DateFormatSelect Component', () => {
    it('should show 3 date format options (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)

      // Should show all 3 formats
      expect(screen.getByText('MM/DD/YYYY')).toBeInTheDocument()
      expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument()
      expect(screen.getByText('YYYY-MM-DD')).toBeInTheDocument()
    })

    it('should display examples for each date format (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)

      // Should show examples
      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument() // MM/DD/YYYY example
      expect(screen.getByText(/31\/12\/2024/)).toBeInTheDocument() // DD/MM/YYYY example
      expect(screen.getByText(/2024-12-31/)).toBeInTheDocument() // YYYY-MM-DD example
    })

    it('should auto-select date format based on country (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Select US country
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const usOption = screen.getByText(/United States/i)
      await user.click(usOption)

      // Date format should auto-select to MM/DD/YYYY
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      expect(dateFormatSelect).toHaveTextContent('MM/DD/YYYY')
    })

    it('should allow overriding auto-selected date format (WILL FAIL)', async () => {
      const user = userEvent.setup()

      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Org')

      // Select US country (auto-selects MM/DD/YYYY)
      const countrySelect = screen.getByLabelText(/country/i)
      await user.click(countrySelect)
      const usOption = screen.getByText(/United States/i)
      await user.click(usOption)

      // Override with DD/MM/YYYY
      const dateFormatSelect = screen.getByLabelText(/date format/i)
      await user.click(dateFormatSelect)
      const ddmmOption = screen.getByText('DD/MM/YYYY')
      await user.click(ddmmOption)

      const submitButton = screen.getByRole('button', { name: /next/i })
      await user.click(submitButton)

      // Should use overridden format
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            country: 'US',
            date_format: 'DD/MM/YYYY', // Overridden
          })
        )
      })
    })
  })
})

/**
 * Test Coverage Summary for TD-001:
 *
 * Missing Fields (8):
 * ✅ address_line1 (optional)
 * ✅ address_line2 (optional)
 * ✅ city (optional)
 * ✅ postal_code (optional)
 * ✅ country (required) - 2-char ISO code
 * ✅ contact_email (optional) - email format validation
 * ✅ contact_phone (optional)
 * ✅ date_format (required) - enum: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
 *
 * Test Categories:
 * ✅ Component Rendering (6 tests) - All WILL FAIL
 * ✅ Required Field Validation (2 tests) - All WILL FAIL
 * ✅ Field Format Validation (3 tests) - All WILL FAIL
 * ✅ Optional Field Validation (5 tests) - All WILL FAIL
 * ✅ Form Submission (2 tests) - All WILL FAIL
 * ✅ API Integration (1 test) - WILL FAIL
 * ✅ Database Persistence (1 test) - WILL FAIL
 * ✅ CountrySelect Component (4 tests) - All WILL FAIL
 * ✅ DateFormatSelect Component (4 tests) - All WILL FAIL
 *
 * Total: 28 new tests (ALL FAILING in RED phase)
 * Expected: 0 passed, 28 failed
 *
 * Ready for handoff to FRONTEND-DEV (GREEN phase)
 */
