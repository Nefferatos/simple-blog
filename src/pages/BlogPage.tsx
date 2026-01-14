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
import { Link, useNavigate } from "react-router-dom";
import heroImage from "./bg-hero.jpg";
import info1 from "./info-1.jpg";
import info2 from "./info-2.jpg";

const PAGE_SIZE = 4;

const BlogPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { blogs, loading } = useSelector((state: RootState) => state.blog);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogs());
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
      setUsername(user?.user_metadata?.username ?? null);
    });
  }, [dispatch]);

  const totalPages = Math.ceil(blogs.length / PAGE_SIZE);
  const paginatedBlogs = blogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleNewPost = () => {
    setEditingBlog(null);
    setTitle("");
    setContent("");
    setImageFile(null);
    setShowEditorModal(true);
  };

  const handlePost = async () => {
    if (!userId) {
      alert("You must be logged in to post a blog.");
      setShowEditorModal(false);
      return;
    }

    setPosting(true);

    let image_url: string | undefined = undefined;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `blog-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, imageFile, { upsert: true });

      if (error) {
        console.error("Image upload error:", error.message);
        alert("Failed to upload image");
        setPosting(false);
        return;
      } else if (data) {
        const { data: publicData } = supabase.storage
          .from("blog-images")
          .getPublicUrl(fileName);
        image_url = publicData.publicUrl;
      }
    }

    try {
      if (editingBlog) {
        await dispatch(
          updateBlog({
            ...editingBlog,
            title,
            content,
            image_url: image_url ?? editingBlog.image_url,
          })
        );
        await dispatch(fetchBlogs()); 
        setEditingBlog(null);
      } else {
        await dispatch(
          createBlog({
            title,
            content,
            user_id: userId,
            user_name: username || userEmail || "Anonymous",
            image_url,
          })
        ).unwrap();
      }

      setTitle("");
      setContent("");
      setImageFile(null);
      setShowEditorModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create blog post";
      console.error("Blog creation failed:", errorMessage);
      alert(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  const handleEditOpen = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setContent(blog.content);
    setImageFile(null);
    setShowEditorModal(true);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm !== null) {
      await dispatch(deleteBlog(showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/blog/${id}`);
  };

  return (
    <div className="container">
      <header className="site-header">
        <div className="navbar">
          <div className="logo">Web Blog</div>
          <div className="nav-right">
            {userEmail && <span>Hello, {userEmail}</span>}
            <Link to="/logout">Logout</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <img src={heroImage} alt="web illustration" className="hero-image" />
        <div className="hero-overlay">
          <h1>My Blog</h1>
          <p>Write. Share. Inspire.</p>
        </div>
      </section>

      <section className="info-sections-zigzag">
        <div className="info-card-zigzag left-img">
          <img src={info1} alt="Popular Posts" className="info-image" />
          <div className="info-text">
            <h2>Popular Posts</h2>
            <p>Check out the most popular posts in the community!</p>
          </div>
        </div>

        <div className="info-card-zigzag right-img">
          <img src={info2} alt="Blog Highlights" className="info-image" />
          <div className="info-text">
            <h2>Blog Highlights</h2>
            <p>Highlighting outstanding contributions from our users.</p>
          </div>
        </div>

        <div className="info-card-zigzag left-img">
          <img src={info1} alt="About Us" className="info-image" />
          <div className="info-text">
            <h2>About Us</h2>
            <p>
              This platform allows users to freely express ideas and share
              knowledge through blogging.
            </p>
          </div>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        <button
          className="blog-btn"
          style={{ width: "250px", fontSize: "16px", padding: "12px 0" }}
          onClick={handleNewPost}
        >
          Write a Post Here!
        </button>
      </div>

      <section className="post-list-section">
        {loading ? (
          <p>Loading...</p>
        ) : (
          paginatedBlogs.map((blog) => (
            <div
              key={blog.id}
              className="post-card"
              style={{ marginBottom: "20px" }}
              onClick={() => handleCardClick(blog.id)}
            >
              {blog.image_url && (
                <img
                  src={blog.image_url}
                  alt={blog.title}
                  className="post-image"
                />
              )}

              <div
                className="post-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px 0 18px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${blog.user_name}&background=2563eb&color=fff&size=40`}
                    alt="avatar"
                    className="post-avatar"
                  />
                  <span>{blog.user_name}</span>
                </div>

                {blog.user_id === userId && (
                  <div
                    className="post-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button onClick={() => handleEditOpen(blog)}>Edit</button>
                    <button onClick={() => setShowDeleteConfirm(blog.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="post-info">
                <h3>{blog.title}</h3>
                <p>
                  {blog.content.length > 120
                    ? blog.content.slice(0, 120) + "..."
                    : blog.content}
                </p>
                <small>{new Date(blog.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>

      <footer className="footer">
        &copy; 2026 Community Blog. All Rights Reserved.
      </footer>

      {showEditorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingBlog ? "Edit Post" : "Publish Post"}</h3>
            <input
              className="blog-input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="blog-textarea"
              placeholder="Write your post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <div style={{ marginTop: "12px" }}>
              <button
                className="blog-btn"
                onClick={handlePost}
                disabled={posting}
              >
                {posting
                  ? "Posting..."
                  : editingBlog
                  ? "Save Changes"
                  : "Publish"}
              </button>
              <button
                className="blog-btn"
                style={{ background: "#9ca3af", marginLeft: "10px" }}
                onClick={() => {
                  if (!posting) {
                    setShowEditorModal(false);
                    setEditingBlog(null);
                    setTitle("");
                    setContent("");
                    setImageFile(null);
                  }
                }}
                disabled={posting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Delete this post?</p>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
