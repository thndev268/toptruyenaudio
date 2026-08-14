import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { LedgerEntry, LedgerEntryDocument } from './schemas/ledger-entry.schema';
import { WithdrawalRequest, WithdrawalRequestDocument } from './schemas/withdrawal-request.schema';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntryDocument>,
    @InjectModel(WithdrawalRequest.name) private withdrawalModel: Model<WithdrawalRequestDocument>,
  ) {}

  async getMyWallet(ownerId: string) {
    return this.walletModel.findOne({ ownerId }).exec();
  }

  async requestWithdrawal(userId: string, dto: any) {
    return { status: 'PENDING', message: 'Yêu cầu rút tiền đã được tạo và chờ xét duyệt' };
  }
}
