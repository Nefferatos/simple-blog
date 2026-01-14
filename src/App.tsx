import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./services/supabase";
import BlogPage from "./pages/BlogPage";
import BlogViewPage from "./pages/BlogViewPage";
import AuthPage from "./pages/AuthPage";
import Logout from "./pages/Logout";
import type { User } from "@supabase/supabase-js";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <BlogPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/blog/:id"
          element={user ? <BlogViewPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
};

export default App;
