import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { CreateActivityDTO } from './dto/create-activity.dto';
import { Activities } from './schema/activities.schema';
import { ActivityCategories } from '../common/staticSchema/activityCategories.schema';
import { ActivityStatus } from '../common/staticSchema/activityStatus.schema';
import { ActivityThematicAreas } from '../common/staticSchema/activityThematicAreas.schema';
import { ActivityTimeframe } from '../common/staticSchema/activityTimeframe.schema';
import { ActivityTypes } from '../common/staticSchema/activityTypes.schema';
import { Modality } from '../common/staticSchema/modality.schema';
import { errorMessages } from '../utils/error-messages.utils';
import { MelpService } from '../melp/melp.service';
import { EditActivityDTO } from './dto/edit-activity.dto';
import { CreateActivityProposalDTO } from './dto/create-activityProposal.dto';
import { NetworkService } from '../networks/network.service';
import { UserService } from '../users/user.service';
import { PartnerService } from '../partners/partner.service';
import { TypeOfActivityeNUM } from '../common/enum/typeOfActivity.enum';
import { ActivityProposals } from './schema/activityProposals.schema';
import { v4 as uuidv4 } from 'uuid';
import { AddFinancialDetailsDTO } from './dto/addFinancialDetails.dto';
import { CoordinationCost } from './schema/coordinationCost.schema';
import { TravelCost } from './schema/travelCost.schema';
import { LocationCost } from './schema/locationCost.schema';
import { OtherCost } from './schema/otherCost.schema';
import { AddAdditionalInfoDTO } from './dto/addAdditionalInfo.dto';
import { EditProposalDTO } from './dto/editProposal.dto';
import { ActivityScope } from '../common/staticSchema/activityScope.schema';
import { Workplan } from '../workplans/schema/workplan.schema';
import { WorkplanActivities } from '../workplans/schema/workplan_activities.schema';
import { Workbook, Worksheet } from 'exceljs';
import { Country } from '../common/staticSchema/country.schema';
import { StatusEnum } from '../common/enum/status.enum';
import { OutputReport } from '../reports/schema/outputReport.schema';
import { ImpactStory } from '../impactStory/schema/impactStory.schema';
import { ActivityTargetGroup } from '../common/staticSchema/activityTargetGroup.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ImplementationStatusEnum } from 'src/common/enum/implementationStatus.enum';
import { CapnetEnum } from '../common/enum/capnet.enum';
import { BlobServiceClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activityModel: Model<Activities>,

    @InjectModel(ActivityProposals.name)
    private activityProposalModel: Model<ActivityProposals>,

    @InjectModel(ActivityCategories.name)
    private activityCategoriesModel: Model<ActivityCategories>,

    @InjectModel(ActivityThematicAreas.name)
    private activityThemeModel: Model<ActivityThematicAreas>,

    @InjectModel(ActivityTypes.name)
    private activityTypesModel: Model<ActivityTypes>,

    @InjectModel(Modality.name)
    private modalityModel: Model<Modality>,

    @InjectModel(ActivityStatus.name)
    private activityStatusModel: Model<ActivityStatus>,

    @InjectModel(ActivityScope.name)
    private activityScopeModel: Model<ActivityScope>,

    @InjectModel(ActivityTimeframe.name)
    private activityTimeframeModel: Model<ActivityTimeframe>,

    @InjectModel(ActivityProposals.name)
    private proposalsModel: Model<ActivityProposals>,

    @InjectModel(CoordinationCost.name)
    private coordinationModel: Model<CoordinationCost>,

    @InjectModel(TravelCost.name)
    private travelModel: Model<TravelCost>,

    @InjectModel(LocationCost.name)
    private locationModel: Model<LocationCost>,

    @InjectModel(OtherCost.name)
    private otherModel: Model<OtherCost>,

    @InjectModel(Workplan.name)
    private workplanModel: Model<Workplan>,

    @InjectModel(WorkplanActivities.name)
    private workplanActivitiesModel: Model<WorkplanActivities>,

    @InjectModel(Country.name) private countryModel: Model<Country>,

    @InjectModel(OutputReport.name)
    private outputReportModel: Model<OutputReport>,

    @InjectModel(ImpactStory.name) private impactStoryModel: Model<ImpactStory>,

    @InjectModel(ActivityTargetGroup.name)
    private activityTargetGroupModel: Model<ActivityTargetGroup>,

    private readonly melpService: MelpService,
    private readonly networkService: NetworkService,
    private readonly userService: UserService,
    private readonly partnerService: PartnerService,
    private readonly configService: ConfigService,
  ) {}

  async getStaticDataWorkplanActivity() {
    Logger.debug('ActivitiesService.getStaticDataWorkplanActivity');
    const categoriesList = await this.activityCategoriesModel.find().exec();
    const themesList = await this.activityThemeModel.find().exec();
    const activityTypesList = await this.activityTypesModel.find().exec();
    const modalityList = await this.modalityModel.find().exec();
    const activityStatusList = await this.activityStatusModel.find().exec();
    const timeframeList = await this.activityTimeframeModel.find().exec();
    const countryList = await this.countryModel
      .find()
      .sort({ country: 1 })
      .exec();
    const activityScopeList = await this.activityScopeModel.find().exec();
    const activityTargetGroupList = await this.activityTargetGroupModel
      .find()
      .exec();

    return {
      categories: categoriesList,
      thematicArea: themesList,
      activityTypes: activityTypesList,
      modality: modalityList,
      activityStatus: activityStatusList,
      implementationQuarter: timeframeList,
      countryList,
      activityScopeList,
      activityTargetGroupList,
    };
  }

  async getInstituteNameAndStatusId(user: any) {
    Logger.debug('ActivitiesService.getInstituteNameAndStatusId');
    let instituteName, statusId;
    if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    } else if (user.networkId === null && user.partnerId !== null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    } else {
      instituteName = CapnetEnum.CAPNET;
      statusId = await this.userService.getStatusId(StatusEnum.APPROVED);
    }
    return {
      instituteName,
      statusId,
    };
  }

  async createActivity(
    user: User,
    createActivityDTO: CreateActivityDTO,
    workplanCode: string,
  ) {
    Logger.debug('ActivitiesService.createActivity');
    const { instituteName, statusId } = await this.getInstituteNameAndStatusId(
      user,
    );
    const institutionName = instituteName;
    const activity = await this.activityModel.create({
      ...createActivityDTO,
      activityId: uuidv4(),
      networkId: user.networkId,
      partnerId: user.partnerId,
      institutionName,
      statusId,
      createdBy: user._id,
      updatedBy: user._id,
    });
    await this.melpService.addActivityLog(
      user,
      `Activity ${activity.activityCode} added to workplan - ${workplanCode}`,
    );
    return activity;
  }

  async getActivityObject(activity: Activities) {
    Logger.debug('ActivitiesService.getActivityObject');
    const newActivity = {};
    const category = await this.getCategoryById(activity.categoryId);
    const thematicArea = await this.getActivityThematicAreaById(
      activity.thematicAreaId,
    );
    const activityType = await this.getTypeOfActivityById(
      activity.activityTypeId,
    );
    const modality = await this.getModalityById(activity.modalityId);
    // const scope = await this.getActivityScopeById(activity.activityScopeId);
    const activityStatus = await this.getActivityStatusById(
      activity.activityStatusId,
    );
    const resultObject = {};
    const result = await this.melpService.getResultById(activity.resultId);
    resultObject['result_id'] = result._id;
    resultObject['resultName'] = result.resultName;
    resultObject['resultId'] = result.resultId;
    newActivity['year'] = activity.year;
    newActivity['activityId'] = activity.activityId;
    newActivity['activity_id'] = activity._id;
    newActivity['activityCode'] = activity.activityCode;
    newActivity['focalPerson'] = activity.focalPersonName;
    newActivity['activityName'] = activity.activityName;
    newActivity['activityTypeName'] = activityType;
    newActivity['implementationQuarter'] = activity.implementationQuarter;
    newActivity['potentialPartnersForCapnet'] =
      activity.potentialPartnersForCapnet
        ? activity.potentialPartnersForCapnet
        : '';
    newActivity['potentialPartnersForGeneralUsers'] =
      activity.potentialPartnersForGeneralUsers
        ? activity.potentialPartnersForGeneralUsers
        : [];
    newActivity['potentialNetworkCollaboration'] =
      activity.potentialNetworkCollaboration;
    newActivity['potentialGWPCollaboration'] =
      activity.potentialGWPCollaboration;
    newActivity['contributionToExpectedOutput'] =
      activity.contributionToExpectedOutput;
    newActivity['categoryName'] = category;
    newActivity['thematicAreaName'] = thematicArea;
    newActivity['otherThematicArea'] = activity.otherThematicArea;
    newActivity['modalityName'] = modality;
    newActivity['activityStatusName'] = activityStatus;
    newActivity['comments'] = activity.comments;
    newActivity['result'] = resultObject;
    newActivity['indicatorsObjectArray'] = activity.indicatorsObjectArray;
    newActivity['indicatorId'] = activity.indicatorId;

    return newActivity;
  }

  async getActivityById(id: any) {
    Logger.debug('ActivitiesService.getActivityById');
    const activity = await this.activityModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .exec();

    if (activity === null)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);

    return this.getActivityObject(activity);
  }

  async viewActivityDetails(activityId: string) {
    Logger.debug('ActivitiesService.viewActivityDetails');
    const activity = await this.activityModel
      .findOne({ activityId, isDeleted: false })
      .exec();
    if (activity === null) {
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);
    }
    let indicatorList = [];

    for (const indicatorId of activity.indicatorId) {
      const tempIndicator = {};
      const indicator = await this.melpService.getIndicatorById(indicatorId);
      if (indicator === null) {
        throw new NotFoundException(errorMessages.INDICATOR_NOT_FOUND);
      }
      tempIndicator['indicator_id'] = indicator._id;
      tempIndicator['indicator'] = indicator.indicatorName;
      indicatorList = [...indicatorList, { ...tempIndicator }];
    }

    const newActivity = await this.getActivityObject(activity);

    return {
      activtyData: newActivity,
      indicatorData: indicatorList,
    };
  }

  async updateActivityById(
    activityId: string,
    editActivityDTO: EditActivityDTO,
    user: any,
  ) {
    Logger.debug('ActivitiesService.updateActivityById');
    let resultData;
    const foundActivity = await this.activityModel
      .findOne({
        activityId,
        isDeleted: false,
      })
      .exec();
    if (!foundActivity)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);
    else {
      resultData = await this.melpService.getResultById(
        editActivityDTO.resultId,
      );
      if (resultData) {
        const updatedActivity = await this.activityModel
          .findOneAndUpdate({ activityId, isDeleted: false }, editActivityDTO, {
            new: true,
          })
          .exec();
        await this.melpService.addActivityLog(
          user,
          `Workplan activity - ${updatedActivity.activityCode} has been updated.`,
        );
        return updatedActivity;
      }
    }
  }

  async getCategoryById(categoryId) {
    try {
      Logger.debug('ActivitiesService.getCategoryById');
      return await this.activityCategoriesModel
        .findOne({ _id: categoryId })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getActivityThematicAreaById(thematicAreaId) {
    Logger.debug('ActivitiesService.getActivityThematicAreaById');
    try {
      return await this.activityThemeModel
        .findOne({ _id: thematicAreaId })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getTypeOfActivityById(activityTypeId) {
    Logger.debug('ActivitiesService.getTypeOfActivityById');
    try {
      return await this.activityTypesModel
        .findOne({ _id: activityTypeId })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getModalityById(modalityId) {
    Logger.debug('ActivitiesService.getModalityById');
    try {
      return await this.modalityModel.findOne({ _id: modalityId }).exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getTimeframeById(timeframeId) {
    Logger.debug('ActivitiesService.getTimeframeById');
    try {
      return await this.activityTimeframeModel
        .findOne({ _id: timeframeId })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getTimeframeByName(name: string) {
    Logger.debug('ActivitiesService.getTimeframeIdByName');
    try {
      return await this.activityTimeframeModel
        .findOne({ quarter: name })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getActivityScopeById(scopeId) {
    Logger.debug('ActivitiesService.getActivityScopeById');

    try {
      return await this.activityScopeModel.findOne({ _id: scopeId }).exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getActivityStatusById(statusId) {
    Logger.debug('ActivitiesService.getActivityStatusById');

    try {
      return await this.activityStatusModel.findOne({ _id: statusId }).exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getCountryNameById(countryId) {
    try {
      Logger.debug('ActivitiesService.getCountryNameById');
      const country = await this.countryModel
        .findOne({ _id: countryId })
        .exec();
      return country.country;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  /** Activity Proposals API's */
  async getActivityListByYear(year: number, user: any) {
    Logger.debug('ActivitiesService.getActivityListByYear');
    const statusId = await this.userService.getStatusId(StatusEnum.APPROVED);
    const activityProposalList = await this.proposalsModel
      .find({
        year,
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
        statusId,
      })
      .exec();

    let activityProposalArray = [];
    if (activityProposalList.length !== 0) {
      for (const activity of activityProposalList) {
        const activityCodeAndName =
          activity.activityCode + '-' + activity.activityName;
        const temp = {};
        temp['_id'] = activity._id;
        temp['activityId'] = activity.activityId;
        temp['activityCodeAndName'] = activityCodeAndName;
        temp['activityCode'] = activity.activityCode;
        temp['activityName'] = activity.activityName;
        activityProposalArray = [...activityProposalArray, { ...temp }];
      }
    }
    return { activityProposalArray };
  }

  async getActivityListByYearForCapnet(year: number) {
    Logger.debug('ActivitiesService.getActivityListByYearForCapnet');
    const statusId = await this.userService.getStatusId(StatusEnum.APPROVED);
    const activityProposalList = await this.proposalsModel
      .find({
        year,
        isDeleted: false,
        statusId,
      })
      .exec();

    let activityProposalArray = [];
    if (activityProposalList.length !== 0) {
      for (const activity of activityProposalList) {
        const activityCodeAndName =
          activity.activityCode + '-' + activity.activityName;
        const temp = {};
        temp['_id'] = activity._id;
        temp['activityId'] = activity.activityId;
        temp['activityCodeAndName'] = activityCodeAndName;
        temp['activityCode'] = activity.activityCode;
        temp['activityName'] = activity.activityName;
        activityProposalArray = [...activityProposalArray, { ...temp }];
      }
    }
    return { activityProposalArray };
  }

  /** Get proposal details  */
  async getProposalActivityById(proposalId: any) {
    Logger.debug('ActivitiesService.getProposalActivityById');
    const proposal = await this.proposalsModel
      .findOne({
        _id: proposalId,
        isDeleted: false,
      })
      .exec();

    if (proposal === null)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);
    else return proposal;
  }

  async checkIfProposalExistsByProposalIdAsPerUserRole(
    activityProposalId: string,
    networkId,
    partnerId,
  ) {
    Logger.debug(
      'ActivitiesService.checkIfProposalExistsByProposalIdAsPerUserRole',
    );
    const proposal = await this.proposalsModel
      .findOne({
        activityProposalId,
        networkId,
        partnerId,
        isDeleted: false,
      })
      .exec();
    if (proposal === null)
      throw new NotFoundException(errorMessages.PROPOSAL_NOT_FOUND);
    else return proposal;
  }

  async checkIfProposalExists(activityProposalId: string) {
    Logger.debug('ActivitiesService.checkIfProposalExists');
    const proposal = await this.proposalsModel
      .findOne({
        activityProposalId,
        isDeleted: false,
      })
      .exec();
    if (proposal === null)
      throw new NotFoundException(errorMessages.PROPOSAL_NOT_FOUND);
    else return proposal;
  }

  async updateApprovedCount(count: number, activityProposalId: string) {
    Logger.debug('ActivitiesService.updateApprovedCount');
    return this.proposalsModel
      .findOneAndUpdate(
        { activityProposalId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  // Check if the activity exists in Activity Model
  async checkIfActivityExistsForProposal(activityId) {
    Logger.debug('ActivitiesService.checkIfActivityExistsForProposal');
    const existingActivity = await this.activityModel
      .findOne({ _id: activityId, isDeleted: false })
      .exec();
    if (existingActivity === null) return false;
    else return true;
  }

  // Check if the activity has been proposed already or not
  async checkIfActivityAlreadyProposed(activityId) {
    Logger.debug('ActivitiesService.checkIfActivityExistsForProposal');
    const alreadyProposedActivity = await this.proposalsModel
      .findOne({ activityId, isDeleted: false })
      .exec();

    if (alreadyProposedActivity !== null)
      throw new ConflictException(
        errorMessages.ACTIVITY_PROPOSAL_ALREADY_CREATED,
      );
  }

  async checkForSceneWiseFields(createProposal) {
    Logger.debug('.checkForSceneWiseFields');
    const activityType = await this.getTypeOfActivityById(
      createProposal.activityTypeId,
    );

    if (
      ((activityType.activityTypeName === TypeOfActivityeNUM.OT_VC ||
        activityType.activityTypeName === TypeOfActivityeNUM.TOT_VC) &&
        (createProposal.numberOfParticipantsEstimated === undefined ||
          createProposal.typeOfOnlineCourse === undefined ||
          createProposal.numberOfCourseModule.length === 0 ||
          createProposal.totalCourseLength === undefined ||
          createProposal.isWebinarIncluded === undefined ||
          createProposal.facilitators === undefined)) ||
      ((activityType.activityTypeName === TypeOfActivityeNUM.BT_VC ||
        activityType.activityTypeName === TypeOfActivityeNUM.BTOT_VC) &&
        (createProposal.numberOfParticipantsEstimated === undefined ||
          createProposal.countryId === undefined ||
          createProposal.city === undefined ||
          createProposal.typeOfOnlineCourse === undefined ||
          createProposal.numberOfCourseModule.length === 0 ||
          createProposal.numberOfCourseModule === undefined ||
          createProposal.totalCourseLength === undefined ||
          createProposal.isWebinarIncluded === undefined ||
          createProposal.facilitators === undefined)) ||
      ((activityType.activityTypeName === TypeOfActivityeNUM.OT_OTHER ||
        activityType.activityTypeName === TypeOfActivityeNUM.TOT_OTHER ||
        activityType.activityTypeName === TypeOfActivityeNUM.WEBINAR) &&
        (createProposal.numberOfParticipantsEstimated === undefined ||
          createProposal.facilitators === undefined)) ||
      ((activityType.activityTypeName === TypeOfActivityeNUM.BTOT_OTHER ||
        activityType.activityTypeName === TypeOfActivityeNUM.BT_OTHER ||
        activityType.activityTypeName === TypeOfActivityeNUM.ONSITE ||
        activityType.activityTypeName === TypeOfActivityeNUM.TOT) &&
        (createProposal.numberOfParticipantsEstimated === undefined ||
          createProposal.countryId === undefined ||
          createProposal.city === undefined ||
          createProposal.facilitators === undefined))
    ) {
      throw new BadRequestException(errorMessages.FILL_MANDATORY_FIELDS);
    }
  }

  async updateProposalStatus(activityProposalId: string, statusId) {
    Logger.debug('ActivitiesService.updateProposalStatus');
    return this.proposalsModel
      .findOneAndUpdate(
        { activityProposalId, isDeleted: false },
        { statusId: statusId },
        { new: true },
      )
      .exec();
  }

  async finalSaveProposal(activityProposalId: string, user: any) {
    Logger.debug('ActivitiesService.finalSaveProposal');
    const proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
      activityProposalId,
      user.networkId,
      user.partnerId,
    );
    if (
      proposal.isFirstTabFilled &&
      proposal.isSecondTabFilled &&
      proposal.isThirdTabFilled
    ) {
      if (user.networkId === null && user.partnerId === null) {
        const approvedStatusId = await this.userService.getStatusId(
          StatusEnum.APPROVED,
        );
        return this.updateProposalStatus(activityProposalId, approvedStatusId);
      }
    } else {
      return {
        isFirstTabFilled: proposal.isFirstTabFilled,
        isSecondTabFilled: proposal.isSecondTabFilled,
        isThirdTabFilled: proposal.isThirdTabFilled,
      };
    }
  }

  async setSubmittedAtTimeOfProposal(
    activityProposalId: string,
    submittedAt: Date,
  ) {
    Logger.debug('ActivitiesService.setSubmittedAtTimeOfProposal');
    return this.proposalsModel
      .findOneAndUpdate(
        {
          activityProposalId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTimeOfProposal(
    activityProposalId: string,
    approvedAt: Date,
  ) {
    Logger.debug('ActivitiesService.setApprovedAtTimeOfProposal');
    return this.proposalsModel
      .findOneAndUpdate(
        {
          activityProposalId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async createProposal(user: any, createProposal: CreateActivityProposalDTO) {
    Logger.debug('ActivitiesService.createProposal');
    const { instituteName } = await this.getInstituteNameAndStatusId(user);
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (
      createProposal.proposedForCurrentYearWorkplan === true &&
      createProposal.activityId === undefined
    )
      throw new BadRequestException(errorMessages.SELECT_WORKPLAN_ACTIVITY);

    if (createProposal.activityId !== undefined) {
      await this.checkIfActivityAlreadyProposed(createProposal.activityId);
      const existingActivity = await this.checkIfActivityExistsForProposal(
        createProposal.activityId,
      );
      if (!existingActivity)
        throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);
    }

    await this.checkForSceneWiseFields(createProposal);
    const proposal = await new this.proposalsModel({
      ...createProposal,
      activityProposalId: uuidv4(),
      instituteName,
      statusId: inProgressStatusId,
      networkId: user.networkId,
      partnerId: user.partnerId,
      createdBy: user._id,
      updatedBy: user._id,
      isFirstTabFilled: true,
    }).save();

    await this.melpService.addActivityLog(
      user,
      `Proposal - ${proposal.activityCode} created`,
    );
    return proposal;
  }

  async editProposal(
    activityProposalId: string,
    user: any,
    editProposal: EditProposalDTO,
  ) {
    Logger.debug('ActivitiesService.editProposal');
    const proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
      activityProposalId,
      user.networkId,
      user.partnerId,
    );

    await this.checkForSceneWiseFields(editProposal);
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const updatedProposal = await this.proposalsModel
      .findOneAndUpdate(
        {
          activityProposalId: proposal.activityProposalId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        { ...editProposal, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `Proposal - ${updatedProposal.activityCode} updated`,
    );
    return updatedProposal;
  }

  // same function for add and edit
  async addFinancialDetails(
    activityProposalId: string,
    user: any,
    addFinancials: AddFinancialDetailsDTO,
  ) {
    Logger.debug('ActivitiesService.addFinancialDetails');
    const proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
      activityProposalId,
      user.networkId,
      user.partnerId,
    );

    if (
      addFinancials.requireCapnetFinancialContribution &&
      (addFinancials.totalCapnetContribution === undefined ||
        addFinancials.totalBudgetForActivity === undefined ||
        addFinancials.totalInkindContribution === undefined ||
        addFinancials.totalPartnerContribution === undefined)
    ) {
      throw new BadRequestException(errorMessages.FILL_MANDATORY_FIELDS);
    }

    const coordinationCostList = addFinancials.coordinationCosts.map(
      (coordinationCostData) => ({
        ...coordinationCostData,
        activityProposalId: proposal._id,
        updatedBy: user._id,
      }),
    );

    for (const coordinationCost of coordinationCostList) {
      if (coordinationCost.coordinationCostId !== undefined) {
        await this.coordinationModel
          .updateOne(
            {
              activityProposalId: proposal._id,
              coordinationCostId: coordinationCost.coordinationCostId,
              isDeleted: false,
            },
            coordinationCost,
          )
          .exec();
      } else {
        await this.coordinationModel.create({
          ...coordinationCost,
          coordinationCostId: uuidv4(),
          createdBy: user._id,
        });
      }
    }

    const travelCostList = addFinancials.travelCosts.map((travelCostData) => ({
      ...travelCostData,
      activityProposalId: proposal._id,
      updatedBy: user._id,
    }));

    for (const travelCost of travelCostList) {
      if (travelCost.travelCostId !== undefined) {
        await this.travelModel
          .updateOne(
            {
              activityProposalId: proposal._id,
              travelCostId: travelCost.travelCostId,
              isDeleted: false,
            },
            travelCost,
          )
          .exec();
      } else {
        await this.travelModel.create({
          ...travelCost,
          travelCostId: uuidv4(),
          createdBy: user._id,
        });
      }
    }

    const locationCostList = addFinancials.locationCosts.map(
      (locationCostData) => ({
        ...locationCostData,
        activityProposalId: proposal._id,
        updatedBy: user._id,
      }),
    );

    for (const locationCost of locationCostList) {
      if (locationCost.locationCostId !== undefined) {
        await this.locationModel
          .updateOne(
            {
              activityProposalId: proposal._id,
              locationCostId: locationCost.locationCostId,
              isDeleted: false,
            },
            locationCost,
          )
          .exec();
      } else {
        await this.locationModel.create({
          ...locationCost,
          locationCostId: uuidv4(),
          createdBy: user._id,
        });
      }
    }

    const otherCostList = addFinancials.otherCosts.map((otherCostData) => ({
      ...otherCostData,
      activityProposalId: proposal._id,
      updatedBy: user._id,
    }));

    for (const otherCost of otherCostList) {
      if (otherCost.otherCostId !== undefined) {
        await this.otherModel
          .updateOne(
            {
              activityProposalId: proposal._id,
              otherCostId: otherCost.otherCostId,
              isDeleted: false,
            },
            otherCost,
          )
          .exec();
      } else {
        await this.otherModel.create({
          ...otherCost,
          otherCostId: uuidv4(),
          createdBy: user._id,
        });
      }
    }

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const updatedProposal = await this.proposalsModel
      .findOneAndUpdate(
        {
          activityProposalId: proposal.activityProposalId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        { ...addFinancials, updatedBy: user._id, isSecondTabFilled: true },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `Proposal - ${updatedProposal.activityCode} updated`,
    );
    return updatedProposal;
  }

  // Same function for add and edit
  async addAdditionalInfo(
    activityProposalId: string,
    user: any,
    addtionalInfo: AddAdditionalInfoDTO,
  ) {
    Logger.debug('ActivitiesService.addAdditionalInfo');
    const proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
      activityProposalId,
      user.networkId,
      user.partnerId,
    );

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const updatedProposal = await this.proposalsModel
      .findOneAndUpdate(
        {
          activityProposalId: proposal.activityProposalId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        { ...addtionalInfo, updatedBy: user._id, isThirdTabFilled: true },
        { new: true },
      )
      .exec();
    await this.melpService.addActivityLog(
      user,
      `Proposal - ${updatedProposal.activityCode} updated`,
    );
    return updatedProposal;
  }

  async removeProposal(activityProposalId: string, user: any) {
    Logger.debug('ActivitiesService.removeProposal');
    const proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
      activityProposalId,
      user.networkId,
      user.partnerId,
    );

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (proposal.statusId.equals(inProgressStatusId)) {
      const updatedProposal = await this.proposalsModel
        .findOneAndUpdate(
          {
            activityProposalId,
            isDeleted: false,
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Proposal - ${updatedProposal.activityCode} deleted`,
      );
      return updatedProposal;
    } else {
      throw new BadRequestException(errorMessages.PROPOSAL_CANNOT_BE_DELETED);
    }
  }

  // Detailed View for proposal
  async viewProposal(activityProposalId: string, user: any) {
    Logger.debug('ActivitiesService.viewProposal');
    let proposal;
    if (user.networkId === null && user.partnerId === null) {
      proposal = await this.proposalsModel
        .findOne({ activityProposalId, isDeleted: false })
        .exec();
    } else {
      proposal = await this.checkIfProposalExistsByProposalIdAsPerUserRole(
        activityProposalId,
        user.networkId,
        user.partnerId,
      );
    }
    if (proposal === null)
      throw new NotFoundException(errorMessages.PROPOSAL_NOT_FOUND);
    const coordinationCostList = await this.coordinationModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();

    const travelCostList = await this.travelModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();

    const locationCostList = await this.locationModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();

    const otherCostList = await this.otherModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();

    let originalName;
      if(proposal.addtionalInfo && proposal.addtionalInfo.fileName)
        originalName = (proposal.addtionalInfo.fileName).split(' -')[0];
    
    return {
      proposal,
      coordinationCostList,
      travelCostList,
      locationCostList,
      otherCostList,
      originalName: originalName? originalName:""
    };
  }

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ActivitiesService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  async getImplementationStatusForActivities(
    proposal,
    approvedStatusId,
    year: number,
  ) {
    Logger.debug('ActivitiesService.getImplementationStatusForActivities');
    let implementationStatus;
    const outputReport = await this.outputReportModel
      .findOne({ proposalId: proposal._id, isDeleted: false, year })
      .exec();
    const todaysDate = new Date();
    const startDate = new Date(proposal.proposedStartDate);
    const endDateAfter3Weeks = new Date(proposal.proposedEndDate);
    endDateAfter3Weeks.setDate(endDateAfter3Weeks.getDate() + 3 * 7);

    if (proposal.statusId.equals(approvedStatusId))
      implementationStatus = ImplementationStatusEnum.PROPOSED;
    if (todaysDate === startDate || todaysDate > startDate)
      implementationStatus = ImplementationStatusEnum.ACTIVE;
    if (todaysDate > endDateAfter3Weeks)
      implementationStatus = ImplementationStatusEnum.DELAYED;
    if (
      outputReport !== null &&
      outputReport.outputReportStatus.equals(approvedStatusId)
    )
      implementationStatus = ImplementationStatusEnum.COMPLETED;
    return implementationStatus;
  }

  async getActivityTracker(
    user: any,
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ActivitiesService.getActivityTracker');
    let proposalsList,
      proposals = [],
      totalProposalCount;

    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (user.networkId === null && user.partnerId === null) {
      proposalsList = await this.proposalsModel
        .find({
          $and: [
            {
              isDeleted: false,
              statusId: approvedStatusId,
              year,
            },
            {
              $or: [
                { activityCode: regex },
                { instituteName: regex },
                { activityName: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalProposalCount = await this.proposalsModel
        .find({
          isDeleted: false,
          statusId: approvedStatusId,
          year,
        })
        .count()
        .exec();
    } else {
      proposalsList = await this.proposalsModel
        .find({
          $and: [
            {
              networkId: user.networkId,
              partnerId: user.partnerId,
              isDeleted: false,
              statusId: approvedStatusId,
              year,
            },
            {
              $or: [{ activityCode: regex }, { activityName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalProposalCount = await this.proposalsModel
        .find({
          networkId: user.networkId,
          partnerId: user.partnerId,
          isDeleted: false,
          statusId: approvedStatusId,
          year,
        })
        .count()
        .exec();
    }

    for (const proposal of proposalsList) {
      const temp = {};
      const proposedQuarter = Math.ceil(
        (new Date(proposal.proposedStartDate).getMonth() + 1) / 3,
      );

      const impactStoryCount = await this.impactStoryModel
        .find({ proposalId: { $in: [proposal._id] }, isDeleted: false, year })
        .count()
        .exec();
      const implementationStatus =
        await this.getImplementationStatusForActivities(
          proposal,
          approvedStatusId,
          year,
        );

      temp['proposalId'] = proposal._id;
      temp['activityProposalId'] = proposal.activityProposalId;
      temp['instituteName'] = proposal.instituteName;
      temp['activityCode'] = proposal.activityCode;
      temp['activityName'] = proposal.activityName;
      temp['activityType'] = await this.getTypeOfActivityById(
        proposal.activityTypeId,
      );
      temp['implementationStatus'] = implementationStatus;
      temp['proposedQuarter'] = 'Q' + proposedQuarter;
      temp['proposedStartDate'] = proposal.proposedStartDate;
      temp['proposedEndDate'] = proposal.proposedEndDate;
      temp['impactStoryCount'] = impactStoryCount;
      proposals = [...proposals, { ...temp }];
    }

    return {
      proposals,
      totalProposalCount,
      totalPageCount: Math.ceil(totalProposalCount / 10),
    };
  }

  async getArrayOfProposalObject(proposalsList: any) {
    Logger.debug('ActivitiesService.getArrayOfProposalObject');
    let proposals = [];
    for (const proposal of proposalsList) {
      const temp = {};
      temp['year'] = proposal.year;
      temp['activityProposalId'] = proposal.activityProposalId;
      temp['instituteName'] = proposal.instituteName;
      temp['status'] = await this.userService.getStatusName(proposal.statusId);
      temp['activityCode'] = proposal.activityCode;
      temp['activityName'] = proposal.activityName;
      temp['activityType'] = await this.getTypeOfActivityById(
        proposal.activityTypeId,
      );
      temp['proposedStartDate'] = proposal.proposedStartDate;
      temp['proposedBudget'] = proposal.totalBudgetForActivity;
      temp['createdAt'] = proposal.createdAt;
      temp['submittedAt'] = proposal.submittedAt;
      temp['approvedAt'] = proposal.approvedAt;
      temp['lastUpdated'] = proposal.updatedAt;
      temp['isFirstTabFilled'] = proposal.isFirstTabFilled;
      temp['isSecondTabFilled'] = proposal.isSecondTabFilled;
      temp['isThirdTabFilled'] = proposal.isThirdTabFilled;
      temp['approvedCount'] = proposal.approvedCount;
      proposals = [...proposals, { ...temp }];
    }
    return proposals;
  }

  async getListOfProposals(
    user: any,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('ActivitiesService.getListOfProposals');
    let proposalsList, totalProposalCount;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    if (user.networkId === null && user.partnerId === null) {
      proposalsList = await this.proposalsModel
        .find({
          $and: [
            {
              isDeleted: false,
              year,
              // statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [
                {
                  $and: [
                    { instituteName: { $ne: CapnetEnum.CAPNET } },
                    { statusId: { $ne: inProgressStatusId } },
                  ],
                },
                { instituteName: CapnetEnum.CAPNET },
              ],
            },
            {
              $or: [
                { activityCode: regex },
                { instituteName: regex },
                { activityName: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalProposalCount = await this.proposalsModel
        .find({
          $and: [
            {
              isDeleted: false,
              year,
              // statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [
                {
                  $and: [
                    { instituteName: { $ne: CapnetEnum.CAPNET } },
                    { statusId: { $ne: inProgressStatusId } },
                  ],
                },
                { instituteName: CapnetEnum.CAPNET },
              ],
            },
          ],
        })
        .count()
        .exec();
    } else {
      proposalsList = await this.proposalsModel
        .find({
          $and: [
            {
              networkId: user.networkId,
              partnerId: user.partnerId,
              isDeleted: false,
              year,
            },
            {
              $or: [{ activityCode: regex }, { activityName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalProposalCount = await this.proposalsModel
        .find({
          networkId: user.networkId,
          partnerId: user.partnerId,
          isDeleted: false,
          year,
        })
        .count()
        .exec();
    }

    const proposals = await this.getArrayOfProposalObject(proposalsList);
    return {
      proposals,
      totalProposalCount,
      totalPageCount: Math.ceil(totalProposalCount / 10),
    };
  }

  async viewAllNetworksProposals(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('ActivitiesService.viewAllNetworksProposals');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const proposalsList = await this.proposalsModel
      .find({
        $and: [
          {
            networkId: { $ne: null },
            partnerId: { $eq: null },
            isDeleted: false,
            statusId: { $ne: inProgressStatusId },
            year,
          },
          {
            $or: [
              { activityCode: regex },
              { activityName: regex },
              { instituteName: regex },
            ],
          },
        ],
      })
      .sort(sortQuery)
      .skip(pageLimit * pageIndex)
      .limit(pageLimit)
      .exec();

    const totalProposalCount = await this.proposalsModel
      .find({
        networkId: { $ne: null },
        partnerId: { $eq: null },
        isDeleted: false,
        statusId: { $ne: inProgressStatusId },
        year,
      })
      .count()
      .exec();

    const proposals = await this.getArrayOfProposalObject(proposalsList);
    return {
      proposals,
      totalProposalCount,
      totalPageCount: Math.ceil(totalProposalCount / 10),
    };
  }

  async viewAllPartnersProposals(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('ActivitiesService.viewAllPartnersProposals');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const proposalsList = await this.proposalsModel
      .find({
        $and: [
          {
            networkId: { $eq: null },
            partnerId: { $ne: null },
            isDeleted: false,
            statusId: { $ne: inProgressStatusId },
            year,
          },
          {
            $or: [
              { activityCode: regex },
              { activityName: regex },
              { instituteName: regex },
            ],
          },
        ],
      })
      .sort(sortQuery)
      .skip(pageLimit * pageIndex)
      .limit(pageLimit)
      .exec();

    const totalProposalCount = await this.proposalsModel
      .find({
        networkId: { $eq: null },
        partnerId: { $ne: null },
        isDeleted: false,
        statusId: { $ne: inProgressStatusId },
        year,
      })
      .count()
      .exec();

    const proposals = await this.getArrayOfProposalObject(proposalsList);
    return {
      proposals,
      totalProposalCount,
      totalPageCount: Math.ceil(totalProposalCount / 10),
    };
  }

  async worksheetCreation(
    proposalSheet: Worksheet,
    coordinationCostSheet: Worksheet,
    travelCostSheet: Worksheet,
    locationCostSheet: Worksheet,
    otherCostSheet: Worksheet,
  ) {
    Logger.debug('ActivitiesService.worksheetCreation');
    proposalSheet.columns = [
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Institute Name', key: 'instituteName', width: 20 },
      {
        header: 'Current Year Workplan Proposal',
        key: 'proposedForCurrentYearWorkplan',
        width: 10,
      },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 30 },
      { header: 'Focal Person', key: 'focalPersonName', width: 20 },
      { header: 'Result', key: 'result', width: 20 },
      { header: 'Indicators', key: 'indicators', width: 20 },
      { header: 'Thematic Area', key: 'thematicArea', width: 30 },
      { header: 'Start Date', key: 'proposedStartDate', width: 15 },
      { header: 'End Date', key: 'proposedEndDate', width: 15 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Activity Type', key: 'activityType', width: 20 },
      { header: 'Activity Scope', key: 'activityScope', width: 20 },
      {
        header: 'Activity Target Groups',
        key: 'activityTargetGroups',
        width: 40,
      },
      { header: 'Main Partners', key: 'mainPartners', width: 20 },
      { header: 'About Activity', key: 'aboutActivity', width: 20 },
      { header: 'Expected Outputs', key: 'expectedOutputs', width: 20 },
      {
        header: 'Number Of Participants',
        key: 'numberOfParticipantsEstimated',
        width: 20,
      },
      { header: 'Type Of Online Course', key: 'typeOfOnlineCourse', width: 20 },
      {
        header: 'Number Of Course Module',
        key: 'numberOfCourseModule',
        width: 30,
      },
      { header: 'Total Course Length', key: 'totalCourseLength', width: 20 },
      { header: 'Is Webinar Included', key: 'isWebinarIncluded', width: 20 },
      { header: 'Facilitators', key: 'facilitators', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      {
        header: 'Require Capnet Financial Contribution',
        key: 'requireCapnetFinancialContribution',
        width: 20,
      },
      {
        header: 'Total Budget For Activity',
        key: 'totalBudgetForActivity',
        width: 20,
      },
      {
        header: 'Total Capnet Contribution',
        key: 'totalCapnetContribution',
        width: 20,
      },
      {
        header: 'Total Partner Contribution',
        key: 'totalPartnerContribution',
        width: 20,
      },
      {
        header: 'Total In-kind Contribution',
        key: 'totalInkindContribution',
        width: 20,
      },

      {
        header: 'Sustainable Water Management',
        key: 'addressSustainableWaterManagement',
        width: 20,
      },
      {
        header: 'Vulnerable Groups Involved',
        key: 'wereVulnerableGroupsInvolved',
        width: 20,
      },
      { header: 'Vulnerable Groups', key: 'vulnerableGroupsDetail', width: 20 },
      {
        header: 'Social Issues Included',
        key: 'isSocialIssuesIncluded',
        width: 20,
      },
      { header: 'Social Issues', key: 'socialIssuesDetail', width: 20 },

      { header: 'Additional Comments', key: 'additionalComments', width: 20 },
    ];

    coordinationCostSheet.columns = [
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Coordination', key: 'coordination', width: 20 },
      { header: 'Budget', key: 'budget', width: 20 },
      { header: 'Amount Per Unit', key: 'amountPerUnit', width: 20 },
      { header: 'Number Of Units', key: 'numberOfUnits', width: 20 },
      {
        header: 'Capnet Financial Funding',
        key: 'capnetFinancialFunding',
        width: 20,
      },
      {
        header: 'Network Financial Funding',
        key: 'networkFinancialFunding',
        width: 20,
      },
      {
        header: 'Partner Financial Funding',
        key: 'partnerFinancialFunding',
        width: 20,
      },
      {
        header: 'Network InKind Funding',
        key: 'networkInKindFunding',
        width: 20,
      },
      {
        header: 'Partner InKind Funding',
        key: 'partnerInKindFunding',
        width: 20,
      },
    ];

    travelCostSheet.columns = [
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Travel', key: 'travel', width: 20 },
      { header: 'Budget', key: 'budget', width: 20 },
      { header: 'Amount Per Unit', key: 'amountPerUnit', width: 20 },
      { header: 'Number Of Units', key: 'numberOfUnits', width: 20 },
      {
        header: 'Capnet Financial Funding',
        key: 'capnetFinancialFunding',
        width: 20,
      },
      {
        header: 'Network Financial Funding',
        key: 'networkFinancialFunding',
        width: 20,
      },
      {
        header: 'Partner Financial Funding',
        key: 'partnerFinancialFunding',
        width: 20,
      },
      {
        header: 'Network InKind Funding',
        key: 'networkInKindFunding',
        width: 20,
      },
      {
        header: 'Partner InKind Funding',
        key: 'partnerInKindFunding',
        width: 20,
      },
    ];

    locationCostSheet.columns = [
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Budget', key: 'budget', width: 20 },
      { header: 'Amount Per Unit', key: 'amountPerUnit', width: 20 },
      { header: 'Number Of Units', key: 'numberOfUnits', width: 20 },
      {
        header: 'Capnet Financial Funding',
        key: 'capnetFinancialFunding',
        width: 20,
      },
      {
        header: 'Network Financial Funding',
        key: 'networkFinancialFunding',
        width: 20,
      },
      {
        header: 'Partner Financial Funding',
        key: 'partnerFinancialFunding',
        width: 20,
      },
      {
        header: 'Network InKind Funding',
        key: 'networkInKindFunding',
        width: 20,
      },
      {
        header: 'Partner InKind Funding',
        key: 'partnerInKindFunding',
        width: 20,
      },
    ];

    otherCostSheet.columns = [
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Other Cost', key: 'other', width: 20 },
      { header: 'Budget', key: 'budget', width: 20 },
      { header: 'Amount Per Unit', key: 'amountPerUnit', width: 20 },
      { header: 'Number Of Units', key: 'numberOfUnits', width: 20 },
      {
        header: 'Capnet Financial Funding',
        key: 'capnetFinancialFunding',
        width: 20,
      },
      {
        header: 'Network Financial Funding',
        key: 'networkFinancialFunding',
        width: 20,
      },
      {
        header: 'Partner Financial Funding',
        key: 'partnerFinancialFunding',
        width: 20,
      },
      {
        header: 'Network InKind Funding',
        key: 'networkInKindFunding',
        width: 20,
      },
      {
        header: 'Partner InKind Funding',
        key: 'partnerInKindFunding',
        width: 20,
      },
    ];

    proposalSheet.addRow({
      year: 'Year',
      instituteName: 'Institute Name',
      proposedForCurrentYearWorkplan: 'Current Year Workplan Proposal',
      activityCode: 'Activity Code',
      activityName: 'Activity Name',
      focalPersonName: 'Focal Person',
      result: 'Result',
      indicators: 'Indicators',
      thematicArea: 'Thematic Area',
      proposedStartDate: 'Start Date',
      proposedEndDate: 'End Date',
      language: 'Language',
      activityType: 'Activity Type',
      activityScope: 'Activity Scope',
      activityTargetGroups: 'Activity Target Groups',
      mainPartners: 'Main Partners',
      aboutActivity: 'About Activity',
      expectedOutputs: 'Expected Outputs',
      numberOfParticipantsEstimated: 'Number Of Participants',
      typeOfOnlineCourse: 'Type Of Online Course',
      numberOfCourseModule: 'Number Of Course Module',
      totalCourseLength: 'Total Course Length',
      isWebinarIncluded: 'Is Webinar Included',
      facilitators: 'Facilitators',
      country: 'Country',
      city: 'City',
      requireCapnetFinancialContribution:
        'Require Capnet Financial Contribution',
      totalBudgetForActivity: 'Total Budget For Activity',
      totalCapnetContribution: 'Total Capnet Contribution',
      totalPartnerContribution: 'Total Partner Contribution',
      totalInkindContribution: 'Total In-kind Contribution',
      addressSustainableWaterManagement: 'Sustainable Water Management',
      wereVulnerableGroupsInvolved: 'Vulnerable Groups Involved',
      vulnerableGroupsDetail: 'Vulnerable Groups',
      isSocialIssuesIncluded: 'Social Issues Included',
      socialIssuesDetail: 'Social Issues',
      additionalComments: 'Additional Comments',
    });

    coordinationCostSheet.addRow({
      activityCode: 'Activity Code',
      coordination: 'Coordination',
      budget: 'Budget',
      amountPerUnit: 'Amount Per Unit',
      numberOfUnits: 'Number Of Units',
      capnetFinancialFunding: 'Capnet Financial Funding',
      networkFinancialFunding: 'Network Financial Funding',
      partnerFinancialFunding: 'Partner Financial Funding',
      networkInKindFunding: 'Network InKind Funding',
      partnerInKindFunding: 'Partner InKind Funding',
    });

    travelCostSheet.addRow({
      activityCode: 'Activity Code',
      travel: 'Travel',
      budget: 'Budget',
      amountPerUnit: 'Amount Per Unit',
      numberOfUnits: 'Number Of Units',
      capnetFinancialFunding: 'Capnet Financial Funding',
      networkFinancialFunding: 'Network Financial Funding',
      partnerFinancialFunding: 'Partner Financial Funding',
      networkInKindFunding: 'Network InKind Funding',
      partnerInKindFunding: 'Partner InKind Funding',
    });

    locationCostSheet.addRow({
      activityCode: 'Activity Code',
      location: 'Location',
      budget: 'Budget',
      amountPerUnit: 'Amount Per Unit',
      numberOfUnits: 'Number Of Units',
      capnetFinancialFunding: 'Capnet Financial Funding',
      networkFinancialFunding: 'Network Financial Funding',
      partnerFinancialFunding: 'Partner Financial Funding',
      networkInKindFunding: 'Network InKind Funding',
      partnerInKindFunding: 'Partner InKind Funding',
    });

    otherCostSheet.addRow({
      activityCode: 'Activity Code',
      other: 'Other Cost',
      budget: 'Budget',
      amountPerUnit: 'Amount Per Unit',
      numberOfUnits: 'Number Of Units',
      capnetFinancialFunding: 'Capnet Financial Funding',
      networkFinancialFunding: 'Network Financial Funding',
      partnerFinancialFunding: 'Partner Financial Funding',
      networkInKindFunding: 'Network InKind Funding',
      partnerInKindFunding: 'Partner InKind Funding',
    });

    proposalSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    coordinationCostSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    travelCostSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    locationCostSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    otherCostSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadActivityProposal(
    res,
    activityProposalId: string,
    proposalSheet: Worksheet,
    proposalCount: number,
  ) {
    Logger.debug('ActivitiesService.downloadActivityProposal');
    const proposal = await this.checkIfProposalExists(activityProposalId);

    /** Get selected thematic-area or other-thematic-area if other is selected */
    const thematicArea = await this.getActivityThematicAreaById(
      proposal.thematicAreaId,
    );
    let thematicAreaValue;
    if (thematicArea.thematicAreaName === 'Other') {
      thematicAreaValue = proposal.otherThematicArea;
    } else {
      thematicAreaValue = thematicArea.thematicAreaName;
    }

    /** Get selected activity-scope or other-activity-scope if other is selected */
    const activityScope = await this.getActivityScopeById(
      proposal.activityScopeId,
    );
    let activityScopeValue;
    if (activityScope.activityScopeName === 'Other') {
      activityScopeValue = proposal.otherActivityScope;
    } else {
      activityScopeValue = activityScope.activityScopeName;
    }

    /** Get a string of selected target groups */
    let activityTargetGroups = '',
      activityTargetGroupsCount = 1;
    for (const activityTargetGroup of proposal.activityTargetGroups) {
      if (activityTargetGroup.value) {
        if (activityTargetGroupsCount === 1) {
          activityTargetGroups += activityTargetGroup.key;
          activityTargetGroupsCount++;
        } else {
          activityTargetGroups += ', ' + activityTargetGroup.key;
        }
      }
    }
    activityTargetGroups += '.';

    const activityType = await this.getTypeOfActivityById(
      proposal.activityTypeId,
    );
    const result = await this.melpService.getResultById(proposal.resultId);

    let indicators = '',
      indicatorCount = 1;
    for (const indicatorId of proposal.indicatorId) {
      const indicator = await this.melpService.getIndicatorById(indicatorId);
      if (indicatorCount === 1) {
        indicators += indicator.indicatorName;
        indicatorCount++;
      } else {
        indicators += ', ' + indicator.indicatorName;
      }
    }
    indicators += '.';

    let courseModules = '';
    if (proposal.numberOfCourseModule.length === 0) {
      courseModules = 'NA';
    } else {
      let courseModulesCount = 1;
      for (const courseModule of proposal.numberOfCourseModule) {
        if (courseModulesCount === 1) {
          courseModules += `Module name = ${courseModule.moduleName} and Module number = ${courseModule.moduleNumber}`;
          courseModulesCount++;
        } else {
          courseModules += `, Module name = ${courseModule.moduleName} and Module number = ${courseModule.moduleNumber}`;
        }
      }
      courseModules += '.';
    }
    console.log(
      'CITY ',
      proposal.city.length,
      proposal.vulnerableGroupsDetail,
      proposal.socialIssuesDetail,
    );
    proposalSheet.getRow(proposalCount).values = {
      year: proposal.year,
      instituteName: proposal.instituteName,
      proposedForCurrentYearWorkplan:
        proposal.proposedForCurrentYearWorkplan === true ? 'Yes' : 'No',
      activityCode: proposal.activityCode,
      activityName: proposal.activityName,
      focalPersonName: proposal.focalPersonName,
      result: result.resultName,
      indicators: indicators,
      thematicArea: thematicAreaValue,
      proposedStartDate: proposal.proposedStartDate.toLocaleDateString(),
      proposedEndDate: proposal.proposedEndDate.toLocaleDateString(),
      language: proposal.language,
      activityType: activityType.activityTypeName,
      activityScope: activityScopeValue,
      activityTargetGroups: activityTargetGroups,
      mainPartners: proposal.mainPartners,
      aboutActivity: proposal.aboutActivity,
      expectedOutputs: proposal.expectedOutputs,
      numberOfParticipantsEstimated:
        proposal.numberOfParticipantsEstimated === undefined
          ? 'NA'
          : proposal.numberOfParticipantsEstimated,
      typeOfOnlineCourse:
        proposal.typeOfOnlineCourse === undefined
          ? 'NA'
          : proposal.typeOfOnlineCourse,
      numberOfCourseModule: courseModules,
      totalCourseLength:
        proposal.totalCourseLength === undefined
          ? 'NA'
          : proposal.totalCourseLength,
      isWebinarIncluded: proposal.isWebinarIncluded === true ? 'Yes' : 'No',
      facilitators:
        proposal.facilitators === undefined ? 'NA' : proposal.facilitators,
      country:
        proposal.countryId === undefined
          ? 'NA'
          : await this.getCountryNameById(proposal.countryId),
      city:
        proposal.city === undefined || proposal.city.length === 0
          ? 'NA'
          : proposal.city,
      requireCapnetFinancialContribution:
        proposal.requireCapnetFinancialContribution === true ? 'Yes' : 'No',
      totalBudgetForActivity:
        proposal.totalBudgetForActivity === undefined ||
        proposal.totalBudgetForActivity === 0
          ? 'NA'
          : proposal.totalBudgetForActivity,
      totalCapnetContribution:
        proposal.totalCapnetContribution === undefined ||
        proposal.totalCapnetContribution === 0
          ? 'NA'
          : proposal.totalCapnetContribution,
      totalPartnerContribution:
        proposal.totalPartnerContribution === undefined ||
        proposal.totalPartnerContribution === 0
          ? 'NA'
          : proposal.totalPartnerContribution,
      totalInkindContribution:
        proposal.totalInkindContribution === undefined ||
        proposal.totalInkindContribution === 0
          ? 'NA'
          : proposal.totalInkindContribution,
      addressSustainableWaterManagement:
        proposal.addressSustainableWaterManagement,
      wereVulnerableGroupsInvolved:
        proposal.wereVulnerableGroupsInvolved === true ? 'Yes' : 'No',
      vulnerableGroupsDetail:
        proposal.vulnerableGroupsDetail === undefined ||
        proposal.vulnerableGroupsDetail.length === 0
          ? 'NA'
          : proposal.vulnerableGroupsDetail,
      isSocialIssuesIncluded:
        proposal.isSocialIssuesIncluded === true ? 'Yes' : 'No',
      socialIssuesDetail:
        proposal.socialIssuesDetail === undefined ||
        proposal.socialIssuesDetail.length === 0
          ? 'NA'
          : proposal.socialIssuesDetail,
      additionalComments:
        proposal.additionalComments === undefined ||
        proposal.additionalComments.length === 0
          ? 'NA'
          : proposal.additionalComments,
    };
  }

  async downloadCoordinationCosts(
    coordinationCostSheet: Worksheet,
    coordinationCostCount: number,
    activityCode: string,
    coordinationCost: CoordinationCost,
  ) {
    Logger.debug('ActivitiesService.downloadCoordinationCosts');
    coordinationCostSheet.getRow(coordinationCostCount).values = {
      activityCode: activityCode,
      coordination: coordinationCost.coordination,
      budget: coordinationCost.budget,
      amountPerUnit: coordinationCost.amountPerUnit,
      numberOfUnits: coordinationCost.numberOfUnits,
      capnetFinancialFunding: coordinationCost.capnetFinancialFunding,
      networkFinancialFunding: coordinationCost.networkFinancialFunding,
      partnerFinancialFunding: coordinationCost.partnerFinancialFunding,
      networkInKindFunding: coordinationCost.networkInKindFunding,
      partnerInKindFunding: coordinationCost.partnerInKindFunding,
    };
  }

  async downloadTravelCosts(
    travelCostSheet: Worksheet,
    travelCostCount: number,
    activityCode: string,
    travelCost: TravelCost,
  ) {
    Logger.debug('ActivitiesService.downloadTravelCosts');
    travelCostSheet.getRow(travelCostCount).values = {
      activityCode: activityCode,
      travel: travelCost.travel,
      budget: travelCost.budget,
      amountPerUnit: travelCost.amountPerUnit,
      numberOfUnits: travelCost.numberOfUnits,
      capnetFinancialFunding: travelCost.capnetFinancialFunding,
      networkFinancialFunding: travelCost.networkFinancialFunding,
      partnerFinancialFunding: travelCost.partnerFinancialFunding,
      networkInKindFunding: travelCost.networkInKindFunding,
      partnerInKindFunding: travelCost.partnerInKindFunding,
    };
  }

  async downloadLocationCosts(
    locationCostSheet: Worksheet,
    locationCostCount: number,
    activityCode: string,
    locationCost: LocationCost,
  ) {
    Logger.debug('ActivitiesService.downloadLocationCosts');
    locationCostSheet.getRow(locationCostCount).values = {
      activityCode: activityCode,
      location: locationCost.location,
      budget: locationCost.budget,
      amountPerUnit: locationCost.amountPerUnit,
      numberOfUnits: locationCost.numberOfUnits,
      capnetFinancialFunding: locationCost.capnetFinancialFunding,
      networkFinancialFunding: locationCost.networkFinancialFunding,
      partnerFinancialFunding: locationCost.partnerFinancialFunding,
      networkInKindFunding: locationCost.networkInKindFunding,
      partnerInKindFunding: locationCost.partnerInKindFunding,
    };
  }

  async downloadOtherCosts(
    otherCostSheet: Worksheet,
    otherCostCount: number,
    activityCode: string,
    otherCost: OtherCost,
  ) {
    Logger.debug('ActivitiesService.downloadOtherCosts');
    otherCostSheet.getRow(otherCostCount).values = {
      activityCode: activityCode,
      other: otherCost.other,
      budget: otherCost.budget,
      amountPerUnit: otherCost.amountPerUnit,
      numberOfUnits: otherCost.numberOfUnits,
      capnetFinancialFunding: otherCost.capnetFinancialFunding,
      networkFinancialFunding: otherCost.networkFinancialFunding,
      partnerFinancialFunding: otherCost.partnerFinancialFunding,
      networkInKindFunding: otherCost.networkInKindFunding,
      partnerInKindFunding: otherCost.partnerInKindFunding,
    };
  }

  async commonFunctionForMultipleDownloads(
    proposalList: ActivityProposals[],
    workbook: Workbook,
    year: number,
    res,
  ) {
    Logger.debug('ActivitiesService.commonFunctionForMultipleDownloads');
    if (proposalList.length === 0)
      throw new NotFoundException(errorMessages.PROPOSAL_NOT_FOUND);

    const proposalSheet = workbook.addWorksheet(`Proposal - ${year}`);
    const coordinationCostSheet = workbook.addWorksheet(
      `Coordination Cost - ${year}`,
    );
    const travelCostSheet = workbook.addWorksheet(`Travel Cost - ${year}`);
    const locationCostSheet = workbook.addWorksheet(`Location Cost - ${year}`);
    const otherCostSheet = workbook.addWorksheet(`Other Cost - ${year}`);

    await this.worksheetCreation(
      proposalSheet,
      coordinationCostSheet,
      travelCostSheet,
      locationCostSheet,
      otherCostSheet,
    );

    let proposalCount = 2,
      coordinationCostCount = 2,
      travelCostCount = 2,
      locationCostCount = 2,
      otherCostCount = 2;

    for (const proposal of proposalList) {
      await this.downloadActivityProposal(
        res,
        proposal.activityProposalId,
        proposalSheet,
        proposalCount,
      );
      proposalCount++;

      const coordinationCostList = await this.coordinationModel
        .find({ activityProposalId: proposal._id, isDeleted: false })
        .exec();
      for (const coordinationCost of coordinationCostList) {
        await this.downloadCoordinationCosts(
          coordinationCostSheet,
          coordinationCostCount,
          proposal.activityCode,
          coordinationCost,
        );
        coordinationCostCount++;
      }

      const travelCostList = await this.travelModel
        .find({ activityProposalId: proposal._id, isDeleted: false })
        .exec();
      for (const travelCost of travelCostList) {
        await this.downloadTravelCosts(
          travelCostSheet,
          travelCostCount,
          proposal.activityCode,
          travelCost,
        );
        travelCostCount++;
      }

      const locationCostList = await this.locationModel
        .find({ activityProposalId: proposal._id, isDeleted: false })
        .exec();
      for (const locationCost of locationCostList) {
        await this.downloadLocationCosts(
          locationCostSheet,
          locationCostCount,
          proposal.activityCode,
          locationCost,
        );
        locationCostCount++;
      }

      const otherCostList = await this.otherModel
        .find({ activityProposalId: proposal._id, isDeleted: false })
        .exec();
      for (const otherCost of otherCostList) {
        await this.downloadOtherCosts(
          otherCostSheet,
          otherCostCount,
          proposal.activityCode,
          otherCost,
        );
        otherCostCount++;
      }
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Proposal-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async individualProposalDownload(res, activityProposalId: string) {
    Logger.debug('ActivitiesService.individualProposalDownload');
    const proposal = await this.checkIfProposalExists(activityProposalId);
    const workbook = new Workbook();
    const proposalSheet = workbook.addWorksheet(
      `Proposal - ${proposal.activityCode}`,
    );
    const coordinationCostSheet = workbook.addWorksheet(
      `Coordination Cost - ${proposal.activityCode}`,
    );
    const travelCostSheet = workbook.addWorksheet(
      `Travel Cost - ${proposal.activityCode}`,
    );
    const locationCostSheet = workbook.addWorksheet(
      `Location Cost - ${proposal.activityCode}`,
    );
    const otherCostSheet = workbook.addWorksheet(
      `Other Cost - ${proposal.activityCode}`,
    );

    await this.worksheetCreation(
      proposalSheet,
      coordinationCostSheet,
      travelCostSheet,
      locationCostSheet,
      otherCostSheet,
    );

    const proposalCount = 2;
    let coordinationCostCount = 2,
      travelCostCount = 2,
      locationCostCount = 2,
      otherCostCount = 2;

    await this.downloadActivityProposal(
      res,
      activityProposalId,
      proposalSheet,
      proposalCount,
    );

    const coordinationCostList = await this.coordinationModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();
    for (const coordinationCost of coordinationCostList) {
      await this.downloadCoordinationCosts(
        coordinationCostSheet,
        coordinationCostCount,
        proposal.activityCode,
        coordinationCost,
      );
      coordinationCostCount++;
    }

    const travelCostList = await this.travelModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();
    for (const travelCost of travelCostList) {
      await this.downloadTravelCosts(
        travelCostSheet,
        travelCostCount,
        proposal.activityCode,
        travelCost,
      );
      travelCostCount++;
    }

    const locationCostList = await this.locationModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();
    for (const locationCost of locationCostList) {
      await this.downloadLocationCosts(
        locationCostSheet,
        locationCostCount,
        proposal.activityCode,
        locationCost,
      );
      locationCostCount++;
    }

    const otherCostList = await this.otherModel
      .find({ activityProposalId: proposal._id, isDeleted: false })
      .exec();
    for (const otherCost of otherCostList) {
      await this.downloadOtherCosts(
        otherCostSheet,
        otherCostCount,
        proposal.activityCode,
        otherCost,
      );
      otherCostCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Proposal-' + proposal.activityCode + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async multipleProposalDownload(res, year: number, user: any) {
    Logger.debug('ActivitiesService.multipleProposalDownload');
    const workbook = new Workbook();
    let proposalList;
    if (user.networkId === null && user.partnerId === null) {
      proposalList = await this.proposalsModel
        .find({ year, isDeleted: false })
        .exec();
    } else {
      proposalList = await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }
    await this.commonFunctionForMultipleDownloads(
      proposalList,
      workbook,
      year,
      res,
    );
  }

  async generalUserMultipleProposalDownload(
    res,
    year: number,
    isNetworkProposal: boolean,
  ) {
    Logger.debug('ActivitiesService.generalUserMultipleProposalDownload');
    const workbook = new Workbook();
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    let proposalList;
    if (isNetworkProposal) {
      proposalList = await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      proposalList = await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }

    await this.commonFunctionForMultipleDownloads(
      proposalList,
      workbook,
      year,
      res,
    );
  }

  async getActivityCodeDropdownForOutputReport(year: number, user: any) {
    Logger.debug('ActivitiesService.getActivityCodeDropdownForOutputReport');

    let newObject = {};
    const newArr = [];
    let instituteName;

    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    if (user.networkId === null && user.partnerId === null)
      instituteName = CapnetEnum.CAPNET;
    else if (user.networkId)
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    else if (user.partnerId)
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );

    const activityList = await this.proposalsModel
      .find({
        year,
        statusId: approvedStatusId,
        isDeleted: false,
        instituteName,
      })
      .exec();

    for (const activity of activityList) {
      const activityType = await this.getTypeOfActivityById(
        activity.activityTypeId,
      );
      newObject = { ...activity, activityTypeObj: activityType };
      newArr.push(newObject);
    }
    return activityList;
  }

  async getActivityCodeDropdownForOutputReportForCapNet(
    year: number,
    user: any,
  ) {
    Logger.debug(
      'ActivitiesService.getActivityCodeDropdownForOutputReportForCapNet',
    );

    let newObject = {};
    const newArr = [];
    let activityList;

    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    if (user.networkId === null && user.partnerId === null) {
      activityList = await this.proposalsModel
        .find({
          year,
          statusId: approvedStatusId,
          isDeleted: false,
        })
        .exec();
    }

    for (const activity of activityList) {
      const activityType = await this.getTypeOfActivityById(
        activity.activityTypeId,
      );
      newObject = { ...activity, activityTypeObj: activityType };
      newArr.push(newObject);
    }
    return activityList;
  }

  async getActivityCodeDropdownForOutcomeReport(year: number, user: any) {
    Logger.debug('ActivitiesService.getActivityCodeDropdownForOutcomeReport');
    const finalActivityList = [];
    let instituteName, activity;
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (user.networkId === null && user.partnerId === null)
      instituteName = CapnetEnum.CAPNET;
    else if (user.networkId)
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    else if (user.partnerId)
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );

    const reportsData = await this.outputReportModel
      .find({
        year,
        isDeleted: false,
        outputReportStatus: approvedStatusId,
        instituteName,
      })
      .exec();

    for (const report of reportsData) {
      activity = await this.activityProposalModel
        .findOne({
          year: report.year,
          isDeleted: false,
          _id: report.proposalId,
        })
        .exec();
      if (activity !== null) finalActivityList.push(activity);
    }

    return finalActivityList;
  }

  async getActivityCodeDropdownForOutcomeReportForCapNet(year: number) {
    Logger.debug(
      'ActivitiesService.getActivityCodeDropdownForOutcomeReportForCapNet',
    );
    const finalActivityList = [];
    let activity;
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    const reportsData = await this.outputReportModel
      .find({
        year,
        isDeleted: false,
        outputReportStatus: approvedStatusId,
      })
      .exec();

    for (const report of reportsData) {
      activity = await this.activityProposalModel
        .findOne({
          year: report.year,
          isDeleted: false,
          _id: report.proposalId,
        })
        .exec();
      if (activity !== null) finalActivityList.push(activity);
    }

    return finalActivityList;
  }

  async getActivityByCode(code: string) {
    Logger.debug('ActivitiesService.getActivityByCode');
    return this.proposalsModel
      .findOne({
        activityCode: code,
        isDeleted: false,
      })
      .exec();
  }

  async getProposalStatusWiseCountByYear(
    year: number,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('ActivitiesService.getProposalStatusWiseCountByYear');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const submittedStatusId = await this.userService.getStatusId(
      StatusEnum.SUBMITTED,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    if (networkId === 'null') networkId = null;
    else networkId = new Types.ObjectId(networkId);

    if (partnerId === 'null') partnerId = null;
    else partnerId = new Types.ObjectId(partnerId);

    let submittedCount = 0,
      approvedCount = 0,
      deniedCount = 0,
      infoRequestedCount = 0;

    if (networkId === null && partnerId === null) {
      approvedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          statusId: approvedStatusId,
        })
        .count()
        .exec();

      submittedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          statusId: submittedStatusId,
        })
        .count()
        .exec();

      deniedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          statusId: deniedStatusId,
        })
        .count()
        .exec();

      infoRequestedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          statusId: infoRequestedStatusId,
        })
        .count()
        .exec();
    } else {
      approvedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          statusId: approvedStatusId,
        })
        .count()
        .exec();

      submittedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          statusId: submittedStatusId,
        })
        .count()
        .exec();

      deniedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          statusId: deniedStatusId,
        })
        .count()
        .exec();

      infoRequestedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          statusId: infoRequestedStatusId,
        })
        .count()
        .exec();
    }

    return {
      approvedCount,
      deniedCount,
      submittedCount,
      infoRequestedCount,
    };
  }

  async getProposalAndWorkplanImplementationStatusWiseCount(
    year: number,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug(
      'ActivitiesService.getProposalAndWorkplanImplementationStatusWiseCount',
    );
    if (networkId === 'null') networkId = null;
    else networkId = new Types.ObjectId(networkId);

    if (partnerId === 'null') partnerId = null;
    else partnerId = new Types.ObjectId(partnerId);
    let proposalProposedCount = 0,
      proposalActiveCount = 0,
      proposalDelayedCount = 0,
      proposalCompletedCount = 0,
      workplanProposedCount = 0,
      workplanActiveCount = 0,
      workplanDelayedCount = 0,
      workplanCompletedCount = 0;

    if (networkId === null && partnerId === null) {
      proposalProposedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          implementationStatus: ImplementationStatusEnum.PROPOSED,
        })
        .count()
        .exec();

      proposalActiveCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          implementationStatus: ImplementationStatusEnum.ACTIVE,
        })
        .count()
        .exec();

      proposalDelayedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          implementationStatus: ImplementationStatusEnum.DELAYED,
        })
        .count()
        .exec();

      proposalCompletedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          implementationStatus: ImplementationStatusEnum.COMPLETED,
        })
        .count()
        .exec();

      workplanProposedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          implementationStatus: ImplementationStatusEnum.PROPOSED,
        })
        .count()
        .exec();

      workplanActiveCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          implementationStatus: ImplementationStatusEnum.ACTIVE,
        })
        .count()
        .exec();

      workplanDelayedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          implementationStatus: ImplementationStatusEnum.DELAYED,
        })
        .count()
        .exec();

      workplanCompletedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          implementationStatus: ImplementationStatusEnum.COMPLETED,
        })
        .count()
        .exec();
    } else {
      proposalProposedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.PROPOSED,
        })
        .count()
        .exec();

      proposalActiveCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.ACTIVE,
        })
        .count()
        .exec();

      proposalDelayedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.DELAYED,
        })
        .count()
        .exec();

      proposalCompletedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: false,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.COMPLETED,
        })
        .count()
        .exec();

      workplanProposedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.PROPOSED,
        })
        .count()
        .exec();

      workplanActiveCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.ACTIVE,
        })
        .count()
        .exec();

      workplanDelayedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.DELAYED,
        })
        .count()
        .exec();

      workplanCompletedCount += await this.proposalsModel
        .find({
          year,
          isDeleted: false,
          proposedForCurrentYearWorkplan: true,
          networkId: networkId,
          partnerId: partnerId,
          implementationStatus: ImplementationStatusEnum.COMPLETED,
        })
        .count()
        .exec();
    }

    return {
      activityManagement: {
        proposalProposedCount,
        proposalActiveCount,
        proposalCompletedCount,
        proposalDelayedCount,
      },

      workplan: {
        workplanProposedCount,
        workplanActiveCount,
        workplanCompletedCount,
        workplanDelayedCount,
      },
    };
  }

  async getCountOfProposalsByYearAndUserRole(year: number, user: any) {
    Logger.debug('ActivitiesService.getCountOfProposalsByYearAndUserRole');
    const proposalCount = await this.proposalsModel
      .find({
        year,
        networkId: user.networkId,
        partnerId: user.partnerId,
        proposedForCurrentYearWorkplan: false,
      })
      .count()
      .exec();
    return { proposalCount };
  }

  // @Cron('0 00 12 * * 0-6',{ // Will be called at 12:00 am everyday
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    // Will be called everyday at midnight
    name: 'UpdateImplementationStatus',
  })
  async updateImplementationStatusOfAllProposals() {
    Logger.debug('ActivitiesService.updateImplementationStatusOfAllProposals');
    const proposalList = await this.proposalsModel
      .find({ isDeleted: false })
      .exec();
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    for (const proposal of proposalList) {
      const implementationStatus =
        await this.getImplementationStatusForActivities(
          proposal,
          approvedStatusId,
          proposal.year,
        );

      await this.proposalsModel
        .findOneAndUpdate(
          {
            activityProposalId: proposal.activityProposalId,
            isDeleted: false,
          },
          { implementationStatus },
          { new: true },
        )
        .exec();
    }
  }

  async checkIfActivityAlreadyProposedByActivityId(
    activityId: string,
    // user: any,
  ) {
    Logger.debug(
      'ActivitiesService.checkIfActivityAlreadyProposedByActivityId',
    );
    const activity_id = new Types.ObjectId(activityId);
    const existingActivity = await this.checkIfActivityExistsForProposal(
      activity_id,
    );
    if (!existingActivity)
      throw new NotFoundException(errorMessages.ACTIVITY_NOT_FOUND);
    await this.checkIfActivityAlreadyProposed(activity_id);
  }

  // async checkIfProposalHasWorkplanActivity(year: number, activityId) {
  //   Logger.debug('ActivitiesService.checkIfProposalHasWorkplanActivity');
  //   return this.proposalsModel
  //     .findOne({
  //       year,
  //       proposedForCurrentYearWorkplan: true,
  //       activityId,
  //     })
  //     .exec();
  // }

  async checkIfProposalIsForWorkplanActivity(year: number, user: any) {
    Logger.debug('ActivitiesService.checkIfProposalIsForWorkplanActivity');
    return this.proposalsModel
      .findOne({
        year,
        proposedForCurrentYearWorkplan: true,
        activityId: { $ne: null },
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();
  }

  async deleteWorkplanActivity(activityId) {
    Logger.debug('ActivitiesService.deleteWorkplanActivity');
    return this.activityModel
      .findOneAndUpdate(
        {
          _id: activityId,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      )
      .exec();
  }

  async removeCoordinationCost(coordinationCostId: string) {
    Logger.debug('ActivitiesService.removeCoordinationCost');
    const coordinationCost = await this.coordinationModel
      .findOne({ coordinationCostId, isDeleted: false })
      .exec();
    if (coordinationCost === null)
      throw new NotFoundException('Coordination cost not found');

    return this.coordinationModel
      .findOneAndUpdate(
        {
          coordinationCostId,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      )
      .exec();
  }

  async removeTravelCost(travelCostId: string) {
    Logger.debug('ActivitiesService.removeTravelCost');
    const travelCost = await this.travelModel
      .findOne({ travelCostId, isDeleted: false })
      .exec();
    if (travelCost === null)
      throw new NotFoundException('Travel cost not found');

    return this.travelModel
      .findOneAndUpdate(
        {
          travelCostId,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      )
      .exec();
  }

  async removeLocationCost(locationCostId: string) {
    Logger.debug('ActivitiesService.removeLocationCost');
    const locationCost = await this.locationModel
      .findOne({ locationCostId, isDeleted: false })
      .exec();
    if (locationCost === null)
      throw new NotFoundException('Location cost not found');

    return this.locationModel
      .findOneAndUpdate(
        {
          locationCostId,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      )
      .exec();
  }

  async removeOtherCost(otherCostId: string) {
    Logger.debug('ActivitiesService.removeOtherCost');
    const coordinationCost = await this.otherModel
      .findOne({ otherCostId, isDeleted: false })
      .exec();
    if (coordinationCost === null)
      throw new NotFoundException('Other cost not found');

    return this.otherModel
      .findOneAndUpdate(
        {
          otherCostId,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      )
      .exec();
  }

  containerName = 'upload-files';

  /**Blob details */
  async getBlobClient(imageName: string) {
    Logger.debug('ReportsService.getBlobClient');
    console.log('imageName = ', imageName);
    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );
    // Get a reference to a container
    const containerClient = blobClientService.getContainerClient(
      this.containerName,
    );
    console.log('containerClient = ', containerClient);

    const list = await blobClientService.listContainers();
    const containerItem = await list.next();
    console.log('containerItem = ', containerItem);

    if (containerItem.done) {
      console.log('\nCreating container...');
      console.log('\t', this.containerName);
      const createContainerResponse = await containerClient.create();
      console.log(
        `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`,
      );
    }
    const blobClient = containerClient.getBlockBlobClient(imageName);
    console.log('blobClient = ', blobClient);
    return blobClient;
  }
  async deleteProposalFileFromAzure(
    filename: string,
    requestId: string,
    proposalId: any,
    user,
    addtionalInfo: AddAdditionalInfoDTO,
  ) {
    Logger.debug('ActivitiesService.deleteProposalFileFromAzure');

    const foundProposal = await this.getProposalActivityById(proposalId);

    if (!foundProposal)
      throw new NotFoundException(errorMessages.PROPOSAL_NOT_FOUND);

    await this.activityProposalModel
      .findOneAndUpdate(
        {
          isDeleted: false,
          activityProposalId: foundProposal.activityProposalId,
        },
        { addtionalInfo },
        { new: true },
      )
      .exec();
    const blobClient = await this.getBlobClient(filename);
    await blobClient.deleteIfExists();

    await this.melpService.addActivityLog(
      user,
      `Activity ${foundProposal.activityCode} updated successfully.`,
    );
  }
}
