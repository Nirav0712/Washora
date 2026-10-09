import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProcessingStage,
  ProcessingStageDocument,
} from '../../schemas/processing-stage.schema';
import { DEFAULT_PROCESSING_STAGES } from '@washora/shared';
import { CreateProcessingStageDto, UpdateProcessingStageDto } from './dto/create-processing-stage.dto';

@Injectable()
export class ProcessingStageService {
  private readonly logger = new Logger(ProcessingStageService.name);

  constructor(
    @InjectModel(ProcessingStage.name)
    private stageModel: Model<ProcessingStageDocument>,
  ) {}

  async ensureDefaultStages(tenantId: string | Types.ObjectId): Promise<ProcessingStageDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const count = await this.stageModel.countDocuments({ tenantId: tId, isDeleted: false }).exec();

    if (count === 0) {
      const docs = DEFAULT_PROCESSING_STAGES.map((s) => ({
        tenantId: tId,
        code: s.code,
        name: s.name,
        sequence: s.sequence,
        color: s.color,
        icon: s.icon,
        isActive: true,
        isDefault: true,
      }));
      await this.stageModel.insertMany(docs);
      this.logger.log(`Initialized default processing workflow stages for tenant ${tenantId}`);
    }

    return this.stageModel
      .find({ tenantId: tId, isDeleted: false })
      .sort({ sequence: 1 })
      .exec();
  }

  async findAll(tenantId: string | Types.ObjectId, branchId?: string): Promise<ProcessingStageDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    await this.ensureDefaultStages(tId);

    const filter: any = { tenantId: tId, isDeleted: false };
    if (branchId && Types.ObjectId.isValid(branchId)) {
      filter.$or = [{ branchId: new Types.ObjectId(branchId) }, { branchId: { $exists: false } }, { branchId: null }];
    }

    return this.stageModel.find(filter).sort({ sequence: 1 }).exec();
  }

  async findByCode(tenantId: string | Types.ObjectId, code: string): Promise<ProcessingStageDocument | null> {
    const tId = new Types.ObjectId(tenantId.toString());
    await this.ensureDefaultStages(tId);
    return this.stageModel
      .findOne({ tenantId: tId, code: code.toUpperCase(), isDeleted: false })
      .exec();
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<ProcessingStageDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid stage ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const stage = await this.stageModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!stage) {
      throw new NotFoundException('Processing stage not found.');
    }
    return stage;
  }

  async create(tenantId: string | Types.ObjectId, dto: CreateProcessingStageDto): Promise<ProcessingStageDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const code = dto.code.trim().toUpperCase();

    const existing = await this.stageModel
      .findOne({
        tenantId: tId,
        code,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : null,
        isDeleted: false,
      })
      .exec();

    if (existing) {
      throw new ConflictException(`A processing stage with code '${code}' already exists.`);
    }

    const stage = new this.stageModel({
      tenantId: tId,
      branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
      code,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      sequence: dto.sequence,
      color: dto.color || '#6366f1',
      icon: dto.icon || 'Inbox',
      isActive: dto.isActive ?? true,
      isDefault: false,
    });

    return stage.save();
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateProcessingStageDto,
  ): Promise<ProcessingStageDocument> {
    const stage = await this.findById(tenantId, id);

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      if (code !== stage.code) {
        const existing = await this.stageModel
          .findOne({
            tenantId: stage.tenantId,
            code,
            _id: { $ne: stage._id },
            isDeleted: false,
          })
          .exec();
        if (existing) {
          throw new ConflictException(`A processing stage with code '${code}' already exists.`);
        }
        stage.code = code;
      }
    }

    if (dto.name !== undefined) stage.name = dto.name.trim();
    if (dto.description !== undefined) stage.description = dto.description.trim();
    if (dto.sequence !== undefined) stage.sequence = dto.sequence;
    if (dto.color !== undefined) stage.color = dto.color;
    if (dto.icon !== undefined) stage.icon = dto.icon;
    if (dto.isActive !== undefined) stage.isActive = dto.isActive;

    return stage.save();
  }

  async delete(tenantId: string | Types.ObjectId, id: string): Promise<{ success: boolean; message: string }> {
    const stage = await this.findById(tenantId, id);
    stage.isDeleted = true;
    stage.isActive = false;
    await stage.save();
    return { success: true, message: `Stage '${stage.name}' successfully removed.` };
  }
}
