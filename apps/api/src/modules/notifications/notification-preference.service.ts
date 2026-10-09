import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CustomerPreference,
  CustomerPreferenceDocument,
} from '../../schemas/customer-preference.schema';
import { AuditService } from '../audit/audit.service';
import { CustomerNotificationPreferences } from '@washora/shared';

export interface UpdatePreferencesDto {
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  transactionalEnabled?: boolean;
  marketingEnabled?: boolean;
  preferredLanguage?: string;
}

@Injectable()
export class NotificationPreferenceService {
  private readonly logger = new Logger(NotificationPreferenceService.name);

  constructor(
    @InjectModel(CustomerPreference.name)
    private prefModel: Model<CustomerPreferenceDocument>,
    private auditService: AuditService,
  ) {}

  async getPreferences(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerNotificationPreferences> {
    const tId = new Types.ObjectId(tenantId);
    const cId = new Types.ObjectId(customerId);

    let pref = await this.prefModel.findOne({
      tenantId: tId,
      customerId: cId,
    });

    if (!pref) {
      return {
        tenantId,
        customerId,
        whatsappEnabled: true,
        smsEnabled: true,
        emailEnabled: true,
        transactionalEnabled: true,
        marketingEnabled: false,
        preferredLanguage: 'en_US',
      };
    }

    return {
      id: pref._id.toString(),
      _id: pref._id.toString(),
      tenantId: pref.tenantId.toString(),
      customerId: pref.customerId.toString(),
      whatsappEnabled: pref.whatsappEnabled,
      smsEnabled: pref.smsEnabled,
      emailEnabled: pref.emailEnabled,
      transactionalEnabled: pref.transactionalEnabled,
      marketingEnabled: pref.marketingEnabled,
      preferredLanguage: pref.preferredLanguage || 'en_US',
    };
  }

  async updatePreferences(
    tenantId: string,
    customerId: string,
    dto: UpdatePreferencesDto,
    actorUserId?: string,
  ): Promise<CustomerNotificationPreferences> {
    const tId = new Types.ObjectId(tenantId);
    const cId = new Types.ObjectId(customerId);

    let pref = await this.prefModel.findOne({
      tenantId: tId,
      customerId: cId,
    });

    if (!pref) {
      pref = new this.prefModel({
        tenantId: tId,
        customerId: cId,
        whatsappEnabled: true,
        smsEnabled: true,
        emailEnabled: true,
        transactionalEnabled: true,
        marketingEnabled: false,
        preferredLanguage: 'en_US',
      });
    }

    if (dto.whatsappEnabled !== undefined) pref.whatsappEnabled = dto.whatsappEnabled;
    if (dto.smsEnabled !== undefined) pref.smsEnabled = dto.smsEnabled;
    if (dto.emailEnabled !== undefined) pref.emailEnabled = dto.emailEnabled;
    if (dto.transactionalEnabled !== undefined)
      pref.transactionalEnabled = dto.transactionalEnabled;
    if (dto.marketingEnabled !== undefined)
      pref.marketingEnabled = dto.marketingEnabled;
    if (dto.preferredLanguage !== undefined)
      pref.preferredLanguage = dto.preferredLanguage;

    const saved = await pref.save();

    await this.auditService.log({
      tenantId,
      actorUserId,
      action: 'CUSTOMER_NOTIFICATION_PREFERENCE_UPDATED',
      entity: 'CustomerPreference',
      entityId: saved._id.toString(),
      metadata: { customerId, updates: dto },
    });

    return {
      id: saved._id.toString(),
      _id: saved._id.toString(),
      tenantId: saved.tenantId.toString(),
      customerId: saved.customerId.toString(),
      whatsappEnabled: saved.whatsappEnabled,
      smsEnabled: saved.smsEnabled,
      emailEnabled: saved.emailEnabled,
      transactionalEnabled: saved.transactionalEnabled,
      marketingEnabled: saved.marketingEnabled,
      preferredLanguage: saved.preferredLanguage,
    };
  }
}
