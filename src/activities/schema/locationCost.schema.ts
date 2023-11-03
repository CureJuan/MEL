import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Financial } from './financial.schema';

@Schema()
export class LocationCost extends Financial {
  @Prop()
  locationCostId: string;

  @Prop()
  location: string;
}

export const LocationCostSchema = SchemaFactory.createForClass(LocationCost);
