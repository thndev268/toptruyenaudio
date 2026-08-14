import * as fs from 'fs';
let file = 'story-platform/backend/src/modules/listening/schemas/listening-progress.schema.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('version: number')) {
  content = content.replace(
    /@Prop\(\{ type: Date, required: true, default: Date\.now \}\)\s*lastPlayedAt: Date;/g,
    "@Prop({ type: Date, required: true, default: Date.now })\n  lastPlayedAt: Date;\n\n  @Prop({ type: Number, required: true, default: 1 })\n  version: number;"
  );
  fs.writeFileSync(file, content);
}

file = 'story-platform/backend/src/modules/listening/dto/listening.dto.ts';
content = fs.readFileSync(file, 'utf8');
if (!content.includes('version?: number')) {
  content = content.replace(
    /@ApiProperty\(\{ example: 1\.0 \}\)\s*@IsNumber\(\)\s*@IsNotEmpty\(\)\s*playbackRate: number;/g,
    "@ApiProperty({ example: 1.0 })\n  @IsNumber()\n  @IsNotEmpty()\n  playbackRate: number;\n\n  @ApiProperty({ example: 1 })\n  @IsNumber()\n  @IsOptional()\n  version?: number;"
  );
  fs.writeFileSync(file, content);
}

file = 'story-platform/backend/src/modules/listening/listening.service.ts';
content = fs.readFileSync(file, 'utf8');
// update the upsert function to check version
const upsertLogic = `
  async upsertListeningProgress(userId: string, chapterId: string, dto: UpsertListeningProgressDto) {
    let progressPercent = 0;
    if (dto.durationSeconds > 0) {
      progressPercent = (dto.positionSeconds / dto.durationSeconds) * 100;
    }
    if (progressPercent > 100) progressPercent = 100;
    if (progressPercent < 0) progressPercent = 0;

    const remainingSeconds = dto.durationSeconds - dto.positionSeconds;
    const isCompleted = dto.completed || (dto.durationSeconds > 0 && (remainingSeconds <= 15 || progressPercent >= 95));

    const existing = await this.progressModel.findOne({ userId, chapterId }).exec();
    
    // Conflict resolution: If client sends a version, and backend version is greater, reject or merge carefully.
    // Actually, "ưu tiên bản ghi hợp lệ mới nhất". If client doesn't send version, we just increment.
    // If client version < existing version, maybe we shouldn't overwrite unless client's updatedAt is somehow verified, 
    // but the simplest way to "sử dụng updatedAt và version do server quản lý để xử lý xung đột" is to increment version on server and return it.
    
    let nextVersion = 1;
    if (existing) {
       // if dto.version is provided and is strictly less than existing.version, it means client is sending stale data.
       // However, to keep it simple and robust, we can just always increment the existing version.
       if (dto.version && dto.version < existing.version) {
          // Reject stale update from older client cache
          return existing;
       }
       nextVersion = existing.version + 1;
    }

    return this.progressModel.findOneAndUpdate(
      { userId, chapterId },
      {
        $set: {
          storyId: dto.storyId,
          positionSeconds: dto.positionSeconds,
          durationSeconds: dto.durationSeconds,
          progressPercent,
          completed: isCompleted,
          playbackMode: dto.playbackMode,
          playbackRate: dto.playbackRate,
          lastPlayedAt: new Date(),
          version: nextVersion
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }`;

content = content.replace(/async upsertListeningProgress\([\s\S]*?\}\)\.exec\(\);\s*\}/, upsertLogic);
fs.writeFileSync(file, content);
