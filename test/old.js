"use strict";

const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);

const HuglaHttp = require('./../index.js');

let testApp;

describe("HuglaHttp", function() {

  beforeEach(function() {
    testApp = {
      config: {
        appDir: __dirname
      },
      registerLaunchAction: function() {

      },
      registerRunAction: function() {

      },
      registerShutdownAction: function() {

      }
    };
  });

  it("should throw an error if no appDir config is provided", function() {
    testApp.config.appDir = undefined;
    expect(function() {
      const http = new HuglaHttp(testApp);
    }).to.throw(Error);
  });

  it("should call app#registerLaunchAction() method", function() {
    testApp.registerLaunchAction = sinon.spy();
    const http = new HuglaHttp(testApp);
    expect(testApp.registerLaunchAction).to.have.been.called;
  });

  it("should call app#registerRunAction() method", function() {
    testApp.registerRunAction = sinon.spy();
    const http = new HuglaHttp(testApp);
    expect(testApp.registerRunAction).to.have.been.called;
  });

  it("should call app#registerShutdownAction() method", function() {
    testApp.registerShutdownAction = sinon.spy();
    const http = new HuglaHttp(testApp);
    expect(testApp.registerShutdownAction).to.have.been.called;
  });

  it("should throw an error if config.appDir is not defined", function() {
    testApp.config.appDir = undefined;
    expect(HuglaHttp).to.throw(Error);
  });

  describe("#setup()", function(done) {
    it("should call the callback without error", function(done) {
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

    it("should set views dir on express app if viewEngine is provided",
    function(done) {
      testApp.config.viewEngine = 'jade';
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        expect(http.app.get('views')).to.be.equal(__dirname + '/views');
        done();
      });
    });

    it("should set 'view engine' on express app if viewEngine is provided",
    function(done) {
      testApp.config.viewEngine = 'jade';
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        expect(http.app.get('view engine')).to.be.equal('jade');
        done();
      });
    });

    it("should call middleware action", function() {
      const spy = sinon.spy();
      const http = new HuglaHttp(testApp);
      http.addMiddlewareSetupAction(spy);
      http.setup(function(err) {});
      expect(spy).to.have.been.calledOnce;
    });

    it("should call middleware action with 2 params", function() {
      const spy = sinon.spy();
      const http = new HuglaHttp(testApp);
      http.addMiddlewareSetupAction(spy);
      http.setup(function(err) {});
      expect(spy).to.have.been.calledWithExactly(http.app, http.http);
    });

    // TODO: find a proper way to test this
    it("should setup asset routes", function() {
      testApp.config.assets = { '/assets': 'assets' };
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {});
    });

    it("should call #registerController with description", function() {
      const contrDesc = { root: '/', name: 'index' };
      testApp.config.controllers = [contrDesc];

      const spy = sinon.spy();
      const http = new HuglaHttp(testApp);
      http.registerController = spy;
      http.setup(function(err) {});
      expect(spy).to.have.been.calledWithExactly(contrDesc);
    });
  });

  describe("#run()", function(done) {
    let http = null;

    beforeEach(function() {
      http = new HuglaHttp(testApp);
    });

    afterEach(function(done) {
      http.close(done);
    });

    it("should call the callback without error", function(done) {
      http.setup(function(err) {
        http.run(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it("should call the callback with error in case called twice",
    function(done) {
      http.setup(function() {
        http.run(function() {
          http.run(function(err) {
            expect(err).to.be.an.instanceof(Error);
            done();
          });
        });
      });
    });

    it("should call the callback with error in case of EADDRINUSE",
    function(done) {
      http.setup(function() {
        http.run(function(err) {
          expect(err).to.be.an.instanceof(Error);
          done();
        });

        const err = new Error("test");
        err.code = 'EADDRINUSE';
        http.http.emit('error', err);
      });
    });

    it("should log the error in case of http error occurs",
    function(done) {
      const err = new Error("test");
      http.log = { error: function (res) {
        expect(res).to.be.equal(err);
        done();
      }}
      http.setup(function() {
        http.run(function(err) {
        });
        http.http.emit('error', err);
      });
    });
  });

  describe("#close()", function(done) {
    it("should call the callback without error in case server is running",
    function(done) {
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        http.run(function(err) {
          http.close(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it("should call the callback without error in case server is not running",
    function(done) {
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        http.run(function(err) {
          http.close(function(err) {
            http.close(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });
  });

  describe("#registerController()", function() {
    it("should register new router with express", function(done) {
      const http = new HuglaHttp(testApp);
      http.setup(function(err) {
        http.app = {
          use: function(root, router) {
            expect(root).to.be.equal('/');
            expect(router).to.exist;

            done();
          }
        };
        http.registerController({
          name: 'test',
          root: '/'
        });
      });
    });
  });

  describe("#addMiddlewareSetupAction()", function() {
    it("should add action to internal action list", function() {
      const http = new HuglaHttp(testApp);
      http.addMiddlewareSetupAction(function() {});
      expect(http.middlewareActions).to.have.length(1);
    });
  });
});
