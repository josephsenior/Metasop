const fs = require('fs');

function removeDummy(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeDummy);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_dummy') continue;
      newObj[key] = removeDummy(value);
    }
    return newObj;
  }
  return obj;
}

const filePath = 'c:\\Users\\GIGABYTE\\Desktop\\MultiAGentPLatform\\orchestration-result.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const cleaned = removeDummy(data);

fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
console.log('Cleaned orchestration-result.json');
