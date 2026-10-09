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
import { LeaveStatus, DEFAULT_LEAVE_TYPES, StaffStatus, AttendanceStatus, AttendanceSource } from '@washora/shared';
import { LeaveType, LeaveTypeDocument } from '../../schemas/leave-type.schema';
import { LeaveRequest, LeaveRequestDocument } from '../../schemas/leave-request.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../schemas/attendance-record.schema';
import { AuditService } from '../audit/audit.service';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveRequestDto,
  RejectLeaveRequestDto,
} from './dto/leave.dto';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    private auditService: AuditService,
  ) {}

  async seedDefaultLeaveTypes(tenantId: string | Types.ObjectId): Promise<void> {
    const tId = new Types.ObjectId(tenantId.toString());
    const count = await this.leaveTypeModel.countDocuments({ tenantId: tId }).exec();
    if (count === 0) {
      const types = DEFAULT_LEAVE_TYPES.map((lt) => ({
        tenantId: tId,
        name: lt.name,
        code: lt.code,
        paid: lt.paid,
        annualLimit: lt.annualLimit,
        requiresApproval: lt.requiresApproval,
        isActive: true,
      }));
      await this.leaveTypeModel.insertMany(types);
    }
  }

  async getLeaveTypes(tenantId: string | Types.ObjectId): Promise<LeaveTypeDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    await this.seedDefaultLeaveTypes(tId);
    return this.leaveTypeModel.find({ tenantId: tId, isActive: true }).sort({ name: 1 }).exec();
  }

  async createLeaveType(tenantId: string | Types.ObjectId, dto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const existing = await this.leaveTypeModel.findOne({ tenantId: tId, code: dto.code.toUpperCase() }).exec();
    if (existing) {
      throw new ConflictException(`Leave type with code ${dto.code} already exists`);
    }

    const leaveType = new this.leaveTypeModel({
      tenantId: tId,
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      paid: dto.paid ?? true,
      annualLimit: dto.annualLimit ?? 12,
      requiresApproval: dto.requiresApproval ?? true,
      isActive: true,
    });

    return leaveType.save();
  }

  async updateLeaveType(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateLeaveTypeDto,
  ): Promise<LeaveTypeDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const leaveType = await this.leaveTypeModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type ${id} not found`);
    }

    if (dto.name) leaveType.name = dto.name.trim();
    if (dto.paid !== undefined) leaveType.paid = dto.paid;
    if (dto.annualLimit !== undefined) leaveType.annualLimit = dto.annualLimit;
    if (dto.requiresApproval !== undefined) leaveType.requiresApproval = dto.requiresApproval;
    if (dto.isActive !== undefined) leaveType.isActive = dto.isActive;

    return leaveType.save();
  }

  async createLeaveRequest(
    tenantId: string | Types.ObjectId,
    actorUserId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const branchId = new Types.ObjectId(dto.branchId);

    let staff: StaffProfileDocument | null;
    if (dto.staffId) {
      staff = await this.staffModel.findOne({ _id: new Types.ObjectId(dto.staffId), tenantId: tId }).exec();
    } else {
      staff = await this.staffModel.findOne({ tenantId: tId, userId: new Types.ObjectId(actorUserId) }).exec();
    }

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    if (staff.status !== StaffStatus.ACTIVE || !staff.isActive) {
      throw new ForbiddenException('Staff member is inactive');
    }

    const leaveType = await this.leaveTypeModel.findOne({
      _id: new Types.ObjectId(dto.leaveTypeId),
      tenantId: tId,
    }).exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type ${dto.leaveTypeId} not found`);
    }

    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Check for overlapping leaves
    const overlapping = await this.leaveRequestModel.findOne({
      tenantId: tId,
      staffId: staff._id,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { $lte: dto.endDate },
      endDate: { $gte: dto.startDate },
    }).exec();

    if (overlapping) {
      throw new ConflictException(
        `Staff already has a ${overlapping.status.toLowerCase()} leave request between ${overlapping.startDate} and ${overlapping.endDate}`,
      );
    }

    const leaveRequest = new this.leaveRequestModel({
      tenantId: tId,
      branchId,
      staffId: staff._id,
      leaveTypeId: leaveType._id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      reason: dto.reason.trim(),
      status: LeaveStatus.PENDING,
      requestedAt: new Date(),
    });

    const saved = await leaveRequest.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId,
      action: 'LEAVE_REQUESTED',
      entity: 'LeaveRequest',
      entityId: saved._id.toString(),
      metadata: {
        staffId: staff._id.toString(),
        employeeCode: staff.employeeCode,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays: dto.totalDays,
      },
    });

    return saved;
  }

  async approveLeave(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string,
  ): Promise<LeaveRequestDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const leave = await this.leaveRequestModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!leave) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Cannot approve leave request in ${leave.status} status`);
    }

    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = new Types.ObjectId(actorUserId);
    leave.approvedAt = new Date();

    const saved = await leave.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: leave.branchId,
      action: 'LEAVE_APPROVED',
      entity: 'LeaveRequest',
      entityId: id,
      metadata: {
        staffId: leave.staffId.toString(),
        startDate: leave.startDate,
        endDate: leave.endDate,
      },
    });

    return saved;
  }

  async rejectLeave(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: RejectLeaveRequestDto,
    actorUserId: string,
  ): Promise<LeaveRequestDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const leave = await this.leaveRequestModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!leave) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    leave.status = LeaveStatus.REJECTED;
    leave.rejectionReason = dto.rejectionReason.trim();

    const saved = await leave.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: leave.branchId,
      action: 'LEAVE_REJECTED',
      entity: 'LeaveRequest',
      entityId: id,
      metadata: {
        staffId: leave.staffId.toString(),
        rejectionReason: dto.rejectionReason,
      },
    });

    return saved;
  }

  async cancelLeave(tenantId: string | Types.ObjectId, id: string, actorUserId: string): Promise<LeaveRequestDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const leave = await this.leaveRequestModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!leave) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    leave.status = LeaveStatus.CANCELLED;
    leave.cancelledAt = new Date();

    const saved = await leave.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: leave.branchId,
      action: 'LEAVE_CANCELLED',
      entity: 'LeaveRequest',
      entityId: id,
      metadata: { staffId: leave.staffId.toString() },
    });

    return saved;
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      staffId?: string;
      branchId?: string;
      startDate?: string;
    },
    userBranchIds?: string[],
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: tId };

    if (userBranchIds && userBranchIds.length > 0) {
      filter.branchId = { $in: userBranchIds.map((id) => new Types.ObjectId(id)) };
    }

    if (query.status) filter.status = query.status;
    if (query.staffId) filter.staffId = new Types.ObjectId(query.staffId);
    if (query.branchId) filter.branchId = new Types.ObjectId(query.branchId);
    if (query.startDate) filter.startDate = { $gte: query.startDate };

    const items = await this.leaveRequestModel
      .find(filter)
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('leaveTypeId', 'name code paid')
      .populate('branchId', 'name code')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.leaveRequestModel.countDocuments(filter).exec();

    return { items, total, page, limit };
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    const tId = new Types.ObjectId(tenantId.toString());
    const leave = await this.leaveRequestModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('leaveTypeId', 'name code paid')
      .populate('branchId', 'name code')
      .populate('approvedBy', 'name email')
      .lean()
      .exec();

    if (!leave) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    return leave;
  }
}
