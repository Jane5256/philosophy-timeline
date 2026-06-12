// 把唯一数据源 02-data/structured/*.json 同步到 src/data/（构建/开发前自动运行）
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..', '..', '02-data', 'structured')
const DEST = join(here, '..', 'src', 'data')

mkdirSync(DEST, { recursive: true })
const files = ['eras.json', 'schools.json', 'philosophers.json', 'events.json', 'synchronies.json']
for (const f of files) {
  const from = join(SRC, f)
  if (existsSync(from)) {
    copyFileSync(from, join(DEST, f))
    console.log('✓ synced', f)
  } else {
    console.warn('⚠ missing', f)
  }
}
