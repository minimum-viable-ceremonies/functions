const axios = require('axios')
const i18n = require('i18next')
const { compileTemplate } = require('../common')
const { database } = require('firebase-admin')
const { config } = require('firebase-functions')
const dayjs = require('dayjs')

module.exports = (req, t) =>
  i18n.loadNamespaces('app').then(() =>
    database().ref(`/rooms/${req.body.uuid}`).once('value')
      .then(snapshot => snapshot.toJSON())
      .then(({ ceremonies, name }) =>
        axios.post('https://api.sendgrid.com/v3/mail/send', {
          from: { email: "noreply@minimal.cards", name: "Minimum Viable Ceremonies" },
          personalizations: [{
            to: [{ email: req.body.recipients || 'james.kiesel@gmail.com' }],
            subject: t('templates.share.title'),
          }],
          content: [{
            type: "text/html",
            value: compileTemplate('share', {
              cadences: Object.values(ceremonies).reduce((result, ceremony) => {
                if (['void', 'undecided'].includes(ceremony.placement)) { return result }
                result[ceremony.placement] = result[ceremony.placement] || {
                  id: ceremony.placement,
                  name: t(`app:cadences.${ceremony.placement}.name`),
                  ceremonies: []
                }
                result[ceremony.placement].ceremonies.unshift({
                  ...ceremony,
                  title: ceremony.title || t(`app:ceremonies.${ceremony.id}.name`),
                  pill: (
                    (ceremony.async && t('templates.share.async')) ||
                    (ceremony.startTime && dayjs().set('hour', 0).set('minute', ceremony.startTime).format('H:mm a'))
                  ),
                  people: Object.values(ceremony.people || [])
                    .filter(person => person.label)
                    .map(({ label }) => ({ initial: label[0], name: label }))
                })
                return result
              }),
              translations: {
                ...t('templates.share', { returnObjects: true }),
                footer: t('templates.share.footer', { name, date: dayjs().format('DD MMM YY') }),
                roomUrl: `${config().app.cors_origin}/room/${req.body.uuid}`
              }
            }, ['ceremony'])
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${config().sendgrid.api_key}`,
            'Content-Type': 'application/json'
          }
        }).then(() => [200, { status: t('common.messages.200') }])
          .catch(({ request, response }) => [response.status, response.data])))
