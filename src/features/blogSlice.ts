import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../services/supabase';

export interface Blog {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface BlogState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
}

const initialState: BlogState = {
  blogs: [],
  loading: false,
  error: null,
};

// Fetch blogs
export const fetchBlogs = createAsyncThunk('blog/fetchBlogs', async () => {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Blog[];
});

// Create blog
export const createBlog = createAsyncThunk('blog/createBlog', async (blog: { title: string; content: string }) => {
  const { data, error } = await supabase.from('blogs').insert(blog).select();
  if (error) throw error;
  return data[0] as Blog;
});

// Update blog
export const updateBlog = createAsyncThunk('blog/updateBlog', async (blog: Blog) => {
  const { data, error } = await supabase
    .from('blogs')
    .update({ title: blog.title, content: blog.content })
    .eq('id', blog.id)
    .select();
  if (error) throw error;
  return data[0] as Blog;
});

// Delete blog
export const deleteBlog = createAsyncThunk('blog/deleteBlog', async (id: number) => {
  const { error } = await supabase.from('blogs').delete().eq('id', id);
  if (error) throw error;
  return id;
});

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blogs';
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.blogs.unshift(action.payload);
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        const index = state.blogs.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.blogs[index] = action.payload;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter((b) => b.id !== action.payload);
      });
  },
});

export default blogSlice.reducer;
