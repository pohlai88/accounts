// Production monitoring module for UI package
// Integrates with existing monitoring infrastructure

export const monitoring = {
    recordMetric: async (name: string, value: number, unit: string, tags?: Record<string, unknown>) => {
        try {
            await fetch('/api/monitoring/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    value,
                    unit,
                    tags: tags || {},
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (error) {
            // Silently fail in production - monitoring should not break the app
        }
    },
    recordEvent: async (name: string, data?: Record<string, unknown>) => {
        try {
            await fetch('/api/monitoring/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    data: data || {},
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (error) {
            // Silently fail in production - monitoring should not break the app
        }
    }
};
