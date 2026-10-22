/**
 * 语言扫描：统计项目里还有哪些“用户可见的非中文内容”。
 * 用法：node tools/scan-lang.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'assets/js');
const store = {};
const fakeLS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const node = () => ({ innerHTML: '', style: {}, appendChild() {}, remove() {}, addEventListener() {}, focus() {} });
const fakeDoc = { querySelector: () => node(), querySelectorAll: () => [], createElement: () => node(), addEventListener: () => {}, body: { appendChild() {} } };
global.window = global;
global.addEventListener = () => {};
global.scrollTo = () => {};
global.document = fakeDoc;
global.localStorage = fakeLS;
global.location = { hash: '#/home' };

fs.readdirSync(jsDir).filter((f) => /^\d\d/.test(f) && f.endsWith('.js')).sort()
  .forEach((f) => {
    const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
    new Function('window', 'document', 'localStorage', code)(global, fakeDoc, fakeLS);
  });

const AAM = global.AAM;
const hasHan = (s) => /[一-龥]/.test(String(s || ''));
const hasAscii = (s) => /[A-Za-z]/.test(String(s || ''));

function report(name, n, total) {
  const pct = total ? ((n / total) * 100).toFixed(1) : '0';
  console.log('  ' + (n ? '✗' : '✓') + ' ' + name.padEnd(34) + n + ' / ' + total + '  (' + pct + '%)');
}

console.log('\n===== 1. 课程数据（04-catalog.js） =====');
const all = AAM.allLessons();
report('课程总数', all.length, all.length);
report('缺中文标题', all.filter((l) => !hasHan(l.zh)).length, all.length);
report('英文摘要 summary', all.filter((l) => l.s && !hasHan(l.s)).length, all.length);
report('英文关键词 keywords', all.filter((l) => l.k && !hasHan(l.k)).length, all.length);
report('英文 slug/路径（保留合理）', all.filter((l) => hasAscii(l.slug)).length, all.length);

console.log('\n===== 2. Phase =====');
const ph = AAM.phases();
report('Phase 总数', ph.length, ph.length);
report('缺中文名', ph.filter((p) => !hasHan(p.zh)).length, ph.length);
report('英文描述', ph.filter((p) => p.desc && !hasHan(p.desc) && !hasHan(p.descZh)).length, ph.length);

console.log('\n===== 3. 术语表 =====');
const gl = AAM.catalog.glossary || [];
report('术语总数', gl.length, gl.length);
report('英文释义', gl.filter((g) => !hasHan(g.d)).length, gl.length);
report('英文 whyItMatters', gl.filter((g) => g.w && !hasHan(g.w)).length, gl.filter((g) => g.w).length);

console.log('\n===== 4. 学习路线 =====');
const routes = AAM.recommend.routes();
report('路线总数', routes.length, routes.length);
report('路线名含英文', routes.filter((r) => hasAscii(r.name) && !hasHan(r.name)).length, routes.length);
report('路线描述含英文', routes.filter((r) => hasAscii(r.desc) && !hasHan(r.desc)).length, routes.length);

console.log('\n===== 5. 源文件里的用户可见英文串 =====');
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const suspects = [];
files.forEach((f) => {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  /* 引号内连续 >=3 个英文单词且不含中文的字符串，视为界面英文文案 */
  const re = /'([^'\n]*[A-Za-z]{2,}[^'\n]*)'|"([^"\n]*[A-Za-z]{2,}[^"\n]*)"/g;
  let m;
  while ((m = re.exec(src))) {
    const s = (m[1] || m[2] || '').trim();
    if (s.length < 3 || s.length > 90) continue;
    if (/[\u4e00-\u9fa5]/.test(s)) continue;
    if (/^[#.\/]|^https?:/.test(s)) continue;
    if (!/^[^A-Za-z]*[A-Za-z]{2,}(\s+[A-Za-z0-9'’\-+#.]+){1,}$/.test(s)) continue;
    if (/^[a-z-]+$/.test(s) && s.indexOf(' ') === -1) continue;
    const line = src.slice(0, m.index).split('\n').length;
    suspects.push({ f, line, s });
  }
});
console.log('  候选英文文案条数：' + suspects.length);
suspects.slice(0, 60).forEach((x) => console.log('    ' + x.f + ':' + x.line + '  ' + x.s));

console.log('\n===== 6. 文档 =====');
['README.md', 'ARCHITECTURE.md', 'DEPLOY.md'].forEach((f) => {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const nonHan = lines.filter((l) => /[A-Za-z]/.test(l) && !/[\u4e00-\u9fa5]/.test(l));
  console.log('  ' + f + ' 纯英文行：' + nonHan.length + '（多为命令/链接/表格术语，通常应保留）');
});

console.log('\n===== 7. 抽样：5 条英文摘要 =====');
all.filter((l) => l.s && !hasHan(l.s)).slice(0, 5).forEach((l) => console.log('  [' + l.id + '] ' + l.s.slice(0, 120)));
console.log('\n===== 8. 抽样：5 条术语 =====');
gl.slice(0, 5).forEach((g) => console.log('  ' + g.t + ' :: ' + String(g.d).slice(0, 100)));
