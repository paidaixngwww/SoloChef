import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <Outlet />
    </div>
  );
}
