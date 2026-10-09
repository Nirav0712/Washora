import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PickupRequest, PickupRequestDocument } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestDocument } from '../../schemas/delivery-request.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import {
  PickupStatus,
  DeliveryStatus,
  LogisticsDashboard,
  DeliveryAgentSummary,
} from '@washora/shared';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    @InjectModel(PickupRequest.name)
    private pickupModel: Model<PickupRequestDocument>,
    @InjectModel(DeliveryRequest.name)
    private deliveryModel: Model<DeliveryRequestDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
  ) {}

  // ==========================================
  // OPERATIONAL LOGISTICS DASHBOARD
  // ==========================================

  async getDashboard(tenantId: string, branchId?: string): Promise<LogisticsDashboard> {
    const tId = new Types.ObjectId(tenantId);
    const todayStr = new Date().toISOString().split('T')[0];

    const pickupFilter: Record<string, any> = { tenantId: tId, scheduledDate: { $regex: `^${todayStr}` } };
    const deliveryFilter: Record<string, any> = { tenantId: tId, scheduledDate: { $regex: `^${todayStr}` } };

    if (branchId && Types.ObjectId.isValid(branchId)) {
      const bId = new Types.ObjectId(branchId);
      pickupFilter.branchId = bId;
      deliveryFilter.branchId = bId;
    }

    const [
      todayPickups,
      todayDeliveries,
      recentPickups,
      recentDeliveries,
      agents,
    ] = await Promise.all([
      this.pickupModel.find(pickupFilter).exec(),
      this.deliveryModel.find(deliveryFilter).exec(),
      this.pickupModel
        .find({ tenantId: tId })
        .populate('branchId', 'name code')
        .populate('customerId', 'name phone')
        .populate('assignedAgentId', 'fullName phone')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .limit(10)
        .exec(),
      this.deliveryModel
        .find({ tenantId: tId })
        .populate('branchId', 'name code')
        .populate('customerId', 'name phone')
        .populate('orderId', 'orderNumber grandTotal dueAmount')
        .populate('assignedAgentId', 'fullName phone')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .limit(10)
        .exec(),
      this.getAgentWorkload(tenantId, branchId),
    ]);

    let pendingAssignmentCount = 0;
    let outForPickupCount = 0;
    let outForDeliveryCount = 0;
    let completedTodayCount = 0;
    let failedTodayCount = 0;
    let totalCashCollectedToday = 0;

    for (const p of todayPickups) {
      if (!p.assignedAgentId || p.status === PickupStatus.REQUESTED || p.status === PickupStatus.SCHEDULED) {
        if (!p.assignedAgentId) pendingAssignmentCount++;
      }
      if (p.status === PickupStatus.OUT_FOR_PICKUP || p.status === PickupStatus.ARRIVED) {
        outForPickupCount++;
      }
      if (p.status === PickupStatus.PICKED_UP) {
        completedTodayCount++;
      }
      if (p.status === PickupStatus.FAILED) {
        failedTodayCount++;
      }
    }

    for (const d of todayDeliveries) {
      if (!d.assignedAgentId || d.status === DeliveryStatus.REQUESTED || d.status === DeliveryStatus.SCHEDULED) {
        if (!d.assignedAgentId) pendingAssignmentCount++;
      }
      if (d.status === DeliveryStatus.OUT_FOR_DELIVERY || d.status === DeliveryStatus.ARRIVED) {
        outForDeliveryCount++;
      }
      if (d.status === DeliveryStatus.DELIVERED) {
        completedTodayCount++;
      }
      if (d.status === DeliveryStatus.FAILED) {
        failedTodayCount++;
      }
      if (d.collectionAmount) {
        totalCashCollectedToday += d.collectionAmount;
      }
    }

    return {
      todayPickupsCount: todayPickups.length,
      todayDeliveriesCount: todayDeliveries.length,
      pendingAssignmentCount,
      outForPickupCount,
      outForDeliveryCount,
      completedTodayCount,
      failedTodayCount,
      totalCashCollectedToday,
      agents,
      recentPickups: recentPickups as any,
      recentDeliveries: recentDeliveries as any,
    };
  }

  // ==========================================
  // AGENT WORKLOAD
  // ==========================================

  async getAgentWorkload(tenantId: string, branchId?: string): Promise<DeliveryAgentSummary[]> {
    const tId = new Types.ObjectId(tenantId);
    const todayStr = new Date().toISOString().split('T')[0];

    const staffFilter: Record<string, any> = {
      tenantId: tId,
      isActive: true,
    };

    if (branchId && Types.ObjectId.isValid(branchId)) {
      staffFilter.branchIds = new Types.ObjectId(branchId);
    }

    const staffMembers = await this.staffModel
      .find(staffFilter)
      .populate('userId', 'name phone email')
      .populate('primaryBranchId', 'name code')
      .exec();

    const [todayPickups, todayDeliveries] = await Promise.all([
      this.pickupModel.find({ tenantId: tId, scheduledDate: { $regex: `^${todayStr}` } }).exec(),
      this.deliveryModel.find({ tenantId: tId, scheduledDate: { $regex: `^${todayStr}` } }).exec(),
    ]);

    return staffMembers.map((staff) => {
      const staffIdStr = staff._id.toString();
      const userObj = staff.userId as any;
      const branchObj = staff.primaryBranchId as any;

      const myPickups = todayPickups.filter((p) => p.assignedAgentId?.toString() === staffIdStr);
      const myDeliveries = todayDeliveries.filter((d) => d.assignedAgentId?.toString() === staffIdStr);

      const completedPickups = myPickups.filter((p) => p.status === PickupStatus.PICKED_UP).length;
      const completedDeliveries = myDeliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;

      const failedPickups = myPickups.filter((p) => p.status === PickupStatus.FAILED).length;
      const failedDeliveries = myDeliveries.filter((d) => d.status === DeliveryStatus.FAILED).length;

      const pendingPickups = myPickups.filter(
        (p) => p.status !== PickupStatus.PICKED_UP && p.status !== PickupStatus.CANCELLED,
      ).length;
      const pendingDeliveries = myDeliveries.filter(
        (d) => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED,
      ).length;

      let cashCollected = 0;
      for (const d of myDeliveries) {
        if (d.collectionAmount) cashCollected += d.collectionAmount;
      }

      return {
        agentId: staff._id.toString(),
        userId: userObj?._id?.toString() || userObj?.id || staff.userId?.toString() || '',
        name: userObj?.name || staff.employeeCode,
        phone: userObj?.phone,
        employeeCode: staff.employeeCode,
        branchId: branchObj?._id?.toString() || staff.primaryBranchId?.toString(),
        branchName: branchObj?.name,
        isActive: staff.status === ('ACTIVE' as any) || staff.isActive,
        todayAssignedPickups: myPickups.length,
        todayCompletedPickups: completedPickups,
        todayAssignedDeliveries: myDeliveries.length,
        todayCompletedDeliveries: completedDeliveries,
        todayPendingJobs: pendingPickups + pendingDeliveries,
        todayFailedJobs: failedPickups + failedDeliveries,
        todayCashCollected: cashCollected,
      };
    });
  }

  // ==========================================
  // MY JOBS (FOR MOBILE DELIVERY AGENT DASHBOARD)
  // ==========================================

  async getMyJobs(tenantId: string, userId: string, date?: string): Promise<{
    agent: any;
    pickups: PickupRequestDocument[];
    deliveries: DeliveryRequestDocument[];
    summary: {
      totalJobs: number;
      completedJobs: number;
      pendingJobs: number;
      cashCollected: number;
    };
  }> {
    const tId = new Types.ObjectId(tenantId);
    const uId = new Types.ObjectId(userId);
    const targetDate = date || new Date().toISOString().split('T')[0];

    const staff = await this.staffModel
      .findOne({ tenantId: tId, userId: uId })
      .populate('userId', 'name phone email')
      .exec();

    let staffId: Types.ObjectId | undefined = staff?._id;

    const pickupFilter: Record<string, any> = {
      tenantId: tId,
      scheduledDate: { $regex: `^${targetDate}` },
    };
    const deliveryFilter: Record<string, any> = {
      tenantId: tId,
      scheduledDate: { $regex: `^${targetDate}` },
    };

    if (staffId) {
      pickupFilter.assignedAgentId = staffId;
      deliveryFilter.assignedAgentId = staffId;
    }

    const [pickups, deliveries] = await Promise.all([
      this.pickupModel
        .find(pickupFilter)
        .populate('branchId', 'name code address phone')
        .populate('customerId', 'name phone email addresses')
        .populate('orderId', 'orderNumber grandTotal status')
        .sort({ scheduledTimeFrom: 1, createdAt: 1 })
        .exec(),
      this.deliveryModel
        .find(deliveryFilter)
        .populate('branchId', 'name code address phone')
        .populate('customerId', 'name phone email addresses')
        .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status paymentStatus')
        .sort({ scheduledTimeFrom: 1, createdAt: 1 })
        .exec(),
    ]);

    let completedJobs = 0;
    let cashCollected = 0;

    for (const p of pickups) {
      if (p.status === PickupStatus.PICKED_UP) completedJobs++;
    }

    for (const d of deliveries) {
      if (d.status === DeliveryStatus.DELIVERED) completedJobs++;
      if (d.collectionAmount) cashCollected += d.collectionAmount;
    }

    const totalJobs = pickups.length + deliveries.length;
    const pendingJobs = totalJobs - completedJobs;

    const userObj = staff?.userId as any;

    return {
      agent: staff ? { id: staff._id, name: userObj?.name || staff.employeeCode, employeeCode: staff.employeeCode, phone: userObj?.phone } : null,
      pickups,
      deliveries,
      summary: {
        totalJobs,
        completedJobs,
        pendingJobs,
        cashCollected,
      },
    };
  }
}
