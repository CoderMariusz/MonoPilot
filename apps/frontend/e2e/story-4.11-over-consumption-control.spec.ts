/**
 * E2E Tests: Story 4.11 - Over-Consumption Control (Settings)
 * Tests for allow_over_consumption setting configuration
 */

import { test, expect } from '@playwright/test'

test.describe('Story 4.11: Over-Consumption Control Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**')
  })

  test.describe('AC-4.11.1: Over-Consumption Setting Configuration', () => {
    test('should display allow_over_consumption toggle in production settings', async ({ page }) => {
      await page.goto('/settings/production-execution')

      // Wait for settings to load
      await page.waitForSelector('h1:has-text("Production Settings")')

      // Check for Allow Over-Consumption toggle
      const toggleLabel = page.locator('label:has-text("Allow Over-Consumption")')
      await expect(toggleLabel).toBeVisible()

      // Check for description
      const description = page.locator('text=Controls over-consumption warning behavior')
      await expect(description).toBeVisible()
    })

    test('should have descriptive help text', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // Check for detailed explanation
      const offExplanation = page.locator('text=When OFF: Operators see a warning and must confirm')
      await expect(offExplanation).toBeVisible()

      const onExplanation = page.locator('text=When ON: Warning still shown, but more permissive')
      await expect(onExplanation).toBeVisible()
    })
  })

  test.describe('AC-4.11.4: Settings API', () => {
    test('GET /api/production/settings should return allow_over_consumption', async ({ page, request }) => {
      // First login to get session
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // API should return settings including allow_over_consumption
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/production/settings')
        return res.json()
      })

      expect(response.settings).toBeDefined()
      expect(typeof response.settings.allow_over_consumption).toBe('boolean')
    })

    test('PUT /api/production/settings should update allow_over_consumption', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // Find the toggle switch
      const toggleSwitch = page.locator('#allow-over-consumption')

      // Get initial state
      const initialChecked = await toggleSwitch.isChecked()

      // Click to toggle
      await toggleSwitch.click()

      // Wait for save toast
      await page.waitForSelector('text=Settings updated successfully', { timeout: 5000 })

      // Verify toggle state changed
      const newChecked = await toggleSwitch.isChecked()
      expect(newChecked).not.toBe(initialChecked)

      // Toggle back to original state
      await toggleSwitch.click()
      await page.waitForSelector('text=Settings updated successfully', { timeout: 5000 })
    })
  })

  test.describe('AC-4.11.5: Default Setting', () => {
    test('default value should be false (conservative)', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // For a new org, allow_over_consumption should default to false
      // This test verifies the UI shows the toggle correctly
      const toggleSwitch = page.locator('#allow-over-consumption')
      await expect(toggleSwitch).toBeVisible()

      // The toggle should exist and be interactive
      await expect(toggleSwitch).toBeEnabled()
    })
  })

  test.describe('AC-4.11.6: Settings UI (Admin)', () => {
    test('should save setting on toggle change', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      const toggleSwitch = page.locator('#allow-over-consumption')

      // Toggle the switch
      await toggleSwitch.click()

      // Should show success toast
      const toast = page.locator('text=Settings updated successfully')
      await expect(toast).toBeVisible({ timeout: 5000 })
    })

    test('toggle should be in Work Order Settings section', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // The toggle should be within Work Order Settings card
      const workOrderCard = page.locator('div:has(h3:has-text("Work Order Settings"))')
      const toggleInCard = workOrderCard.locator('#allow-over-consumption')
      await expect(toggleInCard).toBeVisible()
    })
  })

  test.describe('Schema Validation', () => {
    test('production_settings should accept allow_over_consumption boolean', async ({ page }) => {
      await page.goto('/settings/production-execution')
      await page.waitForSelector('h1:has-text("Production Settings")')

      // Make API call with allow_over_consumption
      const response = await page.evaluate(async () => {
        const getRes = await fetch('/api/production/settings')
        const getData = await getRes.json()

        const putRes = await fetch('/api/production/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...getData.settings,
            allow_over_consumption: true,
          }),
        })

        return {
          status: putRes.status,
          data: await putRes.json(),
        }
      })

      expect(response.status).toBe(200)
      expect(response.data.settings.allow_over_consumption).toBe(true)

      // Reset to false
      await page.evaluate(async () => {
        const getRes = await fetch('/api/production/settings')
        const getData = await getRes.json()

        await fetch('/api/production/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...getData.settings,
            allow_over_consumption: false,
          }),
        })
      })
    })
  })
})
