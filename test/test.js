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

      },
      registerLaunchAction: function() {

      },
      registerRunAction: function() {

      },
      registerShutdownAction: function() {

      }
    };
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

  describe("#setup()", function(done) {

  });

  describe("#run()", function(done) {

  });

  describe("#close()", function(done) {

  });
});
