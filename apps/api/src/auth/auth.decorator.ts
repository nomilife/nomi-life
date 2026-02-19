import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { USER_ID_KEY } from './auth.guard';

export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request[USER_ID_KEY];
    if (!userId) throw new Error('Auth guard must run before UserId decorator');
    return userId;
  },
);
