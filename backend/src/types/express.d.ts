import { Membership, Role, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: User;
        activeCompanyId: string | null;
        membership?: Membership | null;
      }
    }
  }
}
