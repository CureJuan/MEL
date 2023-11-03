import {
  Body,
  Controller,
  Logger,
  Param,
  Post,
  Put,
  Get,
  Req,
  UseGuards,
  Res,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiConsumes, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../users/user.service';
import { ProposalIdListDto } from './dto/proposalIdList.dto';
import { AddStoryCreationDTO } from './dto/addStoryCreation.dto';
import { AddStoryInfoDTO } from './dto/addStoryInfo.dto';
import { AddStorySelectionDTO } from './dto/addStorySelection.dto';
import { AddStorytellerInfoDTO } from './dto/addStorytellerInfo.dto';
import { EditStoryInfoDTO } from './dto/editStoryInfo.dto';
import { EditStorytellerInfoDTO } from './dto/editStorytellerInfo.dto';
import { ImpactStoryService } from './impactStory.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enum/role.enum';

@ApiTags('Impact Story Controller')
@UseGuards(JwtAuthGuard)
@Controller('impactStory')
export class ImpactStoryController {
  constructor(private readonly impactStoryService: ImpactStoryService) {}

  @Get('staticData')
  async getStaticDataTables() {
    Logger.debug('ImpactStoryController.getStaticDataTables');
    return this.impactStoryService.getStaticDataTables();
  }

  @ApiParam({ name: 'year' })
  @Get('countOfImpactStory/:year')
  async getCountOfImpactStory(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('ImpactStoryController.getCountOfImpactStory');
    return this.impactStoryService.getCountOfImpactStory(year, request.user);
  }

  /** Get list of activities whose output reports are approved */
  @ApiParam({ name: 'year' })
  @Get('proposalActivityList/:year')
  async getProposalActivityList(@Param('year') year: number, @Req() request) {
    Logger.debug('ImpactStoryController.getProposalActivityList');
    return this.impactStoryService.getProposalActivityList(year, request.user);
  }

  @ApiParam({ name: 'year' })
  @Get('proposalActivityListForCapnet/:year')
  async getProposalActivityListForCapnet(@Param('year') year: number) {
    Logger.debug('ImpactStoryController.getProposalActivityListForCapnet');
    return this.impactStoryService.getProposalActivityListForCapnet(year);
  }

  /**Get list of unique indicators from selected proposal-activities */
  @Post('indicatorList')
  async getIndicatorsListByProposalId(
    @Body() proposalIdList: ProposalIdListDto,
  ) {
    Logger.debug('ImpactStoryController.getIndicatorsListByProposalId');
    return this.impactStoryService.getIndicatorsListByProposalId(
      proposalIdList,
    );
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('listOfImpactStories/:year')
  async getListOfImpactStories(
    @Req() request: RequestWithUser,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ImpactStoryController.getListOfImpactStories');
    return this.impactStoryService.getListOfImpactStories(
      request.user,
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @ApiParam({ name: 'impactStoryId' })
  @Get('getImpactStoryInfo/:impactStoryId')
  async getImpactStoryInfo(
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.getImpactStoryInfo');
    return this.impactStoryService.getImpactStoryInfo(
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('addImpactStoryInfo')
  async addImpactStoryInfo(
    @Body() addImpactStoryInfo: AddStoryInfoDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ImpactStoryController.addImpactStoryInfo');
    return this.impactStoryService.addImpactStoryInfo(
      addImpactStoryInfo,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('updateImpactStoryInfo/:impactStoryId')
  async updateImpactStoryInfo(
    @Body() updateStoryInfo: EditStoryInfoDTO,
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.updateImpactStoryInfo');
    return this.impactStoryService.updateImpactStoryInfo(
      updateStoryInfo,
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('addOrEditStorytellerInfo/:impactStoryId')
  async addOrEditStorytellerInfo(
    @Body()
    addOrEditStorytellerInfo: AddStorytellerInfoDTO | EditStorytellerInfoDTO,
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.addOrEditStorytellerInfo');
    return this.impactStoryService.addOrEditStorytellerInfo(
      addOrEditStorytellerInfo,
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('addorEditStorySelection/:impactStoryId')
  async addorEditStorySelection(
    @Body() addStorySelection: AddStorySelectionDTO,
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.addorEditStorySelection');
    return this.impactStoryService.addorEditStorySelection(
      addStorySelection,
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('addOrEditStoryCreation/:impactStoryId')
  async addOrEditStoryCreation(
    @Body() addOrEditStoryCreation: AddStoryCreationDTO,
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.addOrEditStoryCreation');
    return this.impactStoryService.addOrEditStoryCreation(
      addOrEditStoryCreation,
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('remove/:impactStoryId')
  async removeImpactStory(
    @Req() request: RequestWithUser,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.removeImpactStory');
    return this.impactStoryService.removeImpactStory(
      impactStoryId,
      request.user,
    );
  }

  @ApiParam({ name: 'impactStoryId' })
  @Get('export/:impactStoryId')
  async individualDownload(
    @Res() res,
    @Param('impactStoryId') impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryController.individualDownload');
    return this.impactStoryService.individualDownload(res, impactStoryId);
  }

  @ApiParam({ name: 'year' })
  @Get('mulitpleExport/:year')
  async multipleDownload(
    @Res() res,
    @Param('year') year: number,
    @Req() request,
  ) {
    Logger.debug('ImpactStoryController.multipleDownload');
    return this.impactStoryService.multipleDownload(res, year, request.user);
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'network' })
  @Get('generalUserMultipleExport/:year')
  async generalUserMultipleDownload(
    @Param('year', ParseIntPipe) year: number,
    @Query('network', ParseBoolPipe) network: boolean,
    @Res() res,
  ) {
    Logger.debug('ImpactStoryController.generalUserMultipleDownload');
    return this.impactStoryService.generalUserMultipleDownload(
      res,
      year,
      network,
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
  @Get('viewAllNetworksImpactStory/:year')
  async viewAllNetworksImpactStory(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ImpactStoryController.viewAllNetworksImpactStory');
    return this.impactStoryService.viewAllNetworksImpactStory(
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
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('viewAllPartnersImpactStory/:year')
  async viewAllPartnersImpactStory(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ImpactStoryController.viewAllPartnersImpactStory');
    return this.impactStoryService.viewAllPartnersImpactStory(
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'impactStoryId' })
  @Put('finalSaveImpactStory/:impactStoryId')
  async finalSaveImpactStory(
    @Param('impactStoryId') impactStoryId: string,
    @Req() request,
  ) {
    Logger.debug('ImpactStoryController.finalSaveImpactStory');
    return this.impactStoryService.finalSaveImpactStory(
      impactStoryId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('uploadStoryFiles')
  @UseInterceptors(FilesInterceptor('file', 10, {}))
  @ApiConsumes('multipart/form-data')
  async uploadStoryFiles(@UploadedFiles() file) {
    Logger.debug('ImpactStoryController.uploadStoryFiles');
    console.log('file= ', file);
    return this.impactStoryService.uploadStoryFiles(file);
  }

  @ApiQuery({ name: 'filename' })
  @ApiQuery({ name: 'requestId' })
  @ApiQuery({ name: 'fieldKey' })
  @ApiQuery({ name: 'impactStoryId' })
  @Get('deleteImpactStoryFromAzure')
  async deleteImpactStoryFromAzure(
    @Query('filename') filename: string,
    @Query('requestId') requestId: string,
    @Query('fieldKey') fieldKey: string,
    @Query('impactStoryId') impactStoryId: string,
  ) {
    await this.impactStoryService.deleteImpactStoryFromAzure(
      filename,
      requestId,
      fieldKey,
      impactStoryId,
    );
    return 'Impact story files deleted successfully.';
  }
}
