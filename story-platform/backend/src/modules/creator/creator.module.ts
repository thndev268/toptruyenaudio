import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { CreatorApplication, CreatorApplicationSchema } from './schemas/creator-application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreatorApplication.name, schema: CreatorApplicationSchema },
    ]),
  ],
  controllers: [CreatorController],
  providers: [CreatorService],
  exports: [CreatorService],
})
export class CreatorModule {}
