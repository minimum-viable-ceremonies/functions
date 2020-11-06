const { config } = require('firebase-functions')
const { endpoint } = require('../common')

module.exports = {
  subscribe: endpoint(config().marketing.cors_origin, require('./subscribe')),
  share: endpoint(config().app.cors_origin, require('./share'))
}
