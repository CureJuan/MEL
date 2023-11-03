import { PartialType } from '@nestjs/swagger';
import { CreateOutputReportDTO } from './createOutputReport.dto';

export class EditOutputReportDTO extends PartialType(CreateOutputReportDTO) {}
