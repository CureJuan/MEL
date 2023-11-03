import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkplanDTO {
  @IsNotEmpty()
  @ApiProperty()
  year: number;

  @IsNotEmpty()
  @ApiProperty()
  workplanCode: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // statusId: Types.ObjectId;

  // @IsNotEmpty()
  // @ApiProperty()
  // networkId: Types.ObjectId;

  // @IsNotEmpty()
  // @ApiProperty()
  // instituteName: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // partnerId: Types.ObjectId;
}
