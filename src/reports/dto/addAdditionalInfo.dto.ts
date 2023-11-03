import { ApiProperty } from '@nestjs/swagger';
import { FileUploadDTO } from '../schema/outputReport.schema';

export class AddAdditionalInfoDTO {
  @ApiProperty()
  additionalInfoFile: FileUploadDTO;

  @ApiProperty()
  additionalComment: string;
}
