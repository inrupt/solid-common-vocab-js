const {LitVocabTermRdfExt:LitVocabTerm} = require('@pmcb55/lit-vocab-term-rdf-ext')
require('mock-local-storage')

const person = new LitVocabTerm('https://example.com#Person', localStorage, true)
  .addLabel('Person','en')
  .addLabel('Personne','fr')
  .addLabel('人', 'ch')
  .addComment('A human being, alive, dead or imaginary.','en')

console.log(`The default label for the class ${person.value} is ${person.label.value}`)
console.log(`The Chinese label for the class ${person.value} is ${person.asLanguage('ch').label.value}`)
