import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AddMelProgressSRFDTO {
  @IsArray()
  @ApiProperty()
  indicatorMonitorings: IndicatorMonitorings[];
}

interface IndicatorMonitorings {
  indicatorMonitoringId: string;
  baseline: string;
}
