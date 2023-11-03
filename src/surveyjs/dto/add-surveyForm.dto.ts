/**In order to use validation and transformation pipes we need 2 packages:-
 * 1. class-validator
 * 2. class-transformer */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AddSurveyFormDto {
  @IsNotEmpty()
  @ApiProperty()
  formFieldsJson: any;

  @IsNotEmpty()
  @ApiProperty()
  surveyjsFormName: string;
}
