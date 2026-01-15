import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";

export interface Comment {
  id: number;
  blog_id: number;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
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
  async ({
    blog_id,
    content,
    user_id,
    user_name,
  }: {
    blog_id: number;
    content: string;
    user_id: string;
    user_name: string;
  }) => {
    if (!user_id) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from("comments")
      .insert([{ blog_id, content, user_id, user_name }])
      .select("*");

    if (error) throw error;
    return data?.[0] as Comment;
  }
);

export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async (comment: Comment) => {
    const { data, error } = await supabase
      .from("comments")
      .update({ content: comment.content })
      .eq("id", comment.id)
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
