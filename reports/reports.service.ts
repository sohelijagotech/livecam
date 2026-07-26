import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportTargetType } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Report) private reportRepo: Repository<Report>) {}

  create(reporterId: string, targetType: ReportTargetType, targetId: string, reason: string, details?: string) {
    const report = this.reportRepo.create({
      reporter: { id: reporterId } as any,
      targetType,
      targetId,
      reason,
      details,
    });
    return this.reportRepo.save(report);
  }

  // --- Admin moderation queue ---

  listPending() {
    return this.reportRepo.find({
      where: { status: ReportStatus.PENDING },
      relations: ['reporter'],
      order: { createdAt: 'ASC' },
    });
  }

  async resolve(id: string, status: ReportStatus, adminNote?: string) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    return this.reportRepo.save(report);
  }
}
