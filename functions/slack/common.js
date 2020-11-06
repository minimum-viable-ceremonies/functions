const crypto = require('crypto')
const tsscmp = require('tsscmp')
const { config } = require('firebase-admin')

exports.returnMessage = text =>
  { blocks: [{ type: 'section', text: { type: 'mrkdwn', text } }] }

exports.verifyRequest = ({ rawBody, headers = {} }) => {
  const [version, hash] = headers['x-slack-signature'].split('=')
  const signature = crypto
    .createHmac('sha256', config().slack.signing_secret)
    .update(`${version}:${headers['x-slack-request-timestamp']}:${rawBody}`)
    .digest('hex')

  return tsscmp(hash, signature)
}
