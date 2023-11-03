import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Region {
  @Prop()
  region: string;

  @Prop()
  translationKey: string;
}

export const RegionSchema = SchemaFactory.createForClass(Region);
