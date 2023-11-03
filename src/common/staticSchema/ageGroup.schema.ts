import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class AgeGroup {
  @Prop()
  ageGroup: string;

  @Prop()
  translationKey: string;
}
export const AgeGroupSchema = SchemaFactory.createForClass(AgeGroup);
