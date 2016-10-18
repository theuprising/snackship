import { spawn } from 'child_process'
import fs from 'fs'

const s3Cli = 'node_modules/.bin/s3-cli'
const yarn = 'node_modules/.bin/yarn'

import 'babel-polyfill'
import babel from 'babel-register'
babel({
  presets: ['stage-0', 'es2015'],
  plugins: ['transform-object-rest-spread']
})

const version = require('../../package.json').version

const log = (...args) => console.log('----> ⛵️⛵️⛵️  ', ...args)

// promisified child_process
// exec :: String -> async { stdout: String, stderr: String, code: Number }
export const exec = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    const parse = cmd => {
      const [first, ...rest] = cmd.split(' ')
      return [first, rest]
    }

    const parsed = parse(cmd)
    console.log('exec', {cmd, parsed, opts})

    const p = spawn(...parsed, opts)

    let output = {
      stdout: '',
      stderr: '',
      code: ''
    }

    p.stdout.on('data', data => { output.stdout += data })
    p.stderr.on('data', data => { output.stderr += data })
    p.on('close', code => {
      output.code = code
      if (code === 0) {
        console.log('success', {output})
        resolve(output)
      } else {
        console.log('failure', {output})
        reject(output)
      }
    })
  })

// straight from stack overflow
const uuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })

export const archiveS3 = async ({dir, bucket, key}) => {
  const f = uuidV4()
  log('archiving to s3')
  await exec('mkdir -p tmp')
  await exec(`tar czf tmp/tar-${f} ${dir}`)
  await exec(`${s3Cli} put tmp/tar-${f} s3://${bucket}/${key}`)
  log('done archiving to s3')
  return
}

export const copy = async ({from, to}) => {
  log(`copying ${from} to ${to}`)
  await exec(`cp -r ${from} ${to}`)
  log('done copying')
  return
}

export const deployS3 = async ({dir, bucket}) => {
  log('deploying to s3')
  await exec(`${s3Cli} sync -P ${dir} s3://${bucket}/`)
  log('done deploying to s3')
  return
}

export const deployHeroku = async ({dir, app}) => {
  log('deploying to heroku')
  const execIn = cmd => exec(cmd, {cwd: dir})
  await execIn(`rm -rf .git`)
  await execIn(`git init`)
  await execIn(`git add .`)
  await execIn(`git commit -am 'build'`)
  const remote = `https://git.heroku.com/${app}.git`
  await execIn(`heroku maintenance:on --app ${app}`)
  await execIn(`git push ${remote} master -f`)
  await execIn(`heroku maintenance:off --app ${app}`)
  log('deployed to heroku')
}

export const installYarn = async ({dir}) => {
  log('installing deps with yarn')
  await exec(yarn, {cwd: dir})
  log('done installing deps')
  return
}

export const read = ({from}) =>
  new Promise((resolve, reject) => {
    fs.readFile(from, (err, out) => {
      if (err) reject(err)
      if (!err) resolve(out)
    })
  })

export const write = ({str, to}) =>
  new Promise((resolve, reject) => {
    fs.writeFile(to, str, (err, out) => {
      if (err) reject(err)
      if (!err) resolve(out)
    })
  })

export const ship = async config => {
  log(`shipping with snackship ${version}`)
  await config.strategy(config)
  log('shipped!')
}

export default ship

