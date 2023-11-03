import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../users/user.module';
import { NetworkModule } from '../networks/network.module';
import { NetworkReportingController } from './networkReporting.controller';
import { NetworkReportingService } from './networkReporting.service';
import { AnnualReport, AnnualReportSchema } from './schema/annualReport.schema';
import {
  ProgressReport,
  ProgressReportSchema,
} from './schema/progressReport.schema';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../common/schema/activityLog.schema';
import { Workplan, WorkplanSchema } from '../workplans/schema/workplan.schema';
import {
  ActivityStatus,
  ActivityStatusSchema,
} from '../common/staticSchema/activityStatus.schema';
import {
  Activities,
  ActivitiesSchema,
} from '../activities/schema/activities.schema';
import {
  WorkplanActivities,
  WorkplanActivitiesSchema,
} from '../workplans/schema/workplan_activities.schema';
import { Invoice, InvoiceSchema } from './schema/invoice.schema';
import { MelpModule } from '../melp/melp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgressReport.name, schema: ProgressReportSchema },
      { name: AnnualReport.name, schema: AnnualReportSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Workplan.name, schema: WorkplanSchema },
      { name: ActivityStatus.name, schema: ActivityStatusSchema },
      { name: Activities.name, schema: ActivitiesSchema },
      { name: WorkplanActivities.name, schema: WorkplanActivitiesSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    UserModule,
    NetworkModule,
    MelpModule,
  ],
  controllers: [NetworkReportingController],
  providers: [NetworkReportingService],
  exports: [NetworkReportingService],
})
export class NetworkReportingModule {}
