import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSurveyForm } from './baseSurveyForm.schema';

@Schema({
  timestamps: true,
})
export class EntrySurveyForm extends BaseSurveyForm {
  @Prop()
  entrySurveyFormId: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const EntrySurveyFormSchema =
  SchemaFactory.createForClass(EntrySurveyForm);
