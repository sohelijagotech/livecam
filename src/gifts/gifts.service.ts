import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Gift } from './entities/gift.entity';
import { GiftTransaction, PLATFORM_COMMISSION_RATE } from './entities/gift-transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { LiveSession } from '../live/entities/live-session.entity';
import { ChatGateway } from '../chat/chat.gateway';
import { TasksService } from '../tasks/tasks.service';
import { DailyTaskType } from '../tasks/entities/daily-task-completion.entity';

@Injectable()
export class GiftsService {
  constructor(
    @InjectRepository(Gift) private giftRepo: Repository<Gift>,
    private dataSource: DataSource,
    private chatGateway: ChatGateway,
    private tasksService: TasksService,
  ) {}

  async listGifts() {
    return this.giftRepo.find({ where: { active: true } });
  }

  // --- Admin Panel: Gift Manager ---

  listAllGifts() {
    return this.giftRepo.find();
  }

  createGift(data: Partial<Gift>) {
    return this.giftRepo.save(this.giftRepo.create(data));
  }

  async updateGift(id: string, data: Partial<Gift>) {
    const gift = await this.giftRepo.findOne({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    Object.assign(gift, data);
    return this.giftRepo.save(gift);
  }

  // Core Wallet Logic (per blueprint):
  // Coin Wallet -> Gift Sent -> Coin Reduced -> Host Diamond Increased -> Commission Recorded
  async sendGift(senderId: string, receiverId: string, giftId: string, liveSessionId?: string) {
    if (senderId === receiverId) throw new BadRequestException('Cannot send a gift to yourself');

    return this.dataSource.transaction(async (manager) => {
      const gift = await manager.findOne(Gift, { where: { id: giftId, active: true } });
      if (!gift) throw new NotFoundException('Gift not found');

      const senderWallet = await manager.findOne(Wallet, { where: { user: { id: senderId } } });
      if (!senderWallet) throw new NotFoundException('Sender wallet not found');
      if (Number(senderWallet.coinBalance) < gift.coinPrice) {
        throw new BadRequestException('Insufficient coin balance');
      }

      const receiverWallet = await manager.findOne(Wallet, { where: { user: { id: receiverId } } });
      if (!receiverWallet) throw new NotFoundException('Receiver wallet not found');

      const diamondsCredited = Math.floor(gift.coinPrice * PLATFORM_COMMISSION_RATE);

      senderWallet.coinBalance = Number(senderWallet.coinBalance) - gift.coinPrice;
      receiverWallet.diamondBalance = Number(receiverWallet.diamondBalance) + diamondsCredited;
      await manager.save(senderWallet);
      await manager.save(receiverWallet);

      await manager.save(
        manager.create(Transaction, {
          user: { id: senderId } as any,
          type: TransactionType.GIFT_SENT,
          amount: -gift.coinPrice,
          currency: 'coin',
          referenceId: giftId,
        }),
      );
      await manager.save(
        manager.create(Transaction, {
          user: { id: receiverId } as any,
          type: TransactionType.GIFT_RECEIVED,
          amount: diamondsCredited,
          currency: 'diamond',
          referenceId: giftId,
          metadata: { platformCommissionRate: PLATFORM_COMMISSION_RATE },
        }),
      );

      const giftTx = manager.create(GiftTransaction, {
        sender: { id: senderId } as any,
        receiver: { id: receiverId } as any,
        gift,
        liveSession: liveSessionId ? ({ id: liveSessionId } as any) : null,
        coinPriceAtSend: gift.coinPrice,
        diamondsCredited,
      });
      await manager.save(giftTx);

      if (liveSessionId) {
        await manager.increment(LiveSession, { id: liveSessionId }, 'totalDiamondsEarned', diamondsCredited);
        this.chatGateway.broadcastGift(liveSessionId, {
          senderId,
          receiverId,
          giftId,
          giftName: gift.name,
          animationUrl: gift.animationUrl,
        });
      }

      this.tasksService.claim(senderId, DailyTaskType.SEND_ANY_GIFT).catch(() => {
        /* already claimed today — ignore */
      });

      return { giftTx, senderCoinBalance: senderWallet.coinBalance, receiverDiamondBalance: receiverWallet.diamondBalance };
    });
  }
}
