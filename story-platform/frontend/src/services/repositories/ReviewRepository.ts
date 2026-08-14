import { StoryReview, RatingDistribution, ReviewHelpfulVote } from '../../types/reviews';

import { STORAGE_KEYS } from '../storage';

export const REVIEWS_STORAGE_KEY = STORAGE_KEYS.REVIEWS;
export const REVIEW_VOTES_STORAGE_KEY = STORAGE_KEYS.REVIEW_VOTES;

export interface ReviewRepository {
  getReviewsByStory(storyId: string): Promise<StoryReview[]>;
  getUserReviewForStory(storyId: string, userId: string): Promise<StoryReview | null>;
  saveReview(
    reviewData: Omit<StoryReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'verifiedListener'> & {
      id?: string;
      verifiedListener?: boolean;
    }
  ): Promise<StoryReview>;
  deleteReview(reviewId: string, userId: string): Promise<boolean>;
  voteHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number; voted: boolean }>;
  hasUserVoted(reviewId: string, userId: string): Promise<boolean>;
  getRatingDistribution(storyId: string): Promise<RatingDistribution>;
}
class LocalReviewRepository implements ReviewRepository {
  private getStorageReviews(): StoryReview[] {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      return parsed;
    } catch (e) {
      console.warn('[LocalReviewRepository] Error reading reviews, returning initial mock data.', e);
      return [];
    }
  }

  private saveStorageReviews(reviews: StoryReview[]): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error('[LocalReviewRepository] Error writing reviews to localStorage.', e);
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
      console.error('[LocalReviewRepository] Error writing votes.', e);
    }
  }

  async getReviewsByStory(storyId: string): Promise<StoryReview[]> {
    const all = this.getStorageReviews();
    return all.filter((r) => r.storyId === storyId);
  }

  async getUserReviewForStory(storyId: string, userId: string): Promise<StoryReview | null> {
    if (!userId) return null;
    const all = this.getStorageReviews();
    return all.find((r) => r.storyId === storyId && r.userId === userId) || null;
  }

  async saveReview(
    reviewData: Omit<StoryReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'verifiedListener'> & {
      id?: string;
      verifiedListener?: boolean;
    }
  ): Promise<StoryReview> {
    const all = this.getStorageReviews();
    const now = new Date().toISOString();

    const existingIndex = all.findIndex((r) => r.storyId === reviewData.storyId && r.userId === reviewData.userId);

    if (existingIndex >= 0) {
      // Update review
      const existing = all[existingIndex];
      const updated: StoryReview = {
        ...existing,
        title: reviewData.title?.trim(),
        content: reviewData.content?.trim(),
        rating: reviewData.rating,
        hasSpoiler: reviewData.hasSpoiler,
        verifiedListener: reviewData.verifiedListener ?? existing.verifiedListener,
        updatedAt: now,
      };
      all[existingIndex] = updated;
      this.saveStorageReviews(all);
      return updated;
    } else {
      // Create new review
      const newReview: StoryReview = {
        id: reviewData.id || 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        storyId: reviewData.storyId,
        userId: reviewData.userId,
        userName: reviewData.userName || 'Thành Viên Audio',
        userAvatar: reviewData.userAvatar,
        rating: reviewData.rating,
        title: reviewData.title?.trim(),
        content: reviewData.content?.trim(),
        hasSpoiler: reviewData.hasSpoiler,
        verifiedListener: reviewData.verifiedListener || false,
        helpfulCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      all.unshift(newReview);
      this.saveStorageReviews(all);
      return newReview;
    }
  }

  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    let all = this.getStorageReviews();
    const target = all.find((r) => r.id === reviewId);
    if (!target || target.userId !== userId) return false;

    all = all.filter((r) => r.id !== reviewId);
    this.saveStorageReviews(all);
    return true;
  }

  async hasUserVoted(reviewId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const votes = this.getStorageVotes();
    return votes.some((v) => v.targetId === reviewId && v.userId === userId && v.targetType === 'REVIEW');
  }

  async voteHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number; voted: boolean }> {
    if (!userId) throw new Error('Cần đăng nhập để bình chọn');
    const votes = this.getStorageVotes();
    const existingIndex = votes.findIndex(
      (v) => v.targetId === reviewId && v.userId === userId && v.targetType === 'REVIEW'
    );

    const all = this.getStorageReviews();
    const review = all.find((r) => r.id === reviewId);
    if (!review) throw new Error('Đánh giá không tồn tại');

    let voted = false;
    if (existingIndex >= 0) {
      // Unvote
      votes.splice(existingIndex, 1);
      review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
      voted = false;
    } else {
      // Vote
      votes.push({
        userId,
        targetId: reviewId,
        targetType: 'REVIEW',
        votedAt: new Date().toISOString(),
      });
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      voted = true;
    }

    this.saveStorageVotes(votes);
    this.saveStorageReviews(all);

    return { helpfulCount: review.helpfulCount, voted };
  }

  async getRatingDistribution(storyId: string): Promise<RatingDistribution> {
    const reviews = await this.getReviewsByStory(storyId);
    const totalReviews = reviews.length;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let verifiedCount = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
      totalScore += r.rating;
      if (r.verifiedListener) verifiedCount++;
    });

    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      verifiedListenersCount: verifiedCount,
      ratingCounts,
    };
  }
}

export const localReviewRepository = new LocalReviewRepository();
