import { PartialType } from '@nestjs/swagger';
import { CreateActivityProposalDTO } from './create-activityProposal.dto';

export class EditProposalDTO extends PartialType(CreateActivityProposalDTO) {}
