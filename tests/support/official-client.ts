import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

/** Execute the published browser face, not the newly separate Node client. */
export function loadOfficialBrowserClient(packageName: string, override?: (specifier: string) => unknown): any {
  const require = createRequire(import.meta.url)
  const manifestPath = require.resolve(`${packageName}/package.json`)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const target = manifest.exports['./client'].browser ?? manifest.exports['./client'].default
  let exports: unknown
  new Function('window', readFileSync(resolve(dirname(manifestPath), target), 'utf8'))({
    __ModuleLoader__: { load(handoff: { factory(require: (specifier: string) => unknown): unknown }) {
      exports = handoff.factory(override ?? require)
    } },
  })
  if (exports === undefined) throw new Error(`${packageName} browser face did not register a ModuleLoader handoff`)
  return exports
}
