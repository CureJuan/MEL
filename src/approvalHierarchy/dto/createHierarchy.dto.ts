import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';
import { ApprovalTypeEnum } from '../enum/approvalTypes.enum';

export class CreateHierarchyDto {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @IsEnum(ApprovalTypeEnum, { message: 'Enter valid approval type' })
  approvalTypeName: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ApiProperty()
  createHierarchy: HierarchyLevel[];
}
export default CreateHierarchyDto;

interface HierarchyLevel {
  hierarchyLevel: number;
  userId: string;
}
