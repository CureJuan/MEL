import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityLog,
  ActivityLogSchema,
} from 'src/common/schema/activityLog.schema';
import { MelpModule } from '../melp/melp.module';
import { StaticSurveyModule } from '../staticSurveys/staticSurvey.module';
import { UserModule } from '../users/user.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import {
  OutcomeReport,
  OutcomeReportSchema,
} from './schema/outcomeReport.schema';
import { OutputReport, OutputReportSchema } from './schema/outputReport.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutputReport.name, schema: OutputReportSchema },
      { name: OutcomeReport.name, schema: OutcomeReportSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
    NetworkModule,
    PartnerModule,
    ActivitiesModule,
    UserModule,
    StaticSurveyModule,
    MelpModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
