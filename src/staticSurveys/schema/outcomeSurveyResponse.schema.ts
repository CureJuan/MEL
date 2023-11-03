import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { TypeOfInstitution } from '../../common/staticSchema/typeOfInstitution.schema';
import { Gender } from '../../common/staticSchema/gender.schema';
import { AgeGroup } from '../../common/staticSchema/ageGroup.schema';
import { OutcomeSurveyForm } from './outcomeSurveyForm.schema';

@Schema()
export class OutcomeSurveyResponse {
  @Prop()
  outcomeSurveyResponseId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: OutcomeSurveyForm.name })
  outcomeSurveyFormId: Types.ObjectId;

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

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Country' })
  countryId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: TypeOfInstitution.name,
    required: true,
  })
  institutionTypeId: Types.ObjectId;

  @Prop({ required: true })
  orgainsation: string;

  @Prop()
  knowledgeSharing: KnowledgeSharing[];

  @Prop()
  knowledgeApplication: string;

  @Prop()
  knowledgeApplicationExplaination: string;

  @Prop()
  isRelevantChange: boolean;

  @Prop()
  elaborateChange: string;

  @Prop()
  typeOfInstitutionInvolved: string;

  @Prop()
  locationOfChange: string;

  @Prop()
  isStoryOfChange: boolean;

  @Prop({ required: true })
  comments: string;
}

export const OutcomeSurveyResponseSchema = SchemaFactory.createForClass(
  OutcomeSurveyResponse,
);

export interface KnowledgeSharing {
  key: string;
  value: boolean;
}
