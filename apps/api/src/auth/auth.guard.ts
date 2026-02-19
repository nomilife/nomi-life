import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

export const USER_ID_KEY = 'userId';

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(private reflector: Reflector) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase config missing');
    this.supabase = createClient(url, key);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing or invalid token');

    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Invalid or expired token');

    (request as unknown as Record<string, unknown>)[USER_ID_KEY] = user.id;
    return true;
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7).trim() || null;
  }
}
