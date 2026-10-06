import { useState } from "react";
import { addComment, keys, useComments, useLookups, useWrite } from "../lib/api";
import { formatDateTime } from "../lib/dates";
import { ErrorBox } from "./ui";

export function Comments({ kind, parentId }: { kind: "request" | "filing"; parentId: string }) {
  const comments = useComments(kind, parentId);
  const { personName } = useLookups();
  const [body, setBody] = useState("");
  const post = useWrite((text: string) => addComment(kind, parentId, text), [keys.comments(kind, parentId)]);

  return (
    <div>
      {(comments.data ?? []).length === 0 && <p className="faint small">No comments yet.</p>}
      {(comments.data ?? []).map((c) => (
        <div key={c.id} className="comment">
          <div className="comment-head">
            <strong>{personName(c.author_id)}</strong>
            <span className="faint small">{formatDateTime(c.created_at)}</span>
          </div>
          <div className="pre">{c.body}</div>
        </div>
      ))}
      <form
        className="form"
        style={{ marginTop: 10 }}
        onSubmit={(e) => {
          e.preventDefault();
          const text = body.trim();
          if (!text) return;
          post.mutate(text, { onSuccess: () => setBody("") });
        }}
      >
        <textarea
          className="textarea"
          placeholder="Write a comment or question…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: 60 }}
        />
        <ErrorBox error={post.error} />
        <div>
          <button className="btn btn-sm" disabled={post.isPending || !body.trim()}>
            {post.isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
