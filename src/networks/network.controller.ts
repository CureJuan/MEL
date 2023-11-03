import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivateOrDeactivateNetworkDTO } from './dto/activateOrDeactivateNetwork.dto';
import { AddAnalysisDto } from './dto/addAnalysis.dto';
import { AddIndividualMembersDto } from './dto/addIndividualMembers.dto';
import { AddInstitutionalMembersDto } from './dto/addInstitutionalMembers.dto';
import { CreateNetworkDTO } from './dto/create-network.dto';
import { CreateNetworkProfileDTO } from './dto/createNetworkProfile.dto';
import { EditNetworkNameDTO } from './dto/editNetworkName.dto';
import { EditNetworkProfileDto } from './dto/editNetworkProfile.dto';
import { NetworkService } from './network.service';
import { Network } from './schema/network.schema';

@Controller('network')
// @UseGuards(JwtAuthGuard)
@ApiTags('Network Controller')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @UseGuards(JwtAuthGuard)
  @Post('addNetwork')
  async addNetwork(@Body() network: CreateNetworkDTO): Promise<Network> {
    Logger.debug('NetworkController.addNetwork');
    return this.networkService.addNetwork(network);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Put('editNetworkName/:networkId')
  async editNetworkName(
    @Body() editNetworkName: EditNetworkNameDTO,
    @Param('networkId') networkId: string,
    @Req() request,
  ) {
    Logger.debug('NetworkController.editNetworkName');
    return this.networkService.editNetworkName(
      networkId,
      editNetworkName,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('activateOrDeactiveNetwork')
  async activateOrDeactiveNetwork(
    @Body() activateOrDeactiveNetwork: ActivateOrDeactivateNetworkDTO,
    @Req() request,
  ) {
    Logger.debug('NetworkController.activateOrDeactiveNetwork');
    return this.networkService.activateOrDeactiveNetwork(
      activateOrDeactiveNetwork,
      request.user,
    );
  }

  @Get('allNetworksList')
  async getAllNetworksList() {
    Logger.debug('NetworkController.getAllNetworksList');
    return this.networkService.getAllNetworksList();
  }

  @Get('allNetworksNameList')
  async getAllNetworksNameList() {
    Logger.debug('NetworkController.getAllNetworksNameList');
    return this.networkService.getAllNetworksNameList();
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('networkName/:networkId')
  async getNetworkNameById(@Param('networkId') networkId) {
    Logger.debug('NetworkController.getNetworkNameById');
    return this.networkService.getNetworkNameById(networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @Get('activityLog')
  async getActivityLog(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('NetworkController.getActivityLog');
    return this.networkService.getActivityLog(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'networkId' })
  @Get('activityLog/:networkId')
  async getActivityLogPerNetwork(
    @Param('networkId') networkId: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('NetworkController.getActivityLogPerNetwork');
    return this.networkService.getActivityLogPerNetwork(
      networkId,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('addNetworkProfile')
  async createNetworkProfile(
    @Req() request,
    @Body() createNetworkProfile: CreateNetworkProfileDTO,
  ) {
    Logger.debug('NetworkController.createNetworkProfile');
    return this.networkService.createNetworkProfile(
      createNetworkProfile,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('editNetworkProfile')
  async editNetworkProfile(
    @Req() request,
    @Body() editNetworkProfile: EditNetworkProfileDto,
  ) {
    Logger.debug('NetworkController.editNetworkProfile');
    return this.networkService.editNetworkProfile(
      editNetworkProfile,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('addAnalysisAndLearning')
  async addAnalysisAndLearning(
    @Req() request,
    @Body() addAnalysisAndLearning: AddAnalysisDto,
  ) {
    Logger.debug('NetworkController.addAnalysisAndLearning');
    return this.networkService.addAnalysisAndLearning(
      addAnalysisAndLearning,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('addIndividualMembers')
  async addIndividualMembers(
    @Req() request,
    @Body() addIndividualMembers: AddIndividualMembersDto[],
  ) {
    Logger.debug('NetworkController.addIndividualMembers');
    return this.networkService.addIndividualMembers(
      addIndividualMembers,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('addInstitutionalMembers')
  async addInstitutionalMembers(
    @Req() request,
    @Body() addInstitutionalMembers: AddInstitutionalMembersDto[],
  ) {
    Logger.debug('NetworkController.addInstitutionalMembers');
    return this.networkService.addInstitutionalMembers(
      addInstitutionalMembers,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'individualMemberId' })
  @Put('deleteIndividualMember/:individualMemberId')
  async deleteIndividualMember(
    @Req() request,
    @Param('individualMemberId') individualMemberId: string,
  ) {
    Logger.debug('NetworkController.deleteIndividualMember');
    return this.networkService.deleteIndividualMember(
      individualMemberId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'institutionalMemberId' })
  @Put('deleteInstitutionalMember/:institutionalMemberId')
  async deleteInstitutionalMember(
    @Req() request,
    @Param('institutionalMemberId') institutionalMemberId: string,
  ) {
    Logger.debug('NetworkController.deleteInstitutionalMember');
    return this.networkService.deleteInstitutionalMember(
      institutionalMemberId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('memberCount')
  async getMemberCount(@Req() request) {
    Logger.debug('NetworkController.getMemberCount');
    return this.networkService.getMemberCount(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('networkProfile/:networkId')
  async viewNetworkProfile(@Param('networkId') networkId) {
    Logger.debug('NetworkController.viewNetworkProfile');
    return this.networkService.viewNetworkProfile(networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @Get('networkProfileList')
  async getNetworksList(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('NetworkController.getNetworksList');
    return this.networkService.getNetworksList(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('individualMembersList/:networkId')
  async getIndividualMembersList(@Param('networkId') networkId) {
    Logger.debug('NetworkController.getIndividualMembersList');
    return this.networkService.getIndividualMembersList(networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('institutionalMembersList/:networkId')
  async getInstitutionalMembersList(@Param('networkId') networkId) {
    Logger.debug('NetworkController.getInstitutionalMembersList');
    return this.networkService.getInstitutionalMembersList(networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('institutionalPartnerMembersList/:networkId')
  async getInstitutionalPartnerMembersList(@Param('networkId') networkId) {
    Logger.debug('NetworkController.getInstitutionalPartnerMembersList');
    return this.networkService.getInstitutionalPartnerMembersList(networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('downloadIndividualMemberList/:networkId')
  async downloadIndividualMemberList(
    @Param('networkId') networkId,
    @Res() res,
  ) {
    Logger.debug('NetworkController.downloadIndividualMemberList');
    return this.networkService.downloadIndividualMemberList(res, networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('downloadInstitutionalMembersList/:networkId')
  async downloadInstitutionalMembersList(
    @Param('networkId') networkId,
    @Res() res,
  ) {
    Logger.debug('NetworkController.downloadInstitutionalMembersList');
    return this.networkService.downloadInstitutionalMembersList(res, networkId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'networkId' })
  @Get('downloadPartnerMembersList/:networkId')
  async downloadPartnerMembersList(@Param('networkId') networkId, @Res() res) {
    Logger.debug('NetworkController.downloadPartnerMembersList');
    return this.networkService.downloadPartnerMembersList(res, networkId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getStaticDataTables')
  async getStaticDataTables() {
    Logger.debug('NetworkReportingController.getStaticData');
    return this.networkService.getStaticDataTables();
  }
}
