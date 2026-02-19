import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (): SupabaseClient => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
        }
        return createClient(url, key);
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
