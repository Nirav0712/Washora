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
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, RoleType } from '@washora/shared';
import { StaffService } from './staff.service';
import { AttendanceService } from './attendance.service';
import { ShiftService } from './shift.service';
import { LeaveService } from './leave.service';
import { PayrollService } from './payroll.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { CheckInDto, CheckOutDto, CorrectAttendanceDto } from './dto/attendance.dto';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto/shift.dto';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveRequestDto,
  RejectLeaveRequestDto,
} from './dto/leave.dto';
import {
  CreateSalaryRecordDto,
  CreatePayrollPeriodDto,
  CreateSalaryAdvanceDto,
  ApproveSalaryAdvanceDto,
  RejectSalaryAdvanceDto,
  DisbursePayrollDto,
} from './dto/payroll.dto';

@ApiTags('Staff & Workforce')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller()
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly attendanceService: AttendanceService,
    private readonly shiftService: ShiftService,
    private readonly leaveService: LeaveService,
    private readonly payrollService: PayrollService,
  ) {}

  private getTenantId(req: any): string {
    return req.tenantId || req.user?.tenantId || req.user?.membership?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  private getUserBranchIds(req: any): string[] {
    const roleCode = req.user?.role?.code || req.user?.roleCode;
    if (roleCode === RoleType.SUPER_ADMIN || roleCode === RoleType.SHOP_OWNER) {
      return [];
    }
    return req.user?.branchIds || req.user?.membership?.branchIds || [];
  }

  // ==========================================
  // STAFF PROFILES
  // ==========================================

  @Post('staff')
  @RequirePermissions(PermissionCode.STAFF_CREATE)
  @ApiOperation({ summary: 'Create a new staff profile' })
  async createStaff(@Req() req: any, @Body() dto: CreateStaffDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.staffService.create(tenantId, dto, userId);
  }

  @Get('staff')
  @RequirePermissions(PermissionCode.STAFF_VIEW)
  @ApiOperation({ summary: 'List staff profiles with pagination & filters' })
  async getStaff(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('employmentType') employmentType?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.staffService.findAll(
      tenantId,
      { page, limit, search, branchId, status, employmentType },
      userBranchIds,
    );
  }

  @Get('staff/:id')
  @RequirePermissions(PermissionCode.STAFF_VIEW)
  @ApiOperation({ summary: 'Get staff profile by ID' })
  async getStaffById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.staffService.findById(tenantId, id, false);
  }

  @Patch('staff/:id')
  @RequirePermissions(PermissionCode.STAFF_UPDATE)
  @ApiOperation({ summary: 'Update staff profile' })
  async updateStaff(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.staffService.update(tenantId, id, dto, userId);
  }

  @Delete('staff/:id')
  @RequirePermissions(PermissionCode.STAFF_DELETE)
  @ApiOperation({ summary: 'Deactivate staff profile' })
  async deactivateStaff(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.staffService.deactivate(tenantId, id, userId);
  }

  @Get('staff/:id/work-summary')
  @RequirePermissions(PermissionCode.STAFF_VIEW)
  @ApiOperation({ summary: 'Get staff operational & processing work metrics' })
  async getStaffWorkSummary(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.staffService.getWorkSummary(tenantId, id);
  }

  @Get('staff/:id/salary')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Get sensitive salary history records for staff' })
  async getStaffSalaryHistory(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.payrollService.getSalaryRecords(tenantId, id);
  }

  @Post('staff/:id/salary')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Create new versioned salary record for staff' })
  async createStaffSalaryRecord(@Req() req: any, @Param('id') id: string, @Body() dto: CreateSalaryRecordDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    dto.staffId = id;
    return this.payrollService.createSalaryRecord(tenantId, dto, userId);
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================

  @Post('attendance/check-in')
  @ApiOperation({ summary: 'Staff check in for current date' })
  async checkIn(@Req() req: any, @Body() dto: CheckInDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.attendanceService.checkIn(tenantId, userId, dto);
  }

  @Post('attendance/check-out')
  @ApiOperation({ summary: 'Staff check out for current date' })
  async checkOut(@Req() req: any, @Body() dto: CheckOutDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.attendanceService.checkOut(tenantId, userId, dto);
  }

  @Get('attendance')
  @RequirePermissions(PermissionCode.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'List attendance records with filters' })
  async getAttendance(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('staffId') staffId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.attendanceService.findAll(
      tenantId,
      { page, limit, dateFrom, dateTo, staffId, branchId, status },
      userBranchIds,
    );
  }

  @Get('attendance/:id')
  @RequirePermissions(PermissionCode.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Get attendance record by ID' })
  async getAttendanceById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.attendanceService.findById(tenantId, id);
  }

  @Patch('attendance/:id')
  @RequirePermissions(PermissionCode.ATTENDANCE_CORRECT)
  @ApiOperation({ summary: 'Manager correction of attendance record' })
  async correctAttendance(@Req() req: any, @Param('id') id: string, @Body() dto: CorrectAttendanceDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.attendanceService.correctAttendance(tenantId, id, dto, userId);
  }

  // ==========================================
  // SHIFTS
  // ==========================================

  @Post('shifts')
  @RequirePermissions(PermissionCode.SHIFT_MANAGE)
  @ApiOperation({ summary: 'Create shift definition' })
  async createShift(@Req() req: any, @Body() dto: CreateShiftDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.shiftService.createShift(tenantId, dto, userId);
  }

  @Get('shifts')
  @RequirePermissions(PermissionCode.SHIFT_VIEW)
  @ApiOperation({ summary: 'List shift definitions' })
  async getShifts(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.shiftService.getShifts(tenantId, branchId);
  }

  @Get('shifts/assignments')
  @RequirePermissions(PermissionCode.SHIFT_VIEW)
  @ApiOperation({ summary: 'List shift assignments' })
  async getShiftAssignments(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('staffId') staffId?: string,
    @Query('date') date?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.shiftService.getAssignments(tenantId, { branchId, staffId, date }, userBranchIds);
  }

  @Post('shifts/assignments')
  @RequirePermissions(PermissionCode.SHIFT_MANAGE)
  @ApiOperation({ summary: 'Assign staff to shift' })
  async assignShift(@Req() req: any, @Body() dto: AssignShiftDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.shiftService.assignShift(tenantId, dto, userId);
  }

  @Delete('shifts/assignments/:id')
  @RequirePermissions(PermissionCode.SHIFT_MANAGE)
  @ApiOperation({ summary: 'Remove shift assignment' })
  async deleteShiftAssignment(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.shiftService.deleteAssignment(tenantId, id);
  }

  @Get('shifts/:id')
  @RequirePermissions(PermissionCode.SHIFT_VIEW)
  @ApiOperation({ summary: 'Get shift definition by ID' })
  async getShiftById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.shiftService.getShiftById(tenantId, id);
  }

  @Patch('shifts/:id')
  @RequirePermissions(PermissionCode.SHIFT_MANAGE)
  @ApiOperation({ summary: 'Update shift definition' })
  async updateShift(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShiftDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.shiftService.updateShift(tenantId, id, dto, userId);
  }

  @Delete('shifts/:id')
  @RequirePermissions(PermissionCode.SHIFT_MANAGE)
  @ApiOperation({ summary: 'Delete shift definition' })
  async deleteShift(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.shiftService.deleteShift(tenantId, id, userId);
  }

  // ==========================================
  // LEAVE
  // ==========================================

  @Get('leave/types')
  @RequirePermissions(PermissionCode.LEAVE_VIEW)
  @ApiOperation({ summary: 'Get leave types' })
  async getLeaveTypes(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.leaveService.getLeaveTypes(tenantId);
  }

  @Post('leave/types')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  @ApiOperation({ summary: 'Create leave type' })
  async createLeaveType(@Req() req: any, @Body() dto: CreateLeaveTypeDto) {
    const tenantId = this.getTenantId(req);
    return this.leaveService.createLeaveType(tenantId, dto);
  }

  @Patch('leave/types/:id')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  @ApiOperation({ summary: 'Update leave type' })
  async updateLeaveType(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    const tenantId = this.getTenantId(req);
    return this.leaveService.updateLeaveType(tenantId, id, dto);
  }

  @Post('leave/requests')
  @RequirePermissions(PermissionCode.LEAVE_CREATE)
  @ApiOperation({ summary: 'Submit leave request' })
  async createLeaveRequest(@Req() req: any, @Body() dto: CreateLeaveRequestDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.leaveService.createLeaveRequest(tenantId, userId, dto);
  }

  @Get('leave/requests')
  @RequirePermissions(PermissionCode.LEAVE_VIEW)
  @ApiOperation({ summary: 'List leave requests' })
  async getLeaveRequests(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.leaveService.findAll(
      tenantId,
      { page, limit, status, staffId, branchId, startDate },
      userBranchIds,
    );
  }

  @Get('leave/requests/:id')
  @RequirePermissions(PermissionCode.LEAVE_VIEW)
  @ApiOperation({ summary: 'Get leave request by ID' })
  async getLeaveRequestById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.leaveService.findById(tenantId, id);
  }

  @Patch('leave/requests/:id/approve')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  @ApiOperation({ summary: 'Approve leave request' })
  async approveLeave(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.leaveService.approveLeave(tenantId, id, userId);
  }

  @Patch('leave/requests/:id/reject')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  @ApiOperation({ summary: 'Reject leave request' })
  async rejectLeave(@Req() req: any, @Param('id') id: string, @Body() dto: RejectLeaveRequestDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.leaveService.rejectLeave(tenantId, id, dto, userId);
  }

  @Patch('leave/requests/:id/cancel')
  @RequirePermissions(PermissionCode.LEAVE_CREATE)
  @ApiOperation({ summary: 'Cancel leave request' })
  async cancelLeave(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.leaveService.cancelLeave(tenantId, id, userId);
  }

  // ==========================================
  // PAYROLL & ADVANCES
  // ==========================================

  @Post('payroll/periods')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Create payroll period' })
  async createPayrollPeriod(@Req() req: any, @Body() dto: CreatePayrollPeriodDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.createPayrollPeriod(tenantId, dto, userId);
  }

  @Get('payroll/periods')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List payroll periods' })
  async getPayrollPeriods(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.payrollService.getPayrollPeriods(tenantId);
  }

  @Get('payroll/periods/:id')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Get payroll period by ID' })
  async getPayrollPeriodById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.payrollService.getPayrollPeriodById(tenantId, id);
  }

  @Post('payroll/periods/:id/process')
  @RequirePermissions(PermissionCode.PAYROLL_PROCESS)
  @ApiOperation({ summary: 'Process payroll calculations and generate records' })
  async processPayroll(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.processPayrollPeriod(tenantId, id, userId);
  }

  @Post('payroll/periods/:id/approve')
  @RequirePermissions(PermissionCode.PAYROLL_APPROVE)
  @ApiOperation({ summary: 'Approve payroll period' })
  async approvePayroll(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.approvePayrollPeriod(tenantId, id, userId);
  }

  @Post('payroll/periods/:id/disburse')
  @RequirePermissions(PermissionCode.PAYROLL_APPROVE)
  @ApiOperation({ summary: 'Disburse payroll period and record payout references' })
  async disbursePayroll(@Req() req: any, @Param('id') id: string, @Body() dto: DisbursePayrollDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.disbursePayrollPeriod(tenantId, id, dto, userId);
  }

  @Get('payroll/records/:recordId/payslip')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Generate formatted printable payslip for payroll record' })
  async getPayslip(@Req() req: any, @Param('recordId') recordId: string) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.payrollService.getPayslip(tenantId, recordId, userBranchIds);
  }

  @Get('payroll/periods/:id/records')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Get payroll records for a period' })
  async getPayrollRecords(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.payrollService.getPayrollRecordsForPeriod(tenantId, id, userBranchIds);
  }

  @Post('payroll/advances')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Request salary advance' })
  async createSalaryAdvance(@Req() req: any, @Body() dto: CreateSalaryAdvanceDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.createSalaryAdvance(tenantId, dto, userId);
  }

  @Get('payroll/advances')
  @RequirePermissions(PermissionCode.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List salary advances' })
  async getSalaryAdvances(
    @Req() req: any,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.payrollService.getSalaryAdvances(tenantId, { staffId, status });
  }

  @Patch('payroll/advances/:id/approve')
  @RequirePermissions(PermissionCode.PAYROLL_APPROVE)
  @ApiOperation({ summary: 'Approve salary advance' })
  async approveSalaryAdvance(@Req() req: any, @Param('id') id: string, @Body() dto: ApproveSalaryAdvanceDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.approveSalaryAdvance(tenantId, id, dto, userId);
  }

  @Patch('payroll/advances/:id/reject')
  @RequirePermissions(PermissionCode.PAYROLL_APPROVE)
  @ApiOperation({ summary: 'Reject salary advance' })
  async rejectSalaryAdvance(@Req() req: any, @Param('id') id: string, @Body() dto: RejectSalaryAdvanceDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.payrollService.rejectSalaryAdvance(tenantId, id, dto, userId);
  }
}
