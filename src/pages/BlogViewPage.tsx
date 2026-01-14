import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { supabase } from "../services/supabase";
import type { Blog } from "../features/blogSlice";

const BlogViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); 
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.log(error);
      else setBlog(data);
      setLoading(false);
    };
    fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );

  if (!blog) return <p style={{ textAlign: "center" }}>Blog not found.</p>;

  return (
    <div className="container" style={{ padding: "20px" }}>
      <button
        className="blog-btn"
        style={{ marginBottom: "20px" }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="post-card">
        {blog.image_url && (
          <img src={blog.image_url} alt={blog.title} className="post-image" />
        )}
        <div className="post-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={`https://ui-avatars.com/api/?name=${blog.user_name}&background=2563eb&color=fff&size=40`}
              alt="avatar"
              className="post-avatar"
            />
            <span>{blog.user_name}</span>
          </div>
        </div>
        <div className="post-info">
          <h3>{blog.title}</h3>
          <p>{blog.content}</p>
          <small>{new Date(blog.created_at!).toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
};

export default BlogViewPage;
