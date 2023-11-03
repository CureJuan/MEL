import { PartialType } from '@nestjs/swagger';
import { CreateAnnualReportDTO } from './createAnnualReport.dto';

export class EditAnnualReportDTO extends PartialType(CreateAnnualReportDTO) {}
