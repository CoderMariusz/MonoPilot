import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase client
jest.mock('./lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    rpc: jest.fn(() => ({
      data: null,
      error: null
    }))
  }
}))

// Mock client state
jest.mock('./lib/clientState', () => ({
  shouldUseMockData: () => false,
  getWorkOrders: () => [],
  getLicensePlates: () => [],
  getStockMoves: () => [],
}))

// Mock API modules
jest.mock('./lib/api/workOrders', () => ({
  WorkOrdersAPI: {
    getAll: jest.fn(),
    getById: jest.fn(),
    closeWorkOrder: jest.fn(),
    getWorkOrderStageStatus: jest.fn(),
  }
}))

jest.mock('./lib/api/yield', () => ({
  YieldAPI: {
    getPRYield: jest.fn(),
    getFGYield: jest.fn(),
  }
}))

jest.mock('./lib/api/consume', () => ({
  ConsumeAPI: {
    getConsumption: jest.fn(),
  }
}))

jest.mock('./lib/api/traceability', () => ({
  getForwardTrace: jest.fn(),
  getBackwardTrace: jest.fn(),
  buildTraceTree: jest.fn(),
  calculateTraceCompleteness: jest.fn(),
  getOverallQAStatus: jest.fn(),
  calculateTotalQuantity: jest.fn(),
}))

jest.mock('./lib/api/licensePlates', () => ({
  LicensePlatesAPI: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    splitLP: jest.fn(),
    getLPCompositions: jest.fn(),
  }
}))

// Mock business logic
jest.mock('./lib/utils/businessLogic', () => ({
  BusinessLogicOrchestrator: {
    validateStagingOperation: jest.fn(),
    validateWeightRecording: jest.fn(),
    validateOperationCompletion: jest.fn(),
  },
  SequentialRoutingValidator: {
    validateOperationSequence: jest.fn(),
    getNextOperation: jest.fn(),
  },
  OneToOneValidator: {
    validateOneToOneRule: jest.fn(),
    getOneToOneMaterials: jest.fn(),
  },
  CrossWOValidator: {
    validateCrossWOPRIntake: jest.fn(),
  },
  ReservationValidator: {
    checkAvailableQuantity: jest.fn(),
    validateReservation: jest.fn(),
  },
  QAGateValidator: {
    validateQAStatus: jest.fn(),
    validateQAOverride: jest.fn(),
  },
}))

// Mock export helpers
jest.mock('./lib/utils/exportHelpers', () => ({
  convertToCSV: jest.fn(),
  convertToXLSX: jest.fn(),
}))

// Mock SheetJS
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(() => ({})),
    write: jest.fn(() => new ArrayBuffer(8))
  }
}))

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

// Global test teardown
afterEach(() => {
  // Clean up after each test
  jest.resetAllMocks()
})