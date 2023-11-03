import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSurveyForm } from './baseSurveyForm.schema';

@Schema({
  timestamps: true,
})
export class OutcomeSurveyForm extends BaseSurveyForm {
  @Prop()
  outcomeSurveyFormId: string;

  @Prop({ default: null })
  closedAt: Date;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const OutcomeSurveyFormSchema =
  SchemaFactory.createForClass(OutcomeSurveyForm);
