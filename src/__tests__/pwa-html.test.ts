import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8')

describe('PWA — index.html meta tags', () => {
  it('has <meta name="theme-color" content="#0F172A">', () => {
    expect(html).toMatch(/<meta\s+name=["']theme-color["']\s+content=["']#0F172A["']\s*\/?>/)
  })

  it('has <meta name="apple-mobile-web-app-capable" content="yes">', () => {
    expect(html).toMatch(/<meta\s+name=["']apple-mobile-web-app-capable["']\s+content=["']yes["']\s*\/?>/)
  })

  it('has <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">', () => {
    expect(html).toMatch(/<meta\s+name=["']apple-mobile-web-app-status-bar-style["']\s+content=["']black-translucent["']\s*\/?>/)
  })

  it('has <link rel="apple-touch-icon">', () => {
    expect(html).toMatch(/<link\s+rel=["']apple-touch-icon["']/)
  })

  it('has viewport-fit=cover in viewport meta', () => {
    expect(html).toMatch(/viewport-fit=cover/)
  })

  it('has <meta name="description">', () => {
    expect(html).toMatch(/<meta\s+name=["']description["']\s+content=["'][^"']+["']\s*\/?>/)
  })
})
