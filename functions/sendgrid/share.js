const axios = require('axios')
const { database } = require('firebase-admin')
const { config } = require('firebase-functions')

exports.share = (req, t) => (
  database().ref(`/rooms/${req.body.uuid}/ceremonies`).once('value').then(snapshot => (
    axios.post('https://api.sendgrid.com/v3/mail/send', {
      from: { email: "noreply@minimal.cards" },
      personalizations: [{
        to: [{ email: "james.kiesel@gmail.com" }],
        dynamic_template_data: {
          uuid: req.body.uuid,
          cadences: transformCeremonies(snapshot.toJSON(), t),
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
    }).then(() => [200, { status: t('common.messages.200') }])
      .catch(({ request, response: { status, data } }) => [status, data])
  ))
))

const transformCeremonies = (ceremonies, t) =>
  Object.values(ceremonies).reduce((result, ceremony) => {
    result[ceremony.placement] = result[ceremony.placement] || {
      id: ceremony.placement,
      name: t(`client.cadences.${ceremony.placement}.name`)
      ceremonies: []
    }
    result[ceremony.placement].ceremonies.push({
      ...ceremony,
      name: t(`client.ceremonies.${ceremony.id}.name`)
    })
    return result
  }, {})
