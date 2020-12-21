const { VocabTerm } = require('@inrupt/solid-common-vocab')
require('mock-local-storage')

const person = new VocabTerm('https://example.com#Person', localStorage, true)
  .addLabel('Person','en')
  .addLabel('Personne','fr')
  .addLabel('人', 'ch')
  .addComment('A human being, alive, dead or imaginary.','en')

console.log(`The default label for the class ${person.value} is ${person.label.value}`)
console.log(`The Chinese label for the class ${person.value} is ${person.asLanguage('ch').label.value}`)
