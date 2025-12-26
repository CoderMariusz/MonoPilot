/**
 * MSW Mock Handlers: Locations API
 * Story: TD-206, TD-207 - Track C: Locations Filters + Move Feature
 *
 * Mock API responses for location-related endpoints
 */

import { rest } from 'msw'
import { locationFixtures, getFlatLocations } from './locations'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Mock Handlers for Location API
 */
export const locationApiHandlers = [
  /**
   * GET /api/settings/warehouses/[id]/locations
   * Returns location tree with LP counts
   */
  rest.get(`${BASE_URL}/api/settings/warehouses/:warehouseId/locations`, (req, res, ctx) => {
    const { warehouseId } = req.params
    const typeFilter = req.url.searchParams.get('type')
    const includeStats = req.url.searchParams.get('include_stats') === 'true'

    let locations = locationFixtures.tree

    // Apply type filter
    if (typeFilter) {
      const flatLocations = getFlatLocations()
      const filtered = flatLocations.filter(loc => loc.location_type === typeFilter)
      locations = filtered
    }

    const response: any = {
      success: true,
      data: locations,
    }

    // Include summary stats if requested
    if (includeStats) {
      response.stats = locationFixtures.stats
    }

    return res(ctx.status(200), ctx.json(response))
  }),

  /**
   * GET /api/settings/warehouses/[id]/locations/stats
   * Returns summary statistics
   */
  rest.get(`${BASE_URL}/api/settings/warehouses/:warehouseId/locations/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: locationFixtures.stats,
      })
    )
  }),

  /**
   * GET /api/settings/warehouses/[id]/locations/[locationId]/lp-count
   * Returns LP count for specific location
   */
  rest.get(
    `${BASE_URL}/api/settings/warehouses/:warehouseId/locations/:locationId/lp-count`,
    (req, res, ctx) => {
      const { locationId } = req.params
      const flatLocations = getFlatLocations()
      const location = flatLocations.find(loc => loc.id === locationId)

      if (!location) {
        return res(
          ctx.status(404),
          ctx.json({
            success: false,
            error: 'Location not found',
          })
        )
      }

      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            location_id: locationId,
            lp_count: location.lp_count ?? 0,
          },
        })
      )
    }
  ),

  /**
   * POST /api/settings/warehouses/[id]/locations/[locationId]/move
   * Moves a location to a new parent
   */
  rest.post(
    `${BASE_URL}/api/settings/warehouses/:warehouseId/locations/:locationId/move`,
    async (req, res, ctx) => {
      const { locationId } = req.params
      const body = await req.json()
      const { new_parent_id } = body

      const flatLocations = getFlatLocations()
      const location = flatLocations.find(loc => loc.id === locationId)

      if (!location) {
        return res(
          ctx.status(404),
          ctx.json({
            success: false,
            error: 'Location not found',
          })
        )
      }

      // Validation: Cannot move location to itself
      if (locationId === new_parent_id) {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: 'Cannot move location to itself',
          })
        )
      }

      // Validation: Cannot move zone (root locations)
      if (location.level === 'zone') {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: 'Cannot move zones. Zones must remain at root level.',
          })
        )
      }

      // Validation: Cannot move location to its own descendant
      const isDescendant = (nodeId: string, targetId: string): boolean => {
        const node = flatLocations.find(loc => loc.id === nodeId)
        if (!node || !node.children) return false

        for (const child of node.children) {
          if (child.id === targetId) return true
          if (isDescendant(child.id, targetId)) return true
        }

        return false
      }

      if (new_parent_id && isDescendant(locationId, new_parent_id)) {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: 'Cannot move location to its own descendant',
          })
        )
      }

      // Validation: New parent must exist
      if (new_parent_id) {
        const newParent = flatLocations.find(loc => loc.id === new_parent_id)
        if (!newParent) {
          return res(
            ctx.status(404),
            ctx.json({
              success: false,
              error: 'New parent location not found',
            })
          )
        }

        // Validation: Hierarchy rules
        const levelHierarchy: Record<string, string[]> = {
          zone: [], // Zones cannot have parents
          aisle: ['zone'],
          rack: ['aisle'],
          bin: ['rack'],
        }

        const allowedParents = levelHierarchy[location.level] || []
        if (!allowedParents.includes(newParent.level)) {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              error: `Cannot move ${location.level} under ${newParent.level}. Allowed parents: ${allowedParents.join(', ')}`,
            })
          )
        }
      }

      // Success: Return updated location
      const updatedLocation = {
        ...location,
        parent_id: new_parent_id,
        full_path: new_parent_id
          ? `${flatLocations.find(loc => loc.id === new_parent_id)?.full_path}/${location.code}`
          : `${locationFixtures.warehouse.code}/${location.code}`,
        updated_at: new Date().toISOString(),
      }

      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: updatedLocation,
          message: 'Location moved successfully',
        })
      )
    }
  ),

  /**
   * POST /api/settings/warehouses/[id]/locations/validate-move
   * Validates if a move is allowed without executing it
   */
  rest.post(
    `${BASE_URL}/api/settings/warehouses/:warehouseId/locations/validate-move`,
    async (req, res, ctx) => {
      const body = await req.json()
      const { location_id, new_parent_id } = body

      const flatLocations = getFlatLocations()
      const location = flatLocations.find(loc => loc.id === location_id)

      if (!location) {
        return res(
          ctx.status(404),
          ctx.json({
            success: false,
            error: 'Location not found',
          })
        )
      }

      // Run all validations
      const validations: Array<{ valid: boolean; error?: string }> = []

      // Check 1: Cannot move to itself
      if (location_id === new_parent_id) {
        validations.push({ valid: false, error: 'Cannot move location to itself' })
      } else {
        validations.push({ valid: true })
      }

      // Check 2: Cannot move zones
      if (location.level === 'zone') {
        validations.push({ valid: false, error: 'Cannot move zones' })
      } else {
        validations.push({ valid: true })
      }

      // Check 3: Parent exists
      if (new_parent_id) {
        const newParent = flatLocations.find(loc => loc.id === new_parent_id)
        if (!newParent) {
          validations.push({ valid: false, error: 'New parent location not found' })
        } else {
          validations.push({ valid: true })
        }
      }

      const allValid = validations.every(v => v.valid)
      const errors = validations.filter(v => !v.valid).map(v => v.error)

      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            valid: allValid,
            errors: errors.length > 0 ? errors : undefined,
          },
        })
      )
    }
  ),
]

/**
 * Export individual handlers for selective use in tests
 */
export const handlers = {
  getLocations: locationApiHandlers[0],
  getStats: locationApiHandlers[1],
  getLPCount: locationApiHandlers[2],
  moveLocation: locationApiHandlers[3],
  validateMove: locationApiHandlers[4],
}
