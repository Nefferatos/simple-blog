import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  type Blog,
} from "../features/blogSlice";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";

const BlogPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { blogs, loading } = useSelector((state: RootState) => state.blog);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [deleteBlogId, setDeleteBlogId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchBlogs());
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
  }, [dispatch]);

  const handleSubmit = () => {
    if (!title || !content) return alert("Title and content required");
    if (editingBlog) {
      dispatch(updateBlog({ id: editingBlog.id, title, content, created_at: "", user_id: "" }));
      setEditingBlog(null);
    } else {
      dispatch(createBlog({ title, content }));
    }
    setTitle("");
    setContent("");
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setContent(blog.content);
  };

  const handleDelete = () => {
    if (deleteBlogId !== null) {
      dispatch(deleteBlog(deleteBlogId));
      setDeleteBlogId(null);
    }
  };

  return (
    <div className="container">
      <h1>Blog Management</h1>
      <p>
        Logged in as: <strong>{email ?? "Unknown"}</strong> | <Link to="/logout">Logout</Link>
      </p>
      <div className="section">
        <h2>{editingBlog ? "Edit Blog" : "Create Blog"}</h2>
        <input
          className="blog-input"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="blog-textarea"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="blog-btn" onClick={handleSubmit}>
          {editingBlog ? "Update" : "Create"}
        </button>
      </div>
      {loading ? (
        <p>Loading blogs...</p>
      ) : blogs.length === 0 ? (
        <p>No blogs yet.</p>
      ) : (
        <table className="blog-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Content</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.content}</td>
                <td>{new Date(b.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleEdit(b)}>Edit</button>{" "}
                  <button onClick={() => setDeleteBlogId(b.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {deleteBlogId !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Are you sure you want to delete this blog?</p>
            <button onClick={handleDelete}>Yes, Delete</button>
            <button onClick={() => setDeleteBlogId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
