import { PartialType } from '@nestjs/swagger';
import { CreateOutcomeReportDTO } from './createOutcomeReport.dto';

export class EditOutcomeReportDTO extends PartialType(CreateOutcomeReportDTO) {}
