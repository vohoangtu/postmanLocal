import { memo } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./components/AppRouter";
import { useUserPreferences } from "./hooks/useUserPreferences";

function App() {
  // Apply user preferences (theme, etc.)
  useUserPreferences();

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default memo(App);
