# khoj

上游开源项目（github.com/khoj-ai/khoj）：Python 服务端（Django ORM + FastAPI 混合）+ 多客户端（web/obsidian/emacs/desktop/android）。Python 3.10–3.12，uv 管理依赖。

## 命令

- 安装：`uv sync --all-extras`（必须带 `--all-extras`，否则没有 pytest/ruff；脚本 `scripts/dev_setup.sh` 等价封装）。
- 测试：`uv run pytest`。依赖本机 Postgres + pgvector（默认库名 khoj，用 `POSTGRES_HOST/PORT/USER/PASSWORD/DB` 环境变量覆盖，见 pytest.ini 与 test.yml）。已配 `--reuse-db`。
- 质量门：ruff + mypy 走 pre-commit（`.pre-commit-config.yaml`）；mypy 只在 pre-push/manual 阶段跑，提交前可 `pre-commit run --all-files`。
- 运行：`khoj` CLI（入口 `khoj.main:run`）或 `uv run uvicorn`。
- Web 前端构建（见 `src/interface/web/package.json` scripts）：改 `src/interface/web` 后必须跑 `bun run export`（Windows 用 `bun run windowsexport`）才会生效——它 build 后拷进 `src/khoj/interface/built/` 并 collectstatic。`next dev` 单独跑不会进服务端。

## 约定

- 目录职责：`src/khoj` 是服务端（`app/`=Django 设置、`routers/`=FastAPI、`processor/`、`database/`、`manage.py`）；`src/interface/{web,obsidian,emacs,desktop,android}` 是各客户端，互不进对方目录。
- lint 口径：ruff line-length 120，只查 E/F/I，E501 忽略（见 pyproject.toml）；`src/khoj/main.py` 豁免 import 顺序规则，别"修"它。
- 版本号由 hatch-vcs 从 git tag 动态生成（`dynamic = ["version"]`），CI/打包时用 sed 替换成静态版本——本地改动不要把这个改成固定值。
- `versions.json`：客户端版本 → 最低兼容服务端版本的映射，发客户端新版本时要维护，勿重排或删旧键。
- `tests/evals/`（eval.py、`chatquality` marker）是独立评测，不进 CI 测试流（test.yml 显式排除），改它不影响 `uv run pytest`。

## 禁区与坑

- `src/khoj/interface/built/`（及 `compiled/`）是 web 构建产物，不手改；改动回 `src/interface/web` 重新 export。
- 本机跑测试前必须有可用 Postgres+pgvector；Windows 上 pgvector 官方支持实验性，官方建议用 Docker 起库（docs/contributing/development.mdx）。
- torch 锁定 2.6.0；CI 用 `UV_INDEX=https://download.pytorch.org/whl/cpu` 拉 CPU 版避免数 GB CUDA 包（test.yml），本地 `uv sync` 若下载缓慢多半在拉 CUDA torch。
- `uv.lock` 由 uv 生成，改依赖走 `uv add/lock`，不手编。
