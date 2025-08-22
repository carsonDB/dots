/**
 * PWA Navigation Utilities
 * Handles PWA-specific navigation features for standalone mode
 */

export interface PWANavigationState {
  isStandalone: boolean;
  isInstalled: boolean;
  displayMode: string;
  canShare: boolean;
  supportsBackButton: boolean;
}

/**
 * Detects if the app is running in PWA standalone mode
 */
export function isPWAStandalone(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check for Android TWA (Trusted Web Activity)
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
}

/**
 * Gets the current PWA navigation state
 */
export function getPWANavigationState(): PWANavigationState {
  const isStandalone = isPWAStandalone();
  
  return {
    isStandalone,
    isInstalled: isStandalone || window.matchMedia('(display-mode: minimal-ui)').matches,
    displayMode: getDisplayMode(),
    canShare: 'share' in navigator,
    supportsBackButton: 'serviceWorker' in navigator && isStandalone
  };
}

/**
 * Gets the current display mode
 */
export function getDisplayMode(): string {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
}

/**
 * Handles PWA-specific navigation events
 */
export class PWANavigationManager {
  private static instance: PWANavigationManager;
  private navigationState: PWANavigationState;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.navigationState = getPWANavigationState();
    this.setupEventListeners();
  }

  static getInstance(): PWANavigationManager {
    if (!PWANavigationManager.instance) {
      PWANavigationManager.instance = new PWANavigationManager();
    }
    return PWANavigationManager.instance;
  }

  private setupEventListeners(): void {
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
      this.updateNavigationState();
    });

    // Listen for app install events
    window.addEventListener('appinstalled', () => {
      this.updateNavigationState();
      this.emit('app-installed');
    });

    // Handle PWA launch from shortcuts
    if (this.navigationState.isStandalone) {
      this.handlePWALaunch();
    }
  }

  private updateNavigationState(): void {
    this.navigationState = getPWANavigationState();
    this.emit('navigation-state-changed', this.navigationState);
  }

  private handlePWALaunch(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const source = urlParams.get('utm_source');

    if (source === 'pwa') {
      this.emit('pwa-launch', { action });
    }
  }

  getNavigationState(): PWANavigationState {
    return { ...this.navigationState };
  }

  /**
   * Handles deep link navigation in PWA mode
   */
  handleDeepLink(url: string): boolean {
    if (!this.navigationState.isStandalone) {
      return false;
    }

    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Ensure the URL is within our scope
      if (!urlObj.pathname.startsWith('/')) {
        return false;
      }

      // Navigate to the deep link
      window.history.pushState(null, '', urlObj.pathname + urlObj.search);
      this.emit('deep-link-navigation', { url: urlObj.pathname + urlObj.search });
      
      return true;
    } catch (error) {
      console.error('Invalid deep link URL:', error);
      return false;
    }
  }

  /**
   * Shares content using Web Share API if available
   */
  async shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (!this.navigationState.canShare) {
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing content:', error);
      }
      return false;
    }
  }

  /**
   * Handles PWA-specific back navigation
   */
  handleBackNavigation(): boolean {
    if (!this.navigationState.isStandalone) {
      return false;
    }

    // Check if we can go back in history
    if (window.history.length > 1) {
      window.history.back();
      return true;
    }

    // If no history, navigate to home
    window.location.href = '/';
    return true;
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.listeners.clear();
  }
}

/**
 * Hook for React components to use PWA navigation
 */
export function usePWANavigation() {
  const manager = PWANavigationManager.getInstance();
  return {
    navigationState: manager.getNavigationState(),
    handleDeepLink: manager.handleDeepLink.bind(manager),
    shareContent: manager.shareContent.bind(manager),
    handleBackNavigation: manager.handleBackNavigation.bind(manager),
    on: manager.on.bind(manager),
    off: manager.off.bind(manager)
  };
}