/**
 * Enhanced Accessibility with Live Regions for Validation Components
 * Provides screen reader announcements for validation state changes
 */

import React, { useState, useEffect, useCallback } from 'react'
import { ValidationResult, ValidationError, ValidationWarning } from '@/lib/validation/gl-entry-validator'
import { useValidationI18n } from './ValidationI18nProvider'

interface ValidationAnnouncerProps {
    validation: ValidationResult | null
    priority?: 'polite' | 'assertive'
    announceOnMount?: boolean
    debounceMs?: number
    maxAnnouncements?: number
}

/**
 * Live announcement component for validation changes
 */
export const ValidationAnnouncer: React.FC<ValidationAnnouncerProps> = ({
    validation,
    priority = 'polite',
    announceOnMount = false,
    debounceMs = 500,
    maxAnnouncements = 3
}) => {
    const i18n = useValidationI18n()
    const [announcement, setAnnouncement] = useState('')
    const [announcementHistory, setAnnouncementHistory] = useState<string[]>([])

    // Debounced announcement to avoid spam
    const [debouncedValidation, setDebouncedValidation] = useState<ValidationResult | null>(validation)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValidation(validation)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [validation, debounceMs])

    const createAnnouncement = useCallback((validation: ValidationResult | null): string => {
        if (!validation) return ''

        const errorCount = validation.errors.filter(e => e.severity === 'error').length
        const warningCount = validation.warnings.length
        const suggestionCount = validation.suggestions.length

        const parts: string[] = []

        if (errorCount > 0) {
            parts.push(i18n.errors(errorCount))
        }

        if (warningCount > 0) {
            parts.push(i18n.warnings(warningCount))
        }

        if (suggestionCount > 0) {
            parts.push(i18n.suggestions(suggestionCount))
        }

        if (errorCount === 0 && warningCount === 0 && validation.isValid) {
            return i18n.allValidationsPassed
        }

        if (parts.length === 0) {
            return i18n.noValidationsYet
        }

        return parts.join(', ')
    }, [i18n])

    useEffect(() => {
        if (!debouncedValidation && !announceOnMount) return

        const newAnnouncement = createAnnouncement(debouncedValidation)

        // Avoid duplicate announcements
        if (newAnnouncement && newAnnouncement !== announcement && !announcementHistory.includes(newAnnouncement)) {
            setAnnouncement(newAnnouncement)

            // Update history and limit size
            setAnnouncementHistory(prev => {
                const updated = [newAnnouncement, ...prev].slice(0, maxAnnouncements)
                return updated
            })
        }
    }, [debouncedValidation, createAnnouncement, announcement, announcementHistory, announceOnMount, maxAnnouncements])

    return (
        <div
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
            role="status"
        >
            {announcement}
        </div>
    )
}

/**
 * Detailed validation announcer with field-specific messages
 */
export const DetailedValidationAnnouncer: React.FC<{
    validation: ValidationResult | null
    priority?: 'polite' | 'assertive'
    includeFieldNames?: boolean
    maxFieldsToAnnounce?: number
}> = ({
    validation,
    priority = 'polite',
    includeFieldNames = true,
    maxFieldsToAnnounce = 3
}) => {
        const i18n = useValidationI18n()
        const [announcement, setAnnouncement] = useState('')

        useEffect(() => {
            if (!validation) {
                setAnnouncement('')
                return
            }

            const errors = validation.errors.filter(e => e.severity === 'error')
            const warnings = validation.warnings

            const parts: string[] = []

            if (errors.length > 0) {
                if (includeFieldNames && errors.length <= maxFieldsToAnnounce) {
                    const fieldNames = errors.map(e => e.field).join(', ')
                    parts.push(`${i18n.errors(errors.length)} in fields: ${fieldNames}`)
                } else {
                    parts.push(i18n.errors(errors.length))
                }
            }

            if (warnings.length > 0) {
                if (includeFieldNames && warnings.length <= maxFieldsToAnnounce) {
                    const fieldNames = warnings.map(w => w.field).join(', ')
                    parts.push(`${i18n.warnings(warnings.length)} in fields: ${fieldNames}`)
                } else {
                    parts.push(i18n.warnings(warnings.length))
                }
            }

            if (errors.length === 0 && warnings.length === 0 && validation.isValid) {
                parts.push(i18n.allValidationsPassed)
            }

            setAnnouncement(parts.join('. '))
        }, [validation, i18n, includeFieldNames, maxFieldsToAnnounce])

        return (
            <div
                aria-live={priority}
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {announcement}
            </div>
        )
    }

/**
 * Progress validation announcer for step-by-step validation
 */
export const ProgressValidationAnnouncer: React.FC<{
    total: number
    validated: number
    errors: number
    currentField?: string
    priority?: 'polite' | 'assertive'
}> = ({
    total,
    validated,
    errors,
    currentField,
    priority = 'polite'
}) => {
        const i18n = useValidationI18n()
        const [announcement, setAnnouncement] = useState('')

        useEffect(() => {
            const parts: string[] = []

            if (currentField) {
                parts.push(`${i18n.validating} ${currentField}`)
            }

            if (total > 0) {
                const progress = Math.round((validated / total) * 100)
                parts.push(`${progress}% complete`)

                if (errors > 0) {
                    parts.push(i18n.errors(errors))
                }
            }

            setAnnouncement(parts.join('. '))
        }, [total, validated, errors, currentField, i18n])

        return (
            <div
                aria-live={priority}
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {announcement}
            </div>
        )
    }

/**
 * Field-specific validation announcer
 */
export const FieldValidationAnnouncer: React.FC<{
    fieldName: string
    validation: ValidationResult | null
    isValidating?: boolean
    priority?: 'polite' | 'assertive'
}> = ({
    fieldName,
    validation,
    isValidating = false,
    priority = 'assertive' // More urgent for field-level feedback
}) => {
        const i18n = useValidationI18n()
        const [announcement, setAnnouncement] = useState('')

        useEffect(() => {
            if (isValidating) {
                setAnnouncement(`${i18n.validating} ${fieldName}`)
                return
            }

            if (!validation) {
                setAnnouncement('')
                return
            }

            const errors = validation.errors.filter(e => e.severity === 'error')
            const warnings = validation.warnings

            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.message).join('. ')
                setAnnouncement(`${fieldName}: ${errorMessages}`)
            } else if (warnings.length > 0) {
                const warningMessages = warnings.map(w => w.message).join('. ')
                setAnnouncement(`${fieldName}: ${warningMessages}`)
            } else if (validation.isValid) {
                setAnnouncement(`${fieldName}: ${i18n.valid}`)
            } else {
                setAnnouncement('')
            }
        }, [fieldName, validation, isValidating, i18n])

        return (
            <div
                aria-live={priority}
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {announcement}
            </div>
        )
    }

/**
 * Validation status change announcer
 */
export const ValidationStatusAnnouncer: React.FC<{
    isValidating: boolean
    isValid: boolean
    hasErrors: boolean
    hasWarnings: boolean
    priority?: 'polite' | 'assertive'
}> = ({
    isValidating,
    isValid,
    hasErrors,
    hasWarnings,
    priority = 'polite'
}) => {
        const i18n = useValidationI18n()
        const [announcement, setAnnouncement] = useState('')
        const [previousState, setPreviousState] = useState({ isValidating, isValid, hasErrors, hasWarnings })

        useEffect(() => {
            // Only announce on state changes
            const stateChanged =
                previousState.isValidating !== isValidating ||
                previousState.isValid !== isValid ||
                previousState.hasErrors !== hasErrors ||
                previousState.hasWarnings !== hasWarnings

            if (!stateChanged) return

            setPreviousState({ isValidating, isValid, hasErrors, hasWarnings })

            if (isValidating) {
                setAnnouncement(i18n.validating)
            } else if (hasErrors) {
                setAnnouncement(i18n.hasErrors)
            } else if (hasWarnings) {
                setAnnouncement(i18n.hasWarnings)
            } else if (isValid) {
                setAnnouncement(i18n.valid)
            } else {
                setAnnouncement('')
            }
        }, [isValidating, isValid, hasErrors, hasWarnings, previousState, i18n])

        return (
            <div
                aria-live={priority}
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {announcement}
            </div>
        )
    }

/**
 * Comprehensive validation announcer that combines multiple announcement types
 */
export const ComprehensiveValidationAnnouncer: React.FC<{
    validation: ValidationResult | null
    isValidating?: boolean
    currentField?: string
    total?: number
    validated?: number
    priority?: 'polite' | 'assertive'
    mode?: 'summary' | 'detailed' | 'progress' | 'status'
}> = ({
    validation,
    isValidating = false,
    currentField,
    total,
    validated,
    priority = 'polite',
    mode = 'summary'
}) => {
        switch (mode) {
            case 'detailed':
                return <DetailedValidationAnnouncer validation={validation} priority={priority} />

            case 'progress':
                if (total !== undefined && validated !== undefined) {
                    const errors = validation?.errors.filter(e => e.severity === 'error').length || 0
                    return (
                        <ProgressValidationAnnouncer
                            total={total}
                            validated={validated}
                            errors={errors}
                            currentField={currentField}
                            priority={priority}
                        />
                    )
                }
                return <ValidationAnnouncer validation={validation} priority={priority} />

            case 'status':
                const hasErrors = validation?.errors.some(e => e.severity === 'error') || false
                const hasWarnings = validation?.warnings.length > 0 || false
                const isValid = validation?.isValid || false

                return (
                    <ValidationStatusAnnouncer
                        isValidating={isValidating}
                        isValid={isValid}
                        hasErrors={hasErrors}
                        hasWarnings={hasWarnings}
                        priority={priority}
                    />
                )

            default:
                return <ValidationAnnouncer validation={validation} priority={priority} />
        }
    }

export default ValidationAnnouncer
