import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const configRaw = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf-8')

// Strip comments to prevent false positives on commented-out config lines
const configSource = configRaw
  .replace(/\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')

describe('PWA — vite-plugin-pwa config (vite.config.ts)', () => {
  it('VitePWA plugin is present', () => {
    expect(configSource).toContain('VitePWA(')
  })

  it('manifest.display === "standalone"', () => {
    expect(configSource).toMatch(/display:\s*['"]standalone['"]/)
  })

  it('manifest.theme_color === "#0F172A"', () => {
    expect(configSource).toMatch(/theme_color:\s*['"]#0F172A['"]/)
  })

  it('manifest.background_color === "#0F172A"', () => {
    expect(configSource).toMatch(/background_color:\s*['"]#0F172A['"]/)
  })

  it('manifest.orientation === "portrait"', () => {
    expect(configSource).toMatch(/orientation:\s*['"]portrait['"]/)
  })

  it('manifest.start_url === "/"', () => {
    expect(configSource).toMatch(/start_url:\s*['"]\/['"]/)
  })

  it('manifest.scope === "/"', () => {
    expect(configSource).toMatch(/scope:\s*['"]\/['"]/)
  })

  it('icons 192x192 and 512x512 are declared', () => {
    expect(configSource).toMatch(/sizes:\s*['"]192x192['"]/)
    expect(configSource).toMatch(/sizes:\s*['"]512x512['"]/)
  })

  it('at least one icon has purpose containing "maskable"', () => {
    expect(configSource).toMatch(/purpose:\s*['"]any maskable['"]/)
  })

  it('includeAssets contains icon-192.png', () => {
    expect(configSource).toMatch(/includeAssets:\s*\[.*icon-192\.png/)
  })

  it('workbox.globPatterns is configured', () => {
    expect(configSource).toMatch(/globPatterns:\s*\[/)
  })

  it('does NOT include runtimeCaching (no offline mode per PRD)', () => {
    expect(configSource).not.toContain('runtimeCaching')
  })
})
