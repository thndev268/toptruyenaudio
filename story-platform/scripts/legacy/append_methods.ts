import * as fs from 'fs';
const file = 'story-platform/backend/src/modules/listening/listening.service.ts';
let content = fs.readFileSync(file, 'utf8');

const methods = `

  async getListeningProgress(userId: string) {
    return this.progressModel.find({ userId }).exec();
  }

  async getListeningProgressByChapter(userId: string, chapterId: string) {
    return this.progressModel.findOne({ userId, chapterId }).exec();
  }

  async upsertListeningProgress(userId: string, chapterId: string, dto: UpsertListeningProgressDto) {
    let progressPercent = 0;
    if (dto.durationSeconds > 0) {
      progressPercent = (dto.positionSeconds / dto.durationSeconds) * 100;
    }
    if (progressPercent > 100) progressPercent = 100;
    if (progressPercent < 0) progressPercent = 0;

    const remainingSeconds = dto.durationSeconds - dto.positionSeconds;
    const isCompleted = dto.completed || (dto.durationSeconds > 0 && (remainingSeconds <= 15 || progressPercent >= 95));

    return this.progressModel.findOneAndUpdate(
      { userId, chapterId },
      {
        userId,
        chapterId,
        storyId: dto.storyId,
        positionSeconds: dto.positionSeconds,
        durationSeconds: dto.durationSeconds,
        progressPercent,
        completed: isCompleted,
        playbackMode: dto.playbackMode,
        playbackRate: dto.playbackRate,
        lastPlayedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  async deleteListeningProgress(userId: string, chapterId?: string) {
    if (chapterId) {
      return this.progressModel.deleteOne({ userId, chapterId }).exec();
    }
    return this.progressModel.deleteMany({ userId }).exec();
  }
}
`;

content = content.replace(/\n\}\s*$/, methods);
fs.writeFileSync(file, content);
