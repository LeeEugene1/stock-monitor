import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('kakao')
  kakaoLogin(@Res() res: Response) {
    const url = this.authService.getKakaoAuthUrl();
    res.redirect(url);
  }

  @Public()
  @Get('kakao/callback')
  async kakaoCallback(@Query('code') code: string, @Res() res: Response) {
    const jwt = await this.authService.handleKakaoCallback(code);
    const clientUrl = this.authService.getClientUrl();
    res.redirect(`${clientUrl}/?token=${jwt}`);
  }

  @Get('me')
  getProfile(@CurrentUser() user: { sub: number }) {
    return this.authService.getUserProfile(user.sub);
  }
}
