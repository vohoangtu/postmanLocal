import { useState, useEffect } from "react";
import { syncService } from "../../services/syncService";
import { useToast } from "../../hooks/useToast";
import { useCollectionStore } from "../../stores/collectionStore";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { useSchemaStore } from "../../stores/schemaStore";

export default function SyncPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { collections } = useCollectionStore();
  const { environments } = useEnvironmentStore();
  const { schemas } = useSchemaStore();
  const toast = useToast();

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const response = await syncService.getUser();
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await syncService.login({ email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      setShowLogin(false);
      setEmail("");
      setPassword("");
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      const response = await syncService.register({ name, email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      setShowLogin(false);
      setName("");
      setEmail("");
      setPassword("");
      toast.success("Account created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  const handleLogout = async () => {
    await syncService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncService.syncAll({
        collections: collections.map((c) => ({
          name: c.name,
          description: c.description,
          data: c.requests,
        })),
        environments: environments.map((e) => ({
          name: e.name,
          variables: e.variables,
        })),
        schemas: schemas.map((s) => ({
          name: s.name,
          schema_data: s.schemaData,
        })),
      });
      toast.success("Sync completed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {!isAuthenticated ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Not signed in
          </span>
          <button
            onClick={() => setShowLogin(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Signed in as: <strong>{user?.name}</strong>
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
            >
              {syncing ? "Syncing..." : "Sync to Cloud"}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
          >
            Sign Out
          </button>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {isRegister ? "Register" : "Sign In"}
            </h3>
            {isRegister && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && (isRegister ? handleRegister() : handleLogin())}
            />
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowLogin(false);
                  setIsRegister(false);
                  setEmail("");
                  setPassword("");
                  setName("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={isRegister ? handleRegister : handleLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isRegister ? "Register" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

