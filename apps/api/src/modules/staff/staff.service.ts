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
  StaffStatus,
  MembershipStatus,
  RoleType,
  AttendanceStatus,
  ProcessingJobStatus,
  QCResult,
} from '@washora/shared';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Membership, MembershipDocument } from '../../schemas/membership.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../schemas/attendance-record.schema';
import { ProcessingJob, ProcessingJobDocument } from '../../schemas/processing-job.schema';
import { QualityCheck, QualityCheckDocument } from '../../schemas/quality-check.schema';
import { SalaryRecord, SalaryRecordDocument } from '../../schemas/salary-record.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { RolesService } from '../roles/roles.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Membership.name)
    private membershipModel: Model<MembershipDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(ProcessingJob.name)
    private processingJobModel: Model<ProcessingJobDocument>,
    @InjectModel(QualityCheck.name)
    private qcModel: Model<QualityCheckDocument>,
    @InjectModel(SalaryRecord.name)
    private salaryRecordModel: Model<SalaryRecordDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
    private rolesService: RolesService,
  ) {}

  maskBankDetails(bankDetails?: any): any {
    if (!bankDetails) return undefined;
    const masked = { ...bankDetails };
    if (masked.accountNumber && masked.accountNumber.length > 4) {
      const last4 = masked.accountNumber.slice(-4);
      masked.accountNumberMasked = `XXXX-XXXX-${last4}`;
      delete masked.accountNumber;
    }
    return masked;
  }

  async create(tenantId: string | Types.ObjectId, dto: CreateStaffDto, actorUserId?: string): Promise<StaffProfileDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const primaryBranchId = new Types.ObjectId(dto.primaryBranchId);

    // Verify branch belongs to tenant
    const branch = await this.branchModel.findOne({ _id: primaryBranchId, tenantId: tId }).exec();
    if (!branch) {
      throw new NotFoundException(`Primary branch ${dto.primaryBranchId} not found in tenant`);
    }

    let userObjectId: Types.ObjectId;

    if (dto.userId) {
      userObjectId = new Types.ObjectId(dto.userId);
      const existingUser = await this.userModel.findById(userObjectId).exec();
      if (!existingUser) {
        throw new NotFoundException(`User ${dto.userId} not found`);
      }

      // Check if user already has a staff profile in this tenant
      const existingStaff = await this.staffModel.findOne({ tenantId: tId, userId: userObjectId }).exec();
      if (existingStaff) {
        throw new ConflictException(`User ${dto.userId} already has a staff profile in this tenant`);
      }

      // Ensure membership exists
      let membership = await this.membershipModel.findOne({ tenantId: tId, userId: userObjectId }).exec();
      if (!membership) {
        const role = await this.rolesService.getOrCreateSystemRole(tId, dto.roleCode || RoleType.OPERATOR);
        membership = new this.membershipModel({
          tenantId: tId,
          userId: userObjectId,
          roleId: role._id,
          branchIds: [primaryBranchId],
          status: MembershipStatus.ACTIVE,
        });
        await membership.save();
      }
    } else {
      if (!dto.email || !dto.name) {
        throw new BadRequestException('Name and email are required to create a new staff user');
      }

      let user = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() }).exec();
      if (!user) {
        const passwordHash = await PasswordUtil.hash(dto.password || 'Washora@2026');
        user = new this.userModel({
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone?.trim(),
          passwordHash,
          isActive: true,
          emailVerified: true,
        });
        await user.save();
      }

      userObjectId = user._id as Types.ObjectId;

      const existingStaff = await this.staffModel.findOne({ tenantId: tId, userId: userObjectId }).exec();
      if (existingStaff) {
        throw new ConflictException(`User with email ${dto.email} already has a staff profile in this tenant`);
      }

      // Create membership
      let membership = await this.membershipModel.findOne({ tenantId: tId, userId: userObjectId }).exec();
      if (!membership) {
        const role = await this.rolesService.getOrCreateSystemRole(tId, dto.roleCode || RoleType.OPERATOR);
        membership = new this.membershipModel({
          tenantId: tId,
          userId: userObjectId,
          roleId: role._id,
          branchIds: [primaryBranchId],
          status: MembershipStatus.ACTIVE,
        });
        await membership.save();
      }
    }

    // Generate atomic employee code
    const employeeCode = await this.counterService.generateEmployeeCode(tId);

    const branchObjectIds = (dto.branchIds || [dto.primaryBranchId]).map((b) => new Types.ObjectId(b));
    if (!branchObjectIds.some((b) => b.equals(primaryBranchId))) {
      branchObjectIds.push(primaryBranchId);
    }

    const staff = new this.staffModel({
      tenantId: tId,
      userId: userObjectId,
      employeeCode,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      employmentType: dto.employmentType,
      designation: dto.designation,
      department: dto.department,
      primaryBranchId,
      branchIds: branchObjectIds,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      emergencyContact: dto.emergencyContact,
      address: dto.address,
      bankDetails: dto.bankDetails,
      governmentId: dto.governmentId,
      salaryConfiguration: dto.salaryConfiguration,
      status: StaffStatus.ACTIVE,
      isActive: true,
      notes: dto.notes,
    });

    const savedStaff = await staff.save();

    // If salary configuration provided, create initial active salary record
    if (dto.salaryConfiguration) {
      const salaryRecord = new this.salaryRecordModel({
        tenantId: tId,
        staffId: savedStaff._id,
        salaryType: dto.salaryConfiguration.salaryType,
        baseSalary: dto.salaryConfiguration.baseSalary,
        hourlyRate: dto.salaryConfiguration.hourlyRate,
        overtimeRate: dto.salaryConfiguration.overtimeRate,
        allowances: dto.salaryConfiguration.allowances || [],
        deductions: dto.salaryConfiguration.deductions || [],
        effectiveFrom: dto.salaryConfiguration.effectiveFrom
          ? new Date(dto.salaryConfiguration.effectiveFrom)
          : new Date(),
        isCurrent: true,
        createdBy: actorUserId ? new Types.ObjectId(actorUserId) : undefined,
      });
      await salaryRecord.save();
    }

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'STAFF_CREATED',
        entity: 'StaffProfile',
        entityId: savedStaff._id.toString(),
        metadata: {
          employeeCode,
          primaryBranchId: primaryBranchId.toString(),
          designation: dto.designation,
        },
      });
    }

    return savedStaff;
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      branchId?: string;
      roleCode?: string;
      status?: string;
      employmentType?: string;
    },
    userBranchIds?: string[],
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: tId };

    if (userBranchIds && userBranchIds.length > 0) {
      const allowedBranchObjs = userBranchIds.map((id) => new Types.ObjectId(id));
      filter.branchIds = { $in: allowedBranchObjs };
    }

    if (query.branchId) {
      const bId = new Types.ObjectId(query.branchId);
      filter.branchIds = bId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.employmentType) {
      filter.employmentType = query.employmentType;
    }

    let staffList = await this.staffModel
      .find(filter)
      .populate('userId', 'name email phone avatar')
      .populate('primaryBranchId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Mask sensitive bank account number in general list
    staffList = staffList.map((st) => ({
      ...st,
      bankDetails: this.maskBankDetails(st.bankDetails),
    }));

    if (query.search) {
      const s = query.search.toLowerCase();
      staffList = staffList.filter(
        (st: any) =>
          st.employeeCode?.toLowerCase().includes(s) ||
          st.designation?.toLowerCase().includes(s) ||
          (st.userId as any)?.name?.toLowerCase().includes(s) ||
          (st.userId as any)?.email?.toLowerCase().includes(s),
      );
    }

    const total = await this.staffModel.countDocuments(filter).exec();

    return { items: staffList, total, page, limit };
  }

  async findById(tenantId: string | Types.ObjectId, id: string, revealSensitive = false): Promise<any> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const staff = await this.staffModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .populate('userId', 'name email phone avatar')
      .populate('primaryBranchId', 'name code')
      .populate('branchIds', 'name code')
      .lean()
      .exec();

    if (!staff) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }

    if (!revealSensitive && staff.bankDetails) {
      staff.bankDetails = this.maskBankDetails(staff.bankDetails);
    }

    return staff;
  }

  async findByUserId(tenantId: string | Types.ObjectId, userId: string): Promise<StaffProfileDocument | null> {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(userId);
    return this.staffModel.findOne({ tenantId: tId, userId: uId }).exec();
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateStaffDto,
    actorUserId?: string,
  ): Promise<StaffProfileDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const staff = await this.staffModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!staff) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }

    if (dto.primaryBranchId) {
      const pbId = new Types.ObjectId(dto.primaryBranchId);
      const branch = await this.branchModel.findOne({ _id: pbId, tenantId: tId }).exec();
      if (!branch) {
        throw new NotFoundException(`Primary branch ${dto.primaryBranchId} not found`);
      }
      staff.primaryBranchId = pbId;
    }

    if (dto.branchIds) {
      staff.branchIds = dto.branchIds.map((b) => new Types.ObjectId(b));
    }

    if (dto.employmentType) staff.employmentType = dto.employmentType;
    if (dto.designation !== undefined) staff.designation = dto.designation;
    if (dto.department !== undefined) staff.department = dto.department;
    if (dto.emergencyContact) staff.emergencyContact = dto.emergencyContact as any;
    if (dto.address) staff.address = dto.address as any;
    if (dto.bankDetails) staff.bankDetails = dto.bankDetails as any;
    if (dto.governmentId !== undefined) staff.governmentId = dto.governmentId;
    if (dto.status) staff.status = dto.status;
    if (dto.isActive !== undefined) staff.isActive = dto.isActive;
    if (dto.notes !== undefined) staff.notes = dto.notes;

    if (dto.salaryConfiguration) {
      staff.salaryConfiguration = dto.salaryConfiguration as any;

      // Versioned salary record updates
      const effectiveDate = dto.salaryConfiguration.effectiveFrom
        ? new Date(dto.salaryConfiguration.effectiveFrom)
        : new Date();

      // Close previous current salary record
      await this.salaryRecordModel.updateMany(
        { tenantId: tId, staffId: staff._id, isCurrent: true },
        { isCurrent: false, effectiveTo: effectiveDate },
      ).exec();

      // Create new active salary record
      const salaryRecord = new this.salaryRecordModel({
        tenantId: tId,
        staffId: staff._id,
        salaryType: dto.salaryConfiguration.salaryType,
        baseSalary: dto.salaryConfiguration.baseSalary,
        hourlyRate: dto.salaryConfiguration.hourlyRate,
        overtimeRate: dto.salaryConfiguration.overtimeRate,
        allowances: dto.salaryConfiguration.allowances || [],
        deductions: dto.salaryConfiguration.deductions || [],
        effectiveFrom: effectiveDate,
        isCurrent: true,
        createdBy: actorUserId ? new Types.ObjectId(actorUserId) : undefined,
      });
      await salaryRecord.save();
    }

    const updated = await staff.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'STAFF_UPDATED',
        entity: 'StaffProfile',
        entityId: id,
        metadata: { status: staff.status, designation: staff.designation },
      });
    }

    return updated;
  }

  async deactivate(tenantId: string | Types.ObjectId, id: string, actorUserId?: string): Promise<StaffProfileDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const staff = await this.staffModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!staff) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }

    staff.status = StaffStatus.INACTIVE;
    staff.isActive = false;
    const saved = await staff.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'STAFF_DEACTIVATED',
        entity: 'StaffProfile',
        entityId: id,
        metadata: { employeeCode: staff.employeeCode },
      });
    }

    return saved;
  }

  async getWorkSummary(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    const tId = new Types.ObjectId(tenantId.toString());
    const staff = await this.staffModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).populate('userId', 'name').exec();
    if (!staff) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }

    const userId = staff.userId?._id || staff.userId;

    // Attendance stats
    const attendanceRecords = await this.attendanceModel.find({ tenantId: tId, staffId: staff._id }).lean().exec();
    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let totalWorkMinutes = 0;
    let totalOvertimeMinutes = 0;

    for (const r of attendanceRecords) {
      if (r.status === AttendanceStatus.PRESENT) presentDays += 1;
      else if (r.status === AttendanceStatus.HALF_DAY) presentDays += 0.5;
      else if (r.status === AttendanceStatus.LEAVE) leaveDays += 1;
      else if (r.status === AttendanceStatus.ABSENT) absentDays += 1;

      totalWorkMinutes += r.workMinutes || 0;
      totalOvertimeMinutes += r.overtimeMinutes || 0;
    }

    // Operational Processing stats
    const jobsAssigned = await this.processingJobModel.countDocuments({ tenantId: tId, assignedUserId: userId }).exec();
    const jobsCompleted = await this.processingJobModel.countDocuments({
      tenantId: tId,
      assignedUserId: userId,
      status: ProcessingJobStatus.COMPLETED,
    }).exec();

    // QC stats
    const qcCompleted = await this.qcModel.countDocuments({ tenantId: tId, inspectorUserId: userId }).exec();
    const qcFailures = await this.qcModel.countDocuments({
      tenantId: tId,
      inspectorUserId: userId,
      result: { $in: [QCResult.FAILED, QCResult.REWORK_REQUIRED] },
    }).exec();

    return {
      staffId: staff._id.toString(),
      employeeCode: staff.employeeCode,
      name: (staff.userId as any)?.name || 'Staff Member',
      attendanceDays: attendanceRecords.length,
      presentDays,
      leaveDays,
      absentDays,
      totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
      overtimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
      processingJobsAssigned: jobsAssigned,
      processingJobsCompleted: jobsCompleted,
      qcChecksCompleted: qcCompleted,
      qcFailures,
    };
  }
}
