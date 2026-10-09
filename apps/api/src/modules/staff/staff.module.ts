import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffProfile, StaffProfileSchema } from '../../schemas/staff-profile.schema';
import { AttendanceRecord, AttendanceRecordSchema } from '../../schemas/attendance-record.schema';
import { ShiftDefinition, ShiftDefinitionSchema } from '../../schemas/shift-definition.schema';
import { ShiftAssignment, ShiftAssignmentSchema } from '../../schemas/shift-assignment.schema';
import { LeaveType, LeaveTypeSchema } from '../../schemas/leave-type.schema';
import { LeaveRequest, LeaveRequestSchema } from '../../schemas/leave-request.schema';
import { SalaryRecord, SalaryRecordSchema } from '../../schemas/salary-record.schema';
import { PayrollPeriod, PayrollPeriodSchema } from '../../schemas/payroll-period.schema';
import { PayrollRecord, PayrollRecordSchema } from '../../schemas/payroll-record.schema';
import { SalaryAdvance, SalaryAdvanceSchema } from '../../schemas/salary-advance.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { ProcessingJob, ProcessingJobSchema } from '../../schemas/processing-job.schema';
import { QualityCheck, QualityCheckSchema } from '../../schemas/quality-check.schema';

import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { AttendanceService } from './attendance.service';
import { ShiftService } from './shift.service';
import { LeaveService } from './leave.service';
import { PayrollService } from './payroll.service';
import { PayrollCalculatorService } from './payroll-calculator.service';

import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffProfile.name, schema: StaffProfileSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: ShiftDefinition.name, schema: ShiftDefinitionSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: SalaryRecord.name, schema: SalaryRecordSchema },
      { name: PayrollPeriod.name, schema: PayrollPeriodSchema },
      { name: PayrollRecord.name, schema: PayrollRecordSchema },
      { name: SalaryAdvance.name, schema: SalaryAdvanceSchema },
      { name: User.name, schema: UserSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Role.name, schema: RoleSchema },
      { name: ProcessingJob.name, schema: ProcessingJobSchema },
      { name: QualityCheck.name, schema: QualityCheckSchema },
    ]),
    CounterModule,
    AuditModule,
    RolesModule,
  ],
  controllers: [StaffController],
  providers: [
    StaffService,
    AttendanceService,
    ShiftService,
    LeaveService,
    PayrollService,
    PayrollCalculatorService,
  ],
  exports: [
    StaffService,
    AttendanceService,
    ShiftService,
    LeaveService,
    PayrollService,
    PayrollCalculatorService,
  ],
})
export class StaffModule {}
