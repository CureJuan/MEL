import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CapnetEnum } from '../../common/enum/capnet.enum';

export type SurveyjsFormDocument = SurveyjsForm & Document;

@Schema({
  timestamps: true,
})
export class SurveyjsForm {
  @Prop()
  surveyjsFormId: string;

  @Prop({ required: true })
  surveyjsFormName: string;

  @Prop({ type: {} })
  formFieldsJson: any;

  @Prop({ default: CapnetEnum.CAPNET })
  instituteName: string;

  // @Prop()
  // language: string

  @Prop()
  link: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isDirty: boolean;

  @Prop({ default: null })
  closedAt: Date;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const SurveyjsFormSchema = SchemaFactory.createForClass(SurveyjsForm);
