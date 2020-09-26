const firebase = require('firebase-admin')

firebase.initializeApp({
  apiKey: process.env.MVC_FIREBASE_API_KEY,
  authDomain: `${process.env.MVC_FIREBASE_DOMAIN}.firebaseapp.com`,
  databaseURL: `https://${process.env.MVC_FIREBASE_DOMAIN}.firebaseio.com`,
  projectId: `${process.env.MVC_FIREBASE_DOMAIN}`,
  storageBucket: `${process.env.MVC_FIREBASE_DOMAIN}.appspot.com`,
})

exports.calendar = require('./calendar')
exports.sendgrid = require('./sendgrid')
exports.room = require('./room')
