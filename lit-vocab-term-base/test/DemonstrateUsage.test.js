'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../src/LitContext')
const LitVocabTermBase = require('../src/LitVocabTermBase')

const chai = require('chai')
const expect = chai.expect

/**
 * Test class intended to simply demonstrate by example how to use LIT Vocab
 * Term instances.
 *
 * This class is not intended to contribute to test coverage, and duplicates
 * test conditions in our standard unit tests.
 */
describe('Demonstrate LIT Vocab Term usage', () => {
  const TEST_IRI_LOCAL_NAME = 'localName'
  const TEST_IRI = `test://iri#${TEST_IRI_LOCAL_NAME}`

  // Vocab Term labels can be configured (via a constructor parameter) to
  // fallback to using the IRI of the term as the English label if there is
  // no English value provided and no no-language value (e.g. a label string
  // with no language tag at all, such as for instance a 'username', for
  // which translations don't really make sense (i.e. a string of datatype
  // 'xsd:string').
  describe('Vocab Term label usage', () => {
    it('Label handling allowing local part of IRI as fallback English value', () => {
      // We explicitly want our term to allow the use of the local part of
      // the IRI as the English label if no English label explicitly provided,
      // so we pass 'true' to the constructor.
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      // Simply requesting the label without an explicit language assumes
      // English, but since we haven't provided any labels at all yet we can
      // only return the local part of the IRI (which we explicitly said to
      // do in the term constructor above).
      expect(term.label).to.equal(TEST_IRI_LOCAL_NAME)

      // Explicitly saying a value is mandatory though will throw...
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // When we explicitly request French, but we have no labels at all, still
      // just return the IRI's local name.
      expect(term.asLanguage('fr').label).to.equal(TEST_IRI_LOCAL_NAME)

      // Now we add an explicit label in French.
      term.addLabel('fr', 'Bonjour!')

      // But we still get back the local name if we don't request a specific
      // language, and there is still no English or no-language tag label.
      expect(term.label).to.equal(TEST_IRI_LOCAL_NAME)

      // But if we now explicitly ask for French, we'll get the French label.
      expect(term.asLanguage('fr').label).to.equal('Bonjour!')

      // Now we add a label without any language at all...
      term.addLabel('', 'No language tag')

      // ... we'll get that no-language value back since there is still no
      // explicitly English-tagged label.
      expect(term.label).to.equal('No language tag')

      // And requesting a mandatory value will still throw.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // Finally, if we provide a value explicitly tagged as 'English', then
      // we'll get that back without needing to provide an explicit language at
      // all...
      term.addLabel('en', 'English Hello!')
      expect(term.label).to.equal('English Hello!')
      // ...or if we explicitly request English...
      expect(term.asLanguage('en').label).to.equal('English Hello!')
      // ...or if we use our convenience English accessor.
      expect(term.asEnglish.label).to.equal('English Hello!')

      // And making it mandatory should be fine too...
      expect(term.mandatory.label).to.equal('English Hello!')
    })

    it('Label handling WITHOUT allowing local part of IRI as fallback', () => {
      // Here we explicitly prevent our term from using the local part of
      // the IRI as the English label if no English label is explicitly
      // provided.
      // This is useful when we control the generation of vocab terms, since we
      // can enforce that all terms must have at least English labels and
      // comments (this is something the LIT Artifact Generator can enforce
      // today for example).
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)

      // Simply requesting the label without an explicit language assumes
      // English, but since we haven't provided any labels at all yet we
      // throw an exception.
      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')

      // But explicitly saying 'do not throw' returned 'undefined' instead.
      expect(term.dontThrow.label).to.be.undefined

      // Asking for mandatory label still throws if none specified at all.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // Currently 'do not throw' overrides 'mandatory', so we still get back
      // 'undefined' if we stipulate both.
      // TODO: Should we throw an exception here instead (i.e. seems like a
      //  developer error if both flags set!)...?
      expect(term.dontThrow.mandatory.label).to.be.undefined

      // Now add a non-English language label...
      const labelInIrish = 'Dia duit Domhanda!'
      term.addLabel('ga', labelInIrish)

      // Fetching using the default still throws (since we have no English
      // values)...
      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')

      // But looking specifically for our language label works fine.
      expect(term.asLanguage('ga').label).to.equal(labelInIrish)
    })

    it('Show language coming from context', () => {
      // Create a vocab term with a non-English language label.
      const labelInIrish = 'Dia duit Domhanda!'
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
        .addLabel('ga', labelInIrish)

      // First show that by default we can't find a label value...
      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')

      // ...now set the context language to Irish...
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')

      // ..and now our default will fetch our Irish label.
      expect(term.label).equals(labelInIrish)
    })
  })

  // Comments and messages do not fallback to using the IRI's local name.
  describe('Vocab Term comment or message usage', () => {
    it('Comment and message handling do not use local part of IRI as fallback', () => {
      const termUseLocalName = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
      expect(() => termUseLocalName.comment).to.throw(TEST_IRI, 'en', 'no values')
      expect(() => termUseLocalName.message).to.throw(TEST_IRI, 'en', 'no values')

      const termDoNotUseLocalName = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
      expect(() => termDoNotUseLocalName.comment).to.throw(TEST_IRI, 'en', 'no values')
      expect(() => termDoNotUseLocalName.message).to.throw(TEST_IRI, 'en', 'no values')
    })
  })

  // Giving the programmer control over throwing exceptions.
  describe('Return undefined instead of throwing exceptions', () => {
    it('Should return undefined', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')
      expect(term.mandatory.dontThrow.label).to.be.undefined
    })
  })
})
