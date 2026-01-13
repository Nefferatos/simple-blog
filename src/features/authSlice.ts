import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../services/supabase';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await supabase.auth.signOut();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state) => {
      state.isAuthenticated = true;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
    });
  },
});

export default authSlice.reducer;
