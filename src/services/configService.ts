import { companyImagesService } from "./config/companyImages.service";
import { courtsService } from "./config/courts.service";
import { slotsService } from "./config/slots.service";
import { penaltiesService } from "./config/penalties.service";
import { botAutomationService } from "./config/botAutomation.service";
import { whatsappService } from "./config/whatsapp.service";
import { clubClosuresService } from "./config/clubClosures.service";

export type { CompanyImage, DigestBackground } from "./config/parsers";

export const configService = {
  ...companyImagesService,
  ...courtsService,
  ...slotsService,
  ...penaltiesService,
  ...botAutomationService,
  ...whatsappService,
  ...clubClosuresService,
};