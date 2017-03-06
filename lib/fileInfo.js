var options = require('../config/options'),
    fs = require('fs'),
    moment = require('moment'),
    path = require('path'),
    _existsSync = fs.existsSync || path.existsSync,
    nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/,
    nameCountFunc = function (s, index, ext) {
      return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
    };


module.exports = class FileInfo  {
  constructor(file) { 
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.deleteType = 'DELETE';
    this.root = file.root;
  }
    initUrl(req) {
        var getUrl = (root, name)=> {
            var arry = root.split(options.uploadBaseUrl);
            if (arry.length < 2) throw new Error('非法的图片路径');
            var baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadBaseUrl ;     
             return baseUrl + arry[1] +  encodeURIComponent(name);
        }
        if (!this.error) {
            var that = this,
                baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadBaseUrl;

            this.url = this.deleteUrl = getUrl(this.root, this.name);
        }
    }

    safeName () {
        // prevent directory traversal and creating system hidden files
        this.name = path.basename(this.name).replace(/^\.+/, '');
        while (_existsSync(this.root + '/' + this.name)) {
            this.name = this.name.replace(nameCountRegexp, nameCountFunc);
        }
    }

    validate () {
        if (options.minFileSize && options.minFileSize > this.size) {
            this.error = 'File is too small';
        }
        if (options.maxFileSize && options.maxFileSize < this.size) {
            this.error = 'File is too big';
        }
        if (!options.acceptFileTypes.test(this.type)) {
            this.error = 'File type not wrong';
        }

        return !this.error;
    }
    
    uploadDir() {
      var dir = options.uploadBaseDir + '/' + moment().format("YYYYMMDD") + '/';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      this.root = dir.replace(/\\/g,'/');
    }


}

