import { AuthService } from './auth.service';
import { AccountRole, AccountStatus, MembershipTier } from '../../common/enums';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockRefreshSessionModel: any;
  let mockSubscriptionModel: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockPasswordHasher: any;
  let mockPrismaService: any;

  beforeEach(() => {
    mockUserModel = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: 'user_123',
      displayName: data?.displayName || 'Test User',
      save: jest.fn().mockResolvedValue(true),
    }));
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();

    mockRefreshSessionModel = {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
    };

    mockSubscriptionModel = {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.accessSecret') return 'test_access_secret';
        if (key === 'jwt.refreshSecret') return 'test_refresh_secret';
        return null;
      }),
    };

    mockPasswordHasher = {
      hash: jest.fn().mockImplementation(async (pw: string) => `$argon2id$v=19$m=65536,t=3,p=4$hashed_${pw}`),
      verify: jest.fn().mockImplementation(async (pw: string, hash: string) => {
        if (hash.startsWith('$2b$')) {
          return bcrypt.compare(pw, hash);
        }
        return hash.includes(pw);
      }),
      needsRehash: jest.fn().mockImplementation((hash: string) => hash.startsWith('$2b$')),
    };

    mockPrismaService = {
      profile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    authService = new AuthService(
      mockUserModel,
      mockRefreshSessionModel,
      mockSubscriptionModel,
      mockJwtService,
      mockConfigService,
      mockPasswordHasher,
      mockPrismaService,
    );
  });

  describe('bootstrapOwnerAdmin', () => {
    it('creates single OWNER_ADMIN account successfully', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const admin = await authService.bootstrapOwnerAdmin('owner@domain.com', 'SecurePass123!');

      expect(admin.role).toBe(AccountRole.OWNER_ADMIN);
      expect(admin.email).toBe('owner@domain.com');
      expect(mockSubscriptionModel.create).toHaveBeenCalled();
    });

    it('rejects creating second OWNER_ADMIN if one already exists', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ role: AccountRole.OWNER_ADMIN }),
      });

      await expect(
        authService.bootstrapOwnerAdmin('another_owner@domain.com', 'SecurePass123!'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Argon2id Transparent Migration', () => {
    it('migrates legacy Bcrypt hash to Argon2id transparently during login', async () => {
      const legacyBcryptHash = await bcrypt.hash('secret123', 10);

      const mockUserObj = {
        _id: 'user_legacy_1',
        email: 'legacy@domain.com',
        emailNormalized: 'legacy@domain.com',
        passwordHash: legacyBcryptHash,
        status: AccountStatus.ACTIVE,
        role: AccountRole.USER,
        displayName: 'Legacy User',
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserObj),
      });

      const loginResult = await authService.login({
        email: 'legacy@domain.com',
        password: 'secret123',
      });

      expect(loginResult.user.id).toBe('user_legacy_1');
      expect(mockPasswordHasher.needsRehash).toHaveBeenCalledWith(legacyBcryptHash);
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('secret123');
      expect(mockUserObj.passwordHash).toContain('$argon2id$');
      expect(mockUserObj.save).toHaveBeenCalled();
    });
  });
});
