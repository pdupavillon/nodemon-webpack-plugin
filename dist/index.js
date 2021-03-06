'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var nodemon = require('nodemon');
var chalk = require('chalk');
var R = require('ramda');

var isMapFile = R.endsWith('.map');
var getOutputFileName = R.pipe(R.prop('assets'), R.keys, R.reject(isMapFile), R.head);

var getOutputFileMeta = function getOutputFileMeta(compilation) {
    var outputFilename = getOutputFileName(compilation);
    var asset = compilation.assets[outputFilename];
    var absoluteFileName = asset.existsAt;
    var relativeFileName = path.relative('', absoluteFileName);

    return { absoluteFileName, relativeFileName };
};

var nodemonLog = function nodemonLog(filename) {
    return function (msg, colour) {
        return function () {
            return console.log(chalk[colour](`[ Nodemon ] ${msg} ${filename}`));
        };
    };
};

module.exports = function () {
    function _class(config) {
        _classCallCheck(this, _class);

        this.config = config;
        this.isWebpackWatching = false;
        this.isNodemonRunning = false;
    }

    _createClass(_class, [{
        key: 'apply',
        value: function apply(compiler) {
            var _this = this;

            compiler.plugin('after-emit', function (compilation, callback) {
                if (_this.isWebpackWatching && !_this.isNodemonRunning) {
                    var _getOutputFileMeta = getOutputFileMeta(compilation),
                        absoluteFileName = _getOutputFileMeta.absoluteFileName,
                        relativeFileName = _getOutputFileMeta.relativeFileName;

                    _this.startMonitoring(absoluteFileName, relativeFileName);
                }
                callback();
            });

            compiler.plugin('watch-run', function (compiler, callback) {
                _this.isWebpackWatching = true;
                callback();
            });
        }
    }, {
        key: 'startMonitoring',
        value: function startMonitoring(filename, displayname) {
            var _this2 = this;

            var args = '';
            var log = nodemonLog(displayname);
            if (this.config) {
                Object.keys(this.config).forEach(function (k) {
                    args += k + ' ' + _this2.config[k] + ' ';
                });
            }

            var monitor = nodemon(args + filename);

            monitor.on('start', log('Started:', 'green')).on('crash', log('Crashed:', 'red')).on('restart', log('Restarting:', 'cyan')).once('quit', function () {
                log('Stopped:', 'cyan')();
            });

            this.isNodemonRunning = true;

            // See https://github.com/JacksonGariety/gulp-nodemon/issues/77
            process.on('SIGINT', function () {
                monitor.once('exit', function () {
                    process.exit();
                });
            });
        }
    }]);

    return _class;
}();