import { Module } from '@nestjs/common';

import { VehiclesModule } from '../vehicles/vehicles.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DiagnosisEngine } from './diagnosis.engine';

@Module({
  imports: [VehiclesModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, DiagnosisEngine],
  exports: [ChatbotService],
})
export class ChatbotModule {}
