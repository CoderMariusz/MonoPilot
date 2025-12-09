/**
 * Network Monitor for Scanner Offline Queue
 * Story 5.36: Scanner Offline Queue - Core
 *
 * Features:
 * - navigator.onLine event listener
 * - Periodic ping (every 30s) to /api/health
 * - Auto-trigger sync on reconnect (within 2s)
 */

type NetworkCallback = () => void

const PING_INTERVAL_MS = 30000 // 30 seconds
const RECONNECT_DELAY_MS = 2000 // 2 seconds

class NetworkMonitorService {
  private _isOnline: boolean = true
  private onlineCallbacks: Set<NetworkCallback> = new Set()
  private offlineCallbacks: Set<NetworkCallback> = new Set()
  private pingInterval: NodeJS.Timeout | null = null
  private initialized = false

  /**
   * Initialize the network monitor
   * Must be called on client-side only
   */
  init(): void {
    if (typeof window === 'undefined') return
    if (this.initialized) return

    this.initialized = true
    this._isOnline = navigator.onLine

    // Browser online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Start periodic ping
    this.startPing()
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.stopPing()

    this.onlineCallbacks.clear()
    this.offlineCallbacks.clear()
    this.initialized = false
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this._isOnline
  }

  /**
   * Register callback for when coming online
   */
  onOnline(callback: NetworkCallback): () => void {
    this.onlineCallbacks.add(callback)
    return () => this.onlineCallbacks.delete(callback)
  }

  /**
   * Register callback for when going offline
   */
  onOffline(callback: NetworkCallback): () => void {
    this.offlineCallbacks.add(callback)
    return () => this.offlineCallbacks.delete(callback)
  }

  /**
   * Handle coming online
   */
  private handleOnline = (): void => {
    if (this._isOnline) return // Already online

    console.log('[NetworkMonitor] Network reconnected')
    this._isOnline = true

    // Delay callback execution to ensure stable connection
    setTimeout(() => {
      if (this._isOnline) {
        this.onlineCallbacks.forEach((cb) => {
          try {
            cb()
          } catch (err) {
            console.error('[NetworkMonitor] Online callback error:', err)
          }
        })
      }
    }, RECONNECT_DELAY_MS)
  }

  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    if (!this._isOnline) return // Already offline

    console.log('[NetworkMonitor] Network disconnected')
    this._isOnline = false

    this.offlineCallbacks.forEach((cb) => {
      try {
        cb()
      } catch (err) {
        console.error('[NetworkMonitor] Offline callback error:', err)
      }
    })
  }

  /**
   * Start periodic ping to verify connectivity
   */
  private startPing(): void {
    if (this.pingInterval) return

    this.pingInterval = setInterval(async () => {
      await this.ping()
    }, PING_INTERVAL_MS)

    // Initial ping
    this.ping()
  }

  /**
   * Stop periodic ping
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  /**
   * Ping server to verify connectivity
   */
  private async ping(): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      if (response.ok && !this._isOnline) {
        this.handleOnline()
      } else if (!response.ok && this._isOnline) {
        this.handleOffline()
      }
    } catch {
      if (this._isOnline) {
        this.handleOffline()
      }
    }
  }

  /**
   * Force a connectivity check
   */
  async checkConnectivity(): Promise<boolean> {
    await this.ping()
    return this._isOnline
  }
}

// Singleton instance
export const NetworkMonitor = new NetworkMonitorService()

export default NetworkMonitor
