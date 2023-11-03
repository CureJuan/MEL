import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommonReport } from './commonReport.schema';

@Schema({
  timestamps: true,
})
export class ProgressReport extends CommonReport {
  @Prop()
  progressReportId: string;

  @Prop()
  progressReportCode: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const ProgressReportSchema =
  SchemaFactory.createForClass(ProgressReport);
