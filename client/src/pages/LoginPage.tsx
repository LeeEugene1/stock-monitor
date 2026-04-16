import './LoginPage.css';

export function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = '/api/auth/kakao';
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Stock Monitor</h1>
        <p>주식 실시간 모니터링</p>
        <button className="kakao-btn" onClick={handleKakaoLogin}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.61 1.74 4.9 4.36 6.22-.14.53-.9 3.4-.93 3.61 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.63.09 1.28.14 1.96.14 5.52 0 10-3.36 10-7.56C22 6.36 17.52 3 12 3z"/>
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}
