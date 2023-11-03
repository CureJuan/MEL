import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Financial } from './financial.schema';

@Schema()
export class TravelCost extends Financial {
  @Prop()
  travelCostId: string;

  @Prop()
  travel: string;
}

export const TravelCostSchema = SchemaFactory.createForClass(TravelCost);
