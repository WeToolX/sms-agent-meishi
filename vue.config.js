const { defineConfig } = require('@vue/cli-service')
const path = require('path')

const brandTitle = process.env.VUE_APP_BRAND_NAME || '代理'
const brandLogo = process.env.VUE_APP_BRAND_LOGO || 'logo.png'
const outputDir = process.env.BRAND_OUTPUT_DIR || 'dist'

module.exports = defineConfig({
  outputDir,
  transpileDependencies: true,
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = brandTitle
      args[0].brandLogo = brandLogo
      return args
    })

    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        reactivityTransform: true
      }))
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
})
