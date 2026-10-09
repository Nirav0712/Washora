import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProcessingJob,
  ProcessingJobDocument,
} from '../../schemas/processing-job.schema';
import { ProcessingStageService } from './processing-stage.service';
import { ProcessingJobStatus, ProcessingPriority } from '@washora/shared';

export interface ProcessingQueueQuery {
  branchId?: string;
  stageCode?: string;
  status?: string;
  priority?: string;
  assignedUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProcessingQueueService {
  private readonly logger = new Logger(ProcessingQueueService.name);

  constructor(
    @InjectModel(ProcessingJob.name)
    private jobModel: Model<ProcessingJobDocument>,
    private stageService: ProcessingStageService,
  ) {}

  async getQueue(
    tenantId: string | Types.ObjectId,
    userBranchIds: string[] = [],
    query: ProcessingQueueQuery = {},
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: tId, isDeleted: false };

    // Branch Isolation
    if (userBranchIds && userBranchIds.length > 0) {
      const allowedObjectIds = userBranchIds.map((id) => new Types.ObjectId(id));
      if (query.branchId && userBranchIds.includes(query.branchId)) {
        filter.branchId = new Types.ObjectId(query.branchId);
      } else {
        filter.branchId = { $in: allowedObjectIds };
      }
    } else if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.stageCode) {
      filter.stageCode = query.stageCode.toUpperCase();
    }

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    if (query.priority) {
      filter.priority = query.priority.toUpperCase();
    }

    if (query.assignedUserId) {
      if (query.assignedUserId === 'unassigned') {
        filter.assignedUserId = { $exists: false };
      } else if (Types.ObjectId.isValid(query.assignedUserId)) {
        filter.assignedUserId = new Types.ObjectId(query.assignedUserId);
      }
    }

    const [rawJobs, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .populate('garmentId')
        .populate('orderId', 'orderNumber customerSnapshot status pricingTier expectedReadyAt')
        .populate('assignedUserId', 'name email phone')
        .populate('branchId', 'name code')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.jobModel.countDocuments(filter).exec(),
    ]);

    // Format output
    const items = rawJobs.map((j: any) => ({
      id: j._id.toString(),
      jobId: j._id.toString(),
      tenantId: j.tenantId.toString(),
      branchId: j.branchId?._id?.toString() || j.branchId?.toString(),
      branchName: j.branchId?.name || 'Main Branch',
      orderId: j.orderId?._id?.toString() || j.orderId?.toString(),
      orderNumber: j.orderId?.orderNumber || 'WS-UNKNOWN',
      garmentId: j.garmentId?._id?.toString() || j.garmentId?.toString(),
      garmentNumber: j.garmentId?.garmentNumber || 'WS-G-000000',
      barcode: j.garmentId?.barcode || j.garmentId?.garmentNumber,
      productName: j.garmentId?.productName || 'Garment Item',
      serviceName: j.garmentId?.serviceName || 'Standard Care',
      garmentColor: j.garmentId?.color,
      garmentBrand: j.garmentId?.brand,
      condition: j.garmentId?.condition,
      stainsNoted: j.garmentId?.stainsNoted || [],
      damagesNoted: j.garmentId?.damagesNoted || [],
      specialInstructions: j.garmentId?.specialInstructions,
      customerName: j.orderId?.customerSnapshot?.name || 'Customer',
      customerPhone: j.orderId?.customerSnapshot?.phone,
      stageCode: j.stageCode,
      stageName: j.stageName,
      status: j.status,
      priority: j.priority,
      assignedUser: j.assignedUserId
        ? {
            id: j.assignedUserId._id?.toString(),
            name: j.assignedUserId.name,
            email: j.assignedUserId.email,
          }
        : null,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      expectedCompletionAt: j.expectedCompletionAt || j.orderId?.expectedReadyAt,
      notes: j.notes,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }));

    // Compute Stage distribution metrics for the current filtered branch
    const stages = await this.stageService.findAll(tId, query.branchId);
    const stageCounts: Record<string, number> = {};
    for (const s of stages) {
      stageCounts[s.code] = 0;
    }

    const countsAggregation = await this.jobModel.aggregate([
      { $match: { tenantId: tId, isDeleted: false, ...(filter.branchId ? { branchId: filter.branchId } : {}) } },
      { $group: { _id: '$stageCode', count: { $sum: 1 } } },
    ]);

    countsAggregation.forEach((c) => {
      stageCounts[c._id] = c.count;
    });

    const urgentCount = await this.jobModel.countDocuments({
      ...filter,
      priority: { $in: [ProcessingPriority.HIGH, ProcessingPriority.URGENT] },
      status: { $in: [ProcessingJobStatus.QUEUED, ProcessingJobStatus.IN_PROGRESS] },
    });

    const unassignedCount = await this.jobModel.countDocuments({
      ...filter,
      assignedUserId: { $exists: false },
      status: { $in: [ProcessingJobStatus.QUEUED, ProcessingJobStatus.IN_PROGRESS] },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stages: stages.map((s) => ({
        id: s._id.toString(),
        code: s.code,
        name: s.name,
        sequence: s.sequence,
        color: s.color,
        icon: s.icon,
        count: stageCounts[s.code] || 0,
      })),
      metrics: {
        totalActiveJobs: total,
        urgentJobsCount: urgentCount,
        unassignedJobsCount: unassignedCount,
      },
    };
  }
}
