// Simple monitoring module for UI package
// This is a placeholder implementation

export const monitoring = {
    recordMetric: (name: string, value: number, unit: string, tags?: Record<string, any>) => {
        // Placeholder implementation
        console.log(`Metric: ${name} = ${value} ${unit}`, tags);
    },
    recordEvent: (name: string, data?: Record<string, any>) => {
        // Placeholder implementation
        console.log(`Event: ${name}`, data);
    }
};
