/**
 * Multi-Currency Management System
 * Handles currency master data, exchange rates, and conversions
 */

import { supabase } from './supabase'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'BRL' | 'MYR'

export interface Currency {
  id: string
  code: CurrencyCode
  name: string
  symbol: string
  decimal_places: number
  is_base_currency: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: CurrencyCode
  to_currency: CurrencyCode
  rate: number
  date: string
  source: string
  created_at: string
}

export interface CurrencyConversion {
  from_currency: CurrencyCode
  to_currency: CurrencyCode
  amount: number
  converted_amount: number
  rate: number
  date: string
}

export interface MultiCurrencyGL {
  account_id: string
  debit: number
  credit: number
  currency: CurrencyCode
  exchange_rate: number
  base_debit: number
  base_credit: number
  posting_date: string
  voucher_type: string
  voucher_no: string
  party_type?: string
  party?: string
  company_id: string
}

/**
 * Currency Management Service
 */
export class CurrencyManagementService {
  /**
   * Get all active currencies
   */
  static async getCurrencies(): Promise<{
    success: boolean
    currencies?: Currency[]
    error?: string
  }> {
    try {
      const { data: currencies, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code')

      if (error) throw error

      return { success: true, currencies: currencies || [] }
    } catch (error) {
      console.error('Error fetching currencies:', error)
      return { success: false, error: 'Failed to fetch currencies' }
    }
  }

  /**
   * Get base currency for a company
   */
  static async getBaseCurrency(companyId: string): Promise<{
    success: boolean
    currency?: Currency
    error?: string
  }> {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('default_currency')
        .eq('id', companyId)
        .single()

      if (!company) {
        return { success: false, error: 'Company not found' }
      }

      const { data: currency, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('code', company.default_currency)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return { success: true, currency }
    } catch (error) {
      console.error('Error fetching base currency:', error)
      return { success: false, error: 'Failed to fetch base currency' }
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  static async getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<{
    success: boolean
    rate?: number
    error?: string
  }> {
    try {
      // Same currency
      if (fromCurrency === toCurrency) {
        return { success: true, rate: 1 }
      }

      // Try to get direct rate
      const { data: directRate } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .eq('date', date)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (directRate) {
        return { success: true, rate: directRate.rate }
      }

      // Try reverse rate
      const { data: reverseRate } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', toCurrency)
        .eq('to_currency', fromCurrency)
        .eq('date', date)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (reverseRate) {
        return { success: true, rate: 1 / reverseRate.rate }
      }

      // Try USD as intermediate currency
      const usdFromRate = await this.getExchangeRate(fromCurrency, 'USD', date)
      const usdToRate = await this.getExchangeRate('USD', toCurrency, date)

      if (usdFromRate.success && usdToRate.success && usdFromRate.rate && usdToRate.rate) {
        return { success: true, rate: usdFromRate.rate * usdToRate.rate }
      }

      return { success: false, error: 'Exchange rate not found' }
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      return { success: false, error: 'Failed to fetch exchange rate' }
    }
  }

  /**
   * Convert amount between currencies
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<{
    success: boolean
    conversion?: CurrencyConversion
    error?: string
  }> {
    try {
      const rateResult = await this.getExchangeRate(fromCurrency, toCurrency, date)

      if (!rateResult.success || !rateResult.rate) {
        return { success: false, error: rateResult.error }
      }

      const convertedAmount = amount * rateResult.rate

      return {
        success: true,
        conversion: {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount,
          converted_amount: convertedAmount,
          rate: rateResult.rate,
          date
        }
      }
    } catch (error) {
      console.error('Error converting currency:', error)
      return { success: false, error: 'Failed to convert currency' }
    }
  }

  /**
   * Create multi-currency GL entry
   */
  static async createMultiCurrencyGLEntry(
    glEntry: Omit<MultiCurrencyGL, 'base_debit' | 'base_credit'>,
    baseCurrency: CurrencyCode
  ): Promise<{
    success: boolean
    glEntry?: MultiCurrencyGL
    error?: string
  }> {
    try {
      // Convert to base currency
      const conversion = await this.convertCurrency(
        glEntry.debit - glEntry.credit,
        glEntry.currency,
        baseCurrency,
        glEntry.posting_date
      )

      if (!conversion.success || !conversion.conversion) {
        return { success: false, error: conversion.error }
      }

      const baseAmount = conversion.conversion.converted_amount
      const baseDebit = baseAmount > 0 ? baseAmount : 0
      const baseCredit = baseAmount < 0 ? Math.abs(baseAmount) : 0

      const multiCurrencyGL: MultiCurrencyGL = {
        ...glEntry,
        base_debit: baseDebit,
        base_credit: baseCredit,
        exchange_rate: conversion.conversion.rate
      }

      return { success: true, glEntry: multiCurrencyGL }
    } catch (error) {
      console.error('Error creating multi-currency GL entry:', error)
      return { success: false, error: 'Failed to create multi-currency GL entry' }
    }
  }

  /**
   * Update exchange rate
   */
  static async updateExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rate: number,
    date: string = new Date().toISOString().split('T')[0],
    source: string = 'Manual'
  ): Promise<{
    success: boolean
    exchangeRate?: ExchangeRate
    error?: string
  }> {
    try {
      const { data: exchangeRate, error } = await supabase
        .from('exchange_rates')
        .insert([{
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate,
          date,
          source
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, exchangeRate }
    } catch (error) {
      console.error('Error updating exchange rate:', error)
      return { success: false, error: 'Failed to update exchange rate' }
    }
  }

  /**
   * Get exchange rate history
   */
  static async getExchangeRateHistory(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean
    rates?: ExchangeRate[]
    error?: string
  }> {
    try {
      const { data: rates, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error

      return { success: true, rates: rates || [] }
    } catch (error) {
      console.error('Error fetching exchange rate history:', error)
      return { success: false, error: 'Failed to fetch exchange rate history' }
    }
  }

  /**
   * Get currency performance summary
   */
  static async getCurrencyPerformance(
    baseCurrency: CurrencyCode,
    period: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    success: boolean
    performance?: {
      currency: CurrencyCode
      current_rate: number
      change_percent: number
      trend: 'up' | 'down' | 'stable'
    }[]
    error?: string
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()

      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const currencies = await this.getCurrencies()
      if (!currencies.success || !currencies.currencies) {
        return { success: false, error: 'Failed to fetch currencies' }
      }

      const performance = []

      for (const currency of currencies.currencies) {
        if (currency.code === baseCurrency) continue

        // Get current rate
        const currentRate = await this.getExchangeRate(currency.code, baseCurrency, endDate)
        if (!currentRate.success || !currentRate.rate) continue

        // Get historical rate
        const historicalRate = await this.getExchangeRate(
          currency.code,
          baseCurrency,
          startDate.toISOString().split('T')[0]
        )
        if (!historicalRate.success || !historicalRate.rate) continue

        const changePercent = ((currentRate.rate - historicalRate.rate) / historicalRate.rate) * 100
        const trend = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'

        performance.push({
          currency: currency.code,
          current_rate: currentRate.rate,
          change_percent: changePercent,
          trend
        })
      }

      return { success: true, performance }
    } catch (error) {
      console.error('Error calculating currency performance:', error)
      return { success: false, error: 'Failed to calculate currency performance' }
    }
  }

  /**
   * Initialize default currencies
   */
  static async initializeDefaultCurrencies(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const defaultCurrencies: Omit<Currency, 'id' | 'created_at' | 'updated_at'>[] = [
        { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, is_base_currency: true, is_active: true },
        { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_places: 0, is_base_currency: false, is_active: true },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimal_places: 2, is_base_currency: false, is_active: true },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimal_places: 2, is_base_currency: false, is_active: true }
      ]

      const { error } = await supabase
        .from('currencies')
        .upsert(defaultCurrencies, { onConflict: 'code' })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error initializing currencies:', error)
      return { success: false, error: 'Failed to initialize currencies' }
    }
  }
}
