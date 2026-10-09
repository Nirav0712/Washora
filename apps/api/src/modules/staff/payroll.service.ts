import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SalaryType,
  PayrollPeriodStatus,
  SalaryAdvanceStatus,
  StaffStatus,
  LeaveStatus,
} from '@washora/shared';
import { SalaryRecord, SalaryRecordDocument } from '../../schemas/salary-record.schema';
import { PayrollPeriod, PayrollPeriodDocument } from '../../schemas/payroll-period.schema';
import { PayrollRecord, PayrollRecordDocument } from '../../schemas/payroll-record.schema';
import { SalaryAdvance, SalaryAdvanceDocument } from '../../schemas/salary-advance.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../schemas/attendance-record.schema';
import { LeaveRequest, LeaveRequestDocument } from '../../schemas/leave-request.schema';
import { PayrollCalculatorService } from './payroll-calculator.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSalaryRecordDto,
  CreatePayrollPeriodDto,
  CreateSalaryAdvanceDto,
  ApproveSalaryAdvanceDto,
  RejectSalaryAdvanceDto,
} from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectModel(SalaryRecord.name)
    private salaryRecordModel: Model<SalaryRecordDocument>,
    @InjectModel(PayrollPeriod.name)
    private payrollPeriodModel: Model<PayrollPeriodDocument>,
    @InjectModel(PayrollRecord.name)
    private payrollRecordModel: Model<PayrollRecordDocument>,
    @InjectModel(SalaryAdvance.name)
    private salaryAdvanceModel: Model<SalaryAdvanceDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequestDocument>,
    private payrollCalculator: PayrollCalculatorService,
    private auditService: AuditService,
  ) {}

  async createSalaryRecord(
    tenantId: string | Types.ObjectId,
    dto: CreateSalaryRecordDto,
    actorUserId?: string,
  ): Promise<SalaryRecordDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const staffId = new Types.ObjectId(dto.staffId);

    const staff = await this.staffModel.findOne({ _id: staffId, tenantId: tId }).exec();
    if (!staff) {
      throw new NotFoundException(`Staff profile ${dto.staffId} not found`);
    }

    const effectiveDate = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

    // Preserve history: Mark previous current salary record as non-current
    await this.salaryRecordModel.updateMany(
      { tenantId: tId, staffId, isCurrent: true },
      { isCurrent: false, effectiveTo: effectiveDate },
    ).exec();

    const record = new this.salaryRecordModel({
      tenantId: tId,
      staffId,
      salaryType: dto.salaryType,
      baseSalary: Math.round(dto.baseSalary),
      hourlyRate: dto.hourlyRate ? Math.round(dto.hourlyRate) : undefined,
      overtimeRate: dto.overtimeRate ? Math.round(dto.overtimeRate) : undefined,
      allowances: dto.allowances || [],
      deductions: dto.deductions || [],
      effectiveFrom: effectiveDate,
      isCurrent: true,
      createdBy: actorUserId ? new Types.ObjectId(actorUserId) : undefined,
    });

    const saved = await record.save();

    // Update staff profile active salary configuration
    staff.salaryConfiguration = {
      salaryType: dto.salaryType,
      baseSalary: Math.round(dto.baseSalary),
      hourlyRate: dto.hourlyRate,
      overtimeRate: dto.overtimeRate,
      allowances: dto.allowances || [],
      deductions: dto.deductions || [],
      effectiveFrom: effectiveDate,
    } as any;
    await staff.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'SALARY_CREATED',
        entity: 'SalaryRecord',
        entityId: saved._id.toString(),
        metadata: {
          staffId: staffId.toString(),
          salaryType: dto.salaryType,
          baseSalary: dto.baseSalary,
        },
      });
    }

    return saved;
  }

  async getSalaryRecords(tenantId: string | Types.ObjectId, staffId: string): Promise<SalaryRecordDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    return this.salaryRecordModel
      .find({ tenantId: tId, staffId: new Types.ObjectId(staffId) })
      .sort({ effectiveFrom: -1 })
      .exec();
  }

  async createPayrollPeriod(
    tenantId: string | Types.ObjectId,
    dto: CreatePayrollPeriodDto,
    actorUserId?: string,
  ): Promise<PayrollPeriodDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const existing = await this.payrollPeriodModel.findOne({
      tenantId: tId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    }).exec();

    if (existing) {
      throw new ConflictException(`Payroll period for ${dto.startDate} to ${dto.endDate} already exists`);
    }

    const period = new this.payrollPeriodModel({
      tenantId: tId,
      name: dto.name.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: PayrollPeriodStatus.DRAFT,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalStaffCount: 0,
    });

    const saved = await period.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'PAYROLL_CREATED',
        entity: 'PayrollPeriod',
        entityId: saved._id.toString(),
        metadata: { name: saved.name, startDate: saved.startDate, endDate: saved.endDate },
      });
    }

    return saved;
  }

  async getPayrollPeriods(tenantId: string | Types.ObjectId): Promise<PayrollPeriodDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    return this.payrollPeriodModel.find({ tenantId: tId }).sort({ startDate: -1 }).exec();
  }

  async getPayrollPeriodById(tenantId: string | Types.ObjectId, id: string): Promise<PayrollPeriodDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const period = await this.payrollPeriodModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!period) {
      throw new NotFoundException(`Payroll period ${id} not found`);
    }
    return period;
  }

  async processPayrollPeriod(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string,
  ): Promise<PayrollPeriodDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const period = await this.payrollPeriodModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!period) {
      throw new NotFoundException(`Payroll period ${id} not found`);
    }

    if (period.status === PayrollPeriodStatus.APPROVED || period.status === PayrollPeriodStatus.PAID) {
      throw new BadRequestException(`Cannot recalculate payroll period in ${period.status} status`);
    }

    period.status = PayrollPeriodStatus.PROCESSING;
    await period.save();

    // 1. Load active staff profiles
    const staffList = await this.staffModel.find({ tenantId: tId, status: StaffStatus.ACTIVE }).exec();

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let staffCount = 0;

    for (const staff of staffList) {
      // 2. Load current salary record
      let salaryRecord = await this.salaryRecordModel.findOne({
        tenantId: tId,
        staffId: staff._id,
        isCurrent: true,
      }).exec();

      if (!salaryRecord && staff.salaryConfiguration) {
        salaryRecord = new this.salaryRecordModel({
          tenantId: tId,
          staffId: staff._id,
          salaryType: staff.salaryConfiguration.salaryType,
          baseSalary: staff.salaryConfiguration.baseSalary,
          hourlyRate: staff.salaryConfiguration.hourlyRate,
          overtimeRate: staff.salaryConfiguration.overtimeRate,
          allowances: staff.salaryConfiguration.allowances || [],
          deductions: staff.salaryConfiguration.deductions || [],
          effectiveFrom: staff.salaryConfiguration.effectiveFrom || new Date(),
          isCurrent: true,
        });
      }

      if (!salaryRecord) {
        continue;
      }

      // 3. Load attendance records for the period
      const attendance = await this.attendanceModel.find({
        tenantId: tId,
        staffId: staff._id,
        date: { $gte: period.startDate, $lte: period.endDate },
      }).exec();

      // 4. Load approved leave requests
      const approvedLeaves = await this.leaveRequestModel.find({
        tenantId: tId,
        staffId: staff._id,
        status: LeaveStatus.APPROVED,
        startDate: { $lte: period.endDate },
        endDate: { $gte: period.startDate },
      }).exec();

      // 5. Load approved advances to deduct
      const advances = await this.salaryAdvanceModel.find({
        tenantId: tId,
        staffId: staff._id,
        status: SalaryAdvanceStatus.APPROVED,
        $or: [
          { deductFromPayrollPeriodId: period._id },
          { deductFromPayrollPeriodId: null },
          { deductFromPayrollPeriodId: { $exists: false } },
        ],
      }).exec();

      // 6. Calculate deterministic metrics
      const calculated = this.payrollCalculator.calculate(
        salaryRecord,
        attendance,
        approvedLeaves,
        advances,
      );

      // 7. Upsert snapshot PayrollRecord
      await this.payrollRecordModel.findOneAndUpdate(
        { tenantId: tId, payrollPeriodId: period._id, staffId: staff._id },
        {
          branchId: staff.primaryBranchId,
          salaryType: calculated.salaryType,
          baseSalary: calculated.baseSalary,
          workingDays: calculated.workingDays,
          presentDays: calculated.presentDays,
          leaveDays: calculated.leaveDays,
          absentDays: calculated.absentDays,
          regularHours: calculated.regularHours,
          overtimeHours: calculated.overtimeHours,
          overtimeAmount: calculated.overtimeAmount,
          allowances: calculated.allowances,
          totalAllowances: calculated.totalAllowances,
          deductions: calculated.deductions,
          totalDeductions: calculated.totalDeductions,
          grossSalary: calculated.grossSalary,
          advanceAmount: calculated.advanceAmount,
          netSalary: calculated.netSalary,
          status: PayrollPeriodStatus.PROCESSED,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();

      // Mark advances as deducted for this period
      for (const adv of advances) {
        adv.status = SalaryAdvanceStatus.DEDUCTED;
        adv.deductFromPayrollPeriodId = period._id;
        await adv.save();
      }

      totalGross += calculated.grossSalary;
      totalDeductions += (calculated.totalDeductions + calculated.advanceAmount);
      totalNet += calculated.netSalary;
      staffCount += 1;
    }

    period.totalGross = totalGross;
    period.totalDeductions = totalDeductions;
    period.totalNet = totalNet;
    period.totalStaffCount = staffCount;
    period.status = PayrollPeriodStatus.PROCESSED;
    period.processedAt = new Date();
    period.processedBy = new Types.ObjectId(actorUserId);

    const savedPeriod = await period.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PAYROLL_PROCESSED',
      entity: 'PayrollPeriod',
      entityId: id,
      metadata: {
        totalGross,
        totalNet,
        totalStaffCount: staffCount,
      },
    });

    return savedPeriod;
  }

  async approvePayrollPeriod(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string,
  ): Promise<PayrollPeriodDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const period = await this.payrollPeriodModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!period) {
      throw new NotFoundException(`Payroll period ${id} not found`);
    }

    if (period.status !== PayrollPeriodStatus.PROCESSED) {
      throw new BadRequestException(`Cannot approve payroll period in ${period.status} status. Process it first.`);
    }

    period.status = PayrollPeriodStatus.APPROVED;
    period.approvedAt = new Date();
    period.approvedBy = new Types.ObjectId(actorUserId);

    await this.payrollRecordModel.updateMany(
      { tenantId: tId, payrollPeriodId: period._id },
      { status: PayrollPeriodStatus.APPROVED },
    ).exec();

    const saved = await period.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PAYROLL_APPROVED',
      entity: 'PayrollPeriod',
      entityId: id,
      metadata: { name: period.name, totalNet: period.totalNet },
    });

    return saved;
  }

  async getPayrollRecordsForPeriod(
    tenantId: string | Types.ObjectId,
    periodId: string,
    userBranchIds?: string[],
  ): Promise<any[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: any = { tenantId: tId, payrollPeriodId: new Types.ObjectId(periodId) };

    if (userBranchIds && userBranchIds.length > 0) {
      filter.branchId = { $in: userBranchIds.map((id) => new Types.ObjectId(id)) };
    }

    return this.payrollRecordModel
      .find(filter)
      .populate({
        path: 'staffId',
        select: 'employeeCode designation department bankDetails',
        populate: { path: 'userId', select: 'name email phone avatar' },
      })
      .populate('branchId', 'name code')
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async createSalaryAdvance(
    tenantId: string | Types.ObjectId,
    dto: CreateSalaryAdvanceDto,
    actorUserId?: string,
  ): Promise<SalaryAdvanceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const staffId = new Types.ObjectId(dto.staffId);

    const staff = await this.staffModel.findOne({ _id: staffId, tenantId: tId }).exec();
    if (!staff) {
      throw new NotFoundException(`Staff ${dto.staffId} not found`);
    }

    const advance = new this.salaryAdvanceModel({
      tenantId: tId,
      staffId,
      amount: Math.round(dto.amount),
      requestedDate: dto.requestedDate || new Date().toISOString().split('T')[0],
      reason: dto.reason.trim(),
      status: SalaryAdvanceStatus.PENDING,
    });

    const saved = await advance.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'SALARY_ADVANCE_REQUESTED',
        entity: 'SalaryAdvance',
        entityId: saved._id.toString(),
        metadata: { staffId: staffId.toString(), amount: dto.amount },
      });
    }

    return saved;
  }

  async approveSalaryAdvance(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: ApproveSalaryAdvanceDto,
    actorUserId: string,
  ): Promise<SalaryAdvanceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const advance = await this.salaryAdvanceModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!advance) {
      throw new NotFoundException(`Salary advance ${id} not found`);
    }

    advance.status = SalaryAdvanceStatus.APPROVED;
    advance.approvedDate = new Date();
    advance.approvedBy = new Types.ObjectId(actorUserId);
    if (dto.deductFromPayrollPeriodId) {
      advance.deductFromPayrollPeriodId = new Types.ObjectId(dto.deductFromPayrollPeriodId);
    }

    const saved = await advance.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'SALARY_ADVANCE_APPROVED',
      entity: 'SalaryAdvance',
      entityId: id,
      metadata: { amount: advance.amount },
    });

    return saved;
  }

  async rejectSalaryAdvance(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: RejectSalaryAdvanceDto,
    actorUserId: string,
  ): Promise<SalaryAdvanceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const advance = await this.salaryAdvanceModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!advance) {
      throw new NotFoundException(`Salary advance ${id} not found`);
    }

    advance.status = SalaryAdvanceStatus.REJECTED;
    advance.rejectionReason = dto.rejectionReason;

    const saved = await advance.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'SALARY_ADVANCE_REJECTED',
      entity: 'SalaryAdvance',
      entityId: id,
      metadata: { rejectionReason: dto.rejectionReason },
    });

    return saved;
  }

  async getSalaryAdvances(
    tenantId: string | Types.ObjectId,
    query: { staffId?: string; status?: string },
  ): Promise<any[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: any = { tenantId: tId };

    if (query.staffId) filter.staffId = new Types.ObjectId(query.staffId);
    if (query.status) filter.status = query.status;

    return this.salaryAdvanceModel
      .find(filter)
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('approvedBy', 'name email')
      .sort({ requestedDate: -1 })
      .lean()
      .exec();
  }
}
