import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import type { Blog } from "../features/blogSlice";
import "../style/viewpage.css";

type CommentType = {
  id: number;
  blog_id: number;
  user_id: string;
  user_name: string;
  content: string;
  image_url?: string | null;
  created_at: string;
};

const COMMENT_COOLDOWN = 10_000;

const BlogViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("Anonymous");
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [blogModal, setBlogModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogFile, setBlogFile] = useState<File | null>(null);
  const [blogPreview, setBlogPreview] = useState<string | null>(null);
  const [removeBlogImage, setRemoveBlogImage] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentPreview, setCommentPreview] = useState<string | null>(null);
  const [removeCommentImage, setRemoveCommentImage] = useState(false);

  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);


  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: blogData } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();

      const { data: commentData } = await supabase
        .from("comments")
        .select("*")
        .eq("blog_id", id)
        .order("created_at", { ascending: false });

      if (blogData?.image_url && !blogData.image_url.startsWith("http")) {
        const { data } = supabase.storage
          .from("blog-images")
          .getPublicUrl(blogData.image_url);
        blogData.image_url = data.publicUrl;
      }

      const fixedComments = (commentData || []).map((c) => {
        if (c.image_url && !c.image_url.startsWith("http")) {
          const { data } = supabase.storage
            .from("comment-images")
            .getPublicUrl(c.image_url);
          c.image_url = data.publicUrl;
        }
        return c;
      });

      setBlog(blogData);
      setComments(fixedComments);
      setLoading(false);
    };

    load();
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUsername(data.user?.user_metadata?.username ?? "Anonymous");
    });
  }, []);

  const uploadImage = async (bucket: string, file: File) => {
    const ext = file.name.split(".").pop();
    const fileName = `${bucket}-${Date.now()}.${ext}`;
    await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const deleteImageFile = async (bucket: string, publicUrl: string) => {
    const fileName = publicUrl.split("/").pop()?.split("?")[0];
    if (fileName) await supabase.storage.from(bucket).remove([fileName]);
  };

  const saveBlog = async () => {
    if (!blog) return;

    let image_url = blog.image_url ?? null;

    if (removeBlogImage && image_url) {
      await deleteImageFile("blog-images", image_url);
      image_url = null;
    }

    if (blogFile) {
      if (image_url) await deleteImageFile("blog-images", image_url);
      image_url = await uploadImage("blog-images", blogFile);
    }

    await supabase
      .from("blogs")
      .update({ title: blogTitle, content: blogContent, image_url })
      .eq("id", blog.id);

    setBlog({ ...blog, title: blogTitle, content: blogContent, image_url });
    setBlogModal(false);
    setBlogFile(null);
    setBlogPreview(null);
    setRemoveBlogImage(false);
  };

  const saveComment = async () => {
    if (!userId || !blog) return;
    if (!commentText.trim() && !commentFile) {
      alert("Comment cannot be empty");
      return;
    }

    const now = Date.now();
    if (!editingComment && now - lastCommentTime < COMMENT_COOLDOWN) {
      alert("You're commenting too fast");
      return;
    }

    try {
      setCommentLoading(true);

      let image_url = editingComment?.image_url ?? null;

      if (removeCommentImage && image_url) {
        await deleteImageFile("comment-images", image_url);
        image_url = null;
      }

      if (commentFile) {
        if (image_url) await deleteImageFile("comment-images", image_url);
        image_url = await uploadImage("comment-images", commentFile);
      }

      if (editingComment) {

        await supabase
          .from("comments")
          .update({ content: commentText, image_url })
          .eq("id", editingComment.id);

        setComments((prev) =>
          prev.map((c) =>
            c.id === editingComment.id
              ? { ...c, content: commentText, image_url }
              : c
          )
        );
      } else {
        const { data } = await supabase
          .from("comments")
          .insert({
            blog_id: blog.id,
            user_id: userId,
            user_name: username,
            content: commentText,
            image_url,
          })
          .select()
          .single();

        if (data) setComments((prev) => [data, ...prev]);
        setLastCommentTime(now);
      }

      setEditingComment(null);
      setCommentText("");
      setCommentFile(null);
      setCommentPreview(null);
      setRemoveCommentImage(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save comment. Try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const deleteComment = async (id: number) => {
    const comment = comments.find((c) => c.id === id);
    if (comment?.image_url) {
      await deleteImageFile("comment-images", comment.image_url);
    }
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    setDeleteCommentId(null);
  };

  if (loading) return <p>Loading...</p>;
  if (!blog) return <p>Blog not found</p>;

  return (
    <div className="wrapper">
    <div className="view-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="post-card main-card">
        {blog.image_url && (
          <img
            src={blog.image_url}
            className="post-image"
            onClick={() => setViewImage(blog.image_url!)}
          />
        )}
        <h2>{blog.title}</h2>
        <p>{blog.content}</p>
        {blog.user_id === userId && (
          <div className="blog-actions">
            <button
              onClick={() => {
                setBlogModal(true);
                setBlogTitle(blog.title);
                setBlogContent(blog.content);
                setBlogPreview(blog.image_url || null);
              }}
            >
              Edit Blog
            </button>
          </div>
        )}
      </div>

      <div className="new-comment-section comment-form main-card">
      <h3>Comments</h3>
        <textarea
          value={commentText}
          placeholder="Write a comment..."
          onChange={(e) => setCommentText(e.target.value)}
          disabled={commentLoading}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setCommentFile(f);
            setCommentPreview(f ? URL.createObjectURL(f) : null);
            setRemoveCommentImage(false);
          }}
          disabled={commentLoading}
        />
        {commentPreview && (
          <div className="comment-preview">
            <img src={commentPreview} className="preview-img" />
            <button
              onClick={() => {
                setRemoveCommentImage(true);
                setCommentPreview(null);
                setCommentFile(null);
              }}
            >
              Remove Image
            </button>
          </div>
        )}
        <button onClick={saveComment} disabled={commentLoading}>
          {commentLoading && <span className="spinner"></span>}
          {commentLoading ? "Posting..." : "Post Comment"}
        </button>
      </div>

      <div className="comment-section">
        {comments.map((c) => (
          <div key={c.id} className="comment-card">
            {c.user_id === userId && (
              <div className="comment-actions">
                <button
                  onClick={() => {
                    setEditingComment(c);
                    setCommentText(c.content);
                    setCommentPreview(c.image_url || null);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => setDeleteCommentId(c.id)}>Delete</button>
              </div>
            )}
            <strong>{c.user_name}</strong>
            <p>{c.content}</p>
            {c.image_url && (
              <img
                src={c.image_url}
                className="comment-image"
                onClick={() => setViewImage(c.image_url!)}
              />
            )}
          </div>
        ))}
      </div>
      {deleteCommentId !== null && (
        <div className="modal" onClick={() => setDeleteCommentId(null)}>
          <div className="delete-modal-box" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete this comment?</p>
            <div className="delete-modal-buttons">
              <button
                className="delete-btn"
                onClick={() => deleteComment(deleteCommentId)}
              >
                Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => setDeleteCommentId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewImage && (
        <div className="modal" onClick={() => setViewImage(null)}>
          <img src={viewImage} className="modal-image" />
        </div>
      )}

      {blogModal && (
        <div className="modal">
          <div className="modal-box">
            <input
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
            />
            <textarea
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setBlogFile(f);
                setBlogPreview(f ? URL.createObjectURL(f) : null);
                setRemoveBlogImage(false);
              }}
            />
            {blogPreview && (
              <>
                <img src={blogPreview} className="preview-img" />
                <button
                  onClick={() => {
                    setRemoveBlogImage(true);
                    setBlogPreview(null);
                    setBlogFile(null);
                  }}
                >
                  Remove Image
                </button>
              </>
            )}
            <div className="modal-buttons">
              <button onClick={saveBlog}>Save</button>
              <button
                onClick={() => {
                  setBlogModal(false);
                  setBlogPreview(null);
                  setRemoveBlogImage(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {editingComment && (
        <div className="modal" onClick={() => setEditingComment(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Comment</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={commentLoading}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCommentFile(f);
                setCommentPreview(f ? URL.createObjectURL(f) : null);
                setRemoveCommentImage(false);
              }}
              disabled={commentLoading}
            />
            {commentPreview && (
              <div className="comment-preview">
                <img src={commentPreview} className="preview-img" />
                <button
                  onClick={() => {
                    setRemoveCommentImage(true);
                    setCommentPreview(null);
                    setCommentFile(null);
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}
            {!commentPreview && editingComment.image_url && !removeCommentImage && (
              <div className="comment-preview">
                <img src={editingComment.image_url} className="preview-img" />
                <button onClick={() => setRemoveCommentImage(true)}>Remove Image</button>
              </div>
            )}
            <div className="modal-buttons">
              <button onClick={saveComment} disabled={commentLoading}>
                {commentLoading && <span className="spinner"></span>}
                {commentLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setCommentText("");
                  setCommentFile(null);
                  setCommentPreview(null);
                  setRemoveCommentImage(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default BlogViewPage;
