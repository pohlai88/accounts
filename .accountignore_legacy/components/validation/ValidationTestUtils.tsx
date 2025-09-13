/**
 * Enhanced Testing Utilities for Validation Components
 * Provides comprehensive testing helpers, mocks, and utilities
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ValidationResult, ValidationError, ValidationWarning } from '@/lib/validation/gl-entry-validator'
import { ValidationI18nProvider, ValidationI18n } from './ValidationI18nProvider'
import { ValidationThemeProvider, ValidationTheme } from './ValidationThemeProvider'

/**
 * Mock validation result creators
 */
export const createMockValidation = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    ...overrides
})

export const createMockError = (overrides: Partial<ValidationError> = {}): ValidationError => ({
    code: 'TEST_ERROR',
    field: 'testField',
    message: 'Test error message',
    severity: 'error',
    category: 'business_rule',
    ...overrides
})

export const createMockWarning = (overrides: Partial<ValidationWarning> = {}): ValidationWarning => ({
    code: 'TEST_WARNING',
    field: 'testField',
    message: 'Test warning message',
    impact: 'medium',
    ...overrides
})

/**
 * Validation test scenarios
 */
export const ValidationTestScenarios = {
    /**
     * Valid validation result with no issues
     */
    valid: (): ValidationResult => createMockValidation({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
    }),

    /**
     * Validation with multiple errors
     */
    withErrors: (count: number = 2): ValidationResult => {
        const errors = Array.from({ length: count }, (_, i) =>
            createMockError({
                code: `ERROR_${i + 1}`,
                field: `field${i + 1}`,
                message: `Error message ${i + 1}`,
                category: i % 2 === 0 ? 'business_rule' : 'data_integrity'
            })
        )

        return createMockValidation({
            isValid: false,
            errors
        })
    },

    /**
     * Validation with multiple warnings
     */
    withWarnings: (count: number = 2): ValidationResult => {
        const warnings = Array.from({ length: count }, (_, i) =>
            createMockWarning({
                code: `WARNING_${i + 1}`,
                field: `field${i + 1}`,
                message: `Warning message ${i + 1}`,
                impact: i % 2 === 0 ? 'high' : 'medium'
            })
        )

        return createMockValidation({
            isValid: true,
            warnings
        })
    },

    /**
     * Validation with suggestions
     */
    withSuggestions: (count: number = 2): ValidationResult => {
        const suggestions = Array.from({ length: count }, (_, i) =>
            `Test suggestion ${i + 1}`
        )

        return createMockValidation({
            isValid: true,
            suggestions
        })
    },

    /**
     * Mixed validation with errors, warnings, and suggestions
     */
    mixed: (): ValidationResult => createMockValidation({
        isValid: false,
        errors: [
            createMockError({
                code: 'REQUIRED_FIELD',
                field: 'accountId',
                message: 'Account is required',
                category: 'business_rule'
            }),
            createMockError({
                code: 'INVALID_FORMAT',
                field: 'amount',
                message: 'Invalid amount format',
                category: 'data_integrity'
            })
        ],
        warnings: [
            createMockWarning({
                code: 'PERFORMANCE_WARNING',
                field: 'description',
                message: 'Description is very long',
                impact: 'low'
            })
        ],
        suggestions: [
            'Consider using a shorter description',
            'Verify the account selection'
        ]
    }),

    /**
     * Large validation result for performance testing
     */
    large: (errorCount: number = 50, warningCount: number = 30): ValidationResult => {
        const errors = Array.from({ length: errorCount }, (_, i) =>
            createMockError({
                code: `ERROR_${i + 1}`,
                field: `field${i % 10}`, // Distribute across 10 fields
                message: `Error message ${i + 1} with some additional context`,
                category: ['business_rule', 'data_integrity', 'compliance', 'performance'][i % 4] as any
            })
        )

        const warnings = Array.from({ length: warningCount }, (_, i) =>
            createMockWarning({
                code: `WARNING_${i + 1}`,
                field: `field${i % 8}`, // Distribute across 8 fields
                message: `Warning message ${i + 1} with detailed information`,
                impact: ['high', 'medium', 'low'][i % 3] as any
            })
        )

        return createMockValidation({
            isValid: false,
            errors,
            warnings
        })
    }
}

/**
 * Test wrapper with all providers
 */
export const ValidationTestWrapper: React.FC<{
    children: React.ReactNode
    validation?: ValidationResult
    i18n?: Partial<ValidationI18n>
    theme?: Partial<ValidationTheme>
    locale?: string
    themeVariant?: 'default' | 'dark' | 'compact' | 'comfortable'
}> = ({
    children,
    validation,
    i18n,
    theme,
    locale,
    themeVariant = 'default'
}) => {
        return (
            <ValidationI18nProvider i18n={i18n} locale={locale}>
                <ValidationThemeProvider theme={theme} variant={themeVariant}>
                    {children}
                </ValidationThemeProvider>
            </ValidationI18nProvider>
        )
    }

/**
 * Custom render function with validation providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    validation?: ValidationResult
    i18n?: Partial<ValidationI18n>
    theme?: Partial<ValidationTheme>
    locale?: string
    themeVariant?: 'default' | 'dark' | 'compact' | 'comfortable'
}

export const renderWithValidation = (
    ui: React.ReactElement,
    options: CustomRenderOptions = {}
) => {
    const { validation, i18n, theme, locale, themeVariant, ...renderOptions } = options

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <ValidationTestWrapper
            validation={validation}
            i18n={i18n}
            theme={theme}
            locale={locale}
            themeVariant={themeVariant}
        >
            {children}
        </ValidationTestWrapper>
    )

    return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Test utilities for user interactions
 */
export const ValidationTestInteractions = {
    /**
     * Test filter button clicks
     */
    async clickFilter(filterName: string) {
        const button = screen.getByRole('button', { name: new RegExp(filterName, 'i') })
        await userEvent.click(button)
        return button
    },

    /**
     * Test search input
     */
    async searchFor(searchTerm: string) {
        const searchInput = screen.getByPlaceholderText(/search/i)
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, searchTerm)
        return searchInput
    },

    /**
     * Test export button clicks
     */
    async clickExport(format: 'json' | 'csv' | 'markdown') {
        const button = screen.getByRole('button', { name: new RegExp(format, 'i') })
        await userEvent.click(button)
        return button
    },

    /**
     * Test copy to clipboard
     */
    async copyToClipboard(format: 'text' | 'json' | 'markdown') {
        const button = screen.getByRole('button', { name: new RegExp(`copy.*${format}`, 'i') })
        await userEvent.click(button)
        return button
    },

    /**
     * Test group expansion
     */
    async expandGroup(groupName: string) {
        const button = screen.getByRole('button', { name: new RegExp(groupName, 'i') })
        await userEvent.click(button)
        return button
    },

    /**
     * Test field linking
     */
    async clickFieldLink(fieldName: string) {
        const link = screen.getByRole('link', { name: fieldName })
        await userEvent.click(link)
        return link
    }
}

/**
 * Assertion helpers for validation components
 */
export const ValidationTestAssertions = {
    /**
     * Assert validation display shows correct counts
     */
    expectValidationCounts(errorCount: number, warningCount: number, suggestionCount: number = 0) {
        if (errorCount > 0) {
            expect(screen.getByText(new RegExp(`${errorCount}.*error`, 'i'))).toBeInTheDocument()
        }
        if (warningCount > 0) {
            expect(screen.getByText(new RegExp(`${warningCount}.*warning`, 'i'))).toBeInTheDocument()
        }
        if (suggestionCount > 0) {
            expect(screen.getByText(new RegExp(`${suggestionCount}.*suggestion`, 'i'))).toBeInTheDocument()
        }
    },

    /**
     * Assert error messages are displayed
     */
    expectErrorMessages(messages: string[]) {
        messages.forEach(message => {
            expect(screen.getByText(message)).toBeInTheDocument()
        })
    },

    /**
     * Assert warning messages are displayed
     */
    expectWarningMessages(messages: string[]) {
        messages.forEach(message => {
            expect(screen.getByText(message)).toBeInTheDocument()
        })
    },

    /**
     * Assert accessibility attributes
     */
    expectAccessibilityAttributes(element: HTMLElement, attributes: Record<string, string>) {
        Object.entries(attributes).forEach(([attr, value]) => {
            expect(element).toHaveAttribute(attr, value)
        })
    },

    /**
     * Assert live region announcements
     */
    expectLiveRegion(text: string) {
        const liveRegion = screen.getByRole('status')
        expect(liveRegion).toHaveTextContent(text)
    },

    /**
     * Assert filter is active
     */
    expectActiveFilter(filterName: string) {
        const button = screen.getByRole('button', { name: new RegExp(filterName, 'i') })
        expect(button).toHaveClass(/ring-/) // Assuming active filters have ring classes
    },

    /**
     * Assert group is expanded
     */
    expectGroupExpanded(groupName: string) {
        const button = screen.getByRole('button', { name: new RegExp(groupName, 'i') })
        expect(button).toHaveAttribute('aria-expanded', 'true')
    }
}

/**
 * Performance testing utilities
 */
export const ValidationPerformanceTests = {
    /**
     * Measure render time
     */
    async measureRenderTime(renderFn: () => void, iterations: number = 10): Promise<number[]> {
        const times: number[] = []

        for (let i = 0; i < iterations; i++) {
            const start = performance.now()
            renderFn()
            const end = performance.now()
            times.push(end - start)
        }

        return times
    },

    /**
     * Measure interaction time
     */
    async measureInteractionTime(interactionFn: () => Promise<void>, iterations: number = 10): Promise<number[]> {
        const times: number[] = []

        for (let i = 0; i < iterations; i++) {
            const start = performance.now()
            await interactionFn()
            const end = performance.now()
            times.push(end - start)
        }

        return times
    },

    /**
     * Get performance statistics
     */
    getPerformanceStats(times: number[]) {
        const sorted = [...times].sort((a, b) => a - b)
        return {
            min: Math.min(...times),
            max: Math.max(...times),
            average: times.reduce((a, b) => a + b, 0) / times.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        }
    }
}

/**
 * Mock implementations for external dependencies
 */
export const ValidationMocks = {
    /**
     * Mock clipboard API
     */
    mockClipboard() {
        const mockClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined),
            readText: jest.fn().mockResolvedValue(''),
        }

        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
        })

        return mockClipboard
    },

    /**
     * Mock URL.createObjectURL for file downloads
     */
    mockFileDownload() {
        const mockCreateObjectURL = jest.fn().mockReturnValue('mock-url')
        const mockRevokeObjectURL = jest.fn()

        global.URL.createObjectURL = mockCreateObjectURL
        global.URL.revokeObjectURL = mockRevokeObjectURL

        return { mockCreateObjectURL, mockRevokeObjectURL }
    },

    /**
     * Mock intersection observer for virtualization
     */
    mockIntersectionObserver() {
        const mockIntersectionObserver = jest.fn()
        mockIntersectionObserver.mockReturnValue({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        })

        global.IntersectionObserver = mockIntersectionObserver

        return mockIntersectionObserver
    }
}

/**
 * Test data generators
 */
export const ValidationTestData = {
    /**
     * Generate realistic field names
     */
    generateFieldNames(count: number): string[] {
        const fieldTypes = [
            'accountId', 'amount', 'description', 'date', 'reference',
            'customerId', 'supplierId', 'taxRate', 'currency', 'category',
            'costCenter', 'project', 'department', 'location', 'notes'
        ]

        return Array.from({ length: count }, (_, i) =>
            fieldTypes[i % fieldTypes.length] + (i >= fieldTypes.length ? `_${Math.floor(i / fieldTypes.length)}` : '')
        )
    },

    /**
     * Generate realistic error messages
     */
    generateErrorMessages(count: number): string[] {
        const messageTemplates = [
            'Field is required',
            'Invalid format provided',
            'Value exceeds maximum limit',
            'Value below minimum threshold',
            'Duplicate entry detected',
            'Invalid date range',
            'Insufficient permissions',
            'Data integrity violation',
            'Business rule violation',
            'Validation constraint failed'
        ]

        return Array.from({ length: count }, (_, i) =>
            messageTemplates[i % messageTemplates.length] + (i >= messageTemplates.length ? ` (${i})` : '')
        )
    },

    /**
     * Generate test validation with realistic data
     */
    generateRealisticValidation(complexity: 'simple' | 'medium' | 'complex' = 'medium'): ValidationResult {
        const counts = {
            simple: { errors: 1, warnings: 1, suggestions: 1 },
            medium: { errors: 3, warnings: 2, suggestions: 2 },
            complex: { errors: 8, warnings: 5, suggestions: 3 }
        }

        const { errors: errorCount, warnings: warningCount, suggestions: suggestionCount } = counts[complexity]

        const fieldNames = this.generateFieldNames(Math.max(errorCount, warningCount))
        const errorMessages = this.generateErrorMessages(errorCount)
        const warningMessages = this.generateErrorMessages(warningCount)

        const errors = Array.from({ length: errorCount }, (_, i) =>
            createMockError({
                code: `ERR_${String(i + 1).padStart(3, '0')}`,
                field: fieldNames[i % fieldNames.length],
                message: errorMessages[i],
                category: ['business_rule', 'data_integrity', 'compliance'][i % 3] as any
            })
        )

        const warnings = Array.from({ length: warningCount }, (_, i) =>
            createMockWarning({
                code: `WARN_${String(i + 1).padStart(3, '0')}`,
                field: fieldNames[i % fieldNames.length],
                message: warningMessages[i],
                impact: ['high', 'medium', 'low'][i % 3] as any
            })
        )

        const suggestions = Array.from({ length: suggestionCount }, (_, i) =>
            `Consider reviewing ${fieldNames[i % fieldNames.length]} for better accuracy`
        )

        return createMockValidation({
            isValid: errorCount === 0,
            errors,
            warnings,
            suggestions
        })
    }
}

export default {
    createMockValidation,
    createMockError,
    createMockWarning,
    ValidationTestScenarios,
    ValidationTestWrapper,
    renderWithValidation,
    ValidationTestInteractions,
    ValidationTestAssertions,
    ValidationPerformanceTests,
    ValidationMocks,
    ValidationTestData
}
