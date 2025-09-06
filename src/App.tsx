import { useAuth } from "./hooks/useAuth";
import { SignInPage } from "./components/SignInPage";
import { Dashboard } from "./components/Dashboard";
import { LoadingScreen } from "./components/LoadingScreen";

import "./index.css";

export function App() {
	const { user, loading, authenticated, loginWithGoogle, logout } = useAuth();

	if (loading) {
		return <LoadingScreen />;
	}

	if (!authenticated || !user) {
		return <SignInPage onGoogleSignIn={loginWithGoogle} />;
	}

	return <Dashboard user={user} onLogout={logout} />;
}

export default App;
