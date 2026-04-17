import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

const OAUTH_STATE_COOKIE = 'kakao_oauth_state';
const AUTH_COOKIE = 'auth_token';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('kakao')
  kakaoLogin(@Res() res: Response) {
    const state = randomBytes(16).toString('hex');
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(this.authService.getKakaoAuthUrl(state));
  }

  @Public()
  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE);
    if (!state || !cookieState || state !== cookieState) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const jwt = await this.authService.handleKakaoCallback(code);
    res.cookie(AUTH_COOKIE, jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    res.redirect(this.authService.getClientUrl());
  }

  @Public()
  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(AUTH_COOKIE);
    res.status(204).send();
  }

  @Get('me')
  getProfile(@CurrentUser() user: { sub: number }) {
    return this.authService.getUserProfile(user.sub);
  }
}
