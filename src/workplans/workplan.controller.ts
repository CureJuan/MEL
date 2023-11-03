import {
  Controller,
  Get,
  UseGuards,
  Query,
  Logger,
  ParseIntPipe,
  Post,
  Req,
  Put,
  Body,
  Param,
  Res,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateActivityDTO } from '../activities/dto/create-activity.dto';
import { EditActivityDTO } from '../activities/dto/edit-activity.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enum/role.enum';
import { RolesGuard } from '../users/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkplanDTO } from './dto/create-workplan.dto';
import { WorkplanService } from './workplan.service';
import { Response } from 'express';

@ApiTags('Workplan Controller')
@UseGuards(JwtAuthGuard)
@Controller('workplan')
export class WorkplanController {
  constructor(private readonly workplanService: WorkplanService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @Post('createWorkplan')
  async createWorkplan(
    @Body() createWorkplanDto: CreateWorkplanDTO,
    @Req() req,
  ) {
    Logger.debug('WorkplanController.createWorkplan');
    return this.workplanService.createWorkplan(createWorkplanDto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'workplanId' })
  @Post('addActivitiesToWorkplan')
  async addActivitiesToWorkplan(
    @Req() req,
    @Query('workplanId') workplanId: string,
    @Body() createActivityDTO: CreateActivityDTO,
  ) {
    Logger.debug('WorkplanController.addActivitiesToWorkplan');
    return this.workplanService.addActivitiesToWorkplan(
      req.user,
      workplanId,
      createActivityDTO,
    );
  }

  @ApiQuery({ name: 'workplanId' })
  @Get('individualWorkplanById')
  async getWorkplanById(@Query('workplanId') workplanId: string) {
    Logger.debug('WorkplanController.getWorkplanByYearCode');
    return this.workplanService.getWorkplanById(workplanId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('allWorkplans')
  async allWorkplans(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('WorkplanController.allWorkplans');
    return this.workplanService.getAllWorkplans(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'workplanId' })
  @Put('publishWorkplan')
  async publishWorkplan(@Query('workplanId') workplanId: string) {
    Logger.debug('WorkplanController.publishWorkplan');
    return this.workplanService.publishWorkplan(workplanId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @ApiQuery({ name: 'workplanId' })
  @Put('unpublishWorkplan')
  async unpublishWorkplan(@Query('workplanId') workplanId: string) {
    Logger.debug('WorkplanController.unpublishWorkplan');
    return this.workplanService.unpublishWorkplan(workplanId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'workplanId' })
  @Put('deleteWorkplan')
  async deleteWorkplan(
    @Query('workplanId') workplanId: string,
    @Req() request,
  ) {
    Logger.debug('WorkplanController.deleteWorkplan');
    return this.workplanService.deleteWorkplan(workplanId, request.user);
  }

  /**API to show current year's workplan on CAPNET side */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.GUEST)
  @ApiQuery({ name: 'year' })
  @Get('publishedWorkplan')
  async getPublishedWorkplan(@Query('year', ParseIntPipe) year: number) {
    Logger.debug('WorkplanController.getPublishedWorkplan');
    return this.workplanService.getPublishedWorkplan(year);
  }

  /**API to show current year's workplan on Network side */
  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'year' })
  @Get('approvedWorkplan')
  async getApprovedWorkplan(@Query('year', ParseIntPipe) year: number) {
    Logger.debug('WorkplanController.getApprovedWorkplan');
    return this.workplanService.getApprovedWorkplan(year);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('allWorkplansGeneralUser')
  async allWorkplansGeneralUser(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
    @Req() req,
  ) {
    Logger.debug('WorkplanController.allWorkplansGeneralUser');
    return this.workplanService.allWorkplansGeneralUser(
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

  @UseGuards(RolesGuard)
  @Roles(Role.NETWORK, Role.PARTNER, Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'workplanId' })
  @ApiQuery({ name: 'activityId' })
  @Put('editWorkplan')
  updateWorkplan(
    @Query('workplanId') workplanId: string,
    @Body() editActivityDTO: EditActivityDTO,
    @Query('activityId') activityId: string,
    @Req() request,
  ) {
    Logger.debug('WorkplanController.updateWorkplan');
    return this.workplanService.updateWorkplan(
      workplanId,
      activityId,
      editActivityDTO,
      request.user,
    );
  }

  @ApiParam({ name: 'workplanId' })
  @Post('export/:workplanId')
  async downloadIndividualWorkplan(
    @Param('workplanId') workplanId: string,
    @Res() res: Response,
  ) {
    Logger.debug('WorkplanController.downloadIndividualWorkplan');
    // return res.download(`${this.workplanService.downloadIndividualWorkplan(res, workplanId)}`);
    return this.workplanService.downloadIndividualWorkplan(res, workplanId);
  }

  @ApiParam({ name: 'year' })
  @Post('multipleExport/:year')
  async downloadMultipleWorkplan(
    @Param('year', ParseIntPipe) year: number,
    @Res() res,
    @Req() req,
  ) {
    Logger.debug('WorkplanController.downloadMultipleWorkplan');
    return this.workplanService.downloadMultipleWorkplan(res, year, req.user);
  }

  @ApiQuery({ name: 'workplanId' })
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @Get('allActivitiesOfWorkplan')
  async allActivitiesOfWorkplan(
    @Query('workplanId') workplanId: string,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
  ) {
    Logger.debug('WorkplanController.allActivitiesOfWorkplan');
    return this.workplanService.getActivitiesAddedInWorkplan(
      workplanId,
      pageSize,
      pageIndex,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('manageNetworkWorkplans')
  async manageNetworkWorkplans(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    // @Query('status') status: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('WorkplanController.manageNetworkWorkplans');
    return this.workplanService.getAllNetworkWorkplans(
      pageSize,
      pageIndex,
      searchKeyword,
      // status,
      sortType,
      sortDirection,
      year,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.CAPNET, Role.ADMIN)
  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'status' })
  @ApiQuery({ name: 'sortType' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiQuery({ name: 'year' })
  @Get('managePartnerWorkplans')
  async managePartnerWorkplans(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
    @Query('sortType') sortType: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    Logger.debug('WorkplanController.managePartnerWorkplans');
    return this.workplanService.getAllPartnerWorkplans(
      pageSize,
      pageIndex,
      searchKeyword,
      sortType,
      sortDirection,
      year,
    );
  }

  // List of workplan activities for proposal
  @ApiParam({ name: 'year' })
  @Get('workplanActivitiesListByYear/:year')
  async getWorkplanActivitiesListByYear(
    @Param('year', ParseIntPipe) year: number,
    @Req() request,
  ) {
    Logger.debug('WorkplanController.workplanActivitiesListByYear');
    return this.workplanService.workplanActivitiesListByYear(
      year,
      request.user,
    );
  }

  // Details of workplan activity selected
  @ApiParam({ name: 'activityId' })
  @Get('workplanActivitiesDetails/:activityId')
  async workplanActivitiesDetails(@Param('activityId') activityId: string) {
    Logger.debug('WorkplanController.workplanActivitiesDetails');
    return this.workplanService.workplanActivitiesDetails(activityId);
  }

  @ApiParam({ name: 'year' })
  @ApiQuery({ name: 'isNetwork' })
  @Get('generalUserMultipleWorkplanExport/:year')
  async downloadGeneralUserMultipleWorkplan(
    @Param('year', ParseIntPipe) year: number,
    @Query('isNetwork', ParseBoolPipe) isNetwork: boolean,
    @Res() res,
  ) {
    Logger.debug('WorkplanController.downloadGeneralUserMultipleWorkplan');
    return this.workplanService.downloadGeneralUserMultipleWorkplan(
      res,
      year,
      isNetwork,
    );
  }

  @ApiParam({ name: 'year' })
  @Get('workplanByYear/:year')
  async checkIfWorkplanExistForYear(
    @Param('year', ParseIntPipe) year: number,
    @Req() req,
  ) {
    Logger.debug('WorkplanController.checkIfWorkplanExistForYear');
    return this.workplanService.checkIfWorkplanExistForYear(year, req.user);
  }

  @ApiParam({ name: 'workplanId' })
  @Get('workplanActivityCount/:workplanId')
  async getWorkplanActivityCount(@Param('workplanId') workplanId: any) {
    Logger.debug('WorkplanController.getWorkplanActivityCount');
    return this.workplanService.getWorkplanActivitiesCount(workplanId);
  }
}
