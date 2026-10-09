export interface StoryReview {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userIsPremium?: boolean;
  rating: number; // 1 to 5
  title?: string;
  content?: string;
  hasSpoiler: boolean;
  verifiedListener: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  verifiedListener: boolean;
  content: string;
  hasSpoiler?: boolean;
  helpfulCount: number;
  parentId?: string | null; // Null for top-level, string for 1-level reply
  createdAt: string;
  updatedAt: string;
  replies?: StoryComment[];
}

export interface ReviewHelpfulVote {
  userId: string;
  targetId: string; // reviewId or commentId
  targetType: 'REVIEW' | 'COMMENT';
  votedAt: string;
}

export interface EligibilityResult {
  canRate: boolean;
  canComment: boolean;
  validListeningSeconds: number;
  requiredListeningSeconds: number;
  remainingSeconds: number;
  verifiedListener: boolean;
}

export type ReviewSortOption = 'HELPFUL' | 'NEWEST' | 'HIGHEST_RATING' | 'LOWEST_RATING' | 'VERIFIED_ONLY';
export type CommentFilterOption = 'ALL' | 'NEWEST' | 'HELPFUL' | 'VERIFIED_ONLY';

export type ReportReason =
  | 'SPOILER_UNFLAGGED'
  | 'OFFENSIVE_CONTENT'
  | 'SPAM'
  | 'INCORRECT_INFO'
  | 'OTHER';

export interface RatingDistribution {
  averageRating: number;
  totalReviews: number;
  verifiedListenersCount: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
