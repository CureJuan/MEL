import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSurveyForm } from './baseSurveyForm.schema';

@Schema({
  timestamps: true,
})
export class ExitSurveyForm extends BaseSurveyForm {
  @Prop()
  exitSurveyFormId: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const ExitSurveyFormSchema =
  SchemaFactory.createForClass(ExitSurveyForm);
