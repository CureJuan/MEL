import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Modality {
  @Prop()
  modalityName: string;

  @Prop()
  translationKey: string;
}

export const ModalitySchema = SchemaFactory.createForClass(Modality);
