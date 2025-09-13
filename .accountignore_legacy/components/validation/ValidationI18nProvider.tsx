/**
 * Enhanced Internationalization (i18n) Support for Validation Components
 * Provides localization context for validation messages and labels
 */

import React, { createContext, useContext } from 'react'

export interface ValidationI18n {
    // Count-based messages
    errors: (count: number) => string
    warnings: (count: number) => string
    suggestions: (count: number) => string

    // Section titles
    validationErrors: string
    information: string
    validationSummary: string
    validationProgress: string

    // Status messages
    validating: string
    hasErrors: string
    hasWarnings: string
    valid: string
    allValidationsPassed: string
    noValidationsYet: string

    // Actions
    copyDetails: string
    copyDetailsTitle: string
    exportJson: string
    exportCsv: string
    exportJsonTitle: string
    exportCsvTitle: string

    // Accessibility
    validationProgressLabel: string
    validationError: string
    validationWarning: string
    validationSuggestion: string

    // Filters
    all: string
    errorsOnly: string
    warningsOnly: string
    suggestionsOnly: string

    // Categories
    businessRule: string
    dataIntegrity: string
    compliance: string
    performance: string

    // Impact levels
    highImpact: string
    mediumImpact: string
    lowImpact: string

    // Field linking
    jumpToField: string
    fieldValidation: string

    // Export messages
    validationReport: string
    exportSuccess: string
    exportError: string
}

const defaultI18n: ValidationI18n = {
    // Count-based messages
    errors: (count) => `${count} error${count !== 1 ? 's' : ''}`,
    warnings: (count) => `${count} warning${count !== 1 ? 's' : ''}`,
    suggestions: (count) => `${count} suggestion${count !== 1 ? 's' : ''}`,

    // Section titles
    validationErrors: 'Validation Errors',
    information: 'Information',
    validationSummary: 'Validation Summary',
    validationProgress: 'Validation Progress',

    // Status messages
    validating: 'Validating...',
    hasErrors: 'Has errors',
    hasWarnings: 'Has warnings',
    valid: 'Valid',
    allValidationsPassed: 'All validations passed successfully!',
    noValidationsYet: 'No validations yet',

    // Actions
    copyDetails: 'Copy Details',
    copyDetailsTitle: 'Copy validation details for support',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    exportJsonTitle: 'Export validation report as JSON',
    exportCsvTitle: 'Export validation report as CSV',

    // Accessibility
    validationProgressLabel: 'Validation progress',
    validationError: 'Validation error',
    validationWarning: 'Validation warning',
    validationSuggestion: 'Validation suggestion',

    // Filters
    all: 'All',
    errorsOnly: 'Errors',
    warningsOnly: 'Warnings',
    suggestionsOnly: 'Suggestions',

    // Categories
    businessRule: 'Business Rule',
    dataIntegrity: 'Data Integrity',
    compliance: 'Compliance',
    performance: 'Performance',

    // Impact levels
    highImpact: 'High Impact',
    mediumImpact: 'Medium Impact',
    lowImpact: 'Low Impact',

    // Field linking
    jumpToField: 'Jump to field',
    fieldValidation: 'Field Validation',

    // Export messages
    validationReport: 'Validation Report',
    exportSuccess: 'Export completed successfully',
    exportError: 'Failed to export validation report'
}

// Spanish translations example
export const esI18n: Partial<ValidationI18n> = {
    errors: (count) => `${count} error${count !== 1 ? 'es' : ''}`,
    warnings: (count) => `${count} advertencia${count !== 1 ? 's' : ''}`,
    suggestions: (count) => `${count} sugerencia${count !== 1 ? 's' : ''}`,

    validationErrors: 'Errores de Validación',
    information: 'Información',
    validationSummary: 'Resumen de Validación',
    validationProgress: 'Progreso de Validación',

    validating: 'Validando...',
    hasErrors: 'Tiene errores',
    hasWarnings: 'Tiene advertencias',
    valid: 'Válido',
    allValidationsPassed: '¡Todas las validaciones pasaron exitosamente!',
    noValidationsYet: 'Aún no hay validaciones',

    copyDetails: 'Copiar Detalles',
    copyDetailsTitle: 'Copiar detalles de validación para soporte',
    exportJson: 'Exportar JSON',
    exportCsv: 'Exportar CSV',

    all: 'Todos',
    errorsOnly: 'Errores',
    warningsOnly: 'Advertencias',
    suggestionsOnly: 'Sugerencias',

    businessRule: 'Regla de Negocio',
    dataIntegrity: 'Integridad de Datos',
    compliance: 'Cumplimiento',
    performance: 'Rendimiento',

    highImpact: 'Alto Impacto',
    mediumImpact: 'Impacto Medio',
    lowImpact: 'Bajo Impacto'
}

// French translations example
export const frI18n: Partial<ValidationI18n> = {
    errors: (count) => `${count} erreur${count !== 1 ? 's' : ''}`,
    warnings: (count) => `${count} avertissement${count !== 1 ? 's' : ''}`,
    suggestions: (count) => `${count} suggestion${count !== 1 ? 's' : ''}`,

    validationErrors: 'Erreurs de Validation',
    information: 'Information',
    validationSummary: 'Résumé de Validation',
    validationProgress: 'Progrès de Validation',

    validating: 'Validation en cours...',
    hasErrors: 'A des erreurs',
    hasWarnings: 'A des avertissements',
    valid: 'Valide',
    allValidationsPassed: 'Toutes les validations ont réussi !',
    noValidationsYet: 'Aucune validation pour le moment',

    copyDetails: 'Copier les Détails',
    copyDetailsTitle: 'Copier les détails de validation pour le support',
    exportJson: 'Exporter JSON',
    exportCsv: 'Exporter CSV',

    all: 'Tous',
    errorsOnly: 'Erreurs',
    warningsOnly: 'Avertissements',
    suggestionsOnly: 'Suggestions',

    businessRule: 'Règle Métier',
    dataIntegrity: 'Intégrité des Données',
    compliance: 'Conformité',
    performance: 'Performance',

    highImpact: 'Impact Élevé',
    mediumImpact: 'Impact Moyen',
    lowImpact: 'Faible Impact'
}

const ValidationI18nContext = createContext<ValidationI18n>(defaultI18n)

export const ValidationI18nProvider: React.FC<{
    i18n?: Partial<ValidationI18n>
    locale?: string
    children: React.ReactNode
}> = ({ i18n, locale, children }) => {
    // Auto-select locale-based translations
    const localeI18n = locale === 'es' ? esI18n : locale === 'fr' ? frI18n : {}

    const mergedI18n = {
        ...defaultI18n,
        ...localeI18n,
        ...i18n
    }

    return (
        <ValidationI18nContext.Provider value={mergedI18n}>
            {children}
        </ValidationI18nContext.Provider>
    )
}

export const useValidationI18n = () => {
    const context = useContext(ValidationI18nContext)
    if (!context) {
        throw new Error('useValidationI18n must be used within a ValidationI18nProvider')
    }
    return context
}

// Utility hook for category and impact translations
export const useValidationTranslations = () => {
    const i18n = useValidationI18n()

    const getCategoryLabel = (category: string): string => {
        switch (category) {
            case 'business_rule': return i18n.businessRule
            case 'data_integrity': return i18n.dataIntegrity
            case 'compliance': return i18n.compliance
            case 'performance': return i18n.performance
            default: return category.replace('_', ' ')
        }
    }

    const getImpactLabel = (impact: string): string => {
        switch (impact) {
            case 'high': return i18n.highImpact
            case 'medium': return i18n.mediumImpact
            case 'low': return i18n.lowImpact
            default: return impact
        }
    }

    return {
        getCategoryLabel,
        getImpactLabel
    }
}

export default ValidationI18nProvider
