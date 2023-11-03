import { Injectable, Logger } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { ReportsService } from '../reports/reports.service';
import { MelpService } from '../melp/melp.service';
import { StaticSurveyService } from '../staticSurveys/staticSurvey.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly melpService: MelpService,

    private readonly staticSurveyService: StaticSurveyService,

    private readonly reportsService: ReportsService,

    private readonly proposalService: ActivitiesService,
  ) {}

  async getIndicatorMonitoring(year: number, networkId: any, partnerId: any) {
    Logger.debug('DashboardService.getIndicatorMonitoring');
    return this.melpService.getIndicatorMonitoringCounts(
      year,
      networkId,
      partnerId,
    );
  }

  async getProgressMarkersMonitoring(
    year: number,
    isQ2: boolean,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('DashboardService.getProgressMarkersMonitoring');
    const melpList = await this.melpService.getListOfMelpByYear(
      year,
      networkId,
      partnerId,
    );
    let lowPMCount = 0,
      mediumPMCount = 0,
      highPMCount = 0;
    for (const melp of melpList) {
      const { totalLowPMCount, totalMediumPMCount, totalHighPMCount } =
        await this.melpService.getProgressMonitoringCountsByMelpId(
          melp._id,
          isQ2,
        );
      lowPMCount += totalLowPMCount;
      mediumPMCount += totalMediumPMCount;
      highPMCount += totalHighPMCount;
    }

    return {
      lowPMCount,
      mediumPMCount,
      highPMCount,
    };
  }

  async getActivityManagement(year: number, networkId: any, partnerId: any) {
    Logger.debug('DashboardService.getActivityManagement');
    return this.proposalService.getProposalAndWorkplanImplementationStatusWiseCount(
      year,
      networkId,
      partnerId,
    );
  }

  async getProposalSummary(year: number, networkId: any, partnerId: any) {
    Logger.debug('DashboardService.getProposalSummary');
    return this.proposalService.getProposalStatusWiseCountByYear(
      year,
      networkId,
      partnerId,
    );
  }

  async getActivityReportSummary(year: number, networkId: any, partnerId: any) {
    Logger.debug('DashboardService.getActivityReportSummary');
    return this.reportsService.getOutcomeAndOutputReportStatusWiseCount(
      year,
      networkId,
      partnerId,
    );
  }

  async getSurveySummary(year: number, user: any) {
    Logger.debug('DashboardService.getSurveySummary');
    return this.staticSurveyService.getNumberOfResponsesForAllSurveys(
      year,
      user,
    );
  }

  async getParticipationInfoSummary(year: number, user: any) {
    Logger.debug('DashboardService.getParticipationInfoSummary');
    return this.reportsService.getParticipationInfo(year, user);
  }

  async getOutputInformation(year: number, user: any) {
    Logger.debug('DashboardService.getOutputInformation');
    return this.reportsService.getOutputReportSummary(year, user);
  }

  async getOutcomeInformation(year: number, user: any) {
    Logger.debug('DashboardService.getOutcomeInformation');
    return this.reportsService.getOutcomeReportSummary(year, user);
  }
}
