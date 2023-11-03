import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: ' The min length of password is 8 ' })
  @Matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/, {
    message:
      'Password must be minimum 8 chararcter long with 1 numeric value, 1 special character, 1 upper and 1 lower case.',
  })
  @ApiProperty()
  password: string;
}

export default SetPasswordDto;
