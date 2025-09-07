import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { SignInPage } from "./components/SignInPage";
import { useAuth } from "./hooks/useAuth";

export function App() {
  const { user, loading, authenticated, loginWithGoogle, logout } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated || !user) {
    return <SignInPage onGoogleSignIn={loginWithGoogle} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onLogout={logout} />} />
        <Route path="/profile" element={<ProfilePage user={user} onLogout={logout} />} />
        <Route path="/settings" element={<SettingsPage user={user} onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
