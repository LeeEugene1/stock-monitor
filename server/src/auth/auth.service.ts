import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly kakaoClientId: string;
  private readonly kakaoRedirectUri: string;
  private readonly clientUrl: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.kakaoClientId = this.configService.get<string>('KAKAO_CLIENT_ID', '');
    this.kakaoRedirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI', '');
    this.clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
  }

  getKakaoAuthUrl(): string {
    return (
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${this.kakaoClientId}` +
      `&redirect_uri=${encodeURIComponent(this.kakaoRedirectUri)}` +
      `&response_type=code`
    );
  }

  getClientUrl(): string {
    return this.clientUrl;
  }

  async handleKakaoCallback(code: string): Promise<string> {
    // 1. 인가 코드로 토큰 교환
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.kakaoClientId,
        redirect_uri: this.kakaoRedirectUri,
        code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const accessToken = tokenRes.data.access_token;

    // 2. 카카오 프로필 조회
    const profileRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const kakaoUser = profileRes.data;
    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname ?? '사용자';
    const profileImage = kakaoUser.properties?.profile_image ?? null;
    const email = kakaoUser.kakao_account?.email ?? null;

    // 3. User upsert
    const user = await this.findOrCreateUser(kakaoId, nickname, profileImage, email);

    // 4. JWT 서명
    return this.jwtService.sign({ sub: user.id, kakaoId: user.kakaoId });
  }

  private async findOrCreateUser(
    kakaoId: number,
    nickname: string,
    profileImage: string | null,
    email: string | null,
  ): Promise<User> {
    let user = await this.userRepo.findOneBy({ kakaoId });
    if (user) {
      user.nickname = nickname;
      user.profileImage = profileImage;
      user.email = email;
      return this.userRepo.save(user);
    }
    return this.userRepo.save(
      this.userRepo.create({ kakaoId, nickname, profileImage, email }),
    );
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      nickname: user.nickname,
      profileImage: user.profileImage,
      email: user.email,
    };
  }
}
