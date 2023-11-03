import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ActivityThematicAreas {
  @Prop()
  thematicAreaName: string;
}

export const ActivityThematicAreasSchema = SchemaFactory.createForClass(
  ActivityThematicAreas,
);
