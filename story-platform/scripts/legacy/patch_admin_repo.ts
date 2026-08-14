import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/services/repositories/AdminRepository.ts', 'utf8');

// We need to add honoraryTitles to the repo.

if (!content.includes('honoraryTitles:')) {
  // Add import for HonoraryTitle if not there
  if (!content.includes('HonoraryTitle')) {
    content = content.replace(/from '\.\.\/\.\.\/types';/, " HonoraryTitle, TitleEffect, UserTitle } from '../../types';");
  }
  
  // Add some mock titles to a private variable
  const mockTitlesStr = `
  private honoraryTitles: HonoraryTitle[] = [
    {
      id: 'title-1',
      name: 'Fan Cứng Đời Đầu',
      description: 'Dành cho những thành viên tham gia từ ngày đầu',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      effects: [
        { type: 'TEXT_COLOR', color: 'text-amber-500' },
        { type: 'GLOW', color: 'shadow-amber-500/50' }
      ]
    },
    {
      id: 'title-2',
      name: 'Nhà Tài Trợ Vàng',
      description: 'Dành cho các nhà tài trợ hào phóng',
      isActive: true,
      createdAt: '2025-02-01T00:00:00Z',
      effects: [
        { type: 'TEXT_COLOR', color: 'text-yellow-400' },
        { type: 'ICON', iconName: 'Crown' }
      ]
    },
    {
      id: 'title-3',
      name: 'Chiến Thần Review',
      description: 'Dành cho những người thường xuyên viết review chất lượng',
      isActive: true,
      createdAt: '2025-03-01T00:00:00Z',
      effects: [
        { type: 'TEXT_COLOR', color: 'text-blue-500' },
        { type: 'BORDER', color: 'border-blue-500' }
      ]
    }
  ];

  getHonoraryTitles(): HonoraryTitle[] {
    return this.honoraryTitles;
  }

  saveHonoraryTitle(title: HonoraryTitle): void {
    const existingIndex = this.honoraryTitles.findIndex(t => t.id === title.id);
    if (existingIndex >= 0) {
      this.honoraryTitles[existingIndex] = title;
    } else {
      this.honoraryTitles.push(title);
    }
  }

  deleteHonoraryTitle(titleId: string): void {
    this.honoraryTitles = this.honoraryTitles.filter(t => t.id !== titleId);
  }

  assignTitleToUser(userId: string, titleId: string): void {
    const title = this.honoraryTitles.find(t => t.id === titleId);
    if (!title) return;
    
    const userIndex = this.mockUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      if (!this.mockUsers[userIndex].honoraryTitles) {
        this.mockUsers[userIndex].honoraryTitles = [];
      }
      
      const alreadyHas = this.mockUsers[userIndex].honoraryTitles!.find(t => t.titleId === titleId);
      if (!alreadyHas) {
        this.mockUsers[userIndex].honoraryTitles!.push({
          titleId: title.id,
          name: title.name,
          assignedAt: new Date().toISOString(),
          effects: title.effects
        });
      }
    }
  }

  removeTitleFromUser(userId: string, titleId: string): void {
    const userIndex = this.mockUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0 && this.mockUsers[userIndex].honoraryTitles) {
      this.mockUsers[userIndex].honoraryTitles = this.mockUsers[userIndex].honoraryTitles!.filter(t => t.titleId !== titleId);
    }
  }
  `;

  content = content.replace(/private videoSettings:/, mockTitlesStr + '\n  private videoSettings:');
  fs.writeFileSync('story-platform/frontend/src/services/repositories/AdminRepository.ts', content);
}
