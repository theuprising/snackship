import { spawn } from 'child_process'

const s3Cli = 'node_modules/.bin/s3-cli'

export const exec = cmd =>
  new Promise((resolve, reject) => {
    const parse = cmd => {
      const [first, ...rest] = cmd.split(' ')
      return [first, rest]
    }

    const p = spawn(...parse(cmd))

    let output = {
      stdout: '',
      stderr: '',
      code: ''
    }

    p.stdout.on('data', data => { output.stdout += data })
    p.stderr.on('data', data => { output.stderr += data })
    p.on('close', code => {
      output.code = code
      if (code === '0') {
        resolve(output)
      } else {
        reject(output)
      }
    })
  })

export const archiveS3 = async ({dir, bucket, key}) => {
  await exec(`tar czf tmp/tar ${dir}`)
  await exec(`${s3Cli} put tmp/tar s3://${bucket}/${key}`)
  return
}

export const deployS3 = async ({dir, bucket}) => {
  await exec(`${s3Cli} sync -P ${dir} s3://${bucket}/`)
  return
}

export const ship = config => config.strategy(config)
export default ship

