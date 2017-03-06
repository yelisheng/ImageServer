var options = require('../config/options'),
    nodeStatic = require('node-static'),
    UploadHandler = require('./uploadHandler'),
    crypto = require('crypto'),
    path = require('path'),
    _ = require('lodash'),
    fileServer = new nodeStatic.Server(options.publicDir, options.nodeStatic);

module.exports = function (req, res) {

  // Set headers
  res.setHeader(
      'Access-Control-Allow-Origin',
      options.accessControl.allowOrigin
  );

  res.setHeader(
      'Access-Control-Allow-Methods',
      options.accessControl.allowMethods
  );

  res.setHeader(
      'Access-Control-Allow-Headers',
      options.accessControl.allowHeaders
  );

  var setNoCacheHeaders = function () {
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
      },
      utf8encode = function (str) {
        return unescape(encodeURIComponent(str));
      },
      handleResult = function (result, redirect) {
        if (redirect) {
          res.writeHead(302, {
            'Location': redirect.replace(
              /%s/,
              encodeURIComponent(JSON.stringify(result))
            )
          });
          res.end();
        } else {
          if (req.headers.accept) {
            res.writeHead(200, {
              'Content-Type': req.headers.accept
              .indexOf('application/json') !== -1 ?
              'application/json' : 'text/plain'});
          } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
          }
          res.end(JSON.stringify(result));
        }
      },
      handler = new UploadHandler(req, res, handleResult);

  var checkSign = (req, res) => {
    var respond = (err, res)=>{
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({err: err}));
      return false;
    }
    if (!(req.headers && req.headers.authorization)) return respond('参数不正确', res);
    return !!(_.filter(options.authKey, auto => {
        return 'Bearer ' + crypto.createHash('md5').update('5173jhlc'+ auto).digest('hex') === req.headers.authorization
      })[0]) ? true: respond('签名验证错误', res);
  } 

  switch (req.method) {
    case 'OPTIONS':
      res.end();
      break;
    case 'HEAD':
    case 'GET':
      if (req.url === '/') {
        setNoCacheHeaders();
        if (req.method === 'GET') {
          handler.get();
        } else {
          res.end();
        }
      } else {
        fileServer.serve(req, res);
      }
      break;
    case 'POST':
      if (!checkSign(req, res))  return;   
      setNoCacheHeaders();
      handler.post();
      break;
    case 'DELETE':
      if (!checkSign(req, res))  return;   
      handler.destroy();
      break;
    default:
      res.statusCode = 405;
      res.end();
  }

  fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
    _headers['X-Content-Type-Options'] = 'nosniff';
    if (!options.imageTypes.test(files[0])) {
      _headers['Content-Type'] = 'application/octet-stream';
      _headers['Content-Disposition'] = 'attachment; filename="' +
        utf8encode(path.basename(files[0])) + '"';
    }
    nodeStatic.Server.prototype.respond.call(this, pathname, status, _headers, files, stat, req, res, finish);
  };
}
