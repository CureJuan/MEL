import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CapnetUserDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: 'example : john.doe@gmail.com',
  })
  email: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(2, { message: 'Name length must be between 2-20 characters.' })
  @MaxLength(20, { message: 'Name length must be between 2-20 characters.' })
  @Matches(/^[a-zA-Z\s ]{2,20}$/, {
    message: 'Name must contain alphabets only. ',
  })
  @ApiProperty({
    type: String,
    description: 'example : John Doe',
  })
  fullName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s ]*$/, {
    message: 'Position must contain alphabets only.',
  })
  @ApiProperty({
    type: String,
    description: 'Example: Admin',
  })
  position: string;
}
