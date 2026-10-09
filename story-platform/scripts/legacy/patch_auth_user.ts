import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/context/AuthContext.tsx', 'utf8');
if (!content.includes('honoraryTitles?:')) {
  // Add UserTitle to the import from '../types'
  content = content.replace(/import { UserRole } from '\.\.\/types';/, "import { UserRole, UserTitle } from '../types';");
  content = content.replace(/expiresAt\?: string;\n  };/, "expiresAt?: string;\n  };\n  honoraryTitles?: UserTitle[];");
  fs.writeFileSync('story-platform/frontend/src/context/AuthContext.tsx', content);
}
