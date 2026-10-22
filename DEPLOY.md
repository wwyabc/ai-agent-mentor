# 部署指南：让手机随时随地访问

## 先回答结论

现在这个应用**只能在本机访问**（`http://127.0.0.1:8123`），因为你电脑一关，服务就没了。
但它是**纯静态文件**（无后端、无数据库、无账号），所以只要把整个目录丢到任意静态托管上，手机就能随时随地打开，且不依赖这台电脑。

---

## 方案对比

| 方案 | 关机后还能用 | 适用场景 | 成本 |
|---|---|---|---|
| ① 同一 Wi-Fi 局域网 | ❌ | 今晚在沙发上试一下 | 0 |
| ② GitHub Pages | ✅ | 长期、免费、最省事 | 0 |
| ③ Vercel / Netlify | ✅ | 想要国内/海外都快、自动 HTTPS | 0（免费额度） |
| ④ 腾讯云 COS / CloudBase / Nginx | ✅ | 国内访问最快、可控 | 几元/月 |
| ⑤ 装到手机桌面（PWA） | ✅（离线可用） | 地铁/飞机上断网学 | 0 |

> ②～④ 任选其一部署后，再用 ⑤ 把网页"装"成 App，体验最好。

---

## ① 局域网临时用（同 Wi-Fi）

```powershell
# 1) 起服务（监听所有网卡）
cd d:\工作\ai\study\ai-agent-mentor
python -m http.server 8123 --bind 0.0.0.0

# 2) 放行防火墙（首次需要，管理员权限）
New-NetFirewallRule -DisplayName "AAM 8123" -Direction Inbound -LocalPort 8123 -Protocol TCP -Action Allow

# 3) 看本机内网 IP
ipconfig | findstr IPv4
```

手机浏览器打开 `http://192.168.x.x:8123` 即可。
限制：电脑必须开机且在同一网络。

---

## ② GitHub Pages（推荐，免费 + 自带 HTTPS）

```bash
cd d:/工作/ai/study/ai-agent-mentor
git init
git add -A
git commit -m "AI Agent 随身导师"

# 在 GitHub 上新建一个空仓库（例如 ai-agent-mentor），然后：
git remote add origin https://github.com/<你的用户名>/ai-agent-mentor.git
git branch -M main
git push -u origin main
```

然后：仓库 **Settings → Pages → Source 选 `main` / 根目录 `/`** → Save。
一分钟后访问：`https://<你的用户名>.github.io/ai-agent-mentor/`

> 国内访问 GitHub Pages 可能偏慢；介意的话用 ③ 或 ④，或用 Cloudflare Pages（同样免费，速度更好）。

---

## ③ Vercel / Netlify（拖拽即可）

1. 打开 <https://vercel.com/new> （或 <https://app.netlify.com/drop>）
2. 把 `ai-agent-mentor` **整个文件夹**拖进去
3. 一路默认 → Deploy → 拿到 `https://xxx.vercel.app`
4. 之后每次改完本地文件，重新拖一次即可覆盖更新

零配置：它会自动识别为静态站点，不需要 Build Command。

---

## ④ 腾讯云 / 自有服务器（国内访问最快）

三选一，推荐顺序：**CloudBase 静态托管 > COS + CDN > 自有 Nginx**。
已备好脚本与配置：`deploy/package.ps1`（打包）、`deploy/upload-cos.ps1`（上传）、`deploy/nginx.conf`（Nginx）。

### ④-A CloudBase 静态托管（最省事，自带域名 + HTTPS）

```bash
npm i -g @cloudbase/cli
tcb login                     # 浏览器授权
tcb env list                  # 拿到环境 ID，形如 xxx-1a2b3c
tcb hosting deploy ./ -e <环境ID>
# 部署完给出：https://<环境ID>.tcloudbaseapp.com/  → 手机直接打开
```

> 首次会提示开通静态网站托管，按提示确认即可。若要绑自己的域名，在「静态托管 → 域名管理」里加。

### ④-B COS + CDN（可控、最便宜）

只需一次的配置：

1. **建桶**：COS 控制台 → 创建桶，访问权限「公有读私有写」
2. **静态网站**：桶 → 基础配置 → 静态网站 → 索引文档 / 错误文档都填 `index.html`
3. **CDN 加速**：CDN 控制台 → 域名管理 → 添加域名
   - 加速区域：中国大陆
   - 回源配置：源站类型「COS」，选刚才的桶
   - HTTPS：申请免费证书并开启强制跳转
   - 缓存配置（很关键，否则发版后用户拿不到新版）：

   | 文件 | 缓存时间 |
   |---|---|
   | `index.html` / `sw.js` / `manifest.webmanifest` | 0（不缓存） |
   | `assets/**/*.js` `*.css` `*.png` | 7 天 |
   | 其他 | 1 小时 |

4. **自定义域名**：国内域名需备案，CNAME 到 CDN 给的 CNAME 地址

日常发版（两条命令）：

```powershell
powershell -ExecutionPolicy Bypass -File deploy/package.ps1        # 打出 dist/
powershell -ExecutionPolicy Bypass -File deploy/upload-cos.ps1     # 上传（改好脚本顶部 4 个变量）
```

> `upload-cos.ps1` 依赖官方 `coscli`（单文件，无需 Python）。
> 发版后若 CDN 未过期，执行 `tccli cdn PurgePathCache --cli-unfold-argument --Paths https://你的域名/index.html --Paths https://你的域名/sw.js`。

### ④-C 自有服务器 Nginx

```bash
# 1) 本地打包
powershell -ExecutionPolicy Bypass -File deploy/package.ps1

# 2) 上传 dist/ 到服务器
scp -r dist/* root@你的服务器:/var/www/ai-agent-mentor/

# 3) 放配置并生效
sudo cp deploy/nginx.conf /etc/nginx/conf.d/ai-agent-mentor.conf
sudo nginx -t && sudo systemctl reload nginx

# 4) 证书（Let's Encrypt）
sudo certbot --nginx -d ai.yourdomain.com
```

`deploy/nginx.conf` 已包含 gzip（课程数据 400KB → 约 110KB）、SPA 回退、外壳不缓存 + 资源长缓存等策略。

---

## ⑤ 装到手机桌面（离线可学）

已内置 PWA：`manifest.webmanifest` + `sw.js` + 图标。

- **Android / 桌面 Chrome**：打开部署好的网址 → 「我的 → 装到手机桌面 → 添加到主屏幕」
- **iPhone**：用 **Safari** 打开 → 底部「分享」→「添加到主屏幕」

装好后：全屏运行、有图标、**断网也能打开继续学**（课程数据已缓存在本地）。

---

## 注意事项

1. **进度不会自动跨设备同步** —— 进度存在浏览器 `localStorage` 里。换手机/换浏览器用「我的 → 导出进度 / 导入进度」迁移。
2. **PWA 需要 HTTPS**（`localhost` 除外）—— 上面 ②③④ 都自带 HTTPS，直接可用。
3. **更新内容后**：
   - 重新生成课程数据：`node tools/build-catalog.cjs`
   - 重新上传覆盖
   - 如果改了 JS/样式，把 `sw.js` 里的 `CACHE = 'aam-v1'` 版本号 +1，老用户会自动刷新到新版
4. **首次打开体积**：打包产物 23 个文件 / 643KB，开启 gzip 后约 190KB（课程目录 `04-catalog.js` 占大头 400KB → gzip 后约 90KB）。手机上 1 秒内打开，之后走 Service Worker 缓存秒开。
5. **发版流程**：`node tools/build-catalog.cjs`（课程有更新时）→ `deploy/package.ps1` → 上传/覆盖 → 改了 JS 就把 `sw.js` 里 `CACHE` 版本号 +1。
6. **接大模型是可选的**：不填 API Key 也能完整学习（离线检索式讲解）；填了之后需要手机能访问你填的那个接口地址。

---

## 附：本目录里跟部署有关的文件

| 文件 | 作用 |
|---|---|
| `deploy/package.ps1` | 打出可上传的 `dist/` 与 `dist.zip`（已实测：23 文件 / 643KB） |
| `deploy/upload-cos.ps1` | 打包 + coscli 同步到腾讯云 COS（填 4 个变量即可） |
| `deploy/nginx.conf` | 自有服务器 Nginx 配置（gzip / SPA 回退 / 缓存策略 / HTTPS） |
| `manifest.webmanifest` + `sw.js` + `assets/icon-*.png` | PWA，支持添加到主屏幕 + 离线学习 |
| `.gitignore` | 忽略 `dist/`、`dist.zip` |
