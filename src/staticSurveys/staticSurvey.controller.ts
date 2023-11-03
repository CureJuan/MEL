import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Put,
  UseGuards,
  Res,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../users/user.service';
import { EntrySurveyResponseDTO } from './dto/entrySurveyResponse.dto';
import { SurveyFormDTO } from './dto/surveyForm.dto';
import { StaticSurveyService } from './staticSurvey.service';
import { ExitSurveyResponseDTO } from './dto/exitSurveyResponse.dto';
import { ActivateOrDeactivateSurveyLinkDTO } from './dto/activateOrDeactivateSurvey.dto';
import { OutcomeSurveyResponseDTO } from './dto/outcomeSurveyResponse.dto';
import { RolesGuard } from 'src/users/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/users/enum/role.enum';

@ApiTags('Surveys')
@Controller('survey')
export class StaticSurveyController {
  constructor(private readonly surveyService: StaticSurveyService) {}
  @Get('staticData')
  async getStaticDataTables() {
    Logger.debug('StaticSurveyController.getStaticDataTables');
    return this.surveyService.getStaticDataTables();
  }

  // Entry Surveys
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('getEntrySurveys/:year')
  async getEntrySurveysList(
    @Req() request: RequestWithUser,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('StaticSurveyController.getEntrySurveysList');
    return this.surveyService.getEntrySurveysList(
      request.user,
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'entrySurveyFormId' })
  @Get('entrySurveyForm')
  async getEntrySurveyForm(
    @Query('entrySurveyFormId') entrySurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyController.getEntrySurveyForm');
    return this.surveyService.getEntrySurveyFormData(entrySurveyFormId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('addEntrySurveyForm')
  async addEntrySurveyForm(
    @Body() entrySurveyFormDto: SurveyFormDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.addEntrySurveyForm');
    return this.surveyService.addEntrySurveyForm(
      entrySurveyFormDto,
      request.user,
    );
  }

  @ApiQuery({ name: 'entrySurveyFormId' })
  @Post('entrySurveyResponse')
  async entrySurveyResponse(
    @Body() entrySurveyResponseDto: EntrySurveyResponseDTO,
    @Query('entrySurveyFormId') entrySurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyController.entrySurveyResponse');
    return this.surveyService.entrySurveyResponse(
      entrySurveyResponseDto,
      entrySurveyFormId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiParam({ name: 'proposalId' })
  @Get('getEntrySurveyResponsesList/:proposalId')
  async getEntrySurveyResponsesList(
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Param('proposalId') proposalId,
    // @Req() request,
  ) {
    Logger.debug('StaticSurveyController.getEntrySurveyResponsesList');
    return this.surveyService.getEntrySurveyResponsesList(
      // request.user,
      pageLimit,
      pageIndex,
      proposalId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Put('activateOrDeactivateEntrySurveyLink')
  async activateOrDeactivateEntrySurveyLink(
    @Body() entrySurvey: ActivateOrDeactivateSurveyLinkDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.activateOrDeactivateEntrySurveyLink');
    return this.surveyService.activateOrDeactivateEntrySurveyLink(
      entrySurvey.action,
      entrySurvey.surveyId,
      request.user,
    );
  }

  @ApiQuery({ name: 'entrySurveyFormId' })
  @Get('export/entrySurveyResponse')
  async downloadEntrySurveyResponses(
    @Query('entrySurveyFormId') entrySurveyFormId: string,
    @Res() res,
  ) {
    Logger.debug('StaticSurveyController.downloadEntrySurveyResponses');
    return this.surveyService.downloadEntrySurveyResponses(
      res,
      entrySurveyFormId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('export/entrySurveyResponseByProposalId')
  async downloadEntrySurveyResponsesByProposalId(
    @Query('proposalId') proposalId,
    @Res() res,
  ) {
    Logger.debug(
      'StaticSurveyController.downloadEntrySurveyResponsesByProposalId',
    );
    return this.surveyService.downloadEntrySurveyResponsesByProposalId(
      res,
      proposalId,
    );
  }

  // Exit Surveys
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('getExitSurveys/:year')
  async getExitSurveysList(
    @Req() request: RequestWithUser,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('StaticSurveyController.getExitSurveysList');
    return this.surveyService.getExitSurveysList(
      request.user,
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'exitSurveyFormId' })
  @Get('exitSurveyForm')
  async getExitSurveyForm(@Query('exitSurveyFormId') exitSurveyFormId: string) {
    Logger.debug('StaticSurveyController.getExitSurveyForm');
    return this.surveyService.getExitSurveyFormData(exitSurveyFormId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('addExitSurveyForm')
  async addExitSurveyForm(
    @Body() exitSurveyFormDto: SurveyFormDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.addExitSurveyForm');
    return this.surveyService.addExitSurveyForm(
      exitSurveyFormDto,
      request.user,
    );
  }

  @ApiQuery({ name: 'exitSurveyFormId' })
  @Post('exitSurveyResponse')
  async exitSurveyResponse(
    @Body() exitSurveyResponseDto: ExitSurveyResponseDTO,
    @Query('exitSurveyFormId') exitSurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyController.exitSurveyResponse');
    return this.surveyService.exitSurveyResponse(
      exitSurveyResponseDto,
      exitSurveyFormId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiParam({ name: 'proposalId' })
  @Get('getExitSurveyResponsesList/:proposalId')
  async getExitSurveyResponsesList(
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Param('proposalId') proposalId,
    // @Req() request,
  ) {
    Logger.debug('StaticSurveyController.getExitSurveyResponsesList');
    return this.surveyService.getExitSurveyResponsesList(
      // request.user,
      pageLimit,
      pageIndex,
      proposalId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Put('activateOrDeactivateExitSurveyLink')
  async activateOrDeactivateExitSurveyLink(
    @Body() exitSurvey: ActivateOrDeactivateSurveyLinkDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.activateOrDeactivateExitSurveyLink');
    return this.surveyService.activateOrDeactivateExitSurveyLink(
      exitSurvey.action,
      exitSurvey.surveyId,
      request.user,
    );
  }

  @ApiQuery({ name: 'exitSurveyFormId' })
  @Get('export/exitSurveyResponse')
  async downloadExitSurveyResponses(
    @Query('exitSurveyFormId') exitSurveyFormId: string,
    @Res() res,
  ) {
    Logger.debug('StaticSurveyController.downloadExitSurveyResponses');
    return this.surveyService.downloadExitSurveyResponses(
      res,
      exitSurveyFormId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('export/exitSurveyResponseByProposalId')
  async downloadExitSurveyResponsesByProposalId(
    @Query('proposalId') proposalId,
    @Res() res,
  ) {
    Logger.debug(
      'StaticSurveyController.downloadExitSurveyResponsesByProposalId',
    );
    return this.surveyService.downloadExitSurveyResponsesByProposalId(
      res,
      proposalId,
    );
  }

  //Outcome Survey
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'year' })
  @Get('getOutcomeSurveys/:year')
  async getOutcomeSurveysList(
    @Req() request: RequestWithUser,
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('StaticSurveyController.getOutcomeSurveysList');
    return this.surveyService.getOutcomeSurveysList(
      request.user,
      year,
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  // @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'outcomeSurveyFormId' })
  @Get('outcomeSurveyForm')
  async getOutcomeSurveyForm(
    @Query('outcomeSurveyFormId') outcomeSurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyController.getOutcomeSurveyForm');
    return this.surveyService.getOutcomeSurveyFormData(outcomeSurveyFormId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('addOutcomeSurveyForm')
  async addOutcomeSurveyForm(
    @Body() outcomeSurveyFormDto: SurveyFormDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.addOutcomeSurveyForm');
    return this.surveyService.addOutcomeSurveyForm(
      outcomeSurveyFormDto,
      request.user,
    );
  }

  @ApiQuery({ name: 'outcomeSurveyFormId' })
  @Post('outcomeSurveyResponse')
  async outcomeSurveyResponse(
    @Body() outcomeSurveyResponseDto: OutcomeSurveyResponseDTO,
    @Query('outcomeSurveyFormId') outcomeSurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyController.outcomeSurveyResponse');
    return this.surveyService.outcomeSurveyResponse(
      outcomeSurveyResponseDto,
      outcomeSurveyFormId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiParam({ name: 'proposalId' })
  @Get('getOutcomeSurveyResponsesList/:proposalId')
  async getOutcomeSurveyResponsesList(
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Param('proposalId') proposalId,
    // @Req() request,
  ) {
    Logger.debug('StaticSurveyController.getOutcomeSurveyResponsesList');
    return this.surveyService.getOutcomeSurveyResponsesList(
      // request.user,
      pageLimit,
      pageIndex,
      proposalId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Put('activateOrDeactivateOutcomeSurveyLink')
  async activateOrDeactivateOutcomeSurveyLink(
    @Body() outcomeSurvey: ActivateOrDeactivateSurveyLinkDTO,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.activateOrDeactivateOutcomeSurveyLink',
    );
    return this.surveyService.activateOrDeactivateOutcomeSurveyLink(
      outcomeSurvey.action,
      outcomeSurvey.surveyId,
      request.user,
    );
  }

  @ApiQuery({ name: 'outcomeSurveyFormId' })
  @Get('export/outcomeSurveyResponse')
  async downloadOutcomeSurveyResponses(
    @Query('outcomeSurveyFormId') outcomeSurveyFormId: string,
    @Res() res,
  ) {
    Logger.debug('StaticSurveyController.downloadOutcomeSurveyResponses');
    return this.surveyService.downloadOutcomeSurveyResponses(
      res,
      outcomeSurveyFormId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('export/outcomeSurveyResponseByProposalId')
  async downloadOutcomeSurveyResponsesByProposalId(
    @Query('proposalId') proposalId,
    @Res() res,
  ) {
    Logger.debug(
      'StaticSurveyController.downloadOutcomeSurveyResponsesByProposalId',
    );
    return this.surveyService.downloadOutcomeSurveyResponsesByProposalId(
      res,
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurvey')
  async getGenderCountForOutcomeSurvey(@Query('proposalId') proposalId) {
    Logger.debug('StaticSurveyController.getGenderCountForOutcomeSurvey');
    return this.surveyService.getGenderCountForOutcomeSurvey(proposalId);
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysRelevantInstitution')
  async getGenderCountForOutcomeSurveysRelevantInstitution(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysRelevantInstitution',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysRelevantInstitution(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysRaisingAwareness')
  async getGenderCountForOutcomeSurveysRaisingAwareness(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysRaisingAwareness',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysRaisingAwareness(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysRoutine')
  async getGenderCountForOutcomeSurveysRoutine(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysRoutine',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysRoutine(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysEducational')
  async getGenderCountForOutcomeSurveysEducational(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysEducational',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysEducational(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysImplementations')
  async getGenderCountForOutcomeSurveysImplementations(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysImplementations',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysImplementations(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysInnovation')
  async getGenderCountForOutcomeSurveysInnovation(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysInnovation',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysInnovation(
      proposalId,
    );
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysSDG')
  async getGenderCountForOutcomeSurveysSDG(@Query('proposalId') proposalId) {
    Logger.debug('StaticSurveyController.getGenderCountForOutcomeSurveysSDG');
    return this.surveyService.getGenderCountForOutcomeSurveysSDG(proposalId);
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getGenderCountForOutcomeSurveysPolicy')
  async getGenderCountForOutcomeSurveysPolicy(@Query('proposalId') proposalId) {
    Logger.debug(
      'StaticSurveyController.getGenderCountForOutcomeSurveysPolicy',
    );
    return this.surveyService.getGenderCountForOutcomeSurveysPolicy(proposalId);
  }

  @ApiQuery({ name: 'proposalId' })
  @Get('getInstitutionTypeCountForOutcomeSurveysRelevantInstitution')
  async getInstitutionTypeCountForOutcomeSurveysRelevantInstitution(
    @Query('proposalId') proposalId,
  ) {
    Logger.debug(
      'StaticSurveyController.getInstitutionTypeCountForOutcomeSurveysRelevantInstitution',
    );
    return this.surveyService.getInstitutionTypeCountForOutcomeSurveysRelevantInstitution(
      proposalId,
    );
  }

  // Count API's for Output-Report
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantsEnrolledGenderWiseCount')
  async getParticipantsEnrolledGenderWiseCount(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantsEnrolledGenderWiseCount',
    );
    return this.surveyService.getParticipantsEnrolledGenderWiseCount(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantsCompletedActivityGenderWiseCount')
  async getParticipantsCompletedActivityGenderWiseCount(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantsCompletedActivityGenderWiseCount',
    );
    return this.surveyService.getParticipantsCompletedActivityGenderWiseCount(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByAgeGroup')
  async getParticipantCountByAgeGroup(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getParticipantCountByAgeGroup');
    return this.surveyService.getParticipantCountByAgeGroup(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByRegion')
  async getParticipantCountByRegion(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getParticipantCountByRegion');
    return this.surveyService.getParticipantCountByRegion(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByTypeOfInstitution')
  async getParticipantCountByTypeOfInstitution(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantCountByTypeOfInstitution',
    );
    return this.surveyService.getParticipantCountByTypeOfInstitution(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getCapnetAffiliationCount')
  async getCapnetAffiliationCount(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getCapnetAffiliationCount');
    return this.surveyService.getCapnetAffiliationCount(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountBeforeKnowledgeRating')
  async getParticipantCountBeforeKnowledgeRating(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantCountBeforeKnowledgeRating',
    );
    return this.surveyService.getParticipantCountBeforeKnowledgeRating(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountAfterDegreeOfKnowledge')
  async getParticipantCountAfterDegreeOfKnowledge(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantCountAfterDegreeOfKnowledge',
    );
    return this.surveyService.getParticipantCountAfterDegreeOfKnowledge(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByBeneficiality')
  async getParticipantCountByBeneficiality(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getParticipantCountByBeneficiality');
    return this.surveyService.getParticipantCountByBeneficiality(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByRelevance')
  async getParticipantCountByRelevance(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getParticipantCountByRelevance');
    return this.surveyService.getParticipantCountByRelevance(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByExpectationLevel')
  async getParticipantCountByExpectationLevel(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantCountByExpectationLevel',
    );
    return this.surveyService.getParticipantCountByExpectationLevel(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getKnowledgeApplicationParticipantCountPerInstitute')
  async getParticipantCountByKnowledgeApplication(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getKnowledgeApplicationParticipantCountPerInstitute',
    );
    return this.surveyService.getKnowledgeApplicationParticipantCountPerInstitute(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountByKnowledgeShared')
  async getParticipantCountByKnowledgeShared(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug('StaticSurveyController.getParticipantCountByKnowledgeShared');
    return this.surveyService.getParticipantCountByKnowledgeShared(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantGenderCountByKnowledgeApplied')
  async getParticipantGenderCountByKnowledgeApplied(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantGenderCountByKnowledgeApplied',
    );
    return this.surveyService.getParticipantCountByKnowledgeApplied(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantCountKnowledgeAppliedByInstitution')
  async getParticipantCountKnowledgeAppliedByInstitution(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantCountKnowledgeAppliedByInstitution',
    );
    return this.surveyService.getParticipantCountKnowledgeAppliedByInstitution(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getCountryCountForRelevantInstitutionChange')
  async getCountryCountForRelevantInstitutionChange(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getCountryCountForRelevantInstitutionChange',
    );
    return this.surveyService.getCountryCountForRelevantInstitutionChange(
      proposalId,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'proposalId' })
  @Get('getParticipantProfileDemographicCountry')
  async getParticipantProfileDemographicCountry(
    @Query('proposalId') proposalId,
    @Req() request: RequestWithUser,
  ) {
    Logger.debug(
      'StaticSurveyController.getParticipantProfileDemographicCountry',
    );
    return this.surveyService.getParticipantProfileDemographicCountry(
      proposalId,
      request.user,
    );
  }
}
