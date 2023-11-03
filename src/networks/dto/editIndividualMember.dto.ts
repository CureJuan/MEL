import { PartialType } from '@nestjs/swagger';
import { AddIndividualMembersDto } from './addIndividualMembers.dto';

export class EditIndividualMemberDTO extends PartialType(
  AddIndividualMembersDto,
) {}
