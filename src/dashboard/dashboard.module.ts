import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { MelpModule } from '../melp/melp.module';
import { ReportsModule } from '../reports/reports.module';
import { StaticSurveyModule } from '../staticSurveys/staticSurvey.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [StaticSurveyModule, MelpModule, ActivitiesModule, ReportsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [],
})
export class DashboardModule {}
