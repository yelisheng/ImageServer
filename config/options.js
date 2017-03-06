var path = require('path'),
    fs = require('fs'),
    moment = require('moment'),
    basePath = path.resolve(__dirname, '..');

var safeDir = (dir) => {
   if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
  return dir;
}   

module.exports = {
  tmpDir: safeDir(basePath + '/tmp'),
  publicDir: safeDir(basePath + '/public'),
  uploadBaseDir: safeDir(basePath + '/public/images'),
  uploadBaseUrl: '/images/',
  minFileSize: 1,
  maxFileSize: 1048576000, // 10MB
  maxPostSize: 1048576000, // 10MB
  acceptFileTypes: /.+/i,
  imageTypes: /\.(gif|jpe?g|png|bmp|swf)$/i,
  accessControl: {
    allowOrigin: '*',
    allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
    allowHeaders: 'Content-Type, Content-Range, Content-Disposition, Authorization'
  },
  authKey :['wf', 'kf'],
  /*
  ssl: {
    key: '',
    cert: ''
  }
  */
  nodeStatic: {
    cache: 3600
  }
};
