import {
  Controller,
  Logger,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../users/enum/role.enum';
import { RolesGuard } from '../users/guards/roles.guard';
import { ApprovalHierarchyService } from './approvalHierarchy.service';
import CreateHierarchyDto from './dto/createHierarchy.dto';
import SendForApprovalDto from './dto/sendForApproval.dto';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import DenyRequestDto from './dto/denyRequest.dto';

@UseGuards(JwtAuthGuard)
@Controller('approval')
@ApiTags('Approval Hierarchy Controller')
export class ApprovalHierarchyController {
  constructor(
    private readonly approvalHierarchyService: ApprovalHierarchyService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('addApprovers')
  async addApprovers(@Body() approval: CreateHierarchyDto) {
    Logger.debug('ApprovalHierarchyController.addApprovers');
    return this.approvalHierarchyService.addApprovers(approval);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiParam({ name: 'approvalType' })
  @Get(':approvalType')
  async getApprovers(@Param('approvalType') approvalType: string) {
    Logger.debug('ApprovalHierarchyController.getApprovers');
    return this.approvalHierarchyService.getApprovers(approvalType);
  }

  /* Send For Approval Routes*/
  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Post('sendForApproval')
  async sendForApproval(
    @Body() sendForApprovalDto: SendForApprovalDto,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.sendForApproval');
    return this.approvalHierarchyService.sendWorkplanForApproval(
      sendForApprovalDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Put('sendProposalForApproval')
  async sendProposalForApproval(
    @Body() sendForApprovalDto: SendForApprovalDto,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.sendProposalForApproval');
    return this.approvalHierarchyService.sendProposalForApproval(
      sendForApprovalDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Put('sendMelpForApproval')
  async sendMelpForApproval(
    @Body() sendForApprovalDto: SendForApprovalDto,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.sendMelpForApproval');
    return this.approvalHierarchyService.sendMelpForApproval(
      sendForApprovalDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Put('sendImpactStoryForApproval')
  async sendImpactStoryForApproval(
    @Req() request,
    @Body() sendForApprovalDto: SendForApprovalDto,
  ) {
    Logger.debug('ApprovalHierarchyController.sendImpactStoryForApproval');
    return this.approvalHierarchyService.sendImpactStoryForApproval(
      sendForApprovalDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Put('sendOutputReportForApproval')
  async sendOutputReportForApproval(
    @Req() request,
    @Body() sendForApprovalDto: SendForApprovalDto,
  ) {
    Logger.debug('ApprovalHierarchyController.sendOutputReportForApproval');
    return this.approvalHierarchyService.sendOutputReportForApproval(
      sendForApprovalDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @Put('sendOutcomeReportForApproval')
  async sendOutcomeReportForApproval(
    @Req() request,
    @Body() sendForApprovalDto: SendForApprovalDto,
  ) {
    Logger.debug('ApprovalHierarchyController.sendOutcomeReportForApproval');
    return this.approvalHierarchyService.sendOutcomeReportForApproval(
      sendForApprovalDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @Put('sendProgressReportForApproval')
  async sendProgressReportForApproval(
    @Req() request,
    @Body() sendForApprovalDto: SendForApprovalDto,
  ) {
    Logger.debug('ApprovalHierarchyController.sendProgressReportForApproval');
    return this.approvalHierarchyService.sendProgressReportForApproval(
      sendForApprovalDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK)
  @Put('sendAnnualReportForApproval')
  async sendAnnualReportForApproval(
    @Req() request,
    @Body() sendForApprovalDto: SendForApprovalDto,
  ) {
    Logger.debug('ApprovalHierarchyController.sendAnnualReportForApproval');
    return this.approvalHierarchyService.sendAnnualReportForApproval(
      sendForApprovalDto,
      request.user,
    );
  }

  /* Request For Info Rotes */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('proposalRequestForInformation')
  async proposalRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug('ApprovalHierarchyController.proposalRequestForInformation');
    return this.approvalHierarchyService.proposalRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('melpRequestForInformation')
  async melpRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug('ApprovalHierarchyController.melpRequestForInformation');
    return this.approvalHierarchyService.melpRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('workplanRequestForInformation')
  async workplanRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug('ApprovalHierarchyController.workplanRequestForInformation');
    return this.approvalHierarchyService.workplanRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('impactStoryRequestForInformation')
  async impactStoryRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug(
      'ApprovalHierarchyController.impactStoryRequestForInformation',
    );
    return this.approvalHierarchyService.impactStoryRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('outputReportRequestForInformation')
  async outputReportRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug(
      'ApprovalHierarchyController.outputReportRequestForInformation',
    );
    return this.approvalHierarchyService.outputReportRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('outcomeReportRequestForInformation')
  async outcomeReportRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug(
      'ApprovalHierarchyController.outcomeReportRequestForInformation',
    );
    return this.approvalHierarchyService.outcomeReportRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('progressReportRequestForInformation')
  async progressReportRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug(
      'ApprovalHierarchyController.progressReportRequestForInformation',
    );
    return this.approvalHierarchyService.progressReportRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('annualReportRequestForInformation')
  async annualReportRequestForInformation(
    @Body() requestForInformationDto: DenyRequestDto,
    @Req() request,
  ) {
    Logger.debug(
      'ApprovalHierarchyController.annualReportRequestForInformation',
    );
    return this.approvalHierarchyService.annualReportRequestForInformation(
      requestForInformationDto,
      request.user,
    );
  }

  /* Deny Routes */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyProposal')
  async denyProposal(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyProposal');
    return this.approvalHierarchyService.denyProposal(denyRequestDto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyMelp')
  async denyMelp(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyMelp');
    return this.approvalHierarchyService.denyMelp(denyRequestDto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyWorkplan')
  async denyWorkplan(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyWorkplan');
    return this.approvalHierarchyService.denyWorkplan(denyRequestDto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyImpactStory')
  async denyImpactStory(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyImpactStory');
    return this.approvalHierarchyService.denyImpactStory(
      denyRequestDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyOutputReport')
  async denyOutputReport(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyOutputReport');
    return this.approvalHierarchyService.denyOutputReport(
      denyRequestDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyOutcomeReport')
  async denyOutcomeReport(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyOutcomeReport');
    return this.approvalHierarchyService.denyOutcomeReport(
      denyRequestDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyProgressReport')
  async denyProgressReport(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyProgressReport');
    return this.approvalHierarchyService.denyProgressReport(
      denyRequestDto,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Put('denyAnnualReport')
  async denyAnnualReport(@Body() denyRequestDto: DenyRequestDto, @Req() req) {
    Logger.debug('ApprovalHierarchyController.denyAnnualReport');
    return this.approvalHierarchyService.denyAnnualReport(
      denyRequestDto,
      req.user,
    );
  }
  /* Approve Routes */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'workplanId' })
  @Put('approveWorkplan')
  async approveWorkplan(@Query('workplanId') workplanId: string, @Req() req) {
    Logger.debug('ApprovalHierarchyController.approveWorkplan');
    return this.approvalHierarchyService.approveWorkplan(workplanId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'melpId' })
  @Put('approveMelp')
  async approveMelp(@Query('melpId') melpId: string, @Req() req) {
    Logger.debug('ApprovalHierarchyController.approveMelp');
    return this.approvalHierarchyService.approveMelp(melpId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'activityProposalId' })
  @Put('approveProposal')
  async approveProposal(
    @Query('activityProposalId') activityProposalId: string,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.approveProposal');
    return this.approvalHierarchyService.approveProposal(
      activityProposalId,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'impactStoryId' })
  @Put('approveImpactStory')
  async approveImpactStory(
    @Query('impactStoryId') impactStoryId: string,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.approveImpactStory');
    return this.approvalHierarchyService.approveImpactStory(
      impactStoryId,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'reportId' })
  @Put('approveOutputReport')
  async approveOutputReport(@Query('reportId') reportId: string, @Req() req) {
    Logger.debug('ApprovalHierarchyController.approveOutputReport');
    return this.approvalHierarchyService.approveOutputReport(
      reportId,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'progressReportId' })
  @Put('approveProgressReport')
  async approveProgressReport(
    @Query('progressReportId') progressReportId: string,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.approveProgressReport');
    return this.approvalHierarchyService.approveProgressReport(
      progressReportId,
      req.user,
    );
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'reportId' })
  @Put('approveOutcomeReport')
  async approveOutcomeReport(@Query('reportId') reportId: string, @Req() req) {
    Logger.debug('ApprovalHierarchyController.approveOutcomeReport');
    return this.approvalHierarchyService.approveOutcomeReport(
      reportId,
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'annualReportId' })
  @Put('approveAnnualReport')
  async approveAnnualReport(
    @Query('annualReportId') annualReportId: string,
    @Req() req,
  ) {
    Logger.debug('ApprovalHierarchyController.approveAnnualReport');
    return this.approvalHierarchyService.approveAnnualReport(
      annualReportId,
      req.user,
    );
  }
}
