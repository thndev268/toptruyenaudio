import { apiRequest } from '../apiClient';
import { StoryComment } from '../../types/reviews';

export interface CommentRepository {
  getCommentsByStory(storyId: string, chapterId?: string, filter?: string): Promise<StoryComment[]>;
  getCommentCount(storyId?: string, chapterId?: string): Promise<{ count: number }>;
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

export class ApiCommentRepository implements CommentRepository {
  async getCommentsByStory(
    storyId: string, 
    chapterId?: string, 
    filter: string = 'NEWEST'
  ): Promise<StoryComment[]> {
    const params = new URLSearchParams();
    if (storyId) params.append('storyId', storyId);
    if (chapterId) params.append('chapterId', chapterId);
    params.append('filter', filter);
    params.append('limit', '50');

    const response = await apiRequest<{ success: boolean; data: any[] }>(`/comments?${params.toString()}`);
    return response.data;
  }

  async getCommentCount(storyId?: string, chapterId?: string): Promise<{ count: number }> {
    const params = new URLSearchParams();
    if (storyId) params.append('storyId', storyId);
    if (chapterId) params.append('chapterId', chapterId);

    const response = await apiRequest<{ success: boolean; data: { count: number } }>(`/comments/count?${params.toString()}`);
    return response.data;
  }

  async addComment(
    commentData: Omit<StoryComment, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'verifiedListener'> & {
      verifiedListener?: boolean;
    }
  ): Promise<StoryComment> {
    const response = await apiRequest<{ success: boolean; data: StoryComment }>('/comments', {
      method: 'POST',
      body: JSON.stringify({
        storyId: commentData.storyId,
        chapterId: (commentData as any).chapterId,
        content: commentData.content,
        hasSpoiler: commentData.hasSpoiler,
        parentId: commentData.parentId,
      }),
    });
    return response.data;
  }

  async editComment(commentId: string, userId: string, content: string, hasSpoiler?: boolean): Promise<StoryComment> {
    const response = await apiRequest<{ success: boolean; data: StoryComment }>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        content,
        hasSpoiler,
      }),
    });
    return response.data;
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    await apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    });
    return true;
  }

  async voteHelpful(commentId: string, userId: string): Promise<{ helpfulCount: number; voted: boolean }> {
    const response = await apiRequest<{ success: boolean; data: { helpfulCount: number; voted: boolean } }>(
      `/comments/${commentId}/vote-helpful`,
      {
        method: 'POST',
      }
    );
    return response.data;
  }

  async hasUserVoted(commentId: string, userId: string): Promise<boolean> {
    // API không có endpoint này, trả về false cho demo
    // Trong thực tế nên có endpoint để check vote status
    return false;
  }
}

export const apiCommentRepository = new ApiCommentRepository();
