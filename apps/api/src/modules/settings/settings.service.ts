import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantSettings, TenantSettingsDocument } from '../../schemas/tenant-settings.schema';
import { UpdateTenantSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(TenantSettings.name)
    private settingsModel: Model<TenantSettingsDocument>,
  ) {}

  async getOrCreate(tenantId: string | Types.ObjectId): Promise<TenantSettingsDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    let settings = await this.settingsModel.findOne({ tenantId: tId }).exec();

    if (!settings) {
      settings = new this.settingsModel({
        tenantId: tId,
        invoicePrefix: 'WSH-',
        invoiceNumberStart: 1000,
        defaultTaxRate: 5.0,
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        orderStatuses: [
          'RECEIVED',
          'TAGGED',
          'PROCESSING',
          'READY',
          'DELIVERED',
          'COMPLETED',
        ],
      });
      await settings.save();
    }

    return settings;
  }

  async update(
    tenantId: string | Types.ObjectId,
    dto: UpdateTenantSettingsDto,
  ): Promise<TenantSettingsDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const settings = await this.getOrCreate(tId);

    Object.assign(settings, dto);
    return await settings.save();
  }
}
