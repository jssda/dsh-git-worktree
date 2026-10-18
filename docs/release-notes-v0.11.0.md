# v0.11.0 发布说明（候选；待 clean Local 和 CI 验收）

本版将 DSH 基线从 `0.2.0-rc.2` 精确切换到 `0.2.1-rc.2`，修复新版 Cordis/Loader 下的 Provider 生命周期，取消提交信息 500 字符限制，并精简验收冲突展示。本版完整包含 tag `v0.10.1` 的全部变更；`v0.10.1` 有 Git tag 与 GitHub Release 但从未发布到 npm。

## 主要更新

- DSH peers/devDependencies 精确锁定 `0.2.1-rc.2`（Cordis 4.0.5、loader 1.0.6、include 1.0.10、schemastery 3.18.5）；Workspace 版本/SHA 门禁与 Fork mandatory seam 对齐新源码，保留 allowMigration、agentPreset 与官方草稿初始化；新派生不复用于 0.2.0 Host，历史 alpha/next 别名保持。
- 修复 Cordis 4.0.5 / Loader 1.0.6 下插件 Provider 生命周期：显式释放 marker、等待禁用 fiber 真正结束、以公开 `entry.init()` 替换已销毁的官方 fiber、按身份撤回失败/禁用的 replacement fiber；保留非阻塞启动、超时/在途保护与根卸载语义。
- 提交信息不再截断为 500 字符：前端、RPC、Host 与 checkpoint 全链路保留完整正文，统一非空与 NUL 校验，保持身份与幂等门禁。
- 验收冲突展示精简：摘要与操作统一为顶部布局，冲突提示独立紧凑，冲突文件列表移入验收详情并复用展开；冲突时隐藏不可用的预览按钮。

## 兼容与迁移

DSH peers 从 `0.2.0-rc.2` 切换到 `0.2.1-rc.2`（精确版本）；`0.1.x` Host 继续使用 `0.9.x` 插件线，其兼容记录不变。无 Worktree registry、Review 或 Recovery 数据迁移。`minimumReleaseAgeExclude` 覆盖 `0.2.1-rc.2` 精确锁定依赖（延续既有精确锁定豁免惯例）；受 `minimumReleaseAge` 供应链防护影响的环境请显式指定 `dsh-git-worktree@0.11.0` 安装。

## 验证状态（2026-10-18；发布前需 clean Local 和 CI）

源码基线在新鲜隔离环境完成 `0.2.1-rc.2` 适配验证：typecheck、build、sidebar/发布门禁通过，43 个测试文件 607 passed、1 skipped，focused lifecycle 24 passed；仅为源码兼容验证，未验收真实浏览器、AI 对话、桌面或 Windows 全流程，详见 [0.2.1-rc.2 验证报告](compatibility/0.2.1-rc.2.md)。本候选在受管隔离 Worktree 重跑全量门禁后提交；正式发布仍须 clean Local 门禁、推送精确 release commit 并等待 CI 成功，再创建 annotated tag 与 GitHub Release，并完成真实安装 smoke。

**npm 状态：尚未发布 `0.11.0`。`v0.10.1` 已打 tag 但从未发布 npm；本版为其超集，npm 用户直接安装 `0.11.0`。**
