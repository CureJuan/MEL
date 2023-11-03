import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  Put,
  Res,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AddIndicatorDTO } from './dto/addIndicator.dto';
import { AddResultDTO } from './dto/addResult.dto';
import { CreateMelpOMDTO } from './dto/createMelpOM.dto';
import { CreateMelpSRFDTO } from './dto/createMelpSRF.dto';
import { MelpService } from './melp.service';
import RequestWithUser from '../users/user.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditResultDTO } from './dto/editResult.dto';
import { EditOmDTO } from './dto/editOM.dto';
import { EditIndicatorDTO } from './dto/editIndicator.dto';
import { CreateNetworkMelpSRFDTO } from './dto/createNetworkMelpSRF.dto';
import { EditNetworkMelpSRFDTO } from './dto/editNetworkMelpSRF.dto';
import { Role } from '../users/enum/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { AddMelProgressPMDTO } from './dto/addMelProgressPM.dto';
import { AddMelProgressSRFDTO } from './dto/addMelProgressSRF.dto';

@UseGuards(JwtAuthGuard)
@Controller('melp')
@ApiTags('MELP Controller')
export class MelpController {
  constructor(private readonly melpService: MelpService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('globalMelp/srfMonitorings')
  async getGlobalMelpSRFMonitorings(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.getGlobalMelpSRFMonitorings');
    return this.melpService.getGlobalMelpSRFMonitorings(
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'year' })
  @Get('globalMelp/progressMarkerMonitorings')
  async getGlobalMelpProgressMarkerMonitorings(
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.getGlobalMelpProgressMarkerMonitorings');
    return this.melpService.getGlobalMelpProgressMarkerMonitorings(
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // @UseGuards(RolesGuard)
  // @Roles(Role.NETWORK, Role.PARTNER)
  // @ApiQuery({ name: 'searchKeyword' })
  // @ApiQuery({ name: 'pageLimit' })
  // @ApiQuery({ name: 'pageIndex' })
  // @ApiQuery({ name: 'year' })
  // @Get('currentMelpIndicators')
  // async getCurrentMelpIndicators(
  //   @Query('year', ParseIntPipe) year: number,
  //   @Req() request: RequestWithUser,
  //   @Query('searchKeyword') searchKeyword: string,
  //   @Query('pageLimit', ParseIntPipe) pageLimit: number,
  //   @Query('pageIndex', ParseIntPipe) pageIndex: number,
  // ) {
  //   Logger.debug('MelpController.getCurrentMelpIndicators');
  //   return this.melpService.getCurrentMelpIndicators(
  //     year,
  //     request.user,
  //     searchKeyword,
  //     pageLimit,
  //     pageIndex,
  //   );
  // }

  @ApiParam({ name: 'melpId' })
  @Get('objectiveLevelCounts/:melpId')
  async getObjectiveLevelCounts(@Param('melpId') melpId: string) {
    Logger.debug('MelpController.getObjectiveLevelCounts');
    return this.melpService.getObjectiveLevelCounts(melpId);
  }

  @ApiParam({ name: 'melpId' })
  @Get('outcomesCount/:melpId')
  async getOutcomesCount(@Param('melpId') melpId: string) {
    Logger.debug('MelpController.getOutcomesCount');
    return this.melpService.getOutcomesCount(melpId);
  }

  @ApiParam({ name: 'resultId' })
  @Get('indicatorsCount/:resultId')
  async getIndicatorsCount(@Param('resultId') resultId: string) {
    Logger.debug('MelpController.getObjectiveLevelCounts');
    return this.melpService.getIndicatorsCount(resultId);
  }

  @ApiParam({ name: 'outcomeId' })
  @Get('progressMarkersCount/:outcomeId')
  async getProgressMarkersCount(@Param('outcomeId') outcomeId: string) {
    Logger.debug('MelpController.getProgressMarkersCount');
    return this.melpService.getProgressMarkersCount(outcomeId);
  }

  @ApiQuery({ name: 'year' })
  @Get('melpResultsByYear')
  async getMelpResultsByYear(
    @Query('year', ParseIntPipe) year: number,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.getMelpResultsByYear');
    return this.melpService.getMelpResultsByYear(year, request.user);
  }

  @ApiQuery({ name: 'year' })
  @Get('melpResultsByYearForCapnet')
  async getMelpResultsByYearForCapnet(
    @Query('year', ParseIntPipe) year: number,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.getMelpResultsByYearForCapnet');
    return this.melpService.getMelpResultsByYearForCapnet(year, request.user);
  }

  // For Admin or Capnet User - See all approved MELP's list.
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('melpSummary/:year')
  async viewMelpSummary(
    @Param('year') year: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.viewMelpSummary');
    return this.melpService.viewMelpSummary(
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // For Network or Partner User - View all the MELP's of that particular network or partner according to ther user who has logged-in.
  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('networkOrPartner/melpSummary/:year')
  async viewNetworkOrPartnerMelpSummary(
    @Param('year') year: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.viewNetworkOrPartnerMelpSummary');
    return this.melpService.viewNetworkOrPartnerMelpSummary(
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      request.user,
    );
  }

  // For all users - View summary table of results for a particular melp by melpId
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'melpId' })
  @Get('melpSrfSummary/:melpId')
  async viewMelpSrfSummary(
    @Param('melpId') melpId: string,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.viewMelpSrfSummary');
    return this.melpService.viewMelpSrfSummary(
      melpId,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // For all users - View summary table of outcomes for a particular melp by melpId
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'melpId' })
  @Get('melpOmSummary/:melpId')
  async viewMelpOMSummary(
    @Param('melpId') melpId: string,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.viewMelpOMSummary');
    return this.melpService.viewMelpOMSummary(
      melpId,
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
  @ApiParam({ name: 'melpId' })
  @Get('melProgressSRFMonitoring/:melpId')
  async viewMelProgressSRFMonitoring(
    @Param('melpId') melpId: string,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.viewMelProgressSRFMonitoring');
    return this.melpService.viewMelProgressSRF(
      melpId,
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
  @ApiParam({ name: 'melpId' })
  @Get('melProgressPMMonitoring/:melpId')
  async viewMelProgressPMMonitoring(
    @Param('melpId') melpId: string,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('MelpController.viewMelProgressPMMonitoring');
    return this.melpService.viewMelProgressPM(
      melpId,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // For all users - Create or Edit MEL Progress
  @ApiParam({ name: 'melpId' })
  @Put('addMelProgressSRF/:melpId')
  async createMelProgressSRF(
    @Param('melpId') melpId: string,
    @Body() addMelProgressSRF: AddMelProgressSRFDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.createMelProgress');
    return this.melpService.createMelProgressSRF(
      melpId,
      addMelProgressSRF,
      request.user,
    );
  }

  @ApiParam({ name: 'melpId' })
  @Put('addMelProgressPM/:melpId')
  async createMelProgressPM(
    @Param('melpId') melpId: string,
    @Body() addMelProgressPM: AddMelProgressPMDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.createMelProgressPM');
    return this.melpService.createMelProgressPM(
      melpId,
      addMelProgressPM,
      request.user,
    );
  }

  @ApiParam({ name: 'melpId' })
  @Get('viewNetworkOrPartnerMelpSRF/:melpId')
  async viewNetworkOrPartnerMelpSRF(@Param('melpId') melpId: string) {
    Logger.debug('MelpController.viewNetworkOrPartnerMelpSRF');
    return this.melpService.viewNetworkOrPartnerMelpSRF(melpId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('viewAllNetworksMelp/:year')
  async viewAllNetworksMelp(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('MelpController.viewAllNetworksMelp');
    return this.melpService.viewAllNetworksMelp(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('viewAllPartnersMelp/:year')
  async viewAllPartnersMelp(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('MelpController.viewAllPartnersMelp');
    return this.melpService.viewAllPartnersMelp(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiParam({ name: 'resultId' })
  @Get('viewMelpSrf/:resultId')
  async viewMelpSrf(
    @Param('resultId') resultId: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
  ) {
    Logger.debug('MelpController.viewMelpSrf');
    return this.melpService.viewMelpSrf(resultId, pageLimit, pageIndex);
  }

  @ApiParam({ name: 'outcomeId' })
  @Get('viewMelpOm/:outcomeId')
  async viewMelpOM(@Param('outcomeId') outcomeId: string) {
    Logger.debug('MelpController.viewMelpSrfSummary');
    return this.melpService.viewMelpOm(outcomeId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Post('addMelpSRF')
  async createCapnetMelpSRF(
    @Body() createMelpSRF: CreateMelpSRFDTO,
    @Body() addResult: AddResultDTO,
    @Body() addIndicator: AddIndicatorDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.createCapnetMelpSRF');
    return this.melpService.createCapnetMelpSRF(
      createMelpSRF,
      addResult,
      addIndicator,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Post('generalUser/addMelpSRF')
  async createNetworkOrPartnerMelpSRF(
    @Body() createNetworkMelpSRF: CreateNetworkMelpSRFDTO,
    // @Body() addResult: AddResultDTO,
    // @Body() addIndicator: AddIndicatorDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.createNetworkOrPartnerMelpSRF');
    return this.melpService.createNetworkOrPartnerMelpSRF(
      createNetworkMelpSRF,
      // addResult,
      // addIndicator,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'resultId' })
  @Post('addIndicator/:resultId')
  async addIndicator(
    @Param('resultId') resultId: string,
    @Body() addIndicator: AddIndicatorDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.addIndicator');
    return this.melpService.addIndicator(resultId, addIndicator, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'melpId' })
  @Post('addResult/:melpId')
  async addResult(
    @Param('melpId') melpId: string,
    @Body() addResult: AddResultDTO,
    @Body() addIndicator: AddIndicatorDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.addIndicator');
    return this.melpService.addResult(
      melpId,
      addResult,
      addIndicator,
      request.user,
    );
  }

  @Get('boundaryPartners')
  async getBoundaryPartners() {
    Logger.debug('MelpController.getBoundaryPartners');
    return this.melpService.boundaryPartners();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'melpId' })
  @Post('addMelpOM/:melpId')
  async createMelpOM(
    @Param('melpId') melpId: string,
    @Body() createMelpOM: CreateMelpOMDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.createCapnetMelpOM');
    return this.melpService.createMelpOM(melpId, createMelpOM, request.user);
  }

  @ApiQuery({ name: 'resultId' })
  @Get('indicatorsByResultId')
  async getIndicatorsByResultId(@Query('resultId') resultId: string) {
    Logger.debug('MelpController.getIndicatorsByResultId');
    return this.melpService.getIndicatorsByResultId(resultId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'melpId' })
  @Put('editNetworkSRF/:melpId')
  async editNetworkSRFScope(
    @Param('melpId') melpId: string,
    @Body() editNetworkSRF: EditNetworkMelpSRFDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.editNetworkSRFScope');
    return this.melpService.editNetworkSRFScope(
      melpId,
      editNetworkSRF,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'resultId' })
  @ApiQuery({ name: 'melpId' })
  @Put('editResult/:resultId')
  async editResult(
    @Param('resultId') resultId: string,
    @Query('melpId') melpId: string,
    @Body() editResult: EditResultDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.editResult');
    return this.melpService.editResult(
      resultId,
      melpId,
      editResult,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'outcomeId' })
  @ApiQuery({ name: 'melpId' })
  @Put('editOM/:outcomeId')
  async editOM(
    @Param('outcomeId') outcomeId: string,
    @Query('melpId') melpId: string,
    @Body() editOM: EditOmDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.editOM');
    return this.melpService.editOM(outcomeId, melpId, editOM, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'indicatorId' })
  @ApiQuery({ name: 'melpId' })
  @Put('editIndicator/:indicatorId')
  async editIndicator(
    @Param('indicatorId') indicatorId: string,
    @Query('melpId') melpId: string,
    @Body() editIndicator: EditIndicatorDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.editOM');
    return this.melpService.editIndicator(
      indicatorId,
      melpId,
      editIndicator,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.PARTNER, Role.NETWORK)
  @ApiParam({ name: 'melpId' })
  @Put('removeMelp/:melpId')
  async deleteMelp(
    @Param('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpService.deleteMelp');
    return this.melpService.deleteMelp(melpId, request.user);
  }

  @ApiParam({ name: 'resultId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeResult/:resultId')
  async deleteResult(
    @Param('resultId') resultId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteResult');
    return this.melpService.deleteResult(resultId, melpId, request.user);
  }

  @ApiParam({ name: 'indicatorId' })
  @ApiQuery({ name: 'resultId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeIndicator/:indicatorId')
  async deleteIndicator(
    @Param('indicatorId') indicatorId: string,
    @Query('resultId') resultId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteIndicator');
    return this.melpService.deleteIndicator(
      indicatorId,
      resultId,
      melpId,
      request.user,
    );
  }

  @ApiParam({ name: 'outcomeId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeOM/:outcomeId')
  async deleteOM(
    @Param('outcomeId') outcomeId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteOM');
    return this.melpService.deleteOM(outcomeId, melpId, request.user);
  }

  @ApiParam({ name: 'indicatorMonitoringId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeIndicatorMonitoring/:indicatorMonitoringId')
  async deleteIndicatorsMonitoring(
    @Param('indicatorMonitoringId') indicatorMonitoringId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteIndicatorsMonitoring');
    return this.melpService.deleteIndicatorsMonitoring(
      indicatorMonitoringId,
      melpId,
      request.user,
    );
  }

  @ApiParam({ name: 'monitoringRiskId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeMonitoringRisk/:monitoringRiskId')
  async deleteMonitoringRisk(
    @Param('monitoringRiskId') monitoringRiskId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteMonitoringRisk');
    return this.melpService.deleteMonitoringRisk(
      monitoringRiskId,
      melpId,
      request.user,
    );
  }

  @ApiParam({ name: 'progressMarkerId' })
  @ApiQuery({ name: 'melpId' })
  @Put('removeProgressMarker/:progressMarkerId')
  async deleteProgressMarker(
    @Param('progressMarkerId') progressMarkerId: string,
    @Query('melpId') melpId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('MelpController.deleteProgressMarker');
    return this.melpService.deleteProgressMarker(
      progressMarkerId,
      melpId,
      request.user,
    );
  }

  @ApiParam({ name: 'outcomeId' })
  @Get('pmCodeCount/:outcomeId')
  async getPMCodeCount(@Param('outcomeId') outcomeId: string) {
    Logger.debug('MelpController.getPMCodeCount');
    return this.melpService.getPMCodeCount(outcomeId);
  }

  @ApiParam({ name: 'outcomeId' })
  @Put('pmCodeCountIncrement/:outcomeId')
  async increasePMCodeCount(@Param('outcomeId') outcomeId: string) {
    Logger.debug('MelpController.increasePMCodeCount');
    return this.melpService.increasePMCodeCount(outcomeId);
  }

  @Get('progressMonitoringList')
  async getProgressMonitoringList() {
    Logger.debug('MelpController.getProgressMonitoringList');
    return this.melpService.getProgressMonitoringList();
  }

  @Get('melpTasks')
  async getMelpTasks() {
    Logger.debug('MelpController.getMelpTasks');
    return this.melpService.getMelpTask();
  }

  @Get('priorityList')
  async getPriorityList() {
    Logger.debug('MelpController.getPriorityList');
    return this.melpService.getPriorityList();
  }

  @ApiParam({ name: 'melpId' })
  @Get('export/:melpId')
  async downloadIndividualMelp(@Param('melpId') melpId: string, @Res() res) {
    Logger.debug('MelpController.downloadIndividualMelp');
    return this.melpService.downloadIndividualMelp(res, melpId);
  }

  @ApiParam({ name: 'year' })
  @Get('multipleExport/:year')
  async downloadMultipleMelp(
    @Param('year', ParseIntPipe) year: number,
    @Req() request: RequestWithUser,
    @Res() res,
  ) {
    Logger.debug('MelpController.downloadMultipleMelp');
    return this.melpService.downloadMultipleMelp(res, year, request.user);
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'network' })
  @Get('generalUserMultipleExport/:year')
  async downloadGeneralUserMultipleMelp(
    @Param('year', ParseIntPipe) year: number,
    @Query('network', ParseBoolPipe) network: boolean,
    @Res() res,
  ) {
    Logger.debug('MelpController.downloadGeneralUserMultipleMelp');
    return this.melpService.downloadGeneralUserMultipleMelp(res, year, network);
  }

  @ApiParam({ name: 'melpId' })
  @Get('getMelp/:melpId')
  async getMelp(@Param('melpId') melpId: string) {
    Logger.debug('MelpController.getMelp');
    return this.melpService.getMelp(melpId);
  }

  @ApiParam({ name: 'year' })
  @Get('checkMelpYearExists/:year')
  async checkMelpYearExists(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('MelpController.checkMelpYearExists');
    return this.melpService.checkMelpYearExists(year, request.user);
  }
}
