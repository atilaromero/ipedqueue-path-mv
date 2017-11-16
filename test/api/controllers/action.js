var should = require('should');
var request = require('supertest');
const mySpawn = require('../../../mock');
const server = require('../../../app');
const nock = require('nock')
const querystring = require('querystring')
const assert = require('assert')

describe('controllers', function() {
  describe('action', function() {
    describe('POST', function() {
      nock('http://localhost:10010', {allowUnmocked: true})
      nock('http://iped-queue')
        .persist()
        .get('/api/materials/?' + querystring.stringify({
          conditions: JSON.stringify({
            material: 172192
          })
        }))
        .reply(200, [{
          material: 172192,
          path: '/asdf/slw/woier/owier/aaa.dd'
        }])
        .get('/api/materials/?' + querystring.stringify({
          conditions: JSON.stringify({
            material: 172193
          })
        }))
        .reply(200, [])
        .get('/api/materials/?' + querystring.stringify({
          conditions: JSON.stringify({
            material: 172194
          })
        }))
        .reply(200, [{
          material: 172194,
          path: '/asdf/slw/woier/owier/aaa1.dd'
        },{
          material: 172194,
          path: '/asdf/slw/woier/owier/aaa2.dd'
        }])
      nock('http://iped-queue')
        .persist()
        .get(/.*/)
        .reply(400, {message: 'not found'})
      it('should complain about missing parameter material', function(done) {
        request(server)
          .post('/action')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({
              parameters: [
                {name: 'material', error: 'required'},
                {name: 'path'},
              ]
            });
            done();
        });
      });
      it('should complain about missing parameter path', function(done) {
        request(server)
          .post('/action')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({material: 172192})
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({
              parameters: [
                {name: 'material'},
                {name: 'path', error: 'required'},
              ]
            });
            done();
        });
      });
      it('should complain when not found', function(done) {
        request(server)
          .post('/action')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({
            material: 172193,
            path: '/celpath/',
          })
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({
              parameters: [
                {name: 'material', error: 'not found'},
                {name: 'path'},
              ]
            });
            done();
        });
      });
      it('should complain when multiple evidences use the same material number', function(done) {
        request(server)
          .post('/action')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({
            material: 172194,
            path: '/celpath/',
          })
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({
              parameters: [
                {name: 'material', error: 'multiple materials found'},
                {name: 'path'},
              ]
            });
            done();
        });
      });
      it('should succeed', function(done) {
        request(server)
          .post('/action')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({
            material: 172192,
            path: '/celpath/',
          })
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({});
            assert.equal(mySpawn.calls.length, 2)
            assert.equal(mySpawn.calls[0].command, 'mkdir')
            assert.deepEqual(mySpawn.calls[0].args, ['-p', '/asdf/slw/woier/owier/aaa.dd'])
            assert.equal(mySpawn.calls[1].command, 'mv')
            assert.deepEqual(mySpawn.calls[1].args, ['-n', '/celpath/', '/asdf/slw/woier/owier/aaa.dd'])
            done()
        });
      });
    });
  });
});
