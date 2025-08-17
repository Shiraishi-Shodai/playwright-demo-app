"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Post {
  id: number;
  content: string;
  created_at: string;
  username: string;
}

interface Session {
  userId: number;
  username: string;
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    fetchSession();
    fetchPosts();
  }, []);

  const fetchSession = async () => {
    const res = await fetch("/api/session");
    if (res.ok) {
      const data = await res.json();
      setSession(data);
    }
  };

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      // 降順にソート
      // (a, b) => a - b → 小さい値が前 → 昇順(正の時aを後ろにする)
      // (a, b) => b - a → 大きい値が前 → 降順(正の時bを後ろにする)
      data.sort((a: Post, b: Post) => b.id - a.id);
      setPosts(data);
    }
  };

  const handleLogout = async () => {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const res = await fetch("/api/posts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    });

    if (res.ok) {
      setNewPost("");
      fetchPosts();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      console.log("ファイル名：", e.target.files[0]);
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("インポート実行");

    if (!importFile) {
      setImportStatus("Please select a file to import.");
      return;
    }

    setImportStatus("Importing...");
    const formData = new FormData();
    formData.set("importFile", importFile);
    console.log("フォームデータ");
    console.log(formData.values());

    try {
      const res = await fetch("/api/posts/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setImportStatus(data.message || "Import successful!");
        fetchPosts();
      } else {
        setImportStatus(`Error: ${data.error || "Import failed."}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setImportStatus("An unexpected error occurred during import.");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const res = await fetch(`/api/posts/delete/${postId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchPosts(); // Refresh posts after deletion
    }
  };

  const handleDeleteAllPosts = async () => {
    // if (!confirm('Are you sure you want to delete all posts? This action cannot be undone.')) return;
    console.log("Delete All");
    const res = await fetch("/api/posts/delete/all", {
      method: "DELETE",
    });

    if (res.ok) {
      fetchPosts(); // Refresh posts after deletion
    }
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setEditedContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedContent("");
  };

  const handleSaveEdit = async (postId: number) => {
    if (!editedContent.trim()) return;

    const res = await fetch(`/api/posts/update/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editedContent }),
    });

    if (res.ok) {
      setEditingPostId(null);
      setEditedContent("");
      fetchPosts();
    } else {
      alert("Failed to update post.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Welcome, {session?.username}!</h1>
          <div className={styles.headerButtons}>
            <a
              href="/api/posts/export"
              className={styles.exportButton}
              download
              aria-label="export-excel"
            >
              Export to Excel
            </a>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
            <button
              onClick={handleDeleteAllPosts}
              className={`${styles.logoutButton} ${styles.deleteAllButton}`}
            >
              Delete All Posts
            </button>
          </div>
        </div>

        <form onSubmit={handleImportSubmit} className={styles.importForm}>
          <h2>Import Posts from Excel</h2>
          <div className={styles.importControls}>
            <input
              type="file"
              onChange={handleFileChange}
              onClick={(e) => {
                // 同じファイルでも選べるように値をリセット
                (e.target as HTMLInputElement).value = "";
              }}
              accept=".xlsx"
              className={styles.fileInput}
              aria-label="select-excel-file"
            />
            <button type="submit" className={styles.importButton}>
              Import
            </button>
          </div>
          {importStatus && (
            <p className={styles.importStatus}>{importStatus}</p>
          )}
        </form>

        <form onSubmit={handlePostSubmit} className={styles.postForm}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className={styles.textarea}
            rows={3}
          />
          <button type="submit" className={styles.postButton}>
            Post
          </button>
        </form>

        <div className={styles.postList}>
          {posts.map((post) => (
            <div key={post.id} className={styles.post} aria-label={`post-id-${post.id}`}>
              <div className={styles.postHeader}>
                <p className={styles.postUsername}>{post.username}</p>
                {session?.username === post.username && (
                  <div className={styles.postActions}>
                    <button
                      onClick={() => handleEditClick(post)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className={styles.deleteButton}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {editingPostId === post.id ? (
                <div className={styles.editPostForm}>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className={styles.editPostTextarea}
                    rows={3}
                  />
                  <div className={styles.editPostButtons}>
                    <button
                      onClick={() => handleSaveEdit(post.id)}
                      className={styles.saveButton}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.postContent} aria-label="post-content">{post.content}</p>
              )}
              <p className={styles.postTimestamp}>
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}