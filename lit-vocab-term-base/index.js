exports.LitContext = require("./src/LitContext");
exports.LitContextError = require("./src/LitContextError");
exports.LitMultiLingualLiteral = require("./src/LitMultiLingualLiteral");
exports.LitTermRegistry = require("./src/LitTermRegistry");

// We expect this class to be extended (e.g. by Rdf-Ext or rdflib.js) to
// provide higher-level RDF features.
exports.LitVocabTermBase = require("./src/LitVocabTermBase");

// We also provide a very simple implementation that requires no RDF
// libraries at all.
exports.LitVocabTermBasic = require("./src/basic/LitVocabTermBasic");