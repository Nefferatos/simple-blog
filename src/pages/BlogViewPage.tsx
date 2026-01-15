// src/pages/BlogViewPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../services/supabase";
import type { RootState, AppDispatch } from "../app/store";
import type { Blog } from "../features/blogSlice";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../features/commentSlice";
import "../style/viewpage.css";

const BlogViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loadingBlog, setLoadingBlog] = useState(true);

  const comments = useSelector((state: RootState) => state.comment.comments);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [userId, setUserId] = useState("demo-user");
  const [username, setUsername] = useState("Demo User");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUsername(user.user_metadata?.full_name || "Anonymous");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchBlog = async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) console.error(error);
      else setBlog(data);
      setLoadingBlog(false);
    };
    fetchBlog();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchAllComments = async () => {
      setLoadingComments(true);
      await dispatch(fetchComments(Number(id)));
      setLoadingComments(false);
    };
    fetchAllComments();
  }, [dispatch, id]);

  const handleCommentPost = async () => {
    if (!commentContent.trim()) return;
    setPostingComment(true);

    try {
      if (editingComment) {
        await dispatch(
          updateComment({ ...editingComment, content: commentContent })
        ).unwrap();
      } else {
        await dispatch(
          createComment({
            blog_id: Number(id),
            user_id: userId,
            user_name: username,
            content: commentContent,
          })
        ).unwrap();
      }
      setCommentContent("");
      setEditingComment(null);
    } catch (err) {
      console.error(err);
      alert("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await dispatch(deleteComment(commentId)).unwrap();
      setDeleteCommentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingBlog)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading blog...</p>
      </div>
    );

  if (!blog) return <p style={{ textAlign: "center" }}>Blog not found.</p>;

  return (
    <div className="container">
      <button className="blog-btn" style={{ marginBottom: "20px" }} onClick={() => navigate(-1)}>
        ← Back
      </button>


      <div className="post-card">
        {blog.image_url && <img src={blog.image_url} alt={blog.title} className="post-image" />}
        <div className="post-header">
          <img
            src={`https://ui-avatars.com/api/?name=${blog.user_name}&background=2563eb&color=fff&size=40`}
            alt="avatar"
            className="post-avatar"
          />
          <span style={{ fontWeight: 600 }}>{blog.user_name}</span>
        </div>
        <div className="post-info">
          <h3>{blog.title}</h3>
          <p>{blog.content}</p>
          <small>{new Date(blog.created_at!).toLocaleString()}</small>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Comments</h3>

        {!editingComment && (
          <div className="blog-editor">
            <textarea
              className="blog-textarea"
              placeholder="Write a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
            />
            <button className="blog-btn" onClick={handleCommentPost} disabled={!commentContent.trim() || postingComment}>
              {postingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>
        )}

        {loadingComments ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="post-card">
              {comment.user_id === userId && !editingComment?.id && (
                <div className="comment-actions">
                  <button onClick={() => { setEditingComment(comment); setCommentContent(comment.content); }}>Edit</button>
                  <button onClick={() => setDeleteCommentId(comment.id)}>Delete</button>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <img
                  src={`https://ui-avatars.com/api/?name=${comment.user_name}&background=2563eb&color=fff&size=32`}
                  alt="avatar"
                  className="post-avatar"
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>{comment.user_name}</span>
                  <br />
                  <small>{new Date(comment.created_at!).toLocaleString()}</small>

                  {editingComment?.id === comment.id && (
                    <div style={{ marginTop: "8px" }}>
                      <textarea
                        className="blog-textarea"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        rows={3}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                        <button className="blog-btn" onClick={handleCommentPost} disabled={!commentContent.trim() || postingComment}>
                          Save
                        </button>
                        <button className="blog-btn" onClick={() => { setEditingComment(null); setCommentContent(""); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {editingComment?.id !== comment.id && <p style={{ marginTop: "8px" }}>{comment.content}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {deleteCommentId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Are you sure you want to delete this comment?</p>
            <div className="modal-buttons">
              <button className="blog-btn" onClick={() => handleDeleteComment(deleteCommentId)}>Confirm</button>
              <button className="blog-btn" onClick={() => setDeleteCommentId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogViewPage;
