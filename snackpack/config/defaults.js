import { BannerPlugin, DefinePlugin } from 'webpack'

const injection = {
  'REQUIRE_CONFIG': 'require(path.resolve(commander.configFile)).default'
}
console.log('INJECTION', injection)
const plugins = [
  new DefinePlugin(injection),
  new BannerPlugin({
    entryOnly: true,
    banner: '#! /usr/bin/env node',
    raw: true
  })
]

export default {
  plugins: plugins
}

