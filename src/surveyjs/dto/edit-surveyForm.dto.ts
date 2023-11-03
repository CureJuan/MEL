import { PartialType } from '@nestjs/swagger';
import { AddSurveyFormDto } from './add-surveyForm.dto';

export class EditSurveyFormDto extends PartialType(AddSurveyFormDto) {}
