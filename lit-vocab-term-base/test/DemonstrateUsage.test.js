'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../src/LitContext')
const LitVocabTermBase = require('../src/LitVocabTermBase')

const chai = require('chai')
const expect = chai.expect

/** Test class intended to simple demonstrate by example how to use LIT Vocab
 * Term instances.
 *
 * This class is not intended to contribute to test coverage, and duplicates
 * test conditions in our standard unit tests
 */
describe('Demonstrate usage', () => {
  const TEST_IRI_LOCAL_NAME = 'localName'
  const TEST_IRI = `test://iri#${TEST_IRI_LOCAL_NAME}`

  // Vocab Term labels can be configured (via a constructor parameter) to
  // fallback to using the IRI of the term as the English label if there is
  // no English value provided and no no-language value (e.g. a label string
  // with no language tag at all (i.e. a string of datatype 'xsd:string').
  describe('Vocab Term label usage', () => {
    it('Label handling allowing local part of IRI as fallback English value', () => {
      // We explicitly want our term to allow the use of the local part of
      // the IRI as the English label if no English label explicitly provided,
      // so we pass 'true' to the constructor.
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      // Simply requesting the label without an explicit language assumes
      // English, but since haven't provided any labels at all yet we can
      // only return the local part of the IRI (which we explicitly said to
      // do in the term constructor above).
      expect(term.label).to.equal(TEST_IRI_LOCAL_NAME)

      // Making a value mandatory though will throw.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // When we explicitly request French, but no labels at all, still just
      // return the IRI's local name.
      expect(term.asLanguage('fr').label).to.equal(TEST_IRI_LOCAL_NAME)

      // Now we add an explicit label in French.
      term.addLabel('fr', 'Bonjour!')

      // But we still get back the local name if we don't request a specific
      // language, and there is no English or no-language tag at all label.
      expect(term.label).to.equal(TEST_IRI_LOCAL_NAME)

      // But we if explicitly ask for French, we now get the French one.
      expect(term.asLanguage('fr').label).to.equal('Bonjour!')

      // If we now add a label without any language at all...
      term.addLabel('', 'No language tag')

      // ... we'll get that no-language value now since there is still no
      // explicitly tagged value for English.
      expect(term.label).to.equal('No language tag')

      // But requesting a mandatory value will still throw.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // Finally, if we provide a value explicitly tagged as 'English',
      // then we'll get that back without providing a language at all...
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
      // We explicitly prevent our term from using the local part of the IRI
      // as the English label if no English label explicitly provided.
      // This is useful when we control the generation of a vocab term,
      // since we can enforce that terms must have at least English labels
      // and comments (this is something the LIT an enfroce for example).
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)

      // Simply requesting the label without an explicit language assumes
      // English, but since haven't provided any labels at all yet we can
      // only return the local part of the IRI (which we explicitly said to
      // do in the term constructor above).
      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')

      // Asking for mandatory label still throws if none specified at all.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

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
    it('Label handling allowing local part of IRI as fallback English value', () => {
      const termUseLocalName = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
      expect(() => termUseLocalName.comment).to.throw(TEST_IRI, 'en', 'no values')

      const termDoNotUseLocalName = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
      expect(() => termDoNotUseLocalName.comment).to.throw(TEST_IRI, 'en', 'no values')
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
