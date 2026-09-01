import React, { useState, useEffect, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import {

  Play,

  Heart,

  Star,

  Lock,

  Crown,

  MessageSquare,

  ListMusic,

  Sparkles,

  Eye,

  EyeOff,

  Film,

} from 'lucide-react';

import { useAudioPlayer } from '../../context/AudioPlayerContext';

import { useAuth } from '../../context/AuthContext';

import { useToast } from '../../context/ToastContext';

import { adminRepository } from '../../services/repositories/AdminRepository';

import { useStories } from '../../hooks/useStories';

import { apiRequest } from '../../services/apiClient';

import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';



import {

  StoryReview,

  StoryComment,

  RatingDistribution,

  EligibilityResult,

  ReportReason,

} from '../../types/reviews';



import { localReviewRepository } from '../../services/repositories/ReviewRepository';

import { createProgressKey } from '../../services/storage';

import { apiCommentRepository } from '../../services/repositories/CommentRepository';

import { EligibilityService } from '../../services/repositories/EligibilityService';



import { CommentSection } from '../comments/CommentSection';

import { ConfirmModal } from '../common/ConfirmModal';

import { ReportModal } from '../common/ReportModal';

import { StoryHero } from '../story/StoryHero';

import { AddToPlaylistMenu } from '../common/AddToPlaylistMenu';

import { StoryCard } from '../common/StoryCard';

import { HorizontalStoryRail } from '../common/HorizontalStoryRail';



export const StoryDetailView: React.FC = () => {

  const { slug } = useParams<{ slug: string }>();

  const navigate = useNavigate();

  // Redirect if slug is empty
  useEffect(() => {
    if (!slug) {
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);



  const {

    user,

    isAuthenticated,

  } = useAuth();



  const {

    playChapter,

    toggleFavorite,

    favorites,

    listeningProgressMap,

    listeningHistory,

  } = useAudioPlayer();



  const { showToast } = useToast();



  const publicStories = useStories();

  const storiesArray = Array.isArray(publicStories.stories) ? publicStories.stories : [];
  const story = storiesArray.find((s) => s.slug === slug || s.id === slug);

  const videoSettings = adminRepository.getVideoSettings();



  // ALL STATE HOOKS - MUST BE BEFORE ANY CONDITIONAL RETURNS

  const [isIframeVisible, setIsIframeVisible] = useState<boolean>(

    !videoSettings.hideIframeWithCSS || videoSettings.showIframeByDefault

  );



  const [selectedFilterGenre, setSelectedFilterGenre] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'episodes' | 'reviews'>('episodes');



  // Reviews & Comments Data State

  const [reviews, setReviews] = useState<StoryReview[]>([]);

  const [comments, setComments] = useState<StoryComment[]>([]);

  const [distribution, setDistribution] = useState<RatingDistribution | null>(null);

  const [userReview, setUserReview] = useState<StoryReview | null>(null);

  const [votedReviewIds, setVotedReviewIds] = useState<string[]>([]);

  const [votedCommentIds, setVotedCommentIds] = useState<string[]>([]);

  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);

  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(true);



  // Modals state

  const [confirmModal, setConfirmModal] = useState<{

    isOpen: boolean;

    title: string;

    message: string;

    onConfirm: () => void;

  }>({

    isOpen: false,

    title: '',

    message: '',

    onConfirm: () => {},

  });



  const [reportModal, setReportModal] = useState<{

    isOpen: boolean;

    targetType: 'Bình luận';

    targetId: string;

  }>({

    isOpen: false,

    targetType: 'Bình luận',

    targetId: '',

  });



  // Playlist State

  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false);

  const [selectedChapterForPlaylist, setSelectedChapterForPlaylist] = useState<any>(null);



  const [eligibility, setEligibility] = useState<EligibilityResult>({

    canRate: false,

    canComment: false,

    validListeningSeconds: 0,

    requiredListeningSeconds: 0,

    remainingSeconds: 0,

    verifiedListener: false,

  });



  // EFFECTS AND MEMOS - MUST BE BEFORE ANY CONDITIONAL RETURNS

  // Fetch fresh story data when component mounts to ensure chapters are up to date
  useEffect(() => {
    if (!slug) return;

    const fetchStoryData = async () => {
      try {
        const response = await fetch(`https://api.toptruyenaudio.site/api/v1/stories/${slug}`);
        if (response.ok) {
          const data = await response.json();
          console.log('[StoryDetailView] Fetched story data:', data);
          // Force refresh by triggering sync event
          window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
        }
      } catch (error) {
        console.error('[StoryDetailView] Failed to fetch story data:', error);
      }
    };

    fetchStoryData();
  }, [slug]);

  useEffect(() => {

    if (!story) {

      return;

    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.title = `${story.title} – TOP TRUYỆN AUDIO`;

    return () => {

      document.title = 'TOP TRUYỆN AUDIO - Nghe Truyện Audio Chuẩn HD';

    };

  }, [story]);



  // Calculate recommended stories by genre, topic, author, or video format

  const relatedStories = React.useMemo(() => {

    if (!story) return [];

    const allPublic = Array.isArray(publicStories.stories) ? publicStories.stories : [];

    const combined = [...allPublic];

    const others = combined.filter((s) => s.id !== story.id && s.slug !== story.slug);



    const scored = others.map((s) => {

      let score = 0;

      const commonGenres = (s.genres || []).filter((g: any) => (story.genres || []).includes(g));

      score += commonGenres.length * 10;

      if (s.isVideoStory && story.isVideoStory) score += 15;

      if (s.authorName && s.authorName === story.authorName) score += 20;

      score += s.rating || 0;



      return { story: s, score, commonGenres };

    });



    scored.sort((a, b) => b.score - a.score);

    return scored.map((item) => item.story);

  }, [story, publicStories]);



  const filteredRelatedStories = React.useMemo(() => {

    if (!selectedFilterGenre) return relatedStories;

    if (selectedFilterGenre === 'VIDEO_STORY') {

      return relatedStories.filter((s) => s.isVideoStory);

    }

    return relatedStories.filter((s) => (s.genres || []).includes(selectedFilterGenre));

  }, [relatedStories, selectedFilterGenre]);



  const isFav = story ? favorites.includes(story.id) : false;



  // Load reviews, comments, and rating summary

  const refreshData = useCallback(async () => {

    if (!story) return;

    

    try {

      setIsLoadingReviews(true);

      setIsLoadingComments(true);



      const [storyReviews, storyComments, ratingDist] = await Promise.all([

        localReviewRepository.getReviewsByStory(story.id),

        apiCommentRepository.getCommentsByStory(story.id),

        localReviewRepository.getRatingDistribution(story.id),

      ]);



      setReviews(storyReviews);

      setComments(storyComments);

      setDistribution(ratingDist);



      if (user?.id) {

        const existing = await localReviewRepository.getUserReviewForStory(story.id, user.id);

        setUserReview(existing);



        // Check votes

        const votedRevs: string[] = [];

        for (const r of storyReviews) {

          if (await localReviewRepository.hasUserVoted(r.id, user.id)) {

            votedRevs.push(r.id);

          }

        }

        setVotedReviewIds(votedRevs);



        const votedCmts: string[] = [];

        for (const c of storyComments) {

          if (await apiCommentRepository.hasUserVoted(c.id, user.id)) {

            votedCmts.push(c.id);

          }

          if (c.replies) {

            for (const reply of c.replies) {

              if (await apiCommentRepository.hasUserVoted(reply.id, user.id)) {

                votedCmts.push(reply.id);

              }

            }

          }

        }

        setVotedCommentIds(votedCmts);

      } else {

        setUserReview(null);

        setVotedReviewIds([]);

        setVotedCommentIds([]);

      }



      // Check eligibility

      const el = EligibilityService.checkEligibility(

        story.id,

        user?.id || null,

        story.totalDurationSeconds,

        listeningProgressMap,

        listeningHistory

      );

      setEligibility(el);

    } catch (e) {

      console.error('[StoryDetailView] Failed loading reviews & comments', e);

    } finally {

      setIsLoadingReviews(false);

      setIsLoadingComments(false);

    }

  }, [story?.id, story?.totalDurationSeconds, user?.id, listeningProgressMap, listeningHistory]);



  useEffect(() => {

    refreshData();

  }, [refreshData]);



  // Update eligibility when story or user changes

  useEffect(() => {

    if (story) {

      const el = EligibilityService.checkEligibility(

        story.id,

        user?.id || null,

        story.totalDurationSeconds,

        listeningProgressMap,

        listeningHistory

      );

      setEligibility(el);

    }

  }, [story?.id, story?.totalDurationSeconds, user?.id, listeningProgressMap, listeningHistory]);



  // HANDLERS - MUST BE BEFORE ANY CONDITIONAL RETURNS

  const handleAddChapterToPlaylist = (chapter: any) => {
    console.log('[StoryDetailView] handleAddChapterToPlaylist called with chapter:', chapter);
    if (!chapter) {
      console.error('[StoryDetailView] Chapter is undefined');
      showToast('error', 'Lỗi', 'Không tìm thấy tập audio để thêm vào danh sách');
      return;
    }
    setSelectedChapterForPlaylist(chapter);
    setIsPlaylistMenuOpen(true);
  };



  // NOW CONDITIONAL RETURN IS ALLOWED

  if (!story) {

    return (

      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">

        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-500">

          <Sparkles className="w-10 h-10" />

        </div>

        <h2 className="text-2xl font-bold text-white">Không tìm thấy truyện</h2>

        <p className="text-slate-400 max-w-md">Xin lỗi, chúng tôi không tìm thấy tác phẩm audio mà bạn đang tìm kiếm hoặc nội dung này đã bị gỡ bỏ.</p>

        <button

          onClick={() => navigate('/explore')}

          className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all hover:bg-cyan-400"

        >

          Khám phá truyện khác

        </button>

      </div>

    );

  }



  // Handle Submit Review (Create / Edit)

  const handleSubmitReview = async (data: {

    rating: number;

    title?: string;

    content?: string;

    hasSpoiler: boolean;

  }) => {

    if (!user || !isAuthenticated) {

      navigate('/login');

      return;

    }



    await localReviewRepository.saveReview({

      id: userReview?.id,

      storyId: story.id,

      userId: user.id,

      userName: user.name || user.email.split('@')[0],

      userAvatar: user.avatarUrl,

      rating: data.rating,

      title: data.title,

      content: data.content,

      hasSpoiler: data.hasSpoiler,

      verifiedListener: eligibility.verifiedListener,

    });



    await refreshData();

  };



  // Handle Vote Review Helpful

  const handleVoteReviewHelpful = async (reviewId: string) => {

    if (!user || !isAuthenticated) {

      alert('Vui lòng đăng nhập để đánh giá bài viết hữu ích!');

      navigate('/login');

      return;

    }



    await localReviewRepository.voteHelpful(reviewId, user.id);

    await refreshData();

  };



  // Handle Delete Review

  const handleDeleteReview = (reviewId: string) => {

    if (!user) return;

    setConfirmModal({

      isOpen: true,

      title: 'Xác nhận xóa đánh giá',

      message: 'Bạn có chắc chắn muốn xóa bài đánh giá này? Thao tác này không thể hoàn tác.',

      onConfirm: async () => {

        await localReviewRepository.deleteReview(reviewId, user.id);

        await refreshData();

      },

    });

  };



  // Handle Add Comment

  const handleAddComment = async (content: string, hasSpoiler: boolean, parentId?: string | null) => {

    if (!user || !isAuthenticated) {

      navigate('/login');

      return;

    }



    await apiCommentRepository.addComment({

      storyId: story.id,

      userId: user.id,

      userName: user.name || user.email.split('@')[0],

      userAvatar: user.avatarUrl,

      verifiedListener: eligibility.verifiedListener,

      content,

      hasSpoiler,

      parentId,

    });



    await refreshData();

  };



  // Handle Edit Comment

  const handleEditComment = async (commentId: string, content: string, hasSpoiler?: boolean) => {

    if (!user) return;

    await apiCommentRepository.editComment(commentId, user.id, content, hasSpoiler);

    await refreshData();

  };



  // Handle Delete Comment

  const handleDeleteComment = async (commentId: string) => {

    if (!user) return;

    setConfirmModal({

      isOpen: true,

      title: 'Xác nhận xóa bình luận',

      message: 'Bạn có chắc chắn muốn xóa bình luận này? Tất cả phản hồi liên quan cũng sẽ bị gỡ bỏ.',

      onConfirm: async () => {

        await apiCommentRepository.deleteComment(commentId, user.id);

        await refreshData();

      },

    });

  };



  // Handle Vote Comment Helpful

  const handleVoteCommentHelpful = async (commentId: string) => {

    if (!user || !isAuthenticated) {

      alert('Vui lòng đăng nhập để bình chọn hữu ích!');

      navigate('/login');

      return;

    }



    await apiCommentRepository.voteHelpful(commentId, user.id);

    await refreshData();

  };



  // Handle Report Modal Open

  const handleReportOpen = (targetType: 'Bình luận', targetId: string) => {

    setReportModal({

      isOpen: true,

      targetType,

      targetId,

    });

  };



  const handleReportSubmit = (reason: ReportReason, details: string) => {

    console.log(`[ReportSubmitted] Type: ${reportModal.targetType}, ID: ${reportModal.targetId}, Reason: ${reason}, Details: ${details}`);

  };



  const handleUnlockChapter = (chapterId: string) => {

    navigate('/premium');

  };



  const formatTime = (secs: number) => {

    const mins = Math.floor(secs / 60);

    const remainder = Math.floor(secs % 60);

    return `${mins}:${remainder.toString().padStart(2, '0')}`;

  };



  const handlePlayChapter = async (chapter: any, startPos?: number) => {

    if (!chapter) {

      console.error('[StoryDetailView] handlePlayChapter called with undefined chapter');

      showToast('error', 'Lỗi', 'Không tìm thấy tập audio');

      return;

    }

    const success = await playChapter(story, chapter, startPos);

    if (success) {

      const storyIdentifier = story.slug || story.id;
      navigate(`/listen/${storyIdentifier}/${chapter.id}`);

    }

  };



  

  const handleStartListening = async () => {

    const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === story.id);

    progresses.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const progress = progresses[0];

    

    if (progress) {

      const chapter = story.chapters.find((c: any) => c.id === progress.chapterId) || story.chapters[0];

      if (chapter) {

        handlePlayChapter(chapter);

      } else {

        showToast('error', 'Lỗi', 'Không tìm thấy tập audio');

      }

    } else {

      // For video stories, prioritize chapter with iframe (usually Chapter 1)

      let targetChapter = story.chapters[0];

      if (story.isVideoStory || story.iframeCode || story.iframeUrl) {

        targetChapter = story.chapters.find((c: any) => c.iframeCode || c.videoIframeUrl || c.iframeUrl) || story.chapters[0];

      }

      

      if (targetChapter) {

        handlePlayChapter(targetChapter);

      } else if (story.isVideoStory || story.iframeCode || story.iframeUrl) {

        // Story has iframe but no chapters in local cache

        // Backend already creates Chapter 1 from iframe when admin creates story

        // So just try to play by creating temp chapter from story's iframe data

        const tempChapter = {

          id: `temp-${story.id}`,

          storyId: story.id,

          number: 1,

          title: `Tập 1: ${story.title}`,

          slug: `${story.slug}-tap-1`,

          videoIframeUrl: story.iframeUrl,

          iframeCode: story.iframeCode,

          durationSeconds: 1800,

          accessLevel: 'FREE',

          publishStatus: 'PUBLISHED',

        };

        handlePlayChapter(tempChapter);

      } else {

        showToast('error', 'Lỗi', 'Truyện này chưa có tập audio');

      }

    }

  };



  const handleShare = async () => {

    if (!story) return;

    

    const shareData = {

      title: `${story.title} - TOP TRUYỆN AUDIO`,

      text: story.summary,

      url: window.location.href,

    };



    if (navigator.share) {

      try {

        await navigator.share(shareData);

      } catch (error) {

        if ((error as any).name !== 'AbortError') {

          showToast('error', 'Lỗi', 'Không thể chia sẻ liên kết');

        }

      }

    } else {

      try {

        await navigator.clipboard.writeText(shareData.url);

        showToast('success', 'Thành công', 'Đã sao chép liên kết chia sẻ');

      } catch (err) {

        showToast('error', 'Lỗi', 'Không thể sao chép liên kết');

      }

    }

  };



  return (

    <div className="animate-fadeIn">

      {/* Cinematic Story Hero */}

      <StoryHero

        story={story}

        isFavorite={isFav}

        onPlay={handleStartListening}

        onToggleFavorite={() => toggleFavorite(story.id)}

        onAddToPlaylist={() => handleAddChapterToPlaylist(story.chapters[0])}

        onShare={handleShare}

        averageRating={distribution?.averageRating}

        totalReviews={distribution?.totalReviews}

      />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">



        {/* Cốt Truyện & Nội Dung Âm Thanh */}

        {(story.audioContent || story.storyline) && (

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">

                  <Play className="w-5 h-5 fill-current" />

                </div>

                <div>

                  <h3 className="text-lg font-black text-white flex items-center gap-2">

                    Cốt Truyện & Nội Dung Âm Thanh

                  </h3>

                  <p className="text-xs text-slate-400 mt-0.5">

                    Theo dõi cốt truyện diễn biến và lời thoại nội dung âm thanh

                  </p>

                </div>

              </div>

            </div>



            {/* Cốt Truyện (Mô tả) & Nội Dung Âm Thanh */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

              {/* Cốt Truyện (Mô tả) */}

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-3">

                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">

                  <Sparkles className="w-4 h-4" /> Cốt Truyện Diễn Biến (Mô Tả)

                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">

                  {story.storyline || story.summary || 'Chưa có cốt truyện chi tiết.'}

                </p>

              </div>



              {/* Nội Dung Âm Thanh & Lời Thoại Kịch Bản */}

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-3">

                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">

                  <MessageSquare className="w-4 h-4" /> Nội Dung Âm Thanh & Kịch Bản Lời Thoại

                </h4>

                <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 rounded-xl p-3 border border-slate-800/60 max-h-60 overflow-y-auto">

                  {story.audioContent || story.chapters[0]?.audioContent || 'Nội dung âm thanh và lời thoại kịch bản đã được trích xuất sẵn sàng.'}

                </p>

              </div>

            </div>

          </div>

        )}



        {/* Navigation Tabs Header */}

        <div className="flex border-b border-slate-800">

        <button

          onClick={() => setActiveTab('episodes')}

          className={`px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all min-h-[44px] ${

            activeTab === 'episodes'

              ? 'border-cyan-500 text-cyan-400'

              : 'border-transparent text-slate-400 hover:text-white'

          }`}

        >

          <ListMusic className="w-4 h-4" /> Danh Sách Tập Audio ({story.chapters.length})

        </button>



        <button

          onClick={() => setActiveTab('reviews')}

          className={`px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all min-h-[44px] ${

            activeTab === 'reviews'

              ? 'border-cyan-500 text-cyan-400'

              : 'border-transparent text-slate-400 hover:text-white'

          }`}

        >

          <MessageSquare className="w-4 h-4" /> Bình Luận ({comments.length})

        </button>

      </div>



      {/* Episodes Tab */}

      {activeTab === 'episodes' && (

        <div className="space-y-8">

          <div className="space-y-2.5">

            {story.chapters.map((chapter: any) => {

              const isPremiumChapter = chapter.accessLevel === 'PREMIUM';

              const userIsPremium = user?.membership?.tier === 'PREMIUM';

              const isUnlocked = !isPremiumChapter || userIsPremium;

              

              return (

                <div

                  key={chapter.id}

                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"

                >

                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0">

                      {chapter.number}

                    </div>

                    <div className="min-w-0 flex-1">

                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{chapter.title}</h4>

                      <p className="text-[11px] text-slate-400">Giọng đọc: {chapter.narrator || story.narratorName}</p>

                    </div>

                  </div>



                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">

                    <span className="text-xs font-mono text-slate-400">

                      {formatTime(chapter.durationSeconds)}

                    </span>



                    {isUnlocked ? (

                      (() => {

                        const pk = user?.id ? createProgressKey(user.id, chapter.id) : chapter.id;

                        const chapterProg = listeningProgressMap[pk] || listeningProgressMap[chapter.id];

                        return chapterProg?.chapterId === chapter.id && chapterProg?.positionSeconds > 5 && !chapterProg?.completed ? (

                          <div className="flex items-center gap-2">

                            <button

                              onClick={() => handlePlayChapter(chapter)}

                              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center gap-1.5 transition-all min-h-[40px]"

                            >

                              <Play className="w-3.5 h-3.5 fill-current" /> Nghe tiếp từ {formatTime(chapterProg?.positionSeconds || 0)}

                            </button>

                            <button

                              onClick={() => handlePlayChapter(chapter, 0)}

                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all min-h-[40px]"

                            >

                              <Play className="w-3.5 h-3.5 fill-current" /> Nghe lại

                            </button>

                          </div>

                        ) : (

                          <button

                            onClick={() => handlePlayChapter(chapter, 0)}

                            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center gap-1.5 transition-all min-h-[40px]"

                          >

                            <Play className="w-3.5 h-3.5 fill-current" /> Phát Audio

                          </button>

                        );

                      })()

                    ) : (

                      <button

                        onClick={() => handleUnlockChapter(chapter.id)}

                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition-all min-h-[40px]"

                      >

                        <Crown className="w-3.5 h-3.5" /> Nâng cấp Premium {chapter.accessLevel === 'PREMIUM' ? 'Premium' : ''}

                      </button>

                    )}

                  </div>

                </div>

              );

            })}

          </div>



          {/* DANH SÁCH PHIM & TRUYỆN GỢI Ý THEO CHỦ ĐỀ, THỂ LOẠI (HIỂN THỊ BÊN DƯỚI DANH SÁCH TẬP) */}

          {relatedStories.length > 0 && (

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 pt-6">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">

                <div className="flex items-center gap-3">

                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">

                    <Sparkles className="w-5 h-5" />

                  </div>

                  <div>

                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">

                      Gợi Ý Theo Chủ Đề & Thể Loại

                      {selectedFilterGenre && (

                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold uppercase">

                          {selectedFilterGenre === 'VIDEO_STORY' ? 'Phim & Video HD' : selectedFilterGenre}

                        </span>

                      )}

                    </h3>

                    <p className="text-xs text-slate-400 mt-0.5">

                      Khám phá các truyện & phim lồng tiếng cùng thể loại {(story.genres || []).join(', ')} khuyên nghe

                    </p>

                  </div>

                </div>



                {/* Genre & Topic Filter Buttons */}

                <div className="flex items-center gap-1.5 flex-wrap">

                  <button

                    onClick={() => setSelectedFilterGenre(null)}

                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${

                      selectedFilterGenre === null

                        ? 'bg-cyan-500 text-slate-950 shadow-md'

                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'

                    }`}

                  >

                    Tất cả ({relatedStories.length})

                  </button>

                  {(story.genres || []).map((genre: any) => (

                    <button

                      key={genre.id}

                      onClick={() => setSelectedFilterGenre(selectedFilterGenre === genre.name ? null : genre.name)}

                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${

                        selectedFilterGenre === genre.name

                          ? 'bg-cyan-500 text-slate-950 shadow-md'

                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'

                      }`}

                    >

                      {genre.name}

                    </button>

                  ))}

                  {relatedStories.some((s) => s.isVideoStory) && (

                    <button

                      onClick={() => setSelectedFilterGenre(selectedFilterGenre === 'VIDEO_STORY' ? null : 'VIDEO_STORY')}

                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${

                        selectedFilterGenre === 'VIDEO_STORY'

                          ? 'bg-rose-500 text-white shadow-md'

                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'

                      }`}

                    >

                      <Film className="w-3.5 h-3.5" /> Phim & Video HD

                    </button>

                  )}

                </div>

              </div>



              {/* Recommended Stories Rail */}

              <HorizontalStoryRail>

                {filteredRelatedStories.map((item) => (

                  <div key={item.id} className="w-48 sm:w-56 shrink-0 snap-start">

                    <StoryCard story={item} />

                  </div>

                ))}

              </HorizontalStoryRail>

            </div>

          )}

        </div>

      )}



      {/* Comments Full Tab */}

      {activeTab === 'reviews' && (

        <div className="space-y-6 sm:space-y-8 w-full">

          {/* Section 6: Comment Section */}

          <CommentSection

            comments={comments}

            currentUserId={user?.id}

            currentUserName={user?.name}

            currentUserAvatar={user?.avatarUrl}

            isEligible={isAuthenticated && eligibility.canComment}

            votedCommentIds={votedCommentIds}

            isLoading={isLoadingComments}

            onAddComment={handleAddComment}

            onEditComment={handleEditComment}

            onDeleteComment={handleDeleteComment}

            onVoteHelpful={handleVoteCommentHelpful}

            onReportComment={(cmtId) => handleReportOpen('Bình luận', cmtId)}

          />

        </div>

      )}



      {/* Section 9: Confirm Modal */}

      <ConfirmModal

        isOpen={confirmModal.isOpen}

        title={confirmModal.title}

        message={confirmModal.message}

        onConfirm={confirmModal.onConfirm}

        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}

      />



      {/* Section 9: Report Modal */}

      <ReportModal

        isOpen={reportModal.isOpen}

        targetType={reportModal.targetType}

        onClose={() => setReportModal({ ...reportModal, isOpen: false })}

        onSubmitReport={handleReportSubmit}

      />

      

      {isPlaylistMenuOpen && selectedChapterForPlaylist && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsPlaylistMenuOpen(false)} />

          <div className="relative animate-slideUpAndFade">

            <AddToPlaylistMenu

              storyId={story.id}

              chapterId={selectedChapterForPlaylist.id}

              onClose={() => setIsPlaylistMenuOpen(false)}

              onSuccess={(playlistName) => {

                showToast('success', 'Đã thêm vào danh sách', `Tập audio đã được thêm vào "${playlistName}"`);

              }}

            />

          </div>

        </div>

      )}



      </div>

    </div>

  );

};

