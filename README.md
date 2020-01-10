# The Linked data Integration Toolkit (LIT) for Javascript
This toolkit is intended to contain a number of libraries, that collectively
make up the LIT for Javascript. These libraries are intended to be used by Javascript 
developers working with RDF.

## lit-vocab-term-js
A very simple library that provides Javascript objects that represent the individual
terms (i.e. the classes and properties) defined in RDF vocabularies (both existing
vocabularies (like http://schema.org, FOAF, VCard, LDP, ActivityStreams, etc.) and
your own custom RDF vocabularies).
  
A major feature of this library is that it provides easy access to any 
`rdfs:label` or `rdfs:comment` values provided for these vocabulary terms, and 
provides very easy-to-use support for multi-lingual values for these labels and
comments (and generic message strings).

**NOTE:** This library is used extensively by the LIT Artifact Generator project 
that can automatically generate source-code (in multiple programming languages, 
including Javascript) that provides LIT Vocab Term instances for every term
defined within any RDF vocabulary. Due to the ease of simply pointing the LIT
Artifact Generator at any RDF vocabulary, and _have it_ automatically generate all
the LIT Vocab Term instances for you automatically, we don't expect manual
instantiation of LIT Vocab Terms to be very common. However, this documentation
describes the LIT Vocab Term library without any dependency or requirement to
use the LIT Artifact Generator whatsoever.

## RDF library support
The LIT Vocab Term objects from this library are intended to be simple wrappers
around 'NamedNode' objects from existing low-level RDF Javascript libaries,
such as RdfExt or rdflib.js. This means that LIT Vocab Term instances can be
used natively with these libraries. We do however also provide a simple
implementation that has no external RDF library dependency at all.

We provide implementations for both rdf-ext (https
://github.com/rdf-ext/rdf-ext) and rdflib.js. Our rdf-ext library simply
extends the class 'rdf.defaults.NamedNode', and our rdflib.js extension
extends the class 'NamedNode'.

## Usage
For detailed examples going beyond the common usages featured here, please see 
the [demonstration test suite](./test/DemonstrateUsage.test.js). Note that all 
the examples feature the `LitVocabTermBase` class, which is our lit-vocab-term 
implementation without any RDF library dependency. `LitVocabTermRdfExt` and 
`LitVocabTermRdfLib` both extend this class, and therefore provide the same
interface (except for the constructor, where the RDF factory becomes implicit).

The lit-vocab-term libraries are distributed as Github NPM packages:
- `@pmcb55/lit-vocab-term-base`
- `@pmcb55/lit-vocab-term-rdf-ext`

For more information about Github NPM packages, please visit [the dedicated documentation](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages).

### Introductory example

For example, if we have the following simple RDF vocabulary defining a single
`Person` term (in this case a Class):
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

// 'localStorage' is used as a context - it will commonly store things like the current
// language preference of the user, which can be used to lookup term labels or comments
// in that language. It's always there for browsers, but in NodeJS we recommend simply
// using [Mock Local Storage](https://www.npmjs.com/package/mock-local-storage).
// The last parameter indicates whether we want a 'strict' behaviour or not
// (see below for an explanation).  
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
```

We can use this LIT vocab term in various ways:
```javascript
// To access the term's full IRI value:
const personIri = person.value

// The label and the comment are available as RDFJS RDFLiteral instances:
// - get the RDFLiteral object (which contains not just the text value, but also the 
// language tag of that text (e.g. 'en' for English, or 'es' for Spanish).
// The LIT can potentially offer further meta-data - such as a description of how the
// text was determined. For example if a user's current language preference (as stored
// in localStorage) was 'French', but our original RDF vocabulary didn't provide a
// French label (in which case the LIT vocab term will fallback to using an English
// label by default), then we can describe that behaviour in another field saying:
// "Current language is French, but only German, Spanish and English labels are available: using English",
// which can be extremely useful in a User Interface tooltip for instance):
const personLabel = person.label
const personComment = person.comment

// - get the term's label or comment as a simple string value:
const personLabelAsString = person.label.value
const personCommentAsString = person.comment.value
```

To use the RDF-ext implementation of the lit-vocab-term, the previous example would
become: 

```javascript
// Note that the dependency on the RDF library is integrated in the implementation.
const person = new LitVocabTermRdfExt('https://example.com#Person', localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
// ...
```

### Messages

An important feature of the `lit-vocab-term` is support for parameterized messages.
This can be extremely useful when defining your own RDF vocabularies and including
message strings (thereby providing those message with globally unique IRI identifiers
and allowing for easy translations of those messages). For instance, to report errors
to the user with contextual information (and in multiple languages).

```javascript
const term = new LitVocabTermBase("https://test.com/vocab#Unauthorized", rdf, localStorage, true)
    .addMessage('Your account ({{0}}), does not have sufficient credentials for this operation', 'en')
    .addMessage('Votre compte ({{0}}) ne dispose pas des informations d'identification suffisantes pour cette opération', 'fr')
    
term.messageParams('Current Account').value // Evaluates to "Your account (Current Account)..."
```

### Multilinguality

Unless we explicitly mandate a specific language, English will be used as the default
language. Best practice for RDF vocabularies in general is to provide labels (short 
human readable descriptions) and comments (longer, more detailed descriptions), and to
also provide these descriptions in multiple languages if appropriate and possible.
(Technical note: the language tag defaults to an empty string in the case of fallback to 
the local part of the term's IRI (see the next section about `strictness`)).

```javascript
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
  .addLabel('Person','en')
  .addLabel('Personne', 'fr')
  .addLabel('Persona', 'es')

// Default to the English label (if there is one).
var personLabel = person.label

// Request an explicit language for the label (but if there isn't one, fallback to the
// English one, if there is one).
personLabel = person.asLanguage('fr').label

// Change the default language in our context (i.e. localStorage).
localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')

personLabel = person.label // personLabel now contains the Spanish literal.
```

### Strictness

The last parameter to the LIT Vocab Term constructor indicates if the behaviour
of the term should be strict or loose.
In the case of "loose" behaviour, in the absence of any label, 
`term.label` will default to the local part (i.e. the last segment of the path
component) of the term's IRI. With "strict" behaviour it will return `undefined`.
When the local part of the IRI is returned as a label the language tag will be
empty (i.e. "").

```javascript
// Here we specify 'loose' behaviour(i.e. 'false' parameter to constructor)...
var person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, false)

// 'personLabel' will default to a literal with the value "Person", and the language tag @en.
var personLabel = person.label 
 
// Now strict behaviour...
person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
// personLabel will default to 'undefined'.
personLabel = person.label
```

This behaviour (i.e. returning the local part of the IRI, or `undefined`) may be overridden
to instead throw an error when no label is found by using the `.mandatory` accessor.

```javascript
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)

// An exception will be thrown here, because our term has no label.
const personLabel = person.mandatory.label 
```
