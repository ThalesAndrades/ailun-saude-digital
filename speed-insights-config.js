// Vercel Speed Insights Configuration for Ailun Saúde
// This file configures analytics and performance monitoring

const speedInsightsConfig = {
  // Project configuration
  project: 'ailun-saude',
  branch: 'main',
  environment: 'production',
  
  // Performance monitoring settings
  performance: {
    webVitals: true,
    navigationTiming: true,
    userTiming: true,
    longTask: true
  },
  
  // User experience tracking
  userExperience: {
    pageViews: true,
    sessionDuration: true,
    bounceRate: true,
    userFlow: true
  },
  
  // Custom events to track
  customEvents: [
    'login-attempt',
    'login-success',
    'login-failure',
    'tab-change',
    'beneficiary-create',
    'beneficiary-update',
    'appointment-schedule',
    'api-request',
    'api-error'
  ],
  
  // Error tracking
  errorTracking: {
    javascriptErrors: true,
    promiseRejections: true,
    resourceErrors: true,
    apiErrors: true
  },
  
  // Performance thresholds
  thresholds: {
    pageLoadTime: 3000, // 3 seconds
    apiResponseTime: 1000, // 1 second
    firstContentfulPaint: 1800, // 1.8 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1 // 0.1
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = speedInsightsConfig;
}

// Initialize Speed Insights
function initializeSpeedInsights() {
  if (typeof window !== 'undefined' && window.si) {
    console.log('🚀 Initializing Vercel Speed Insights for Ailun Saúde');
    
    // Initialize with project config
    window.si('init', {
      project: speedInsightsConfig.project,
      branch: speedInsightsConfig.branch,
      environment: speedInsightsConfig.environment
    });
    
    // Track page view
    trackPageView();
    
    // Track performance metrics
    trackPerformanceMetrics();
    
    // Track user interactions
    trackUserInteractions();
    
    // Track errors
    trackErrors();
    
    console.log('✅ Vercel Speed Insights initialized successfully');
  }
}

// Track page views
function trackPageView() {
  if (typeof window !== 'undefined' && window.si) {
    window.si('track', 'page-view', {
      route: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString()
    });
  }
}

// Track performance metrics
function trackPerformanceMetrics() {
  if (typeof window !== 'undefined' && window.si && window.performance) {
    // Track Web Vitals
    trackWebVitals();
    
    // Track navigation timing
    trackNavigationTiming();
    
    // Track resource loading
    trackResourceTiming();
  }
}

// Track Web Vitals
function trackWebVitals() {
  if (typeof window !== 'undefined' && window.si) {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.si('track', 'web-vital', {
          name: 'FCP',
          value: entry.startTime,
          rating: entry.startTime <= speedInsightsConfig.thresholds.firstContentfulPaint ? 'good' : 'needs-improvement'
        });
      }
    }).observe({ entryTypes: ['paint'] });
    
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.si('track', 'web-vital', {
          name: 'LCP',
          value: entry.startTime,
          rating: entry.startTime <= speedInsightsConfig.thresholds.largestContentfulPaint ? 'good' : 'needs-improvement'
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.si('track', 'web-vital', {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: (entry.processingStart - entry.startTime) <= speedInsightsConfig.thresholds.firstInputDelay ? 'good' : 'needs-improvement'
        });
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.si('track', 'web-vital', {
            name: 'CLS',
            value: entry.value,
            rating: entry.value <= speedInsightsConfig.thresholds.cumulativeLayoutShift ? 'good' : 'needs-improvement'
          });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Track navigation timing
function trackNavigationTiming() {
  if (typeof window !== 'undefined' && window.si && window.performance) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        window.si('track', 'navigation-timing', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        });
      }
    });
  }
}

// Track resource loading
function trackResourceTiming() {
  if (typeof window !== 'undefined' && window.si && window.performance) {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          window.si('track', 'api-request', {
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            status: entry.responseStatus || 'unknown'
          });
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }
}

// Track user interactions
function trackUserInteractions() {
  if (typeof window !== 'undefined' && window.si) {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track]');
      if (target) {
        window.si('track', 'user-interaction', {
          type: 'click',
          element: target.tagName,
          text: target.textContent?.substring(0, 50),
          dataTrack: target.dataset.track
        });
      }
    });
    
    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.id) {
        window.si('track', 'form-submit', {
          formId: form.id,
          formData: new FormData(form).entries.length
        });
      }
    });
    
    // Track tab changes
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        window.si('track', 'tab-change', {
          tab: this.dataset.target,
          text: this.textContent
        });
      });
    });
  }
}

// Track errors
function trackErrors() {
  if (typeof window !== 'undefined' && window.si) {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      window.si('track', 'javascript-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || 'Unknown error'
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      window.si('track', 'promise-rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack || 'No stack trace'
      });
    });
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initializeSpeedInsights);
}