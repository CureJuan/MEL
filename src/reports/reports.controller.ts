import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Logger,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddAdditionalInfoDTO } from 'src/activities/dto/addAdditionalInfo.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/users/enum/role.enum';
import { RolesGuard } from 'src/users/guards/roles.guard';
import RequestWithUser from 'src/users/user.service';
import { docFileFilter } from 'src/utils/file-upload.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddParticipantInfoDTO } from './dto/addParticipantInfo.dto';
import { CreateOutcomeReportDTO } from './dto/createOutcomeReport.dto';
import { CreateOutputReportDTO } from './dto/createOutputReport.dto';
import { EditOutcomeReportDTO } from './dto/editOutcomeReport.dto';
import { EditOutputReportDTO } from './dto/editOutputReport.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports Controller')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @Post('addOutputReport')
  async addOutputReport(
    @Body() createOutputReportDto: CreateOutputReportDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ReportsController.addOutputReport');
    return this.reportsService.addOutputReport(
      createOutputReportDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'outputReportId' })
  @Put('editOutputReport')
  async editOutputReport(
    @Body() editOutputReportDto: EditOutputReportDTO,
    @Query('outputReportId') outputReportId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ReportsController.editOutputReport');
    return this.reportsService.updateReport(
      outputReportId,
      editOutputReportDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @ApiParam({ name: 'outputReportId' })
  @Put('addOrEditParticipantInfo/:outputReportId')
  async addOrEditParticipantInfo(
    @Body() addParticipantInfoDTO: AddParticipantInfoDTO,
    @Param('outputReportId') outputReportId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ReportsController.addOrEditParticipantInfo');
    return this.reportsService.addOrEditParticipantInfo(
      outputReportId,
      addParticipantInfoDTO,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @ApiParam({ name: 'outputReportId' })
  @Put('addOrEditAdditionalInfo/:outputReportId')
  async addOrEditAdditionalInfo(
    @Body() addAdditionalInfoDTO: AddAdditionalInfoDTO,
    @Param('outputReportId') outputReportId: string,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ReportsController.addOrEditAdditionalInfo');
    return this.reportsService.addOrEditAdditionalInfo(
      outputReportId,
      addAdditionalInfoDTO,
      request.user,
    );
  }

  // @UseGuards(RolesGuard)
  // @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  // @ApiQuery({ name: 'reportId' })
  // @Put('editReport')
  // updateReport(
  //   @Query('reportId') reportId: string,
  //   @Body() editReportDTO: EditOutputReportDTO,
  //   @Req() req,
  // ) {
  //   Logger.debug('WorkplanController.updateWorkplan');
  //   return this.reportsService.updateReport(reportId, editReportDTO, req.user);
  // }

  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('getAllOutputReports')
  async getAllOutputReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ReportsController.getAllOutputReports');
    return this.reportsService.getAllOutputReports(
      pageSize,
      pageIndex,
      searchKeyword,
      sortType,
      sortDirection,
      year,
    );
  }

  @ApiQuery({ name: 'outputReportId' })
  @Get('getOutputReportById')
  async getOutputReportById(@Query('outputReportId') outputReportId: string) {
    Logger.debug('ReportsController.getOutputReportById');
    return this.reportsService.getOutputReportById(outputReportId);
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getOutputReportByActivityProposalId')
  async getOutputReportByActivityProposalId(@Query('proposalId') proposalId) {
    Logger.debug('ReportsController.getOutputReportByActivityProposalId');
    Logger.verbose(proposalId);
    return this.reportsService.getOutputReportByActivityProposalId(proposalId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  // @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('allOutputReportsForGeneralUser')
  async allOutputReportsForGeneralUser(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    @Req() req,
  ) {
    Logger.debug('ReportsController.allOutputReportsForGeneralUser');
    return this.reportsService.allOutputReportsForGeneralUser(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      req.user,
    );
  }

  @ApiQuery({ name: 'outputReportId' })
  @Put('deleteOutputReport')
  async deleteOutputReport(
    @Query('outputReportId') outputReportId: string,
    @Req() req,
  ) {
    Logger.debug('ReportsController.deleteOutputReport');
    return this.reportsService.deleteOutputReport(outputReportId, req.user);
  }

  //Network Management API to see all networks output reports(except status = In Progress)
  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('manageNetworkOutputReports')
  async manageNetworkOutputReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    // @Req() req,
  ) {
    Logger.debug('ReportsController.manageNetworkOutputReports');
    return this.reportsService.manageNetworkOutputReports(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      // req.user,
    );
  }

  //Partner Management API to see all partners output reports(except status = In Progress)
  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('managePartnerOutputReports')
  async managePartnerOutputReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    // @Req() req,
  ) {
    Logger.debug('ReportsController.managePartnerOutputReports');
    return this.reportsService.managePartnerOutputReports(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      // req.user,
    );
  }

  @ApiQuery({ name: 'outputReportId' })
  @Get('exportOutputReport')
  async downloadIndividualOutputReport(
    @Query('outputReportId') outputReportId: string,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadIndividualOutputReport');
    return this.reportsService.downloadIndividualOutputReport(
      res,
      outputReportId,
    );
  }

  @ApiQuery({ name: 'year' })
  @Post('multipleOutputReportsExport')
  async downloadMultipleOutputReports(
    @Query('year', ParseIntPipe) year: number,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadMultipleOutputReports');
    return this.reportsService.downloadMultipleOutputReports(res, year);
  }

  /**Outcome Report APIs */
  @ApiQuery({ name: 'year' })
  @ApiQuery({ name: 'activityCode' })
  @Get('getEnrolledCount')
  async getEnrolledCount(
    @Query('year', ParseIntPipe) year: number,
    @Query('activityCode') activityCode: string,
  ) {
    Logger.debug('ReportsController.getEnrolledCount');
    return this.reportsService.getEnrolledCount(activityCode, year);
  }

  @Post('addOutcomeReport')
  async addOutcomeReport(
    @Body() createOutcomeReportDto: CreateOutcomeReportDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('ReportsController.addOutcomeReport');
    return this.reportsService.addOutcomeReport(
      createOutcomeReportDto,
      request.user,
    );
  }

  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('getAllOutcomeReports')
  async getAllOutcomeReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('ReportsController.getAllOutcomeReports');
    return this.reportsService.getAllOutcomeReports(
      pageSize,
      pageIndex,
      searchKeyword,
      sortType,
      sortDirection,
      year,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  // @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('allOutcomeReportsForGeneralUser')
  async allOutcomeReportsForGeneralUser(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    @Req() req,
  ) {
    Logger.debug('ReportsController.allOutcomeReportsForGeneralUser');
    return this.reportsService.allOutcomeReportsForGeneralUser(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      req.user,
    );
  }

  @ApiQuery({ name: 'outcomeReportId' })
  @Get('getOutcomeReportById')
  async getOutcomeReportById(
    @Query('outcomeReportId') outcomeReportId: string,
  ) {
    Logger.debug('ReportsController.getOutcomeReportById');
    return this.reportsService.getOutcomeReportById(outcomeReportId);
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getOutcomeReportByActivityProposalId')
  async getOutcomeReportByActivityProposalId(@Query('proposalId') proposalId) {
    Logger.debug('ReportsController.getOutcomeReportByActivityProposalId');
    Logger.verbose(proposalId);
    return this.reportsService.getOutcomeReportByActivityProposalId(proposalId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'outcomeReportId' })
  @Put('editOutcomeReport')
  editOutcomeReport(
    @Query('outcomeReportId') reportId: string,
    @Body() editReportDTO: EditOutcomeReportDTO,
    @Req() req,
  ) {
    Logger.debug('ReportsController.editOutcomeReport');
    return this.reportsService.updateOutcomeReport(
      reportId,
      editReportDTO,
      req.user,
    );
  }

  @ApiQuery({ name: 'outcomeReportId' })
  @Put('deleteOutcomeReport')
  async deleteOutcomeReport(
    @Query('outcomeReportId') outcomeReportId: string,
    @Req() req,
  ) {
    Logger.debug('ReportsController.deleteOutcomeReport');
    return this.reportsService.deleteOutcomeReport(outcomeReportId, req.user);
  }

  //Network Management API to see all networks outcome reports(except status = In Progress)
  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  // @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('manageNetworkOutcomeReports')
  async manageNetworkOutcomeReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    // @Req() req,
  ) {
    Logger.debug('ReportsController.manageNetworkOutcomeReports');
    return this.reportsService.manageNetworkOutcomeReports(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      // req.user,
    );
  }

  //Partner Management API to see all networks outcome reports(except status = In Progress)
  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  //  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('managePartnerOutcomeReports')
  async managePartnerOutcomeReports(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    // @Req() req,
  ) {
    Logger.debug('ReportsController.managePartnerOutcomeReports');
    return this.reportsService.managePartnerOutcomeReports(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
      // req.user,
    );
  }

  @ApiQuery({ name: 'outcomeReportId' })
  @Get('exportOutcomeReport')
  async downloadIndividualOutcomeReport(
    @Query('outcomeReportId') outcomeReportId: string,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadIndividualOutcomeReport');
    return this.reportsService.downloadIndividualOutcomeReport(
      res,
      outcomeReportId,
    );
  }

  @ApiQuery({ name: 'outcomeReportId' })
  @Get('exportAllOutcomeReports')
  async downloadAllOutcomeReports(
    @Query('year', ParseIntPipe) year: number,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadAllOutcomeReports');
    return this.reportsService.downloadMultipleOutcomeReports(res, year);
  }

  @ApiParam({ name: 'outputReportId' })
  @Put('addInvoiceInOutputReport/:outputReportId')
  async addInvoiceInOutputReport(
    @Param('outputReportId') outputReportId: string,
    @Req() request,
    @Body() invoiceId,
  ) {
    Logger.debug('NetworkReportingController.addInvoiceInOutputReport');
    return this.reportsService.addInvoiceInOutputReport(
      outputReportId,
      request.user,
      invoiceId,
    );
  }

  @ApiParam({ name: 'outcomeReportId' })
  @Put('addInvoiceInOutcomeReport/:outcomeReportId')
  async addInvoiceInOutcomeReport(
    @Param('outcomeReportId') outcomeReportId: string,
    @Req() request,
    @Body() invoiceId,
  ) {
    Logger.debug('ReportsController.addInvoiceInOutcomeReport');
    return this.reportsService.addInvoiceInOutcomeReport(
      outcomeReportId,
      request.user,
      invoiceId,
    );
  }

  /**CRUD for AWS S3*/
  @Post('uploadReport')
  @UseInterceptors(
    FileInterceptor('file', {
      // fileFilter: docFileFilter,
      //file size allowed 5MB
      // limits: { fileSize: 5000000 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadReport(@UploadedFile() file) {
    Logger.debug('ReportsController.uploadReport');
    console.log('file = ', file);
    return this.reportsService.uploadFile(file);
  }

  @Get('getAllFilesFromS3')
  async getAllFilesFromS3() {
    Logger.debug('ReportsController.getAllFilesFromS3');
    return this.reportsService.getAllFilesFromS3();
  }

  @Get('getEachFileByKeyFromS3')
  @ApiQuery({ name: 'fileKey' })
  async getEachFileByKeyFromS3(@Query('fileKey') fileKey: string) {
    Logger.debug('ReportsController.getEachFileByKeyFromS3');
    return this.reportsService.getEachFileByKeyFromS3(fileKey);
  }

  @Put('deletePublicFile')
  @ApiQuery({ name: 'fileKey' })
  async deletePublicFile(@Query('fileKey') fileKey: string) {
    Logger.debug('ReportsController.deletePublicFile');
    return this.reportsService.deletePublicFile(fileKey);
  }

  @Get('getSignedUrl')
  @ApiQuery({ name: 'fileKey' })
  async getSignedUrl(@Query('fileKey') fileKey: string) {
    Logger.debug('ReportsController.getSignedUrl');
    return this.reportsService.getSignedUrl(fileKey);
  }

  /**Upload to Azure Blob service */
  @Post('uploadSingleFileToAzureBlob')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: docFileFilter,
      // //file size allowed 5MB
      // limits: { fileSize: 5000000 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadSingleFileToAzureBlob(@UploadedFile() file) {
    Logger.debug('ReportsController.uploadSingleFileToAzureBlob');
    console.log('file = ', file);
    return this.reportsService.uploadSingleFileToAzureBlob(file);
  }

  @Get('getAllAzureContainers')
  async getAllAzureContainers() {
    Logger.debug('ReportsController.getAllAzureContainers');
    return this.reportsService.getAllAzureContainers();
  }
  @Get('getAllFilesFromAzure')
  async getAllAzureBlobs() {
    Logger.debug('ReportsController.getAllAzureBlobs');
    return this.reportsService.getAllAzureBlobs();
  }

  @ApiQuery({ name: 'filename' })
  @Get('readSingleFileFromAzureBlob')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
  @Header(
    'Content-Disposition',
    `attachment; filename=additional-information.docx`,
  )
  async readSingleFileFromAzureBlob(@Res() res, @Query('filename') filename) {
    Logger.debug('ReportsController.readSingleFileFromAzureBlob');
    Logger.debug(filename);
    const file = await this.reportsService.readSingleFileFromAzureBlob(
      filename,
    );
    return file.pipe(res);
  }

  @ApiQuery({ name: 'containerName' })
  @Delete('deleteContainer')
  async deleteContainer(@Query('containerName') containerName) {
    Logger.debug('ReportsController.deleteContainer');

    return this.reportsService.deleteContainer(containerName);
  }

  @ApiQuery({ name: 'filename' })
  @ApiQuery({ name: 'requestId' })
  @ApiQuery({ name: 'reportId' })
  @ApiQuery({ name: 'infoFile' })
  @Put('deleteOutputFileFromAzure')
  async deleteOutputFileFromAzure(
    @Query('filename') filename: string,
    @Query('requestId') requestId: string,
    @Query('reportId') reportId: string,
    @Query('infoFile', ParseBoolPipe) infoFile: boolean,
    @Req() request,
  ) {
    Logger.debug('ReportsController.deleteOutputFileFromAzure');

    await this.reportsService.deleteOutputFileFromAzure(
      filename,
      requestId,
      reportId,
      request.user,
      infoFile
    );
    return 'File deleted successfully.';
  }



  @ApiQuery({ name: 'filename' })
  @ApiQuery({ name: 'requestId' })
  @ApiQuery({ name: 'reportId' })
  @Put('deleteOutcomeFileFromAzure')
  async deleteOutcomeFileFromAzure(
    @Query('filename') filename: string,
    @Query('requestId') requestId: string,
    @Query('reportId') reportId: string,
    @Req() request,
  ) {
    Logger.debug('ReportsController.deleteOutcomeFileFromAzure');

    await this.reportsService.deleteOutcomeFileFromAzure(
      filename,
      requestId,
      reportId,
      request.user,
    );
    return 'File deleted successfully.';
  }

  /**Final Save Output Reports for CAP-NET */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'outputReportId' })
  @Put('finalSaveOutputReport/:outputReportId')
  async finalSaveOutputReport(
    @Param('outputReportId') outputReportId: string,
    // @Req() request,
  ) {
    Logger.debug('ReportsController.finalSaveOutputReport');

    return this.reportsService.finalSaveOutputReport(
      outputReportId,
      // request.user,
    );
  }

  /**Final Save Outcome Reports for CAP-NET */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiParam({ name: 'outcomeReportId' })
  @Put('finalSaveOutcomeReport/:outcomeReportId')
  async finalSaveOutcomeReport(
    @Param('outcomeReportId') outcomeReportId: string,
    // @Req() request,
  ) {
    Logger.debug('ReportsController.finalSaveOutcomeReport');

    return this.reportsService.finalSaveOutcomeReport(
      outcomeReportId,
      // request.user,
    );
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'isNetwork' })
  @Get('downloadGeneralUserMultipleOutputReport/:year')
  async downloadGeneralUserMultipleOutputReport(
    @Param('year', ParseIntPipe) year: number,
    @Query('isNetwork', ParseBoolPipe) isNetwork: boolean,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadGeneralUserMultipleWorkplan');
    return this.reportsService.downloadGeneralUserMultipleOutputReport(
      res,
      year,
      isNetwork,
    );
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'isNetwork' })
  @Get('downloadGeneralUserMultipleOutcomeReport/:year')
  async downloadGeneralUserMultipleOutcomeReport(
    @Param('year', ParseIntPipe) year: number,
    @Query('isNetwork', ParseBoolPipe) isNetwork: boolean,
    @Res() res,
  ) {
    Logger.debug('ReportsController.downloadGeneralUserMultipleWorkplan');
    return this.reportsService.downloadGeneralUserMultipleOutcomeReport(
      res,
      year,
      isNetwork,
    );
  }

  @ApiParam({ name: 'activityCode' })
  @Get('outputReportByActivityCode/:activityCode')
  async outputReportByActivityCode(
    @Param('activityCode') activityCode: string,
  ) {
    Logger.debug('ReportsController.outputReportByActivityCode');
    return this.reportsService.outputReportByActivityCode(activityCode);
  }

  @ApiParam({ name: 'activityCode' })
  @Get('outcomeReportByActivityCode/:activityCode')
  async outcomeReportByActivityCode(
    @Param('activityCode') activityCode: string,
  ) {
    Logger.debug('ReportsController.outcomeReportByActivityCode');
    return this.reportsService.outcomeReportByActivityCode(activityCode);
  }

  @ApiParam({ name: 'year' })
  @Get('validateOnYearForOutcomeReport/:year')
  async validateOnYearForOutcomeReport(
    @Param('year', ParseIntPipe) year: number,
    @Req() req,
  ) {
    Logger.debug('ReportsController.validateOnYearForOutcomeReport');
    return this.reportsService.validateOnYearForOutcomeReport(year, req.user);
  }
}
