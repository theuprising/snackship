import { DefinePlugin } from 'webpack'

const injection = {
  'REQUIRE_CONFIG': 'require(path.resolve(process.cwd(), commander.configFile))'
  // 'REQUIRE_CONFIG': 'hello there'
}
console.log('INJECTION', injection)
const plugin = new DefinePlugin(injection)

export default {
  plugins: [plugin]
}

