import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class BoundaryLevelOfChange {
  @Prop()
  boundaryLevelOfChange: string;

  @Prop()
  translationKey: string;
}

export const BoundaryLevelOfChangeSchema = SchemaFactory.createForClass(
  BoundaryLevelOfChange,
);
