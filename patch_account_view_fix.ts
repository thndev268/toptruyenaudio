import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/components/views/AccountView.tsx', 'utf8');

content = content.replace(/require\('lucide-react'\)\[iconName\]/, '(Icons as any)[iconName]');
if (!content.includes('import * as Icons')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1 } from 'lucide-react';\nimport * as Icons from 'lucide-react';");
}

fs.writeFileSync('story-platform/frontend/src/components/views/AccountView.tsx', content);
