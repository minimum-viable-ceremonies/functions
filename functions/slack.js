const { database } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const { createRoom } = require('./common')
const axios = require('axios')
const querystring = require('querystring')

exports.create = https.onRequest((req, res) => (
  // TODO: use slack signed secrets to verify request
  // https://api.slack.com/authentication/verifying-requests-from-slack
  createRoom({ name: req.body.text })
    ? res.status(200).send({
      response_type: 'in_channel',
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `@${req.body.user_name} started a process planning room!`
        }
      }, {
        type: 'actions',
        elements: [{
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Get started 🙃'
          },
          style: 'primary',
          url: `${config().room.cors_origin}/room/${uuid}`
        }]
      }]
    })
    : res.status(400).send({
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Sorry, something went wrong creating your room. Try again?'
        }
      }]
    })
))

exports.authorize = https.onRequest((req, res) => {
  if (!req.query || !req.query.code) {
    return res.status(401).send("Missing query attribute 'code'")
  }

  axios.post('https://slack.com/api/oauth.v2.access', querystring.stringify({
    code: req.query.code,
    client_id: config().slack.client_id,
    client_secret: config().slack.client_secret
  })).then(({ data }) => {
    if (data.ok) {
      database().ref("integrations/slack").child(data.team.id).set(data)
      return res.header("Location", `${config().slack.cors_origin}/slack?result=success`).send(302)
    } else {
      console.error(`Slack Oauth failure: ${data}`)
      return res.header("Location", `${config().slack.cors_origin}/slack?result=failure`).send(302)
    }
  }).catch(error => {
    console.error(`Slack Oauth failure: ${error}`)
  })
})
