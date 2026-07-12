# claude-provider-statusline

Claude Code 模型感知状态栏，展示当前上下文、会话 Token、缓存占比和第三方模型套餐额度。

## 功能

- 自动识别 DeepSeek 和 GLM
- 从 Claude Code transcript 统计会话累计 Token
- 展示当前 Context 使用情况
- 展示输入、输出 Token 和缓存占比
- DeepSeek 展示账户余额，固定保留两位小数
- GLM 展示 5 小时、周剩余额度和下次重置时间
- Provider 数据按短周期刷新，并通过 singleflight、旧缓存和失败退避控制请求量
- `setup` 安装状态栏并执行一次真实额度查询
- `doctor` 检查配置并执行一次真实额度查询

## 展示效果

DeepSeek：

```text
DeepSeek V3 │ ctx 120.0k/1.0m 12% │ usage 76.5k (73.2k↑ 3.3k↓) │ cache 93.8% │ balance ¥38.50
```

GLM：

```text
GLM-5 │ ctx 120.0k/1.0m 12% │ usage 76.5k (73.2k↑ 3.3k↓) │ cache 93.8% │ 5h 100% · week 59% · reset 07-12 18:00
```

字段说明：

- `ctx`：当前上下文使用量
- `usage`：会话累计输入 Token + 输出 Token
- `↑`：会话累计输入 Token
- `↓`：会话累计输出 Token
- `cache`：输入中从缓存读取的占比
- `balance`：DeepSeek 当前账户余额
- `5h` / `week`：GLM 套餐剩余额度比例
- `reset`：额度窗口下一次重置时间

## 安装

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
npm link
claude-provider-statusline setup
```

也可以运行：

```bash
./install-local.sh
```

## 命令

```bash
claude-provider-statusline setup
claude-provider-statusline init
claude-provider-statusline doctor
```

- `setup`：创建配置、写入 Claude Code statusLine，并测试当前 Provider 额度
- `init`：`setup` 的兼容别名
- `doctor`：检查 Base URL、模型、API Key、Provider 识别和真实额度查询

## 配置

配置文件：

```text
~/.config/claude-provider-statusline/config.json
```

默认刷新配置：

```json
{
  "cacheSeconds": 60,
  "refresh": {
    "providerCacheSeconds": {
      "default": 30,
      "deepseek": 15,
      "glm": 15
    }
  }
}
```

`cacheSeconds` 保留用于兼容旧配置；Provider 额度优先使用 `refresh.providerCacheSeconds`。

API Key 和 Base URL 默认从 Claude Code 配置读取：

```text
~/.claude/settings.json
```

支持：

```text
ANTHROPIC_BASE_URL
ANTHROPIC_AUTH_TOKEN
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
```

## 开发

```bash
pnpm format
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm pack:check
```
