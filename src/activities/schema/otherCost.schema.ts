import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Financial } from './financial.schema';

@Schema()
export class OtherCost extends Financial {
  @Prop()
  otherCostId: string;

  @Prop()
  other: string;
}

export const OtherCostSchema = SchemaFactory.createForClass(OtherCost);
