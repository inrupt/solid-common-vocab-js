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

The lit-vocab-term libraries are distributed as a GitHub NPM packages:
- `@inrupt/lit-vocab-term-base`
- `@inrupt/lit-vocab-term-rdf-ext`

For more information about Github NPM packages, please visit [the dedicated documentation](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages).

### Introductory example

For example, if we have the following simple RDF vocabulary:
```
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex:   <https://example.com#>

ex:Person a rdfs:Class ;
  rdfs:label "My Person class"@en ;
  rdfs:comment "Full description of my Person class..."@en .
```

We could represent this as a LIT Vocab Term in Javascript like so:
```javascript
const {LitVocabTermBase} = require('@inrupt/lit-vocab-term-base')
// Any other implementation of the RDFJS interfaces would also be appropriate.
const rdf = require('rdf-ext')
require('mock-local-storage')

// 'localStorage' is used as a context. It's always there for browsers, but in NodeJS
// we recommend simply using [Mock Local Storage](https://www.npmjs.com/package/mock-local-storage).
// The last parameter indicates whether we want a 'strict' behaviour or not
// (see below for an explanation).  
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')

const myIri = person.value
// The label and the comment are available as RDFJS RDFLiteral instances:
// - get the RDFLiteral object (which contains not just the text value, but also the 
// language tag of that text (e.g. 'en' for English, or 'es' for Spanish), and potentially
// other meta-data (e.g. a description of where the text actually came from, for example
// if a user's current language preference was 'French', but we don't have
// a French label and therefore returned the 'English' label instead, then we
// can provide that information in a field describing this, which could be
// extremely useful in a User Interface tooltip for instance).
const myLabel = person.label
const myComment = person.comment
// - get the string value.
const myLabelValue = person.label.value
const myCommentValue = person.comment.value
```

To use the RDF-ext implementation of the lit-vocab-term, the previous example would
become: 

```javascript
// Note that the dependency on the RDF lib is integrated in the implementation.
const person = new LitVocabTermRdfExt('https://example.com#Person', localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
// ...
```

### Messages

An important feature of the lit-vocab-term is support for parameterized messages, that
can be extremely useful, for instance to report errors to the user with contextual
information.

```javascript
const term = new LitVocabTermBase("https://test.com/vocab#Unauthorized", rdf, localStorage, true)
    .addMessage('Your account ({{0}}), does not have sufficient credentials for this operation', 'en')
term.messageParams('My Current Account').value // Evaluates to "Your account (My Current Account)..."
```

### Multilinguality

English is always used as a default language (unless we explicitly mandate a specific 
language). However, labels and comments may (and should) be specified in multiple languages.
Note that the language tag defaults to an empty string in the case of fallback to 
the local part of the IRI (see the next section about strictness).

```javascript
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('Person','en')
  .addLabel('Personne', 'fr')
  .addLabel('Persona', 'es')

// Default to the English label (if there is one).
const myLabel = person.label

// Request an explicit language for the label (but if there isn't one, fallback to the
// English one, if there is one).
myLabel = person.asLanguage('fr').label

// Change the default language in the context
localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
myLabel = person.label // myLabel contains the Spanish literal 
```

### Strictness

The last parameter indicates if the behaviour of the term should be strict or loose.
In the case of "loose" behaviour, in the absence of any label, 
`term.label` will default to the local part (i.e. the last segment of the path
component) of the term's IRI, while it will return `undefined` in the case of
"strict" behaviour. When the local part of the IRI is returned as a label, no 
language tag is specified.

```javascript
// Here we specify loose behaviour(i.e. 'false' parameter to constructor)...
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, false)

// 'myLabel' will default to a literal with the value "Person", and the language tag @en.
const myLabel = person.label 
 
// Now strict behaviour...
person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
// myLabel will default to 'undefined'.
myLabel = person.label
```

This behaviour (returning the local part of the IRI, or `undefined`) may be overridden
to ensure the presence of the label by using the `.mandatory` accessor. When it is
specified, and an explicitly defined label is not available, an exception will be thrown.

```javascript
// Here 'strictness' has no impact...
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)

// An exception will be thrown, because we didn't provide have one.
const myLabel = person.mandatory.label 
```
