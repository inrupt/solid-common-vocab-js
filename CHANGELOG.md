# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.4.0 2023/10/02

- Better implementation of RDF type checkers. 

## 1.3.0 2023/10/02

- Rename RDF type Class and Property getters (to make them RDF-specific).

## 1.2.0 2023/10/01

- Fix RDF and RDFS term IRIs.

## 1.1.0 2023/10/01

- Add the ability to retrieve all the RDF:type values for any vocab term.
- Add convenience methods to ask if a vocab term is a Class or a Property (using
  RDF, RDFS, and OWL definitions of Class and Property).

## 1.0.1 2022/07/20

- Made CHANGELOG a markdown file by adding '.md' extension!
- Updated to now use the official RDF/JS TypeScript types.
- Tidied up demo code so both the Node.JS application and the usage
  demonstration tests both work now.
- Typo in README, and tidied up instructions for running demo code).
- Removed MacOS and Windows runners from CI.
- Moved actual storage Map() for internal local storage to be a global (instead
  of per-instance, which was a bug).

## 1.0.0 2021/10/11

- Open sourcing.

### Deprecation notice

- With Node.js version 10 [reaching end-of-life on
  2021-04-30](https://github.com/nodejs/Release),
  @inrupt/solid-common-vocab no longer actively supports it. It will not
  stop working right away, but it will no longer be actively tested and no
  special effort will be made to keep it from breaking.

## 0.5.3

### Internal refactor

- Replaced `@rdfjs/data-model` with `rdf-data-factory` (as it provides full
TypeScript compatibility with the RDF/JS DataFactory type).
- Only require RDF/JS implementation as a Dev dependency as opposed to a full
dependency (meaning users of this library are completely free to depend on
whatever implementation they choose).

## 0.5.2

### Patches

- Export useful RDF/JS types directly.

## 0.4.2

### Patches

- Fixed the license SPDX in `package.json`.