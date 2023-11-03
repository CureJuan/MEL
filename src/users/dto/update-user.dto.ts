import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @IsEmail()
  @ApiProperty({
    description: 'example : john.doe@gmail.com',
  })
  email: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(2, { message: 'Name length must be between 2-20 characters.' })
  @MaxLength(20, { message: 'Name length must be between 2-20 characters.' })
  @Matches(/^[a-zA-Z\s ]{2,20}$/, {
    message: 'Name must contain alphabets only. ',
  })
  @ApiProperty({
    description: 'example : John Doe',
  })
  fullName: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @Matches(/^[a-zA-Z\s ]*$/, {
    message: 'Position must contain alphabets only.',
  })
  @ApiProperty({
    description: 'example : Admin',
  })
  position: string;
}
