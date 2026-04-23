const fs = require('fs');
const path = require('path');

const emojis = [];
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function findEmojisInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        let match;
        while ((match = emojiRegex.exec(line)) !== null) {
            emojis.push(`${filePath}:${index + 1}: ${line.trim()}`);
        }
    });
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'css' && file !== 'assets' && file !== 'scripts') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            findEmojisInFile(fullPath);
        }
    });
}

walkDir(__dirname);
fs.writeFileSync('emojis.txt', emojis.join('\n'));
