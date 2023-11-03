import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { errorMessages } from '../utils/error-messages.utils';
import { WorkplanService } from '../workplans/workplan.service';
import { UserService } from '../users/user.service';
import CreateHierarchyDto from './dto/createHierarchy.dto';
import SendForApprovalDto from './dto/sendForApproval.dto';
import { ApprovalTypeEnum } from './enum/approvalTypes.enum';
import { ApprovalHierarchy } from './schema/approvalHierarchy.schema';
import { ApprovalType } from './schema/approvalTypes.schema';
import { MelpService } from '../melp/melp.service';
import { User } from '../users/schema/user.schema';
import { ApprovalRequests } from './schema/approvalRequests.schema';
import { ApprovalDetails } from './schema/approvalDetails.schema';
import DenyRequestDto from './dto/denyRequest.dto';
import { WorkplanActivities } from '../workplans/schema/workplan_activities.schema';
import { Activities } from '../activities/schema/activities.schema';
import { v4 as uuidv4 } from 'uuid';
import { ActivitiesService } from '../activities/activities.service';
import { ImpactStoryService } from '../impactStory/impactStory.service';
import { StatusEnum } from '../common/enum/status.enum';
import { ReportsService } from '../reports/reports.service';
import { NetworkReportingService } from '../networkReporting/networkReporting.service';

@Injectable()
export class ApprovalHierarchyService {
  constructor(
    @InjectModel(ApprovalType.name)
    private readonly approvalTypeModel: Model<ApprovalType>,
    @InjectModel(ApprovalHierarchy.name)
    private readonly approvalHierarchyModel: Model<ApprovalHierarchy>,
    @InjectModel(ApprovalRequests.name)
    private readonly approvalRequestsModel: Model<ApprovalRequests>,
    @InjectModel(ApprovalDetails.name)
    private readonly approvalDetailsModel: Model<ApprovalDetails>,

    @InjectModel(WorkplanActivities.name)
    private workplanActivitiesModel: Model<WorkplanActivities>,

    @InjectModel(Activities.name)
    private activityModel: Model<Activities>,

    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly workplanService: WorkplanService,
    private readonly melpService: MelpService,
    private readonly activityService: ActivitiesService,
    private readonly impactStoryService: ImpactStoryService,
    private readonly reportsService: ReportsService,
    private readonly networkReporting: NetworkReportingService,
  ) {}

  async getApprovalTypeId(typeName: string) {
    Logger.debug('ApprovalHierarchyService.getApprovalType');
    const approvalType = await this.approvalTypeModel
      .findOne({
        typeName: typeName,
      })
      .exec();
    if (approvalType === null)
      throw new NotFoundException(errorMessages.APPROVAL_TYPE_NOT_FOUND);
    else return approvalType._id;
  }

  async addApprovers(approvalHierarchy: CreateHierarchyDto) {
    Logger.debug('ApprovalHierarchyService.addMelpApprovers');
    const approvalTypeId = await this.getApprovalTypeId(
      approvalHierarchy.approvalTypeName,
    );
    if (!approvalTypeId) {
      throw new NotFoundException(errorMessages.APPROVAL_TYPE_NOT_FOUND);
    }

    for (const element of approvalHierarchy.createHierarchy) {
      const existingRecord = await this.approvalHierarchyModel
        .findOne({
          approvalTypeId: approvalTypeId,
          hierarchyLevel: element.hierarchyLevel,
        })
        .exec();
      if (existingRecord === null) {
        await this.approvalHierarchyModel.create({
          ...element,
          approvalHierarchyId: uuidv4(),
          approvalTypeId: approvalTypeId,
        });
      } else {
        await this.approvalHierarchyModel
          .findOneAndUpdate(
            {
              approvalTypeId: approvalTypeId,
              hierarchyLevel: element.hierarchyLevel,
            },
            element,
            { new: true },
          )
          .exec();
      }
      const user = await this.userService.getUser(element.userId);
      if (approvalHierarchy.approvalTypeName === 'melp')
        await this.mailService.sendMelpApprovalHierarchyMail(
          user.email,
          user.fullName,
          element.hierarchyLevel,
        );
      else if (approvalHierarchy.approvalTypeName === 'workplan')
        await this.mailService.sendWorkplanApprovalHierarchyMail(
          user.email,
          user.fullName,
          element.hierarchyLevel,
        );
      else if (approvalHierarchy.approvalTypeName === 'proposal')
        await this.mailService.sendProposalApprovalHierarchyMail(
          user.email,
          user.fullName,
          element.hierarchyLevel,
        );
      else if (approvalHierarchy.approvalTypeName === 'activityReports')
        await this.mailService.sendActivityReportsApprovalHierarchyMail(
          user.email,
          user.fullName,
          element.hierarchyLevel,
        );
      else if (approvalHierarchy.approvalTypeName === 'impactStories')
        await this.mailService.sendImpactStoriesApprovalHierarchyMail(
          user.email,
          user.fullName,
          element.hierarchyLevel,
        );
    }
    return {
      message: `Approvers added for ${approvalHierarchy.approvalTypeName}`,
    };
  }

  async getApprovers(approvalType: string) {
    Logger.debug('ApprovalHierarchyService.getApprovers');
    const approvalTypeId = await this.getApprovalTypeId(approvalType);
    const approvers = await this.approvalHierarchyModel
      .find({
        approvalTypeId: approvalTypeId,
      })
      .exec();

    let approversList = [];
    for (const approver of approvers) {
      const temp = {};
      const user = await this.userService.getUser(approver.userId);
      user.password = undefined;
      temp['user'] = user;
      temp['approvalType'] = approver.approvalTypeId;
      temp['hierarchyLevel'] = approver.hierarchyLevel;
      approversList = [...approversList, { ...temp }];
    }
    return approversList;
  }

  async updateApprovalDetails(approvalRequestId, approvalHierarchyId) {
    await this.approvalDetailsModel
      .findOneAndUpdate(
        {
          approvalRequestId,
          approvalHierarchyId,
        },
        {
          actiontakenDate: new Date(),
        },
      )
      .exec();
  }

  // Request for info API's
  async commonFunctionForSendingMailOfInfoRequestedAndDenial(
    hierarchyData,
    entityCode: string,
    approvalType: string,
    reasonDto: DenyRequestDto,
    isDenialMail: boolean,
    user: any,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.commonFunctionForSendingMailOfInfoRequestedAndDenial',
    );
    if (hierarchyData === null)
      throw new BadRequestException(errorMessages.NOT_ASSIGNED_AS_APPROVER);

    let statusId;
    const approvalRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId: hierarchyData.approvalTypeId,
        entityToBeApprovedId: reasonDto.entityToBeApprovedId,
      })
      .exec();
    const userDetails = await this.userService.getUser(
      approvalRequest.requestedBy,
    );

    let message;
    if (isDenialMail) {
      statusId = await this.userService.getStatusId(StatusEnum.DENIED);
      await this.mailService.denialMailForApprovalTypes(
        userDetails.email,
        userDetails.fullName,
        entityCode,
        approvalType,
        reasonDto.reason,
      );
      message = 'is denied';
    } else {
      statusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );
      await this.mailService.infoRequestedMailForApprovalTypes(
        userDetails.email,
        userDetails.fullName,
        entityCode,
        approvalType,
        reasonDto.reason,
      );
      message = 'has been requested more information';
    }

    await this.approvalDetailsModel
      .findOneAndUpdate(
        { approvalHierarchyId: hierarchyData._id },
        { statusId: statusId, actiontakenDate: new Date() },
        { new: true },
      )
      .exec();

    await this.melpService.addActivityLog(
      user,
      `${approvalType} - ${entityCode} ${message}`,
    );
  }

  async proposalRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.proposalRequestForInformation');
    const proposal = await this.activityService.checkIfProposalExists(
      requestForInformationDto.entityToBeApprovedId,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      proposal.activityCode,
      'Proposal',
      requestForInformationDto,
      false,
      user,
    );

    await this.activityService.updateProposalStatus(
      proposal.activityProposalId,
      infoRequestedStatusId,
    );
  }

  async melpRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.melpRequestForInformation');
    const melp = await this.melpService.getMelpByMelpId(
      requestForInformationDto.entityToBeApprovedId,
    );
    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);

    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      melp.melpCode,
      'MELP',
      requestForInformationDto,
      false,
      user,
    );

    await this.melpService.updateGeneralUserMelpStatus(
      melp.melpId,
      infoRequestedStatusId,
    );
  }

  async workplanRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.workplanRequestForInformation');
    const workplan = await this.workplanService.getWorkplanById(
      requestForInformationDto.entityToBeApprovedId,
    );
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      workplan.workplanCode,
      'Workplan',
      requestForInformationDto,
      false,
      user,
    );
    await this.workplanService.updateGeneralUserWorkplanStatus(
      workplan.workplanId,
      infoRequestedStatusId,
    );
  }

  async impactStoryRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.impactStoryRequestForInformation');
    const impactStory = await this.impactStoryService.getImpactStoryById(
      requestForInformationDto.entityToBeApprovedId,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      impactStory.impactStoryCode,
      'Impact Story',
      requestForInformationDto,
      false,
      user,
    );
    await this.impactStoryService.updateImpactStoryStatus(
      impactStory.impactStoryId,
      infoRequestedStatusId,
    );
  }

  async outputReportRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.reportRequestForInformation');
    const report = await this.reportsService.checkIfOutputReportExists(
      requestForInformationDto.entityToBeApprovedId,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      report.outputReportCode,
      'ActivityReports',
      requestForInformationDto,
      false,
      user,
    );
    await this.reportsService.updateGeneralUserReportStatus(
      report.outputReportId,
      infoRequestedStatusId,
      user,
    );
  }

  async outcomeReportRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.outcomeReportRequestForInformation');
    const report = await this.reportsService.checkIfOutcomeReportExists(
      requestForInformationDto.entityToBeApprovedId,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      requestForInformationDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      report.outcomeReportCode,
      'ActivityReports',
      requestForInformationDto,
      false,
      user,
    );
    await this.reportsService.updateGeneralUserOutcomeReportStatus(
      report.outcomeReportId,
      infoRequestedStatusId,
      user,
    );
  }

  async progressReportRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.progressReportRequestForInformation',
    );
    const progressReport =
      await this.networkReporting.getProgressReportByProgressReportId(
        requestForInformationDto.entityToBeApprovedId,
      );

    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      progressReport.progressReportCode,
      'Progress Report',
      requestForInformationDto,
      false,
      user,
    );
    await this.networkReporting.updateProgressReportStatus(
      progressReport.progressReportId,
      infoRequestedStatusId,
    );
  }

  async annualReportRequestForInformation(
    requestForInformationDto: DenyRequestDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.annualReportRequestForInformation');
    const annualReport =
      await this.networkReporting.getAnnualReportByAnnualReportId(
        requestForInformationDto.entityToBeApprovedId,
      );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      annualReport.annualReportCode,
      'Annual Report',
      requestForInformationDto,
      false,
      user,
    );
    await this.networkReporting.updateAnnualReportStatus(
      annualReport.annualReportId,
      infoRequestedStatusId,
    );
  }

  /**Send for approval API's */
  async commonFunctionForSendingMailOfSendForApproval(
    approvalTypeId,
    entityToBeApprovedId: string,
    entityCode: string,
    approvalType: string,
    user: any,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.commonFunctionForSendingMailOfSendForApproval',
    );
    const firstApprover = await this.approvalHierarchyModel
      .findOne({ approvalTypeId, hierarchyLevel: 1 })
      .exec();

    if (firstApprover === null)
      throw new BadRequestException(errorMessages.APPROVERS_NOT_ASSIGNED);

    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const newApprovalRequest = await this.approvalRequestsModel.create({
      approvalRequestId: uuidv4(),
      approvalTypeId,
      requestedBy: user._id,
      entityToBeApprovedId,
    });
    const foundUser = await this.userService.getUser(firstApprover.userId);
    this.mailService.sendForApprovalForApprovalTypes(
      foundUser.email,
      foundUser.fullName,
      entityCode,
      approvalType,
    );

    const requestReceivedDate = newApprovalRequest.requestedDate;
    await this.approvalDetailsModel.create({
      appprovalDetailsId: uuidv4(),
      approvalRequestId: newApprovalRequest._id,
      approvalHierarchyId: firstApprover._id,
      statusId: receivedForApprovalId,
      requestReceivedDate,
    });
    await this.melpService.addActivityLog(
      user,
      `${approvalType} - ${entityCode} sent for approval`,
    );

    return newApprovalRequest;
  }

  async commonFunctionForSendingMailOfResubmitted(
    approvedCount: number,
    approvalTypeId,
    entityCode: string,
    approvalType: string,
    resubmittedStatusId: Types.ObjectId,
    updatedRequest: any,
    user: any,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.commonFunctionForSendingMailOfResubmitted',
    );

    const approver = await this.approvalHierarchyModel
      .findOne({ approvalTypeId, hierarchyLevel: approvedCount + 1 })
      .exec();
    const foundUser = await this.userService.getUser(approver.userId);
    this.mailService.resubmittedMailForApprovalTypes(
      foundUser.email,
      foundUser.fullName,
      entityCode,
      approvalType,
    );

    const requestReceivedDate = updatedRequest.requestedDate;
    await this.approvalDetailsModel.create({
      appprovalDetailsId: uuidv4(),
      approvalRequestId: updatedRequest._id,
      approvalHierarchyId: approver._id,
      statusId: resubmittedStatusId,
      requestReceivedDate,
    });

    await this.melpService.addActivityLog(
      user,
      `${approvalType} - ${entityCode} resubmitted`,
    );
  }

  async sendProposalForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendProposalForApproval');
    const proposal = await this.activityService.checkIfProposalExists(
      sendForApprovalDto.entityToBeApprovedId,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.PROPOSAL,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          proposal.activityProposalId,
          proposal.activityCode,
          'Proposal',
          user,
        );

      await this.activityService.setSubmittedAtTimeOfProposal(
        proposal.activityProposalId,
        newApprovalRequest.requestedDate,
      );

      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );

      await this.activityService.updateProposalStatus(
        proposal.activityProposalId,
        submittedStatusId,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.activityService.updateProposalStatus(
        proposal.activityProposalId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        proposal.approvedCount,
        approvalTypeId,
        proposal.activityCode,
        'Activity Proposal',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  async sendMelpForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendMelpForApproval');
    const melp = await this.melpService.getMelpByMelpId(
      sendForApprovalDto.entityToBeApprovedId,
    );
    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);

    const approvalTypeId = await this.getApprovalTypeId(ApprovalTypeEnum.MELP);

    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          melp.melpId,
          melp.melpCode,
          'Melp',
          user,
        );

      await this.melpService.setSubmittedAtTime(
        melp.melpId,
        newApprovalRequest.requestedDate,
      );

      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.melpService.updateGeneralUserMelpStatus(
        melp.melpId,
        submittedStatusId,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );

      await this.melpService.updateGeneralUserMelpStatus(
        melp.melpId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        melp.approvedCount,
        approvalTypeId,
        melp.melpCode,
        'Melp',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  async sendWorkplanForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendWorkplanForApproval');
    const workplan = await this.workplanService.getWorkplanById(
      sendForApprovalDto.entityToBeApprovedId,
    );
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);

    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.WORKPLAN,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    /** Check if it is an existing request, if yes then update the status to resubmitted else create a request */
    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          workplan.workplanId,
          workplan.workplanCode,
          'Workplan',
          user,
        );

      await this.workplanService.setSubmittedAtTime(
        workplan.workplanId,
        newApprovalRequest.requestedDate,
      );

      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.workplanService.updateGeneralUserWorkplanStatus(
        workplan.workplanId,
        submittedStatusId,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.workplanService.updateGeneralUserWorkplanStatus(
        workplan.workplanId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        workplan.approvedCount,
        approvalTypeId,
        workplan.workplanCode,
        'Workplan',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  async sendImpactStoryForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendImpactStoryForApproval');
    const impactStory = await this.impactStoryService.getImpactStoryById(
      sendForApprovalDto.entityToBeApprovedId,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.IMPACTSTORIES,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          impactStory.impactStoryId,
          impactStory.impactStoryCode,
          'Impact Story',
          user,
        );
      await this.impactStoryService.setSubmittedAtTime(
        impactStory.impactStoryId,
        newApprovalRequest.requestedDate,
      );
      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.impactStoryService.updateImpactStoryStatus(
        impactStory.impactStoryId,
        submittedStatusId,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.impactStoryService.updateImpactStoryStatus(
        impactStory.impactStoryId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        impactStory.approvedCount,
        approvalTypeId,
        impactStory.impactStoryCode,
        'Impact Story',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  async sendOutputReportForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendOutputReportForApproval');
    const foundReport = await this.reportsService.getOutputReportById(
      sendForApprovalDto.entityToBeApprovedId,
    );
    if (foundReport.outputReport.length === 0)
      throw new NotFoundException(errorMessages.Report_NOT_FOUND);
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );

    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          foundReport.outputReport[0].outputReportId,
          foundReport.outputReport[0].outputReportCode,
          'Output Report',
          user,
        );
      await this.reportsService.setSubmittedAtTimeOfOutputReport(
        foundReport.outputReport[0].outputReportId,
        newApprovalRequest.requestedDate,
      );
      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.reportsService.updateGeneralUserReportStatus(
        foundReport.outputReport[0].outputReportId,
        submittedStatusId,
        user,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.reportsService.updateGeneralUserReportStatus(
        foundReport.outputReport[0].outputReportId,
        resubmittedStatusId,
        user,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        foundReport.outputReport[0].approvedCount,
        approvalTypeId,
        foundReport.outputReport[0].outputReportCode,
        'Output Report',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  async sendProgressReportForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendProgressReportForApproval');
    const progressReport =
      await this.networkReporting.getProgressReportByProgressReportId(
        sendForApprovalDto.entityToBeApprovedId,
      );

    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    /** Check if it is an existing request, if yes then update the status to resubmitted else create a request */
    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          progressReport.progressReportId,
          progressReport.progressReportCode,
          'Progress Report',
          user,
        );

      await this.networkReporting.setSubmittedAtTimeOfProgressReport(
        progressReport.progressReportId,
        newApprovalRequest.requestedDate,
      );

      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );

      await this.networkReporting.updateProgressReportStatus(
        progressReport.progressReportId,
        submittedStatusId,
      );

      return {
        message: 'Progress Report sent for approval',
      };
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.networkReporting.updateProgressReportStatus(
        progressReport.progressReportId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        progressReport.approvedCount,
        approvalTypeId,
        progressReport.progressReportCode,
        'Progres Report',
        resubmittedStatusId,
        updatedRequest,
        user,
      );

      return {
        message: 'Progress Report resubmitted',
      };
    }
  }

  async sendAnnualReportForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendAnnualReportForApproval');
    const annualReport =
      await this.networkReporting.getAnnualReportByAnnualReportId(
        sendForApprovalDto.entityToBeApprovedId,
      );

    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    /** Check if it is an existing request, if yes then update the status to resubmitted else create a request */
    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          annualReport.annualReportId,
          annualReport.annualReportCode,
          'Annual Report',
          user,
        );

      await this.networkReporting.setSubmittedAtTimeOfAnnualReport(
        annualReport.annualReportId,
        newApprovalRequest.requestedDate,
      );
      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.networkReporting.updateAnnualReportStatus(
        annualReport.annualReportId,
        submittedStatusId,
      );

      return {
        message: 'Annual Report sent for approval',
      };
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.networkReporting.updateAnnualReportStatus(
        annualReport.annualReportId,
        resubmittedStatusId,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        annualReport.approvedCount,
        approvalTypeId,
        annualReport.annualReportCode,
        'Annual Report',
        resubmittedStatusId,
        updatedRequest,
        user,
      );

      return {
        message: 'Annual Report resubmitted',
      };
    }
  }

  async sendOutcomeReportForApproval(
    sendForApprovalDto: SendForApprovalDto,
    user: User,
  ) {
    Logger.debug('ApprovalHierarchyService.sendOutcomeReportForApproval');
    const foundReport = await this.reportsService.getOutcomeReportById(
      sendForApprovalDto.entityToBeApprovedId,
    );
    if (foundReport.outcomeReport.length === 0)
      throw new NotFoundException(errorMessages.OUTCOME_REPORT_NOT_FOUND);

    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const existingRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
      })
      .exec();

    if (existingRequest === null) {
      const newApprovalRequest =
        await this.commonFunctionForSendingMailOfSendForApproval(
          approvalTypeId,
          foundReport.outcomeReport[0].outcomeReportId,
          foundReport.outcomeReport[0].outcomeReportCode,
          'Outcome Report',
          user,
        );
      await this.reportsService.setSubmittedAtTimeOfOutcomeReport(
        foundReport.outcomeReport[0].outcomeReportId,
        newApprovalRequest.requestedDate,
      );
      const submittedStatusId = await this.userService.getStatusId(
        StatusEnum.SUBMITTED,
      );
      await this.reportsService.updateGeneralUserOutcomeReportStatus(
        foundReport.outcomeReport[0].outcomeReportId,
        submittedStatusId,
        user,
      );
    } else {
      const resubmittedStatusId = await this.userService.getStatusId(
        StatusEnum.RESUBMITTED,
      );
      await this.reportsService.updateGeneralUserOutcomeReportStatus(
        foundReport.outcomeReport[0].outcomeReportId,
        resubmittedStatusId,
        user,
      );

      const updatedRequest = await this.approvalRequestsModel
        .findOneAndUpdate(
          {
            approvalTypeId,
            entityToBeApprovedId: sendForApprovalDto.entityToBeApprovedId,
          },
          { requestedDate: new Date() },
          { new: true },
        )
        .exec();

      await this.commonFunctionForSendingMailOfResubmitted(
        foundReport.outcomeReport[0].approvedCount,
        approvalTypeId,
        foundReport.outcomeReport[0].outcomeReportCode,
        'Outcome Report',
        resubmittedStatusId,
        updatedRequest,
        user,
      );
    }
  }

  //Deny API's
  async denyProposal(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyProposal');
    const proposal = await this.activityService.checkIfProposalExists(
      denyRequestDto.entityToBeApprovedId,
    );

    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );

    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      proposal.activityCode,
      'Proposal',
      denyRequestDto,
      true,
      user,
    );

    await this.activityService.updateProposalStatus(
      proposal.activityProposalId,
      deniedStatusId,
    );
  }

  async denyMelp(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyMelp');
    const melp = await this.melpService.getMelpByMelpId(
      denyRequestDto.entityToBeApprovedId,
    );
    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      melp.melpCode,
      'Melp',
      denyRequestDto,
      true,
      user,
    );
    await this.melpService.updateGeneralUserMelpStatus(
      melp.melpId,
      deniedStatusId,
    );
  }

  async denyWorkplan(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyWorkplan');
    const workplan = await this.workplanService.getWorkplanById(
      denyRequestDto.entityToBeApprovedId,
    );
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      workplan.workplanCode,
      'Workplan',
      denyRequestDto,
      true,
      user,
    );
    await this.workplanService.updateGeneralUserWorkplanStatus(
      workplan.workplanId,
      deniedStatusId,
    );
  }

  async denyImpactStory(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyImpactStory');
    const impactStory = await this.impactStoryService.getImpactStoryById(
      denyRequestDto.entityToBeApprovedId,
    );
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );

    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      impactStory.impactStoryCode,
      'Impact Story',
      denyRequestDto,
      true,
      user,
    );
    await this.impactStoryService.updateImpactStoryStatus(
      impactStory.impactStoryId,
      deniedStatusId,
    );
  }

  async denyOutputReport(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyOutputReport');
    const outputReport = await this.reportsService.getOutputReportById(
      denyRequestDto.entityToBeApprovedId,
    );
    if (outputReport.outputReport.length === 0)
      throw new NotFoundException(errorMessages.Report_NOT_FOUND);
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    /**Request for info and denial mails should go to general user */
    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      // outputReport[0].outputReportCode,
      outputReport.outputReport[0].outputReportCode,
      'ActivityReports',
      denyRequestDto,
      true,
      user,
    );
    await this.reportsService.updateGeneralUserReportStatus(
      // outputReport[0].outputReportId,
      outputReport.outputReport[0].outputReportId,
      deniedStatusId,
      user,
    );
  }

  async denyOutcomeReport(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyOutcomeReport');
    const outcomeReport = await this.reportsService.getOutcomeReportById(
      denyRequestDto.entityToBeApprovedId,
    );
    if (outcomeReport.outcomeReport.length === 0)
      throw new NotFoundException(errorMessages.OUTCOME_REPORT_NOT_FOUND);
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      denyRequestDto.approvalTypeName,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    /**Request for info and denial mails should go to general user */
    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      outcomeReport.outcomeReport[0].outcomeReportCode,
      'ActivityReports',
      denyRequestDto,
      true,
      user,
    );
    await this.reportsService.updateGeneralUserOutcomeReportStatus(
      outcomeReport.outcomeReport[0].outcomeReportId,
      deniedStatusId,
      user,
    );
  }

  async denyProgressReport(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyProgressReport');
    const progressReport =
      await this.networkReporting.getProgressReportByProgressReportId(
        denyRequestDto.entityToBeApprovedId,
      );
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      progressReport.progressReportCode,
      'Progress Report',
      denyRequestDto,
      true,
      user,
    );
    await this.networkReporting.updateProgressReportStatus(
      progressReport.progressReportId,
      deniedStatusId,
    );
  }

  async denyAnnualReport(denyRequestDto: DenyRequestDto, user: User) {
    Logger.debug('ApprovalHierarchyService.denyAnnualReport');
    const annualReport =
      await this.networkReporting.getAnnualReportByAnnualReportId(
        denyRequestDto.entityToBeApprovedId,
      );
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const hierarchyData = await this.approvalHierarchyModel
      .findOne({
        userId: user._id,
        approvalTypeId,
      })
      .exec();

    await this.commonFunctionForSendingMailOfInfoRequestedAndDenial(
      hierarchyData,
      annualReport.annualReportCode,
      'Annual Report',
      denyRequestDto,
      true,
      user,
    );
    await this.networkReporting.updateAnnualReportStatus(
      annualReport.annualReportId,
      deniedStatusId,
    );
  }

  // Approve API's
  async getApprovalRequestAndApprovers(
    approvalTypeId,
    entityToBeApprovedId: string,
  ) {
    Logger.debug('ApprovalHierarchyService.commonFunctionForApproval');
    const foundApprovalRequest = await this.approvalRequestsModel
      .findOne({
        approvalTypeId,
        entityToBeApprovedId,
      })
      .exec();
    const foundApprovers = await this.approvalHierarchyModel
      .find({ approvalTypeId })
      .sort({ hierarchyLevel: 1 })
      .exec();
    return {
      foundApprovalRequest,
      foundApprovers,
    };
  }

  async updateApprovalDetailsRecord(foundApprovalRequest) {
    Logger.debug('ApprovalHierarchyService.updateApprovalDetails');
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const resubmittedStatusId = await this.userService.getStatusId(
      StatusEnum.RESUBMITTED,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    return this.approvalDetailsModel
      .findOneAndUpdate(
        {
          statusId: { $in: [receivedForApprovalId, resubmittedStatusId] },
          approvalRequestId: foundApprovalRequest._id,
        },
        { statusId: approvedStatusId, actiontakenDate: new Date() },
        { new: true },
      )
      .exec();
  }

  async commonFunctionForSendingApprovalMail(
    foundUser: User,
    approvalHierarchyId,
    updatedRecord: ApprovalDetails,
    receivedForApprovalId,
    foundApprovalRequest: ApprovalRequests,
    entityCode: string,
    approvalType: string,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.commonFunctionForSendingApprovalMail',
    );
    console.log('User mail ', foundUser.email);
    this.mailService.sendForApprovalForApprovalTypes(
      foundUser.email,
      foundUser.fullName,
      entityCode,
      approvalType,
    );
    const requestReceivedDate = updatedRecord.actiontakenDate;
    await this.approvalDetailsModel.create({
      appprovalDetailsId: uuidv4(),
      approvalRequestId: foundApprovalRequest._id,
      approvalHierarchyId: approvalHierarchyId,
      statusId: receivedForApprovalId,
      requestReceivedDate,
    });
    return requestReceivedDate;
  }

  async commonFunctionToCheckPerviousLevelApproval(
    foundApprovalRequest,
    foundApprovers,
    temp,
    approvedStatusId,
  ) {
    Logger.debug(
      'ApprovalHierarchyService.commonFunctionToCheckPerviousLevelApproval',
    );
    const resubmittedStatusId = await this.userService.getStatusId(
      StatusEnum.RESUBMITTED,
    );
    const submittedStatusId = await this.userService.getStatusId(
      StatusEnum.SUBMITTED,
    );
    const oldDetails = await this.approvalDetailsModel
      .findOne({
        approvalRequestId: foundApprovalRequest._id,
        approvalHierarchyId: foundApprovers[temp]._id,
        statusId: {
          $in: [approvedStatusId, resubmittedStatusId, submittedStatusId],
        },
      })
      .exec();

    if (!oldDetails)
      throw new NotFoundException(
        errorMessages.APPROVAL_PENDING_ON_PREVIOUS_LEVEL,
      );
  }

  // async approveWorkplan(workplanId: string, user: any) {
  //   Logger.debug('ApprovalHierarchyService.approveWorkplan');
  //   const workplan = await this.workplanService.getWorkplanById(workplanId);
  //   if (!workplan)
  //     throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);
  //   const approvedStatusId = await this.userService.getStatusId(
  //     StatusEnum.APPROVED,
  //   );
  //   const receivedForApprovalId = await this.userService.getStatusId(
  //     StatusEnum.RECEIVED_FOR_APPROVAL,
  //   );
  //   const approvalTypeId = await this.getApprovalTypeId(
  //     ApprovalTypeEnum.WORKPLAN,
  //   );
  //   const { foundApprovalRequest, foundApprovers } =
  //     await this.getApprovalRequestAndApprovers(
  //       approvalTypeId,
  //       workplan.workplanId,
  //     );
  //   let temp;
  //   console.log("Found approvers ", foundApprovers)
  //   for (let i = 0; i < foundApprovers.length; i++) {
  //     temp = i;
  //     if (
  //       foundApprovers[i].hierarchyLevel === 1 &&
  //       workplan.approvedCount === 0
  //     ) {
  //       console.log("Inside level 1")
  //       const updatedRecord = await this.updateApprovalDetailsRecord(
  //         foundApprovalRequest,
  //       );

  //       await this.workplanService.updateApprovedCount(
  //         workplan.approvedCount + 1,
  //         workplanId,
  //       );
  //       const foundUser = await this.userService.getUser(
  //         foundApprovers[temp + 1].userId,
  //       );
  //       await this.commonFunctionForSendingApprovalMail(
  //         foundUser,
  //         foundApprovers[i]._id,
  //         updatedRecord,
  //         receivedForApprovalId,
  //         foundApprovalRequest,
  //         workplan.workplanCode,
  //         'Workplan',
  //       );
  //       break;
  //     } else if (
  //       (foundApprovers[i].hierarchyLevel === 2 ||
  //         foundApprovers[i].hierarchyLevel === 3) &&
  //       (workplan.approvedCount === 1 || workplan.approvedCount === 2)
  //     ) {
  //       console.log("Inside level 2 /3")
  //       await this.commonFunctionToCheckPerviousLevelApproval(
  //         foundApprovalRequest,
  //         foundApprovers,
  //         temp - 1,
  //         approvedStatusId,
  //       );

  //       temp = i;
  //       const updatedRecord = await this.updateApprovalDetailsRecord(
  //         foundApprovalRequest,
  //       );
  //       await this.workplanService.updateApprovedCount(
  //         workplan.approvedCount + 1,
  //         workplanId,
  //       );
  //       const foundUser = await this.userService.getUser(
  //         foundApprovers[temp + 1].userId,
  //       );
  //       console.log("foundUser ", foundUser, foundApprovers[i]._id )
  //       await this.commonFunctionForSendingApprovalMail(
  //         foundUser,
  //         foundApprovers[i]._id,
  //         updatedRecord,
  //         receivedForApprovalId,
  //         foundApprovalRequest,
  //         workplan.workplanCode,
  //         'Workplan',
  //       );
  //       break;
  //     } else if (foundApprovers[i].hierarchyLevel === 4 && workplan.approvedCount === 3) {
  //       console.log("Inside level 4")
  //       const updatedRecord = await this.updateApprovalDetailsRecord(
  //         foundApprovalRequest,
  //       );

  //       // to set approvedAt field
  //       await this.workplanService.setApprovedAtTime(
  //         workplanId,
  //         updatedRecord.actiontakenDate,
  //       );

  //       await this.workplanService.updateApprovedCount(
  //         workplan.approvedCount + 1,
  //         workplanId,
  //       );

  //       //send mail to user who has requsted the approval
  //       const requestedByUser = await this.userService.getUser(
  //         foundApprovalRequest.requestedBy,
  //       );

  //       await this.mailService.approvalMailForApprovalTypes(
  //         requestedByUser.email,
  //         requestedByUser.fullName,
  //         workplan.workplanCode,
  //         'Workplan',
  //       );
  //       const updatedWorkplan =
  //         await this.workplanService.updateGeneralUserWorkplanStatus(
  //           workplanId,
  //           approvedStatusId,
  //         );

  //       const workplanActivities = await this.workplanActivitiesModel
  //         .find({ workplanId: updatedWorkplan._id })
  //         .exec();

  //       for (const workplanActivity of workplanActivities) {
  //         await this.activityModel
  //           .findOneAndUpdate(
  //             { _id: workplanActivity.activityId, isDeleted: false },
  //             { statusId: approvedStatusId },
  //             { new: true },
  //           )
  //           .exec();
  //       }
  //       await this.melpService.addActivityLog(
  //         user,
  //         `Workplan - ${updatedWorkplan.workplanCode} approved`,
  //       );
  //       return updatedWorkplan;
  //     }
  //   }
  // }

  async approveWorkplan(workplanId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveWorkplan');
    const workplan = await this.workplanService.getWorkplanById(workplanId);
    if (!workplan)
      throw new NotFoundException(errorMessages.WORKPLAN_NOT_FOUND);
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.WORKPLAN,
    );
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        workplan.workplanId,
      );
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        workplan.approvedCount === 0
      ) {
        console.log('Inside level 1 ', foundApprovers[i].userId);
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.workplanService.updateApprovedCount(
          workplan.approvedCount + 1,
          workplanId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );
        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          workplan.workplanCode,
          'Workplan',
        );
        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          workplan.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 && workplan.approvedCount === 2)
      ) {
        console.log('Inside level 2 ', foundApprovers[i].userId, temp);
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );

        temp = i;
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.workplanService.updateApprovedCount(
          workplan.approvedCount + 1,
          workplanId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );
        console.log('foundUser ', foundUser, foundApprovers[i]._id);
        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          workplan.workplanCode,
          'Workplan',
        );
        break;
      } else if (
        foundApprovers[i].hierarchyLevel === 4 &&
        workplan.approvedCount === 3
      ) {
        console.log('Inside level 4');
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        // to set approvedAt field
        await this.workplanService.setApprovedAtTime(
          workplanId,
          updatedRecord.actiontakenDate,
        );

        await this.workplanService.updateApprovedCount(
          workplan.approvedCount + 1,
          workplanId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );

        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          workplan.workplanCode,
          'Workplan',
        );
        const updatedWorkplan =
          await this.workplanService.updateGeneralUserWorkplanStatus(
            workplanId,
            approvedStatusId,
          );

        const workplanActivities = await this.workplanActivitiesModel
          .find({ workplanId: updatedWorkplan._id })
          .exec();

        for (const workplanActivity of workplanActivities) {
          await this.activityModel
            .findOneAndUpdate(
              { _id: workplanActivity.activityId, isDeleted: false },
              { statusId: approvedStatusId },
              { new: true },
            )
            .exec();
        }
        await this.melpService.addActivityLog(
          user,
          `Workplan - ${updatedWorkplan.workplanCode} approved`,
        );
        return updatedWorkplan;
      }
    }
  }

  async approveMelp(melpId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveMelp');
    const melp = await this.melpService.getMelpByMelpId(melpId);
    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(ApprovalTypeEnum.MELP);
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(approvalTypeId, melp.melpId);
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (foundApprovers[i].hierarchyLevel === 1 && melp.approvedCount === 0) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.melpService.updateApprovedCount(
          melp.approvedCount + 1,
          melpId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          melp.melpCode,
          'Melp',
        );

        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 && melp.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 && melp.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.melpService.updateApprovedCount(
          melp.approvedCount + 1,
          melpId,
        );

        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          melp.melpCode,
          'Melp',
        );

        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        // to set approvedAt field
        await this.melpService.setApprovedAtTime(
          melpId,
          updatedRecord.actiontakenDate,
        );

        await this.melpService.updateApprovedCount(
          melp.approvedCount + 1,
          melpId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );
        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          melp.melpCode,
          'Melp',
        );
        const updatedMelp = await this.melpService.updateGeneralUserMelpStatus(
          melpId,
          approvedStatusId,
        );
        await this.melpService.addActivityLog(
          user,
          `Melp - ${updatedMelp.melpCode} approved`,
        );
        return updatedMelp;
      }
    }
  }

  async approveProposal(activityProposalId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveProposal');
    const proposal = await this.activityService.checkIfProposalExists(
      activityProposalId,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.PROPOSAL,
    );
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        proposal.activityProposalId,
      );
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        proposal.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.activityService.updateApprovedCount(
          proposal.approvedCount + 1,
          activityProposalId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          proposal.activityCode,
          'Proposal',
        );

        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          proposal.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 && proposal.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.activityService.updateApprovedCount(
          proposal.approvedCount + 1,
          activityProposalId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          proposal.activityCode,
          'Proposal',
        );

        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        // to set approvedAt field
        await this.activityService.setApprovedAtTimeOfProposal(
          activityProposalId,
          updatedRecord.actiontakenDate,
        );

        await this.activityService.updateApprovedCount(
          proposal.approvedCount + 1,
          activityProposalId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );
        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          proposal.activityCode,
          'Proposal',
        );
        const updatedProposal = await this.activityService.updateProposalStatus(
          activityProposalId,
          approvedStatusId,
        );
        await this.melpService.addActivityLog(
          user,
          `Proposal - ${updatedProposal.activityCode} approved`,
        );
        return updatedProposal;
      }
    }
  }

  async approveImpactStory(impactStoryId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveImpactStory', impactStoryId);
    const impactStory = await this.impactStoryService.getImpactStoryById(
      impactStoryId,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.IMPACTSTORIES,
    );
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        impactStory.impactStoryId,
      );
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        impactStory.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.impactStoryService.updateApprovedCount(
          impactStory.approvedCount + 1,
          impactStoryId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          impactStory.impactStoryCode,
          'Impact Story',
        );

        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          impactStory.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 &&
          impactStory.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.impactStoryService.updateApprovedCount(
          impactStory.approvedCount + 1,
          impactStoryId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          impactStory.impactStoryCode,
          'Impact Story',
        );

        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        // to set approvedAt field
        await this.impactStoryService.setApprovedAtTime(
          impactStoryId,
          updatedRecord.actiontakenDate,
        );

        await this.impactStoryService.updateApprovedCount(
          impactStory.approvedCount + 1,
          impactStoryId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );
        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          impactStory.impactStoryCode,
          'Impact Story',
        );
        const updatedImpactStory =
          await this.impactStoryService.updateImpactStoryStatus(
            impactStoryId,
            approvedStatusId,
          );

        await this.melpService.addActivityLog(
          user,
          `Impact Story - ${updatedImpactStory.impactStoryCode} approved`,
        );
      }
    }
  }

  async approveOutputReport(reportId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveOutputReport');
    const report = await this.reportsService.checkIfOutputReportExists(
      reportId,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );

    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        report.outputReportId,
      );

    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        report.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.reportsService.updateOutputReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          report.outputReportCode,
          'ActivityReports',
        );
        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          report.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 && report.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.reportsService.updateOutputReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          report.outputReportCode,
          'ActivityReports',
        );
        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.reportsService.setApprovedAtTimeOfOutputReport(
          reportId,
          updatedRecord.actiontakenDate,
        );

        await this.reportsService.updateOutputReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );
        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          report.outputReportCode,
          'ActivityReports',
        );
        const updatedProposal =
          await this.reportsService.updateGeneralUserReportStatus(
            reportId,
            approvedStatusId,
            user,
          );
        await this.melpService.addActivityLog(
          user,
          `Output Report - ${updatedProposal.outputReportCode} is approved.`,
        );
        return updatedProposal;
      }
    }
  }

  async approveOutcomeReport(reportId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveOutcomeReport');
    const report = await this.reportsService.checkIfOutcomeReportExists(
      reportId,
    );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );

    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        report.outcomeReportId,
      );

    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        report.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.reportsService.updateOutcomeReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          report.outcomeReportCode,
          'ActivityReports',
        );

        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          report.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 && report.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.reportsService.updateOutcomeReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          report.outcomeReportCode,
          'ActivityReports',
        );
        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.reportsService.setApprovedAtTimeOfOutcomeReport(
          reportId,
          updatedRecord.actiontakenDate,
        );

        await this.reportsService.updateOutcomeReportApprovedCount(
          report.approvedCount + 1,
          reportId,
        );

        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );

        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          report.outcomeReportCode,
          'ActivityReports',
        );
        const updatedProposal =
          await this.reportsService.updateGeneralUserOutcomeReportStatus(
            reportId,
            approvedStatusId,
            user,
          );
        await this.melpService.addActivityLog(
          user,
          `Outcome Report - ${updatedProposal.outcomeReportCode} is approved.`,
        );
        return updatedProposal;
      }
    }
  }

  async approveProgressReport(progressReportId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveProgressReport');
    const progressReport =
      await this.networkReporting.getProgressReportByProgressReportId(
        progressReportId,
      );
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        progressReport.progressReportId,
      );
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        progressReport.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.networkReporting.updateProgressReportApprovedCount(
          progressReport.approvedCount + 1,
          progressReportId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          progressReport.progressReportCode,
          'Progress Report',
        );
        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          progressReport.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 &&
          progressReport.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.networkReporting.updateProgressReportApprovedCount(
          progressReport.approvedCount + 1,
          progressReportId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          progressReport.progressReportCode,
          'Progress Report',
        );
        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        // to set approvedAt field
        await this.networkReporting.setApprovedAtTimeOfProgressReport(
          progressReportId,
          updatedRecord.actiontakenDate,
        );

        await this.networkReporting.updateProgressReportApprovedCount(
          progressReport.approvedCount + 1,
          progressReportId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );
        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          progressReport.progressReportCode,
          'Progress Report',
        );
        const updateProgressReport =
          await this.networkReporting.updateProgressReportStatus(
            progressReportId,
            approvedStatusId,
          );

        await this.melpService.addActivityLog(
          user,
          `Progress Report - ${updateProgressReport.progressReportCode} approved`,
        );
        return updateProgressReport;
      }
    }
  }

  async approveAnnualReport(annualReportId: string, user: any) {
    Logger.debug('ApprovalHierarchyService.approveAnnualReport');
    const annualReport =
      await this.networkReporting.getAnnualReportByAnnualReportId(
        annualReportId,
      );

    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const receivedForApprovalId = await this.userService.getStatusId(
      StatusEnum.RECEIVED_FOR_APPROVAL,
    );
    const approvalTypeId = await this.getApprovalTypeId(
      ApprovalTypeEnum.REPORTS,
    );
    const { foundApprovalRequest, foundApprovers } =
      await this.getApprovalRequestAndApprovers(
        approvalTypeId,
        annualReport.annualReportId,
      );
    let temp;
    for (let i = 0; i < foundApprovers.length; i++) {
      temp = i;
      if (
        foundApprovers[i].hierarchyLevel === 1 &&
        annualReport.approvedCount === 0
      ) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        await this.networkReporting.updateAnnualReportApprovedCount(
          annualReport.approvedCount + 1,
          annualReportId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          annualReport.annualReportCode,
          'Annual Report',
        );
        break;
      } else if (
        (foundApprovers[i].hierarchyLevel === 2 &&
          annualReport.approvedCount === 1) ||
        (foundApprovers[i].hierarchyLevel === 3 &&
          annualReport.approvedCount === 2)
      ) {
        // await this.commonFunctionToCheckPerviousLevelApproval(
        //   foundApprovalRequest,
        //   foundApprovers,
        //   temp - 1,
        //   approvedStatusId,
        // );
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );
        await this.networkReporting.updateAnnualReportApprovedCount(
          annualReport.approvedCount + 1,
          annualReportId,
        );
        const foundUser = await this.userService.getUser(
          foundApprovers[temp + 1].userId,
        );

        await this.commonFunctionForSendingApprovalMail(
          foundUser,
          foundApprovers[i]._id,
          updatedRecord,
          receivedForApprovalId,
          foundApprovalRequest,
          annualReport.annualReportCode,
          'Annual Report',
        );
        break;
      } else if (foundApprovers[i].hierarchyLevel === 4) {
        const updatedRecord = await this.updateApprovalDetailsRecord(
          foundApprovalRequest,
        );

        // to set approvedAt field
        await this.networkReporting.setApprovedAtTimeOfAnnualReport(
          annualReportId,
          updatedRecord.actiontakenDate,
        );

        await this.networkReporting.updateAnnualReportApprovedCount(
          annualReport.approvedCount + 1,
          annualReportId,
        );

        //send mail to user who has requsted the approval
        const requestedByUser = await this.userService.getUser(
          foundApprovalRequest.requestedBy,
        );

        await this.mailService.approvalMailForApprovalTypes(
          requestedByUser.email,
          requestedByUser.fullName,
          annualReport.annualReportCode,
          'Annual Report',
        );
        const updateAnnualReport =
          await this.networkReporting.updateAnnualReportStatus(
            annualReportId,
            approvedStatusId,
          );

        await this.melpService.addActivityLog(
          user,
          `Annual Report - ${updateAnnualReport.annualReportCode} approved`,
        );
        return updateAnnualReport;
      }
    }
  }
}
