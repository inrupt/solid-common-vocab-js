# lit-vocab-term-js
A very simple wrapper library around rdf-ext (https://github.com/rdf-ext/rdf-ext) for working with RDF vocabulary terms.

In particular it supports defining constants for RDF terms (e.g. classes or properties, as IRI's) but that also provides access to any labels or comments for that term defined in the RDF vocabulary.

For example, if we have an RDF vocab as:

```
@prefix ex: <https://example.com#>

ex:Person a rdfs:Class ;
  rdfs:label "My Person class" ;
  rdfs:comment "Full description of my Person class..." .
```

We can represent this vocabulary in JavaScript as:
```javascript
```
