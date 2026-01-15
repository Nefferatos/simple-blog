import { configureStore } from '@reduxjs/toolkit';
import blogReducer from '../features/blogSlice';
import commentReducer from "../features/commentSlice";

export const store = configureStore({
  reducer: {
    blog: blogReducer,
    comment: commentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
