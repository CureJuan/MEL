import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { FileUploadDTO } from '../../reports/schema/outputReport.schema';

export class AddAdditionalInfoDTO {
  @IsOptional()
  @ApiProperty()
  addtionalInfo: FileUploadDTO;

  @IsOptional()
  @ApiProperty()
  additionalComments: string;
}
