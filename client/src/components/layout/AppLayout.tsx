import { NavLink, Outlet } from 'react-router-dom';
import { NotificationBell } from '../notification/NotificationBell';
import './AppLayout.css';

export function AppLayout() {
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
        <div className="nav-actions">
          <NotificationBell />
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
