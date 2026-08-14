import { Global, Module } from '@nestjs/common';
import { PasswordHasherService } from './services/password-hasher.service';

@Global()
@Module({
  providers: [PasswordHasherService],
  exports: [PasswordHasherService],
})
export class CommonModule {}
