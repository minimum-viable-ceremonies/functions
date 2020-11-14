const { config } = require('firebase-functions')
const { endpoint } = require('../common')

module.exports = {
  authorize: endpoint(config().marketing.cors_origin, require('./authorize')),
  create: endpoint(config().slack.cors_origin, require('./create')),
  share: endpoint(config().app.cors_origin, require('./share')),
  join: endpoint(config().app.cors_origin, require('./join')),
  list: endpoint(config().app.cors_origin, require('./list')),
}
