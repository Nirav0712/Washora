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
import { AttendanceStatus, AttendanceSource, StaffStatus } from '@washora/shared';
import { AttendanceRecord, AttendanceRecordDocument } from '../../schemas/attendance-record.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { AuditService } from '../audit/audit.service';
import { CheckInDto, CheckOutDto, CorrectAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    private auditService: AuditService,
  ) {}

  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  async checkIn(
    tenantId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    dto: CheckInDto,
  ): Promise<AttendanceRecordDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(userId.toString());
    const branchId = new Types.ObjectId(dto.branchId);

    // Find active staff profile
    const staff = await this.staffModel.findOne({ tenantId: tId, userId: uId }).exec();
    if (!staff) {
      throw new NotFoundException('No staff profile found for this user');
    }
    if (staff.status !== StaffStatus.ACTIVE || !staff.isActive) {
      throw new ForbiddenException('Staff member is not active');
    }

    // Verify branch access
    const branch = await this.branchModel.findOne({ _id: branchId, tenantId: tId }).exec();
    if (!branch) {
      throw new NotFoundException(`Branch ${dto.branchId} not found in tenant`);
    }

    const hasBranchAccess =
      staff.primaryBranchId.equals(branchId) ||
      (staff.branchIds && staff.branchIds.some((b) => b.equals(branchId)));

    if (!hasBranchAccess) {
      throw new ForbiddenException(`Staff ${staff.employeeCode} does not have access to branch ${branch.name}`);
    }

    const today = this.getTodayDateString();

    // Check for duplicate attendance
    const existing = await this.attendanceModel.findOne({
      tenantId: tId,
      staffId: staff._id,
      date: today,
    }).exec();

    if (existing && existing.checkInAt) {
      throw new ConflictException(`Attendance already checked in for today (${today})`);
    }

    const now = new Date();
    let record: AttendanceRecordDocument;

    if (existing) {
      existing.branchId = branchId;
      existing.checkInAt = now;
      existing.status = AttendanceStatus.PRESENT;
      existing.source = dto.source || AttendanceSource.WEB;
      if (dto.notes) existing.notes = dto.notes;
      record = await existing.save();
    } else {
      record = new this.attendanceModel({
        tenantId: tId,
        branchId,
        staffId: staff._id,
        userId: uId,
        date: today,
        checkInAt: now,
        status: AttendanceStatus.PRESENT,
        workMinutes: 0,
        overtimeMinutes: 0,
        source: dto.source || AttendanceSource.WEB,
        notes: dto.notes,
      });
      await record.save();
    }

    await this.auditService.log({
      tenantId: tId,
      actorUserId: uId,
      branchId,
      action: 'ATTENDANCE_CHECK_IN',
      entity: 'AttendanceRecord',
      entityId: record._id.toString(),
      metadata: {
        staffId: staff._id.toString(),
        employeeCode: staff.employeeCode,
        branchId: branchId.toString(),
        date: today,
      },
    });

    return record;
  }

  async checkOut(
    tenantId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    dto: CheckOutDto,
  ): Promise<AttendanceRecordDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(userId.toString());

    const staff = await this.staffModel.findOne({ tenantId: tId, userId: uId }).exec();
    if (!staff) {
      throw new NotFoundException('No staff profile found for this user');
    }

    const today = this.getTodayDateString();

    const record = await this.attendanceModel.findOne({
      tenantId: tId,
      staffId: staff._id,
      date: today,
      checkInAt: { $exists: true, $ne: null },
      checkOutAt: null,
    }).exec();

    if (!record) {
      throw new BadRequestException(`No active check-in found for today (${today})`);
    }

    const now = new Date();
    record.checkOutAt = now;

    const diffMs = now.getTime() - record.checkInAt!.getTime();
    const workMinutes = Math.max(1, Math.floor(diffMs / 60000));
    record.workMinutes = workMinutes;

    // Standard 8-hour workday (480 minutes)
    const overtimeMinutes = Math.max(0, workMinutes - 480);
    record.overtimeMinutes = overtimeMinutes;

    if (dto.notes) {
      record.notes = record.notes ? `${record.notes} | ${dto.notes}` : dto.notes;
    }

    const saved = await record.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId: uId,
      branchId: record.branchId,
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'AttendanceRecord',
      entityId: saved._id.toString(),
      metadata: {
        staffId: staff._id.toString(),
        workMinutes,
        overtimeMinutes,
      },
    });

    return saved;
  }

  async correctAttendance(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: CorrectAttendanceDto,
    actorUserId: string,
  ): Promise<AttendanceRecordDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const record = await this.attendanceModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!record) {
      throw new NotFoundException(`Attendance record ${id} not found`);
    }

    if (dto.checkInAt) record.checkInAt = new Date(dto.checkInAt);
    if (dto.checkOutAt) record.checkOutAt = new Date(dto.checkOutAt);
    if (dto.status) record.status = dto.status;
    if (dto.workMinutes !== undefined) record.workMinutes = dto.workMinutes;
    if (dto.overtimeMinutes !== undefined) record.overtimeMinutes = dto.overtimeMinutes;
    if (dto.notes) record.notes = dto.notes;

    record.correctionReason = dto.correctionReason;
    record.correctedBy = new Types.ObjectId(actorUserId);
    record.correctedAt = new Date();

    const saved = await record.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: record.branchId,
      action: 'ATTENDANCE_CORRECTED',
      entity: 'AttendanceRecord',
      entityId: id,
      metadata: {
        correctionReason: dto.correctionReason,
        status: record.status,
        workMinutes: record.workMinutes,
        overtimeMinutes: record.overtimeMinutes,
      },
    });

    return saved;
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
      staffId?: string;
      branchId?: string;
      status?: string;
    },
    userBranchIds?: string[],
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 30));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: tId };

    if (userBranchIds && userBranchIds.length > 0) {
      const allowedBranchObjs = userBranchIds.map((id) => new Types.ObjectId(id));
      filter.branchId = { $in: allowedBranchObjs };
    }

    if (query.branchId) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.staffId) {
      filter.staffId = new Types.ObjectId(query.staffId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) filter.date.$gte = query.dateFrom;
      if (query.dateTo) filter.date.$lte = query.dateTo;
    }

    const items = await this.attendanceModel
      .find(filter)
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email phone avatar' },
      })
      .populate('branchId', 'name code')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.attendanceModel.countDocuments(filter).exec();

    return { items, total, page, limit };
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    const tId = new Types.ObjectId(tenantId.toString());
    const record = await this.attendanceModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('branchId', 'name code')
      .populate('correctedBy', 'name email')
      .lean()
      .exec();

    if (!record) {
      throw new NotFoundException(`Attendance record ${id} not found`);
    }

    return record;
  }
}
