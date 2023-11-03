import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class CourseMainObjectives {
  @Prop()
  objective: string;

  @Prop()
  translationKey: string;
}
export const CourseMainObjectivesSchema =
  SchemaFactory.createForClass(CourseMainObjectives);
