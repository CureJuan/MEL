import { PartialType } from '@nestjs/swagger';
import { CreateProgressReportDTO } from './createProgressReport.dto';

export class EditProgressReportDTO extends PartialType(
  CreateProgressReportDTO,
) {}
