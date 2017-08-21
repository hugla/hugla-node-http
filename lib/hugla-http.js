'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _huglaLogger = require('hugla-logger');

var _huglaLogger2 = _interopRequireDefault(_huglaLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * HuglaHttp - Hugla web framework's http module
 */
var HuglaHttp = function () {
  /**
   * Class constructor
   *
   * @param {object} app Hugla app
   * @param {object} app.config Configuration object
   * @param {string} app.config.appDir Application directory
   * @param {string} [app.config.viewEngine] View engine to be used with express
   * @param {map} [app.config.assets] Static assets routes array
   * @param {array} [app.config.controllers] Controllers array
   * @param {function} app.registerLaunchAction
   * @param {function} app.registerRunAction
   * @param {function} app.registerShutdownAction
   */
  function HuglaHttp(app) {
    _classCallCheck(this, HuglaHttp);

    this.log = new _huglaLogger2.default({ module: 'http' });
    this.config = app.config;
    this.middlewareActions = [];
    this.shutdownActions = [];

    if (!this.config.appDir) {
      throw new Error('appDir not defind in config');
    }

    app.registerLaunchAction(this.setup.bind(this));
    app.registerRunAction(this.run.bind(this));
    app.registerShutdownAction(this.close.bind(this));
  }

  /**
   * Setup http module
   *
   * @param {function} callback Function to be called on setup end
   */


  _createClass(HuglaHttp, [{
    key: 'setup',
    value: function setup(callback) {
      var _this = this;

      var app = (0, _express2.default)();
      var http = require('http').Server(app);
      var config = this.config;
      var log = this.log;

      this.app = app;
      this.http = http;

      app.set('hPort', config.port || 3000);
      app.set('hHost', config.host || '0.0.0.0');

      // view engine
      if (config.viewEngine) {
        app.set('views', config.appDir + '/views');
        app.set('view engine', config.viewEngine);
      }

      // middleware actions
      this.middlewareActions.forEach(function (action) {
        action(app, http);
      });

      // static assets routes
      var assetRoutes = config.assets || {};

      Object.keys(assetRoutes).forEach(function (uri) {
        var dir = assetRoutes[uri];
        app.use(uri, _express2.default.static(dir));
        log.info('static route [%s : %s]', uri, dir);
      });

      // controllers
      (config.controllers || []).forEach(function (description) {
        _this.registerController(app, description);
      });

      process.nextTick(function () {
        callback();
      });
    }

    /**
     * Start listening for http requests
     *
     * @param {function} callback Function to be called on error on success
     */

  }, {
    key: 'run',
    value: function run(callback) {
      var _this2 = this;

      if (this.open) {
        process.nextTick(function () {
          callback(new Error('already running'));
        });
        return;
      }

      var app = this.app;
      var http = this.http;
      var log = this.log;

      // setup error handler
      http.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
          log.error('address already in use - %s:%s', app.get('hHost'), app.get('hPort'));
          callback(err);
          return;
        }

        log.error(err);
      });

      // bind to interface and port
      http.listen(app.get('hPort'), app.get('hHost'), function () {
        log.info('listening on %s:%s', app.get('hHost'), app.get('hPort'));
        _this2.open = true;
        callback();
      });
    }

    /**
     * Close http server
     * Gracefully shuts down http server
     *
     * @param {function} callback Callback called on successful shutdown
     */

  }, {
    key: 'close',
    value: function close(callback) {
      // run shutdown actions
      this.shutdownActions.forEach(function (action) {
        action();
      });

      if (this.open) {
        this.http.close(callback);
      } else {
        process.nextTick(callback);
      }

      this.open = false;
    }

    /**
     * Register controller for a route
     * For every controller sets up an express.Router object
     *
     * @param {object} parentRouter router to mount route to
     * @param {object} description Controller description object
     * @param {boolean} description.abstract Indicates that route is abstract and has no file
     * @param {string} [description.name] Controller file name
     * @param {string} description.root Base root to attach router to
     * @param {string} [description.children] Optional child route descriptions
     */

  }, {
    key: 'registerController',
    value: function registerController(parentRouter, description) {
      var _this3 = this;

      var log = this.log;
      var config = this.config;
      var router = _express2.default.Router();
      var controllerPath = config.appDir + '/controllers/' + description.name + '.js';
      var controller = require(controllerPath);

      if (!description.abstract) controller(router);

      (description.children || []).forEach(function (childDescription) {
        _this3.registerController(router, childDescription);
      });

      parentRouter.use(description.root, router);
      log.info('controller [%s : %s]', description.root, description.name);
    }

    /**
     * Add an action to be called during middleware setup
     *
     * @param {function} action Action to be called
     */

  }, {
    key: 'addMiddlewareSetupAction',
    value: function addMiddlewareSetupAction(action) {
      this.middlewareActions.push(action);
    }

    /**
     * Add an action to be called during shutdown
     *
     * @param {function} action Action to be called
     */

  }, {
    key: 'addShutdownAction',
    value: function addShutdownAction(action) {
      this.shutdownActions.push(action);
    }
  }]);

  return HuglaHttp;
}();

exports.default = HuglaHttp;