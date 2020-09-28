const { database } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const phrase = require('random-words')
const cors = require('cors')
const fs = require('fs')

exports.create = https.onRequest((req, res) => (
  cors({origin: config().room.cors_origin})(req, res, () => (
    createRoom(req.body)
      ? res.status(200).send({ status: 'ok' })
      : res.status(400).send({ status: 'bad request' })
  ))
))

exports.slackCreate = https.onRequest((req, res) => {
  // TODO: use slack signed secrets to verify request
  // https://api.slack.com/authentication/verifying-requests-from-slack
  const uuid = phrase({ exactly: 3, join: '-' })

  createRoom({ name: req.body.text, uuid })
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
})

const createRoom = ({ name, uuid, features = {}, weekCount = 1, template = 'default' }) => {
  const errors = {}

  if (!name) { errors.name = ['Name is required'] }
  if (!uuid) { errors.uuid = ['Uuid is required'] }

  if (Object.values(errors).length) { return false }

  const ceremonies = fs.readFileSync(`templates/${template}`, 'utf-8')
    .split('\n')
    .filter(id => id.length > 0)
    .reduce((result, id, index) => {
      result[id] = { id, index, async: true, placement: 'undecided' }
      return result
    }, {})

  database().ref(`/rooms/${uuid}`).set({ name, features, weekCount, ceremonies })

  return true
}
