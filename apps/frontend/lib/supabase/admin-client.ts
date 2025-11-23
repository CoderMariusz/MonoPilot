// Admin Client Wrapper (re-exports createServerSupabaseAdmin as createAdminClient)
// This provides a consistent naming convention for service layer code

import { createServerSupabaseAdmin } from './server'

export const createAdminClient = createServerSupabaseAdmin
