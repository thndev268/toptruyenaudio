import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { GoogleGenAI } from "@google/genai";
import { badgeServerStore } from "./server/badge-store";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for JSON and form data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Gemini AI SDK
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Health check for the root server (BEFORE PROXY)
  app.get("/api/health-check", (req, res) => {
    res.json({ status: "root-server-ok", geminiConfigured: !!geminiApiKey });
  });

  // Video Player & Iframe CSS Settings Storage
  let videoSettings = {
    showIframeByDefault: false,
    hideIframeWithCSS: true,
    allowUserToggleIframe: true,
    autoPlayVideo: false,
  };

  let customStoriesStore: any[] = [];
  let customGenresStore: any[] = [];

  // Genres REST API Endpoints
  app.get("/api/genres", (req, res) => {
    res.json({ success: true, genres: customGenresStore });
  });

  app.post("/api/genres", (req, res) => {
    const { genres } = req.body;
    if (Array.isArray(genres)) {
      customGenresStore = genres;
      return res.json({ success: true, count: genres.length, message: `Đã lưu ${genres.length} thể loại.` });
    }
    res.status(400).json({ error: "Thừa tham số thể loại" });
  });

  // Video Settings Endpoint
  app.get("/api/video-settings", (req, res) => {
    res.json({ success: true, settings: videoSettings });
  });

  app.post("/api/video-settings", (req, res) => {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      videoSettings = { ...videoSettings, ...settings };
    }
    res.json({ success: true, settings: videoSettings, message: "Đã cập nhật cấu hình khung Video Iframe thành công." });
  });

  // Stories REST API Endpoints
  app.get("/api/stories", (req, res) => {
    res.json({ success: true, stories: customStoriesStore });
  });

  app.post("/api/stories", (req, res) => {
    const { story, stories } = req.body;
    if (Array.isArray(stories)) {
      customStoriesStore = [...customStoriesStore, ...stories];
      return res.json({ success: true, count: stories.length, message: `Đã lưu ${stories.length} bộ truyện/video.` });
    }
    if (story && story.id) {
      const idx = customStoriesStore.findIndex((s: any) => s.id === story.id);
      if (idx !== -1) {
        customStoriesStore[idx] = { ...customStoriesStore[idx], ...story };
      } else {
        customStoriesStore.push(story);
      }
      return res.json({ success: true, story, message: "Đã lưu bộ truyện thành công." });
    }
    res.status(400).json({ error: "Thừa tham số truyện" });
  });

  app.delete("/api/stories/:id", (req, res) => {
    const { id } = req.params;
    customStoriesStore = customStoriesStore.filter((s: any) => s.id !== id);
    res.json({ success: true, message: "Đã xóa truyện thành công." });
  });

  // AI Video Analysis Endpoint - Extract Title, Thumbnail, Storyline, and Audio Content from Iframes/URLs
  app.post("/api/analyze-video", async (req, res) => {
    try {
      const { iframeInput } = req.body;
      if (!iframeInput || typeof iframeInput !== 'string') {
        return res.status(400).json({ error: "Thừa tham số iframeInput" });
      }

      // Extract iframe tags or links line by line
      const lines = iframeInput.split(/\n+/).map(l => l.trim()).filter(Boolean);
      // Group iframe blocks or URLs
      const iframeMatches = iframeInput.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>.*?<\/iframe>|<iframe[^>]*src=["']([^"']+)["'][^>]*\/>/gi) 
        || iframeInput.match(/https?:\/\/[^\s"']+/gi)
        || [iframeInput];

      const itemsToAnalyze = Array.from(new Set(iframeMatches)).slice(0, 10); // Max 10 per batch

      const results = [];

      for (let index = 0; index < itemsToAnalyze.length; index++) {
        const itemStr = itemsToAnalyze[index];

        // Extract src URL
        let srcUrl = '';
        const srcMatch = itemStr.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          srcUrl = srcMatch[1];
        } else if (itemStr.startsWith('http')) {
          srcUrl = itemStr;
        }

        // Check Youtube Video ID
        let youtubeId = '';
        const ytMatch = (srcUrl || itemStr).match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch) {
          youtubeId = ytMatch[1];
        }

        // Default thumbnail
        let thumbnail = youtubeId 
          ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
          : `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80`;

        // Default iframe code
        let iframeCode = itemStr.includes('<iframe') 
          ? itemStr 
          : `<iframe width="100%" height="450" src="${youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : srcUrl}" title="Video Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;

        let embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : srcUrl;

        // Call Gemini AI if API Key is configured
        let aiExtracted = null;
        if (geminiApiKey) {
          try {
            const prompt = `Bạn là trợ lý biên tập video & audio truyện chuyên nghiệp. Hãy phân tích mã iframe/kịch bản video sau:
Mã/Link: "${itemStr}"
Youtube ID (nếu có): "${youtubeId}"

Hãy suy luận hoặc sáng tạo nội dung tiêu đề, cốt truyện, và nội dung âm thanh phù hợp nhất bằng tiếng Việt cho video truyện này.
Yêu cầu trả về đúng duy nhất định dạng JSON thuần không có bọc markdown codeblock:
{
  "title": "Tiêu đề video/truyện hấp dẫn, đầy đủ tên truyện và tập",
  "summary": "Cốt truyện chi tiết của video (mô tả bối cảnh, tuyến nhân vật chính, mâu thuẫn chính và diễn biến câu chuyện)",
  "content": "Nội dung âm thanh kịch bản/lời thoại/transcript chi tiết phát trong video để khán giả theo dõi và nghe đọc",
  "authorName": "Tên tác giả/Kênh sản xuất",
  "narratorName": "Tên giọng đọc MC",
  "genres": ["Truyện Video", "Kinh Dị", "Tiên Hiệp"]
}`;

            const response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json"
              }
            });

            if (response.text) {
              const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              aiExtracted = JSON.parse(cleanText);
            }
          } catch (aiErr) {
            console.error("Gemini AI Video Analysis Error:", aiErr);
          }
        }

        // Fallback default structure if AI didn't return
        const finalTitle = aiExtracted?.title || `Truyện Audio Video #${index + 1}${youtubeId ? ` (${youtubeId})` : ''}`;
        const finalSummary = aiExtracted?.summary || `Cốt truyện hấp dẫn của video story #${index + 1}. Câu chuyện xoay quanh những tình tiết kịch tính, lôi cuốn người nghe qua từng phân cảnh hình ảnh và âm thanh sống động.`;
        const finalContent = aiExtracted?.content || `Nội dung âm thanh & lời thoại chi tiết của tập video #${index + 1}:\n- Cảnh 1: Mở đầu không gian huyền bí...\n- Cảnh 2: Nhân vật xuất hiện và lời thuyết minh trọn vẹn...\n- Cảnh 3: Cao trào câu chuyện và những thông điệp giàu cảm xúc.`;
        const finalAuthor = aiExtracted?.authorName || 'Kênh Video Studio';
        const finalNarrator = aiExtracted?.narratorName || 'Giọng Đọc AI Pro';
        const finalGenres = Array.isArray(aiExtracted?.genres) && aiExtracted.genres.length ? aiExtracted.genres : ['Truyện Video', 'Sách Nói & Radio Kỹ Năng'];

        results.push({
          id: `video-story-${Date.now()}-${index}`,
          title: finalTitle,
          summary: finalSummary, // cốt truyện
          content: finalContent, // nội dung âm thanh
          coverUrl: thumbnail, // ảnh thumbnail
          iframeUrl: embedUrl,
          iframeCode: iframeCode,
          authorName: finalAuthor,
          narratorName: finalNarrator,
          genres: finalGenres,
          storyStatus: 'COMPLETED',
          publishStatus: 'PUBLISHED',
          accessLevel: 'FREE',
          listenCount: Math.floor(Math.random() * 2000) + 500,
          rating: 4.9,
          totalChapters: 1,
          totalDurationSeconds: 1800,
          publishedAt: new Date().toISOString().split('T')[0],
          isVideoStory: true,
        });
      }

      res.json({ success: true, count: results.length, data: results });
    } catch (error: any) {
      console.error("Error analyzing video iframe:", error);
      res.status(500).json({ error: error.message || "Lỗi xử lý phân tích video" });
    }
  });

  // ==========================================
  // BADGE SYSTEM REST APIS (REST FULL-STACK)
  // ==========================================

  // Get current user's badges
  app.get("/api/me/badges", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'user-1';
      const badges = badgeServerStore.getUserBadges(userId);
      res.json({ success: true, badges });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Lỗi tải danh hiệu người dùng" });
    }
  });

  // Update badge visibility (PUBLIC / PRIVATE)
  app.patch("/api/me/badges/:assignmentId/visibility", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user-1';
      const { assignmentId } = req.params;
      const { visibility } = req.body;
      if (visibility !== 'PUBLIC' && visibility !== 'PRIVATE') {
        return res.status(400).json({ error: "Trạng thái hiển thị không hợp lệ. Phải là PUBLIC hoặc PRIVATE." });
      }
      const updated = badgeServerStore.setVisibility(userId, assignmentId, visibility);
      res.json({ success: true, assignment: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Không thể cập nhật trạng thái hiển thị" });
    }
  });

  // Set/unset featured badge
  app.patch("/api/me/badges/:assignmentId/featured", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user-1';
      const { assignmentId } = req.params;
      const { isFeatured } = req.body;
      badgeServerStore.setFeatured(userId, isFeatured ? assignmentId : null);
      res.json({ success: true, isFeatured });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Không thể cập nhật danh hiệu nổi bật" });
    }
  });

  // Get user notifications
  app.get("/api/me/badge-notifications", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'user-1';
      const notifications = badgeServerStore.getUserNotifications(userId);
      res.json({ success: true, notifications });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Lỗi tải thông báo danh hiệu" });
    }
  });

  // Mark notification read
  app.patch("/api/me/badge-notifications/:notificationId/read", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user-1';
      const { notificationId } = req.params;
      badgeServerStore.markNotificationRead(userId, notificationId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mark toast shown
  app.patch("/api/me/badge-notifications/:notificationId/toast-shown", (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user-1';
      const { notificationId } = req.params;
      badgeServerStore.markToastShown(userId, notificationId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Public user profile badges
  app.get("/api/users/:userId/badges", (req, res) => {
    try {
      const { userId } = req.params;
      const badges = badgeServerStore.getPublicUserBadges(userId);
      const featured = badgeServerStore.getFeaturedBadge(userId);
      res.json({ success: true, badges, featuredBadge: featured });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Lỗi tải danh hiệu công khai" });
    }
  });

  // Record user event & auto-evaluate badges
  app.post("/api/me/badge-events/record", async (req, res) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'user-1';
      const { eventType, incrementValue } = req.body;
      if (!eventType) {
        return res.status(400).json({ error: "Thiếu eventType" });
      }
      const newlyAwarded = await badgeServerStore.recordEvent(userId, eventType, incrementValue || 1);
      res.json({ success: true, count: newlyAwarded.length, newlyAwarded });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Lỗi ghi nhận sự kiện danh hiệu" });
    }
  });

  // ADMIN APIS
  // Get all badge definitions
  app.get("/api/admin/badges", (req, res) => {
    try {
      const status = req.query.status as any;
      const badges = badgeServerStore.getBadges(status);
      res.json({ success: true, badges });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create badge definition
  app.post("/api/admin/badges", (req, res) => {
    try {
      const badgeData = req.body;
      const newBadge = badgeServerStore.createBadge(badgeData);
      res.json({ success: true, badge: newBadge });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update badge definition
  app.patch("/api/admin/badges/:badgeId", (req, res) => {
    try {
      const { badgeId } = req.params;
      const updates = req.body;
      const updated = badgeServerStore.updateBadge(badgeId, updates);
      res.json({ success: true, badge: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete badge definition
  app.delete("/api/admin/badges/:badgeId", (req, res) => {
    try {
      const { badgeId } = req.params;
      badgeServerStore.deleteBadge(badgeId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Assign badge to user
  app.post("/api/admin/users/:userId/badges", (req, res) => {
    try {
      const { userId } = req.params;
      const { badgeId, internalNote } = req.body;
      const adminId = (req.headers['x-admin-id'] as string) || 'admin-1';
      
      if (!badgeId) {
        return res.status(400).json({ error: "Thiếu thông tin badgeId" });
      }

      const assignment = badgeServerStore.assignBadge(userId, badgeId, 'ADMIN', adminId, internalNote);
      res.json({ success: true, assignment, message: "Gán danh hiệu thành công!" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Không thể gán danh hiệu." });
    }
  });

  // Revoke badge from user
  app.delete("/api/admin/users/:userId/badges/:badgeId", (req, res) => {
    try {
      const { userId, badgeId } = req.params;
      const { revokeReason } = req.body;
      const adminId = (req.headers['x-admin-id'] as string) || 'admin-1';

      if (!revokeReason || !revokeReason.trim()) {
        return res.status(400).json({ error: "Bắt buộc nhập lý do thu hồi danh hiệu." });
      }

      badgeServerStore.revokeBadge(userId, badgeId, adminId, revokeReason);
      res.json({ success: true, message: "Thu hồi danh hiệu thành công!" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Không thể thu hồi danh hiệu." });
    }
  });

  // Get custom event definitions
  app.get("/api/admin/badge-events", (req, res) => {
    try {
      const events = badgeServerStore.getEventDefinitions();
      res.json({ success: true, events });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create custom event definition
  app.post("/api/admin/badge-events", (req, res) => {
    try {
      const eventData = req.body;
      const newDef = badgeServerStore.createEventDefinition(eventData);
      res.json({ success: true, event: newDef });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update event definition
  app.patch("/api/admin/badge-events/:eventId", (req, res) => {
    try {
      const { eventId } = req.params;
      const updates = req.body;
      const updated = badgeServerStore.updateEventDefinition(eventId, updates);
      res.json({ success: true, event: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get audit logs
  app.get("/api/admin/badge-audit-logs", (req, res) => {
    try {
      const userId = req.query.userId as string;
      const logs = badgeServerStore.getAuditLogs(userId);
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API routes proxy to NestJS (if running on 3001)
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(502).json({ error: 'Backend server is not reachable' });
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), 'story-platform/frontend'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Main Entry Server running on http://localhost:${PORT}`);
  });
}

startServer();
