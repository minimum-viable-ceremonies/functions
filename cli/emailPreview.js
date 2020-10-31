const { compile } = require('handlebars')
const { readFileSync, writeFile } = require('fs')
const open = require('open')
const { safeLoad } = require('js-yaml')

const templateName = process.argv[2]
const template = readFileSync(`../functions/templates/${templateName}.hbs`).toString()
const fixture = {
  ...safeLoad(readFileSync(`./fixtures/${templateName}.yml`)),
  translations: safeLoad(readFileSync(`../functions/locales/en.yml`))
}

writeFile(
  `./dist/${templateName}.html`,
  compile(template)(fixture),
  (arg) => console.log(arg) || open(`dist/${templateName}.html`)
)
