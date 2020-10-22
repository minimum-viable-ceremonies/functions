const { database } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const { createRoom, setLanguage } = require('./common')
const axios = require('axios')
const querystring = require('querystring')
const crypto = require('crypto')
const tsscmp = require('tsscmp')
const { t } = require('i18next')

exports.create = https.onRequest((req, res) => (
  setLanguage(req).then(t => {
    if (!verifyRequest(req)) {
      return res.status(403).send(t('slack.errors.403'))
    }

    if (req.body.text === 'help') {
      return res.status(200).send({
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: t('slack.help.message')
          }
        }]
      })
    }

    const { uuid, errors } = createRoom({ name: req.body.text }, t)
    errors
      ? res.status(400).send({
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: t('slack.errors.400', { errors }) }
        }]
      })
      : res.status(200).send({
        response_type: 'in_channel',
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: t('slack.success.message', { user_name: req.body.user_name }) }
        }, {
          type: 'actions',
          elements: [{
            type: 'button',
            style: 'primary',
            text: { type: 'plain_text', text: t('slack.success.button') },
            url: `${config().mvc.cors_origin}/room/${uuid}`
          }]
        }]
      })
  })
))

exports.authorize = https.onRequest((req, res) => (
  setLanguage(req).then(t => {
    if (!req.query || !req.query.code) {
      return res.status(401).send(t('slack.errors.401'))
    }

    axios.post('https://slack.com/api/oauth.v2.access', querystring.stringify({
      code: req.query.code,
      client_id: config().slack.client_id,
      client_secret: config().slack.client_secret
    })).then(({ data }) => {
      if (data.ok) {
        database().ref("integrations/slack").child(data.team.id).set(data)
        return res.header("Location", `${config().slack.cors_origin}/slack/success`).send(302)
      } else {
        console.error(`Slack Oauth failure: ${JSON.stringify(data)}`)
        return res.header("Location", `${config().slack.cors_origin}/slack/failure`).send(302)
      }
    }).catch(error => {
      console.error(`Slack Oauth failure: ${error}`)
    })
  })
))

const verifyRequest = ({ rawBody, headers = {} }) => {
  const [version, hash] = headers['x-slack-signature'].split('=')
  const signature = crypto
    .createHmac('sha256', config().slack.signing_secret)
    .update(`${version}:${headers['x-slack-request-timestamp']}:${rawBody}`)
    .digest('hex')

  return tsscmp(hash, signature)
}
