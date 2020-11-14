const axios = require('axios')
const i18n = require('i18next')
const { compileTemplate, snapshotToShare } = require('../common')
const { database } = require('firebase-admin')
const { config } = require('firebase-functions')
const dayjs = require('dayjs')

module.exports = (req, t) =>
  i18n.loadNamespaces('app').then(() =>
    database().ref(`/rooms/${req.body.uuid}`).once('value')
      .then(snapshot =>
        axios.post('https://api.sendgrid.com/v3/mail/send', {
          from: { email: "noreply@minimal.cards", name: "Minimum Viable Ceremonies" },
          personalizations: [{
            to: [{ email: req.body.recipients || 'james.kiesel@gmail.com' }],
            subject: t('templates.share.title'),
          }],
          content: [{
            type: "text/html",
            value: compileTemplate('share', {
              ...snapshotToShare(snapshot, t),
              translations: {
                ...t('templates.share', { returnObjects: true }),
                footer: t('templates.share.footer', { name: (snapshot.toJSON() || {}).name }),
                roomUrl: `${config().app.cors_origin}/room/${req.body.uuid}`
              }
            })
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(() => [200, { status: t('common.messages.200') }])
          .catch(({ request, response }) => [response.status, response.data])))
