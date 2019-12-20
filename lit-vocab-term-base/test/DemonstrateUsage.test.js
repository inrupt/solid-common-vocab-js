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
  // 'xsd:string')). We refer to this mode of operation as 'unstrict' mode,
  // and it's very useful when generating LIT Vocab Terms from vocabularies
  // you have no control over, and which do not already provide labels for
  // their terms.

  describe('LIT Vocab Term label usage', () => {
    it('Label handling allowing local part of IRI as fallback English value', () => {
      // We explicitly want our term to allow the use of the local part of
      // the IRI as the English label if no English label explicitly provided,
      // so we pass 'false' for the 'strict' flag (as 'strict' enforces an
      // explicit English label!).
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)

      // Simply requesting the label without an explicit language assumes
      // English, but since we haven't provided any labels at all yet we can
      // only return the local part of the IRI (which we explicitly said to
      // do in the term constructor above).
      // NOTE: the language tag on the returned Literal object is empty,
      // meaning the value is of type XSD:string, that is a string with no
      // language component at all.
      expect(term.label)
          .to.deep.equal(rdf.literal(TEST_IRI_LOCAL_NAME, ''))

      expect(term.label.value).to.equal(TEST_IRI_LOCAL_NAME)

      // Explicitly saying a value is mandatory will throw an exception
      // (regardless of 'strict-ness') if no value can be found.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // When we explicitly request French, but we have no labels at all, still
      // just return the IRI's local name.
      expect(term.asLanguage('fr').label.value).to.equal(TEST_IRI_LOCAL_NAME)

      // Now we add an explicit label in French.
      term.addLabel('Bonjour!', 'fr')

      // But we still get back the local name if we don't request a specific
      // language, and there is still no English or no-language tag label.
      expect(term.label.value).to.equal(TEST_IRI_LOCAL_NAME)

      // But if we now explicitly ask for French, we'll get the French label.
      expect(term.asLanguage('fr').label.value).to.equal('Bonjour!')

      // Now we add a label without any language at all...
      term.addLabelNoLanguage('No language tag')

      // ... we'll get that no-language value back since there is still no
      // explicitly English-tagged label.
      expect(term.label.value).to.equal('No language tag')

      // And requesting a mandatory value will still throw an exception.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // Finally, if we provide a value explicitly tagged as 'English', then
      // we'll get that back without needing to provide an explicit language at
      // all...
      term.addLabel('English Hello!', 'en')
      expect(term.label.value).to.equal('English Hello!')
      // ...or if we explicitly request English...
      expect(term.asLanguage('en').label.value).to.equal('English Hello!')
      // ...or if we use our convenience English accessor.
      expect(term.asEnglish.label.value).to.equal('English Hello!')

      // And making it mandatory should be fine too...
      expect(term.mandatory.label.value).to.equal('English Hello!')
    })

    it('Label handling WITHOUT allowing local part of IRI as fallback', () => {
      // Here we explicitly prevent our term from using the local part of
      // the IRI as the English label if no English label is explicitly
      // provided (i.e. we set the 'strict' flag to 'true').
      // This is useful when we control the generation of vocab terms, since we
      // can enforce that all terms must have at least English labels and
      // comments (this is something that the LIT Artifact Generator can enforce
      // today for example).
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      // Simply requesting the label without an explicit language assumes
      // English, but since we haven't provided any labels at all we get
      // 'undefined', even for strict terms.
      expect(term.label).to.be.undefined

      // Asking for mandatory label still throws if none specified at all.
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')

      // Now add a non-English language label...
      const labelInIrish = 'Dia duit Domhanda!'
      term.addLabel(labelInIrish, 'ga')

      // Fetching using the default still throws (since we have no English
      // values)...
      expect(term.label).to.be.undefined

      // But looking specifically for our language label works fine.
      expect(term.asLanguage('ga').label.value).to.equal(labelInIrish)

      // Now we add an explicit English label...
      const englishLabel = 'Label in English...'
      term.addLabel(englishLabel, 'en')

      // When we now ask for a non-existent language label again, this time
      // it should fallback to the English label.
      expect(term.asLanguage('fr').label.value).equals(englishLabel)
    })

    it('Show language coming from context', () => {
      // Create a vocab term with a non-English language label.
      const labelInIrish = 'Dia duit Domhanda!'
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
        .addLabel(labelInIrish, 'ga')

      // First show that by default we can't find a label value...
      expect(term.label).to.be.undefined

      // ...now set the context language to Irish...
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')

      // ..and now our default will fetch our Irish label.
      expect(term.label.value).equals(labelInIrish)
    })
  })

  // Comments and messages do not fallback to using the IRI's local name.
  describe('LIT Vocab Term comment or message usage', () => {
    it('Comment and message do not use local part of IRI as fallback', () => {
      const termStrict = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      expect(termStrict.comment).to.be.undefined
      expect(termStrict.message).to.be.undefined

      // And if we specify mandatory, we get an exception instead.
      expect(() => termStrict.mandatory.comment)
          .to.throw(TEST_IRI, 'en', 'no values')
      expect(() => termStrict.mandatory.message)
          .to.throw(TEST_IRI, 'en', 'no values')

      // Same behaviour for unstrict terms.
      const termUnstrict = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
      expect(termUnstrict.comment).to.be.undefined
      expect(termUnstrict.message).to.be.undefined

      expect(() => termUnstrict.mandatory.comment)
          .to.throw(TEST_IRI, 'en', 'no values')
      expect(() => termUnstrict.mandatory.message)
          .to.throw(TEST_IRI, 'en', 'no values')
    })
  })

  /**
   * Here we use the 'strict' flag on our vocab terms, which enforces the
   * expectation that the term will have at least an English label and
   * comment, and therefore will never use the IRI's local name as the label
   * for instance (it'll throw an exception instead!).
   * Effectively, setting the 'strict' flag in the constructor is like always
   * stipulating the 'mandatory' flag in subsequent calls.
   */
  describe('Strict support', () => {
    it('Should not use IRI local name if no label and strict - it return undefined', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)

      expect(term.label).to.be.undefined
    })

    it('Should still fallback to English if language not found', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)
        .addLabel(`English label...`, 'en')
        .addComment(`English comment...`, 'en')

      expect(term.asLanguage('fr').label.value).equals(`English label...`)
      expect(term.asLanguage('fr').comment.value).equals(`English comment...`)
    })

    it('Should require explicitly English label and comment if mandatory', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)
        .addLabelNoLanguage(`No-language label isn't enough for 'mandatory'...`)
        .addCommentNoLanguage(`No-language comment isn't enough for 'mandatory'...`)

      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')
      expect(() => term.mandatory.comment).to.throw(TEST_IRI, 'en', 'no values')
    })

    it('Calling mandatory on strict term is unnecessary', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)

      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')
    })
  })

  // Giving the programmer control over throwing exceptions.
  describe('Return undefined instead of throwing exceptions', () => {
    it('Should return undefined instead of throwing', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      // We don't allow both 'do not throw' and 'mandatory' since they
      // contradict one another in intent (strict terms or not)...,
      expect(() => term.dontThrow.mandatory)
          .to.throw('Internal error', 'they conflict')

      expect(term.messageParams('too many params')).to.be.undefined
      expect(() => term.mandatory.messageParams('too many params')).to.throw(TEST_IRI, 'en')
      expect(term.dontThrow.messageParams('too many params')).to.be.undefined

      const termUnstrict = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)

      expect(() => termUnstrict.mandatory.label).to.throw(TEST_IRI, 'en')
      expect(() => termUnstrict.mandatory.dontThrow.label)
          .to.throw('Internal error', 'they conflict')
    })
  })
})
