import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../src/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { generateAuthToken } from './__helpers';
import { Reflector } from '@nestjs/core';

const makeContext = ({
  path,
  authHeader,
}: {
  path: string;
  authHeader: string | undefined;
}) => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: authHeader,
        },
        route: {
          path,
        },
      }),
    }),
    getHandler: () => () => null,
    getClass: () => null,
  } as unknown as ExecutionContext;
};

const makeUsersService = (user: { id: number; jwt_secret: string } | null) => {
  return {
    findOne: () => user,
  } as unknown as UsersService;
};

const makeAuthGuard = ({
  user,
  reflectorValues,
}: {
  user: { id: number; jwt_secret: string } | null;
  reflectorValues?: {
    skipAuth?: boolean;
    pdsHasAccess?: boolean;
    mcpHasAccess?: boolean;
  };
}) => {
  return new AuthGuard(
    new JwtService(),
    makeUsersService(user),
    new ConfigService(),
    {
      getAllAndOverride: (key: string) => {
        if (
          key !== 'skipAuth' &&
          key !== 'pdsHasAccess' &&
          key !== 'mcpHasAccess'
        ) {
          throw new Error('Unexpected key');
        }
        return reflectorValues?.[key] || false;
      },
    } as unknown as Reflector,
  );
};

const defaultUser = {
  id: 1,
  jwt_secret: '4745ea50-c4ed-40ce-9a30-51f6c61da4bb',
};

describe('AuthGuard', () => {
  it("returns true if the user's jwt_secret matches the payload jwt_secret", async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({ user });
    const authHeader = generateAuthToken(user);
    expect(
      await authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).toEqual(true);
  });

  it('throws an UnauthorizedException if there is no authorization header', async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({ user });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader: undefined }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it(`throws an UnauthorizedException if the payload jwt_secret does not match the user's jwt_secret`, async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({ user });
    const authHeader = generateAuthToken({
      ...user,
      jwt_secret: 'something_else',
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws an UnauthorizedException if the user does not exist', async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({ user: null });
    const authHeader = generateAuthToken(user);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws an UnauthorizedException if the userId is invalid', async () => {
    const user = {
      id: 'invalid-id',
      jwt_secret: '4745ea50-c4ed-40ce-9a30-51f6c61da4bb',
    };
    const authGuard = makeAuthGuard({ user: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authHeader = generateAuthToken(user as any);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns true if the user's jwt_secret matches the payload jwt_secret but the client_application_id is mcp", async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({
      user,
      reflectorValues: { mcpHasAccess: true },
    });
    const authHeader = generateAuthToken(
      {
        ...user,
        jwt_secret: 'something_else',
      },
      'mcp',
    );
    expect(
      await authGuard.canActivate(
        makeContext({ path: '/api/v1/videos', authHeader }),
      ),
    ).toEqual(true);
  });

  it('allows access to a route decorated with the PDSHasAccess decorator to specific routes if the token client_application_id is pds', async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({
      user,
      reflectorValues: { pdsHasAccess: true },
    });
    const authHeader = generateAuthToken(user, 'pds');
    expect(
      await authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).toBe(true);

    const authGuardWithoutAccess = makeAuthGuard({
      user,
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuardWithoutAccess.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows access to a route decorated with the MCPHasAccess decorator to specific routes if the token client_application_id is pds', async () => {
    const user = defaultUser;
    const authGuard = makeAuthGuard({
      user,
      reflectorValues: { mcpHasAccess: true },
    });
    const authHeader = generateAuthToken(user, 'mcp');
    expect(
      await authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).toBe(true);

    const authGuardWithoutAccess = makeAuthGuard({
      user,
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(
      authGuardWithoutAccess.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns true if the route is marked to skipAuth', async () => {
    const authGuard = makeAuthGuard({
      user: null,
      reflectorValues: { skipAuth: true },
    });
    expect(
      await authGuard.canActivate(
        makeContext({ path: '/api/v1/countries', authHeader: undefined }),
      ),
    ).toEqual(true);
  });
});
