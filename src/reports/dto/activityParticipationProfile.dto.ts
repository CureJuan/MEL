import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class GenderCountDTO {
  male: number;
  female: number;
  ratherNotSay: number;
  other: number;
}

export class InputDataDTO {
  key: string;
  value: number;
}

export class ActivityParticipationProfileDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  preEnrolled: GenderCountDTO;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  enrolled: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  completed: GenderCountDTO;
}

export class AgeGroupCountDTO {
  below18: number;
  below25: number;
  below65: number;
  above65: number;
}
