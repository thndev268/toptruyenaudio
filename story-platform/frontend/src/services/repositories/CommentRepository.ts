import { StoryComment, ReviewHelpfulVote } from '../../types/reviews';
import { REVIEW_VOTES_STORAGE_KEY } from './ReviewRepository';

import { STORAGE_KEYS } from '../storage';

export const COMMENTS_STORAGE_KEY = STORAGE_KEYS.COMMENTS;

export interface CommentRepository {
  getCommentsByStory(storyId: string): Promise<StoryComment[]>;
  addComment(
    commentData: Omit<StoryComment, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'verifiedListener'> & {
      verifiedListener?: boolean;
    }
  ): Promise<StoryComment>;
  editComment(commentId: string, userId: string, content: string, hasSpoiler?: boolean): Promise<StoryComment>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
  voteHelpful(commentId: string, userId: string): Promise<{ helpfulCount: number; voted: boolean }>;
  hasUserVoted(commentId: string, userId: string): Promise<boolean>;
}

export class LocalCommentRepository implements CommentRepository {
  private getStorageComments(): StoryComment[] {
    try {
      const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      return parsed;
    } catch (e) {
      console.warn('[LocalCommentRepository] Error reading comments, returning initial mock data.', e);
      return [];
    }
  }

  private saveStorageComments(comments: StoryComment[]): void {
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
    } catch (e) {
      console.error('[LocalCommentRepository] Error writing comments to localStorage.', e);
    }
  }

  private getStorageVotes(): ReviewHelpfulVote[] {
    try {
      const raw = localStorage.getItem(REVIEW_VOTES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private saveStorageVotes(votes: ReviewHelpfulVote[]): void {
    try {
      localStorage.setItem(REVIEW_VOTES_STORAGE_KEY, JSON.stringify(votes));
    } catch (e) {
      console.error('[LocalCommentRepository] Error writing votes.', e);
    }
  }

  async getCommentsByStory(storyId: string): Promise<StoryComment[]> {
    const all = this.getStorageComments();
    const storyComments = all.filter((c) => c.storyId === storyId);

    // Group into top-level comments and 1-level replies
    const topLevel = storyComments.filter((c) => !c.parentId);
    const replies = storyComments.filter((c) => !!c.parentId);

    return topLevel.map((parent) => ({
      ...parent,
      replies: (parent.replies && parent.replies.length > 0 ? parent.replies : replies.filter((r) => r.parentId === parent.id)),
    }));
  }

  async addComment(
    commentData: Omit<StoryComment, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'verifiedListener'> & {
      verifiedListener?: boolean;
    }
  ): Promise<StoryComment> {
    const all = this.getStorageComments();
    const now = new Date().toISOString();

    const newComment: StoryComment = {
      id: 'cmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      storyId: commentData.storyId,
      userId: commentData.userId,
      userName: commentData.userName || 'Thành Viên Audio',
      userAvatar: commentData.userAvatar,
      verifiedListener: commentData.verifiedListener || false,
      content: commentData.content.trim(),
      hasSpoiler: commentData.hasSpoiler || false,
      helpfulCount: 0,
      parentId: commentData.parentId || null,
      createdAt: now,
      updatedAt: now,
      replies: [],
    };

    if (newComment.parentId) {
      // Find parent comment and append to its replies list
      const parent = all.find((c) => c.id === newComment.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      }
      all.unshift(newComment); // also add flat list for index query
    } else {
      all.unshift(newComment);
    }

    this.saveStorageComments(all);
    return newComment;
  }

  async editComment(commentId: string, userId: string, content: string, hasSpoiler?: boolean): Promise<StoryComment> {
    const all = this.getStorageComments();
    const now = new Date().toISOString();

    const comment = all.find((c) => c.id === commentId);
    if (!comment) throw new Error('Bình luận không tồn tại');
    if (comment.userId !== userId) throw new Error('Không có quyền chỉnh sửa bình luận này');

    comment.content = content.trim();
    if (hasSpoiler !== undefined) {
      comment.hasSpoiler = hasSpoiler;
    }
    comment.updatedAt = now;

    // Also update in parent's replies list if it's a child
    if (comment.parentId) {
      const parent = all.find((c) => c.id === comment.parentId);
      if (parent && parent.replies) {
        const rIndex = parent.replies.findIndex((r) => r.id === commentId);
        if (rIndex >= 0) {
          parent.replies[rIndex] = { ...comment };
        }
      }
    }

    this.saveStorageComments(all);
    return comment;
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    let all = this.getStorageComments();
    const targetIndex = all.findIndex((c) => c.id === commentId);
    if (targetIndex < 0) return false;

    const target = all[targetIndex];
    if (target.userId !== userId) return false;

    // Remove target and any child replies if target is parent
    all = all.filter((c) => c.id !== commentId && c.parentId !== commentId);

    // Also remove from parent replies array
    all.forEach((parent) => {
      if (parent.replies) {
        parent.replies = parent.replies.filter((r) => r.id !== commentId);
      }
    });

    this.saveStorageComments(all);
    return true;
  }

  async hasUserVoted(commentId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const votes = this.getStorageVotes();
    return votes.some((v) => v.targetId === commentId && v.userId === userId && v.targetType === 'COMMENT');
  }

  async voteHelpful(commentId: string, userId: string): Promise<{ helpfulCount: number; voted: boolean }> {
    if (!userId) throw new Error('Cần đăng nhập để bình chọn');
    const votes = this.getStorageVotes();
    const existingIndex = votes.findIndex(
      (v) => v.targetId === commentId && v.userId === userId && v.targetType === 'COMMENT'
    );

    const all = this.getStorageComments();
    let comment: StoryComment | undefined = all.find((c) => c.id === commentId);

    // If child reply, look inside replies
    if (!comment) {
      for (const parent of all) {
        if (parent.replies) {
          const child = parent.replies.find((r) => r.id === commentId);
          if (child) {
            comment = child;
            break;
          }
        }
      }
    }

    if (!comment) throw new Error('Bình luận không tồn tại');

    let voted = false;
    if (existingIndex >= 0) {
      // Unvote
      votes.splice(existingIndex, 1);
      comment.helpfulCount = Math.max(0, (comment.helpfulCount || 0) - 1);
      voted = false;
    } else {
      // Vote
      votes.push({
        userId,
        targetId: commentId,
        targetType: 'COMMENT',
        votedAt: new Date().toISOString(),
      });
      comment.helpfulCount = (comment.helpfulCount || 0) + 1;
      voted = true;
    }

    this.saveStorageVotes(votes);
    this.saveStorageComments(all);

    return { helpfulCount: comment.helpfulCount, voted };
  }
}

export const localCommentRepository = new LocalCommentRepository();
