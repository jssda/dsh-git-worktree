// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ClientI18nProvider } from '../src/client/i18n.js'
import { PreflightStatus } from '../src/client/review-console/PreflightStatus.js'
import { WorktreeReviewStatus } from '../src/client/target-console/WorktreeReviewStatus.js'
import { createWorktreeConsoleAdapterFixture } from './support/worktree-console.js'
import type { WorktreeClientServices } from '../src/client/actions.js'

const files = Array.from({ length: 5 }, (_, index) => `service/src/new-product/quality-standard-library/${index}-${'long-filename-'.repeat(8)}service.spec.ts`)

async function conflictFixture() {
  const fixture = createWorktreeConsoleAdapterFixture()
  const result = await fixture.adapter.preflight({ sessionId: 'target-session', checkoutId: 'checkout-1', expectedRevision: 7, expectedReviewId: 'review-1' })
  if (!result.ok || result.value.preflight.status === 'blocked') throw new Error('Expected preflight')
  const preflight = { ...result.value.preflight, status: 'conflict' as const, localModified: false as const, conflictingFiles: files }
  fixture.adapter.preflight = vi.fn(async () => ({ ok: true as const, value: { preflight } }))
  fixture.adapter.preview = vi.fn(fixture.adapter.preview)
  fixture.adapter.resumeRevision = vi.fn(fixture.adapter.resumeRevision)
  return { ...fixture, preflight }
}

afterEach(cleanup)

test('冲突提示保持紧凑，文件只在详情中展示且不显示不可用的预览按钮', async () => {
  const fixture = await conflictFixture()
  render(<WorktreeReviewStatus session={{ sessionId: 'target-session' }} adapter={fixture.adapter} services={{} as WorktreeClientServices} />)
  const heading = await screen.findByText('发现 5 个冲突文件')
  const conflict = heading.closest('.dsh-wt-conflict')!
  const actions = conflict.closest('.dsh-wt-review-actions')!
  const header = actions.querySelector('.dsh-wt-review-action-head')!
  expect(header.contains(screen.getByText('Fixture review'))).toBe(true)
  expect(header.contains(screen.getByRole('button', { name: '查看详情' }))).toBe(true)
  expect(header.contains(conflict)).toBe(false)
  expect(header.nextElementSibling).toBe(conflict)
  expect(screen.queryByRole('button', { name: '预览修改' })).toBeNull()
  expect(screen.getByRole('button', { name: '让 Agent 解决冲突' }).classList.contains('dsh-wt-primary')).toBe(true)
  expect(within(conflict as HTMLElement).getByText('只读检查 · Local 未修改')).toBeTruthy()
  expect(conflict.querySelector('details')).toBeNull()
  expect(screen.queryByText(files[0]!)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '查看详情' }))
  const dialog = screen.getByRole('dialog', { name: '验收详情' })
  const list = within(dialog).getByRole('list', { name: '冲突文件' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(5)
  expect(within(list).getByText(files[0]!)).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: '关闭验收详情' }))
  fireEvent.click(screen.getByRole('button', { name: '重新检查' }))
  expect(fixture.adapter.preflight).toHaveBeenCalledTimes(2)
  expect(fixture.adapter.preview).not.toHaveBeenCalled()
  expect(fixture.adapter.resumeRevision).not.toHaveBeenCalled()
})

test('冲突操作保留 busy 与 capability 禁用状态，英文和 compact 展示一致', async () => {
  const { preflight, target } = await conflictFixture()
  const onRefresh = vi.fn()
  const onRecovery = vi.fn()
  const props = { snapshot: { status: 'success' as const, preflight }, target, onRefresh, onRecovery, onOpenHolder: vi.fn() }
  const view = render(<PreflightStatus {...props} busy />)
  for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled).toBe(true)
  view.rerender(<PreflightStatus {...props} busy={false} target={{ ...target, capabilities: { ...target.capabilities, resumeRevision: false } }} />)
  expect((screen.getByRole('button', { name: '让 Agent 解决冲突' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: '重新检查' }))
  expect(onRefresh).toHaveBeenCalledTimes(1)
  view.rerender(<ClientI18nProvider language="en"><PreflightStatus {...props} busy={false} compact /></ClientI18nProvider>)
  expect(screen.getByText('Found 5 conflicting files')).toBeTruthy()
  expect(screen.queryByText('Conflicting files')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Ask Agent to resolve conflicts' }))
  expect(onRecovery).toHaveBeenCalledWith(preflight)
})
