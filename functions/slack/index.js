const { config } = require('firebase-functions')
const { endpoint } = require('../common')

module.exports = {
  authorize: endpoint(config().marketing.cors_origin, require('./authorize')),
  create: endpoint(config().slack.cors_origin, require('./create'))
}
