# QPRO 持仓字段筛选

一个可部署到 GitHub Pages 的持仓字段筛选页面。页面在浏览器中运行，持仓数据只通过用户电脑上的本地 Companion 读取，不上传到 GitHub。

## 使用方式

1. 启动已登录的 QPRO，并确认本地只读数据 API 运行在 `http://127.0.0.1:8811`。
2. 启动本目录的 Companion：

```powershell
node .\server.mjs
```

3. 打开 GitHub Pages 页面。它会自动连接 `http://127.0.0.1:8812`。

若本地 Companion 使用了其他端口，可在页面地址后加 `?api=http://127.0.0.1:端口`。

## 安全边界

- Companion 只监听 `127.0.0.1`，不会暴露到局域网或公网。
- 仅允许此 GitHub Pages 域名请求本地 API。
- 页面不包含快期账号密码、令牌或持仓数据。
- 当前版本仅执行页面内置的只读持仓查询。
