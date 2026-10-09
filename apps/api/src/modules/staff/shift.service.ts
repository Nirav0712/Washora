import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftDefinition, ShiftDefinitionDocument } from '../../schemas/shift-definition.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from '../../schemas/shift-assignment.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { AuditService } from '../audit/audit.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    @InjectModel(ShiftDefinition.name)
    private shiftModel: Model<ShiftDefinitionDocument>,
    @InjectModel(ShiftAssignment.name)
    private assignmentModel: Model<ShiftAssignmentDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    private auditService: AuditService,
  ) {}

  async createShift(
    tenantId: string | Types.ObjectId,
    dto: CreateShiftDto,
    actorUserId?: string,
  ): Promise<ShiftDefinitionDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    let branchId: Types.ObjectId | undefined;
    if (dto.branchId) {
      branchId = new Types.ObjectId(dto.branchId);
      const branch = await this.branchModel.findOne({ _id: branchId, tenantId: tId }).exec();
      if (!branch) {
        throw new NotFoundException(`Branch ${dto.branchId} not found`);
      }
    }

    const shift = new this.shiftModel({
      tenantId: tId,
      branchId,
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakMinutes: dto.breakMinutes ?? 0,
      graceMinutes: dto.graceMinutes ?? 15,
      workingMinutes: dto.workingMinutes ?? 480,
      isOvernight: dto.isOvernight ?? false,
      isActive: true,
    });

    const saved = await shift.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId,
        action: 'SHIFT_CREATED',
        entity: 'ShiftDefinition',
        entityId: saved._id.toString(),
        metadata: { name: saved.name, code: saved.code },
      });
    }

    return saved;
  }

  async updateShift(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateShiftDto,
    actorUserId?: string,
  ): Promise<ShiftDefinitionDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const shift = await this.shiftModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }

    if (dto.name) shift.name = dto.name.trim();
    if (dto.startTime) shift.startTime = dto.startTime;
    if (dto.endTime) shift.endTime = dto.endTime;
    if (dto.breakMinutes !== undefined) shift.breakMinutes = dto.breakMinutes;
    if (dto.graceMinutes !== undefined) shift.graceMinutes = dto.graceMinutes;
    if (dto.workingMinutes !== undefined) shift.workingMinutes = dto.workingMinutes;
    if (dto.isOvernight !== undefined) shift.isOvernight = dto.isOvernight;
    if (dto.isActive !== undefined) shift.isActive = dto.isActive;

    const saved = await shift.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'SHIFT_UPDATED',
        entity: 'ShiftDefinition',
        entityId: id,
        metadata: { name: saved.name, code: saved.code },
      });
    }

    return saved;
  }

  async getShifts(tenantId: string | Types.ObjectId, branchId?: string): Promise<ShiftDefinitionDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: any = { tenantId: tId, isActive: true };
    if (branchId) {
      filter.$or = [
        { branchId: new Types.ObjectId(branchId) },
        { branchId: { $exists: false } },
        { branchId: null },
      ];
    }
    return this.shiftModel.find(filter).sort({ name: 1 }).exec();
  }

  async getShiftById(tenantId: string | Types.ObjectId, id: string): Promise<ShiftDefinitionDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const shift = await this.shiftModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }
    return shift;
  }

  async deleteShift(tenantId: string | Types.ObjectId, id: string, actorUserId?: string): Promise<ShiftDefinitionDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const shift = await this.shiftModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }
    shift.isActive = false;
    const saved = await shift.save();
    return saved;
  }

  async assignShift(
    tenantId: string | Types.ObjectId,
    dto: AssignShiftDto,
    actorUserId?: string,
  ): Promise<ShiftAssignmentDocument> {
    if (!dto.staffId || !Types.ObjectId.isValid(dto.staffId.toString())) {
      throw new NotFoundException(`Staff ${dto.staffId} not found in tenant`);
    }
    if (!dto.shiftId || !Types.ObjectId.isValid(dto.shiftId.toString())) {
      throw new NotFoundException(`Shift ${dto.shiftId} not found in tenant`);
    }
    if (!dto.branchId || !Types.ObjectId.isValid(dto.branchId.toString())) {
      throw new NotFoundException(`Branch ${dto.branchId} not found in tenant`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const staffId = new Types.ObjectId(dto.staffId);
    const shiftId = new Types.ObjectId(dto.shiftId);
    const branchId = new Types.ObjectId(dto.branchId);

    // Verify staff exists in tenant and has branch access
    const staff = await this.staffModel.findOne({ _id: staffId, tenantId: tId }).exec();
    if (!staff) {
      throw new NotFoundException(`Staff ${dto.staffId} not found in tenant`);
    }

    const branch = await this.branchModel.findOne({ _id: branchId, tenantId: tId }).exec();
    if (!branch) {
      throw new NotFoundException(`Branch ${dto.branchId} not found in tenant`);
    }

    const shift = await this.shiftModel.findOne({ _id: shiftId, tenantId: tId }).exec();
    if (!shift) {
      throw new NotFoundException(`Shift ${dto.shiftId} not found in tenant`);
    }

    const assignment = new this.assignmentModel({
      tenantId: tId,
      branchId,
      staffId,
      shiftId,
      date: dto.date,
      isRecurring: dto.isRecurring ?? false,
      dayOfWeek: dto.dayOfWeek,
    });

    const saved = await assignment.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId,
        action: 'SHIFT_ASSIGNED',
        entity: 'ShiftAssignment',
        entityId: saved._id.toString(),
        metadata: {
          staffId: staffId.toString(),
          shiftId: shiftId.toString(),
          date: dto.date,
        },
      });
    }

    return saved;
  }

  async getAssignments(
    tenantId: string | Types.ObjectId,
    query: { branchId?: string; staffId?: string; date?: string },
    userBranchIds?: string[],
  ): Promise<any[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: any = { tenantId: tId };

    if (userBranchIds && userBranchIds.length > 0) {
      filter.branchId = { $in: userBranchIds.map((id) => new Types.ObjectId(id)) };
    }

    if (query.branchId) filter.branchId = new Types.ObjectId(query.branchId);
    if (query.staffId) filter.staffId = new Types.ObjectId(query.staffId);
    if (query.date) filter.date = query.date;

    return this.assignmentModel
      .find(filter)
      .populate({
        path: 'staffId',
        select: 'employeeCode designation',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('shiftId')
      .populate('branchId', 'name code')
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async deleteAssignment(tenantId: string | Types.ObjectId, id: string): Promise<{ success: boolean }> {
    const tId = new Types.ObjectId(tenantId.toString());
    const res = await this.assignmentModel.deleteOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`Shift assignment ${id} not found`);
    }
    return { success: true };
  }
}
