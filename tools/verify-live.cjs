/* 线上版本验证：绕过 CDN 缓存（加随机查询参数）检查关键内容是否已发布 */
const https = require('https');
const base = 'https://wwyabc.github.io/ai-agent-mentor/';

function check(path, patterns) {
  return new Promise((resolve) => {
    const url = base + path + '?v=verify-' + Math.random().toString(36).slice(2);
    https.get(url, { headers: { 'User-Agent': 'node', 'Cache-Control': 'no-cache' } }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        const flags = patterns.map((p) => p + '=' + body.includes(p)).join('  ');
        console.log(path + ' -> HTTP ' + res.statusCode + '  ' + flags);
        resolve();
      });
    }).on('error', (e) => { console.log(path + ' -> FAIL ' + e.message); resolve(); });
  });
}

(async () => {
  await check('index.html', ['06c-zh-lessons-a', 'force-update']);
  await check('assets/js/13-ui.js', ['20 个阶段', 'force-update']);
  await check('sw.js', ['aam-v3']);
  await check('assets/js/06c-zh-lessons-a.js', ['工具塑造你的思维方式']);
  await check('assets/js/06b-zh-meta.js', ['把开发环境配置好']);
})();
