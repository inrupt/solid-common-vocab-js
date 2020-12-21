# The Solid Common Vocab library for JavaScript

A very simple library that provides JavaScript objects that represent the
individual terms (i.e. the classes and properties) defined in RDF vocabularies
(both existing vocabularies (like http://schema.org, FOAF, VCard, LDP,
ActivityStreams, etc.) and your own custom RDF vocabularies).
  
A major feature of this library is that it provides easy access to any 
`rdfs:label` or `rdfs:comment` values provided for these vocabulary terms, and 
provides very easy-to-use support for multi-lingual values for these labels and
comments (and generic message strings).

### Setup

The `demo` directory provides an extremely basic working example that you can run
with the following commands:
```
cd demo
npm install
node index.js
```

For detailed examples going beyond the common usages featured here, please see 
the [demonstration test suite](./demo/DemonstrateUsage.test.js). 

The `solid-common-vocab` library is distributed as a Github NPM packages: `@inrupt/solid-common-vocab`
For more information about Github NPM packages, please visit [the dedicated documentation](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages).


**NOTE:** This library is used extensively by the Artifact Generator project 
that can automatically generate source-code (in multiple programming languages, 
including JavaScript) that provides Vocab Term instances for every term
defined within any RDF vocabulary. Due to the ease of simply pointing the
Artifact Generator at any RDF vocabulary, and _have it_ automatically generate all
the Vocab Term instances for you automatically, we don't expect manual
instantiation of Vocab Terms to be very common. However, this documentation
describes the Vocab Term library without any dependency or requirement to
use the Artifact Generator whatsoever.

## RDF library support

The Vocab Term objects from this library are intended to be simple wrappers
around 'NamedNode' objects conforming to the [RDFJS interface](http://rdf.js.org/data-model-spec/).
This means that Vocab Term instances can be used natively with libraries that
are RDFJS-compliant, such as `rdf-ext` or `rdflib.js`. A `VocabTerm` may be
built by passing an RDFJS `DataFactory` implemented with any library, but it also
embeds a basic `DataFactory` implementation for simplicity.

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

We could represent this as a Vocab Term in JavaScript like so:
```javascript
const {VocabTerm, buildStore} = require('@inrupt/solid-common-vocab')
// Any other implementation of the RDFJS interfaces would also be appropriate.
const rdf = require('rdfFactory-ext')

// The third argument provides as a context - it will commonly store things like the current
// language preference of the user, which can be used to lookup term labels or comments
// in that language. It's always there for browsers, but in NodeJS we expose a local 
// implementation accessible through the method `buildStore`, which returns either
// said local implementation or the browser store depending on the environment.
// The last parameter indicates whether we want a 'strict' behaviour or not
// (see below for an explanation).  
const person = new VocabTerm('https://example.com#Person', rdf, buildStore(), true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
```

We can use this vocab term in various ways:
```javascript
// To access the term's full IRI value:
const personIri = person.value

// The label and the comment are available as RDFJS RDFLiteral instances:
// - get the RDFLiteral object (which contains not just the text value, but also the 
// language tag of that text (e.g. 'en' for English, or 'es' for Spanish).
// Solid Common can potentially offer further meta-data - such as a description of how the
// text was determined. For example if a user's current language preference (as stored
// in localStorage) was 'French', but our original RDF vocabulary didn't provide a
// French label (in which case the vocab term will fallback to using an English
// label by default), then we can describe that behaviour in another field saying:
// "Current language is French, but only German, Spanish and English labels are available: using English",
// which can be extremely useful in a User Interface tooltip for instance):
const personLabel = person.label
const personComment = person.comment

// Get the term's label or comment as a simple string value:
const personLabelAsString = person.label.value
const personCommentAsString = person.comment.value
```

To use the emmbedded `DataFactory` implementation to build a VocabTerm, the 
previous example would become: 

```javascript
const {buildBasicTerm, buildStore} = require('@inrupt/solid-common-vocab')

const person = buildBasicTerm('https://example.com#Person', buildStore(), true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
```

**NOTE**: The `solid-common-vocab` library is implemented in TypeScript, and embeds 
its typing. The following snippet of code demonstrate a basic TypeScript usage:

```typescript
import {buildBasicTerm, buildStore, VocabTerm} from '@inrupt/solid-common-vocab'

const person: VocabTerm = buildBasicTerm(
  'https://example.com#Person',
  buildStore(),
  true
).addLabel('My Person class','en')
.addComment('Full description of my Person class...','en')
```

### Messages

An important feature of the `solid-common-vocab` is support for parameterized messages.
This can be extremely useful when defining your own RDF vocabularies and including
message strings (thereby providing those message with globally unique IRI identifiers
and allowing for easy translations of those messages). For instance, to report errors
to the user with contextual information (and in multiple languages).

```javascript
const term = new VocabTerm("https://test.com/vocab#Unauthorized", rdf, buildStore(), true)
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
const storage = buildStore()
const person = new VocabTerm('https://example.com#Person', rdf, storage, true)
  .addLabel('Person','en')
  .addLabel('Personne', 'fr')
  .addLabel('Persona', 'es')

// Default to the English label (if there is one).
var personLabel = person.label

// Request an explicit language for the label (but if there isn't one, fallback to the
// English one, if there is one).
personLabel = person.asLanguage('fr').label

// Change the default language in our context (i.e. localStorage).
storage.setItem(VocabContext.CONTEXT_KEY_LOCALE, 'es')

personLabel = person.label // personLabel now contains the Spanish literal.
```

### Strictness

The last parameter to the Vocab Term constructor indicates if the behaviour
of the term should be strict or loose.
In the case of "loose" behaviour, in the absence of any label, 
`term.label` will default to the local part (i.e. the last segment of the path
component) of the term's IRI. With "strict" behaviour it will return `undefined`.
When the local part of the IRI is returned as a label the language tag will be
empty (i.e. "").

```javascript
// Here we specify 'loose' behaviour(i.e. 'false' parameter to constructor)...
var person = new VocabTerm('https://example.com#Person', rdf, buildStore(), false)

// 'personLabel' will default to an RDF literal with the value "Person", and an empty
// language tag (i.e. "").
var personLabel = person.labelLiteral 
 
// Now strict behaviour...
person = new VocabTerm('https://example.com#Person', rdf, buildStore(), true)
// personLabel will default to 'undefined'.
personLabel = person.labelLiteral
```

This behaviour (i.e. returning the local part of the IRI, or `undefined`) may be overridden
to instead throw an error when no label is found by using the `.mandatory` accessor.

```javascript
// Here 'strictness' has no impact...
const person = new VocabTerm('https://example.com#Person', rdf, buildStore(), true)

// An exception will be thrown here, because our term has no label.
const personLabel = person.mandatory.label 
```
