import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateKnowledgeItemDto {
  categoryId: string;
  question: string;
  answer: string;
  keywords: string[];
  priority?: number;
  relatedStoryId?: string;
  relatedPlanId?: string;
}

export interface UpdateKnowledgeItemDto {
  categoryId?: string;
  question?: string;
  answer?: string;
  keywords?: string[];
  priority?: number;
  isActive?: boolean;
  relatedStoryId?: string;
  relatedPlanId?: string;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

@Injectable()
export class BotKnowledgeService {
  private readonly logger = new Logger(BotKnowledgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CATEGORY METHODS ====================

  async getCategories() {
    return this.prisma.botKnowledgeCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { knowledgeItems: true },
        },
      },
    });
  }

  async getCategoryById(id: string) {
    return this.prisma.botKnowledgeCategory.findUnique({
      where: { id },
      include: {
        knowledgeItems: {
          where: { isActive: true },
          orderBy: [{ priority: 'desc' }, { viewCount: 'desc' }],
        },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.botKnowledgeCategory.create({
      data: dto,
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.botKnowledgeCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.botKnowledgeCategory.delete({
      where: { id },
    });
  }

  // ==================== KNOWLEDGE ITEM METHODS ====================

  async getKnowledgeItems(categoryId?: string) {
    return this.prisma.botKnowledgeItem.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        relatedStory: {
          select: { id: true, title: true, slug: true },
        },
        relatedPlan: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { viewCount: 'desc' }],
    });
  }

  async getKnowledgeItemById(id: string) {
    return this.prisma.botKnowledgeItem.findUnique({
      where: { id },
      include: {
        category: true,
        relatedStory: true,
        relatedPlan: true,
      },
    });
  }

  async createKnowledgeItem(dto: CreateKnowledgeItemDto, createdBy?: string) {
    return this.prisma.botKnowledgeItem.create({
      data: {
        ...dto,
        createdBy,
      },
    });
  }

  async updateKnowledgeItem(id: string, dto: UpdateKnowledgeItemDto) {
    return this.prisma.botKnowledgeItem.update({
      where: { id },
      data: dto,
    });
  }

  async deleteKnowledgeItem(id: string) {
    return this.prisma.botKnowledgeItem.delete({
      where: { id },
    });
  }

  async incrementViewCount(id: string) {
    return this.prisma.botKnowledgeItem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementHelpfulCount(id: string) {
    return this.prisma.botKnowledgeItem.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  // ==================== SEARCH METHODS ====================

  /**
   * Tìm câu trả lời dựa trên tin nhắn của user
   * Sử dụng tìm kiếm bằng từ khóa và độ tương đồng
   */
  async findAnswer(userMessage: string) {
    // 1. Chuẩn hóa tin nhắn: lowercase, remove special chars
    const normalizedMessage = this.normalizeText(userMessage);
    const words = normalizedMessage.split(' ').filter(w => w.length > 2);

    this.logger.log(`[BotKnowledge] Searching for answer. Message: "${userMessage}"`);
    this.logger.log(`[BotKnowledge] Extracted words:`, words);

    if (words.length === 0) {
      return null;
    }

    // 2. Tìm tất cả knowledge items active
    const allItems = await this.prisma.botKnowledgeItem.findMany({
      where: { isActive: true },
      include: {
        category: true,
        relatedStory: {
          select: { id: true, title: true, slug: true },
        },
        relatedPlan: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // 3. Tính điểm tương đồng cho mỗi item
    const scoredItems = allItems.map(item => {
      const score = this.calculateSimilarityScore(normalizedMessage, item);
      return { ...item, score };
    });

    // 4. Lọc items có score > 0 và sắp xếp theo score
    const filteredItems = scoredItems
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    this.logger.log(`[BotKnowledge] Found ${filteredItems.length} matching items`);

    if (filteredItems.length === 0) {
      return null;
    }

    // 5. Lấy item có score cao nhất
    const bestMatch = filteredItems[0];

    // 6. Tăng viewCount
    await this.incrementViewCount(bestMatch.id);

    this.logger.log(`[BotKnowledge] Best match: ID=${bestMatch.id}, Score=${bestMatch.score}, Question="${bestMatch.question}"`);

    return bestMatch;
  }

  /**
   * Chuẩn hóa text: lowercase, remove special chars
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Keep only alphanumeric and spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Tính điểm tương đồng giữa message và knowledge item
   */
  private calculateSimilarityScore(message: string, item: any): number {
    let score = 0;
    const normalizedMessage = this.normalizeText(message);
    const normalizedQuestion = this.normalizeText(item.question);
    const normalizedAnswer = this.normalizeText(item.answer);

    // 1. Kiểm tra từ khóa chính xác (keywords array)
    if (item.keywords && item.keywords.length > 0) {
      const normalizedKeywords = item.keywords.map(k => this.normalizeText(k));
      for (const keyword of normalizedKeywords) {
        if (normalizedMessage.includes(keyword)) {
          score += 10; // 10 điểm cho mỗi keyword match
        }
      }
    }

    // 2. Kiểm tra từ trong câu hỏi
    const questionWords = normalizedQuestion.split(' ').filter(w => w.length > 2);
    const messageWords = normalizedMessage.split(' ').filter(w => w.length > 2);
    
    for (const word of messageWords) {
      if (questionWords.includes(word)) {
        score += 3; // 3 điểm cho mỗi từ match trong câu hỏi
      }
    }

    // 3. Kiểm tra từ trong câu trả lời
    const answerWords = normalizedAnswer.split(' ').filter(w => w.length > 2);
    for (const word of messageWords) {
      if (answerWords.includes(word)) {
        score += 1; // 1 điểm cho mỗi từ match trong câu trả lời
      }
    }

    // 4. Bonus cho priority
    score += item.priority * 0.1;

    // 5. Bonus cho viewCount (câu hỏi phổ biến)
    score += Math.log10(item.viewCount + 1) * 0.5;

    return score;
  }

  // ==================== STATISTICS ====================

  async getStatistics() {
    const [totalItems, totalCategories, topViewed, topHelpful] = await Promise.all([
      this.prisma.botKnowledgeItem.count({ where: { isActive: true } }),
      this.prisma.botKnowledgeCategory.count({ where: { isActive: true } }),
      this.prisma.botKnowledgeItem.findMany({
        where: { isActive: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: { category: true },
      }),
      this.prisma.botKnowledgeItem.findMany({
        where: { isActive: true },
        orderBy: { helpfulCount: 'desc' },
        take: 5,
        include: { category: true },
      }),
    ]);

    return {
      totalItems,
      totalCategories,
      topViewed,
      topHelpful,
    };
  }
}
