const { spawn } = require('child_process')
const path = require('path')
const readline = require('readline')

const brands = {
  huike: {
    key: 'huike',
    aliases: ['1', 'huike', 'hk', '汇科'],
    name: '汇科',
    apiBaseUrl: 'https://api.hkhkmm825.com/',
    logo: 'logo08223.png',
  },
  dagui: {
    key: 'dagui',
    aliases: ['2', 'dagui', 'dg', '大鬼'],
    name: '大鬼',
    apiBaseUrl: 'https://api.daguicode.com/',
    logo: 'logo-232.png',
  },
  meishi: {
    key: 'meishi',
    aliases: ['3', 'meishi', 'ms', '美狮'],
    name: '美狮',
    apiBaseUrl: 'https://api.meishicode.com',
    logo: 'logo.png',
  },
}

function findBrand(input) {
  if (!input) return null
  const normalized = String(input).trim().toLowerCase()
  return Object.values(brands).find((brand) =>
    brand.aliases.some((alias) => alias.toLowerCase() === normalized)
  ) || null
}

function askBrand() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const prompt = [
    '请选择打包品牌：',
    '1. 汇科',
    '2. 大鬼',
    '3. 美狮',
    '输入编号或品牌标识后回车: ',
  ].join('\n')

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(findBrand(answer))
    })
  })
}

async function main() {
  const inputArg = process.argv.slice(2).find((arg) => arg !== '--')
  let brand = findBrand(inputArg)

  if (!brand) {
    brand = await askBrand()
  }

  if (!brand) {
    console.error('未识别的品牌，仅支持: huike / dagui / meishi')
    process.exit(1)
  }

  const outputDir = path.join('dist', brand.key)
  const env = {
    ...process.env,
    VUE_APP_BRAND_NAME: brand.name,
    VUE_APP_API_BASE_URL: brand.apiBaseUrl,
    VUE_APP_BRAND_LOGO: brand.logo,
    BRAND_OUTPUT_DIR: outputDir,
  }

  console.log(`开始打包品牌: ${brand.name}`)
  console.log(`API Host: ${brand.apiBaseUrl}`)
  console.log(`图标: public/${brand.logo}`)
  console.log(`输出目录: ${outputDir}`)

  const isWin = process.platform === 'win32'
  const packageManager = (process.env.npm_config_user_agent || '').includes('pnpm')
    ? (isWin ? 'pnpm.cmd' : 'pnpm')
    : (isWin ? 'npx.cmd' : 'npx')
  const args = packageManager.includes('pnpm')
    ? ['exec', 'vue-cli-service', 'build']
    : ['vue-cli-service', 'build']

  const child = spawn(packageManager, args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env,
  })

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}

main().catch((error) => {
  console.error('打包失败:', error)
  process.exit(1)
})
