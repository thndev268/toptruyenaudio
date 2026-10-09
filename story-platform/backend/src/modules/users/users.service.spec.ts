import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { UserProfile } from './schemas/user-profile.schema';
import { UserSubscription } from '../subscriptions/schemas/user-subscription.schema';
import { RefreshSession } from '../auth/schemas/refresh-session.schema';
import { PasswordHasherService } from '../../common/services/password-hasher.service';
import { AccountRole, AccountStatus, MembershipTier, SubscriptionStatus } from '../../common/enums';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: any;
  let subscriptionModelMock: any;
  let refreshSessionModelMock: any;
  let passwordHasherMock: any;

  beforeEach(async () => {
    userModelMock = {
      findById: jest.fn<any>(),
      findOne: jest.fn<any>(),
      save: jest.fn<any>(),
    };

    subscriptionModelMock = {
      findOne: jest.fn<any>(),
    };

    refreshSessionModelMock = {
      updateMany: jest.fn<any>().mockResolvedValue({ modifiedCount: 1 }),
    };

    passwordHasherMock = {
      hash: jest.fn<any>().mockImplementation((pwd: any) => Promise.resolve(`$argon2id$v=19$m=65536,t=3,p=4$hashed_${pwd}`)),
      verify: jest.fn<any>().mockImplementation((pwd: any, hash: any) => Promise.resolve(hash.includes(pwd))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(UserProfile.name), useValue: {} },
        { provide: getModelToken(UserSubscription.name), useValue: subscriptionModelMock },
        { provide: getModelToken(RefreshSession.name), useValue: refreshSessionModelMock },
        { provide: PasswordHasherService, useValue: passwordHasherMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getUserProfileResponse', () => {
    it('should throw NotFoundException if user is not found', async () => {
      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });

      await expect(service.getUserProfileResponse('usr-invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user status is SUSPENDED', async () => {
      userModelMock.findById.mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue({
          _id: 'usr-123',
          status: AccountStatus.SUSPENDED,
          suspendedReason: 'Vi phạm quy định',
        }),
      });

      await expect(service.getUserProfileResponse('usr-123')).rejects.toThrow(ForbiddenException);
    });

    it('should return correct UserProfileResponse for FREE user', async () => {
      const mockUser = {
        _id: 'usr-100',
        email: 'reader@example.com',
        displayName: 'Độc Giả 1',
        role: AccountRole.USER,
        status: AccountStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });
      subscriptionModelMock.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });

      const res = await service.getUserProfileResponse('usr-100');

      expect(res.id).toBe('usr-100');
      expect(res.email).toBe('reader@example.com');
      expect(res.displayName).toBe('Độc Giả 1');
      expect(res.membership.tier).toBe(MembershipTier.FREE);
      expect(res.membership.subscriptionStatus).toBe(SubscriptionStatus.NONE);
    });

    it('should return ACTIVE PREMIUM when subscription is valid and not expired', async () => {
      const mockUser = {
        _id: 'usr-200',
        email: 'premium@example.com',
        displayName: 'Thành Viên Premium',
        role: AccountRole.USER,
        status: AccountStatus.ACTIVE,
        version: 2,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockSub = {
        userId: 'usr-200',
        status: SubscriptionStatus.ACTIVE,
        planId: 'PREMIUM_MONTHLY',
        startedAt: new Date(),
        expiresAt: futureDate,
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });
      subscriptionModelMock.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockSub) });

      const res = await service.getUserProfileResponse('usr-200');

      expect(res.membership.tier).toBe(MembershipTier.PREMIUM);
      expect(res.membership.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(res.membership.planId).toBe('PREMIUM_MONTHLY');
    });
  });

  describe('updateProfile', () => {
    it('should throw ConflictException on version conflict', async () => {
      const mockUser = {
        _id: 'usr-300',
        displayName: 'Name V1',
        version: 1,
        status: AccountStatus.ACTIVE,
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });

      await expect(
        service.updateProfile('usr-300', { displayName: 'Name V2', expectedVersion: 0 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update displayName and increment version', async () => {
      const mockUser = {
        _id: 'usr-300',
        email: 'user300@example.com',
        displayName: 'Tên Cũ',
        role: AccountRole.USER,
        status: AccountStatus.ACTIVE,
        version: 1,
        save: jest.fn<any>().mockResolvedValue(true),
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });
      subscriptionModelMock.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });

      const res = await service.updateProfile('usr-300', { displayName: 'Tên Mới' });

      expect(mockUser.displayName).toBe('Tên Mới');
      expect(mockUser.version).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException if current password is wrong', async () => {
      const mockUser = {
        _id: 'usr-400',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hashed_Secret123',
        status: AccountStatus.ACTIVE,
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });
      passwordHasherMock.verify.mockResolvedValueOnce(false); // current password check fails

      await expect(
        service.changePassword('usr-400', {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully update password with Argon2id and revoke sessions', async () => {
      const mockUser = {
        _id: 'usr-400',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hashed_OldPass123',
        status: AccountStatus.ACTIVE,
        version: 1,
        save: jest.fn<any>().mockResolvedValue(true),
      };

      userModelMock.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockUser) });
      passwordHasherMock.verify
        .mockResolvedValueOnce(true) // current password matches
        .mockResolvedValueOnce(false); // new password is not same as current

      const result = await service.changePassword('usr-400', {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456!',
      });

      expect(mockUser.passwordHash).toContain('hashed_NewPass456!');
      expect(mockUser.version).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
      expect(refreshSessionModelMock.updateMany).toHaveBeenCalledWith(
        { userId: 'usr-400', isRevoked: false },
        expect.objectContaining({ isRevoked: true, revokedReason: 'PASSWORD_CHANGED' }),
      );
      expect(result.message).toContain('Đổi mật khẩu thành công');
    });
  });
});
