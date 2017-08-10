"use strict";
/*
* This module was developed as part of the Kidozen project.
* Its main function is to manage user sessions of connectors
* This module must be initialized only once, before it can be used.
*/

require("simple-errors");
var Cache   = require("mem-cache");
var Moment  = require("moment");
var uuid    = require("node-uuid");
var path    = require("path");
var fs      = require("fs");
var hash    = require("object-hash");
var dns     = require("dns");
var ipaddr  = require("ipaddr.js");

var _winston = null;
function _noop() {};

/*
* Initialize winston console transport.
* @param label {string} Required. Label taht will be used by the winston console transport.
* @param winston {object} Required. Winston instance
* @api public
*/
module.exports.init = function (label, winston) {
    if (_winston) throw Error.create("Can't be initialized twice.");
    if (!label || typeof label !== "string") throw Error.create("'label' argument is missing.");
    if (!winston) throw Error.create("'winston' argument is missing.");

    var levelIndex = process.argv.indexOf("--level");
    var level = ((levelIndex > -1) ? process.argv[levelIndex + 1] : "info");

    function timestampFx () {
        var m = new Moment();
        return m.format("YYYY-MM-DD HH:mm:ss");
    };

    var options = {
        label: label,
        colorize: true,
        level: level,
        timestamp: timestampFx
    };

    winston.clear();

    winston.add(winston.transports.Console, options);

    var dir = path.resolve(process.cwd(), "./logs/");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    winston.add(winston.transports.File,
    {   json: false,
        prettyPrint: true,
        level: level,
        filename: dir + "/" + label.toLowerCase() + ".log",
        timestamp: timestampFx
    });

    _winston = winston;
};

/**
 * Validates if the host/ip is allowed inside the HUB
 * This validation tries to avoid internal attacks
 * @param  {string}   host The hostname / ip to check
 * @param  {Function} cb   the callback. It will be invoked as "cb(err, allowed)"
 */
module.exports.isHostAllowed = function (host, cb) {
    if (host && typeof host === "function") {
        cb = host;
        host = null;
    }
    if (!host) return cb(Error.create("host parameter is mandatory"));
    if (typeof host !== "string") return cb(Error.create("host must be a string"));

    if (process.env.RUNNING_ON !== "hub") return cb(null, true);

    dns.lookup(host, function onLookup (err, addresses) {
        if (err) return cb(err);

        var parsed = ipaddr.parse(addresses);
        var range = parsed.range();
        var allowed = range === "unicast";
        if (_winston) _winston.debug("kido-connector.isHostAllowed: [" + host + "] range: " + range + " Allowed: " + allowed);
        return cb(null, allowed);
    });
};

/*
* Class.
* @param opts {object} Required. Constructor options. It could have the following properties:
*
* - config: {object} Required. Connector's configuration
*
* - disableCache: {boolean} Optional. default false
*
* - creentialProps: {array of strings} Optional. This property must contain the name of all properties
*       that will be used to create the user's credential. For instance: [ "username", "password "]
*
*
* - createSessionCb: {function} Required. The module will invoke this callback when it needs
*       to autheticate an user. The callback should have this signture:
*           function (credential, cb)
*
*       And it must return any error:
*           cb(new Error("...."));
*
*       Or it must return a session instance and optionally a session's expiration time:
*           var session  =  // what ever you need
*           var expireOn = // some Date instance
*           cb(null, session, expireOn);
*
*       If cache are disabled, session must be an object instance and it must contain the 'auth' property.
*           cb(null, { foo: ...., auth: "" });
*
*
* - disposeSessionCb: {function} Optional. The module will invoke this callback when a session must be closed.
*       Its signature must be:
*           function (session, cb)
*
*       And it must invoke the 'cb' argument after the session was disposed.
*
*
* - refreshSessionCb: {function} Optional. The module will invoke this callback when the session is expired
*       and it needs a new one.  Its signature must be:
*           function (session, cb)
*
*       And it must return any error:
*           cb(new Error("...."));
*
*       Or it must return a new session instance and optionally a new session's expiration time:
*           var session  =  // what ever you need
*           var expireOn = // some Date instance
*           cb(null, session, expireOn);
*
*
* @api public
*/
module.exports.Connector = function (opts) {
    if (!_winston) throw Error.create("'kido-connector' was not initialized.");

    if (typeof opts !== "object" || Array.isArray(opts)) throw Error.create("'opts' argument must be an object instance.");

    if (opts.config !== null && opts.config !== undefined && (Array.isArray(opts.config) || typeof opts.config !== "object")) throw Error.create("'opts.config' property is missing or invalid.");

    if (opts.credentialProps !==null && opts.credentialProps !==undefined && !Array.isArray(opts.credentialProps)) throw Error.create("'opts.credentialProps' property must be an array of strings.");
    if (opts.createSessionCb !==null && opts.createSessionCb !==undefined && typeof opts.createSessionCb !=="function") throw Error.create("'opts.createSessionCb' property is missing or invalid.");
    if (opts.disposeSessionCb!==null && opts.disposeSessionCb!==undefined && typeof opts.disposeSessionCb!=="function") throw Error.create("'opts.disposeSessionCb' property must be a function.");
    if (opts.refreshSessionCb!==null && opts.refreshSessionCb!==undefined && typeof opts.refreshSessionCb!=="function") throw Error.create("'opts.refreshSessionCb' property must be a function.");

    _winston.info("Starting ...");
    _winston.debug("opts.config:", opts.config);
    _winston.debug("opts.credentialProps:", opts.credentialProps);

    opts.config = opts.config || {};
    opts.credentialProps = opts.credentialProps || [];

    if (!opts.disableCache) {

        var newTimeout = opts.config.timeout || 15 * 60 * 1000; // 15 minutes by default
        if (typeof newTimeout !== "number" || newTimeout < 100) throw Error.create("'opts.config.timeout' property must be a number equal or greater than 100.");
        opts.config.timeout = newTimeout;

        var cacheByKey = new Cache({ timeout: opts.config.timeout });
        var cacheByAuth = new Cache({ timeout: opts.config.timeout });

        if (opts.disposeSessionCb) {
            cacheByAuth.on("expired", function (item) {
                _winston.verbose("Item cache expired.");
                _winston.debug("\t", { auth: item.value.auth, credential: item.value.credential, key: item.key, expire: item.value.expire });
                // removes entry from user cache
                cacheByKey.remove(item.key);
                opts.disposeSessionCb(item.value.session, _noop);
            });
        }
    }

    // Returns a non expired session
    function validateExpiration (item, cb) {
        if (!item.expire || item.expire >= new Date()) return cb(null, item.session, item.auth);

        opts.refreshSessionCb(item.session, function (err, session, expire) {
            if (err) return cb(err);

            if (!session) {
                cacheByKey.remove(item.key);
                cacheByAuth.remove(item.auth);
                return cb();
            }

            item.expire = expire;
            item.session = session;

            cacheByKey.set(item.key, item.auth);
            cacheByAuth.set(item.auth, item);
            cb(null, session, item.auth);
        });
    };

    // Returns a credental object and its key. Them will be generated from the merge of options argument and the configuration.
    // options argument has precedence over config.
    function getCredentialAndKey (options) {

        _winston.verbose("getCredentialAndKey");

        var result = {
            credential: {},
            key: ""
        };

        opts
            .credentialProps
            .forEach(function (prop) {
                var val = options[prop];

                // if options doesn't have the value, get it from config
                if (val === null || val === undefined) val = opts.config[prop];

                // add value to credential and key if it was found
                if (val !== null && val !== undefined) result.credential[prop] = val;
            });

        //hashing complete credential object
        result.key = hash(result.credential);

        _winston.debug("result", result);

        return result;
    };


    /*
    * Returns an user session from cache or creates a new one.
    * @param options {object} required.
    * - ignoreCache {bool} will force a refresh of the token, and save the result in the cache.
    */
    this.getSession = function (options, cb) {
        _winston.verbose("getSession");
        _winston.debug("\toptions:", options);

        if (!options || typeof options !== "object" || Array.isArray(options)) return cb(Error.create("'options' argument must be an object instance."));


        var item, credentialAndKey;

        function validateExpirationCb (defaultAuth) {
            return function (err, session, auth) {
                if (err || session) return cb(err, session, auth);
                callCreateSession(defaultAuth);
            };
        };

        function callCreateSession (auth) {
            credentialAndKey = credentialAndKey || getCredentialAndKey(options);
            opts.createSessionCb(credentialAndKey.credential, function (err, session, expire) {
                if (err) return cb(err);

                if (opts.disableCache) {
                    if (!session.auth) return cb(Error.create("session doesn't have 'auth' property."));
                    return cb(null, session, session.auth);
                }

                if (expire) {
                    if (!(expire instanceof Date)) return cb(Error.create("Create session aborted.", { "description": "When 'createSessionCb' callback returns an 'expire' argument. It must be of type Date."}));
                    if (!opts.refreshSessionCb)  return cb(Error.create("Create session aborted.", { "description": "When 'createSessionCb' callback returned an 'expire' argument but not 'refreshSessionCb' callback was initialized."}));
                }

                var cacheItem = {
                    auth: auth || uuid.v4(),
                    credential: credentialAndKey.credential,
                    key: credentialAndKey.key,
                    session: session,
                    expire: expire || null
                };

                cacheByKey.set(cacheItem.key, cacheItem.auth);
                cacheByAuth.set(cacheItem.auth, cacheItem);
                cb(null, session, cacheItem.auth);
            });
        };

        if (!opts.disableCache && !options.ignoreCache) {
            // search auth token on cache
            if (options.auth) {
                item = cacheByAuth.get(options.auth);
                if (!item) return cb(Error.create("Invalid 'auth' token."));
                return validateExpiration(item, validateExpirationCb(options.auth));
            }

            credentialAndKey = getCredentialAndKey(options);
            var authToken = cacheByKey.get(credentialAndKey.key);
            if (authToken) {
                // if we found the 'auth' token, then the item does exist at cacheByAuth. always.
                item = cacheByAuth.get(authToken);
                if (item.key === credentialAndKey.key) return validateExpiration(item, validateExpirationCb(authToken));

                // the next line will never be reached. but I added it just in case :p
                return cb(Error.create("Invalid credentials."));
            }
            callCreateSession();
        } else
            callCreateSession();
    };

    /*
    * Removes all user sessions from cache.
    * If 'disposeSessionCb' callback was defined, invokes it for each user sessions.
    */
    this.close = function (cb) {
        _winston.verbose("close");

        if (opts.disableCache) return cb();

        if (!opts.disposeSessionCb) {
            _winston.verbose("\tdisposeSessionCb was not defined.");
            cacheByAuth.clean();
            cacheByKey.clean();
            return cb();
        }

        var keys = cacheByAuth.keys;
        var count = keys.length;

        _winston.verbose("\tSessions count:", count);
        if (!count) return cb();

        keys.forEach(function (key) {
            var item = cacheByAuth.remove(key);
            opts.disposeSessionCb(item.session, function () {
                if (--count===0) {
                    _winston.verbose("All sessions were close");
                    cacheByAuth.clean();
                    cacheByKey.clean();
                    cb();
                }
            });
        });
    };

    _winston.info("Started.");
};