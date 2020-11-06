const { verifyRequest, returnMessage } = require('./common')
const { createRoom } = require('../common')
const { config } = require('firebase-admin')

module.exports = (req, t) => {
  if (!verifyRequest(req)) {
    return [403, t('slack.errors.403')]
  }

  if (req.body.text.length == 0) {
    return [422, returnMessage(t('slack.errors.422'))]
  }

  if (req.body.text === 'help') {
    return [200, returnMessage(t('slack.help.message'))]
  }

  const { uuid, errors } = createRoom({ name: req.body.text }, t)

  if (errors) {
    return [400, returnMessage(t('slack.errors.400', { errors }))]
  }

  return [200, {
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
        url: `${config().app.cors_origin}/room/${uuid}`
      }]
    }]
  }]
}
