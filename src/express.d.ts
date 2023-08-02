import { users } from '@prisma/dashboard';
import { permissionsMetadataKey } from './permissions/constants';

type RequestUser = users & {
  isAdmin: boolean;
};

declare global {
  namespace Express {
    export interface Request {
      user?: RequestUser;
      [permissionsMetadataKey]?: boolean;
    }
  }
}
