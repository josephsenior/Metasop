import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'components/artifacts/ui_design/sections/StrategySection.tsx');
if (fs.existsSync(file)) {
  fs.unlinkSync(file);
  console.log('Deleted StrategySection.tsx');
} else {
  console.log('File not found');
}
