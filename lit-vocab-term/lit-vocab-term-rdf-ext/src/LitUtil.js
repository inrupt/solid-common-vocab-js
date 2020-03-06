"use strict";

const debug = require("debug")("lit-vocab-term:LitUtil");

const rdf = require("rdf-ext");
const rdfFormats = require("@rdfjs/formats-common");
const stringToStream = require("string-to-stream");
const streamToString = require("stream-to-string");

const fs = require("fs");
const uuidv1 = require("uuid/v1");

const {
  LitContextError,
  LitVocabTermBase
} = require("@pmcb55/lit-vocab-term-base");

module.exports.generateUuid = uuidv1;

const defaultWebIdServerDomain = "https://NoSolidServer";
module.exports.DEFAULT_WEDID_SERVER_DOMAIN = defaultWebIdServerDomain;

// For use when generating IRI's but the programmer has not configured a
// specific application name (just to be used as a hint within IRI's generated
// by that application).
module.exports.NO_APPLICATION_HINT = "NO-APP";

// NOTE: This namespace is defined in the LIT Core RDF vocabulary, but we can't
// have a dependency on the source code generated from that RDF as we are too
// low-level a library. Unfortunately this means we need to manually keep this
// value in sync with that RDF vocabulary (and the code generated from it).
// TODO: Currently (Mar 2019) we have very limited only use of this value, so
//  perhaps we should force the passing of this value to that GUID-generating
//  method, or force the use of an environment variable...
const litCoreNamespace = "https://w3id.org/lit/vocab/core#";
module.exports.LIT_CORE_NAMESPACE = litCoreNamespace;

/**
 * When adding HTTP header data to an RDF payload we need to provide full
 * IRI's, so we use this very LIT-specific prefix for them, e.g. for passing
 * back an 'accept-language' value that ultimately we want added to an HTTP
 * response as the standard HTTP 'accept-language' header.
 *
 * @returns {string}
 */
module.exports.prefixForHttpHeader = () => {
  return `${litCoreNamespace}prefixForHttpHeader_`;
};

/**
 * Creates a WebID based on the specified username (which is used as a
 * subdomain). The IRI generated depends on how the system is configured (i.e.
 * to use a Solid server or just local development).
 *
 * @param userName
 * @returns {NamedNode} NOTE: Returns a NamedNode instance, not a String!
 */
module.exports.createWebId = username => {
  const server = process.env.DATA_SERVER_SOLID || defaultWebIdServerDomain;
  return rdf.namedNode(
    `https://${username}.${server.substring(8)}/profile/card#me`
  );
};

/**
 * Generates a Skolem (a unique IRI using the 'well-known' convention).
 *
 * @param codeContext Optional value to include in the IRI (intended to provide
 * a helpful reference to where in our code this IRI is being generated, i.e.
 * the context within our code).
 * @returns {*}
 */
module.exports.generateWellKnownIri = codeContext => {
  const uuid = this.generateUuid();

  if (codeContext === undefined) {
    throw Error(
      `Currently we require a code context when generating Well Known IRI's to always provide hints to where resources are created (may relax this if it proves a problem).`
    );
  }

  if (!process.env.NODE_ENV || process.env.NODE_ENV.startsWith("dev")) {
    return rdf.namedNode(`https://DEV/${codeContext}/${uuid}`);
  }

  return rdf.namedNode(`${litCoreNamespace}.well-known/${codeContext}/${uuid}`);
};

let DEV_ONLY_ID = 0;
/**
 *
 * @returns {*}
 */
module.exports.generateUuid = () => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV.startsWith("dev")) {
    return DEV_ONLY_ID++;
  }

  return uuidv1();
};

/**
 * Provide a context string from the current location in the code (i.e. using
 * the specified class and function name). This is intended to aid debugging,
 * by providing a little more context to IRI's generated throughout the code
 * (e.g. this context might tell you where in the code a collection of RDF was
 * created).
 *
 * ISSUE: Security might be a concern in terms of leaking code internals
 * externally?
 * TRADEOFF: This context results in longer, more 'noisy' IRI's.
 *
 * @param clazz
 * @param func
 * @returns {string}
 */
module.exports.codeContext = (clazz, func) => {
  let iri = process.env.IRI_HINT_APPLICATION
    ? `${process.env.IRI_HINT_APPLICATION}`
    : module.exports.NO_APPLICATION_HINT;
  iri += clazz && clazz.constructor ? `/${clazz.constructor.name}` : "";
  iri += func ? `/${func}` : "";

  return iri;
};

/**
 * Loads a Turtle file (just 'cos we use Turtle by default - easy to refactor
 * if other serializations needed) and returns the parsed dataset.
 *
 * @param filename The Turtle resource to load.
 * @param resolveFunc
 * @param rejectFunc
 */
module.exports.loadTurtleFile = (filename, resolveFunc, rejectFunc) => {
  return this.loadTurtleFileIntoDataset(
    filename,
    undefined,
    resolveFunc,
    rejectFunc
  );
};

module.exports.loadTurtleFilePromise = filename => {
  return this.loadTurtleFileIntoDatasetPromise(filename, undefined);
};

module.exports.loadTurtleFileIntoDatasetPromise = (filename, dataset) => {
  const mimeType = "text/turtle";
  const data = fs.readFileSync(filename, "utf8");

  const rdfParser = rdfFormats.parsers.get(mimeType);
  const quadStream = rdfParser.import(stringToStream(data));
  return (dataset ? dataset : rdf.dataset()).import(quadStream);
};

/**
 * Loads a Turtle file (just 'cos we use Turtle by default - easy to refactor
 * if other serializations needed) into the specified dataset and also returns
 * the parsed dataset.
 *
 * @param filename The Turtle resource to load.
 * @param dataset Dataset to put loaded data (if 'undefined' we'll create an
 * empty dataset).
 * @param resolveFunc
 * @param rejectFunc
 */
module.exports.loadTurtleFileIntoDataset = async (
  filename,
  dataset,
  resolveFunc,
  rejectFunc
) => {
  return await this.loadTurtleFileIntoDatasetPromise(filename, dataset)
    .then(resolveFunc)
    .catch(rejectFunc);
};

/**
 * Saves a dataset to the specified file as RDF (uses Turtle if no media type
 * provided).
 *
 * @param dataset
 * @param filename
 * @param resolveFunc
 * @param rejectFunc
 */
module.exports.saveDatasetToFile = (
  dataset,
  filename,
  resolveFunc,
  rejectFunc,
  mediaType = "text/turtle",
  encoding = "utf-8"
) => {
  const fileStream = fs.createWriteStream(filename, { encoding: encoding });

  const serializer = rdfFormats.serializers.get(mediaType);
  const quadStream = serializer.import(dataset.toStream());
  quadStream.pipe(fileStream);
};

/**
 * Serializes the specified dataset using the specified media type (e.g.
 * JSON-LD, Turtle, etc.) and returns it as a string in the specified encoding.
 *
 * @param dataset
 * @param mediaType
 * @returns {Promise}
 */
module.exports.datasetToString = (
  dataset,
  mediaType = "text/turtle",
  encoding = "utf-8"
) => {
  const serializer = rdfFormats.serializers.get(mediaType);
  const quadStream = serializer.import(dataset.toStream());
  return streamToString(quadStream, encoding);
};

module.exports.quadsToString = async quads => {
  return await this.datasetToString(rdf.dataset().addAll(quads));
};

/**
 * Convenience method for debugging - writes to console the specified quad or
 * quads. Works asynchronously, so you need to invoke it with 'await'.
 *
 * @param quads The quad or quads to display
 * @param mediaType RDF serialization (Turtle by default)
 * @param encoding Encoding (UTF-8 by default)
 * @returns {Promise<void>}
 */
module.exports.console = async (quads, message = "") => {
  const result = await this.datasetToString(
    Array.isArray(quads)
      ? rdf.dataset().addAll(quads)
      : rdf.dataset().add(quads)
  );

  debug(`================ ${message} START  ===================`);
  debug(result);
  debug(`================  ${message} END   ===================`);
  return result;
};

/**
 *
 * @param statusCode
 * @returns {Promise<void>}
 */
module.exports.isHttpOk = statusCode => {
  let code;
  switch (typeof statusCode) {
    case "string":
      code = Number(statusCode);
      if (isNaN(code)) {
        throw Error(
          `Could not convert string status code [${String(
            statusCode
          )}] to a valid number, so could not determine if it represents an OK status or not.`
        );
      }
      break;

    case "number":
      code = statusCode;
      break;

    case "object":
      if (!statusCode.termType || statusCode.termType !== "Literal") {
        throw Error(
          `Status code [${String(
            statusCode
          )}] was of type Object, but we only support RDF Literals - could not check if it represents an OK status or not.`
        );
      }

      code = statusCode.valueOf();
      break;

    default:
      throw Error(
        `Could not determine datatype of specified status code [${String(
          statusCode
        )}] to check if it represents an OK status or not.`
      );
  }

  return code >= 200 && code <= 299;
};

module.exports.replaceIriLocalName = (iri, replacement) => {
  const iriValue = iri.value;
  const pos = Math.max(iriValue.lastIndexOf("#"), iriValue.lastIndexOf("/"));
  if (pos === -1) {
    throw Error(
      `Could not find an IRI separator (e.g. '#' or '/') when trying to replace local name of IRI [${iri.valueOf()}] with [${replacement}].`
    );
  }

  return rdf.namedNode(iriValue.substring(0, pos) + "/" + replacement);
};
//
// /**
//  * Extract the local name from the specified IRI (can be a primitive string or
//  * a NamedNode).
//  *
//  * @param stringOrNamedNode The IRI to extract from.
//  * @returns {string}
//  */
// module.exports.extractIriLocalName = (stringOrNamedNode) => {
//   const iri = module.exports.isString(stringOrNamedNode)
//     ? stringOrNamedNode : stringOrNamedNode.value
//
//   const hashPos = iri.lastIndexOf('#')
//   if (hashPos === -1) {
//     const lastSlashPos = iri.lastIndexOf('/')
//     if ((lastSlashPos === -1) ||
//       (iri.toLowerCase().startsWith('http') &&
//         (lastSlashPos < (iri.toLowerCase().startsWith('https') ? 8 : 7)))) {
//       throw Error(`Expected hash fragment ('#') or slash ('/') (other than 'https://...') in IRI [${iri}]`)
//     }
//
//     return iri.substring(lastSlashPos + 1)
//   }
//
//   return iri.substring(hashPos + 1)
// }

/**
 * Returns a newly minted IRI (NamedNode) that is relative to the specified
 * IRI. If no relative reference provided, then the original IRI is simply
 * returned as-is.
 *
 * @param iri
 * @param relativePart
 * @param appendGuid true if we should append a GUID to the new IRI.
 * @returns {*}
 */
module.exports.makeRelativeIri = (iri, relativePart, appendGuid) => {
  if (relativePart === undefined) {
    return iri;
  }

  let workingIri = this.stripTrailingPathSegment(iri.value);
  let workingPath = relativePart;
  while (workingPath.startsWith("../")) {
    workingPath = workingPath.substring(3);
    try {
      workingIri = this.stripTrailingPathSegment(workingIri);
    } catch (ex) {
      throw Error(
        `Failed to create a relative IRI from original IRI of [$(iri.value}] replacing with relative part [${relativePart}].`
      );
    }
  }

  return rdf.namedNode(
    `${workingIri}/${workingPath}${appendGuid ? "/" + this.generateUuid() : ""}`
  );
};

module.exports.stripTrailingPathSegment = iriString => {
  const pos = Math.max(iriString.lastIndexOf("#"), iriString.lastIndexOf("/"));
  if (pos === -1) {
    throw Error(
      `Could not find an IRI separator (e.g. '#' or '/') when trying to replace local name of IRI [${iriString}].`
    );
  }
  return iriString.substring(0, pos);
};

module.exports.escapeRegExp = str => {
  return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
};

module.exports.replaceAll = (str, find, replace) => {
  return str.replace(new RegExp(this.escapeRegExp(find), "g"), replace);
};

// /**
//  * Simple method to determine if the specified value is a primitive String.
//
//  * @param value The value to evaluate.
//  * @returns {boolean} true if String, else false.
//  */
// module.exports.isString = (value) => {
//   return ((typeof value === 'string') || (value instanceof String))
// }
//
//
// /**
//  * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
//  * (case-insensitive).
//  *
//  * @param value
//  * @returns {boolean}
//  */
// module.exports.isStringIri = (value) => {
//   const valueLower = value.toLowerCase()
//   return (valueLower.startsWith('http://') || valueLower.startsWith('https://'))
// }

/**
 * Validates that the specified value is a valid IRI - i.e. either an explicit
 * NamedNode, or a string that starts with a valid HTTP(s) scheme.
 *
 * NOTE: This method is highly restricted to use work with LIT-specific classes,
 * i.e. classes that *MUST* implement specific methods, since we need to invoke
 * these methods for error conditions.
 *
 * @param value The value to validate.
 * @param rdfComponent
 * @param litContextObject
 * @returns {*}
 */
module.exports.validateIri = (value, rdfComponent, litContextObject) => {
  if (!value) {
    litContextObject.reset();
    throw new LitContextError(
      litContextObject.context(),
      `${rdfComponent} to match cannot be 'null' or 'undefined' (this may be a typo in the vocab term, or it may have moved to a different vocabulary - check the error stack to help pinpoint the problem) ${litContextObject.stateAsString()}.`
    );
  }

  if (
    LitVocabTermBase.isString(value) &&
    !LitVocabTermBase.isStringIri(value)
  ) {
    litContextObject.reset();
    throw new LitContextError(
      litContextObject.context(),
      `${rdfComponent} to match must be a valid HTTP IRI (i.e. must begin with 'http://' or 'https://'), but we got [${value}] ${litContextObject.stateAsString()}.`
    );
  }

  return LitVocabTermBase.isString(value) ? rdf.namedNode(value) : value;
};

/**
 * Very simple method to camel case the specified value.
 *
 * NOTE: Requires spaces between terms to be capitalised, e.g. wll convert 'HouseholdID' to 'householdid' instead of
 * 'householdId'!
 *
 * @param value The value to be camel-cased.
 * @returns {string}
 */
module.exports.camelize = value => {
  const resut = value
    .toLowerCase()
    .replace(/(?:(^.)|([-_\s]+.))/g, function(match) {
      return match.charAt(match.length - 1).toUpperCase();
    });
  return resut.charAt(0).toLowerCase() + resut.substring(1);
};

/**
 * Simple method that tries to offer an explanation if we detect mismatched IRI
 * values.
 * NOTE: We do not check for equality here, we expect to be called in the case
 * of a mismatch.
 *
 * This happened where the developer correctly passed a NamedNode IRI for one
 * value, but a String for the other (meaning the two values 'look' identical
 * (e.g. if you used console.log()), but in fact were completely different
 * objects). Rather than try and handle this situation (i.e. by only comparing
 * value.toString()) we explicitly want to flag this situation as an error, as
 * it could easily lead to all kinds of problems later, since IRI's and String
 * are two very different concepts.
 *
 * @param messagePrefix A message to prefix our returning message - intended to
 * provide application-level context.
 * @param first The first value we compared.
 * @param second The second value we compared.
 * @returns {string}
 */
module.exports.mismatchingIris = (messagePrefix, first, second) => {
  const explain =
    first.toString() === second.toString()
      ? ` (values as 'Strings' actually match, but first value is of type [${typeof first}] and second value is of type [${typeof second}]. We explicitly expected both to be IRI's (e.g. rdf.namedNode() instances))`
      : "";

  return `${messagePrefix} - first IRI was [${first}], second was [${second}] - they *must* be the same${explain}.`;
};

/**
 * Reads the first object value from the given Dataset.
 *
 * @param dataset The input Dataset that will be read.
 * @param defaultValue A default value if there is no first term found (empty
 * dataset).
 * @returns {*} The value of the first object value, else return the defaultValue.
 */
module.exports.firstDatasetValue = (dataset, defaultValue) => {
  const first = dataset.toArray().shift();
  return first ? first.object.value : defaultValue;
};
