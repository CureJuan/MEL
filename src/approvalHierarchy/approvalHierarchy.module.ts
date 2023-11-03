import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkplanModule } from '../workplans/workplan.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../users/user.module';
import { ApprovalHierarchyController } from './approvalHierarchy.controller';
import { ApprovalHierarchyService } from './approvalHierarchy.service';
import {
  ApprovalHierarchy,
  ApprovalHierarchySchema,
} from './schema/approvalHierarchy.schema';
import {
  ApprovalType,
  ApprovalTypeSchema,
} from './schema/approvalTypes.schema';
import { MelpModule } from '../melp/melp.module';
import {
  ApprovalRequests,
  ApprovalRequestsSchema,
} from './schema/approvalRequests.schema';
import {
  ApprovalDetails,
  ApprovalDetailsSchema,
} from './schema/approvalDetails.schema';
import {
  WorkplanActivities,
  WorkplanActivitiesSchema,
} from '../workplans/schema/workplan_activities.schema';
import {
  Activities,
  ActivitiesSchema,
} from '../activities/schema/activities.schema';
import { ActivitiesModule } from '../activities/activities.module';
import { ImpactStoryModule } from '../impactStory/impactStory.module';
import { ReportsModule } from 'src/reports/reports.module';
import { NetworkReportingModule } from 'src/networkReporting/networkReporting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalHierarchy.name, schema: ApprovalHierarchySchema },
      { name: ApprovalType.name, schema: ApprovalTypeSchema },
      { name: ApprovalRequests.name, schema: ApprovalRequestsSchema },
      { name: ApprovalDetails.name, schema: ApprovalDetailsSchema },
      { name: WorkplanActivities.name, schema: WorkplanActivitiesSchema },
      { name: Activities.name, schema: ActivitiesSchema },
    ]),
    UserModule,
    MailModule,
    WorkplanModule,
    MelpModule,
    ActivitiesModule,
    ImpactStoryModule,
    ReportsModule,
    NetworkReportingModule,
  ],
  controllers: [ApprovalHierarchyController],
  providers: [ApprovalHierarchyService],
  exports: [ApprovalHierarchyService],
})
export class ApprovalHierarchyModule {}
