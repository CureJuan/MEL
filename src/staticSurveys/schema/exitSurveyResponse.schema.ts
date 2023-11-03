import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AgeGroup } from 'src/common/staticSchema/ageGroup.schema';
import { Gender } from 'src/common/staticSchema/gender.schema';
import { v4 as uuidv4 } from 'uuid';
import { ExitSurveyForm } from './exitSurveyForm.schema';

@Schema()
export class ExitSurveyResponse {
  @Prop({ default: uuidv4() })
  exitSurveyResponseId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: ExitSurveyForm.name })
  exitSurveyFormId: Types.ObjectId;

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

  @Prop()
  activityCompletedInEntirety: string;

  @Prop()
  beneficiality: string;

  @Prop()
  relevance: string;

  @Prop()
  expectations: string;

  @Prop()
  degreeOfKnowledge: string;

  @Prop()
  applicationOfKnowledge: string;

  @Prop()
  valuableConcept: string;

  @Prop()
  topicsInGreaterDepth: string;

  @Prop()
  interactionWithFellowParticipants: string;

  @Prop()
  feedback: string;
}

export const ExitSurveyResponseSchema =
  SchemaFactory.createForClass(ExitSurveyResponse);
