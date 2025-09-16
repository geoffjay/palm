import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { SignInPage } from "./components/SignInPage";
import { AuthProvider } from "./contexts/AuthContext";
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
    <AuthProvider user={user} onLogout={logout}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
