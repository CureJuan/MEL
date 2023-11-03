import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEmail,
} from 'class-validator';

export class LogInDto {
  @Transform(({ value }) => value.trim())
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: ' The min length of password is 8 ' })
  @Matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/, {
    message:
      'A password at least contains one numeric digit, one uppercase char and one lowercase char',
  })
  @ApiProperty()
  password: string;
}

export default LogInDto;
