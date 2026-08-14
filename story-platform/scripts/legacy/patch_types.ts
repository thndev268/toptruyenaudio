import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/types/index.ts', 'utf8');
if (!content.includes('HonoraryTitle')) {
  content = content + `\n
export interface TitleEffect {
  type: 'GLOW' | 'BORDER' | 'TEXT_COLOR' | 'SHINE' | 'ICON';
  color?: string;
  iconName?: string;
}

export interface HonoraryTitle {
  id: string;
  name: string;
  description: string;
  effects: TitleEffect[];
  createdAt: string;
  isActive: boolean;
}

export interface UserTitle {
  titleId: string;
  name: string;
  assignedAt: string;
  effects: TitleEffect[];
}
`;
  fs.writeFileSync('story-platform/frontend/src/types/index.ts', content);
}
