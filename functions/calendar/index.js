const { config } = require('firebase-functions')
const { endpoint } = require('../common')

module.exports = {
  upload: endpoint(config().app.cors_origin, require('./upload')),
  download: endpoint(config().app.cors_origin, require('./download'))
}
