import { spawn } from 'child_process'
import axios from 'axios'
import fs from 'fs'
import chalk from 'chalk'

const s3Cli = 'node_modules/.bin/s3-cli'
const yarn = 'node_modules/.bin/yarn'

import 'babel-polyfill'
import babel from 'babel-register'
babel({
  presets: ['stage-0', 'es2015'],
  plugins: ['transform-object-rest-spread']
})

const version = require('../../package.json').version

export const tell = (...args) => console.log(`${chalk.cyan('---->')} ⛵️⛵️⛵️  `, ...args)
export const log = (...args) => console.log('           ', ...args)

// promisified child_process
// exec :: String -> async { stdout: String, stderr: String, code: Number }
export const exec = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    // const parse = cmd => {
    //   const [first, ...rest] = cmd.split(' ')
    //   return [first, rest]
    // }

    // const parsed = parse(cmd)
    tell(`executing ${cmd}`)

    const p = spawn(cmd, Object.assign(opts, {shell: '/bin/bash'}))

    let output = {
      stdout: '',
      stderr: '',
      code: ''
    }

    p.stdout.on('data', data => { log(chalk.white(data.toString('utf8'))); output.stdout += data })
    p.stderr.on('data', data => { log(chalk.yellow(data.toString('utf8'))); output.stderr += data })

    p.on('close', code => {
      output.code = code
      if (code === 0) {
        log('success')
        resolve(output)
      } else {
        log('failure')
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

export const archiveS3 = async ({dir, bucket, key, id, secret}) => {
  const f = uuidV4()
  tell('archiving to s3')
  await exec('mkdir -p tmp')
  await exec(`tar czf tmp/tar-${f} -C ${dir} .`)
  await exec(`env AWS_ACCESS_KEY=${id} AWS_SECRET_KEY=${secret} ${s3Cli} put -P tmp/tar-${f} s3://${bucket}/${key}`)
  tell('done archiving to s3')
  return `http://${bucket}.s3.amazonaws.com/${key}`
}

export const forceCommit = async () => {
  try {
    await exec(`git diff-index --quiet HEAD`)
  } catch (e) { tell('COMMIT FIRST!'); throw e }
}

export const id = async () => {
  tell('generating commit id')
  const id = (await exec('git log -1 --format="%ai  %D  %h  %an  %f"'))
    .stdout
    .trim()
    .replace(/HEAD -> /, '')
    .replace(/ /g, '_')
  tell(`id is ${id}`)
  return id
}

export const copy = async ({from, to}) => {
  tell(`copying ${from} to ${to}`)
  await exec(`cp -r ${from} ${to}`)
  tell('done copying')
  return
}

export const deployS3 = async ({dir, bucket, id, secret}) => {
  tell('deploying to s3')
  await exec(`env AWS_ACCESS_KEY=${id} AWS_SECRET_KEY=${secret} ${s3Cli} sync -P ${dir} s3://${bucket}/`)
  tell('done deploying to s3')
  return
}

export const deployHeroku = async ({tarUrl, app, apiKey}) => {
  tell('deploying to heroku')
  await axios.post(`https://api.heroku.com/apps/${app}/builds`, {
    source_blob: {
      checksum: null,
      url: tarUrl,
      version: null
    }
  }, {
    headers: {
      Accept: 'application/vnd.heroku+json; version=3',
      Authorization: `Bearer ${apiKey}`
    }
  })
}

export const installYarn = async ({dir}) => {
  tell('installing deps with yarn')
  await exec(yarn, {cwd: dir})
  tell('done installing deps')
  return
}

export const read = ({from}) =>
  new Promise((resolve, reject) => {
    tell(`reading from ${from}`)
    fs.readFile(from, (err, out) => {
      if (err) reject(err)
      if (!err) resolve(out)
    })
    tell('done reading')
  })

export const write = ({str, to}) =>
  new Promise((resolve, reject) => {
    tell(`writing to ${to}`)
    fs.writeFile(to, str, (err, out) => {
      if (err) reject(err)
      if (!err) resolve(out)
    })
    tell('done writing')
  })

export const ship = async config => {
  tell(`shipping with snackship ${version}`)
  await config.strategy(config)
  tell('shipped!')
}

export default ship

