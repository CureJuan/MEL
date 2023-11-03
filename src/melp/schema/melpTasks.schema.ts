import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class MelpTasks extends Document {
  @Prop({ required: true })
  taskName: string;
}
export const MelpTasksSchema = SchemaFactory.createForClass(MelpTasks);
