import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Network } from '../../networks/schema/network.schema';
import { v4 as uuidv4 } from 'uuid';
import { EntrySurveyForm } from './entrySurveyForm.schema';
import { Region } from '../../common/staticSchema/region.schema';
import { ScopeOfWork } from '../../common/staticSchema/scopeOfWork.schema';
import { TypeOfInstitution } from '../../common/staticSchema/typeOfInstitution.schema';
import { Gender } from '../../common/staticSchema/gender.schema';
import { AgeGroup } from '../../common/staticSchema/ageGroup.schema';
import { Country } from '../../common/staticSchema/country.schema';

@Schema()
export class EntrySurveyResponse {
  @Prop({ default: uuidv4() })
  entrySurveyResponseId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: EntrySurveyForm.name })
  entrySurveyFormId: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Gender.name, required: true })
  genderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: AgeGroup.name, required: true })
  ageGroupId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Region.name, required: true })
  regionId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Country.name })
  countryId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: ScopeOfWork.name, required: true })
  scopeOfWorkId: Types.ObjectId;

  // @Prop()
  // scopeOfWork: string;
  @Prop()
  influenceType: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Network.name, default: null })
  networkId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: TypeOfInstitution.name,
    required: true,
  })
  institutionTypeId: Types.ObjectId;

  @Prop({ required: true })
  orgainsationName: string;

  @Prop({ required: true })
  knowledgeRating: string;

  @Prop()
  courseObjectives: CourseObjectives[];

  @Prop({ required: true })
  mainMotivation: string;
}

export const EntrySurveyResponseSchema =
  SchemaFactory.createForClass(EntrySurveyResponse);

export interface CourseObjectives {
  key: string;
  value: boolean;
}
