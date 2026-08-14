import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { PartnerApplication, PartnerApplicationSchema } from './schemas/partner-application.schema';
import { AffiliateEvent, AffiliateEventSchema } from './schemas/affiliate-event.schema';
import { Commission, CommissionSchema } from './schemas/commission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerApplication.name, schema: PartnerApplicationSchema },
      { name: AffiliateEvent.name, schema: AffiliateEventSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
  ],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
