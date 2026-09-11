// ============================================
// WHAT THIS FILE DOES (plain English):
// Nest wiring for Phase 1 crypto stubs. Validates split lockboxes when both DEK
// and phone HMAC env are present. Does not encrypt production rows yet.
// ============================================
import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateCryptoSecretSeparation } from './crypto-config';
import { ENV_PHONE_LOOKUP_HMAC_KEY, ENV_PLATFORM_PII_KMS_KEY_ID } from './crypto.constants';
import { EnvelopeEncryptorService } from './envelope-encryptor.service';
import { FakeKmsClient } from './fake-kms.client';
import { PhoneHmacLookupService } from './phone-hmac-lookup.service';

export const ENVELOPE_ENCRYPTOR = 'ENVELOPE_ENCRYPTOR';
export const PHONE_HMAC_LOOKUP = 'PHONE_HMAC_LOOKUP';

@Global()
@Module({
  providers: [
    {
      provide: ENVELOPE_ENCRYPTOR,
      useFactory: (config: ConfigService) => {
        const kmsKeyId = config.get<string>(ENV_PLATFORM_PII_KMS_KEY_ID) || 'stub-kms-key';
        const kms = new FakeKmsClient('production-stub-seed-not-for-real-data');
        return EnvelopeEncryptorService.fromKms(kms, kmsKeyId, 1);
      },
      inject: [ConfigService]
    },
    {
      provide: PHONE_HMAC_LOOKUP,
      useFactory: (config: ConfigService) => {
        const key = config.get<string>(ENV_PHONE_LOOKUP_HMAC_KEY);
        if (!key?.trim()) {
          return null;
        }
        return new PhoneHmacLookupService(key);
      },
      inject: [ConfigService]
    }
  ],
  exports: [ENVELOPE_ENCRYPTOR, PHONE_HMAC_LOOKUP]
})
export class CryptoModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    validateCryptoSecretSeparation(process.env);
  }
}
