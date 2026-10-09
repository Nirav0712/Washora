import { Injectable, Logger } from '@nestjs/common';
import { AttendanceStatus, SalaryType } from '@washora/shared';
import { AttendanceRecordDocument } from '../../schemas/attendance-record.schema';
import { LeaveRequestDocument } from '../../schemas/leave-request.schema';
import { SalaryRecordDocument } from '../../schemas/salary-record.schema';
import { SalaryAdvanceDocument } from '../../schemas/salary-advance.schema';

export interface CalculatedStaffPayroll {
  salaryType: SalaryType;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  regularHours: number;
  overtimeHours: number;
  overtimeAmount: number;
  allowances: { name: string; amount: number }[];
  totalAllowances: number;
  deductions: { name: string; amount: number }[];
  totalDeductions: number;
  grossSalary: number;
  advanceAmount: number;
  netSalary: number;
}

@Injectable()
export class PayrollCalculatorService {
  private readonly logger = new Logger(PayrollCalculatorService.name);

  /**
   * Deterministic salary calculation in integer cents/paise:
   * 
   * 1. Total Allowances = sum(allowances[i].amount)
   * 2. Overtime Amount = round(overtimeHours * (overtimeRate || (hourlyRate * 1.5) || 0))
   * 3. Gross Salary = Base Salary + Total Allowances + Overtime Amount
   * 4. Total Deductions = sum(deductions[i].amount)
   * 5. Advances = sum(approvedAdvances[i].amount)
   * 6. Net Salary = max(0, Gross Salary - Total Deductions - Advances)
   */
  calculate(
    salaryRecord: SalaryRecordDocument,
    attendanceRecords: AttendanceRecordDocument[],
    approvedLeaves: LeaveRequestDocument[],
    approvedAdvances: SalaryAdvanceDocument[],
    totalPeriodWorkingDays = 26,
  ): CalculatedStaffPayroll {
    const baseSalary = Math.round(salaryRecord.baseSalary || 0);
    const salaryType = salaryRecord.salaryType || SalaryType.MONTHLY;

    // Count attendance metrics
    let presentDays = 0;
    let totalWorkMinutes = 0;
    let totalOvertimeMinutes = 0;

    for (const record of attendanceRecords) {
      if (record.status === AttendanceStatus.PRESENT) {
        presentDays += 1;
      } else if (record.status === AttendanceStatus.HALF_DAY) {
        presentDays += 0.5;
      } else if (record.status === AttendanceStatus.LATE) {
        presentDays += 1;
      }
      totalWorkMinutes += record.workMinutes || 0;
      totalOvertimeMinutes += record.overtimeMinutes || 0;
    }

    // Count approved leave days
    let leaveDays = 0;
    for (const leave of approvedLeaves) {
      leaveDays += leave.totalDays || 0;
    }

    const workingDays = totalPeriodWorkingDays;
    const absentDays = Math.max(0, workingDays - (presentDays + leaveDays));

    const regularHours = Math.round((totalWorkMinutes / 60) * 10) / 10;
    const overtimeHours = Math.round((totalOvertimeMinutes / 60) * 10) / 10;

    // Calculate Overtime Amount
    let overtimeRate = salaryRecord.overtimeRate || 0;
    if (!overtimeRate && salaryRecord.hourlyRate) {
      overtimeRate = Math.round(salaryRecord.hourlyRate * 1.5);
    }
    const overtimeAmount = Math.round(overtimeHours * overtimeRate);

    // Sum Allowances
    const allowances = salaryRecord.allowances || [];
    const totalAllowances = allowances.reduce((acc, a) => acc + Math.round(a.amount || 0), 0);

    // Sum Deductions
    const deductions = salaryRecord.deductions || [];
    const totalDeductions = deductions.reduce((acc, d) => acc + Math.round(d.amount || 0), 0);

    // Sum Advances
    const advanceAmount = approvedAdvances.reduce((acc, adv) => acc + Math.round(adv.amount || 0), 0);

    // Calculate Gross Salary: Base + Allowances + Overtime
    const grossSalary = baseSalary + totalAllowances + overtimeAmount;

    // Calculate Net Salary: Gross - Deductions - Advance
    const netSalary = Math.max(0, grossSalary - totalDeductions - advanceAmount);

    return {
      salaryType,
      baseSalary,
      workingDays,
      presentDays,
      leaveDays,
      absentDays,
      regularHours,
      overtimeHours,
      overtimeAmount,
      allowances,
      totalAllowances,
      deductions,
      totalDeductions,
      grossSalary,
      advanceAmount,
      netSalary,
    };
  }
}
