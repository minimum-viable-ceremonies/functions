const axios = require('axios')
const i18n = require('i18next')
const { config } = require('firebase-functions')
const { database } = require('firebase-admin')
const { getAccessToken } = require('./common')
const { snapshotToShare } = require('../common')

module.exports = (req, t) =>
  i18n.loadNamespaces('app').then(() =>
    database().ref(`/rooms/${JSON.parse(req.body).uuid}`).once('value').then(snapshot => {
      const { channel, uuid } = JSON.parse(req.body)
      const { stats, cadences } = snapshotToShare(snapshot, t)

      return axios.post('https://slack.com/api/chat.postMessage', {
        channel,
        blocks: [{
          type: 'header',
          text: { type: 'plain_text', text: t('templates.share.congrats') }
        }, {
          type: 'section',
          text: { type: 'mrkdwn', text: t('templates.share.encouragement') }
        }, {
          type: 'divider'
        }, {
          type: 'header',
          text: { type: 'plain_text', text: t('templates.share.stats.title') }
        }, {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `• ${stats.ceremonies} ${t('templates.share.stats.ceremonies')}` },
            { type: 'mrkdwn', text: `• ${stats.people} ${t('templates.share.stats.people')}` },
            { type: 'mrkdwn', text: `• ${stats.weekly} ${t('templates.share.stats.weekly')}` }
          ]
        }, {
          type: 'divider'
        }, {
          type: 'header',
          text: { type: 'plain_text', text: t('templates.share.schedule.title') }
        }, {
          type: 'divider'
        }, {
          type: 'section',
          text: { type: 'plain_text', text: t('templates.share.footer') },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: t('templates.share.backToRoom') },
            url: `${config().app.cors_origin}/room/${uuid}`
          }
        }]
      }, {
        headers: { 'Authorization': `Bearer ${config().slack.access_token}` }
      }).catch(error => [400, t('slack.errors.400', { errors: error })])
        .then(({ data: { ok, error } }) =>
          ok
            ? [200, { status: t('common.messages.200') }]
            : [400, { status: t('slack.errors.400', { errors: error }) }]
        )
      })
    )
