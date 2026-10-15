/** Long multiline body exercises the former 500-character boundary, including a surrogate pair. */
export const longCommitMessage = `feat: 保留完整提交信息\n\n${'x'.repeat(475)}😀\n${'- 保留中文正文与 emoji 😀\n'.repeat(40)}`.trim()
