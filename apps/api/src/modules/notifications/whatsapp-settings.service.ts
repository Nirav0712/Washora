import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppSettings,
  WhatsAppSettingsDocument,
} from '../../schemas/whatsapp-settings.schema';
import { AuditService } from '../audit/audit.service';
import { WhatsAppSettings as IWhatsAppSettings } from '@washora/shared';

export interface UpdateWhatsAppSettingsDto {
  enabled?: boolean;
  provider?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookEnabled?: boolean;
  webhookVerifyToken?: string;
  defaultLanguage?: string;
}

@Injectable()
export class WhatsAppSettingsService {
  private readonly logger = new Logger(WhatsAppSettingsService.name);

  constructor(
    @InjectModel(WhatsAppSettings.name)
    private settingsModel: Model<WhatsAppSettingsDocument>,
    private auditService: AuditService,
  ) {}

  async getSettings(tenantId: string): Promise<IWhatsAppSettings> {
    const tId = new Types.ObjectId(tenantId);
    let settings = await this.settingsModel.findOne({ tenantId: tId });

    if (!settings) {
      return {
        tenantId,
        enabled: false,
        provider: 'META_OFFICIAL',
        webhookEnabled: false,
        defaultLanguage: 'en_US',
        isConfigured: false,
      };
    }

    // Mask sensitive tokens
    const maskedToken = settings.accessTokenReference
      ? `${settings.accessTokenReference.slice(0, 4)}••••••••${settings.accessTokenReference.slice(-4)}`
      : undefined;

    const maskedWebhook = settings.webhookVerifyTokenReference
      ? '••••••••'
      : undefined;

    return {
      id: settings._id.toString(),
      _id: settings._id.toString(),
      tenantId: settings.tenantId.toString(),
      enabled: settings.enabled,
      provider: settings.provider,
      phoneNumberId: settings.phoneNumberId,
      businessAccountId: settings.businessAccountId,
      accessTokenReference: maskedToken,
      webhookEnabled: settings.webhookEnabled,
      webhookVerifyTokenReference: maskedWebhook,
      defaultLanguage: settings.defaultLanguage || 'en_US',
      isConfigured: settings.isConfigured,
      createdAt: (settings as any).createdAt?.toISOString(),
      updatedAt: (settings as any).updatedAt?.toISOString(),
    };
  }

  async getInternalSettings(tenantId: string): Promise<WhatsAppSettingsDocument | null> {
    const tId = new Types.ObjectId(tenantId);
    return await this.settingsModel.findOne({ tenantId: tId });
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateWhatsAppSettingsDto,
    actorUserId?: string,
  ): Promise<IWhatsAppSettings> {
    const tId = new Types.ObjectId(tenantId);
    let settings = await this.settingsModel.findOne({ tenantId: tId });

    if (!settings) {
      settings = new this.settingsModel({
        tenantId: tId,
        enabled: false,
        provider: 'META_OFFICIAL',
        webhookEnabled: false,
        defaultLanguage: 'en_US',
        isConfigured: false,
      });
    }

    if (dto.enabled !== undefined) settings.enabled = dto.enabled;
    if (dto.provider !== undefined) settings.provider = dto.provider;
    if (dto.phoneNumberId !== undefined) settings.phoneNumberId = dto.phoneNumberId?.trim();
    if (dto.businessAccountId !== undefined)
      settings.businessAccountId = dto.businessAccountId?.trim();
    if (dto.accessToken && !dto.accessToken.includes('••')) {
      settings.accessTokenReference = dto.accessToken.trim();
    }
    if (dto.webhookEnabled !== undefined) settings.webhookEnabled = dto.webhookEnabled;
    if (dto.webhookVerifyToken && !dto.webhookVerifyToken.includes('••')) {
      settings.webhookVerifyTokenReference = dto.webhookVerifyToken.trim();
    }
    if (dto.defaultLanguage !== undefined) settings.defaultLanguage = dto.defaultLanguage;

    settings.isConfigured = !!(
      settings.phoneNumberId &&
      settings.accessTokenReference
    );

    const saved = await settings.save();

    await this.auditService.log({
      tenantId,
      actorUserId,
      action: 'WHATSAPP_SETTINGS_UPDATED',
      entity: 'WhatsAppSettings',
      entityId: saved._id.toString(),
      metadata: {
        enabled: saved.enabled,
        provider: saved.provider,
        isConfigured: saved.isConfigured,
      },
    });

    return await this.getSettings(tenantId);
  }
}
