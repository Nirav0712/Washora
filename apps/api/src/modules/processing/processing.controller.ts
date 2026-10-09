import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, RoleType } from '@washora/shared';
import { ProcessingService } from './processing.service';
import { ProcessingQueueService } from './processing-queue.service';
import { ProcessingStageService } from './processing-stage.service';
import { QCService } from './qc.service';
import { CreateProcessingJobDto } from './dto/create-processing-job.dto';
import { UpdateProcessingStageTransitionDto } from './dto/update-processing-stage-transition.dto';
import { AssignProcessingJobDto, UpdateProcessingPriorityDto } from './dto/assign-processing-job.dto';
import { CreateProcessingIssueDto, ResolveProcessingIssueDto } from './dto/create-processing-issue.dto';
import { SubmitQCDto } from './dto/submit-qc.dto';
import { CreateProcessingStageDto, UpdateProcessingStageDto } from './dto/create-processing-stage.dto';

@ApiTags('Processing & Plant Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard, PermissionsGuard)
@Controller('processing')
export class ProcessingController {
  constructor(
    private processingService: ProcessingService,
    private queueService: ProcessingQueueService,
    private stageService: ProcessingStageService,
    private qcService: QCService,
  ) {}

  private getUserBranchIds(req: any): string[] {
    const role = req.user?.role || req.membership?.roleType;
    if (role === RoleType.SHOP_OWNER || role === RoleType.SUPER_ADMIN) {
      return [];
    }
    return (req.user?.branchIds || req.membership?.branchIds || []).map((id: any) => id.toString());
  }

  // ==========================================
  // QUEUE & JOBS
  // ==========================================

  @Get('queue')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get aggregated processing queue and stage metrics for Kanban' })
  async getQueue(@Req() req: any, @Query() query: any) {
    const userBranchIds = this.getUserBranchIds(req);
    const queue = await this.queueService.getQueue(req.user.tenantId, userBranchIds, query);
    return {
      success: true,
      data: queue.items,
      meta: queue.meta,
      stages: queue.stages,
      metrics: queue.metrics,
    };
  }

  @Get('jobs')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'List processing jobs' })
  async listJobs(@Req() req: any, @Query() query: any) {
    const userBranchIds = this.getUserBranchIds(req);
    const queue = await this.queueService.getQueue(req.user.tenantId, userBranchIds, query);
    return { success: true, data: queue.items, meta: queue.meta };
  }

  @Post('jobs')
  @RequirePermissions(PermissionCode.PROCESSING_CREATE)
  @ApiOperation({ summary: 'Manually create or queue a processing job for a garment' })
  async createJob(@Req() req: any, @Body() dto: CreateProcessingJobDto) {
    const job = await this.processingService.createJob(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      dto,
    );
    return { success: true, data: job };
  }

  @Get('jobs/:id')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get single processing job details' })
  async getJob(@Req() req: any, @Param('id') id: string) {
    const userBranchIds = this.getUserBranchIds(req);
    const job = await this.processingService.findById(req.user.tenantId, userBranchIds, id);
    return { success: true, data: job };
  }

  @Patch('jobs/:id/stage')
  @RequirePermissions(PermissionCode.PROCESSING_MANAGE)
  @ApiOperation({ summary: 'Advance or transition processing job stage' })
  async updateStage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProcessingStageTransitionDto,
  ) {
    const userBranchIds = this.getUserBranchIds(req);
    const job = await this.processingService.moveToStage(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      req.user.roles || [],
      req.user.permissions || [],
      userBranchIds,
      id,
      dto,
    );
    return { success: true, data: job };
  }

  @Patch('jobs/:id/assign')
  @RequirePermissions(PermissionCode.PROCESSING_ASSIGN)
  @ApiOperation({ summary: 'Assign or reassign operator to processing job' })
  async assignJob(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignProcessingJobDto,
  ) {
    const userBranchIds = this.getUserBranchIds(req);
    const job = await this.processingService.assignJob(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      req.user.roles || [],
      req.user.permissions || [],
      userBranchIds,
      id,
      dto,
    );
    return { success: true, data: job };
  }

  @Patch('jobs/:id/priority')
  @RequirePermissions(PermissionCode.PROCESSING_MANAGE)
  @ApiOperation({ summary: 'Update processing job priority' })
  async updatePriority(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProcessingPriorityDto,
  ) {
    const userBranchIds = this.getUserBranchIds(req);
    const job = await this.processingService.updatePriority(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      req.user.roles || [],
      req.user.permissions || [],
      userBranchIds,
      id,
      dto,
    );
    return { success: true, data: job };
  }

  @Get('jobs/:id/timeline')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get immutable processing audit timeline for job' })
  async getJobTimeline(@Req() req: any, @Param('id') id: string) {
    const events = await this.processingService.getTimelineForJob(req.user.tenantId, id);
    return { success: true, data: events };
  }

  @Get('garments/:id/timeline')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get garment processing history timeline' })
  async getGarmentTimeline(@Req() req: any, @Param('id') id: string) {
    const events = await this.processingService.getTimelineForGarment(req.user.tenantId, id);
    return { success: true, data: events };
  }

  // ==========================================
  // QUALITY CONTROL (QC)
  // ==========================================

  @Post('jobs/:id/qc')
  @RequirePermissions(PermissionCode.PROCESSING_QC)
  @ApiOperation({ summary: 'Submit QC inspection (Pass, Fail, Rework, or Override)' })
  async submitQC(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitQCDto,
  ) {
    const userBranchIds = this.getUserBranchIds(req);
    const qc = await this.qcService.submitQC(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      req.user.roles || [],
      req.user.permissions || [],
      userBranchIds,
      id,
      dto,
    );
    return { success: true, data: qc };
  }

  @Get('jobs/:id/qc')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get QC history for job' })
  async getJobQC(@Req() req: any, @Param('id') id: string) {
    const history = await this.qcService.getQCForJob(req.user.tenantId, id);
    return { success: true, data: history };
  }

  // ==========================================
  // PROCESSING ISSUES
  // ==========================================

  @Post('jobs/:id/issues')
  @RequirePermissions(PermissionCode.PROCESSING_ISSUE_CREATE)
  @ApiOperation({ summary: 'Report a processing defect / problem' })
  async createIssue(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateProcessingIssueDto,
  ) {
    const userBranchIds = this.getUserBranchIds(req);
    const issue = await this.processingService.createIssue(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      userBranchIds,
      id,
      dto,
    );
    return { success: true, data: issue };
  }

  @Get('jobs/:id/issues')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'Get all reported issues for job' })
  async getJobIssues(@Req() req: any, @Param('id') id: string) {
    const issues = await this.processingService.getIssuesForJob(req.user.tenantId, id);
    return { success: true, data: issues };
  }

  @Patch('issues/:id')
  @RequirePermissions(PermissionCode.PROCESSING_ISSUE_RESOLVE)
  @ApiOperation({ summary: 'Resolve a reported processing issue' })
  async resolveIssue(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveProcessingIssueDto,
  ) {
    const issue = await this.processingService.resolveIssue(
      req.user.tenantId,
      req.user.userId,
      req.user.name,
      req.user.roles || [],
      req.user.permissions || [],
      id,
      dto,
    );
    return { success: true, data: issue };
  }

  // ==========================================
  // CONFIGURABLE STAGES
  // ==========================================

  @Get('stages')
  @RequirePermissions(PermissionCode.PROCESSING_VIEW)
  @ApiOperation({ summary: 'List tenant configured workflow stages' })
  async listStages(@Req() req: any, @Query('branchId') branchId?: string) {
    const stages = await this.stageService.findAll(req.user.tenantId, branchId);
    return { success: true, data: stages };
  }

  @Post('stages')
  @RequirePermissions(PermissionCode.PROCESSING_STAGE_MANAGE)
  @ApiOperation({ summary: 'Create custom processing stage' })
  async createStage(@Req() req: any, @Body() dto: CreateProcessingStageDto) {
    const stage = await this.stageService.create(req.user.tenantId, dto);
    return { success: true, data: stage };
  }

  @Patch('stages/:id')
  @RequirePermissions(PermissionCode.PROCESSING_STAGE_MANAGE)
  @ApiOperation({ summary: 'Update workflow stage' })
  async updateStageConfig(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProcessingStageDto,
  ) {
    const stage = await this.stageService.update(req.user.tenantId, id, dto);
    return { success: true, data: stage };
  }

  @Delete('stages/:id')
  @RequirePermissions(PermissionCode.PROCESSING_STAGE_MANAGE)
  @ApiOperation({ summary: 'Remove workflow stage' })
  async deleteStage(@Req() req: any, @Param('id') id: string) {
    const res = await this.stageService.delete(req.user.tenantId, id);
    return res;
  }
}
