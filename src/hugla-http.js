const express = require('express');

const HuglaLogger = require('hugla-logger');

/**
 * HuglaHttp - Hugla web framework's http module
 */
export default class HuglaHttp {
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
  constructor(app) {
    this.log = new HuglaLogger({ module: 'http' });
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
  setup(callback) {
    const app = express();
    const http = require('http').Server(app);
    const config = this.config;
    const log = this.log;

    this.app = app;
    this.http = http;

    app.set('hPort', config.port || 3000);
    app.set('hHost', config.host || '0.0.0.0');

    // view engine
    if (config.viewEngine) {
      app.set('views', `${config.appDir}/views`);
      app.set('view engine', config.viewEngine);
    }

    // middleware actions
    this.middlewareActions.forEach((action) => {
      action(app, http);
    });

    // static assets routes
    const assetRoutes = config.assets || {};

    Object.keys(assetRoutes).forEach((uri) => {
      const dir = assetRoutes[uri];
      app.use(uri, express.static(dir));
      log.info('static route [%s : %s]', uri, dir);
    });

    // controllers
    (config.controllers || []).forEach((description) => {
      this.registerController(app, description);
    });

    process.nextTick(() => {
      callback();
    });
  }

  /**
   * Start listening for http requests
   *
   * @param {function} callback Function to be called on error on success
   */
  run(callback) {
    if (this.open) {
      process.nextTick(() => {
        callback(new Error('already running'));
      });
      return;
    }

    const app = this.app;
    const http = this.http;
    const log = this.log;

    // setup error handler
    http.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log.error('address already in use - %s:%s', app.get('hHost'), app.get('hPort'));
        callback(err);
        return;
      }

      log.error(err);
    });

    // bind to interface and port
    http.listen(app.get('hPort'), app.get('hHost'), () => {
      log.info('listening on %s:%s', app.get('hHost'), app.get('hPort'));
      this.open = true;
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
    // run shutdown actions
    this.shutdownActions.forEach((action) => {
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
  registerController(parentRouter, description) {
    const log = this.log;
    const config = this.config;
    const router = express.Router();
    const controllerPath = `${config.appDir}/controllers/${description.name}.js`;
    const controller = require(controllerPath);

    if (!description.abstract) controller(router);

    (description.children || []).forEach((childDescription) => {
      this.registerController(router, childDescription);
    });

    parentRouter.use(description.root, router);
    log.info('controller [%s : %s]', description.root, description.name);
  }

  /**
   * Add an action to be called during middleware setup
   *
   * @param {function} action Action to be called
   */
  addMiddlewareSetupAction(action) {
    this.middlewareActions.push(action);
  }

  /**
   * Add an action to be called during shutdown
   *
   * @param {function} action Action to be called
   */
  addShutdownAction(action) {
    this.shutdownActions.push(action);
  }
}
