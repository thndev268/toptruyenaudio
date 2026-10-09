import { SecurityEventsService } from './security-events.service';
import { SecurityEventStatus } from '../../common/enums';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('SecurityEventsService State Machine', () => {
  let service: SecurityEventsService;
  let mockModel: any;
  let mockAuditLogs: any;

  beforeEach(() => {
    mockModel = {
      findById: jest.fn(),
    };
    mockAuditLogs = {
      log: jest.fn().mockResolvedValue({}),
    };
    service = new SecurityEventsService(mockModel, mockAuditLogs);
  });

  it('allows valid transition from NEW to INVESTIGATING', async () => {
    const mockEvent = {
      _id: 'event_123',
      title: 'Suspicious Activity',
      status: SecurityEventStatus.NEW,
      save: jest.fn().mockResolvedValue({}),
    };
    mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockEvent) });

    const result = await service.startInvestigation('event_123', 'admin_1');

    expect(mockEvent.status).toBe(SecurityEventStatus.INVESTIGATING);
    expect(mockEvent.save).toHaveBeenCalled();
  });

  it('rejects invalid transition from NEW directly to RESOLVED with 409 INVALID_STATE_TRANSITION', async () => {
    const mockEvent = {
      _id: 'event_123',
      title: 'Suspicious Activity',
      status: SecurityEventStatus.NEW,
    };
    mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockEvent) });

    await expect(
      service.resolveEvent({
        id: 'event_123',
        adminId: 'admin_1',
        status: SecurityEventStatus.RESOLVED,
        resolutionNote: 'Note',
        actionTaken: 'Blocked IP',
        reason: 'Investigation done',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires resolutionNote, actionTaken, and reason when resolving', async () => {
    await expect(
      service.resolveEvent({
        id: 'event_123',
        adminId: 'admin_1',
        status: SecurityEventStatus.RESOLVED,
        resolutionNote: '', // Empty!
        actionTaken: 'Blocked IP',
        reason: 'Investigation done',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
