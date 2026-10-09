import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProcessingJob,
  ProcessingJobDocument,
} from '../../schemas/processing-job.schema';
import {
  ProcessingEvent,
  ProcessingEventDocument,
} from '../../schemas/processing-event.schema';
import {
  ProcessingIssue,
  ProcessingIssueDocument,
} from '../../schemas/processing-issue.schema';
import { Garment, GarmentDocument } from '../../schemas/garment.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Membership, MembershipDocument } from '../../schemas/membership.schema';
import { ProcessingStageService } from './processing-stage.service';
import { OrderProcessingSyncService } from './order-processing-sync.service';
import { AuditService } from '../audit/audit.service';
import { CreateProcessingJobDto } from './dto/create-processing-job.dto';
import { UpdateProcessingStageTransitionDto } from './dto/update-processing-stage-transition.dto';
import { AssignProcessingJobDto, UpdateProcessingPriorityDto } from './dto/assign-processing-job.dto';
import { CreateProcessingIssueDto, ResolveProcessingIssueDto } from './dto/create-processing-issue.dto';
import {
  ProcessingJobStatus,
  ProcessingPriority,
  GarmentProcessingStatus,
  ProcessingAction,
  ProcessingIssueStatus,
  PermissionCode,
  RoleType,
} from '@washora/shared';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    @InjectModel(ProcessingJob.name) private jobModel: Model<ProcessingJobDocument>,
    @InjectModel(ProcessingEvent.name) private eventModel: Model<ProcessingEventDocument>,
    @InjectModel(ProcessingIssue.name) private issueModel: Model<ProcessingIssueDocument>,
    @InjectModel(Garment.name) private garmentModel: Model<GarmentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    private stageService: ProcessingStageService,
    private syncService: OrderProcessingSyncService,
    private auditService: AuditService,
  ) {}

  async createJob(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Operator',
    dto: CreateProcessingJobDto,
  ): Promise<ProcessingJobDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    if (!Types.ObjectId.isValid(dto.garmentId) || !Types.ObjectId.isValid(dto.orderId)) {
      throw new BadRequestException('Invalid garment or order ID format.');
    }

    // 1. Verify Garment belongs to this tenant
    const garment = await this.garmentModel
      .findOne({ _id: new Types.ObjectId(dto.garmentId), tenantId: tId })
      .exec();

    if (!garment) {
      throw new NotFoundException('Garment not found in your organization.');
    }

    // 2. Verify Order belongs to this tenant
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(dto.orderId), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found in your organization.');
    }

    // 3. Prevent duplicate active job for garment
    const existingJob = await this.jobModel
      .findOne({ tenantId: tId, garmentId: garment._id, isDeleted: false })
      .exec();

    if (existingJob) {
      return existingJob;
    }

    const branchId = (dto.branchId ? new Types.ObjectId(dto.branchId) : garment.branchId || order.branchId) as Types.ObjectId;

    // Load initial stage (RECEIVED / Intake)
    const initialStage = await this.stageService.findByCode(tId, 'RECEIVED');

    const job = new this.jobModel({
      tenantId: tId,
      branchId,
      orderId: order._id,
      garmentId: garment._id,
      currentStageId: initialStage?._id,
      stageCode: 'RECEIVED',
      stageName: initialStage?.name || 'Received',
      status: ProcessingJobStatus.QUEUED,
      priority: dto.priority || ProcessingPriority.NORMAL,
      assignedUserId: dto.assignedUserId ? new Types.ObjectId(dto.assignedUserId) : undefined,
      notes: dto.notes,
      createdBy: uId,
      updatedBy: uId,
    });

    await job.save();

    // Record Event
    const event = new this.eventModel({
      tenantId: tId,
      branchId,
      processingJobId: job._id,
      orderId: order._id,
      garmentId: garment._id,
      toStage: 'RECEIVED',
      action: ProcessingAction.STAGE_STARTED,
      actorUserId: uId,
      actorName: actorUserName,
      notes: dto.notes || 'Processing job queued at intake stage',
      timestamp: new Date(),
    });
    await event.save();

    await this.auditService.log({
      tenantId: tId,
      branchId,
      actorUserId: uId,
      action: 'PROCESSING_JOB_CREATED',
      entity: 'ProcessingJob',
      entityId: job._id.toString(),
      metadata: { garmentNumber: garment.garmentNumber, orderNumber: order.orderNumber },
    });

    return job;
  }

  async findById(
    tenantId: string | Types.ObjectId,
    userBranchIds: string[] = [],
    id: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid processing job ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const job = await this.jobModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .populate('garmentId')
      .populate('orderId')
      .populate('assignedUserId', 'name email phone')
      .populate('branchId', 'name code')
      .exec();

    if (!job) {
      throw new NotFoundException('Processing job not found.');
    }

    // Branch check
    if (userBranchIds && userBranchIds.length > 0) {
      const jobBranchStr = (job.branchId as any)?._id?.toString() || job.branchId?.toString();
      if (!userBranchIds.includes(jobBranchStr)) {
        throw new ForbiddenException('You do not have access to processing jobs from this branch.');
      }
    }

    return job;
  }

  async moveToStage(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Operator',
    userRoles: string[] = [],
    userPermissions: string[] = [],
    userBranchIds: string[] = [],
    jobId: string,
    dto: UpdateProcessingStageTransitionDto,
  ): Promise<ProcessingJobDocument> {
    const job = await this.findById(tenantId, userBranchIds, jobId);
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());
    const targetCode = dto.stageCode.trim().toUpperCase();

    // 1. Check if job is in completed/cancelled state
    if (job.status === ProcessingJobStatus.COMPLETED && targetCode !== 'READY') {
      const canOverride =
        userPermissions.includes(PermissionCode.PROCESSING_OVERRIDE) ||
        userRoles.includes(RoleType.SHOP_OWNER) ||
        userRoles.includes(RoleType.SUPER_ADMIN);

      if (!canOverride && !dto.isOverride) {
        throw new BadRequestException('Completed processing jobs cannot be arbitrarily moved backward without override permission.');
      }
    }

    // 2. Validate Stage Sequence Transition
    const allStages = await this.stageService.findAll(tId, job.branchId?._id?.toString());
    const currentStageIndex = allStages.findIndex((s) => s.code === job.stageCode);
    const targetStageIndex = allStages.findIndex((s) => s.code === targetCode);

    if (targetStageIndex === -1) {
      throw new BadRequestException(`Stage code '${targetCode}' is not configured for your organization.`);
    }

    const targetStage = allStages[targetStageIndex];

    // Transition validation rule:
    // Moving forward by 1 step (e.g. 0->1, 1->2) or rework backward is valid.
    // Jumping forward more than 1 step without override is rejected.
    const isForwardJump = targetStageIndex > currentStageIndex + 1;
    if (isForwardJump && !dto.isOverride) {
      const canOverride =
        userPermissions.includes(PermissionCode.PROCESSING_OVERRIDE) ||
        userRoles.includes(RoleType.SHOP_OWNER) ||
        userRoles.includes(RoleType.SUPER_ADMIN);

      if (!canOverride) {
        throw new BadRequestException(
          `Cannot jump from '${job.stageCode}' to '${targetCode}' directly. Please move through intermediate stages or use manager override.`,
        );
      }
    }

    const fromStageCode = job.stageCode;
    job.stageCode = targetCode;
    job.stageName = targetStage.name;
    job.currentStageId = targetStage._id as Types.ObjectId;
    job.updatedBy = uId;

    if (targetCode === 'READY') {
      job.status = ProcessingJobStatus.COMPLETED;
      job.completedAt = new Date();
    } else {
      job.status = ProcessingJobStatus.IN_PROGRESS;
      if (!job.startedAt) {
        job.startedAt = new Date();
      }
    }

    await job.save();

    // Update garment processing status
    const garment = await this.garmentModel
      .findOne({ _id: job.garmentId?._id || job.garmentId, tenantId: tId })
      .exec();

    if (garment) {
      if (targetCode === 'READY') {
        garment.processingStatus = GarmentProcessingStatus.READY;
        garment.isQCApproved = true;
      } else if (targetCode === 'QUALITY_CHECK') {
        garment.processingStatus = GarmentProcessingStatus.QUALITY_CHECK;
      } else if (targetCode === 'SORTING') {
        garment.processingStatus = GarmentProcessingStatus.SORTED;
      } else {
        garment.processingStatus = GarmentProcessingStatus.PROCESSING;
      }
      await garment.save();
    }

    // Record Event
    const event = new this.eventModel({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      processingJobId: job._id,
      orderId: job.orderId?._id || job.orderId,
      garmentId: garment?._id || job.garmentId,
      fromStage: fromStageCode,
      toStage: targetCode,
      action: dto.isOverride ? ProcessingAction.STAGE_SKIPPED : ProcessingAction.STAGE_COMPLETED,
      actorUserId: uId,
      actorName: actorUserName,
      notes: dto.notes || (dto.isOverride ? `Stage transition override: ${dto.overrideReason || ''}` : `Transitioned from ${fromStageCode} to ${targetCode}`),
      timestamp: new Date(),
    });
    await event.save();

    // Trigger Order Synchronization
    const orderIdToSync = job.orderId?._id || job.orderId;
    await this.syncService.syncOrder(tId, orderIdToSync, actorUserName);

    await this.auditService.log({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      actorUserId: uId,
      action: 'PROCESSING_STAGE_CHANGED',
      entity: 'ProcessingJob',
      entityId: job._id.toString(),
      metadata: { fromStage: fromStageCode, toStage: targetCode, isOverride: dto.isOverride },
    });

    return job;
  }

  async assignJob(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Manager',
    userRoles: string[] = [],
    userPermissions: string[] = [],
    userBranchIds: string[] = [],
    jobId: string,
    dto: AssignProcessingJobDto,
  ): Promise<ProcessingJobDocument> {
    const job = await this.findById(tenantId, userBranchIds, jobId);
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    // Permission check: processing.assign or admin
    const canAssign =
      userPermissions.includes(PermissionCode.PROCESSING_ASSIGN) ||
      userRoles.includes(RoleType.SHOP_OWNER) ||
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.BRANCH_MANAGER);

    if (!canAssign) {
      throw new ForbiddenException('You do not have permission to assign processing operators.');
    }

    let assignedUserObjectId: Types.ObjectId | undefined;
    let assignedUserName = 'Unassigned';

    if (dto.assignedUserId) {
      if (!Types.ObjectId.isValid(dto.assignedUserId)) {
        throw new BadRequestException('Invalid operator user ID.');
      }
      const targetUserId = new Types.ObjectId(dto.assignedUserId);

      // Verify operator belongs to this tenant
      const membership = await this.membershipModel
        .findOne({ tenantId: tId, userId: targetUserId, status: 'ACTIVE' })
        .populate('userId', 'name email')
        .exec();

      if (!membership) {
        throw new BadRequestException('The selected user is not an active staff member of your organization.');
      }

      // Verify operator has branch access
      const jobBranchStr = (job.branchId?._id || job.branchId).toString();
      const userHasBranch =
        membership.branchIds.length === 0 || // all branches
        membership.branchIds.map((b) => b.toString()).includes(jobBranchStr);

      if (!userHasBranch) {
        throw new BadRequestException('The selected operator is not assigned to the branch handling this processing job.');
      }

      assignedUserObjectId = targetUserId;
      assignedUserName = (membership.userId as any)?.name || 'Operator';
    }

    job.assignedUserId = assignedUserObjectId;
    job.updatedBy = uId;
    await job.save();

    // Record Event
    const event = new this.eventModel({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      processingJobId: job._id,
      orderId: job.orderId?._id || job.orderId,
      garmentId: job.garmentId?._id || job.garmentId,
      action: dto.assignedUserId ? ProcessingAction.ASSIGNED : ProcessingAction.UNASSIGNED,
      actorUserId: uId,
      actorName: actorUserName,
      notes: dto.notes || `Job ${dto.assignedUserId ? `assigned to ${assignedUserName}` : 'unassigned'}`,
      timestamp: new Date(),
    });
    await event.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      actorUserId: uId,
      action: 'PROCESSING_JOB_ASSIGNED',
      entity: 'ProcessingJob',
      entityId: job._id.toString(),
      metadata: { assignedUserId: dto.assignedUserId, assignedUserName },
    });

    return job;
  }

  async updatePriority(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    userRoles: string[] = [],
    userPermissions: string[] = [],
    userBranchIds: string[] = [],
    jobId: string,
    dto: UpdateProcessingPriorityDto,
  ): Promise<ProcessingJobDocument> {
    const job = await this.findById(tenantId, userBranchIds, jobId);
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    job.priority = dto.priority;
    job.updatedBy = uId;
    await job.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      actorUserId: uId,
      action: 'PROCESSING_PRIORITY_CHANGED',
      entity: 'ProcessingJob',
      entityId: job._id.toString(),
      metadata: { priority: dto.priority, reason: dto.reason },
    });

    return job;
  }

  async createIssue(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    userBranchIds: string[] = [],
    jobId: string,
    dto: CreateProcessingIssueDto,
  ): Promise<ProcessingIssueDocument> {
    const job = await this.findById(tenantId, userBranchIds, jobId);
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const issue = new this.issueModel({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      orderId: job.orderId?._id || job.orderId,
      garmentId: job.garmentId?._id || job.garmentId,
      processingJobId: job._id,
      type: dto.type.trim(),
      severity: dto.severity,
      description: dto.description.trim(),
      reportedBy: uId,
      reportedByName: actorUserName,
      status: ProcessingIssueStatus.OPEN,
    });

    await issue.save();

    // Record Event
    const event = new this.eventModel({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      processingJobId: job._id,
      orderId: job.orderId?._id || job.orderId,
      garmentId: job.garmentId?._id || job.garmentId,
      action: ProcessingAction.ISSUE_REPORTED,
      actorUserId: uId,
      actorName: actorUserName,
      notes: `Issue [${dto.severity}]: ${dto.description}`,
      timestamp: new Date(),
    });
    await event.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: job.branchId?._id || job.branchId,
      actorUserId: uId,
      action: 'PROCESSING_ISSUE_CREATED',
      entity: 'ProcessingIssue',
      entityId: issue._id.toString(),
      metadata: { issueType: dto.type, severity: dto.severity },
    });

    return issue;
  }

  async resolveIssue(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    userRoles: string[] = [],
    userPermissions: string[] = [],
    issueId: string,
    dto: ResolveProcessingIssueDto,
  ): Promise<ProcessingIssueDocument> {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const canResolve =
      userPermissions.includes(PermissionCode.PROCESSING_ISSUE_RESOLVE) ||
      userRoles.includes(RoleType.SHOP_OWNER) ||
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.BRANCH_MANAGER) ||
      userRoles.includes(RoleType.QC_INSPECTOR);

    if (!canResolve) {
      throw new ForbiddenException('You do not have permission to resolve processing issues.');
    }

    const issue = await this.issueModel
      .findOne({ _id: new Types.ObjectId(issueId), tenantId: tId })
      .exec();

    if (!issue) {
      throw new NotFoundException('Processing issue not found.');
    }

    issue.status = ProcessingIssueStatus.RESOLVED;
    issue.resolvedBy = uId;
    issue.resolvedByName = actorUserName;
    issue.resolutionNotes = dto.resolutionNotes.trim();
    issue.resolvedAt = new Date();
    await issue.save();

    // Record Event
    const event = new this.eventModel({
      tenantId: tId,
      branchId: issue.branchId,
      processingJobId: issue.processingJobId,
      orderId: issue.orderId,
      garmentId: issue.garmentId,
      action: ProcessingAction.ISSUE_RESOLVED,
      actorUserId: uId,
      actorName: actorUserName,
      notes: `Issue resolved: ${dto.resolutionNotes}`,
      timestamp: new Date(),
    });
    await event.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: issue.branchId,
      actorUserId: uId,
      action: 'PROCESSING_ISSUE_RESOLVED',
      entity: 'ProcessingIssue',
      entityId: issue._id.toString(),
      metadata: { resolutionNotes: dto.resolutionNotes },
    });

    return issue;
  }

  async getIssuesForJob(tenantId: string | Types.ObjectId, jobId: string): Promise<ProcessingIssueDocument[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid processing job ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    return this.issueModel
      .find({ tenantId: tId, processingJobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTimelineForJob(tenantId: string | Types.ObjectId, jobId: string): Promise<ProcessingEventDocument[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid processing job ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    return this.eventModel
      .find({ tenantId: tId, processingJobId: new Types.ObjectId(jobId) })
      .sort({ timestamp: 1 })
      .exec();
  }

  async getTimelineForGarment(tenantId: string | Types.ObjectId, garmentId: string): Promise<ProcessingEventDocument[]> {
    if (!Types.ObjectId.isValid(garmentId)) {
      throw new BadRequestException('Invalid garment ID.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    return this.eventModel
      .find({ tenantId: tId, garmentId: new Types.ObjectId(garmentId) })
      .sort({ timestamp: 1 })
      .exec();
  }
}
