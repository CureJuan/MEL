import { PartialType } from '@nestjs/swagger';
import { AddInvoiceDTO } from './addInvoice.dto';

export class EditInvoiceDTO extends PartialType(AddInvoiceDTO) {}
