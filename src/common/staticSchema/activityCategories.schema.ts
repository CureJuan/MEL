import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../schema/base.schema';

@Schema({
  timestamps: true,
})
export class ActivityCategories extends Base {
  @Prop()
  categoryName: string;
}

export const ActivityCategoriesSchema =
  SchemaFactory.createForClass(ActivityCategories);
