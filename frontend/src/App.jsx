import { Route, Routes } from "react-router-dom";
import Shell from "./components/layout/Shell";
import ChatInterface from "./components/chat/ChatInterface";
import NotificationPanel from "./components/layout/NotificationPanel";
import AvatarHistoryPanel from "./components/layout/AvatarHistoryPanel";
import MapView from "./components/map/MapView";
import VaultDashboard from "./components/vault/VaultDashboard";
import ElectionInfo from "./components/info/ElectionInfo";
import Login from "./components/auth/Login";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Login />;

  // Shared panels (same across all routes)
  const leftPanel  = <NotificationPanel />;
  const rightPanel = <AvatarHistoryPanel />;

  return (
    <Routes>
      <Route path="/"      element={<Shell left={leftPanel} center={<ChatInterface />}   right={rightPanel} />} />
      <Route path="/map"   element={<Shell left={leftPanel} center={<MapView />}         right={rightPanel} />} />
      <Route path="/vault" element={<Shell left={leftPanel} center={<VaultDashboard />}  right={rightPanel} />} />
      <Route path="/info"  element={<Shell left={leftPanel} center={<ElectionInfo />}    right={rightPanel} />} />
    </Routes>
  );
}
