import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";

export interface Comment {
  id: number;
  blog_id: number;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string | null;
  image_url?: string | null;
}

interface CommentState {
  comments: Comment[];
  loading: boolean;
}

const initialState: CommentState = {
  comments: [],
  loading: false,
};

export const fetchComments = createAsyncThunk(
  "comment/fetchComments",
  async (blog_id: number) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("blog_id", blog_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Comment[];
  }
);
export const createComment = createAsyncThunk(
  "comment/createComment",
  async (payload: {
    blog_id: number;
    content: string;
    user_id: string;
    user_name: string;
    file?: File | null;
  }) => {
    const { blog_id, content, user_id, user_name, file } = payload;

    if (!user_id) throw new Error("User not logged in");

    let image_url: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const fileName = `comment-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("comment-images")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("comment-images")
        .getPublicUrl(fileName);
      image_url = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([{ blog_id, content, user_id, user_name, image_url }])
      .select("*");

    if (error) throw error;
    return data?.[0] as Comment;
  }
);

export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async (payload: {
    id: number;
    content: string;
    file?: File | null;
    removeImage?: boolean;
  }) => {
    let image_url: string | null = null;

    if (payload.removeImage) {
      image_url = null;
    } else if (payload.file) {
      const ext = payload.file.name.split(".").pop();
      const fileName = `comment-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("comment-images")
        .upload(fileName, payload.file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("comment-images")
        .getPublicUrl(fileName);
      image_url = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from("comments")
      .update({ content: payload.content, image_url })
      .eq("id", payload.id)
      .select()
      .single();

    if (error) throw error;
    return data as Comment;
  }
);

export const deleteComment = createAsyncThunk(
  "comment/deleteComment",
  async (id: number) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
);

const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
        state.loading = false;
      })
      .addCase(fetchComments.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) state.comments[index] = action.payload;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c.id !== action.payload);
      });
  },
});

export default commentSlice.reducer;
