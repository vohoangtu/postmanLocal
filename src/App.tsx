import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./components/AppRouter";
import { useUserPreferences } from "./hooks/useUserPreferences";

// Component để apply user preferences bên trong AuthProvider
function AppContent() {
  // Apply user preferences (theme, etc.)
  useUserPreferences();
  return <AppRouter />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
