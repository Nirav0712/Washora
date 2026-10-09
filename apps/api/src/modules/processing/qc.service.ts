import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QualityCheck, QualityCheckDocument } from '../../schemas/quality-check.schema';
import { ProcessingJob, ProcessingJobDocument } from '../../schemas/processing-job.schema';
import { Garment, GarmentDocument } from '../../schemas/garment.schema';
import { ProcessingEvent, ProcessingEventDocument } from '../../schemas/processing-event.schema';
import { ProcessingStageService } from './processing-stage.service';
import { OrderProcessingSyncService } from './order-processing-sync.service';
import { AuditService } from '../audit/audit.service';
import { SubmitQCDto } from './dto/submit-qc.dto';
import {
  QCResult,
  ProcessingJobStatus,
  GarmentProcessingStatus,
  ProcessingAction,
  PermissionCode,
  RoleType,
} from '@washora/shared';

@Injectable()
export class QCService {
  private readonly logger = new Logger(QCService.name);

  constructor(
    @InjectModel(QualityCheck.name) private qcModel: Model<QualityCheckDocument>,
    @InjectModel(ProcessingJob.name) private jobModel: Model<ProcessingJobDocument>,
    @InjectModel(Garment.name) private garmentModel: Model<GarmentDocument>,
    @InjectModel(ProcessingEvent.name) private eventModel: Model<ProcessingEventDocument>,
    private stageService: ProcessingStageService,
    private syncService: OrderProcessingSyncService,
    private auditService: AuditService,
  ) {}

  async submitQC(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'QC Inspector',
    userRoles: string[] = [],
    userPermissions: string[] = [],
    userBranchIds: string[] = [],
    jobId: string,
    dto: SubmitQCDto,
  ): Promise<QualityCheckDocument> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid processing job ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    // 1. Permission check: processing.qc or admin
    const canDoQC =
      userPermissions.includes(PermissionCode.PROCESSING_QC) ||
      userRoles.includes(RoleType.SHOP_OWNER) ||
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.BRANCH_MANAGER);

    if (!canDoQC) {
      throw new ForbiddenException('You do not have permission to perform quality control inspections.');
    }

    // 2. Load Job
    const job = await this.jobModel
      .findOne({ _id: new Types.ObjectId(jobId), tenantId: tId, isDeleted: false })
      .exec();

    if (!job) {
      throw new NotFoundException('Processing job not found.');
    }

    // Branch check
    if (userBranchIds && userBranchIds.length > 0) {
      const jobBranchStr = job.branchId?.toString();
      if (!userBranchIds.includes(jobBranchStr)) {
        throw new ForbiddenException('You do not have access to processing jobs from this branch.');
      }
    }

    // 3. Load Garment
    const garment = await this.garmentModel
      .findOne({ _id: job.garmentId, tenantId: tId })
      .exec();

    if (!garment) {
      throw new NotFoundException('Garment not found for this processing job.');
    }

    // 4. Handle QC Override
    if (dto.isOverride) {
      const canOverride =
        userPermissions.includes(PermissionCode.PROCESSING_OVERRIDE) ||
        userRoles.includes(RoleType.SHOP_OWNER) ||
        userRoles.includes(RoleType.SUPER_ADMIN);

      if (!canOverride) {
        throw new ForbiddenException('You do not have permission to override quality control decisions.');
      }

      await this.auditService.log({
        tenantId: tId,
        branchId: job.branchId,
        actorUserId: uId,
        action: 'QC_OVERRIDE',
        entity: 'QualityCheck',
        entityId: job._id.toString(),
        metadata: {
          jobId: job._id.toString(),
          garmentId: garment._id.toString(),
          overrideReason: dto.overrideReason || dto.notes,
          result: dto.result,
        },
      });
    }

    // 5. Create QC Record
    const qc = new this.qcModel({
      tenantId: tId,
      branchId: job.branchId,
      processingJobId: job._id,
      garmentId: garment._id,
      orderId: job.orderId,
      inspectorUserId: uId,
      inspectorName: actorUserName,
      result: dto.result,
      issues: dto.issues || [],
      notes: dto.notes,
      isOverride: dto.isOverride ?? false,
      overrideReason: dto.overrideReason,
      checkedAt: new Date(),
    });
    await qc.save();

    // 6. Workflow resolution based on result
    if (dto.result === QCResult.PASSED) {
      // Find READY stage
      const readyStage = await this.stageService.findByCode(tId, 'READY');

      job.stageCode = 'READY';
      job.stageName = readyStage?.name || 'Ready on Shelf';
      job.currentStageId = readyStage?._id as Types.ObjectId;
      job.status = ProcessingJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.updatedBy = uId;
      await job.save();

      garment.processingStatus = GarmentProcessingStatus.READY;
      garment.isQCApproved = true;
      await garment.save();

      // Record Event
      const event = new this.eventModel({
        tenantId: tId,
        branchId: job.branchId,
        processingJobId: job._id,
        orderId: job.orderId,
        garmentId: garment._id,
        fromStage: 'QUALITY_CHECK',
        toStage: 'READY',
        action: dto.isOverride ? ProcessingAction.QC_OVERRIDE : ProcessingAction.QC_PASSED,
        actorUserId: uId,
        actorName: actorUserName,
        notes: dto.notes || 'QC inspection passed successfully.',
        timestamp: new Date(),
      });
      await event.save();

      // Sync Order Status
      await this.syncService.syncOrder(tId, job.orderId, actorUserName);

      await this.auditService.log({
        tenantId: tId,
        branchId: job.branchId,
        actorUserId: uId,
        action: 'QC_PASSED',
        entity: 'Garment',
        entityId: garment._id.toString(),
        metadata: { garmentNumber: garment.garmentNumber, orderId: job.orderId.toString() },
      });
    } else {
      // FAILED or REWORK_REQUIRED
      const reworkCode = (dto.reworkStageCode || 'WASHING').toUpperCase();
      const reworkStage = await this.stageService.findByCode(tId, reworkCode);

      job.stageCode = reworkCode;
      job.stageName = reworkStage?.name || reworkCode;
      job.currentStageId = reworkStage?._id as Types.ObjectId;
      job.status = ProcessingJobStatus.IN_PROGRESS;
      job.updatedBy = uId;
      await job.save();

      garment.processingStatus = GarmentProcessingStatus.PROCESSING;
      garment.isQCApproved = false;
      await garment.save();

      // Record Event
      const action =
        dto.result === QCResult.REWORK_REQUIRED
          ? ProcessingAction.QC_REWORK_REQUIRED
          : ProcessingAction.QC_FAILED;

      const event = new this.eventModel({
        tenantId: tId,
        branchId: job.branchId,
        processingJobId: job._id,
        orderId: job.orderId,
        garmentId: garment._id,
        fromStage: 'QUALITY_CHECK',
        toStage: reworkCode,
        action,
        actorUserId: uId,
        actorName: actorUserName,
        notes: dto.notes || `QC ${dto.result}: Sent for rework at ${reworkCode}`,
        timestamp: new Date(),
      });
      await event.save();

      await this.auditService.log({
        tenantId: tId,
        branchId: job.branchId,
        actorUserId: uId,
        action: action === ProcessingAction.QC_REWORK_REQUIRED ? 'QC_REWORK_REQUIRED' : 'QC_FAILED',
        entity: 'Garment',
        entityId: garment._id.toString(),
        metadata: {
          garmentNumber: garment.garmentNumber,
          issues: dto.issues,
          reworkStage: reworkCode,
        },
      });
    }

    return qc;
  }

  async getQCForJob(tenantId: string | Types.ObjectId, jobId: string): Promise<QualityCheckDocument[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid processing job ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    return this.qcModel
      .find({ tenantId: tId, processingJobId: new Types.ObjectId(jobId) })
      .sort({ checkedAt: -1 })
      .exec();
  }

  async getQCForGarment(tenantId: string | Types.ObjectId, garmentId: string): Promise<QualityCheckDocument[]> {
    if (!Types.ObjectId.isValid(garmentId)) {
      throw new BadRequestException('Invalid garment ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    return this.qcModel
      .find({ tenantId: tId, garmentId: new Types.ObjectId(garmentId) })
      .sort({ checkedAt: -1 })
      .exec();
  }
}
