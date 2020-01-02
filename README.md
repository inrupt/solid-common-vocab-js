# lit-vocab-term-js
A very simple wrapper library for developers that provides convenient access to
the terms defined in RDF vocabularies (e.g. the classes and properties defined
in vocabularies like http://schema.org, or FOAF).
  
A major benefit of this library is that it provides easy access to any 
rdfs:label or rdfs:comment values defined on the terms, and provides ease-to-use
support for multi-lingual values for these labels, comments or message strings. 

## RDF library support
This library is intended to act as a simple wrapper around existing low-level
RDF Javascript libaries, like RdfExt or rdflib.js, although we also provide a
very simple base implementation that has no RDF library dependency at all.

We provide implementations for both rdf-ext (https
://github.com/rdf-ext/rdf-ext) and rdflib.js. Our rdf-ext library simply
extends the class 'rdf.defaults.NamedNode', whereas our rdflib.js extension
is not yet implemented.

## Usage
For detailed examples going beyond the common usages featured here, please see 
the [demonstration test suite](./test/DemonstrateUsage.test.js). Note that all 
the examples feature the `LitVocabTermBase` class, which is our lit-vocab-term 
implementation without any RDF library dependency. `LitVocabTermRdfExt` and 
`LitVocabTermRdfLib` both extend this class, and therefore provide the same
interface (except for the constructor, where the RDF factory becomes implicit).

### Introductory example

For example, if we have the following simple RDF vocab:
```
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex:   <https://example.com#>

ex:Person a rdfs:Class ;
  rdfs:label "My Person class"@en ;
  rdfs:comment "Full description of my Person class..."@en .
```

We would represent this as a LIT Vocab Term in Javascript like so:
```javascript
// Any other implementation of the RDFJS interface would be appropriate
const rdf = require('rdf-ext')

// The local storage is used as a context, and the last parameter indicates wether
// we want a 'strict' behaviour or not (see next for explanation).  
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')

const myIri = person.value
// The label and the comment are available as RDFJS RDFLiteral instances:
// - get the RDFLiteral object
const myLabel = person.label
const myComment = person.comment
// - get the string value
const myLabelValue = person.label.value
const myCommentValue = person.comment.value
```

To use the RDF-ext implementation of the lit-vocab-term, the previous example would
become: 

```javascript
// Note that the dependency on the RDF lib is integrated in the implementation
const person = new LitVocabTermRdfExt('https://example.com#Person', localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
// ...
```

### Messages

A feature of the lit-vocab-term is the support for parametric messages, which are
useful for instance to report an error to the user using contextual information.

```javascript
const term = new LitVocabTermBase("https://test.com/vocab#Unauthorized", rdf, localStorage, true)
    .addMessage('Your current account ({{0}}), does not have sufficient credentials for this operation', 'en')
term.messageParams('myLogin').value // evaluates to "Your current account (myLogin)..."
```

### Multilinguality

In the previous example, English is used as a default language. However, labels
and comments may (and should) be specified in multiple languages.

```javascript
// Any other implementation of the RDFJS interface would be appropriate
const rdf = require('rdf-ext')
 
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('Person','en')
  .addLabel('Personne', 'fr')
  .addLabel('Persona', 'es')

// Default english label
const myLabel = person.label
// Explicit language for the label
myLabel = person.asLanguage('fr').label

// Change the default language in the context
localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
myLabel = person.label // myLabel contains the Spanish literal 
```

### Strictness

The last parameter indicates if the behaviour of the term should be strict or loose.
In particular, in the case of a "loose" behaviour, in the absence of any label, 
`term.label` will default to the local part of the term's IRI, while it will 
return `undefined` when implementing a "strict" behaviour.

```javascript
// Any other implementation of the RDFJS interface would be appropriate
const rdf = require('rdf-ext')

// Here, a loose behaviour
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, false)

// myLabel will default to a literal with the value "Person", and the language tag @en
const myLabel = person.label 
 
// Now a strict behaviour
person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
// myLabel will default to undefined
myLabel = person.label
```

This behaviour (returning the local IRI or `undefined`) may be overriden to ensure
the presence of the label by using the `.mandatory` accessor: when it is specified, 
and the label is not available, an exception is thrown.

```javascript
// Any other implementation of the RDFJS interface would be appropriate
const rdf = require('rdf-ext')

// For the demonstrated usage, the strictness has no impact
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)

// An exception will be thrown
const myLabel = person.mandatory.label 
```

