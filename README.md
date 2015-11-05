# HuglaHttp
### Hugla web framework's node back-end http module

[![Build Status](https://travis-ci.org/hugla/hugla-node-http.svg?branch=master)](https://travis-ci.org/hugla/hugla-node-http)
[![Coverage Status](https://coveralls.io/repos/hugla/hugla-node-http/badge.svg?branch=master&service=github)](https://coveralls.io/github/hugla/hugla-node-http?branch=master)

## Requirements

The following configuration properties are required

```json
{
  "appDir": "./app"
}
```

## Options

The following configuration properties are optional

```json
{
  "host": "localhost",
  "port": "8080",
  "viewEngine": "jade",
  "assets": {
    "/assets": "assets"
  },
  "controllers": [
    {
      "name": "index",
      "root": "/"
    }
  ]
}
```

## Plugging in

In case you need some middleware to be added to express' middleware chain use ``` .addMiddlewareSetupAction() ``` method on ``` HuglaHttp ``` class instance, providing a function that needs to be called during middleware setup process. That method will called with express app argument, that you can use to attach your middleware.
``` .addMiddlewareSetupAction() ``` method needs to be called before ``` .setup() ``` is called for ``` HuglaHttp ``` class instance, as middleware setup process happens during ``` .setup() ``` method execution.

Middleware setup action will also receive node's http server as second argument.

## Example

```javascript

const HuglaHttp = require('HuglaHttp');
const bodyParser = require('body-parser');

...

huglaHttp.addMiddlewareSetupAction(function(app, http) {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
});

huglaHttp.setup(...);
huglaHttp.run(...);

```

## License

[MIT](LICENSE)
