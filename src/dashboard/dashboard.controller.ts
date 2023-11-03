import {
  Controller,
  Get,
  Logger,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiTags('Dashboard Controller')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'networkId' })
  @ApiQuery({ name: 'partnerId' })
  @Get('getIndicatorMonitoring')
  async getIndicatorMonitoring(
    @Query('year', ParseIntPipe) year: number,
    @Query('networkId') networkId,
    @Query('partnerId') partnerId,
  ) {
    Logger.debug('DashboardController.getIndicatorMonitoring');
    return this.dashboardService.getIndicatorMonitoring(
      year,
      networkId,
      partnerId,
    );
  }

  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'networkId' })
  @ApiQuery({ name: 'partnerId' })
  @ApiQuery({ name: 'isQ2' })
  @Get('getProgressMarkersMonitoring')
  async getProgressMarkersMonitoring(
    @Query('year', ParseIntPipe) year: number,
    @Query('networkId') networkId,
    @Query('partnerId') partnerId,
    @Query('isQ2', ParseBoolPipe) isQ2: boolean,
  ) {
    Logger.debug('DashboardController.getProgressMarkersMonitoring');
    return this.dashboardService.getProgressMarkersMonitoring(
      year,
      isQ2,
      networkId,
      partnerId,
    );
  }

  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'networkId' })
  @ApiQuery({ name: 'partnerId' })
  @Get('getActivityManagement')
  async getActivityManagement(
    @Query('year', ParseIntPipe) year: number,
    @Query('networkId') networkId,
    @Query('partnerId') partnerId,
  ) {
    Logger.debug('DashboardController.getActivityManagement');
    return this.dashboardService.getActivityManagement(
      year,
      networkId,
      partnerId,
    );
  }

  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'networkId' })
  @ApiQuery({ name: 'partnerId' })
  @Get('getProposalSummary')
  async getProposalSummary(
    @Query('year', ParseIntPipe) year: number,
    @Query('networkId') networkId,
    @Query('partnerId') partnerId,
  ) {
    Logger.debug('DashboardController.getProposalSummary');
    return this.dashboardService.getProposalSummary(year, networkId, partnerId);
  }

  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'networkId' })
  @ApiQuery({ name: 'partnerId' })
  @Get('getActivityReportSummary')
  async getActivityReportSummary(
    @Query('year', ParseIntPipe) year: number,
    @Query('networkId') networkId,
    @Query('partnerId') partnerId,
  ) {
    Logger.debug('DashboardController.getActivityReportSummary');
    return this.dashboardService.getActivityReportSummary(
      year,
      networkId,
      partnerId,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('getSurveySummary')
  async getSurveySummary(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('DashboardController.getSurveySummary');
    return this.dashboardService.getSurveySummary(year, request.user);
  }

  @ApiQuery({ name: 'year' })
  @Get('getParticipationInfoSummary')
  async getParticipationInfoSummary(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('DashboardController.getParticipationInfoSummary');
    return this.dashboardService.getParticipationInfoSummary(
      year,
      request.user,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('getOutputInformation')
  async getOutputInformation(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('DashboardController.getOutputInformation');
    return this.dashboardService.getOutputInformation(year, request.user);
  }

  @ApiQuery({ name: 'year' })
  @Get('getOutcomeInformation')
  async getOutcomeInformation(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('DashboardController.getOutcomeInformation');
    return this.dashboardService.getOutcomeInformation(year, request.user);
  }
}
