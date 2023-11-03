import {
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
  Query,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Res,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { AddAdditionalInfoDTO } from './dto/addAdditionalInfo.dto';
import { AddFinancialDetailsDTO } from './dto/addFinancialDetails.dto';
import { CreateActivityProposalDTO } from './dto/create-activityProposal.dto';
import { EditActivityDTO } from './dto/edit-activity.dto';
import { EditProposalDTO } from './dto/editProposal.dto';

@ApiTags('Activity and Proposal Controller')
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('allStaticDataWorkplanActivity')
  async getStaticDataWorkplanActivity() {
    Logger.debug('ActivitiesController.getActivityCategories');
    return this.activitiesService.getStaticDataWorkplanActivity();
  }

  // @Post('addActivity')
  // async createActivity(
  //   @Req() req,
  //   @Body() createActivityDTO: CreateActivityDTO,
  // ) {
  //   Logger.debug('ActivitiesController.createActivity');
  //   return this.activitiesService.createActivity(req.user, createActivityDTO);
  // }

  @ApiQuery({ name: 'activityId' })
  @Get('viewEachActivityDetails')
  async viewEachActivityDetails(@Query('activityId') activityId: string) {
    Logger.debug('ActivitiesController.viewEachActivityDetails');
    return this.activitiesService.viewActivityDetails(activityId);
  }

  @ApiQuery({ name: 'activityId' })
  @Put('editActivity')
  updateActivity(
    @Query('activityId') activityId: string,
    @Body() editActivityDTO: EditActivityDTO,
    @Req() req,
  ) {
    Logger.debug('ActivitiesController.updateActivity');
    return this.activitiesService.updateActivityById(
      activityId,
      editActivityDTO,
      req.user,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('activityListByYear/:year')
  async getActivityListByYear(@Req() request, @Param('year') year: number) {
    Logger.debug('ActivitiesController.getActivityListByYear');
    return this.activitiesService.getActivityListByYear(year, request.user);
  }

  @ApiParam({ name: 'year' })
  @Get('activityListByYearForCapnet/:year')
  async getActivityListByYearForCapnet(@Param('year') year: number) {
    Logger.debug('ActivitiesController.getActivityListByYearForCapnet');
    return this.activitiesService.getActivityListByYearForCapnet(year);
  }

  /** Proposals routes */
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('getActivityTracker/:year')
  async getActivityTracker(
    @Req() request,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ActivitiesController.getActivityTracker');
    return this.activitiesService.getActivityTracker(
      request.user,
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('getListOfProposals/:year')
  async getListOfProposals(
    @Req() request,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ActivitiesController.getListOfProposals');
    return this.activitiesService.getListOfProposals(
      request.user,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Get('viewProposal/:activityProposalId')
  async viewProposal(
    @Req() request,
    @Param('activityProposalId') activityProposalId: string,
  ) {
    Logger.debug('ActivitiesController.viewProposal');
    return this.activitiesService.viewProposal(
      activityProposalId,
      request.user,
    );
  }

  @Post('addProposal')
  async createProposal(
    @Req() request,
    @Body() createProposal: CreateActivityProposalDTO,
  ) {
    Logger.debug('ActivitiesController.createProposal');
    return this.activitiesService.createProposal(request.user, createProposal);
  }

  @ApiParam({ name: 'activityProposalId' })
  @Put('finalSaveProposal/:activityProposalId')
  async finalSaveProposal(
    @Param('activityProposalId') activityProposalId: string,
    @Req() request,
  ) {
    Logger.debug('ActivitiesController.finalSaveProposal');
    return this.activitiesService.finalSaveProposal(
      activityProposalId,
      request.user,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Put('addFinancialDetails/:activityProposalId')
  async addFinancialDetails(
    @Req() request,
    @Param('activityProposalId') activityProposalId: string,
    @Body() addFinancials: AddFinancialDetailsDTO,
  ) {
    Logger.debug('ActivitiesController.addFinancialDetails');
    return this.activitiesService.addFinancialDetails(
      activityProposalId,
      request.user,
      addFinancials,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Put('addAdditionalInfo/:activityProposalId')
  async addAdditionalInfo(
    @Req() request,
    @Param('activityProposalId') activityProposalId: string,
    @Body() additionalInfo: AddAdditionalInfoDTO,
  ) {
    Logger.debug('ActivitiesController.addAdditionalInfo');
    return this.activitiesService.addAdditionalInfo(
      activityProposalId,
      request.user,
      additionalInfo,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Put('editProposal/:activityProposalId')
  async editProposal(
    @Req() request,
    @Param('activityProposalId') activityProposalId: string,
    @Body() editProposal: EditProposalDTO,
  ) {
    Logger.debug('ActivitiesController.editProposal');
    return this.activitiesService.editProposal(
      activityProposalId,
      request.user,
      editProposal,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Put('removeProposal/:activityProposalId')
  async removeProposal(
    @Req() request,
    @Param('activityProposalId') activityProposalId: string,
  ) {
    Logger.debug('ActivitiesController.removeProposal');
    return this.activitiesService.removeProposal(
      activityProposalId,
      request.user,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('activityCodeDropdownForOutputReport')
  async getActivityCodeDropdownForOutputReport(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ActivitiesController.getActivityCodeDropdownForOutputReport');
    return this.activitiesService.getActivityCodeDropdownForOutputReport(
      year,
      request.user,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('activityCodeDropdownForOutputReportForCapNet')
  async getActivityCodeDropdownForOutputReportForCapNet(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug(
      'ActivitiesController.getActivityCodeDropdownForOutputReportForCapNet',
    );
    return this.activitiesService.getActivityCodeDropdownForOutputReportForCapNet(
      year,
      request.user,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('activityCodeDropdownForOutcomeReport')
  async getActivityCodeDropdownForOutcomeReport(
    @Req() request,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug(
      'ActivitiesController.getActivityCodeDropdownForOutcomeReport',
    );
    return this.activitiesService.getActivityCodeDropdownForOutcomeReport(
      year,
      request.user,
    );
  }

  @ApiQuery({ name: 'year' })
  @Get('activityCodeDropdownForOutcomeReportForCapNet')
  async getActivityCodeDropdownForOutcomeReportForCapNet(
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug(
      'ActivitiesController.getActivityCodeDropdownForOutcomeReportForCapNet',
    );
    return this.activitiesService.getActivityCodeDropdownForOutcomeReportForCapNet(
      year,
    );
  }

  @ApiQuery({ name: 'activityCode' })
  @Get('activityByCode')
  async getActivityByCode(@Query('activityCode') activityCode: string) {
    Logger.debug('ActivitiesController.getActivityByCode');
    return this.activitiesService.getActivityByCode(activityCode);
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('viewAllNetworksProposals/:year')
  async viewAllNetworksProposals(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ActivitiesController.viewAllNetworksProposals');
    return this.activitiesService.viewAllNetworksProposals(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('viewAllPartnersProposals/:year')
  async viewAllPartnersProposals(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ActivitiesController.viewAllPartnersProposals');
    return this.activitiesService.viewAllPartnersProposals(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiParam({ name: 'activityProposalId' })
  @Get('export/:activityProposalId')
  async individualProposalDownload(
    @Res() res,
    @Param('activityProposalId') activityProposalId: string,
  ) {
    Logger.debug('ActivitiesController.individualProposalDownload');
    return this.activitiesService.individualProposalDownload(
      res,
      activityProposalId,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('multipleExport/:year')
  async multipleProposalDownload(
    @Res() res,
    @Param('year') year: number,
    @Req() request,
  ) {
    Logger.debug('ActivitiesController.multipleProposalDownload');
    return this.activitiesService.multipleProposalDownload(
      res,
      year,
      request.user,
    );
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'network' })
  @Get('generalUserMultipleExport/:year')
  async generalUserMultipleProposalDownload(
    @Param('year', ParseIntPipe) year: number,
    @Query('network', ParseBoolPipe) network: boolean,
    @Res() res,
  ) {
    Logger.debug('ActivitiesController.generalUserMultipleProposalDownload');
    return this.activitiesService.generalUserMultipleProposalDownload(
      res,
      year,
      network,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('countOfProposalByYear/:year')
  async getCountOfProposalsByYearAndUserRole(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('ActivitiesController.getCountOfProposalsByYearAndUserRole');
    return this.activitiesService.getCountOfProposalsByYearAndUserRole(
      year,
      request.user,
    );
  }

  @ApiParam({ name: 'activityId' })
  @Get('checkIfActivityAlreadyProposedByActivityId/:activityId')
  async checkIfActivityAlreadyProposedByActivityId(
    @Param('activityId') activityId: string,
  ) {
    Logger.debug(
      'ActivitiesController.checkIfActivityAlreadyProposedByActivityId',
    );
    return this.activitiesService.checkIfActivityAlreadyProposedByActivityId(
      activityId,
    );
  }

  @ApiParam({ name: 'coordinationCostId' })
  @Put('removeCoordinationCost/:coordinationCostId')
  async removeCoordinationCost(
    @Param('coordinationCostId') coordinationCostId: string,
  ) {
    Logger.debug('ActivitiesController.removeCoordinationCost');
    return this.activitiesService.removeCoordinationCost(coordinationCostId);
  }

  @ApiParam({ name: 'travelCostId' })
  @Put('removeTravelCost/:travelCostId')
  async removeTravelCost(@Param('travelCostId') travelCostId: string) {
    Logger.debug('ActivitiesController.removeTravelCost');
    return this.activitiesService.removeTravelCost(travelCostId);
  }

  @ApiParam({ name: 'locationCostId' })
  @Put('removeLocationCost/:locationCostId')
  async removeLocationCost(@Param('locationCostId') locationCostId: string) {
    Logger.debug('ActivitiesController.removeLocationCost');
    return this.activitiesService.removeLocationCost(locationCostId);
  }

  @ApiParam({ name: 'otherCostId' })
  @Put('removeOtherCost/:otherCostId')
  async removeOtherCost(@Param('otherCostId') otherCostId: string) {
    Logger.debug('ActivitiesController.removeOtherCost');
    return this.activitiesService.removeOtherCost(otherCostId);
  }

  @ApiQuery({ name: 'filename' })
  @ApiQuery({ name: 'requestId' })
  @ApiQuery({ name: 'proposalId' })
  @Put('deleteProposalFileFromAzure')
  async deleteProposalFileFromAzure(
    @Query('filename') filename: string,
    @Query('requestId') requestId: string,
    @Query('proposalId') proposalId: any,
    @Req() request,
    @Body() additionalInfo: AddAdditionalInfoDTO,
  ) {
    Logger.debug('ActivitiesController.deleteProposalFileFromAzure');

    await this.activitiesService.deleteProposalFileFromAzure(
      filename,
      requestId,
      proposalId,
      request.user,
      additionalInfo,
    );
    return 'File deleted successfully.';
  }
}
