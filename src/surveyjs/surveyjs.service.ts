import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { AddSurveyFormDto } from './dto/add-surveyForm.dto';
import { SurveyjsForm } from './schema/surveyjsForm.schema';
import { PartnerService } from 'src/partners/partner.service';
import { NetworkService } from 'src/networks/network.service';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MelpService } from '../melp/melp.service';
import { EditSurveyFormDto } from './dto/edit-surveyForm.dto';
import { SurveyjsResponse } from './schema/surveyjsResponse.schema';
import { CapnetEnum } from '../common/enum/capnet.enum';
import { errorMessages } from 'src/utils/error-messages.utils';

@Injectable()
export class SurveyjsService {
  constructor(
    @InjectModel(SurveyjsForm.name)
    private surveyjsFormModel: Model<SurveyjsForm>,
    @InjectModel(SurveyjsResponse.name)
    private surveyjsResponseModel: Model<SurveyjsResponse>,
    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
    private readonly configService: ConfigService,
    private readonly melpService: MelpService,
  ) {}

  async createFormStructure(addSurveyFormDto: AddSurveyFormDto, user) {
    Logger.debug('SurveyjsServiceService.createFormStructure');
    console.log('user = ', user);
    let instituteName;
    if (user.networkId) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.partnerId) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    } else {
      instituteName = CapnetEnum.CAPNET;
    }
    console.log('instituteName = ', instituteName);
    const createdFormStructure = await this.surveyjsFormModel.create({
      ...addSurveyFormDto,
      surveyjsFormId: uuidv4(),
      instituteName,
      networkId: user.networkId,
      partnerId: user.partnerId,
      createdBy: user._id,
      updatedBy: user._id,
    });

    const url = `${this.configService.get('APP_URL')}/surveyJsForm/${
      createdFormStructure.surveyjsFormId
    }`;

    await this.surveyjsFormModel
      .findOneAndUpdate(
        {
          surveyjsFormId: createdFormStructure.surveyjsFormId,
          isDeleted: false,
        },
        { link: url },
        { new: true },
      )
      .exec();
    await this.melpService.addActivityLog(
      user,
      `Survey Form - ${createdFormStructure.surveyjsFormId} created.`,
    );

    return {
      createdFormStructure,
      url,
    };
  }

  async getAllFormStructures(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
  ) {
    Logger.debug('SurveyjsServiceService.getAllFormStructures');
    const regex = new RegExp(searchKeyword, 'i');
    const gotData = await this.surveyjsFormModel
      .find({
        // isDeleted: false,

        $and: [
          {
            isDeleted: false,
          },
          {
            $or: [{ surveyjsFormName: regex }],
          },
        ],
      })
      .skip(pageIndex * pageSize)
      .limit(pageSize)
      // .sort(sortQuery)
      .exec();
    console.log('gotData = ', gotData);

    const total = (
      await this.surveyjsFormModel
        .find({
          // isDeleted: false,

          $and: [
            {
              isDeleted: false,
            },
            {
              $or: [{ surveyjsFormName: regex }],
            },
          ],
        })
        .exec()
    ).length;

    return { formList: gotData, total: Math.ceil(total / 10) };

    // return gotData;
  }

  async getAllPublishedFormStructures() {
    Logger.debug('SurveyjsServiceService.getAllPublishedFormStructures');
    return this.surveyjsFormModel
      .find({ isActive: true, isDelete: false })
      .exec();
  }

  async publishFormStructures(formId: string, isPublished: boolean) {
    Logger.debug('SurveyjsServiceService.publishFormStructures');

    console.log('formId in service = ', formId, isPublished);
    return this.surveyjsFormModel.findOneAndUpdate(
      { surveyjsFormId: formId, isDeleted: false },
      { isActive: isPublished, isDirty: true },
      { new: true },
    );
  }

  /**Validate if form is published(active) or not */
  async validatePublishedForm(formId: string) {
    Logger.debug('SurveyjsServiceService.validatePublishedForm');

    const foundFormData = await this.surveyjsFormModel
      .findOne({
        surveyjsFormId: formId,
        isDeleted: false,
      })
      .exec();

    if (foundFormData && foundFormData.isActive === false)
      throw new UnprocessableEntityException(errorMessages.SURVEY_DEACTIVATED);
    else return foundFormData;
  }

  async editSurveyFormDto(
    formId: string,
    editSurveyFormDto: EditSurveyFormDto,
    user,
  ) {
    Logger.debug('SurveyjsService.editSurveyFormDto');

    const foundFormData = await this.surveyjsFormModel
      .findOne({
        surveyjsFormId: formId,
        isDeleted: false,
        isDirty: false,
      })
      .exec();
    if (!foundFormData)
      throw new NotFoundException(errorMessages.SURVEY_NOT_FOUND);

    const updatedReport = await this.surveyjsFormModel
      .findOneAndUpdate(
        { surveyjsFormId: formId, isDeleted: false, isDirty: false },
        editSurveyFormDto,
        { new: true },
      )
      .exec();
    await this.melpService.addActivityLog(
      user,
      `Survey Form - ${updatedReport.surveyjsFormId} has been updated.`,
    );

    return updatedReport;
  }

  /**APIs for Survey JS Responses */
  async addFormResponse(addFormValueDto) {
    const foundForm = await this.surveyjsFormModel
      .findOne({
        surveyjsFormId: addFormValueDto.surveyjsFormId,
        isDeleted: false,
        isActive: true,
      })
      .exec();
    if (!foundForm)
      throw new BadRequestException(errorMessages.SURVEY_DEACTIVATED);

    const createdFormResponse = new this.surveyjsResponseModel(addFormValueDto);
    return createdFormResponse.save();
  }

  async getFormResponse() {
    const foundData = await this.surveyjsResponseModel.find().exec();
    console.log('foundData = ', foundData);

    return foundData;
  }
}
