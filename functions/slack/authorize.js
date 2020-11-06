const { database } = require('firebase-admin')
const { config } = require('firebase-functions')
const querystring = require('querystring')
const axios = require('axios')

module.exports = (req, t) => {
  if (!req.query || !req.query.code) {
    return [401, t('slack.errors.401')]
  }

  return axios.post('https://slack.com/api/oauth.v2.access', querystring.stringify({
    code: req.query.code,
    client_id: config().slack.client_id,
    client_secret: config().slack.client_secret
  })).then(({ data }) => {
    if (data.ok) {
      database().ref("integrations/slack").child(data.team.id).set(data)
      return [302, `${config().app.cors_origin}/slack/success`]
    } else {
      return [302, `${config().app.cors_origin}/slack/failure`]
    }
  }).catch(error => [400, t('slack.errors.400', { errors: error })])
}
