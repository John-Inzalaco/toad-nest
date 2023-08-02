import { ApiUnauthorizedResponse } from '@nestjs/swagger';

export const UnauthorizedRes = ApiUnauthorizedResponse({
  status: 401,
  schema: {
    type: 'object',
    example: { status: 401, message: 'Unauthorized' },
    properties: {
      status: { type: 'number', default: 401 },
      message: { type: 'string', default: 'Unauthorized' },
    },
  },
});
