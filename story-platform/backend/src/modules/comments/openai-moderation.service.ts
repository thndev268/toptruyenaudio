import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface ModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    violence: boolean;
    sexualMinors: boolean;
    hateThreatening: boolean;
    violenceGraphic: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    harassmentThreatening: boolean;
  };
  categoryScores: {
    sexual: number;
    hate: number;
    harassment: number;
    selfHarm: number;
    violence: number;
    sexualMinors: number;
    hateThreatening: number;
    violenceGraphic: number;
    selfHarmIntent: number;
    selfHarmInstructions: number;
    harassmentThreatening: number;
  };
  detectedCategories: string[];
}

@Injectable()
export class OpenAIModerationService {
  private readonly logger = new Logger(OpenAIModerationService.name);
  private openai: OpenAI | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    const enabled = process.env.OPENAI_MODERATION_ENABLED === 'true';

    if (enabled && apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.enabled = true;
        this.logger.log('OpenAI Moderation Service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize OpenAI Moderation Service:', error);
        this.enabled = false;
      }
    } else {
      this.logger.warn('OpenAI Moderation Service is disabled or API key not found');
      this.enabled = false;
    }
  }

  /**
   * Kiểm tra nội dung có vi phạm quy định không
   */
  async moderateContent(content: string): Promise<ModerationResult> {
    if (!this.enabled || !this.openai) {
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          sexualMinors: false,
          hateThreatening: false,
          violenceGraphic: false,
          selfHarmIntent: false,
          selfHarmInstructions: false,
          harassmentThreatening: false,
        },
        categoryScores: {
          sexual: 0,
          hate: 0,
          harassment: 0,
          selfHarm: 0,
          violence: 0,
          sexualMinors: 0,
          hateThreatening: 0,
          violenceGraphic: 0,
          selfHarmIntent: 0,
          selfHarmInstructions: 0,
          harassmentThreatening: 0,
        },
        detectedCategories: [],
      };
    }

    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];
      
      const detectedCategories: string[] = [];
      if (result.flagged) {
        if (result.categories.sexual) detectedCategories.push('sexual');
        if (result.categories.hate) detectedCategories.push('hate');
        if (result.categories.harassment) detectedCategories.push('harassment');
        if (result.categories['self-harm']) detectedCategories.push('self_harm');
        if (result.categories.violence) detectedCategories.push('violence');
        if (result.categories['sexual/minors']) detectedCategories.push('sexual_minors');
        if (result.categories['hate/threatening']) detectedCategories.push('hate_threatening');
        if (result.categories['violence/graphic']) detectedCategories.push('violence_graphic');
        if (result.categories['self-harm/intent']) detectedCategories.push('self_harm_intent');
        if (result.categories['self-harm/instructions']) detectedCategories.push('self_harm_instructions');
        if (result.categories['harassment/threatening']) detectedCategories.push('harassment_threatening');
      }

      return {
        flagged: result.flagged,
        categories: {
          sexual: result.categories.sexual,
          hate: result.categories.hate,
          harassment: result.categories.harassment,
          selfHarm: result.categories['self-harm'],
          violence: result.categories.violence,
          sexualMinors: result.categories['sexual/minors'],
          hateThreatening: result.categories['hate/threatening'],
          violenceGraphic: result.categories['violence/graphic'],
          selfHarmIntent: result.categories['self-harm/intent'],
          selfHarmInstructions: result.categories['self-harm/instructions'],
          harassmentThreatening: result.categories['harassment/threatening'],
        },
        categoryScores: {
          sexual: result.category_scores.sexual,
          hate: result.category_scores.hate,
          harassment: result.category_scores.harassment,
          selfHarm: result.category_scores['self-harm'],
          violence: result.category_scores.violence,
          sexualMinors: result.category_scores['sexual/minors'],
          hateThreatening: result.category_scores['hate/threatening'],
          violenceGraphic: result.category_scores['violence/graphic'],
          selfHarmIntent: result.category_scores['self-harm/intent'],
          selfHarmInstructions: result.category_scores['self-harm/instructions'],
          harassmentThreatening: result.category_scores['harassment/threatening'],
        },
        detectedCategories,
      };
    } catch (error) {
      this.logger.error('OpenAI Moderation API error:', error);
      // Nếu API lỗi, trả về không flag để không block user
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          sexualMinors: false,
          hateThreatening: false,
          violenceGraphic: false,
          selfHarmIntent: false,
          selfHarmInstructions: false,
          harassmentThreatening: false,
        },
        categoryScores: {
          sexual: 0,
          hate: 0,
          harassment: 0,
          selfHarm: 0,
          violence: 0,
          sexualMinors: 0,
          hateThreatening: 0,
          violenceGraphic: 0,
          selfHarmIntent: 0,
          selfHarmInstructions: 0,
          harassmentThreatening: 0,
        },
        detectedCategories: [],
      };
    }
  }

  /**
   * Kiểm tra nếu service có được bật không
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Bật/tắt service (cho admin)
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.logger.log(`OpenAI Moderation Service ${enabled ? 'enabled' : 'disabled'}`);
  }
}
