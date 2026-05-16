import '@testing-library/jest-dom'
import { vi } from 'vitest'

// navigator.clipboard mock (jsdom의 clipboard는 기본 구현이 없음)
Object.defineProperty(global.navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
  writable: true,
})

// localStorage mock
global.localStorage = {
  _store: {},
  getItem(key) { return this._store[key] ?? null },
  setItem(key, value) { this._store[key] = String(value) },
  removeItem(key) { delete this._store[key] },
  clear() { this._store = {} },
}
// crypto는 jsdom이 제공하므로 별도 mock 불필요
