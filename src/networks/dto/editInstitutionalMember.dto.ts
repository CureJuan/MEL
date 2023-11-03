import { PartialType } from '@nestjs/swagger';
import { AddInstitutionalMembersDto } from './addInstitutionalMembers.dto';

export class EditInstitutionalMemberDto extends PartialType(
  AddInstitutionalMembersDto,
) {}
