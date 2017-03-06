var fs = require('fs'),
    path = require('path'),
    gm = require('gm'),
    walk = require('walk'),
    options = require('../config/options'),
    formidable = require('formidable'),
    FileInfo = require('./fileInfo');

module.exports = class UploadHandler {
  constructor(req, res, callback) {
    this.req = req;
    this.res = res;
    this.callback = callback;
  }

  get() {
    var handler = this,
      files = [];
    var readDir = (dir) => {
        return (done, callback) => {
          var walker  = walk.walk(dir, { followLinks: true });
          walker.on('file', function(root, stats, next) {
            if (stats.name[0] == '.') return next();
            done(root + '/', stats);
            next();     
          });
          walker.on('end', callback);
      }
    }
    var reader = readDir(options.uploadBaseDir);
    var done = (root, stats)=>{
      var fileInfo = new FileInfo({
          name: stats.name,
          size: stats.size,
          root: root.replace(/\\/g,'/'),
        });
        fileInfo.initUrl(handler.req);
        files.push(fileInfo);
    }
    var end = ()=>{
      handler.callback({files: files});
    }
    reader(done, end);
}

  /**
   * Post a new file
   *
   */
  post() {
    var handler = this,
        form = new formidable.IncomingForm(),
        tmpFiles = [],
        map = {},
        files = [],
        counter = 1,
        redirect,
        finish = function () {
          counter -= 1;
          if (!counter) {
            files.forEach(function (fileInfo) {
              fileInfo.initUrl(handler.req);
            });
            handler.callback({files: files}, redirect);
          }
        };

    form.uploadDir = options.tmpDir;
    form.on('fileBegin', function (name, file) {
        tmpFiles.push(file.path);
        var fileInfo = new FileInfo(file, handler.req, true);
        map[path.basename(file.path)] = fileInfo;
        fileInfo.uploadDir();
        fileInfo.safeName();
        files.push(fileInfo);
    }).on('field', function (name, value) {
        if (name === 'redirect') {
          redirect = value;
        }
    }).on('file', function (name, file) {
        var fileInfo = map[path.basename(file.path)];
        fileInfo.size = file.size;
        if (!fileInfo.validate()) {
            fs.unlink(file.path);
            return;
        }
        fs.renameSync(file.path, fileInfo.root + '/' + fileInfo.name);
        if (options.imageTypes.test(fileInfo.name)) {
              counter += 1;
              finish();
        }
    }).on('aborted', function () {
      tmpFiles.forEach(function (file) {
        fs.unlink(file);
      });
    }).on('progress', function (bytesReceived) {
      if (bytesReceived > options.maxPostSize) {
        handler.req.socket.destroy();
      }
    }).on('error', function (e) {
      console.log(e);
    }).on('end', finish).parse(handler.req);
  }

  /**
   * Delete files
   *
   */
  destroy() {
    var handler = this,
        url;
    if (handler.req.url.slice(0, options.uploadBaseUrl.length) === options.uploadBaseUrl) {
      url = decodeURIComponent(handler.req.url);
      if (path.basename(url)[0] !== '.') {
        fs.unlink(options.publicDir + url, function (err) {
          handler.callback({success: !err});
        });
        return;
      }
    }
    handler.callback({success: false});
  }
}

