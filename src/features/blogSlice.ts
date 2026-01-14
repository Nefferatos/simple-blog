import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";

export interface Blog {
  id: number;
  title: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
  image_url?: string; // optional image
}

interface BlogState {
  blogs: Blog[];
  loading: boolean;
}

const initialState: BlogState = {
  blogs: [],
  loading: false,
};

// Fetch blogs
export const fetchBlogs = createAsyncThunk("blog/fetchBlogs", async () => {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Blog[];
});

// Create blog
export const createBlog = createAsyncThunk(
  "blog/createBlog",
  async ({
    title,
    content,
    user_id,
    user_name,
    image_url,
  }: {
    title: string;
    content: string;
    user_id: string;
    user_name: string;
    image_url?: string;
  }) => {
    if (!user_id) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from("blogs")
      .insert([{ title, content, user_id, user_name, image_url }])
      .select("*");

    if (error) throw error;
    return data?.[0] as Blog; // return first element
  }
);


// Update blog
export const updateBlog = createAsyncThunk(
  "blog/updateBlog",
  async (blog: Blog) => {
    const { data, error } = await supabase
      .from("blogs")
      .update({
        title: blog.title,
        content: blog.content,
        image_url: blog.image_url,
      })
      .eq("id", blog.id)
      .select()
      .single();
    if (error) throw error;
    return data as Blog;
  }
);

// Delete blog
export const deleteBlog = createAsyncThunk(
  "blog/deleteBlog",
  async (id: number) => {
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
);

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.blogs = action.payload;
        state.loading = false;
      })
      .addCase(fetchBlogs.rejected, (state) => {
        state.loading = false;
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
