# 프로젝트 현황

## 구조
- `client/` — React + Vite + TypeScript (포트 5173)
- `server/` — NestJS (포트 3001)
- `mcp/kis-trading/` — 한국투자증권 KIS Trading MCP (Docker, 포트 3000)

## 완료
- 국내주식 + 해외지수 검색 (네이버 금융 자동완성 API)
- 실시간 가격 모니터링 (WebSocket, 5초 간격)
- 관심종목 관리 (localStorage)
- 52주 고점대비 등락률
- KIS Trading MCP Docker 빌드 및 Claude Code 연결
- 캔들차트 + 거래량 시각화 (lightweight-charts, 1M/3M/6M/1Y 기간 선택)

## KIS 계좌
- Docker: `docker start kis-trade-mcp`
- MCP 등록: `claude mcp add kis-trade-mcp --transport sse http://localhost:3000/sse -s user`

## 실행 방법
```bash
cd ~/Desktop/stock-monitor/server && npm run start:dev   # 백엔드
cd ~/Desktop/stock-monitor/client && npm run dev          # 프론트엔드
docker start kis-trade-mcp                                # KIS MCP
```

## 남은 작업
- 자동매수 기능 (KIS API 연동)
- 두 번째 계좌 추가
