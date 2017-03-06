var requestHandler = require('./lib/requestHandler'),
    options = require('./config/options'),
    port = process.env.PORT || 8888;

if (options.ssl) {
  require('https').createServer(options.ssl, requestHandler).listen(port);
} else {
  require('http').createServer(requestHandler).listen(port);
}
