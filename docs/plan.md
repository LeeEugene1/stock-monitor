# 실시간 주식 모니터링 웹앱

## Context
한국 주식(KRX) + 해외지수(S&P 500, 나스닥 등) 실시간 가격을 모니터링하는 웹 애플리케이션을 구축한다. 네이버 금융 웹스크레핑 및 API로 데이터를 수집하고, WebSocket으로 클라이언트에 실시간 전송한다. 자동매수 기능은 추후 증권사 API 연동 시 구현 예정.

## 기술 스택
- **Frontend**: React + Vite + TypeScript
- **Backend**: NestJS + TypeScript
- **스크레핑**: cheerio (HTML 파싱), axios (HTTP 요청)
- **실시간 통신**: Socket.IO (NestJS Gateway + React client)
- **스타일링**: CSS Modules 또는 Tailwind CSS

## 프로젝트 구조

```
~/stock-monitor/
├── client/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # 메인 대시보드
│   │   │   ├── StockCard.tsx        # 개별 종목 카드
│   │   │   ├── StockSearch.tsx      # 종목 검색
│   │   │   └── WatchList.tsx        # 관심종목 목록
│   │   ├── hooks/
│   │   │   └── useSocket.ts         # Socket.IO 커스텀 훅
│   │   ├── types/
│   │   │   └── stock.ts             # 공통 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                  # NestJS
│   ├── src/
│   │   ├── stock/
│   │   │   ├── stock.module.ts
│   │   │   ├── stock.controller.ts  # REST API (종목 검색)
│   │   │   ├── stock.service.ts     # 스크레핑 로직
│   │   │   └── stock.gateway.ts     # WebSocket Gateway
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 구현 계획

### Step 1: 프로젝트 초기 설정
- `~/stock-monitor/client/` — Vite + React + TypeScript 프로젝트 생성
- `~/stock-monitor/server/` — NestJS 프로젝트 생성
- 필요 패키지 설치:
  - server: `axios`, `cheerio`, `@nestjs/websockets`, `@nestjs/platform-socket.io`
  - client: `socket.io-client`

### Step 2: 백엔드 - 네이버 금융 스크레핑 서비스
- **stock.service.ts**: 핵심 스크레핑 로직
  - `getStockPrice(code: string)` — 네이버 금융 시세 페이지 스크레핑 (한국 주식)
  - `getIndexPrice(reutersCode: string)` — 네이버 증권 API로 해외지수 조회 (`https://api.stock.naver.com/index/{reutersCode}/basic`)
  - `searchStock(keyword: string)` — 네이버 자동완성 API (`https://ac.stock.naver.com/ac`)로 검색. `target=stock`(국내주식) + `target=index`(해외지수) 병렬 검색
  - 반환 데이터 형태:
    ```ts
    interface StockPrice {
      code: string;        // 종목코드 (e.g. "005930") 또는 로이터코드 (e.g. ".INX")
      name: string;        // 종목명 (e.g. "삼성전자", "S&P 500")
      price: number;       // 현재가
      change: number;      // 전일대비
      changeRate: string;  // 등락률
      volume: number;      // 거래량
      high: number;        // 고가
      low: number;         // 저가
      updatedAt: string;   // 조회 시간
      category: 'stock' | 'index';  // 국내주식 vs 해외지수
    }
    ```
  - 검색 결과 타입:
    ```ts
    interface StockSearchResult {
      code: string;         // 종목코드 또는 로이터코드
      name: string;
      market: string;       // "코스피", "코스닥", "해외지수" 등
      category: 'stock' | 'index';
      reutersCode?: string; // 해외지수인 경우 (e.g. ".INX")
    }
    ```

### Step 3: 백엔드 - REST API + WebSocket Gateway
- **stock.controller.ts**: REST 엔드포인트
  - `GET /api/stock/search?q=삼성` — 종목+지수 통합 검색
  - `GET /api/stock/:code` — 단일 종목 조회
  - `GET /api/index/:reutersCode` — 해외지수 조회
- **stock.gateway.ts**: WebSocket Gateway
  - 클라이언트가 `subscribe` 이벤트로 `{code, category}[]` 전송
  - 서버가 주기적(5초)으로 국내주식은 스크레핑, 해외지수는 API 호출 후 `stockUpdate` 이벤트로 push
  - `unsubscribe`로 구독 해제

### Step 4: 프론트엔드 - 대시보드 UI
- **StockSearch.tsx**: 종목 검색 입력 → REST API 호출 → 결과 목록 표시 → 클릭 시 관심종목 추가
- **WatchList.tsx**: 관심종목 목록 관리 (추가/삭제), localStorage에 저장
- **StockCard.tsx**: 종목별 카드 — 종목명, 현재가, 등락률(빨강/파랑), 거래량 표시. 가격 변동 시 깜빡임 애니메이션
- **Dashboard.tsx**: 전체 레이아웃 조합
- **useSocket.ts**: Socket.IO 연결, subscribe/unsubscribe 관리, 실시간 데이터 상태 관리

## 핵심 플로우

```
[사용자] 종목 검색 → [React] REST GET /api/stock/search
  → 서버에서 target=stock + target=index 병렬 검색 후 통합 결과 반환
[사용자] 관심종목 추가 → [React] socket.emit('subscribe', [{code:'005930', category:'stock'}, {code:'.INX', category:'index'}])
[NestJS] 5초마다:
  - 국내주식: 네이버 금융 HTML 스크레핑 (finance.naver.com)
  - 해외지수: 네이버 증권 API 호출 (api.stock.naver.com/index/{code}/basic)
  → socket.emit('stockUpdate', data[])
[React] 실시간 가격 업데이트 렌더링
```

### Step 5: 52주 고점 대비 등락률 표시
52주 최고가/최저가를 가져와 현재가 대비 몇% 하락(또는 상승)했는지 표시한다.

**백엔드 (`stock.service.ts`)**
- `StockPrice` 인터페이스에 `high52w`, `low52w` 필드 추가
- 국내주식: HTML에서 `52주최고|최저` 행의 `<em>` 태그 2개 파싱
  ```html
  <th>52주최고<span class="bar">l</span>최저</th>
  <td><em>223,000</em><span class="bar">l</span><em>52,900</em></td>
  ```
- 해외지수: 기존 `stockItemTotalInfos`에서 `highPriceOf52Weeks`, `lowPriceOf52Weeks` 추출 (이미 API 응답에 존재)

**프론트엔드 (`StockCard.tsx`)**
- 52주 고점 대비 등락률 계산: `((price - high52w) / high52w * 100).toFixed(2)%`
- 카드에 "고점대비 -20.1%" 또는 "고점대비 +5.3%" 표시
- 하락 시 파랑, 상승 시 빨강 색상

**수정 파일:**
- `server/src/stock/stock.service.ts` — 52주 고저 파싱 추가
- `client/src/types/stock.ts` — `high52w`, `low52w` 필드 추가
- `client/src/components/StockCard.tsx` — 고점대비 등락률 UI 추가

### Step 6: 한국투자증권 MCP 연동 — 자동매매
KIS Trading MCP를 연동하여 Claude에서 직접 주식 주문/조회를 수행한다.
- **설치/설정 가이드**: https://github.com/koreainvestment/open-trading-api/tree/main/MCP/Kis%20Trading%20MCP
- 모니터링 앱에서 설정한 조건(목표가, 손절가) 도달 시 MCP를 통해 자동 주문
- Dashboard에 주문 내역/체결 상태 표시 UI 추가

## 검증 방법
1. `cd ~/stock-monitor/server && npm run start:dev` — 백엔드 실행
2. `cd ~/stock-monitor/client && npm run dev` — 프론트엔드 실행
3. 브라우저에서 종목 검색 → 관심종목 추가 → 실시간 가격 갱신 확인
4. 네이버 금융 사이트의 실제 가격과 대조하여 정확도 확인
