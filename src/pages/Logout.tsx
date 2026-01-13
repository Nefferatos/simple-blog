import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      navigate("/auth");
    };

    logout();
  }, [navigate]);

  return <p>Logging out...</p>;
};

export default Logout;
