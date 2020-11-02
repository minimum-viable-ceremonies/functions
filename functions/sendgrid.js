const axios = require('axios')
const { database } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const cors = require('cors')
const { setLanguage } = require('./common')

exports.subscribe = https.onRequest((req, res) => (
  setLanguage(req).then(t => (
    cors({origin: config().sendgrid.cors_origin})(req, res, () => (
      axios.put('https://api.sendgrid.com/v3/marketing/contacts', {
        list_ids: [config().sendgrid.list_id],
        contacts: [{ email: req.body.email }]
      }, {
        headers: {
          'Authorization': `Bearer ${config().sendgrid.api_key}`,
          'Content-Type': 'application/json'
        }
      }).then(() => res.status(200).send({status: t('common.messages.200') }))
        .catch(({ request, response: { status, data } }) => res.status(status).send(data))
    ))
  ))
))

exports.share = https.onRequest((req, res) => (
  setLanguage(req).then(t => (
    cors({origin: config().mvc.cors_origin})(req, res, () => (
      database().ref(`/rooms/${req.body.uuid}/ceremonies`).once('value').then(snapshot => (
        axios.post('https://api.sendgrid.com/v3/mail/send', {
          from: { email: "noreply@minimal.cards" },
          personalizations: [{
            to: [{ email: "james.kiesel@gmail.com" }],
            dynamic_template_data: {
              uuid: req.body.uuid,
              cadences: transformCeremonies(snapshot.toJSON()),
              translations: t('templates.share', {
                userName: req.body.username,
                teamName: snapshot.toJSON().name,
                date: '10 Feb 2020',
                returnObjects: true
              })
            }
          }],
          template_id: config().sendgrid.share_template_id
        }, {
          headers: {
            'Authorization': `Bearer ${config().sendgrid.api_key}`,
            'Content-Type': 'application/json'
          }
        }).then(() => res.status(200).send({status: t('common.messages.200') }))
          .catch(({ request, response: { status, data } }) => res.status(status).send(data))
      ))
    ))
  ))
))

const transformCeremonies = ceremonies =>
  Object.values(ceremonies).reduce((result, ceremony) => {
    result[ceremony.placement] = result[ceremony.placement] || { id: ceremony.placement, ceremonies: [] }
    result[ceremony.placement].ceremonies.push(ceremony)
    return result
  }, {})
