/**
 * 只扫描「界面代码」里的用户可见英文文案（排除纯数据文件）。
 * 用法：node tools/scan-ui-lang.cjs
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const targets = [
  'assets/js/01-core.js', 'assets/js/10-retriever.js', 'assets/js/11-tutor.js',
  'assets/js/12-recommend.js', 'assets/js/13-ui.js', 'assets/js/14-app.js',
  'assets/js/09-topics.js', 'assets/js/07-content-a.js', 'assets/js/08-content-b.js',
  'index.html', 'sw.js', 'manifest.webmanifest'
];

/* 允许保留的英文：代码标识符、CSS 类名、技术专名（可作中文括号注释） */
const allow = /^(use strict|manifest|sw\.js|index\.html|assets|icon|png|svg|json|webmanifest|AAM|AI|Agent|RAG|MCP|LLM|GPU|CPU|API|JSON|HTTP|HTTPS|GitHub|Pages|PWA|Nginx|COS|CDN|Safari|Android|iPhone|Wi-Fi|OpenAI|ChromaDB|ReAct|ReWOO|Reflexion|ToT|GoT|A2A|ACP|SSE|LoRA|QLoRA|RAGAS|BERT|GPT|TF-IDF|BM25|kNN|PCA|SVD|SQL|Python|Jupyter|Docker|Linux|Nginx)$/i;

let total = 0;
targets.forEach((rel) => {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  const src = fs.readFileSync(p, 'utf8');
  const out = [];
  const re = /'([^'\n]*)'|"([^"\n]*)"/g;
  let m;
  while ((m = re.exec(src))) {
    const s = (m[1] !== undefined ? m[1] : m[2]).trim();
    if (s.length < 3 || s.length > 80) continue;
    if (/[一-龥]/.test(s)) continue;
    if (!/[A-Za-z]/.test(s)) continue;
    if (/^[#.\/]|:\/\/|\.(js|css|png|json|html|webmanifest)$/.test(s)) continue;
    if (!/\s/.test(s)) continue;                 // 单词不算文案
    if (allow.test(s)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    out.push(line + ': ' + s);
  }
  if (out.length) {
    total += out.length;
    console.log('\n--- ' + rel + ' (' + out.length + ') ---');
    out.forEach((x) => console.log('  ' + x));
  }
});
console.log('\n界面层候选英文文案合计：' + total);
