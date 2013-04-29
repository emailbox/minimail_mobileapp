
/*! Socket.IO.js build:0.9.10, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */
var io = ('undefined' === typeof module ? {} : module.exports);
(function() {
/**
* socket.io
* Copyright(c) 2011 LearnBoost <dev@learnboost.com>
* MIT Licensed
*/
(function (exports, global) {
/**
* IO namespace.
*
* @namespace
*/
var io = exports;
/**
* Socket.IO version
*
* @api public
*/
io.version = '0.9.10';
/**
* Protocol implemented.
*
* @api public
*/
io.protocol = 1;
/**
* Available transports, these will be populated with the available transports
*
* @api public
*/
io.transports = [];
/**
* Keep track of jsonp callbacks.
*
* @api private
*/
io.j = [];
/**
* Keep track of our io.Sockets
*
* @api private
*/
io.sockets = {};
/**
* Manages connections to hosts.
*
* @param {String} uri
* @Param {Boolean} force creation of new socket (defaults to false)
* @api public
*/
io.connect = function (host, details) {
var uri = io.util.parseUri(host)
, uuri
, socket;
if (global && global.location) {
uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
uri.host = uri.host || (global.document
? global.document.domain : global.location.hostname);
uri.port = uri.port || global.location.port;
}
uuri = io.util.uniqueUri(uri);
var options = {
host: uri.host
, secure: 'https' == uri.protocol
, port: uri.port || ('https' == uri.protocol ? 443 : 80)
, query: uri.query || ''
};
io.util.merge(options, details);
if (options['force new connection'] || !io.sockets[uuri]) {
socket = new io.Socket(options);
}
if (!options['force new connection'] && socket) {
io.sockets[uuri] = socket;
}
socket = socket || io.sockets[uuri];
// if path is different from '' or /
return socket.of(uri.path.length > 1 ? uri.path : '');
};
})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
* socket.io
