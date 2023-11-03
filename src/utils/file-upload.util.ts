import { HttpException, HttpStatus } from '@nestjs/common';

export const mimetypes = [
  'csv',
  'xlsx',
  '.doc',
  '.docx',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'video/mp4',
  'audio/mpeg',
];

export const docFileFilter = (req, file, callback) => {
  if (
    (file.originalname.match(/\.(docx)$/) ||
      file.originalname.match(/\.(doc)$/) ||
      file.originalname.match(/\.(pdf)$/)) &&
    mimetypes.includes(file.mimetype)
  ) {
    console.log('inside use interceptor');
    callback(null, true);
  } else {
    console.log('file.mimetype = ', file.mimetype);
    req.fileValidationError =
      'Invalid file. Please upload correct file with valid details.';
    callback(
      new HttpException(
        'Invalid file. Please upload correct file with valid details.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
      false,
    );
  }
};
