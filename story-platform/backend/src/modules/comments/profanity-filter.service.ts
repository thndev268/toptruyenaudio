import { Injectable } from '@nestjs/common';

interface ProfanityResult {
  containsProfanity: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedWords: string[];
  filteredContent?: string;
}

@Injectable()
export class ProfanityFilterService {
  // Danh sách từ ngữ không phù hợp (có thể mở rộng)
  private profanityList: Set<string> = new Set([
    // Từ ngữ thô tục tiếng Việt (ví dụ)
    'đm', 'dm', 'địt', 'dit', 'đụ', 'du', 'lồn', 'lon', 'cặc', 'cak',
    'buồi', 'buoi', 'dái', 'dai', 'nứng', 'nung', 'ngu', 'ngu ngốc',
    'khốn', 'khon', 'đồ khốn', 'do khon', 'chó', 'cho', 'mẹ mày', 'me may',
    'bố mày', 'bo may', 'chết tiệt', 'chet tiet', 'đồ ăn mày', 'do an may',
    'đồ điếm', 'do diem', 'đĩ', 'di', 'phèn', 'phen', 'hèn', 'hen',
    'khất', 'khat', 'rau', 'rau mau', 'thằng', 'thang', 'con', 'con chó',
    'mẹ kiếp', 'me kiep', 'đồ ngu', 'do ngu', 'thằng ngu', 'thang ngu',
    'đồ chó', 'do cho', 'thằng chó', 'thang cho', 'đồ khùng', 'do khung',
    'thằng khùng', 'thang khung', 'đồ thần kinh', 'do than kinh',
    
    // Từ ngữ thô tục tiếng Anh (ví dụ)
    'fuck', 'shit', 'damn', 'bitch', 'bastard', 'ass', 'asshole',
    'dick', 'pussy', 'whore', 'slut', 'cunt', 'cock', 'bullshit',
    
    // Có thể thêm nhiều từ ngữ khác theo nhu cầu
  ]);

  // Danh sách từ ngữ nhạy cảm (cần cảnh báo nhưng không chặn ngay)
  private sensitiveWords: Set<string> = new Set([
    'chết', 'chet', 'giết', 'giet', 'đánh', 'danh', 'bạo lực', 'bau luc',
    'tử', 'tu', 'hủy', 'huy', 'tiêu diệt', 'tieu diet',
  ]);

  /**
   * Kiểm tra nội dung có chứa từ ngữ không phù hợp
   */
  checkProfanity(content: string): ProfanityResult {
    if (!content || content.trim().length === 0) {
      return {
        containsProfanity: false,
        severity: 'LOW',
        detectedWords: [],
      };
    }

    const lowerContent = content.toLowerCase();
    const detectedWords: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Kiểm tra từ ngữ thô tục
    for (const word of this.profanityList) {
      if (lowerContent.includes(word)) {
        detectedWords.push(word);
        severity = 'HIGH';
      }
    }

    // Kiểm tra từ ngữ nhạy cảm
    for (const word of this.sensitiveWords) {
      if (lowerContent.includes(word) && !detectedWords.includes(word)) {
        detectedWords.push(word);
        if (severity === 'LOW') {
          severity = 'MEDIUM';
        }
      }
    }

    // Lọc nội dung (thay thế bằng *)
    const filteredContent = this.filterContent(content, detectedWords);

    return {
      containsProfanity: detectedWords.length > 0,
      severity,
      detectedWords,
      filteredContent,
    };
  }

  /**
   * Lọc nội dung bằng cách thay thế từ ngữ không phù hợp bằng *
   */
  private filterContent(content: string, detectedWords: string[]): string {
    let filtered = content;
    
    for (const word of detectedWords) {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }
    
    return filtered;
  }

  /**
   * Thêm từ ngữ vào danh sách lọc (cho admin)
   */
  addProfanityWord(word: string): void {
    this.profanityList.add(word.toLowerCase());
  }

  /**
   * Xóa từ ngữ khỏi danh sách lọc (cho admin)
   */
  removeProfanityWord(word: string): void {
    this.profanityList.delete(word.toLowerCase());
  }

  /**
   * Lấy danh sách tất cả từ ngữ đang được lọc
   */
  getProfanityList(): string[] {
    return Array.from(this.profanityList);
  }
}
