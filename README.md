# claude-provider-statusline

Claude Code 模型感知状态栏，用于展示当前上下文、会话 Token 消耗，以及第三方模型平台的额度信息。

## 功能

- 自动识别 DeepSeek 和 GLM
- 展示当前上下文使用量
- 展示会话累计 usage、输入/输出明细和缓存占比
- DeepSeek 展示账户余额
- GLM 展示 5 小时、周额度和下次重置时间
- 自动读取 Claude Code 当前 Base URL、模型和 API Key
- Provider 查询缓存、失败回退和请求退避
- `setup` 自动安装 Claude Code 状态栏
- `doctor` 检查配置并执行真实额度查询

## 展示效果

DeepSeek：

```text
DeepSeek V3 │ ctx 410.0k/1.0m 41% │ usage 1.9m (1.8m↑ 62.3k↓) │ cache 74.3% │ balance ¥38.52
```

GLM：

```text
GLM-5 │ ctx 370.0k/1.0m 37% │ usage 1.3m (1.2m↑ 51.0k↓) │ cache 76.0% │ 5h 27% · week 41% · reset 07-12 18:00
```

其他模型：

```text
Claude Sonnet │ ctx 250.0k/1.0m 25% │ usage 864.0k (820.0k↑ 44.0k↓) │ cache 71.9%
```

其中：

```text
ctx     当前上下文使用量
usage   会话累计输入 Token + 输出 Token
↑       会话累计输入 Token
↓       会话累计输出 Token
cache   输入 Token 中从缓存读取的占比
```

当上下文窗口已知但还没有消耗时：

```text
ctx 0/1.0m 0%
```

当 Claude Code 尚未提供上下文数据时：

```text
ctx —
```

## 安装

### 从源码安装

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
npm link
claude-provider-statusline setup
```

也可以执行：

```bash
./install-local.sh
```

### 从 npm 安装

```bash
npm install -g claude-provider-statusline
claude-provider-statusline setup
```

完成后重启 Claude Code。

## 命令

```bash
claude-provider-statusline setup
claude-provider-statusline init
claude-provider-statusline doctor
claude-provider-statusline help
```

### `setup`

安装并配置 Claude Code 状态栏：

- 创建项目配置文件
- 更新 Claude Code `settings.json`
- 检查 Base URL、模型和 API Key
- 配置完整时执行一次真实额度查询

`init` 是 `setup` 的兼容别名。

### `doctor`

检查当前配置并测试额度查询：

```text
Claude Provider Statusline Doctor

✓ Claude settings   /Users/example/.claude/settings.json
✓ Base URL          https://api.z.ai/api/anthropic
✓ Model             glm-5
✓ API key           found
✓ Provider          glm
✓ Quota query       5h 27% · week 41% · reset 07-12 18:00

Ready: provider configuration and live glm quota query succeeded.
```

## Provider 支持

### DeepSeek

展示当前账户余额：

```text
balance ¥38.52
```

### GLM

展示接口实际返回的 Token 额度：

```text
5h 27% · week 41% · reset 07-12 18:00
```

百分比表示已使用比例。

搜索、网页读取等工具额度默认不展示。接口未返回的额度窗口也不会显示占位符。

## 配置来源

默认读取：

```text
~/.claude/settings.json
```

支持以下 Claude Code 配置：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key",
    "ANTHROPIC_MODEL": "glm-5"
  }
}
```

也支持当前进程中的同名环境变量。

项目配置位于：

```text
~/.config/claude-provider-statusline/config.json
```

## 开发

```bash
pnpm install
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

项目使用 pnpm `10.15.0` 和 tsup 构建。

## 安全

- 不会把 API Key 写入项目配置
- 缓存中不会保存 API Key
- 配额查询设置超时和缓存
- API Key 不会在正常输出中明文展示
