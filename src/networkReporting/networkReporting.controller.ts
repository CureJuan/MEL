import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enum/role.enum';
import { RolesGuard } from '../users/guards/roles.guard';
import { AddInvoiceDTO } from './dto/addInvoice.dto';
import { CreateAnnualReportDTO } from './dto/createAnnualReport.dto';
import { CreateProgressReportDTO } from './dto/createProgressReport.dto';
import { EditAnnualReportDTO } from './dto/editAnnualReport.dto';
import { EditInvoiceDTO } from './dto/editInvoice.dto';
import { EditProgressReportDTO } from './dto/editProgressReport.dto';
import { NetworkReportingService } from './networkReporting.service';

@Controller('networkReporting')
@UseGuards(JwtAuthGuard)
@ApiTags('Network Reporting Controller')
export class NetworkReportingController {
  constructor(private reportingService: NetworkReportingService) {}

  @ApiParam({ name: 'year' })
  @Get('timeframeCounts/:year')
  async getTimeframeCounts(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.getTimeframeCounts');
    return this.reportingService.getTimeframeCounts(year, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @Post('addProgressReport')
  async createProgressReport(
    @Body() createProgressReport: CreateProgressReportDTO,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.createProgressReport');
    return this.reportingService.createProgressReport(
      createProgressReport,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'progressReportId' })
  @Put('editProgressReport/:progressReportId')
  async editProgressReport(
    @Param('progressReportId') progressReportId: string,
    @Req() request,
    @Body() editProgressReport: EditProgressReportDTO,
  ) {
    Logger.debug('NetworkReportingController.editProgressReport');
    return this.reportingService.editProgressReport(
      progressReportId,
      request.user,
      editProgressReport,
    );
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('progressReportList/:year')
  async getProgressReportList(
    @Req() request,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('NetworkReportingController.getProgressReportList');
    return this.reportingService.getProgressReportList(
      request.user,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiParam({ name: 'progressReportId' })
  @Get('viewProgressReport/:progressReportId')
  async viewProgressReport(
    @Param('progressReportId') progressReportId: string,
  ) {
    Logger.debug('NetworkReportingController.viewProgressReport');
    return this.reportingService.viewProgressReport(progressReportId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'progressReportId' })
  @Put('removeProgressReport/:progressReportId')
  async removeProgressReport(
    @Param('progressReportId') progressReportId: string,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.removeProgressReport');
    return this.reportingService.removeProgressReport(
      progressReportId,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @Post('addAnnualReport')
  async createAnnualReport(
    @Body() createAnnualReport: CreateAnnualReportDTO,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.createAnnualReport');
    return this.reportingService.createAnnualReport(
      createAnnualReport,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'annualReportId' })
  @Put('editAnnualReport/:annualReportId')
  async editAnnualReport(
    @Param('annualReportId') annualReportId: string,
    @Req() request,
    @Body() editAnnualReport: EditAnnualReportDTO,
  ) {
    Logger.debug('NetworkReportingController.editAnnualReport');
    return this.reportingService.editAnnualReport(
      annualReportId,
      request.user,
      editAnnualReport,
    );
  }

  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('annualReportList/:year')
  async getAnnualReportList(
    @Req() request,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('NetworkReportingController.getAnnualReportList');
    return this.reportingService.getAnnualReportList(
      request.user,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
      year,
    );
  }

  @ApiParam({ name: 'annualReportId' })
  @Get('viewAnnualReport/:annualReportId')
  async viewAnnualReport(@Param('annualReportId') annualReportId: string) {
    Logger.debug('NetworkReportingController.viewAnnualReport');
    return this.reportingService.viewAnnualReport(annualReportId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'annualReportId' })
  @Put('removeAnnualReport/:annualReportId')
  async removeAnnualReport(
    @Param('annualReportId') annualReportId: string,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.removeAnnualReport');
    return this.reportingService.removeAnnualReport(
      annualReportId,
      request.user,
    );
  }

  @ApiParam({ name: 'progressReportId' })
  @Get('exportIndividualProgressReport/:progressReportId')
  async exportIndividualProgressReport(
    @Param('progressReportId') progressReportId: string,
    @Res() res,
  ) {
    Logger.debug('NetworkReportingController.exportIndividualProgressReport');
    return this.reportingService.exportIndividualProgressReport(
      res,
      progressReportId,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('exportMultipleProgressReport/:year')
  async exportMultipleProgressReport(
    @Param('year', ParseIntPipe) year: number,
    @Res() res,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.exportMultipleProgressReport');
    return this.reportingService.exportMultipleProgressReport(
      res,
      year,
      request.user,
    );
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'network' })
  @Get('exportGeneralUserMultipleProgressReport/:year')
  async exportGeneralUserMultipleProgressReport(
    @Param('year', ParseIntPipe) year: number,
    @Query('network', ParseBoolPipe) network: boolean,
    @Res() res,
  ) {
    Logger.debug(
      'NetworkReportingController.exportGeneralUserMultipleProgressReport',
    );
    return this.reportingService.exportGeneralUserMultipleProgressReport(
      res,
      year,
      network,
    );
  }

  @ApiParam({ name: 'annualReportId' })
  @Get('exportIndividualAnnualReport/:annualReportId')
  async exportIndividualAnnualReport(
    @Param('annualReportId') annualReportId: string,
    @Res() res,
  ) {
    Logger.debug('NetworkReportingController.exportIndividualAnnualReport');
    return this.reportingService.exportIndividualAnnualReport(
      res,
      annualReportId,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('exportMultipleAnnualReport/:year')
  async exportMultipleAnnualReport(
    @Param('year', ParseIntPipe) year: number,
    @Res() res,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.exportMultipleAnnualReport');
    return this.reportingService.exportMultipleAnnualReport(
      res,
      year,
      request.user,
    );
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'network' })
  @Get('exportGeneralUserMultipleAnnualReport/:year')
  async exportGeneralUserMultipleAnnualReport(
    @Param('year', ParseIntPipe) year: number,
    @Query('network', ParseBoolPipe) network: boolean,
    @Res() res,
  ) {
    Logger.debug(
      'NetworkReportingController.exportGeneralUserMultipleAnnualReport',
    );
    return this.reportingService.exportGeneralUserMultipleAnnualReport(
      res,
      year,
      network,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Post('addInvoice')
  async addInvoice(@Body() addInvoice: AddInvoiceDTO, @Req() request) {
    Logger.debug('NetworkReportingController.addInvoice');
    return this.reportingService.addInvoice(addInvoice, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'invoiceNumber' })
  @Put('editInvoice/:invoiceNumber')
  async editInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() editInvoice: EditInvoiceDTO,
    @Req() request,
  ) {
    Logger.debug('NetworkReportingController.editInvoice');
    return this.reportingService.editInvoice(
      invoiceNumber,
      editInvoice,
      request.user,
    );
  }

  @ApiParam({ name: 'invoiceId' })
  @Get('invoice/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: any) {
    Logger.debug('NetworkReportingController.getInvoice');
    return this.reportingService.getInvoice(invoiceId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'progressReportId' })
  @Put('addInvoiceInProgressReport/:progressReportId')
  async addInvoiceInProgressReport(
    @Param('progressReportId') progressReportId: string,
    @Req() request,
    @Body() invoiceId,
  ) {
    Logger.debug('NetworkReportingController.addInvoiceInProgressReport');
    return this.reportingService.addInvoiceInProgressReport(
      progressReportId,
      request.user,
      invoiceId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @ApiParam({ name: 'annualReportId' })
  @Put('addInvoiceInAnnualReport/:annualReportId')
  async addInvoiceInAnnualReport(
    @Param('annualReportId') annualReportId: string,
    @Req() request,
    @Body() invoiceId,
  ) {
    Logger.debug('NetworkReportingController.addInvoiceInAnnualReport');
    return this.reportingService.addInvoiceInAnnualReport(
      annualReportId,
      request.user,
      invoiceId,
    );
  }

  @ApiParam({ name: 'invoiceId' })
  @Get('downloadInvoice/:invoiceId')
  async downloadInvoice(@Param('invoiceId') invoiceId, @Res() res) {
    Logger.debug('NetworkReportingController.downloadInvoice');
    return this.reportingService.downloadInvoice(res, invoiceId);
  }

  @ApiParam({ name: 'year' })
  @Get('checkIfProgressReportExistsByYear/:year')
  async checkIfProgressReportExistsByYear(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('MelpController.checkIfProgressReportExistsByYear');
    return this.reportingService.checkIfProgressReportExistsByYear(
      year,
      request.user,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('checkIfAnnualReportExistsByYear/:year')
  async checkIfAnnualReportExistsByYear(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('MelpController.checkIfAnnualReportExistsByYear');
    return this.reportingService.checkIfAnnualReportExistsByYear(
      year,
      request.user,
    );
  }
}
