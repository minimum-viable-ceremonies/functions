const firebase = require('firebase-admin')
const { config } = require('firebase-functions')

firebase.initializeApp({
  apiKey: config().root.api_key,
  authDomain: `${config().root.domain}.firebaseapp.com`,
  databaseURL: `https://${config().root.domain}.firebaseio.com`,
  projectId: `${config().root.domain}`,
  storageBucket: `${config().root.domain}.appspot.com`,
})

exports.calendar = require('./calendar')
exports.mvc = require('./mvc')
exports.sendgrid = require('./sendgrid')
exports.slack = require('./slack')
