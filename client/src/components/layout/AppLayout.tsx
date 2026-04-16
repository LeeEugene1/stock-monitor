import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AppLayout.css';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="nav-title">Stock Monitor</div>
        <div className="nav-links">
          <NavLink to="/" end>
            시세
          </NavLink>
          <NavLink to="/portfolio">포트폴리오</NavLink>
          <NavLink to="/auto-buy">자동매수</NavLink>
          <NavLink to="/accounts">계좌관리</NavLink>
        </div>
        <div className="nav-user">
          {user?.profileImage && (
            <img src={user.profileImage} alt="" className="nav-avatar" />
          )}
          <span className="nav-nickname">{user?.nickname}</span>
          <button className="btn-logout" onClick={logout}>
            로그아웃
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
