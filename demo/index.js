// Normally we would import the package from a repository, but for this demo
// we can access the code directly.
const { VocabTerm } = require("../");
const { CONTEXT_KEY_LOCALE } = require("../");
// In your code, you would normally do:
// const { VocabTerm, CONTEXT_KEY_LOCALE } = require('@inrupt/solid-common-vocab')

// We need to provide an implementation for the RDF/JS interfaces. There are a
// number of implementations you can choose from, we've chosen this one:
const { DataFactory } = require("rdf-data-factory");

// Since we run as a simple Node.JS application, we need to provide some
// implementation of 'LocalStorage' that always exists in browsers.
require("mock-local-storage");

// Now we can create a single vocabulary term that has a bunch of meta-data
// associated with it.
const person = new VocabTerm(
  "https://example.com#Person",
  new DataFactory(),
  localStorage,
  true
)
  .addLabel("Person", "en")
  .addLabel("Personne", "fr")
  .addLabel("人", "ch")
  .addComment("A human being, alive, dead or imaginary.", "en");

// Now we can access and display the meta-data associated with our new
// vocabulary term.
console.log(
  `The default label for the class [${person.value}] is [${person.label}]`
);

console.log(
  `The French label for the class [${person.value}] is [${
    person.asLanguage("fr").label
  }]`
);

console.log(
  `The Chinese label for the class [${person.value}] is [${
    person.asLanguage("ch").label
  }]`
);

console.log(
  `The default comment for the class [${person.value}] is [${person.comment}]`
);

console.log(`Setting the default language to Chinese...`);
localStorage.setItem(CONTEXT_KEY_LOCALE, "ch");
console.log(
  `Now the default label for the class [${person.value}] is [${person.label}]`
);
