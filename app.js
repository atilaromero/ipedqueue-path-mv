'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // Custom error handler that returns JSON
  app.use(function(err, req, res, next) {
    console.log('ERROR', err)
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
    res.end(JSON.stringify(err));
  });

  // enable SwaggerUI
  app.use(swaggerExpress.runner.swaggerTools.swaggerUi())

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;

  app.listen(port, () => {
    console.log('Listening on:', port)
  })
});
