const { https } = require('firebase-functions')

exports.helloWorldRequest = https.onRequest((req, res) => {
  res.json({
    message: "Hello from Minimum Viable Ceremonies! (onRequest)"
  })
})

exports.helloWorldCall = https.onCall((data, context) => {
  return {
    message: "Hello from Minimum Viable Ceremonies! (onCall)"
  }
})
