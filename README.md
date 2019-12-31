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
extends '???'.

## Usage
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
const Person = new LitVocabTerm('https://example.com#Person', localStorage, true)
  .addLabel('My Person class','en')
  .addComment('Full description of my Person class...','en')
```
