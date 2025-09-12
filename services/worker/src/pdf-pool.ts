// D3 Puppeteer Pool Management - Finance-Grade PDF Generation
// V1 Requirement: Persistent browser pool with health checks, 3 retries, 45s timeout

import puppeteer, { Browser } from 'puppeteer';
import { logger } from '@aibos/utils';

export interface PdfGenerationOptions {
    html: string;
    format?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    printBackground?: boolean;
    scale?: number;
    timeout?: number; // Override default timeout
}

export interface PdfGenerationResult {
    success: true;
    buffer: Buffer;
    generationTime: number;
    retryCount: number;
}

export interface PdfGenerationError {
    success: false;
    error: string;
    code: string;
    retryCount: number;
    generationTime: number;
}

interface BrowserInstance {
    browser: Browser;
    isHealthy: boolean;
    lastUsed: Date;
    createdAt: Date;
    usageCount: number;
}

class PuppeteerPool {
    private browsers: BrowserInstance[] = [];
    private maxPoolSize: number = 3;
    private minPoolSize: number = 1;
    private maxRetries: number = 3;
    private defaultTimeout: number = 45000; // 45 seconds as per V1 requirement
    private healthCheckInterval: number = 60000; // 60 seconds as per V1 requirement
    private maxBrowserAge: number = 30 * 60 * 1000; // 30 minutes
    private maxUsageCount: number = 100; // Restart browser after 100 uses
    private healthCheckTimer?: NodeJS.Timeout;
    private isShuttingDown: boolean = false;

    constructor() {
        this.startHealthChecks();
    }

    /**
     * Initialize the browser pool
     */
    async initialize(): Promise<void> {
        logger.info('Initializing Puppeteer pool', {
            minPoolSize: this.minPoolSize,
            maxPoolSize: this.maxPoolSize,
            healthCheckInterval: this.healthCheckInterval
        });

        // Create minimum number of browsers
        for (let i = 0; i < this.minPoolSize; i++) {
            try {
                await this.createBrowser();
            } catch (error) {
                logger.error('Failed to create initial browser', { error, browserIndex: i });
                throw error;
            }
        }

        logger.info('Puppeteer pool initialized', {
            activeBrowsers: this.browsers.length
        });
    }

    /**
     * Generate PDF with retry logic
     */
    async generatePdf(options: PdfGenerationOptions): Promise<PdfGenerationResult | PdfGenerationError> {
        const startTime = Date.now();
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount <= this.maxRetries) {
            try {
                const result = await this.attemptPdfGeneration(options, retryCount);
                const generationTime = Date.now() - startTime;

                logger.info('PDF generated successfully', {
                    generationTime,
                    retryCount,
                    bufferSize: result.length
                });

                return {
                    success: true,
                    buffer: result,
                    generationTime,
                    retryCount
                };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                retryCount++;

                logger.warn('PDF generation attempt failed', {
                    error: lastError.message,
                    retryCount,
                    maxRetries: this.maxRetries
                });

                if (retryCount <= this.maxRetries) {
                    // Exponential backoff: 2^n seconds
                    const backoffTime = Math.pow(2, retryCount) * 1000;
                    await this.sleep(backoffTime);
                }
            }
        }

        const generationTime = Date.now() - startTime;

        logger.error('PDF generation failed after all retries', {
            error: lastError?.message,
            retryCount: retryCount - 1,
            generationTime
        });

        return {
            success: false,
            error: lastError?.message || 'Unknown error',
            code: 'PDF_GENERATION_FAILED',
            retryCount: retryCount - 1,
            generationTime
        };
    }

    /**
     * Attempt single PDF generation
     */
    private async attemptPdfGeneration(options: PdfGenerationOptions, _retryCount: number): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.browser.newPage();

        try {
            // Set timeout for this operation
            const timeout = options.timeout || this.defaultTimeout;
            page.setDefaultTimeout(timeout);

            // Set content and wait for load
            await page.setContent(options.html, {
                waitUntil: 'networkidle0',
                timeout
            });

            // Generate PDF with specified options
            const pdfBuffer = await page.pdf({
                format: options.format || 'A4',
                landscape: options.orientation === 'landscape',
                margin: options.margin || {
                    top: '1cm',
                    right: '1cm',
                    bottom: '1cm',
                    left: '1cm'
                },
                displayHeaderFooter: options.displayHeaderFooter || false,
                headerTemplate: options.headerTemplate || '',
                footerTemplate: options.footerTemplate || '',
                printBackground: options.printBackground !== false, // Default to true
                scale: options.scale || 1,
                timeout
            });

            // Update browser usage stats
            browser.lastUsed = new Date();
            browser.usageCount++;

            return pdfBuffer;

        } finally {
            // Always close the page
            try {
                await page.close();
            } catch (error) {
                logger.warn('Failed to close page', { error });
            }
        }
    }

    /**
     * Get an available browser from the pool
     */
    private async getBrowser(): Promise<BrowserInstance> {
        // Find a healthy browser
        let browser = this.browsers.find(b => b.isHealthy);

        // If no healthy browser available, create a new one
        if (!browser && this.browsers.length < this.maxPoolSize) {
            browser = await this.createBrowser();
        }

        // If still no browser, wait and retry
        if (!browser) {
            logger.warn('No healthy browsers available, waiting for pool recovery');
            await this.sleep(1000);

            // Force health check
            await this.performHealthCheck();

            browser = this.browsers.find(b => b.isHealthy);
            if (!browser) {
                throw new Error('No healthy browsers available in pool');
            }
        }

        return browser;
    }

    /**
     * Create a new browser instance
     */
    private async createBrowser(): Promise<BrowserInstance> {
        logger.info('Creating new browser instance');

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Helps with memory management
                '--disable-gpu'
            ],
            timeout: 30000 // 30 second launch timeout
        });

        const instance: BrowserInstance = {
            browser,
            isHealthy: true,
            lastUsed: new Date(),
            createdAt: new Date(),
            usageCount: 0
        };

        this.browsers.push(instance);

        logger.info('Browser instance created', {
            totalBrowsers: this.browsers.length,
            pid: browser.process()?.pid
        });

        return instance;
    }

    /**
     * Start periodic health checks
     */
    private startHealthChecks(): void {
        this.healthCheckTimer = setInterval(async () => {
            if (!this.isShuttingDown) {
                await this.performHealthCheck();
            }
        }, this.healthCheckInterval);

        logger.info('Health check timer started', {
            interval: this.healthCheckInterval
        });
    }

    /**
     * Perform health check on all browsers
     */
    async performHealthCheck(): Promise<void> {
        logger.debug('Performing browser health check');

        const healthPromises = this.browsers.map(async (browserInstance, index) => {
            try {
                // Check if browser is still connected
                if (!browserInstance.browser.isConnected()) {
                    logger.warn('Browser disconnected', { browserIndex: index });
                    browserInstance.isHealthy = false;
                    return;
                }

                // Check browser age
                const age = Date.now() - browserInstance.createdAt.getTime();
                if (age > this.maxBrowserAge) {
                    logger.info('Browser exceeded max age, marking for restart', {
                        browserIndex: index,
                        ageMinutes: Math.round(age / 60000)
                    });
                    browserInstance.isHealthy = false;
                    return;
                }

                // Check usage count
                if (browserInstance.usageCount > this.maxUsageCount) {
                    logger.info('Browser exceeded max usage count, marking for restart', {
                        browserIndex: index,
                        usageCount: browserInstance.usageCount
                    });
                    browserInstance.isHealthy = false;
                    return;
                }

                // Test browser responsiveness by creating a test page
                const page = await browserInstance.browser.newPage();
                await page.goto('data:text/html,<h1>Health Check</h1>', {
                    waitUntil: 'load',
                    timeout: 5000
                });
                await page.close();

                browserInstance.isHealthy = true;

            } catch (error) {
                logger.warn('Browser health check failed', {
                    browserIndex: index,
                    error: error instanceof Error ? error.message : String(error)
                });
                browserInstance.isHealthy = false;
            }
        });

        await Promise.allSettled(healthPromises);

        // Remove unhealthy browsers
        const unhealthyBrowsers = this.browsers.filter(b => !b.isHealthy);
        for (const browser of unhealthyBrowsers) {
            await this.removeBrowser(browser);
        }

        // Ensure minimum pool size
        while (this.browsers.length < this.minPoolSize) {
            try {
                await this.createBrowser();
            } catch (error) {
                logger.error('Failed to create replacement browser', { error });
                break;
            }
        }

        logger.debug('Health check completed', {
            healthyBrowsers: this.browsers.filter(b => b.isHealthy).length,
            totalBrowsers: this.browsers.length,
            removedBrowsers: unhealthyBrowsers.length
        });
    }

    /**
     * Remove a browser from the pool
     */
    private async removeBrowser(browserInstance: BrowserInstance): Promise<void> {
        try {
            await browserInstance.browser.close();
        } catch (error) {
            logger.warn('Error closing browser', { error });
        }

        this.browsers = this.browsers.filter(b => b !== browserInstance);

        logger.info('Browser removed from pool', {
            remainingBrowsers: this.browsers.length
        });
    }

    /**
     * Shutdown the pool gracefully
     */
    async shutdown(): Promise<void> {
        logger.info('Shutting down Puppeteer pool');

        this.isShuttingDown = true;

        // Stop health checks
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        // Close all browsers
        const closePromises = this.browsers.map(async (browserInstance) => {
            try {
                await browserInstance.browser.close();
            } catch (error) {
                logger.warn('Error closing browser during shutdown', { error });
            }
        });

        await Promise.allSettled(closePromises);
        this.browsers = [];

        logger.info('Puppeteer pool shutdown complete');
    }

    /**
     * Get pool statistics
     */
    getStats(): {
        totalBrowsers: number;
        healthyBrowsers: number;
        averageAge: number;
        averageUsage: number;
    } {
        const healthyBrowsers = this.browsers.filter(b => b.isHealthy);
        const now = Date.now();

        const averageAge = this.browsers.length > 0
            ? this.browsers.reduce((sum, b) => sum + (now - b.createdAt.getTime()), 0) / this.browsers.length / 60000
            : 0;

        const averageUsage = this.browsers.length > 0
            ? this.browsers.reduce((sum, b) => sum + b.usageCount, 0) / this.browsers.length
            : 0;

        return {
            totalBrowsers: this.browsers.length,
            healthyBrowsers: healthyBrowsers.length,
            averageAge: Math.round(averageAge * 100) / 100, // minutes
            averageUsage: Math.round(averageUsage)
        };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
let poolInstance: PuppeteerPool | null = null;

/**
 * Get the global Puppeteer pool instance
 */
export function getPuppeteerPool(): PuppeteerPool {
    if (!poolInstance) {
        poolInstance = new PuppeteerPool();
    }
    return poolInstance;
}

/**
 * Initialize the global pool
 */
export async function initializePuppeteerPool(): Promise<void> {
    const pool = getPuppeteerPool();
    await pool.initialize();
}

/**
 * Shutdown the global pool
 */
export async function shutdownPuppeteerPool(): Promise<void> {
    if (poolInstance) {
        await poolInstance.shutdown();
        poolInstance = null;
    }
}

/**
 * Generate PDF using the global pool
 */
export async function generatePdf(options: PdfGenerationOptions): Promise<PdfGenerationResult | PdfGenerationError> {
    const pool = getPuppeteerPool();
    return pool.generatePdf(options);
}
