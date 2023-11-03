import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivitiesService } from '../activities/activities.service';
import { AgeGroup } from '../common/staticSchema/ageGroup.schema';
import { Gender } from '../common/staticSchema/gender.schema';
import { TypeOfInstitution } from '../common/staticSchema/typeOfInstitution.schema';
import { NetworkService } from '../networks/network.service';
import { PartnerService } from '../partners/partner.service';
import { ImpactStory } from './schema/impactStory.schema';
import { v4 as uuidv4 } from 'uuid';
import { errorMessages } from '../utils/error-messages.utils';
import { AddStoryInfoDTO } from './dto/addStoryInfo.dto';
import { AddStorytellerInfoDTO } from './dto/addStorytellerInfo.dto';
import { AddStorySelectionDTO } from './dto/addStorySelection.dto';
import { AddStoryCreationDTO } from './dto/addStoryCreation.dto';
import { UserService } from '../users/user.service';
import { TypeOfChangeObserved } from '../common/staticSchema/typeOfChangeObserved.schema';
import { EditStoryInfoDTO } from './dto/editStoryInfo.dto';
import { EditStorytellerInfoDTO } from './dto/editStorytellerInfo.dto';
import { ApprovalRequests } from '../approvalHierarchy/schema/approvalRequests.schema';
import { ApprovalHierarchy } from '../approvalHierarchy/schema/approvalHierarchy.schema';
import { MailService } from '../mail/mail.service';
import { ApprovalDetails } from '../approvalHierarchy/schema/approvalDetails.schema';
import { Workbook, Worksheet } from 'exceljs';
import { StaticSurveyService } from '../staticSurveys/staticSurvey.service';
import { ProposalIdListDto } from './dto/proposalIdList.dto';
import { MelpService } from '../melp/melp.service';
import { ReportsService } from '../reports/reports.service';
import { StatusEnum } from '../common/enum/status.enum';
import { BoundaryLevelOfChange } from '../common/staticSchema/boundaryLevelOfChange.schema';
import { ThematicAreaOfChange } from '../common/staticSchema/thematicAreaOfChange.schema';
import { ConfigService } from '@nestjs/config';
import { CapnetEnum } from '../common/enum/capnet.enum';

import { mimetypes } from '../utils/file-upload.util';
@Injectable()
export class ImpactStoryService {
  constructor(
    @InjectModel(ImpactStory.name) private impactStoryModel: Model<ImpactStory>,

    @InjectModel(TypeOfChangeObserved.name)
    private typeOfChangeObservedModel: Model<TypeOfChangeObserved>,

    @InjectModel(Gender.name) private genderModel: Model<Gender>,

    @InjectModel(AgeGroup.name) private ageGroupModel: Model<AgeGroup>,

    @InjectModel(TypeOfInstitution.name)
    private typeOfInstitutionModel: Model<TypeOfInstitution>,

    @InjectModel(BoundaryLevelOfChange.name)
    private boundaryLevelOfChangeModel: Model<BoundaryLevelOfChange>,

    @InjectModel(ThematicAreaOfChange.name)
    private thematicAreaOfChangeModel: Model<ThematicAreaOfChange>,

    @InjectModel(ApprovalRequests.name)
    private readonly approvalRequestsModel: Model<ApprovalRequests>,

    @InjectModel(ApprovalHierarchy.name)
    private readonly approvalHierarchyModel: Model<ApprovalHierarchy>,

    @InjectModel(ApprovalDetails.name)
    private readonly approvalDetailsModel: Model<ApprovalDetails>,

    private readonly networkService: NetworkService,

    private readonly partnerService: PartnerService,

    private readonly activityService: ActivitiesService,

    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,

    private readonly staticSurveyService: StaticSurveyService,

    private readonly melpService: MelpService,

    private readonly reportsService: ReportsService,
  ) {}

  async checkIfStoryExists(impactStoryId: string, networkId, partnerId) {
    Logger.debug('ImpactStoryService.checkIfStoryExists');
    const impactStory = await this.impactStoryModel
      .findOne({ impactStoryId, networkId, partnerId, isDeleted: false })
      .exec();
      let originalName;
    if (impactStory === null) {
      throw new NotFoundException(errorMessages.IMPACT_STORY_NOT_FOUND);
    } else {
      if(impactStory.storyOfChangeDraft)
        originalName = impactStory.storyOfChangeDraft.fileName.split(' -')[0];
      return {
        impactStory,
        originalName
      };
    }
  }

  async getStaticDataTables() {
    Logger.debug('ImpactStoryService.getStaticDataTables');
    const genderList = await this.genderModel.find().exec();
    const ageGroupList = await this.ageGroupModel.find().exec();
    const typeOfInstitutionList = await this.typeOfInstitutionModel
      .find()
      .exec();
    const networkList = await this.networkService.getAllNetworksList();
    const typeOfChangeObservedList = await this.typeOfChangeObservedModel
      .find()
      .exec();
    const boundaryLevelOfChangeList = await this.boundaryLevelOfChangeModel
      .find()
      .exec();
    const thematicAreaOfChangeList = await this.thematicAreaOfChangeModel
      .find()
      .exec();

    return {
      genderList,
      ageGroupList,
      typeOfInstitutionList,
      networkList,
      typeOfChangeObservedList,
      boundaryLevelOfChangeList,
      thematicAreaOfChangeList,
    };
  }

  async getCountOfImpactStory(year: number, user: any) {
    Logger.debug('ImpactStoryService.getCountOfImpactStory');
    return this.impactStoryModel
      .find({
        year,
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .count()
      .exec();
  }

  // List of proposal activities whose output reports are approved
  async getProposalActivityList(year: number, user: any) {
    Logger.debug('ImpactStoryService.getProposalActivityList');
    const approvedOutputReports =
      await this.reportsService.getApprovedOutputReports(year, user);
    let proposalActivityList = [];
    for (const outputReport of approvedOutputReports) {
      const temp = {};
      temp['proposalId'] = outputReport.proposalId;
      temp['activityCode'] = outputReport.activityCode;
      temp['activityName'] = outputReport.activityName;
      temp['activityCodeAndName'] =
        outputReport.activityCode + '-' + outputReport.activityName;
      proposalActivityList = [...proposalActivityList, { ...temp }];
    }
    return {
      proposalActivityList,
    };
  }

  async getProposalActivityListForCapnet(year: number) {
    Logger.debug('ImpactStoryService.getProposalActivityListForCapnet');
    const approvedOutputReports =
      await this.reportsService.getApprovedOutputReportsForCapnet(year);
    let proposalActivityList = [];
    for (const outputReport of approvedOutputReports) {
      const temp = {};
      temp['proposalId'] = outputReport.proposalId;
      temp['activityCode'] = outputReport.activityCode;
      temp['activityName'] = outputReport.activityName;
      temp['activityCodeAndName'] =
        outputReport.activityCode + '-' + outputReport.activityName;
      proposalActivityList = [...proposalActivityList, { ...temp }];
    }
    return {
      proposalActivityList,
    };
  }

  /**Get list of unique indicators from selected proposal-activities */
  async getIndicatorsListByProposalId(proposalIdList: ProposalIdListDto) {
    Logger.debug('ImpactStoryService.getIndicatorsListByProposalId');
    let indicatorList = [];
    for (const proposalId of proposalIdList.proposalIds) {
      const proposal = await this.activityService.getProposalActivityById(
        proposalId,
      );
      const indicatorsArray = proposal.indicatorId;
      for (const indicator of indicatorsArray) {
        const x = indicator.toString();
        indicatorList = [...indicatorList, x];
      }
    }
    const uniqueIndicatorList = [...new Set(indicatorList)];
    let indicatorDetailsList = [];
    for (const uniqueIndicator of uniqueIndicatorList) {
      const indicatorId = new Types.ObjectId(uniqueIndicator);
      const indicatorDetails = await this.melpService.getIndicatorById(
        indicatorId,
      );
      const temp = {};
      temp['indicator_id'] = indicatorDetails._id;
      temp['indicatorId'] = indicatorDetails.indicatorId;
      temp['indicatorCode'] = indicatorDetails.indicatorCode;
      temp['indicatorName'] = indicatorDetails.indicatorName;

      indicatorDetailsList = [...indicatorDetailsList, { ...temp }];
    }
    return indicatorDetailsList;
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

  async getImpactStoryById(impactStoryId: string) {
    Logger.debug('ImpactStoryService.getImpactStoryById');
    const impactStory = await this.impactStoryModel
      .findOne({ impactStoryId, isDeleted: false })
      .exec();
    if (impactStory === null) {
      throw new NotFoundException(errorMessages.IMPACT_STORY_NOT_FOUND);
    } else {
      return impactStory;
    }
  }

  async getArrayOfImpactStoryObject(impactStoryList) {
    Logger.debug('ImpactStoryService.getArrayOfImpactStoryObject');
    let impactStories = [];
    for (const impactStory of impactStoryList) {
      let associatedActivity = '',
        activityCount = 1;
      for (const proposalId of impactStory.proposalId) {
        const activityDetails =
          await this.activityService.getProposalActivityById(proposalId);
        if (activityCount === 1) {
          associatedActivity += activityDetails.activityName;
          activityCount++;
        } else {
          associatedActivity += ', ' + activityDetails.activityName;
        }
      }
      associatedActivity += '.';

      const temp = {};
      temp['year'] = impactStory.year;
      temp['impactStoryId'] = impactStory.impactStoryId;
      temp['impactStoryCode'] = impactStory.impactStoryCode;
      temp['instituteName'] = impactStory.instituteName;
      temp['storyTitle'] = impactStory.storyTitle;
      temp['status'] = await this.userService.getStatusName(
        impactStory.statusId,
      );
      temp['associatedActivity'] = associatedActivity;
      temp['createdAt'] = impactStory.createdAt;
      temp['approvedAt'] = impactStory.approvedAt;
      temp['submittedAt'] = impactStory.submittedAt;
      temp['lastUpdated'] = impactStory.updatedAt;
      temp['isStoryInfoTabFilled'] = impactStory.isStoryInfoTabFilled;
      temp['isStoryTellerTabFilled'] = impactStory.isStoryTellerTabFilled;
      temp['isStorySelectionTabFilled'] = impactStory.isStorySelectionTabFilled;
      temp['approvedCount'] = impactStory.approvedCount;
      impactStories = [...impactStories, { ...temp }];
    }
    return impactStories;
  }

  async updateApprovedCount(count: number, impactStoryId: string) {
    Logger.debug('ActivitiesService.updateApprovedCount');
    return this.impactStoryModel
      .findOneAndUpdate(
        { impactStoryId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  // Get list of all the impact stories
  async getListOfImpactStories(
    user: any,
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ImpactStoryService.getListOfImpactStories');
    let impactStoryList, totalImpactStoryCount;
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (user.networkId === null && user.partnerId === null) {
      impactStoryList = await this.impactStoryModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              // statusId: approvedStatusId,
            },
            {
              $or: [
                {
                  $and: [
                    { instituteName: { $ne: CapnetEnum.CAPNET } },
                    { statusId: { $eq: approvedStatusId } },
                  ],
                },
                { instituteName: CapnetEnum.CAPNET },
              ],
            },
            {
              $or: [{ impactStoryCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalImpactStoryCount = await this.impactStoryModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
            },
            {
              $or: [
                {
                  $and: [
                    { instituteName: { $ne: CapnetEnum.CAPNET } },
                    { statusId: { $eq: approvedStatusId } },
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
      impactStoryList = await this.impactStoryModel
        .find({
          $and: [
            {
              year,
              networkId: user.networkId,
              partnerId: user.partnerId,
              isDeleted: false,
            },
            {
              $or: [{ impactStoryCode: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      totalImpactStoryCount = await this.impactStoryModel
        .find({
          $and: [
            {
              year,
              networkId: user.networkId,
              partnerId: user.partnerId,
              isDeleted: false,
            },
            {
              $or: [{ impactStoryCode: regex }],
            },
          ],
        })
        .count()
        .exec();
    }

    const impactStories = await this.getArrayOfImpactStoryObject(
      impactStoryList,
    );

    return {
      impactStories,
      totalImpactStoryCount,
      totalPageCount: Math.ceil(totalImpactStoryCount / pageLimit),
    };
  }

  // Get impact story by impactstoryId
  async getImpactStoryInfo(impactStoryId: string, user: any) {
    Logger.debug('ImpactStoryService.getImpactStoryInfo');
    let originalName;
    if (user.networkId === null && user.partnerId === null) {
      const impactStory = await this.impactStoryModel
        .findOne({ impactStoryId, isDeleted: false })
        .exec();
      if (impactStory === null) {
        throw new NotFoundException(errorMessages.IMPACT_STORY_NOT_FOUND);
      } else {
        originalName = impactStory.storyOfChangeDraft.fileName.split(' -')[0];
        return {
          impactStory,
          originalName
        };
      }
    } else {
      return this.checkIfStoryExists(
        impactStoryId,
        user.networkId,
        user.partnerId,
      );
    }
  }

  // Add Impact Story Info (Tab 1) for all users
  async addImpactStoryInfo(addImpactStoryInfo: AddStoryInfoDTO, user: any) {
    Logger.debug('ImpactStoryService.addImpactStoryInfo');
    let instituteName;
    const statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.networkId === null && user.partnerId !== null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    } else {
      instituteName = CapnetEnum.CAPNET;
    }

    // Converting date-string into date object and then retrieving the year to store in db
    const date = new Date(addImpactStoryInfo.year);
    const year = date.getFullYear();
    addImpactStoryInfo.year = undefined;

    const impactStory = await new this.impactStoryModel({
      ...addImpactStoryInfo,
      year,
      impactStoryId: uuidv4(),
      instituteName,
      statusId,
      networkId: user.networkId,
      partnerId: user.partnerId,
      createdBy: user._id,
      updatedBy: user._id,
      isStoryInfoTabFilled: true,
    }).save();
    await this.melpService.addActivityLog(
      user,
      `Impact Story - ${impactStory.impactStoryCode} created`,
    );
    return impactStory;
  }

  async setSubmittedAtTime(impactStoryId: string, submittedAt: Date) {
    Logger.debug('ImpactStoryService.setSubmittedAtTime');
    return this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTime(impactStoryId: string, approvedAt: Date) {
    Logger.debug('ImpactStoryService.setApprovedAtTime');
    return this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  //Edit Tab 1
  async updateImpactStoryInfo(
    updateStoryInfo: EditStoryInfoDTO,
    impactStoryId: string,
    user: any,
  ) {
    Logger.debug('ImpactStoryService.updateImpactStoryInfo');
    await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );

    const date = new Date(updateStoryInfo.year);
    const year = date.getFullYear();
    updateStoryInfo.year = undefined;

    const updatedImpactStory = await this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        {
          ...updateStoryInfo,
          year,
          updatedBy: user._id,
        },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `Impact Story - ${updatedImpactStory.impactStoryCode} updated`,
    );
    return updatedImpactStory;
  }

  //  Add / Edit Tab 2
  async addOrEditStorytellerInfo(
    addOrEditStorytellerInfo: AddStorytellerInfoDTO | EditStorytellerInfoDTO,
    impactStoryId: string,
    user: any,
  ) {
    Logger.debug('ImpactStoryService.addOrEditStorytellerInfo');
    await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );
    if (addOrEditStorytellerInfo.isParticipantAStoryteller) {
      if (
        addOrEditStorytellerInfo.storyTellerFirstName === undefined ||
        addOrEditStorytellerInfo.storyTellerLastName === undefined ||
        addOrEditStorytellerInfo.storyTellerEmail === undefined ||
        addOrEditStorytellerInfo.storyTellerGenderId === undefined ||
        addOrEditStorytellerInfo.storyTellerAgeGroupId === undefined ||
        addOrEditStorytellerInfo.nationality === undefined ||
        addOrEditStorytellerInfo.storyTellerGenderPronounPreference ===
          undefined ||
        addOrEditStorytellerInfo.typeOfInstitutionId === undefined ||
        addOrEditStorytellerInfo.nameOfInstitution === undefined ||
        addOrEditStorytellerInfo.positionInInstitution === undefined
      ) {
        throw new BadRequestException(errorMessages.FILL_MANDATORY_FIELDS);
      }
    }
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );

    const updatedImpactStory = await this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        {
          ...addOrEditStorytellerInfo,
          updatedBy: user._id,
          isStoryTellerTabFilled: true,
        },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `Impact Story - ${updatedImpactStory.impactStoryCode} updated`,
    );
    return updatedImpactStory;
  }

  // Add /Edit Tab 3
  async addorEditStorySelection(
    addStorySelection: AddStorySelectionDTO,
    impactStoryId: string,
    user: any,
  ) {
    Logger.debug('ImpactStoryService.addorEditStorySelection');
    await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );
    if (
      addStorySelection.hasStoryOfChange &&
      addStorySelection.storyOfChangeDraft === undefined
    ) {
      throw new BadRequestException(errorMessages.UPLOAD_STORY_DRAFT);
    }

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );

    return this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        {
          ...addStorySelection,
          updatedBy: user._id,
          isStorySelectionTabFilled: true,
        },
        { new: true },
      )
      .exec();
  }

  // Add/Edit Tab 4
  async addOrEditStoryCreation(
    addOrEditStoryCreation: AddStoryCreationDTO,
    impactStoryId: string,
    user: any,
  ) {
    Logger.debug('ImpactStoryService.addOrEditStoryCreation');
    await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );

    const updatedImpactStory = await this.impactStoryModel
      .findOneAndUpdate(
        {
          impactStoryId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        {
          ...addOrEditStoryCreation,
          updatedBy: user._id,
        },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `Impact Story - ${updatedImpactStory.impactStoryCode} updated`,
    );
    return updatedImpactStory;
  }

  async removeImpactStory(impactStoryId: string, user: any) {
    Logger.debug('ImpactStoryService.removeImpactStory');
    const impactStory = await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    // const deniedStatusId = await this.userService.getStatusId(
    //   'Denied',
    // );
    let updatedImpactStory;
    if (impactStory.impactStory.statusId.equals(inProgressStatusId)) {
      updatedImpactStory = await this.impactStoryModel
        .findOneAndUpdate(
          {
            impactStoryId,
            isDeleted: false,
            statusId: {
              $in: [inProgressStatusId],
            },
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();
    } else {
      throw new BadRequestException(
        errorMessages.IMPACT_STORY_CANNOT_BE_DELETED,
      );
    }

    await this.melpService.addActivityLog(
      user,
      `Impact Story - ${updatedImpactStory.impactStoryCode} deleted`,
    );
    return updatedImpactStory;
  }

  async updateImpactStoryStatus(impactStoryId: string, statusId: any) {
    Logger.debug('ImpactStoryService.updateImpactStoryStatus');
    return this.impactStoryModel
      .findOneAndUpdate(
        { impactStoryId, isDeleted: false },
        { statusId: statusId },
        { new: true },
      )
      .exec();
  }

  async worksheetCreation(worksheet: Worksheet) {
    Logger.debug('ImpactStoryService.worksheetCreation');
    worksheet.columns = [
      { header: 'Story Code', key: 'storyCode', width: 20 },
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Institute Name', key: 'instituteName', width: 20 },
      { header: 'Story Title ', key: 'storyTitle', width: 40 },
      { header: 'Focal Person ', key: 'focalPerson', width: 40 },
      { header: 'Associated Activity ', key: 'associatedActivity', width: 40 },
      {
        header: 'Information Collection ',
        key: 'informationCollectionMedium',
        width: 40,
      },
      { header: 'Change Observed ', key: 'changeObserved', width: 40 },
      { header: "Network's Contribution ", key: 'contribution', width: 40 },
      { header: 'Activity Influence ', key: 'influence', width: 40 },
      { header: 'Significant Experience ', key: 'experience', width: 40 },
      { header: 'Change Occured ', key: 'changeOccured', width: 40 },
      { header: 'Period Change ', key: 'periodChange', width: 40 },
      { header: 'Type of change ', key: 'typeOfChange', width: 40 },
      { header: 'Existing Indicators ', key: 'indicators', width: 40 },
      { header: 'Boundary level ', key: 'boundaryLevel', width: 40 },
      { header: 'Thematic Area', key: 'thematicArea', width: 40 },
      { header: 'Key Partners', key: 'keyPartners', width: 40 },
      { header: 'Is Participant ', key: 'isParticipant', width: 40 },
      {
        header: 'Storyteller contacted medium',
        key: 'storyTellerContactedMedium',
        width: 40,
      },
      { header: 'Has Given Consent ', key: 'hasGivenConsent', width: 40 },
      { header: 'Is anonymous ', key: 'isAnonymous', width: 40 },
      {
        header: 'Story teller First Name',
        key: 'storyTellerFirstName',
        width: 40,
      },
      {
        header: 'Story teller Last Name ',
        key: 'storyTellerLastName',
        width: 40,
      },
      { header: 'Story Teller Email ', key: 'storyTellerEmail', width: 40 },
      { header: 'Gender', key: 'storyTellerGender', width: 40 },
      {
        header: 'GenderPronounPreference ',
        key: 'storyTellerGenderPronounPreference',
        width: 40,
      },
      {
        header: 'Story Teller Age Group ',
        key: 'storyTellerAgeGroup',
        width: 40,
      },
      { header: 'Nationality ', key: 'nationality', width: 40 },
      { header: 'Type Of Institution ', key: 'typeOfInstitution', width: 40 },
      { header: 'Name Of Institution ', key: 'nameOfInstitution', width: 40 },
      {
        header: 'PositionI n Institution ',
        key: 'positionInInstitution',
        width: 40,
      },
      { header: 'Is Network Member ', key: 'isNetworkMember', width: 40 },
      { header: 'Affiliated Network ', key: 'affiliatedNetwork', width: 40 },
      {
        header: 'Information Significance ',
        key: 'informationSignificance',
        width: 40,
      },
      { header: 'Missing Information ', key: 'missingInformation', width: 40 },
      { header: 'Next Actions ', key: 'nextActions', width: 40 },
      { header: 'Additional Comments ', key: 'additionalComments', width: 40 },
      { header: 'hasStoryOfChange ', key: 'hasStoryOfChange', width: 40 },
    ];
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    worksheet.addRow({
      storyCode: 'storyCode',
      year: 'year',
      instituteName: 'instituteName',
      storyTitle: 'storyTitle',
      focalPerson: 'focalPerson',
      associatedActivity: 'associatedActivity',
      informationCollectionMedium: 'informationCollectionMedium',
      changeObserved: 'changeObserved',
      contribution: 'contribution',
      influence: 'influence',
      experience: 'experience',
      changeOccured: 'changeOccured',
      periodChange: 'periodChange',
      typeOfChange: 'typeOfChange',
      indicators: 'indicators',
      boundaryLevel: 'boundaryLevel',
      thematicArea: 'thematicArea',
      keyPartners: 'keyPartners',
      isParticipant: 'isParticipant',
      storyTellerContactedMedium: 'storyTellerContactedMedium',
      hasGivenConsent: 'hasGivenConsent',
      isAnonymous: 'isAnonymous',
      storyTellerFirstName: 'storyTellerFirstName',
      storyTellerLastName: 'storyTellerLastName',
      storyTellerEmail: 'storyTellerEmail',
      storyTellerGender: 'storyTellerGender',
      storyTellerGenderPronounPreference: 'storyTellerGenderPronounPreference',
      storyTellerAgeGroup: 'storyTellerAgeGroup',
      nationality: 'nationality',
      typeOfInstitution: 'typeOfInstitution',
      nameOfInstitution: 'nameOfInstitution',
      positionInInstitution: 'positionInInstitution',
      isNetworkMember: 'isNetworkMember',
      affiliatedNetwork: 'affiliatedNetwork',
      informationSignificance: 'informationSignificance',
      missingInformation: 'missingInformation',
      nextActions: 'nextActions',
      additionalComments: 'additionalComments',
      hasStoryOfChange: 'hasStoryOfChange',
    });
  }

  async impactStoryDownload(
    res,
    impactStoryId: string,
    worksheet: Worksheet,
    rowCount: number,
  ) {
    Logger.debug('ImpactStoryService.impactStoryDownload');
    const impactStory = await this.getImpactStoryById(impactStoryId);
    const focalPerson = await this.userService.getUser(
      impactStory.focalPersonId,
    );

    let typeOfChangeValue = '',
      boundaryLevelValue = '',
      thematicAreaValue = '',
      typeOfChangeCount = 1,
      boundaryLevelCount = 1,
      thematicAreaCount = 1;
    for (const typeOfChange of impactStory.typeOfChange) {
      if (typeOfChange.value) {
        if (typeOfChange.key === 'Other') {
          typeOfChangeValue += impactStory.otherTypeOfChange + '.';
        } else if (typeOfChangeCount < impactStory.typeOfChange.length) {
          typeOfChangeValue += typeOfChange.key + ', ';
          typeOfChangeCount++;
        } else {
          typeOfChangeValue += typeOfChange.key + '.';
        }
      }
    }

    for (const boundaryLevel of impactStory.boundaryLevelOfChange) {
      if (boundaryLevel.value) {
        if (boundaryLevel.key === 'Other') {
          boundaryLevelValue += impactStory.otherBoundaryLevelOfChange + '.';
        } else if (
          boundaryLevelCount < impactStory.boundaryLevelOfChange.length
        ) {
          boundaryLevelValue += boundaryLevel.key + ', ';
          boundaryLevelCount++;
        } else {
          boundaryLevelValue += boundaryLevel.key + '.';
        }
      }
    }

    for (const thematicArea of impactStory.thematicAreaOfChange) {
      if (thematicArea.value) {
        if (thematicArea.key === 'Other') {
          thematicAreaValue += impactStory.otherThematicAreaOfChange + '.';
        } else if (
          thematicAreaCount < impactStory.thematicAreaOfChange.length
        ) {
          thematicAreaValue += thematicArea.key + ', ';
          thematicAreaCount++;
        } else {
          thematicAreaValue += thematicArea.key + '.';
        }
      }
    }

    let associatedActivity = '',
      proposalCount = 1;
    for (const proposalId of impactStory.proposalId) {
      const proposalDetails =
        await this.activityService.getProposalActivityById(proposalId);
      if (proposalCount === 1) {
        associatedActivity += proposalDetails.activityName;
        proposalCount++;
      } else {
        associatedActivity += ', ' + proposalDetails.activityName;
      }
    }
    associatedActivity += '.';

    let indicator = '',
      indicatorCount = 1;
    for (const indicatorId of impactStory.indicatorId) {
      const indicatorDetails = await this.melpService.getIndicatorById(
        indicatorId,
      );
      if (indicatorCount === 1) {
        indicator += indicatorDetails.indicatorName;
        indicatorCount++;
      } else {
        indicator += ', ' + indicatorDetails.indicatorName;
      }
    }
    indicator += '.';

    worksheet.getRow(rowCount).values = {
      storyCode: impactStory.impactStoryCode,
      year: impactStory.year,
      instituteName: impactStory.instituteName,
      storyTitle: impactStory.storyTitle,
      focalPerson: focalPerson.fullName,
      associatedActivity: associatedActivity,
      informationCollectionMedium: impactStory.informationCollectionMedium,
      changeObserved: impactStory.whatChangeObserved,
      contribution: impactStory.capnetInfluenceOnChange,
      influence: impactStory.effectOnInstitution,
      experience: impactStory.significantChange,
      changeOccured: impactStory.howChangeWasOccured,
      periodChange: impactStory.changeOccuredPeriod,
      typeOfChange: typeOfChangeValue,
      indicators: indicator,
      boundaryLevel: boundaryLevelValue,
      thematicArea: thematicAreaValue,
      keyPartners: impactStory.keyPartners,
      isParticipant: impactStory.isParticipantAStoryteller ? 'Yes' : 'No',
      storyTellerContactedMedium: impactStory.storyTellerContactedMedium
        ? impactStory.storyTellerContactedMedium
        : 'NA',
      hasGivenConsent: impactStory.hasGivenConsent ? 'Yes' : 'No',
      isAnonymous: impactStory.isAnonymous ? 'Yes' : 'No',
      storyTellerFirstName: impactStory.storyTellerFirstName
        ? impactStory.storyTellerFirstName
        : 'NA',
      storyTellerLastName: impactStory.storyTellerLastName
        ? impactStory.storyTellerLastName
        : 'NA',
      storyTellerEmail: impactStory.storyTellerEmail
        ? impactStory.storyTellerEmail
        : 'NA',
      storyTellerGender: impactStory.storyTellerGenderId
        ? await this.networkService.getGenderById(
            impactStory.storyTellerGenderId,
          )
        : 'NA',
      storyTellerGenderPronounPreference:
        impactStory.storyTellerGenderPronounPreference
          ? impactStory.storyTellerGenderPronounPreference
          : 'NA',
      storyTellerAgeGroup: impactStory.storyTellerAgeGroupId
        ? await this.staticSurveyService.getAgeGroupById(
            impactStory.storyTellerAgeGroupId,
          )
        : 'NA',
      nationality: impactStory.nationality ? impactStory.nationality : 'NA',
      typeOfInstitution: impactStory.typeOfInstitutionId
        ? await this.networkService.getTypeOfInstituionById(
            impactStory.typeOfInstitutionId,
          )
        : 'NA',
      nameOfInstitution: impactStory.nameOfInstitution
        ? impactStory.nameOfInstitution
        : 'NA',
      positionInInstitution: impactStory.positionInInstitution
        ? impactStory.positionInInstitution
        : 'NA',
      isNetworkMember: impactStory.isNetworkMember ? 'Yes' : 'No',
      affiliatedNetwork: impactStory.affiliatedNetworkId
        ? await this.networkService.getNetworkNameById(
            impactStory.affiliatedNetworkId,
          )
        : 'NA',
      informationSignificance: impactStory.informationSignificance,
      missingInformation: impactStory.missingInformation,
      nextActions: impactStory.nextActions,
      additionalComments: impactStory.additionalComments
        ? impactStory.additionalComments
        : 'NA',
      hasStoryOfChange: impactStory.hasStoryOfChange ? 'Yes' : 'No',
    };
  }

  async individualDownload(res, impactStoryId: string) {
    Logger.debug('ImpactStoryService.individualDownload');
    const impactStory = await this.getImpactStoryById(impactStoryId);
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      'Impact Story - ' + impactStory.impactStoryCode,
    );
    await this.worksheetCreation(worksheet);

    const rowCount = 2;
    await this.impactStoryDownload(res, impactStoryId, worksheet, rowCount);

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + impactStory.impactStoryCode + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async commonFunctionforMultipleDownload(
    impactStoryList: ImpactStory[],
    year: number,
    res,
  ) {
    Logger.debug('ImpactStoryService.commonFunctionforMultipleDownload');
    if (impactStoryList.length === 0)
      throw new NotFoundException(errorMessages.IMPACT_STORY_NOT_FOUND);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Impact Story - ' + year);
    await this.worksheetCreation(worksheet);

    let rowCount = 2;
    for (const impactStory of impactStoryList) {
      await this.impactStoryDownload(
        res,
        impactStory.impactStoryId,
        worksheet,
        rowCount,
      );
      rowCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'ImpactStories-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async multipleDownload(res, year: number, user: any) {
    Logger.debug('ImpactStoryService.multipleDownload');
    let impactStoryList;
    if (user.networkId === null && user.partnerId === null) {
      impactStoryList = await this.impactStoryModel
        .find({ year, isDeleted: false })
        .exec();
    } else {
      impactStoryList = await this.impactStoryModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }
    await this.commonFunctionforMultipleDownload(impactStoryList, year, res);
  }

  async generalUserMultipleDownload(res, year: number, isNetwork: boolean) {
    Logger.debug('ImpactStoryService.generalUserMultipleDownload');
    let impactStoryList;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    if (isNetwork) {
      impactStoryList = await this.impactStoryModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      impactStoryList = await this.impactStoryModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }
    await this.commonFunctionforMultipleDownload(impactStoryList, year, res);
  }

  async viewAllNetworksImpactStory(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ImpactStoryService.viewAllNetworksImpactStory');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const impactStoryList = await this.impactStoryModel
      .find({
        $and: [
          {
            year,
            isDeleted: false,
            networkId: { $ne: null },
            partnerId: { $eq: null },
            statusId: { $ne: inProgressStatusId },
          },
          {
            $or: [{ impactStoryCode: regex }, { instituteName: regex }],
          },
        ],
      })
      .sort(sortQuery)
      .skip(pageLimit * pageIndex)
      .limit(pageLimit)
      .exec();

    const impactStoryCount = await this.impactStoryModel
      .find({
        year,
        isDeleted: false,
        networkId: { $ne: null },
        partnerId: { $eq: null },
        statusId: { $ne: inProgressStatusId },
      })
      .count()
      .exec();

    const impactStories = await this.getArrayOfImpactStoryObject(
      impactStoryList,
    );
    return {
      impactStories,
      impactStoryCount,
      totalPageCount: Math.ceil(impactStoryCount / pageLimit),
    };
  }

  async viewAllPartnersImpactStory(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ImpactStoryService.viewAllPartnersImpactStory');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const impactStoryList = await this.impactStoryModel
      .find({
        $and: [
          {
            year,
            isDeleted: false,
            networkId: { $eq: null },
            partnerId: { $ne: null },
            statusId: { $ne: inProgressStatusId },
          },
          {
            $or: [{ impactStoryCode: regex }, { instituteName: regex }],
          },
        ],
      })
      .sort(sortQuery)
      .skip(pageLimit * pageIndex)
      .limit(pageLimit)
      .exec();

    const impactStoryCount = await this.impactStoryModel
      .find({
        year,
        isDeleted: false,
        networkId: { $eq: null },
        partnerId: { $ne: null },
        statusId: { $ne: inProgressStatusId },
      })
      .count()
      .exec();

    const impactStories = await this.getArrayOfImpactStoryObject(
      impactStoryList,
    );
    return {
      impactStories,
      impactStoryCount,
      totalPageCount: Math.ceil(impactStoryCount / pageLimit),
    };
  }

  async finalSaveImpactStory(impactStoryId: string, user: any) {
    Logger.debug('ImpactStoryService.finalSaveImpactStory');
    const impactStory = await this.checkIfStoryExists(
      impactStoryId,
      user.networkId,
      user.partnerId,
    );
    if (impactStory === null) {
      throw new NotFoundException(errorMessages.IMPACT_STORY_NOT_FOUND);
    } else {
      if (
        impactStory.impactStory.isStoryInfoTabFilled &&
        impactStory.impactStory.isStoryTellerTabFilled &&
        impactStory.impactStory.isStorySelectionTabFilled
      ) {
        if (user.networkId === null && user.partnerId === null) {
          const approvedStatusId = await this.userService.getStatusId(
            StatusEnum.APPROVED,
          );
          await this.setApprovedAtTime(impactStoryId, new Date());
          return this.updateImpactStoryStatus(impactStoryId, approvedStatusId);
        }
      } else {
        return {
          isStoryInfoTabFilled: impactStory.impactStory.isStoryInfoTabFilled,
          isStoryTellerTabFilled: impactStory.impactStory.isStoryTellerTabFilled,
          isStorySelectionTabFilled: impactStory.impactStory.isStorySelectionTabFilled,
        };
      }
    }
  }

  async uploadStoryFiles(files) {
    Logger.debug('ImpactStoryService.uploadStoryFiles');
    console.log('mime type ', mimetypes);
    if (files.length === 0)
      throw new UnprocessableEntityException(errorMessages.FILE_SELECT);

    const fileResponseArray = [];

    const listOfPreviousBlobs = await this.reportsService.getAllAzureBlobs();
    // console.log('listOfPreviousBlobs in imapct story= ', listOfPreviousBlobs);
    let isExist = false;

    for (const file of files) {
      console.log('each file =', file);
      //allow 5MB
      if (!mimetypes.includes(file.mimetype)) {
        throw new UnprocessableEntityException(
          errorMessages.UPLOAD_VALID_FILE_TYPE,
        );
      } else if (
        (file.mimetype == 'text/csv' ||
          file.mimetype ==
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype ==
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimetype == 'image/jpeg' ||
          file.mimetype == 'image/png' ||
          file.mimetype == 'application/pdf') &&
        file.size > 5000000 //5MB
      ) {
        throw new UnprocessableEntityException(errorMessages.MAX_5MB_FILE);
      }
      //allow 50MB
      else if (
        (file.mimetype == 'audio/mpeg' || file.mimetype == 'video/mp4') &&
        file.size > 50000000
      ) {
        throw new UnprocessableEntityException(errorMessages.MAX_50MB_FILE);
      }

      let tempName = file.originalname;
      file.originalname = `${file.originalname} - ${uuidv4()}`;
      console.log('file.originalname impact story>>>>>', file.originalname);

      const blobClient = await this.reportsService.getBlobClient(
        file.originalname,
      );
      // console.log('blobClient in uploadToAzureBlob = ', blobClient);

      for (const eachBlob of listOfPreviousBlobs) {
        // console.log('eachBlob.name = ', eachBlob.name);
        // console.log('file.originalname = ', file.originalname);
        if (file.originalname === eachBlob.name) isExist = true;
      }
      if (isExist) {
        throw new ConflictException(
          file.originalname + errorMessages.BLOB_NAME_ALREADY_EXISTS,
        );
      } else {
        const responseAfterUpload = await blobClient.uploadData(file.buffer);
        console.log('responseAfterUpload = ', responseAfterUpload);
        fileResponseArray.push({
          requestId: responseAfterUpload.requestId,
          fileName: file.originalname,
          originalName: tempName
        });
      }
    }
    return fileResponseArray;
  }

  async deleteImpactStoryFromAzure(
    filename: string,
    requestId: string,
    fieldKey: string,
    impactStoryId: string,
  ) {
    Logger.debug('ImpactStoryService.deleteImpactStoryFromAzure');

    const foundImpactStory = await this.impactStoryModel
      .findOne({
        isDeleted: false,
        impactStoryId,
      })
      .exec();
    console.log('foundImpactStory = ', foundImpactStory);

    const tempArr = [];

    if (
      fieldKey === 'storyOfChangeDraft' &&
      foundImpactStory.storyOfChangeDraft !== null
    ) {
      await this.impactStoryModel
        .findOneAndUpdate(
          { isDeleted: false, impactStoryId },
          { storyOfChangeDraft: null },
          { new: true },
        )
        .exec();
      console.log('storyOfChangeDraft deleted from DB successfully.');
    }
    if (
      fieldKey === 'linksToSourcesOfInformation' &&
      (foundImpactStory.linksToSourcesOfInformation !== null ||
        foundImpactStory.linksToSourcesOfInformation.length > 0)
    ) {
      for (const data of foundImpactStory.linksToSourcesOfInformation) {
        if (data.fileName !== filename) tempArr.push(data);
      }
      await this.impactStoryModel
        .findOneAndUpdate(
          { isDeleted: false, impactStoryId },
          { linksToSourcesOfInformation: tempArr },
          { new: true },
        )
        .exec();
      console.log('linksToSourcesOfInformation deleted from DB successfully.');
    }
    const blobClient = await this.reportsService.getBlobClient(filename);
    await blobClient.deleteIfExists();
  }
}
