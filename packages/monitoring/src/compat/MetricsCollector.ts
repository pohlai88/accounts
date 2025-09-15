/**
 * @deprecated Compatibility layer for MetricsCollector
 * This provides missing methods that are expected by consumers
 * TODO: Migrate callers to use the actual MetricsCollector implementation
 */

import { MetricsCollector as CoreMetricsCollector } from "../metrics";

export class MetricsCollector {
    /**
     * @deprecated Use CoreMetricsCollector.getSystemMetrics() instead
     */
    static async getSystemMetrics() {
        // TEMP bridge - delegate to static method
        return CoreMetricsCollector.getSystemMetrics();
    }

    /**
     * @deprecated Use CoreMetricsCollector.getApplicationMetrics() instead
     */
    static async getApplicationMetrics() {
        // TEMP bridge - delegate to static method
        return CoreMetricsCollector.getApplicationMetrics();
    }

    /**
     * @deprecated Use CoreMetricsCollector.recordApiRequest() instead
     */
    static async recordApiRequest(input: { route: string; ms: number; status: number }) {
        // TEMP bridge - delegate to static method
        return CoreMetricsCollector.recordApiRequest(
            "GET", // method
            input.route, // endpoint
            input.status, // statusCode
            input.ms, // duration
            {} // labels
        );
    }

    /**
     * @deprecated Use CoreMetricsCollector.getHealthStatus() instead
     */
    static async getHealthStatus() {
        // TEMP bridge - delegate to static method
        return CoreMetricsCollector.getHealthStatus();
    }
}
