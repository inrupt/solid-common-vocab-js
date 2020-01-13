const LitVocabTermRdflib = require('./src/LitVocabTermRdflib')

require('mock-local-storage')

const person = new LitVocabTermRdflib('https://example.com#Person', localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')

console.log(person.label.value)