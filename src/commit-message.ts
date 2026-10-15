/** Commit bodies are sent to Git on stdin; 500 characters is not a Git limit. */
export function isValidCommitMessage(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('\0')
}
