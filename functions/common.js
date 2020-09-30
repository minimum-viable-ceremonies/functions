const { database } = require('firebase-admin')
const phrase = require('random-words')
const cors = require('cors')
const fs = require('fs')

exports.createRoom = ({
  name,
  uuid = phrase({ exactly: 3, join: '-' }),
  features = {},
  weekCount = 1,
  template = 'default'
}) => {
  const errors = {}

  if (!name) { errors.name = ['Name is required'] }
  if (!uuid) { errors.uuid = ['Uuid is required'] }

  if (Object.values(errors).length) { return { errors } }

  const ceremonies = fs.readFileSync(`templates/${template}`, 'utf-8')
    .split('\n')
    .filter(id => id.length > 0)
    .reduce((result, id, index) => {
      result[id] = { id, index, async: true, placement: 'undecided' }
      return result
    }, {})

  database().ref(`/rooms/${uuid}`).set({ name, features, weekCount, ceremonies })

  return { uuid, name, features, weekCount, ceremonies }
}
