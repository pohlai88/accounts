/**
 * Performance Optimization System
 * Optimize application performance with various techniques
 */

import React from "react";

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

export interface OptimizationConfig {
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enableCaching?: boolean;
  enableCompression?: boolean;
  enablePrefetching?: boolean;
  maxCacheSize?: number;
  cacheExpiryMs?: number;
}

export class PerformanceOptimizer {
  private config: Required<OptimizationConfig>;
  private metrics: PerformanceMetrics;
  private cache: Map<string, { data: any; timestamp: number; hits: number }> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: OptimizationConfig = {}) {
    this.config = {
      enableVirtualization: config.enableVirtualization ?? true,
      enableLazyLoading: config.enableLazyLoading ?? true,
      enableCaching: config.enableCaching ?? true,
      enableCompression: config.enableCompression ?? true,
      enablePrefetching: config.enablePrefetching ?? true,
      maxCacheSize: config.maxCacheSize ?? 100,
      cacheExpiryMs: config.cacheExpiryMs ?? 300000, // 5 minutes
    };

    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
    };

    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor page load time
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        const loadTime = performance.now();
        this.metrics.loadTime = loadTime;
        this.updateMetrics();
      });

      // Monitor memory usage
      if ("memory" in performance) {
        setInterval(() => {
          this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }, 1000);
      }

      // Monitor network requests
      this.observeNetworkRequests();
    }
  }

  /**
   * Observe network requests
   */
  private observeNetworkRequests(): void {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        this.metrics.networkRequests += entries.length;
        this.updateMetrics();
      });

      observer.observe({ entryTypes: ["resource"] });
      this.observers.set("network", observer);
    }
  }

  /**
   * Cache data with automatic expiry
   */
  cacheData<T>(key: string, data: T): void {
    if (!this.config.enableCaching) return;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Get cached data
   */
  getCachedData<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.config.cacheExpiryMs) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    cached.hits++;
    this.updateCacheHitRate();

    return cached.data as T;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const totalHits = Array.from(this.cache.values()).reduce((sum, item) => sum + item.hits, 0);
    const totalRequests = this.cache.size + totalHits;
    this.metrics.cacheHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Lazy load images
   */
  lazyLoadImages(): void {
    if (!this.config.enableLazyLoading) return;

    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || "";
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Prefetch resources
   */
  prefetchResource(url: string, type: "script" | "style" | "image" = "script"): void {
    if (!this.config.enablePrefetching) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
  }

  /**
   * Compress data
   */
  async compressData(data: any): Promise<string> {
    if (!this.config.enableCompression) return JSON.stringify(data);

    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      // Simple compression using gzip (if available)
      if ("CompressionStream" in window) {
        const stream = new CompressionStream("gzip");
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(dataBuffer);
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        return btoa(String.fromCharCode(...compressed));
      }

      return jsonString;
    } catch (error) {
      console.error("Compression failed:", error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData: string): Promise<any> {
    if (!this.config.enableCompression) return JSON.parse(compressedData);

    try {
      // Simple decompression
      const binaryString = atob(compressedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if ("DecompressionStream" in window) {
        const stream = new DecompressionStream("gzip");
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(bytes);
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        const jsonString = decoder.decode(decompressed);
        return JSON.parse(jsonString);
      }

      return JSON.parse(compressedData);
    } catch (error) {
      console.error("Decompression failed:", error);
      return JSON.parse(compressedData);
    }
  }

  /**
   * Virtualize large lists
   */
  createVirtualizedList<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    renderItem: (item: T, index: number) => HTMLElement,
  ): {
    container: HTMLElement;
    updateScroll: (scrollTop: number) => void;
  } {
    if (!this.config.enableVirtualization) {
      const container = document.createElement("div");
      items.forEach((item, index) => {
        container.appendChild(renderItem(item, index));
      });
      return { container, updateScroll: () => {} };
    }

    const container = document.createElement("div");
    container.style.height = `${containerHeight}px`;
    container.style.overflow = "auto";
    container.style.position = "relative";

    const totalHeight = items.length * itemHeight;
    const spacer = document.createElement("div");
    spacer.style.height = `${totalHeight}px`;
    container.appendChild(spacer);

    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
    let startIndex = 0;
    let endIndex = Math.min(startIndex + visibleItems, items.length);

    const renderVisibleItems = () => {
      // Clear existing items
      const existingItems = container.querySelectorAll(".virtual-item");
      existingItems.forEach(item => item.remove());

      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.classList.add("virtual-item");
        item.style.position = "absolute";
        item.style.top = `${i * itemHeight}px`;
        item.style.height = `${itemHeight}px`;
        item.style.width = "100%";
        container.appendChild(item);
      }
    };

    const updateScroll = (scrollTop: number) => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const newEndIndex = Math.min(newStartIndex + visibleItems, items.length);

      if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
        startIndex = newStartIndex;
        endIndex = newEndIndex;
        renderVisibleItems();
      }
    };

    container.addEventListener("scroll", () => {
      updateScroll(container.scrollTop);
    });

    renderVisibleItems();

    return { container, updateScroll };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    // This would typically emit metrics to a monitoring service
    console.log("Performance metrics:", this.metrics);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.cache.clear();
  }
}

// Global performance optimizer instance
export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance optimization
export function usePerformanceOptimization(config: OptimizationConfig = {}) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  });

  const optimizer = React.useRef<PerformanceOptimizer | null>(null);

  React.useEffect(() => {
    optimizer.current = new PerformanceOptimizer(config);

    const interval = setInterval(() => {
      setMetrics(optimizer.current?.getMetrics() || metrics);
    }, 1000);

    return () => {
      clearInterval(interval);
      optimizer.current?.destroy();
    };
  }, []);

  const cacheData = React.useCallback((key: string, data: any) => {
    optimizer.current?.cacheData(key, data);
  }, []);

  const getCachedData = React.useCallback(<T>(key: string): T | null => {
    return optimizer.current?.getCachedData<T>(key) || null;
  }, []);

  const debounce = React.useCallback(<T extends (...args: any[]) => any>(func: T, wait: number) => {
    return optimizer.current?.debounce(func, wait) || func;
  }, []);

  const throttle = React.useCallback(
    <T extends (...args: any[]) => any>(func: T, limit: number) => {
      return optimizer.current?.throttle(func, limit) || func;
    },
    [],
  );

  return {
    metrics,
    cacheData,
    getCachedData,
    debounce,
    throttle,
  };
}
