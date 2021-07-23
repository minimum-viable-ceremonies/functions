const Handlebars = require('handlebars')
const { readFileSync, writeFile } = require('fs')
const open = require('open')
const { safeLoad } = require('js-yaml')

const templateName = process.argv[2]
const template = readFileSync(`../functions/templates/${templateName}.hbs`).toString()
const fixture = {
  ...safeLoad(readFileSync(`./fixtures/${templateName}.yml`)),
  translations: safeLoad(readFileSync(`../functions/locales/server/en.yml`)).templates[templateName]
}

Handlebars.registerPartial('cadence', readFileSync('../functions/templates/cadence.hbs').toString())
Handlebars.registerPartial('shareStyles', readFileSync('../functions/templates/shareStyles.hbs').toString())

writeFile(
  `./dist/${templateName}.html`,
  Handlebars.compile(template)(fixture),
  () => open(`dist/${templateName}.html`)
)
