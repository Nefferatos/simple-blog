import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, username }: { email: string; password: string; username: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw error;
    return data.user;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await supabase.auth.signOut();
});

interface AuthState {
  isAuthenticated: boolean;
  user?: User | null;
}

const initialState: AuthState = { isAuthenticated: false, user: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(register.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload ?? null;
    });
    builder.addCase(login.fulfilled, (state) => {
      state.isAuthenticated = true;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
    });
  },
});

export default authSlice.reducer;
