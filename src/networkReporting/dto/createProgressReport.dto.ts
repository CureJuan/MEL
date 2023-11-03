import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { CommonReportDTO } from './commonReport.dto';

export class CreateProgressReportDTO extends CommonReportDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  progressReportCode: string;
}
