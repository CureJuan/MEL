import { PartialType } from '@nestjs/swagger';
import { CreateNetworkDTO } from './create-network.dto';

export class EditNetworkNameDTO extends PartialType(CreateNetworkDTO) {}
