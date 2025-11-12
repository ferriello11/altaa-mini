import { cookieName, verifySession } from '../lib/jwt';
import prismaMock from './prismaMock';

jest.mock('../lib/jwt');
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
}));

describe('authSession middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;
  let authSession: any;

  beforeAll(() => {
    authSession = require('../middlewares/authSession').authSession;
  });

  beforeEach(() => {
    req = { cookies: {}, auth: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if token is missing', async () => {
    await authSession(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.cookies[cookieName] = 'fake-token';
    (verifySession as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authSession(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid token' });
  });
});
