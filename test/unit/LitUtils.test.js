'use strict'

const rdf = require('rdf-ext')

const LitUtils = require('../../src/LitUtils.js')

const chai = require('chai')
chai.use(require('chai-string'));
const expect = chai.expect

// Just for our simple tests
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
      const webId = LitUtils.createWebId(username)
      expect(webId.value).to.include('https://', username, LitUtils.DEFAULT_WEDID_SERVER_DOMAIN, '#')
    })

    it ('Should generate using environment value', () => {
      const domain = 'test-server.com'
      process.env.DATA_SERVER_SOLID = `https://${domain}/whatever`

      const username = 'TestUser'
      const webId = LitUtils.createWebId(username)
      expect(webId.value).to.include('https://', username, domain, '#')
    })
  })

  describe ('ID generation', () => {
    it ('should generate UUID - with no environment set we expect DEVELOPMENT, so just a number', () => {
      expect(LitUtils.generateUuid().toString()).not.includes('-')
    })
  
    it ('should throw if attempting to generate well known IRI without code context', () => {
      expect(() => LitUtils.generateWellKnownIri()).to.throw('we require a code context')
    })
    
    it ('should generate correct strings (for production ENV!)', () => {
      process.env.NODE_ENV = 'production'
      expect(LitUtils.generateUuid().toString()).includes('-')
      
      expect(LitUtils.generateWellKnownIri('hint').toString()).to.include(LitUtils.LIT_CORE_NAMESPACE).and.to.include('/hint/')
    })

    it ('should generate correct strings (for development ENV!)', () => {
      process.env.NODE_ENV = 'development'
      expect(LitUtils.generateUuid().toString()).not.includes('-')
      
      expect(LitUtils.generateWellKnownIri('hint').toString()).to.include('/hint/')
    })

    it ('should generate code context', () => {
      expect(LitUtils.codeContext()).equals(`${LitUtils.NO_APPLICATION_HINT}`)
      expect(LitUtils.codeContext(new String())).equals(`${LitUtils.NO_APPLICATION_HINT}/String`)
      expect(LitUtils.codeContext(new String(), 'func')).equals(`${LitUtils.NO_APPLICATION_HINT}/String/func`)
    })

    it ('should generate code context with specified hint', () => {
      const hint = 'testing hint'
      process.env.IRI_HINT_APPLICATION = hint

      expect(LitUtils.codeContext()).equals(hint)
      expect(LitUtils.codeContext(new String())).equals(`${hint}/String`)
      expect(LitUtils.codeContext(new String(), 'func')).equals(`${hint}/String/func`)
    })
  })

  describe ('RDF file tests', () => {
    it ('should load dataset', (done) => {
      LitUtils.loadTurtleFile('test/resources/list-users.ttl', function (data) {
        expect(data.length).to.equal(41)
      
        LitUtils.loadTurtleFileIntoDataset('test/resources/list-users.ttl', rdf.dataset(), function (data) {
          expect(data.length).to.equal(41)
          done()
        })
      })
    })
  
    it ('should load dataset using promise', (done) => {
      LitUtils.loadTurtleFilePromise('test/resources/list-users.ttl').then(function (data) {
        expect(data.length).to.equal(41)
      
        LitUtils.loadTurtleFileIntoDatasetPromise('test/resources/list-users.ttl', rdf.dataset()).then(function (data) {
          expect(data.length).to.equal(41)
          done()
        })
      })
    })
  
    it ('should write dataset', () => {
      const dataset = rdf.dataset().addAll([
        rdf.quad(alice, RDF.type, SCHEMA.Person),
        rdf.quad(alice, SCHEMA.name, rdf.literal('Alice')),
        rdf.quad(alice, SCHEMA.email, rdf.literal('alice@hotmail.com')),
        rdf.quad(alice, SCHEMA.requiredMaxAge, rdf.literal('21'))
      ])

      LitUtils.saveDatasetToFile(dataset, 'test/resources/output/rdf-write-file-test.ttl')
    })
  })

  describe ('Converting to string', () => {
    it ('should write dataset to string', () => {
      const dataset = rdf.dataset().add(rdf.quad(alice, RDF.type, SCHEMA.Person))
      LitUtils.datasetToString(dataset).then((result) => {
        expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
      })
    })

    it ('should write quad to string', async () => {
      const result = await LitUtils.quadsToString( [ rdf.quad(alice, RDF.type, SCHEMA.Person) ] )
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
    })

    it ('should write quads to console log', async () => {
      let result = await LitUtils.console(rdf.quad(alice, RDF.type, SCHEMA.Person))
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)

      result = await LitUtils.console( [ rdf.quad(alice, RDF.type, SCHEMA.Person) ] )
      expect(result).to.equal(`<${aliceIriAsString}> <${RDF.type}> <${SCHEMA.Person.value}> .\n`)
    })
  })
  
  describe ('isHttpOk', () => {
    it ('should work in correct range', () => {
      expect(LitUtils.isHttpOk(199)).to.be.false
      expect(LitUtils.isHttpOk(200)).to.be.true
      expect(LitUtils.isHttpOk(250)).to.be.true
      expect(LitUtils.isHttpOk(299)).to.be.true
      expect(LitUtils.isHttpOk(300)).to.be.false
    })
    
    it ('should convert valid types correctly', () => {
      expect(LitUtils.isHttpOk("250")).to.be.true
      expect(LitUtils.isHttpOk("199")).to.be.false
      expect(LitUtils.isHttpOk(250.0)).to.be.true
      expect(LitUtils.isHttpOk(rdf.literal('200'))).to.be.true
    })
  
    it ('should throw on incorrect types', () => {
      expect(() => LitUtils.isHttpOk(false)).to.throw('Could not determine datatype')
      expect(() => LitUtils.isHttpOk()).to.throw('Could not determine datatype')
  
      expect(() => LitUtils.isHttpOk("whatever")).to.throw('Could not convert')
  
      expect(() => LitUtils.isHttpOk({})).to.throw('we only support RDF Literals')
      expect(() => LitUtils.isHttpOk(rdf.namedNode('https://200'))).to.throw('we only support RDF Literals')
    })
  })
  
  describe ('replacing local name', () => {
    it ('should replace correctly', () => {
      expect(LitUtils.replaceIriLocalName(alice, 'coreProfile').value).to.be.equal('https://alice.example.org/profile/coreProfile')
      expect(LitUtils.replaceIriLocalName(alice, 'extension/medical').value).to.be.equal('https://alice.example.org/profile/extension/medical')
    })

    it ('should throw if no separator', () => {
      expect(() => LitUtils.replaceIriLocalName(rdf.namedNode('https:No_hash_or_backslash'), 'doesn\'t matter')).to.throw('Could not' +
        ' find an IRI separator')
    })
  })
  
  describe ('extracting IRI local name', () => {
    it ('should extract correctly', () => {
      expect(LitUtils.extractIriLocalName(alice)).to.equal('me')

      expect(LitUtils.extractIriLocalName(aliceIriAsString)).to.equal('me')
      expect(LitUtils.extractIriLocalName('https://example.com/whatever')).to.equal('whatever')
    })
    
    it ('should throw if no local name', () => {
      expect(() => LitUtils.extractIriLocalName('http://example.com-whatever')).to.throw('Expected hash')
      expect(() => LitUtils.extractIriLocalName('https://example.com-whatever')).to.throw('Expected hash')
    })
  })
  
  describe ('creating relative path', () => {
    it ('should return original if relative part undefined', () => {
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me')).value).to.equal('http://example.com/whatever#me')
    })
  
    it ('should create correctly', () => {
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me'), 'newPart').value).to.equal('http://example.com/whatever/newPart')
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever/me'), 'newPart').value).to.equal('http://example.com/whatever/newPart')
    
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever/a/b/c'), '../../newPart').value).to.equal('http://example.com/whatever/newPart')
      expect(() => LitUtils.makeRelativeIri(rdf.namedNode('http://example.com'), '../../newPart')).to.throw('Failed to create')
    })
  
    it ('should also append GUID', () => {
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever#me'), 'newPart', true).value).to.contain('http://example.com/whatever/newPart/')
      expect(LitUtils.makeRelativeIri(rdf.namedNode('http://example.com/whatever/me'), 'newPart', true).value).to.contain('http://example.com/whatever/newPart/')
    })
  })
  
  describe ('replace all', () => {
    it ('should replace all', () => {
      expect(LitUtils.replaceAll('test user name', ' ', '_')).to.equal('test_user_name')
    })
  })
  
  describe ('is string', () => {
    it ('should determine correctly', () => {
      expect(LitUtils.isString('test user name')).to.be.true
      expect(LitUtils.isString(new String('test user name'))).to.be.true
      expect(LitUtils.isString(57)).to.be.false
      expect(LitUtils.isString({ })).to.be.false
    })
  })

  describe ('validate IRI', () => {
    it ('should succeed with HTTP strings or named nodes', () => {
      expect(LitUtils.validateIri('http://example.com/test', 'Subject', {})).to.deep.equal(rdf.namedNode('http://example.com/test'))
      expect(LitUtils.validateIri('https://example.com/test', 'Subject', {})).to.deep.equal(rdf.namedNode('https://example.com/test'))
      expect(LitUtils.validateIri(rdf.namedNode('http://example.com/test'), 'Subject', {})).to.deep.equal(rdf.namedNode('http://example.com/test'))
      expect(LitUtils.validateIri(rdf.namedNode('https://example.com/test'), 'Subject', {})).to.deep.equal(rdf.namedNode('https://example.com/test'))
    })
    
    it ('should fail with non-HTTP strings', () => {
      const litObject = {
        context: () => { return 'test context' },
        stateAsString: () => { return 'test state' },
        reset: () => { } }
  
      expect(() => LitUtils.validateIri('example.com/test', 'Subject', litObject)).to.throw('Subject', 'test state', 'example.com/test')
      expect(() => LitUtils.validateIri(null, 'Predicate', litObject)).to.throw('Predicate', 'null', 'example.com/test')
    })
  })
  
  describe ('Camelize strings', () => {
    it('should convert as expected', () => {
      expect(LitUtils.camelize('Est DOB')).to.equal('estDob')
      expect(LitUtils.camelize('Household ID')).to.equal('householdId')
    })
  })

  describe ('mismatching IRIs', () => {
    it('should not explain if completely different', () => {
      const first = rdf.namedNode('https://example.com/first')
      const second = rdf.namedNode('https://example.com/second')
      const result = LitUtils.mismatchingIris('Prefix', first, second)
      expect(result).to.include.all.string(first.toString(), second.toString(), '*must* be the same.')
    })

    it('should explain if same but different types', () => {
      const first = rdf.namedNode('https://example.com/first')
      const second = 'https://example.com/first'
      const result = LitUtils.mismatchingIris('Prefix', first, second)
      expect(result).to.include.all.string(first.toString(), second.toString(), '*must* be the same (', '[string]', '[object]')
    })
  })

  describe ('HTTP header tests', () => {
    it('should use our LIT-specific prefixes', () => {
      expect(LitUtils.prefixForHttpHeader()).to.startsWith(LitUtils.LIT_CORE_NAMESPACE)
    })
  })

  describe ('Dataset util function tests', () => {
    it('should read the first value from a given dataset', () => {

      const aliceDataset = rdf.dataset().addAll([
        rdf.quad(alice, SCHEMA.name, rdf.literal('Alice')),
        rdf.quad(alice, SCHEMA.email, rdf.literal('alice@hotmail.com')),
        rdf.quad(alice, SCHEMA.requiredMaxAge, rdf.literal('21'))
      ]);

      const emptyDataset = rdf.dataset();

      expect(LitUtils.firstDatasetValue(aliceDataset)).to.equal('Alice')
      expect(LitUtils.firstDatasetValue(emptyDataset)).to.equal(undefined)
      expect(LitUtils.firstDatasetValue(emptyDataset, 'default value')).to.equal('default value')
    })
  })
})
