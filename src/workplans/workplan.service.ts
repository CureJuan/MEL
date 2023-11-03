import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workplan } from './schema/workplan.schema';
import { Model } from 'mongoose';
import { CreateWorkplanDTO } from './dto/create-workplan.dto';
import { UserService } from '../users/user.service';
import { User } from '../users/schema/user.schema';
import { CreateActivityDTO } from '../activities/dto/create-activity.dto';
import { ActivitiesService } from '../activities/activities.service';
import { WorkplanActivities } from './schema/workplan_activities.schema';
import { errorMessages } from '../utils/error-messages.utils';
import { EditActivityDTO } from 'src/activities/dto/edit-activity.dto';
import { Workbook, Worksheet } from 'exceljs';
import { MelpService } from '../melp/melp.service';
import { v4 as uuidv4 } from 'uuid';
import { NetworkService } from '../networks/network.service';
import { PartnerService } from '../partners/partner.service';
import { CapnetEnum } from '../common/enum/capnet.enum';
import { StatusEnum } from '../common/enum/status.enum';
import { Response } from 'express';

@Injectable()
export class WorkplanService {
  constructor(
    @InjectModel(Workplan.name) private workplanModel: Model<Workplan>,
    @InjectModel(WorkplanActivities.name)
    private workplanActivitiesModel: Model<WorkplanActivities>,
    private readonly melpService: MelpService,
    private readonly userService: UserService,
    private readonly activitiesService: ActivitiesService,
    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
  ) {}

  async createWorkplan(createWorkplanDto: CreateWorkplanDTO, user: User) {
    Logger.debug('WorkplanService.createWorkplan');
    Logger.verbose('createWorkplanDto = ', createWorkplanDto);

    let statusId, instituteName;
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    if (user.networkId === null && user.partnerId === null) {
      instituteName = CapnetEnum.CAPNET;
      const foundWorkplan = await this.workplanModel
        .findOne({
          year: createWorkplanDto.year,
          isDeleted: false,
          instituteName,
          statusId: { $ne: deniedStatusId },
        })
        .exec();

      if (foundWorkplan)
        throw new ConflictException(errorMessages.WORKPLAN_YEAR_EXISTS);
      statusId = await this.userService.getStatusId(StatusEnum.UNPUBLISHED);
    } else if (user.networkId) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      const foundWorkplan = await this.workplanModel
        .findOne({
          year: createWorkplanDto.year,
          isDeleted: false,
          networkId: user.networkId,
          instituteName,
          statusId: { $ne: deniedStatusId },
        })
        .exec();

      if (foundWorkplan)
        throw new ConflictException(errorMessages.WORKPLAN_YEAR_EXISTS);
      statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    } else if (user.partnerId) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      const foundWorkplan = await this.workplanModel
        .findOne({
          year: createWorkplanDto.year,
          isDeleted: false,
          partnerId: user.partnerId,
          instituteName,
          statusId: { $ne: deniedStatusId },
        })
        .exec();

      if (foundWorkplan)
        throw new ConflictException(errorMessages.WORKPLAN_YEAR_EXISTS);
      statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    }
    const workplan = await this.workplanModel.create({
      year: createWorkplanDto.year,
      workplanId: uuidv4(),
      workplanCode: createWorkplanDto.workplanCode,
      statusId,
      instituteName,
      networkId: user.networkId ? user.networkId : null,
      partnerId: user.partnerId ? user.partnerId : null,
      createdBy: user._id,
    });
    await this.melpService.addActivityLog(
      user,
      `Workplan - ${workplan.workplanCode} added`,
    );
    return workplan;
  }

  async addActivitiesToWorkplan(
    user: User,
    workplanId: string,
    createActivityDto: CreateActivityDTO,
  ) {
    Logger.debug('WorkplanService.addActivitiesToWorkplan');
    const workplan = await this.getWorkplanById(workplanId);
    const createdActivity = await this.activitiesService.createActivity(
      user,
      createActivityDto,
      workplan.workplanCode,
    );
    await this.workplanActivitiesModel.create({
      workplanActivityId: uuidv4(),
      workplanId: workplan._id,
      activityId: createdActivity._id,
    });
    return {
      workplanId,
      activityDetails: createdActivity,
    };
  }

  async getWorkplanById(workplanId: string) {
    Logger.debug('WorkplanService.getWorkplanByYearCode');
    const workplanData = await this.workplanModel
      .findOne({
        workplanId: workplanId,
        isDeleted: false,
      })
      .exec();
    //activity details
    const statusName = await this.userService.getStatusName(
      workplanData.statusId,
    );
    workplanData.statusName = statusName;
    return workplanData;
  }

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('WorkplanService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  /** Admin API: Get all workplans created by all user types*/
  async getAllWorkplans(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('WorkplanService.getAllWorkplans');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const publishedStatusId = await this.userService.getStatusId(
      StatusEnum.PUBLISHED,
    );
    const unpublishedStatusId = await this.userService.getStatusId(
      StatusEnum.UNPUBLISHED,
    );
    const workPlanList = await this.workplanModel
      .find({
        year,
        $and: [
          {
            $or: [{ instituteName: regex }, { workplanCode: regex }],
          },
        ],
        isDeleted: false,
        statusId: {
          $in: [approvedStatusId, publishedStatusId, unpublishedStatusId],
        },
      })
      .skip(pageIndex * pageSize)
      .limit(pageSize)
      .sort(sortQuery)
      .exec();

    let statusName, instituteName;
    const finalWorkplanList = [];

    if (workPlanList && workPlanList.length !== 0) {
      for (const workplan of workPlanList) {
        statusName = await this.userService.getStatusName(workplan.statusId);
        if (workplan.networkId) {
          instituteName = await this.networkService.getNetworkNameById(
            workplan.networkId,
          );
          workplan.instituteName = instituteName;
        } else if (workplan.partnerId) {
          instituteName = await this.partnerService.getPartnerInstituteNameById(
            workplan.partnerId,
          );
          workplan.instituteName = instituteName;
        } else {
          instituteName = CapnetEnum.CAPNET;
          workplan.instituteName = instituteName;
        }
        workplan.statusName = statusName;
        finalWorkplanList.push(workplan);
      }
    } else throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const total = (
      await this.workplanModel
        .find({
          year,
          $and: [
            {
              $or: [{ instituteName: regex }, { workplanCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .exec()
    ).length;

    return { workPlanList: workPlanList, total: Math.ceil(total / 10) };
  }

  /**Publish workplan created by CAP-NET */
  async publishWorkplan(id: string) {
    Logger.debug('WorkplanService.publishWorkplan');
    const workplan = await this.getWorkplanById(id);
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const publishedStatusId = await this.userService.getStatusId(
      StatusEnum.PUBLISHED,
    );
    return this.workplanModel
      .findOneAndUpdate(
        { workplanId: id, isDeleted: false },
        { statusId: publishedStatusId },
        { new: true },
      )
      .exec();
  }

  async unpublishWorkplan(id: string) {
    Logger.debug('WorkplanService.unpublishWorkplan');
    const workplan = await this.getWorkplanById(id);
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const publishedStatusId = await this.userService.getStatusId(
      StatusEnum.PUBLISHED,
    );
    const unpublishedStatusId = await this.userService.getStatusId(
      StatusEnum.UNPUBLISHED,
    );

    return this.workplanModel
      .findOneAndUpdate(
        { workplanId: id, isDeleted: false, statusId: publishedStatusId },
        { statusId: unpublishedStatusId },
        { new: true },
      )
      .exec();
  }

  async deleteWorkplan(id: string, user: any) {
    Logger.debug('WorkplanService.deleteWorkplan');
    const workplan = await this.getWorkplanById(id);
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const workplanActivitiesList = await this.workplanActivitiesModel
      .find({ workplanId: workplan._id, isDeleted: false })
      .exec();
    const proposedActivity =
      await this.activitiesService.checkIfProposalIsForWorkplanActivity(
        workplan.year,
        user,
      );
    console.log('Proposed ', proposedActivity);
    if (proposedActivity !== null)
      throw new UnprocessableEntityException(
        errorMessages.CANNOT_DELETE_WORKPLAN,
      );

    const updatedWorkplan = await this.workplanModel
      .findOneAndUpdate(
        { workplanId: id, isDeleted: false },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    await this.workplanActivitiesModel
      .updateMany(
        { workplanId: updatedWorkplan._id },
        { $set: { isDeleted: true } },
      )
      .exec();

    for (const activity of workplanActivitiesList) {
      await this.activitiesService.deleteWorkplanActivity(activity.activityId);
    }

    await this.melpService.addActivityLog(
      user,
      `Workplan - ${updatedWorkplan.workplanCode} deleted`,
    );
    return updatedWorkplan;
  }

  async updateApprovedCount(count: number, workplanId: string) {
    Logger.debug('WorkplanService.updateApprovedCount');
    return this.workplanModel
      .findOneAndUpdate(
        { workplanId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTime(workplanId: string, submittedAt: Date) {
    Logger.debug('WorkplanService.setSubmittedAtTime');
    return this.workplanModel
      .findOneAndUpdate(
        {
          workplanId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTime(workplanId: string, approvedAt: Date) {
    Logger.debug('WorkplanService.setApprovedAtTime');
    return this.workplanModel
      .findOneAndUpdate(
        {
          workplanId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async getActivitiesAddedInWorkplan(id: string, pageSize, pageIndex) {
    Logger.debug('WorkplanService.getActivitiesAddedInWorkplan');
    const workplanById = await this.workplanModel
      .findOne({
        workplanId: id,
      })
      .exec();

    if (!workplanById)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const workplanActivities = await this.workplanActivitiesModel
      .find({
        workplanId: workplanById._id,
      })
      .skip(pageIndex * pageSize)
      .limit(pageSize)
      .exec();

    if (workplanActivities.length === 0)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_ADDED);

    const activitiesArray = [];
    for (const activity of workplanActivities) {
      const foundActivity = await this.activitiesService.getActivityById(
        activity.activityId,
      );
      if (foundActivity !== null) activitiesArray.push(foundActivity);
    }
    return {
      activitiesArray,
      total: Math.ceil(activitiesArray.length / 10),
    };
  }

  async getAllActivitiesOfWorkplan(id: string) {
    Logger.debug('WorkplanService.getAllActivitiesOfWorkplan');
    const workplanById = await this.workplanModel
      .findOne({
        workplanId: id,
      })
      .exec();

    if (!workplanById)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const workplanActivities = await this.workplanActivitiesModel
      .find({
        workplanId: workplanById._id,
      })
      .exec();
    if (workplanActivities.length === 0)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_ADDED);

    const activitiesArray = [];
    for (const activity of workplanActivities) {
      const foundActivity = await this.activitiesService.getActivityById(
        activity.activityId,
      );
      if (foundActivity !== null) activitiesArray.push(foundActivity);
    }
    return activitiesArray;
  }

  async getPublishedWorkplan(year: number) {
    Logger.debug('WorkplanService.getPublishedWorkplan');
    const publishedStatusId = await this.userService.getStatusId(
      StatusEnum.PUBLISHED,
    );

    const workplanData = await this.workplanModel
      .findOne({
        isDeleted: false,
        year: year,
        statusId: publishedStatusId,
      })
      .exec();

    if (!workplanData)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);
    // const activitiesArr = await this.getActivitiesAddedInWorkplan(
    //   workplanData._id, pageSize,pageIndex
    // );
    return {
      year,
      workplanCode: workplanData.workplanCode,
      workplanId: workplanData.workplanId,
      status: 'Published',
      // activitiesData: activitiesArr,
    };
  }

  async getApprovedWorkplan(year: number) {
    Logger.debug('WorkplanService.getApprovedWorkplan');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    const workplanData = await this.workplanModel
      .findOne({
        isDeleted: false,
        year: year,
        statusId: approvedStatusId,
      })
      .exec();

    if (!workplanData)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    // const activitiesArr = await this.getActivitiesAddedInWorkplan(
    //   workplanData._id,pageSize,pageIndex
    // );
    return {
      year: workplanData.year,
      workplanCode: workplanData.workplanCode,
      workplanId: workplanData.workplanId,
      statusId: approvedStatusId,
      status: 'Approved',
      // activitiesData: activitiesArr,
    };
  }

  /** Network API: Get all workplans created by all network & partner users*/
  async allWorkplansGeneralUser(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    user,
  ) {
    Logger.debug('WorkplanService.allWorkplansGeneralUser');
    const tempWorkplanList = [];
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let total, workPlanList, statusName;
    if (user.networkId) {
      total = (
        await this.workplanModel
          .find({
            year,
            $and: [
              { networkId: user.networkId },
              {
                $or: [{ workplanCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      workPlanList = await this.workplanModel
        .find({
          year,

          $and: [
            { networkId: user.networkId },
            {
              $or: [{ workplanCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const networkName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      for (const wp of workPlanList) {
        statusName = await this.userService.getStatusName(wp.statusId);
        wp.networkName = networkName;
        wp.statusName = statusName;
        tempWorkplanList.push(wp);
      }
    } else if (user.partnerId) {
      total = (
        await this.workplanModel
          .find({
            year,
            $and: [
              { partnerId: user.partnerId },
              {
                $or: [{ workplanCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      workPlanList = await this.workplanModel
        .find({
          year,

          $and: [
            { partnerId: user.partnerId },
            {
              $or: [{ workplanCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const partnerName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      for (const wp of workPlanList) {
        wp.partnerName = partnerName;
        statusName = await this.userService.getStatusName(wp.statusId);
        wp.statusName = statusName;
        tempWorkplanList.push(wp);
      }
    }

    return { workPlanList: tempWorkplanList, total: Math.ceil(total / 10) };
  }

  async updateGeneralUserWorkplanStatus(workplanId, statusId) {
    Logger.debug('WorkplanService.updateGeneralUserWorkplanStatus');
    return this.workplanModel
      .findOneAndUpdate(
        { workplanId, isDeleted: false },
        { statusId: statusId },
        { new: true },
      )
      .exec();
  }

  async updateWorkplan(
    workplanId: string,
    activityId: string,
    editActivityDTO: EditActivityDTO,
    user: any,
  ) {
    Logger.debug('WorkplanService.updateWorkplan');
    const activityArray = await this.getAllActivitiesOfWorkplan(workplanId);

    for (const activity of activityArray) {
      if (activity.activityId === activityId) {
        return this.activitiesService.updateActivityById(
          activityId,
          editActivityDTO,
          user,
        );
      }
    }
  }

  async addColumnAndRowToWorksheet(workplanSheet: Worksheet) {
    Logger.debug('WorkplanService.addColumnAndRowToWorksheet');
    workplanSheet.columns = [
      { header: 'WorkplanCode', key: 'workplanCode', width: 20 },
      { header: 'Year', key: 'year', width: 6 },
      { header: 'InstituteName', key: 'instituteName', width: 20 },
      { header: 'Result', key: 'result', width: 40 },
      { header: 'Indicator', key: 'indicator', width: 40 },
      { header: 'ActivityName', key: 'activityName', width: 40 },
      { header: 'Category', key: 'category', width: 40 },
      { header: 'ReferenceNo', key: 'referenceNo', width: 40 },
      { header: 'ThematicArea', key: 'thematicArea', width: 40 },
      { header: 'TypeOfActivity', key: 'typeOfActivity', width: 40 },
      { header: 'Modality', key: 'modality', width: 40 },
      { header: 'Timeframe', key: 'timeframe', width: 5 },
      { header: 'PotentialPartners', key: 'potentialPartners', width: 40 },
      {
        header: 'PotentialNetworkCollaboration',
        key: 'potentialNetworkCollaboration',
        width: 40,
      },
      {
        header: 'PotentialGWPCollaboration',
        key: 'potentialGWPCollaboration',
        width: 40,
      },
      {
        header: 'ContributionToExpectedOutput',
        key: 'contributionToExpectedOutput',
        width: 40,
      },
    ];

    workplanSheet.addRow({
      workplanCode: 'Workplan Code',
      year: 'Year',
      instituteName: 'Institute Name',
      result: 'Result',
      indicator: 'Indicator',
      activityName: 'Activity Name',
      category: 'Category',
      referenceNo: 'Reference Number',
      thematicArea: 'Thematic Area',
      typeOfActivity: 'Type Of Activity',
      modality: 'Modality',
      timeframe: 'Timeframe',
      potentialPartners: 'Potential Partners',
      potentialNetworkCollaboration: 'Potential Network Collaboration',
      potentialGWPCollaboration: 'Potential GWP Collaboration',
      contributionToExpectedOutput: 'Contribution To Expected Output',
    });
    workplanSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadWorkplan(res, workplan, workplanSheet, workplanCount) {
    Logger.debug('WorkplanService.downloadWorkplan');
    console.log('workplan wile multi = ', workplan);
    const workplanActivities = await this.workplanActivitiesModel
      .find({ workplanId: workplan._id, isDeleted: false })
      .exec();
    for (const workplanActivity of workplanActivities) {
      console.log('workplanCount in acti loop = ', workplanCount);
      const activity = await this.activitiesService.getActivityById(
        workplanActivity.activityId,
      );

      const result = await this.melpService.getResultById(
        activity['result']['result_id'],
      );
      for (const activityIndicator of activity['indicatorId']) {
        console.log('workplanCount in indiloop', workplanCount);
        const indicator = await this.melpService.getIndicatorById(
          activityIndicator._id,
        );
        const category = await this.activitiesService.getCategoryById(
          activity['categoryName']['_id'],
        );
        const thematicAreaObject =
          await this.activitiesService.getActivityThematicAreaById(
            activity['thematicAreaName'],
          );
        const typeOfActivity =
          await this.activitiesService.getTypeOfActivityById(
            activity['activityTypeName']['_id'],
          );
        const modality = await this.activitiesService.getModalityById(
          activity['modalityName']['_id'],
        );
        const timeframe = await this.activitiesService.getTimeframeByName(
          activity['implementationQuarter'],
        );
        let thematicArea;
        if (thematicAreaObject.thematicAreaName === 'Other') {
          thematicArea = activity['otherThematicArea'];
        } else {
          thematicArea = thematicAreaObject.thematicAreaName;
        }
        workplanSheet.getRow(workplanCount).values = {
          workplanCode: workplan.workplanCode,
          year: workplan.year,
          instituteName: workplan.instituteName,
          result: result.resultName,
          indicator: indicator.indicatorName,
          activityName: activity['activityName'],
          category: category.categoryName,
          referenceNo: activity['contractReferenceNumber'],
          thematicArea: thematicArea,
          typeOfActivity: typeOfActivity.activityTypeName,
          modality: modality.modalityName,
          timeframe: timeframe.quarter,
          potentialPartners: activity['potentialPartners'],
          potentialNetworkCollaboration:
            activity['potentialNetworkCollaboration'],
          potentialGWPCollaboration: activity['potentialGWPCollaboration'],
          contributionToExpectedOutput:
            activity['contributionToExpectedOutput'],
        };
        console.log('workplanSheet = ', workplanSheet);
        workplanCount++;
      }
    }
  }

  async downloadIndividualWorkplan(res: Response, workplanId: string) {
    Logger.debug('WorkplanService.downloadIndividualWorkplan');
    const workbook = new Workbook();
    const workplan = await this.getWorkplanById(workplanId);
    const workplanSheet = workbook.addWorksheet(
      'Workplan - ' + workplan.workplanCode,
    );
    await this.addColumnAndRowToWorksheet(workplanSheet);
    const count = 2;
    await this.downloadWorkplan(res, workplan, workplanSheet, count);
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + workplan.workplanCode + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadMultipleWorkplan(res, year: number, user) {
    Logger.debug('WorkplanService.downloadMultipleWorkplan');
    const workbook = new Workbook();

    let workplanList;
    if (user.partnerId) {
      workplanList = await this.workplanModel
        .find({ year, isDeleted: false, partnerId: user.partnerId })
        .exec();
    } else if (user.networkId) {
      workplanList = await this.workplanModel
        .find({ year, isDeleted: false, networkId: user.networkId })
        .exec();
    } else {
      workplanList = await this.workplanModel
        .find({ year, isDeleted: false })
        .exec();
    }
    const workplanSheet = workbook.addWorksheet('Workplan - ' + year);

    await this.addColumnAndRowToWorksheet(workplanSheet);
    let count = 2;

    for (const workplan of workplanList) {
      await this.downloadWorkplan(res, workplan, workplanSheet, count);
      count++;
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Workplan-' + year + +'.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async getAllNetworkWorkplans(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('WorkplanService.getAllNetworkWorkplans');
    try {
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );

      const total = (
        await this.workplanModel
          .find({
            year,
            $and: [
              {
                networkId: { $ne: null },
                statusId: { $ne: inprogressStatusId },
              },
              {
                $or: [{ workplanCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      const workPlanList = await this.workplanModel
        .find({
          year,

          $and: [
            { networkId: { $ne: null }, statusId: { $ne: inprogressStatusId } },
            {
              $or: [{ workplanCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const tempList = [];
      let networkName, statusName;

      for (const workplan of workPlanList) {
        networkName = await this.networkService.getNetworkNameById(
          workplan.networkId,
        );
        statusName = await this.userService.getStatusName(workplan.statusId);
        workplan.networkName = networkName;
        workplan.statusName = statusName;
        tempList.push(workplan);
      }

      return { workPlanList: tempList, total: Math.ceil(total / 10) };
    } catch (error) {
      return error;
    }
  }

  async getAllPartnerWorkplans(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('WorkplanService.getAllPartnerWorkplans');
    try {
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );

      const total = (
        await this.workplanModel
          .find({
            year,
            $and: [
              {
                partnerId: { $ne: null },
                statusId: { $ne: inprogressStatusId },
              },
              {
                $or: [{ workplanCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      const workPlanList = await this.workplanModel
        .find({
          year,

          $and: [
            { partnerId: { $ne: null }, statusId: { $ne: inprogressStatusId } },
            {
              $or: [{ workplanCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const tempList = [];
      let partnerName, statusName;

      for (const workplan of workPlanList) {
        partnerName = await this.partnerService.getPartnerInstituteNameById(
          workplan.partnerId,
        );
        statusName = await this.userService.getStatusName(workplan.statusId);
        workplan.partnerName = partnerName;
        workplan.statusName = statusName;
        tempList.push(workplan);
      }

      return { workPlanList: tempList, total: Math.ceil(total / 10) };
    } catch (error) {
      return error;
    }
  }

  // List of workplan activities for proposal
  async workplanActivitiesListByYear(year: number, user: any) {
    Logger.debug('WorkplanService.workplanActivitiesListByYear');
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const workplan = await this.workplanModel
      .findOne({
        year,
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
        statusId: { $ne: deniedStatusId },
      })
      .exec();

    if (workplan === null)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);
    const workplanActivitiesList = await this.workplanActivitiesModel
      .find({ workplanId: workplan._id, isDeleted: false })
      .exec();
    if (workplanActivitiesList.length === 0)
      throw new NotFoundException(errorMessages.WORKPLAN_ACTIVITY_NOT_FOUND);
    let workplanActivities = [];
    for (const workplanActivity of workplanActivitiesList) {
      const temp = {};
      const activity = await this.activitiesService.getActivityById(
        workplanActivity.activityId,
      );
      temp['activity_id'] = activity['activity_id'];
      temp['activityId'] = activity['activityId'];
      temp['activityCode'] = activity['activityCode'];
      temp['activityName'] = activity['activityName'];
      temp['activityCodeAndName'] =
        activity['activityCode'] + '-' + activity['activityName'];
      workplanActivities = [...workplanActivities, { ...temp }];
    }
    return workplanActivities;
  }

  // Details of workplan activity selected
  async workplanActivitiesDetails(activityId: string) {
    Logger.debug('WorkplanService.workplanActivitiesListByYear');
    return this.activitiesService.viewActivityDetails(activityId);
  }

  /**Network management API for all workplan download */
  async downloadGeneralUserMultipleWorkplan(
    res,
    year: number,
    isNetwork: boolean,
  ) {
    Logger.debug('WorkplanService.downloadGeneralUserMultipleWorkplan');
    const workbook = new Workbook();

    let workplanList;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (isNetwork) {
      workplanList = await this.workplanModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      workplanList = await this.workplanModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }
    const workplanSheet = workbook.addWorksheet('Workplan - ' + year);

    await this.addColumnAndRowToWorksheet(workplanSheet);

    let count = 2;

    for (const workplan of workplanList) {
      await this.downloadWorkplan(res, workplan, workplanSheet, count);
      count++;
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Workplan-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async checkIfWorkplanExistForYear(year: number, user: any) {
    Logger.debug('WorkplanService.checkIfWorkplanExistForYear');
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const foundWorkplan = await this.workplanModel
      .findOne({
        year,
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
        statusId: { $ne: deniedStatusId },
      })
      .exec();
    if (foundWorkplan)
      throw new ConflictException(errorMessages.WORKPLAN_YEAR_EXISTS);
    else return foundWorkplan;
  }

  /**Get count for workplan activities */

  async getWorkplanActivitiesCount(workplanId: any) {
    Logger.debug('WorkplanService.getWorkplanActivitiesCount');
    const workplanActivitiesCount = await this.workplanActivitiesModel
      .find({
        workplanId,
        isDeleted: false,
      })
      .count()
      .exec();

    return { workplanActivitiesCount };
  }
}
