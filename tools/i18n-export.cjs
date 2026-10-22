/**
 * 导出待中文化的原文，按块拆成小文件，便于逐块翻译。
 * 用法：node tools/i18n-export.cjs
 * 输出：tools/i18n/summary-01.txt ... glossary-01.txt ... missing.txt
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'i18n');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const store = {};
const fakeLS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const node = () => ({ innerHTML: '', style: {}, appendChild() {}, addEventListener() {} });
const fakeDoc = { querySelector: () => node(), querySelectorAll: () => [], createElement: () => node(), addEventListener: () => {} };
global.window = global;
global.addEventListener = () => {};
global.document = fakeDoc;
global.localStorage = fakeLS;

['01-core.js', '02-curriculum-a.js', '03-curriculum-b.js', '04-catalog.js', '05-zh-titles.js', '06-zh-p19.js']
  .forEach((f) => {
    const code = fs.readFileSync(path.join(root, 'assets/js', f), 'utf8');
    new Function('window', 'document', 'localStorage', code)(global, fakeDoc, fakeLS);
  });

const AAM = global.AAM;
const hasHan = (s) => /[一-龥]/.test(String(s || ''));
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

/* 1) 课程摘要 */
const lessons = AAM.allLessons().filter((l) => l.s && !hasHan(l.s));
chunk(lessons, 60).forEach((part, i) => {
  const body = part.map((l) => [
    l.id,
    String(l.s || '').replace(/\s+/g, ' ').trim(),
    String(l.k || '').replace(/\s+/g, ' ').trim()
  ].join('\t')).join('\n');
  fs.writeFileSync(path.join(outDir, 'summary-' + String(i + 1).padStart(2, '0') + '.txt'), body, 'utf8');
});
console.log('summary chunks: ' + Math.ceil(lessons.length / 60) + '  (total ' + lessons.length + ')');

/* 2) 缺中文标题 */
const missTitle = AAM.allLessons().filter((l) => !hasHan(l.zh));
fs.writeFileSync(path.join(outDir, 'missing-title.txt'),
  missTitle.map((l) => l.id + '\t' + l.en + '\t' + String(l.s || '').replace(/\s+/g, ' ').trim()).join('\n'), 'utf8');
console.log('missing titles: ' + missTitle.length);

/* 3) Phase 英文描述 */
const missPhase = AAM.phases().filter((p) => !hasHan(p.desc) || !hasHan(p.descZh));
fs.writeFileSync(path.join(outDir, 'phase-desc.txt'),
  missPhase.map((p) => p.id + '\t' + p.en + '\t' + String(p.desc || '')).join('\n'), 'utf8');
console.log('phase desc: ' + missPhase.length);

/* 4) 术语表 */
const gl = (AAM.catalog.glossary || []).filter((g) => !hasHan(g.d));
chunk(gl, 60).forEach((part, i) => {
  const body = part.map((g) => g.t + '\t' + String(g.d).replace(/\s+/g, ' ').trim() + (g.w ? '\t[why] ' + String(g.w).replace(/\s+/g, ' ').trim() : '')).join('\n');
  fs.writeFileSync(path.join(outDir, 'glossary-' + String(i + 1).padStart(2, '0') + '.txt'), body, 'utf8');
});
console.log('glossary chunks: ' + Math.ceil(gl.length / 60) + '  (total ' + gl.length + ')');
