"use strict";

const express = require('express');

const HuglaLogger = require('hugla-logger');

/**
 * HuglaHttp - Hugla web framework's http module
 */
class HuglaHttp {

  /**
   * Class constructor
   *
   * @param {object} app Hugla app
   * @param {object} app.config Configuration object
   * @param {string} app.config.appDir Application directory
   * @param {string} [app.config.viewEngine] View engine to be used with express
   * @param {array} [app.config.assets] Static assets routes array
   * @param {function} app.registerLaunchAction
   * @param {function} app.registerRunAction
   * @param {function} app.registerShutdownAction
   */
  constructor(app) {
    this.log = new HuglaLogger({ module: 'http' });
    this.config = app.config;

    app.registerLaunchAction(this.setup.bind(this));
    app.registerRunAction(this.run.bind(this));
    app.registerShutdownAction(this.close.bind(this));
  }

  /**
   * Setup http module
   *
   * @param callback Function to be called on setup end
   */
  setup(callback) {
    const app = this.app = express();
    const http = this.http = require('http').Server(this.app);
    const config = this.config;
    const log = this.log;

    app.set('hPort', config.port || 3000);
    app.set('hHost', config.host || '0.0.0.0');

    // view engine
    if (config['view engine']) {
      app.set('views', config.appDir + '/views');
      app.set('view engine', config['viewEngine'] || 'jade');
    }

    // static assets routes
    _.each(config.assets || [], function(dir, uri) {
      app.use(uri, express.static(dir));
      log.info('static route [%s : %s]', uri, dir);
    });

    process.nextTick(function() {
      callback();
    });
  }

  /**
   * Start listening for http requests
   *
   * @param callback Function to be called on error on success
   */
  run(callback) {
    const app = this.app;
    const http = this.http;
    const log = this.log;

    // setup error handler
    http.on('error', function(err) {
      if (err.code == 'EADDRINUSE') {
        log.error(util.format('address already in use - %s:%s', app.get('hHost'), app.get('hPort')));
        callback(err);
        return;
      }

      log.error(err);
    });

    // bind to interface and port
    http.listen(app.get('hPort'), app.get('hHost'), function() {
      log.info(util.format('listening on %s:%s', app.get('hHost'), app.get('hPort')));
      callback();
    });
  }

  /**
   * Close http server
   * Gracefully shuts down http server
   *
   * @param {function} callback Callback called on successful shutdown
   */
  close(callback) {
    this.http.close(callback);
  }
}