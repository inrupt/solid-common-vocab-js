# lit-vocab-term-js
A very simple wrapper library for developers that provides convenient access to
the terms defined in RDF vocabularies (e.g. the classes and properties defined
in vocabularies like http://schema.org, or FOAF).
  
A major benefit of this library is that it provides easy access to any 
rdfs:label or rdfs:comment values defined on the terms, and provides ease-to-use
support for multi-lingual values for these labels, comments or message strings. 

**NOTE:** This library is used extensively by the LIT Artifact Generator project
that can automatically generate source-code (in multiple programming languages,
including JavaScript) that provides LIT Vocab Term instances for every term
defined within any RDF vocabulary. Due to the ease of simply pointing the LIT
Artifact Generator at any RDF vocabulary, and have it automatically generate all
the LIT Vocab Term instances for you automatically, we don't expect manual
instantiation of LIT Vocab Terms to be very common. However, this documentation
describes the LIT Vocab Term library without any dependency or requirement to
use the LIT Artifact Generator whatsoever.

### Setup

The `demo` directory provides an extremely basic working example that you can run
with the following commands:
```
cd demo
npm install --registry=https://verdaccio.inrupt.com
node index.js
```

This very simple example can be incrementally extended by pasting in code from
the steps described below.

(**NOTE**: If you want instead to use the `rdflib`-flavoured `LitVocabTerm`, 
replace the references to `LitVocabTermRdfExt` on the first line of `index.js`
with `LitVocabTermRdflib`, and update `package.json` to depend on
`@pmcb55/lit-vocab-term-rdflib`)


## RDF library support
This library is intended to act as a simple wrapper around existing low-level
RDF JavaScript libraries, like RdfExt or rdflib.js, although we also provide a
very simple base implementation that has no RDF library dependency at all.

We provide implementations for both rdf-ext (https
://github.com/rdf-ext/rdf-ext) and rdflib.js. Our rdf-ext library simply
extends the class 'rdf.defaults.NamedNode', and our rdflib.js extension extends
the class 'NamedNode'.

## Usage
For detailed examples going beyond the common usages featured here, please see 
the [demonstration test suite](./test/DemonstrateUsage.test.js). Note that all 
the examples feature the `LitVocabTermBase` class, which is our lit-vocab-term 
implementation without any RDF library dependency. `LitVocabTermRdfExt` and 
`LitVocabTermRdfLib` both extend this class, and therefore provide the same
interface (except for the constructor, where the RDF factory becomes implicit).

The lit-vocab-term libraries are distributed as a GitHub NPM packages:
- `@pmcb55/lit-vocab-term-base`
- `@pmcb55/lit-vocab-term-rdf-ext`

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

We could represent this as a LIT Vocab Term in JavaScript like so:
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

An important feature of the LIT Vocab Term is support for parameterized
messages. This can be extremely useful when defining your own RDF vocabularies
and including message strings (thereby providing those message with globally
unique IRI identifiers, and allowing for easy translations of those messages).

For instance, to report errors to the user with contextual information (e.g.
the name of a file that fails to open, or a current account balance and the
attempted withdrawal amount when there are insufficient funds in a bank
account), and to provide these contextual message in multiple languages.

```javascript
const term = new LitVocabTermBase("https://test.com/vocab#Unauthorized", rdf, localStorage, true)
    .addMessage('Your account ({{0}}), does not have sufficient credentials for this operation', 'en')
term.messageParams('My Current Account').value // Evaluates to "Your account (My Current Account)..."
```

### Multilinguality

Unless we explicitly mandate a specific language, English will be used as the
default language. Best practice for RDF vocabularies in general is to provide
labels (short human readable descriptions) and comments (longer, more detailed
descriptions), and to also provide these descriptions in multiple languages if
appropriate and possible.

(**Technical note:** the language tag for the label of a term will default to an
empty string in the case of an RDF vocabulary term that does not provide any
explicit labels value (i.e. it provides no `rdfs:label` values at all), and
where we fallback to the local part of the term's IRI instead (see the next
section about strictness)).

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

personLabel = person.label // 'personLabel' now contains the Spanish literal.
```

### Strictness

The last parameter to the LIT Vocab Term constructor indicates if the behaviour
of the term should be strict or loose.
In the case of "loose" behaviour, in the absence of any label, `term.label` will
default to the local part (i.e. the last segment of the path component) of the
term's IRI, while it will return `undefined` in the case of "strict" behaviour.
When the local part of the IRI is returned as a label, no language tag is
specified.

```javascript
// Here we specify loose behaviour(i.e. 'false' parameter to constructor)...
var person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, false)

// 'personLabel' will default to a literal with the value "Person", and the language tag @en.
var personLabel = person.label 
 
// Now strict behaviour...
person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)
// 'personLabel' will default to 'undefined'.
personLabel = person.label
```

This behaviour (returning the local part of the IRI, or `undefined`) may be overridden
to ensure the presence of the label by using the `.mandatory` accessor. When it is
specified, and an explicitly defined label is not available, an exception will be thrown.

```javascript
// Here 'strictness' has no impact...
const person = new LitVocabTermBase('https://example.com#Person', rdf, localStorage, true)

// An exception will be thrown, because we didn't provide have one.
const personLabel = person.mandatory.label 
```

## To go further

### Usage in another library

If you want to see how these libraries are used to make available in code actual
RDF vocabularies, check out [the LIT RDF vocabularies repository](https://github.com/pmcb55/lit-rdf-vocab). 

### Advanced building instructions

If for some reasons you want to build and publish a version of these libraries to
a local Verdaccio, be aware that `lit-vocab-term-base` should published before
either `lit-vocab-term-rdf-ext` or `lit-vocab-term-rdflib` may be built:
```
cd lit-vocab-term/lit-vocab-term-base
npm publish --registry=http://localhost:4873
cd ../lit-vocab-term-rdfliib
npm install --registry=http://localhost:4873
```
