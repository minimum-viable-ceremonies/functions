const { createRoom } = require('../common')

module.exports = (req, t) =>
  createRoom(JSON.parse(req.body), t).errors
    ? [400, { status: t('common.errors.400') }]
    : [200, { status: t('common.messages.200') }]
