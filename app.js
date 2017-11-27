'use strict';

const config = require('config');

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

SwaggerExpress.create(
  {appRoot: __dirname},
  function(err, swaggerExpress){
    if (err) { throw err; }

    // enable SwaggerUI
    app.use(swaggerExpress.runner.swaggerTools.swaggerUi());

    // install middleware
    swaggerExpress.register(app);

    // Custom error handler that returns JSON
    app.use(function(err, req, res, next) {
      console.log({err});
      if (typeof err !== 'object') {
        // If the object is not an Error, create a representation that appears to be
        err = {
          message: String(err) // Coerce to string
        };
      } else {
        // Ensure that err.message is enumerable (It is not by default)
        Object.defineProperty(err, 'message', { enumerable: true });
      }

      // Return a JSON representation of #/definitions/ErrorResponse
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({message: JSON.stringify(err)});
    });

    var port = config.port;

    app.listen(port, () => {
      console.log('Listening on:', port);
    });
  }
);
