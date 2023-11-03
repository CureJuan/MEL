import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Financial } from './financial.schema';

@Schema()
export class CoordinationCost extends Financial {
  @Prop()
  coordinationCostId: string;

  @Prop()
  coordination: string;
}

export const CoordinationCostSchema =
  SchemaFactory.createForClass(CoordinationCost);
