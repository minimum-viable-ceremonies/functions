const { config } = require('firebase-functions')
const { endpoint } = require('../common')

module.exports = {
  create: endpoint(config().app.cors_origin, require('./create'))
}
