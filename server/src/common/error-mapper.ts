/**
 * 증권사 API 에러 메시지를 사용자 친화적 메시지로 변환.
 * 구체적 코드 → 포괄 키워드 순으로 매칭.
 */

const COMMON_ERRORS: [RegExp, string][] = [
  [/ETIMEDOUT|timeout/i, 'API 서버 응답 시간 초과'],
  [/ECONNREFUSED/, 'API 서버 연결 실패'],
  [/ENOTFOUND/, 'API 서버를 찾을 수 없습니다'],
];

const KIS_ERRORS: [RegExp, string][] = [
  [/EGW00103/, '유효하지 않은 앱키입니다'],
  [/EGW00105/, '유효하지 않은 앱시크릿입니다'],
  [/EGW00121/, '유효하지 않은 토큰입니다'],
  [/EGW00123/, '토큰이 만료되었습니다'],
  [/EGW00201/, '초당 거래건수를 초과했습니다'],
  [/EGW00206/, 'API 사용 권한이 없습니다'],
  [/EGW00207/, 'IP 주소가 유효하지 않습니다'],
  [/EGW00304/, '앱시크릿(personalSeckey)이 유효하지 않습니다'],
  [/status.?code.{0,5}403|HTTP 403|status 403/, '인증 실패 — 앱키를 확인해주세요'],
];

const KIWOOM_ERRORS: [RegExp, string][] = [
  [/\b8050\b.*단말기|단말기.*\b8050\b/, '단말기 IP 등록이 필요합니다'],
  [/\b8020\b/, '앱키가 만료되었습니다'],
  [/return_code.{0,3}[^0].*인증/, '인증 실패 — 앱키/시크릿을 확인해주세요'],
];

export function friendlyError(message: string, broker: string): string {
  // 공통 에러 먼저
  for (const [pattern, msg] of COMMON_ERRORS) {
    if (pattern.test(message)) return msg;
  }

  // 브로커별 에러
  const brokerErrors = broker === 'kiwoom' ? KIWOOM_ERRORS : KIS_ERRORS;
  const prefix = broker === 'kiwoom' ? '키움' : 'KIS';

  for (const [pattern, msg] of brokerErrors) {
    if (pattern.test(message)) return `${prefix} ${msg}`;
  }

  return message;
}
