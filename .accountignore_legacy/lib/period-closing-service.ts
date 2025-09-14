/**
 * Period Closing Service - ERPNext Level
 * Comprehensive period closing with validation and controls
 */

import { supabase } from "./supabase";

export interface PeriodClosingVoucher {
  id: string;
  companyId: string;
  voucherNo: string;
  periodStartDate: string;
  periodEndDate: string;
  fiscalYear: string;
  postingDate: string;
  closingAccountHead: string;
  remarks?: string;
  totalCredit: number;
  totalDebit: number;
  netProfitLoss: number;
  docstatus: 0 | 1 | 2;
  isPeriodClosed: boolean;
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  submittedAt?: string;
  submittedBy?: string;
}

export interface PeriodClosingVoucherDetail {
  id: string;
  parent: string;
  accountId: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  projectId?: string;
}

export interface FiscalYear {
  id: string;
  companyId: string;
  yearName: string;
  yearStartDate: string;
  yearEndDate: string;
  isShortYear: boolean;
  disabled: boolean;
  createdAt: string;
}

export interface AccountingPeriod {
  id: string;
  companyId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedBy?: string;
  closedAt?: string;
  createdAt: string;
}

export interface PeriodClosingStatus {
  lastClosedPeriod?: string;
  isCurrentPeriodClosed: boolean;
  daysSinceLastClosing?: number;
  pendingClosingPeriods: string[];
}

export interface PeriodClosingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PeriodClosingService {
  /**
   * Create period closing voucher
   */
  static async createPeriodClosingVoucher(
    companyId: string,
    periodStartDate: string,
    periodEndDate: string,
    postingDate: string,
    closingAccountHead: string,
    remarks?: string,
    createdBy?: string,
  ): Promise<{
    success: boolean;
    voucherId?: string;
    voucherNo?: string;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("create_period_closing_voucher", {
        p_company_id: companyId,
        p_period_start_date: periodStartDate,
        p_period_end_date: periodEndDate,
        p_posting_date: postingDate,
        p_closing_account_head: closingAccountHead,
        p_remarks: remarks,
        p_created_by: createdBy,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const result = data[0];
      return {
        success: result.success,
        voucherId: result.voucher_id,
        voucherNo: result.voucher_no,
        message: result.message,
      };
    } catch (error) {
      return { success: false, message: `Failed to create period closing voucher: ${error}` };
    }
  }

  /**
   * Submit period closing voucher
   */
  static async submitPeriodClosingVoucher(
    voucherId: string,
    submittedBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("submit_period_closing_voucher", {
        p_voucher_id: voucherId,
        p_submitted_by: submittedBy,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const result = data[0];
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return { success: false, message: `Failed to submit period closing voucher: ${error}` };
    }
  }

  /**
   * Cancel period closing voucher
   */
  static async cancelPeriodClosingVoucher(
    voucherId: string,
    cancelledBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First, cancel all GL entries created by this voucher
      const { data: voucher, error: voucherError } = await supabase
        .from("period_closing_vouchers")
        .select("voucher_no, company_id")
        .eq("id", voucherId)
        .single();

      if (voucherError) {
        return { success: false, message: voucherError.message };
      }

      // Cancel GL entries
      const { error: glError } = await supabase
        .from("gl_entries")
        .update({ docstatus: 2 })
        .eq("voucher_type", "Period Closing Voucher")
        .eq("voucher_no", voucher.voucher_no)
        .eq("company_id", voucher.company_id);

      if (glError) {
        return { success: false, message: glError.message };
      }

      // Cancel the voucher
      const { error: cancelError } = await supabase
        .from("period_closing_vouchers")
        .update({
          docstatus: 2,
          is_period_closed: false,
          modified_at: new Date().toISOString(),
          modified_by: cancelledBy,
        })
        .eq("id", voucherId);

      if (cancelError) {
        return { success: false, message: cancelError.message };
      }

      return { success: true, message: "Period closing voucher cancelled successfully" };
    } catch (error) {
      return { success: false, message: `Failed to cancel period closing voucher: ${error}` };
    }
  }

  /**
   * Get period closing vouchers
   */
  static async getPeriodClosingVouchers(
    companyId: string,
    fiscalYear?: string,
    docstatus?: number,
  ): Promise<{ success: boolean; data?: PeriodClosingVoucher[]; error?: string }> {
    try {
      let query = supabase.from("period_closing_vouchers").select("*").eq("company_id", companyId);

      if (fiscalYear) {
        query = query.eq("fiscal_year", fiscalYear);
      }

      if (docstatus !== undefined) {
        query = query.eq("docstatus", docstatus);
      }

      const { data, error } = await query.order("period_end_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const vouchers: PeriodClosingVoucher[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        voucherNo: item.voucher_no,
        periodStartDate: item.period_start_date,
        periodEndDate: item.period_end_date,
        fiscalYear: item.fiscal_year,
        postingDate: item.posting_date,
        closingAccountHead: item.closing_account_head,
        remarks: item.remarks,
        totalCredit: item.total_credit,
        totalDebit: item.total_debit,
        netProfitLoss: item.net_profit_loss,
        docstatus: item.docstatus,
        isPeriodClosed: item.is_period_closed,
        createdAt: item.created_at,
        createdBy: item.created_by,
        modifiedAt: item.modified_at,
        modifiedBy: item.modified_by,
        submittedAt: item.submitted_at,
        submittedBy: item.submitted_by,
      }));

      return { success: true, data: vouchers };
    } catch (error) {
      return { success: false, error: `Failed to get period closing vouchers: ${error}` };
    }
  }

  /**
   * Get period closing voucher details
   */
  static async getPeriodClosingVoucherDetails(voucherId: string): Promise<{
    success: boolean;
    voucher?: PeriodClosingVoucher;
    details?: PeriodClosingVoucherDetail[];
    error?: string;
  }> {
    try {
      // Get voucher
      const { data: voucherData, error: voucherError } = await supabase
        .from("period_closing_vouchers")
        .select("*")
        .eq("id", voucherId)
        .single();

      if (voucherError) {
        return { success: false, error: voucherError.message };
      }

      // Get details
      const { data: detailsData, error: detailsError } = await supabase
        .from("period_closing_voucher_details")
        .select("*")
        .eq("parent", voucherId);

      if (detailsError) {
        return { success: false, error: detailsError.message };
      }

      const voucher: PeriodClosingVoucher = {
        id: voucherData.id,
        companyId: voucherData.company_id,
        voucherNo: voucherData.voucher_no,
        periodStartDate: voucherData.period_start_date,
        periodEndDate: voucherData.period_end_date,
        fiscalYear: voucherData.fiscal_year,
        postingDate: voucherData.posting_date,
        closingAccountHead: voucherData.closing_account_head,
        remarks: voucherData.remarks,
        totalCredit: voucherData.total_credit,
        totalDebit: voucherData.total_debit,
        netProfitLoss: voucherData.net_profit_loss,
        docstatus: voucherData.docstatus,
        isPeriodClosed: voucherData.is_period_closed,
        createdAt: voucherData.created_at,
        createdBy: voucherData.created_by,
        modifiedAt: voucherData.modified_at,
        modifiedBy: voucherData.modified_by,
        submittedAt: voucherData.submitted_at,
        submittedBy: voucherData.submitted_by,
      };

      const details: PeriodClosingVoucherDetail[] = detailsData.map(item => ({
        id: item.id,
        parent: item.parent,
        accountId: item.account_id,
        debit: item.debit,
        credit: item.credit,
        costCenterId: item.cost_center_id,
        projectId: item.project_id,
      }));

      return { success: true, voucher, details };
    } catch (error) {
      return { success: false, error: `Failed to get period closing voucher details: ${error}` };
    }
  }

  /**
   * Get period closing status
   */
  static async getPeriodClosingStatus(
    companyId: string,
    asOfDate?: string,
  ): Promise<{ success: boolean; data?: PeriodClosingStatus; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_period_closing_status", {
        p_company_id: companyId,
        p_as_of_date: asOfDate || new Date().toISOString().slice(0, 10),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data[0];
      const status: PeriodClosingStatus = {
        lastClosedPeriod: result.last_closed_period,
        isCurrentPeriodClosed: result.is_current_period_closed,
        daysSinceLastClosing: result.days_since_last_closing,
        pendingClosingPeriods: result.pending_closing_periods || [],
      };

      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: `Failed to get period closing status: ${error}` };
    }
  }

  /**
   * Validate posting date against closed periods
   */
  static async validatePostingDateAgainstClosedPeriods(
    companyId: string,
    postingDate: string,
    voucherType: string,
  ): Promise<{ isValid: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("validate_posting_date_against_closed_periods", {
        p_company_id: companyId,
        p_posting_date: postingDate,
        p_voucher_type: voucherType,
      });

      if (error) {
        return { isValid: false, message: error.message };
      }

      const result = data[0];
      return {
        isValid: result.is_valid,
        message: result.message,
      };
    } catch (error) {
      return { isValid: false, message: `Validation error: ${error}` };
    }
  }

  /**
   * Validate period closing voucher before submission
   */
  static async validatePeriodClosingVoucher(voucherId: string): Promise<PeriodClosingValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get voucher details
      const { voucher, details } = await this.getPeriodClosingVoucherDetails(voucherId);
      if (!voucher || !details) {
        return { isValid: false, errors: ["Voucher not found"], warnings: [] };
      }

      // Check if voucher is balanced
      if (Math.abs(voucher.totalDebit - voucher.totalCredit) > 0.01) {
        errors.push("Period closing voucher is not balanced");
      }

      // Check if there are any details
      if (details.length === 0) {
        errors.push("Period closing voucher has no entries");
      }

      // Check if period is already closed
      const { data: existingVouchers } = await supabase
        .from("period_closing_vouchers")
        .select("id")
        .eq("company_id", voucher.companyId)
        .eq("period_end_date", voucher.periodEndDate)
        .eq("docstatus", 1)
        .neq("id", voucherId);

      if (existingVouchers && existingVouchers.length > 0) {
        errors.push("Period is already closed by another voucher");
      }

      // Check if there are any transactions after the period end date
      const { data: futureTransactions } = await supabase
        .from("gl_entries")
        .select("id")
        .eq("company_id", voucher.companyId)
        .gt("posting_date", voucher.periodEndDate)
        .eq("docstatus", 1)
        .limit(1);

      if (futureTransactions && futureTransactions.length > 0) {
        warnings.push("There are transactions after the period end date");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * Create fiscal year
   */
  static async createFiscalYear(
    companyId: string,
    yearName: string,
    yearStartDate: string,
    yearEndDate: string,
    isShortYear: boolean = false,
  ): Promise<{ success: boolean; fiscalYearId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("fiscal_years")
        .insert({
          company_id: companyId,
          year_name: yearName,
          year_start_date: yearStartDate,
          year_end_date: yearEndDate,
          is_short_year: isShortYear,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, fiscalYearId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create fiscal year: ${error}` };
    }
  }

  /**
   * Get fiscal years
   */
  static async getFiscalYears(companyId: string): Promise<{
    success: boolean;
    data?: FiscalYear[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("fiscal_years")
        .select("*")
        .eq("company_id", companyId)
        .eq("disabled", false)
        .order("year_start_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const fiscalYears: FiscalYear[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        yearName: item.year_name,
        yearStartDate: item.year_start_date,
        yearEndDate: item.year_end_date,
        isShortYear: item.is_short_year,
        disabled: item.disabled,
        createdAt: item.created_at,
      }));

      return { success: true, data: fiscalYears };
    } catch (error) {
      return { success: false, error: `Failed to get fiscal years: ${error}` };
    }
  }

  /**
   * Create accounting period
   */
  static async createAccountingPeriod(
    companyId: string,
    periodName: string,
    startDate: string,
    endDate: string,
  ): Promise<{ success: boolean; periodId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("accounting_periods")
        .insert({
          company_id: companyId,
          period_name: periodName,
          start_date: startDate,
          end_date: endDate,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, periodId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create accounting period: ${error}` };
    }
  }

  /**
   * Close accounting period
   */
  static async closeAccountingPeriod(
    periodId: string,
    closedBy?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("accounting_periods")
        .update({
          is_closed: true,
          closed_by: closedBy,
          closed_at: new Date().toISOString(),
        })
        .eq("id", periodId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to close accounting period: ${error}` };
    }
  }

  /**
   * Get accounting periods
   */
  static async getAccountingPeriods(companyId: string): Promise<{
    success: boolean;
    data?: AccountingPeriod[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("accounting_periods")
        .select("*")
        .eq("company_id", companyId)
        .order("start_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const periods: AccountingPeriod[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        periodName: item.period_name,
        startDate: item.start_date,
        endDate: item.end_date,
        isClosed: item.is_closed,
        closedBy: item.closed_by,
        closedAt: item.closed_at,
        createdAt: item.created_at,
      }));

      return { success: true, data: periods };
    } catch (error) {
      return { success: false, error: `Failed to get accounting periods: ${error}` };
    }
  }
}

export default PeriodClosingService;
