'use strict'

const rdf = require('rdf-ext')

const LitUtil = require('../src/LitUtil.js')

const chai = require('chai')
chai.use(require('chai-string'));
const expect = chai.expect

// Just for our simple tests.
const RDF = { type: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type') }

const SCHEMA = {
  Person: rdf.namedNode('https://schema.org/Person'),
  name:rdf.namedNode('https://schema.org/name'),
  email:rdf.namedNode('https://schema.org/email'),
  requiredMaxAge:rdf.namedNode('https://schema.org/requiredMaxAge')
}


describe ('LIT utils tests', () => {
  const aliceIriAsString = 'https://alice.example.org/profile#me'
  const alice = rdf.namedNode(aliceIriAsString)

  beforeEach(() => {
    delete process.env.IRI_HINT_APPLICATION
    delete process.env.DATA_SERVER_SOLID
  })

  describe ('WebID generation', () => {
    it ('No environment value should generate with default', () => {
      const username = 'TestUser'
      const webId = LitUtil.createWebId(username)
      expect(webId.value).to.include('https://', username, LitUtil.DEFAULT_WEDID_SERVER_DOMAIN, '#')
    })

    it ('Should generate using environment value', () => {
      const domain = 'test-server.com'
      process.env.DATA_SERVER_SOLID = `https://${domain}/whatever`

      const username = 'TestUser'
      const webId = LitUtil.createWebId(username)
      expect(webId.value).to.include('https://', username, domain, '#')
    })
  })

  describe ('ID generation', () => {
    it ('Should generate UUID - with no environment set we expect DEVELOPMENT, so just a number', () => {
      expect(LitUtil.generateUuid().toString()).not.includes('-')
    })
  
    it ('Should throw if attempting to generate well known IRI without code context', () => {
      expect(() => LitUtil.generateWellKnownIri()).to.throw('we require a code context')
    })
    
    it ('Should generate correct strings (for production ENV!)', () => {
      process.env.NODE_ENV = 'production'
      expect(LitUtil.generateUuid().toString()).includes('-')
      
      expect(LitUtil.generateWellKnownIri('hint').toString()).to.include(LitUtil.LIT_CORE_NAMESPACE).and.to.include('/hint/')
    })

    it ('Should generate correct strings (for development ENV!)', () => {
      process.env.NODE_ENV = 'development'
      expect(LitUtil.generateUuid().toString()).not.includes('-')
      
      expect(LitUtil.generateWellKnownIri('hint').toString()).to.include('/hint/')
    })

    it ('Should generate code context', () => {
      expect(LitUtil.codeContext()).equals(`${LitUtil.NO_APPLICATION_HINT}`)
      expect(LitUtil.codeContext(new String())).equals(`${LitUtil.NO_APPLICATION_HINT}/String`)
      expect(LitUtil.codeContext(new String(), 'func')).equals(`${LitUtil.NO_APPLICATION_HINT}/String/func`)
    })

    it ('Should generate code context with specified hint', () => {
      const hint = 'testing hint'
      process.env.IRI_HINT_APPLICATION = hint

      expect(LitUtil.codeContext()).equals(hint)
      expect(LitUtil.codeContext(new String())).equals(`${hint}/String`)
      expect(LitUtil.codeContext(new String(), 'func')).equals(`${hint}/String/func`)
    })
  })

  describe ('RDF file tests', () => {
    it ('Should load dataset', (done) => {
      LitUtil.loadTurtleFile('test/resources/list-users.ttl', function (data) {
        expect(data.length).to.equal(41)
      
        LitUtil.loadTurtleFileIntoDataset('test/resources/list-users.ttl', rdf.dataset(), function (data) {
          expect(data.length).to.equal(41)
          done()
        })
      })
    })
  
    it ('Should load dataset using promise', (done) => {
      LitUtil.loadTurtleFilePromise('test/resources/list-users.ttl').then(function (data) {
        expect(data.length).to.equal(41)
      
        LitUtil.loadTurtleFileIntoDatasetPromise('test/resources/list-users.ttl', rdf.dataset()).then(function (data) {
          expect(data.length).to.equal(41)
          done()
        })
      })
    })
  
    it ('Should write dataset', () => {
      const dataset = rdf.dataset().addAll([
        rdf.quad(alice, RDF.type, SCHEMA.Person),
        rdf.quad(alice, SCHEMA.name, rdf.literal('Alice')),
        rdf.quad(alice, SCHEMA.email, rdf.literal('alice@hotmail.com')),
        rdf.quad(alice, SCHEMA.requiredMaxAge, rdf.literal('21'))
      ])

      LitUtil.saveDatasetToFile(dataset, 'test/resources/output/rdf-write-file-test.ttl')
    })
  })

  describe ('Converting to string', () => {
    it ('Should write dataset to string', () => {
      const dataset = rdf.dataset().add(rdf.quad(alice, RDF.type, SCHEMA.Person))
      LitUtil.datasetToString(dataset).then((result) => {
        expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
      })
    })

    it ('Should write quad to string', async () => {
      const result = await LitUtil.quadsToString( [ rdf.quad(alice, RDF.type, SCHEMA.Person) ] )
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
    })

    it ('Should write quads to console log', async () => {
      let result = await LitUtil.console(rdf.quad(alice, RDF.type, SCHEMA.Person))
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)

      result = await LitUtil.console( [ rdf.quad(alice, RDF.type, SCHEMA.Person) ] )
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
    })
  })
  
  describe ('isHttpOk', () => {
    it ('Should work in correct range', () => {
      expect(LitUtil.isHttpOk(199)).to.be.false
      expect(LitUtil.isHttpOk(200)).to.be.true
      expect(LitUtil.isHttpOk(250)).to.be.true
      expect(LitUtil.isHttpOk(299)).to.be.true
      expect(LitUtil.isHttpOk(300)).to.be.false
    })
    
    it ('Should convert valid types correctly', () => {
      expect(LitUtil.isHttpOk("250")).to.be.true
      expect(LitUtil.isHttpOk("199")).to.be.false
      expect(LitUtil.isHttpOk(250.0)).to.be.true
      expect(LitUtil.isHttpOk(rdf.literal('200'))).to.be.true
    })
  
    it ('Should throw on incorrect types', () => {
      expect(() => LitUtil.isHttpOk(false)).to.throw('Could not determine datatype')
      expect(() => LitUtil.isHttpOk()).to.throw('Could not determine datatype')
  
      expect(() => LitUtil.isHttpOk("whatever")).to.throw('Could not convert')
  
      expect(() => LitUtil.isHttpOk({})).to.throw('we only support RDF Literals')
      expect(() => LitUtil.isHttpOk(rdf.namedNode('https://200'))).to.throw('we only support RDF Literals')
    })
  })
  
  describe ('replacing local name', () => {
    it ('Should replace correctly', () => {
      expect(LitUtil.replaceIriLocalName(alice, 'coreProfile').value).to.be.equal('https://alice.example.org/profile/coreProfile')
      expect(LitUtil.replaceIriLocalName(alice, 'extension/medical').value).to.be.equal('https://alice.example.org/profile/extension/medical')
    })

    it ('Should throw if no separator', () => {
      expect(() => LitUtil.replaceIriLocalName(rdf.namedNode('https:No_hash_or_backslash'), 'doesn\'t matter')).to.throw('Could not' +
        ' find an IRI separator')
    })
  })
  
  describe ('creating relative path', () => {
    it ('Should return original if relative part undefined', () => {
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me')).value).to.equal('http://example.com/whatever#me')
    })
  
    it ('Should create correctly', () => {
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me'), 'newPart').value).to.equal('http://example.com/whatever/newPart')
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever/me'), 'newPart').value).to.equal('http://example.com/whatever/newPart')
    
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever/a/b/c'), '../../newPart').value).to.equal('http://example.com/whatever/newPart')
      expect(() => LitUtil.makeRelativeIri(rdf.namedNode('http://example.com'), '../../newPart')).to.throw('Failed to create')
    })
  
    it ('Should also append GUID', () => {
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me'), 'newPart', true).value).to.contain('http://example.com/whatever/newPart/')
      expect(LitUtil.makeRelativeIri(rdf.namedNode('http://example.com/whatever/me'), 'newPart', true).value).to.contain('http://example.com/whatever/newPart/')
    })
  })
  
  describe ('replace all', () => {
    it ('Should replace all', () => {
      expect(LitUtil.replaceAll('test user name', ' ', '_')).to.equal('test_user_name')
    })
  })
  
  describe ('validate IRI', () => {
    it ('Should succeed with HTTP strings or named nodes', () => {
      expect(LitUtil.validateIri('http://example.com/test', 'Subject', {})).to.deep.equal(rdf.namedNode('http://example.com/test'))
      expect(LitUtil.validateIri('https://example.com/test', 'Subject', {})).to.deep.equal(rdf.namedNode('https://example.com/test'))
      expect(LitUtil.validateIri(rdf.namedNode('http://example.com/test'), 'Subject', {})).to.deep.equal(rdf.namedNode('http://example.com/test'))
      expect(LitUtil.validateIri(rdf.namedNode('https://example.com/test'), 'Subject', {})).to.deep.equal(rdf.namedNode('https://example.com/test'))
    })
    
    it ('Should fail with non-HTTP strings', () => {
      const litObject = {
        context: () => { return 'test context' },
        stateAsString: () => { return 'test state' },
        reset: () => { } }
  
      expect(() => LitUtil.validateIri('example.com/test', 'Subject', litObject)).to.throw('Subject', 'test state', 'example.com/test')
      expect(() => LitUtil.validateIri(null, 'Predicate', litObject)).to.throw('Predicate', 'null', 'example.com/test')
    })
  })
  
  describe ('Camelize strings', () => {
    it('Should convert as expected', () => {
      expect(LitUtil.camelize('Est DOB')).to.equal('estDob')
      expect(LitUtil.camelize('Household ID')).to.equal('householdId')
    })
  })

  describe ('mismatching IRIs', () => {
    it('Should not explain if completely different', () => {
      const first = rdf.namedNode('https://example.com/first')
      const second = rdf.namedNode('https://example.com/second')
      const result = LitUtil.mismatchingIris('Prefix', first, second)
      expect(result).to.include.all.string(first.toString(), second.toString(), '*must* be the same.')
    })

    it('Should explain if same but different types', () => {
      const first = rdf.namedNode('https://example.com/first')
      const second = 'https://example.com/first'
      const result = LitUtil.mismatchingIris('Prefix', first, second)
      expect(result).to.include.all.string(first.toString(), second.toString(), '*must* be the same (', '[string]', '[object]')
    })
  })

  describe ('HTTP header tests', () => {
    it('Should use our LIT-specific prefixes', () => {
      expect(LitUtil.prefixForHttpHeader()).to.startsWith(LitUtil.LIT_CORE_NAMESPACE)
    })
  })

  describe ('Dataset util function tests', () => {
    it('Should read the first value from a given dataset', () => {

      const aliceDataset = rdf.dataset().addAll([
        rdf.quad(alice, SCHEMA.name, rdf.literal('Alice')),
        rdf.quad(alice, SCHEMA.email, rdf.literal('alice@hotmail.com')),
        rdf.quad(alice, SCHEMA.requiredMaxAge, rdf.literal('21'))
      ]);

      const emptyDataset = rdf.dataset();

      expect(LitUtil.firstDatasetValue(aliceDataset)).to.equal('Alice')
      expect(LitUtil.firstDatasetValue(emptyDataset)).to.equal(undefined)
      expect(LitUtil.firstDatasetValue(emptyDataset, 'default value')).to.equal('default value')
    })
  })
})
