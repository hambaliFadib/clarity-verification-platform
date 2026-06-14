"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: string;
}

interface RequirementCommentsProps {
  requirementId: string;
}

export function RequirementComments({ requirementId }: RequirementCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [requirementId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/comments`);
      if (response.ok) {
        setComments(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/requirements/${requirementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-surface-container-low rounded-md" />
        <div className="h-12 w-full bg-surface-container-low rounded-lg" />
        <div className="h-20 bg-surface-container-low rounded-lg" />
        <div className="h-20 bg-surface-container-low rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-on-surface-variant" />
        <h3 className="text-body-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none"
          disabled={isSubmitting}
        />
        <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-outline py-8">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 border border-outline-variant rounded-xl bg-surface-container-low"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.userName || `User ${comment.userId.slice(0, 8)}`}
                    </span>
                    <span className="text-xs text-outline">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
