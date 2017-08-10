var assert  = require("assert");
var sinon   = require("sinon");
var path    = require("path");
var fs      = require("fs");

var connector;
var Connector;

var noop = function () {};

describe("index.js", function () {
    var winston = {
        clear: sinon.stub(),
        add: sinon.stub(),
        info: sinon.stub(),
        debug: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
        verbose: sinon.stub(),
        transports: { Console: {} }
    };

    beforeEach(function () {
        winston.clear.reset();
        winston.add.reset();
        winston.info.reset();
        winston.debug.reset();
        winston.warn.reset();
        winston.error.reset();
        winston.verbose.reset();
    });

    describe("class", function () {
        describe("before module was initialied", function () {
            it("should fail", function () {
                try {
                    require.uncache("../index.js");
                    connector   = require("../index.js");
                    Connector   = connector.Connector;
                    new Connector();
                    assert.fail("should not reach here!");
                } catch (e) {
                    assert.ok(e instanceof Error);
                    assert.equal(e.message, "'kido-connector' was not initialized.");
                }
            });
        });

        describe("after module was initialized.", function () {
            var createSession  = sinon.stub();
            var refreshSession = sinon.stub();
            var disposeSession = sinon.stub();
            var opts;

            before(function () {
                require.uncache("../index.js");
                connector   = require("../index.js");
                Connector   = connector.Connector;
                connector.init("test", winston);

            });

            beforeEach(function () {
                createSession.reset();
                refreshSession.reset();
                disposeSession.reset();
                opts = {
                };
            });

            describe("constructor", function () {
                it("should fail on invalid opts", function () {

                    [
                        0,
                        "",
                        "foo",
                        true,
                        []
                    ].forEach(function (opts) {
                        try {
                            new Connector(opts);
                            assert.fail("should not reach here!");
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'opts' argument must be an object instance.");
                        }
                    });
                });

                it("should fail on invalid opts.config.", function () {

                    [
                        10,
                        "foo",
                        false,
                        true,
                        []
                    ]
                        .forEach(function (config) {
                            try {
                                opts.config = config;
                                new Connector(opts);
                                assert.fail("should not reach here!");
                            } catch (e) {
                                assert.ok(e instanceof Error);
                                assert.equal(e.message, "'opts.config' property is missing or invalid.");
                            }
                        });
                });

                it("should fail on invalid opts.config.timeout.", function () {

                    [
                        10,
                        "1000",
                        [],
                        {}
                    ]
                        .forEach(function (value) {
                            try {
                                opts.config = { timeout: value };
                                new Connector(opts);
                                assert.fail("should not reach here!");
                            } catch (e) {
                                assert.ok(e instanceof Error);
                                assert.equal(e.message, "'opts.config.timeout' property must be a number equal or greater than 100.");
                            }
                        });
                });


                it("should fail on invalid opts.credentialProps", function () {

                    [
                        0,
                        "",
                        "foo",
                        true,
                        {}
                    ].forEach(function (credentialProps) {
                        try {
                                opts.credentialProps = credentialProps;
                            new Connector(opts);
                            assert.fail("should not reach here!");
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'opts.credentialProps' property must be an array of strings.");
                        }
                    });
                });

                it("should fail on invalid opts.createSessionCb", function () {

                    [
                        0,
                        "",
                        "foo",
                        true,
                        {},
                        []
                    ].forEach(function (createSession) {
                        try {
                            opts.createSessionCb = createSession;
                            new Connector(opts);
                            assert.fail("should not reach here!");
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'opts.createSessionCb' property is missing or invalid.");
                        }
                    });
                });

                it("should fail on invalid opts.disposeSession", function () {

                    [
                        1,
                        "foo",
                        true,
                        {},
                        []
                    ].forEach(function (disposeSession) {
                        try {
                            opts.disposeSessionCb = disposeSession;
                            new Connector(opts);
                            assert.fail("should not reach here!");
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'opts.disposeSessionCb' property must be a function.");
                        }
                    });
                });

                it("should fail on invalid opts.refreshSession", function () {

                    [
                        1,
                        "foo",
                        true,
                        {},
                        []
                    ].forEach(function (refreshSession) {
                        try {
                            opts.refreshSessionCb = refreshSession;
                            new Connector(opts);
                            assert.fail("should not reach here!");
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'opts.refreshSessionCb' property must be a function.");
                        }
                    });
                });

                it("should be able to create an instance.", function (done) {
                    var c = new Connector(opts);
                    assert.ok(c instanceof Connector);
                    done();
                });
            });

            describe("getSession", function () {

                beforeEach(function () {
                    opts.credentialProps = ["username",  "password"];
                    opts.createSessionCb = createSession;
                    opts.refreshSessionCb = refreshSession;
                    opts.disposeSessionCb = disposeSession;
                });

                it("should fail if no options argument was passed on.", function (done) {
                    var values = [
                        null,
                        undefined,
                        true,
                        1000,
                        "",
                        "foo"
                    ];
                    var c = new Connector(opts);

                    values.forEach(function (value) {
                        c.getSession(value, function (err, data) {
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "'options' argument must be an object instance.");
                            if (value===values[values.length-1]) done();
                        });
                    });
                });

                it("should fail when the options that was passed on is not an object instance.", function (done) {
                    var values = [
                        "",
                        true,
                        1000,
                        null,
                        undefined,
                        []
                    ];

                    var c = new Connector(opts);

                    values.forEach(function (value) {
                        c.getSession(value, function (err, data) {
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "'options' argument must be an object instance.");
                            if (value===values[values.length-1]) done();
                        });
                    });
                });

                it("should return any error returned by createSessionCb callback.", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, "some error");

                    c.getSession({ username: "mike" }, function (err, data) {
                        assert.ok(createSession.calledOnce);
                        assert.ok(!data);
                        assert.equal(err, "some error");
                        done();
                    });
                });

                it("should return an error if an invalid 'auth' token was passed on.", function (done) {
                    var c = new Connector(opts);
                    c.getSession({ auth: "un existing token" }, function (err, data) {
                        assert.ok(!data);
                        assert.ok(err instanceof Error);
                        assert.equal(err.message, "Invalid 'auth' token.");
                        done();
                    });
                });

                it("should work when valid arguments", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, "token");
                    c.getSession({ username: "mike" }, function (err, data) {
                        assert.ok(createSession.calledOnce);
                        assert.ok(data);
                        assert.equal(data, "token");
                        done();
                    });
                });

                it("should only call createSession once when valid arguments", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, "token");
                    c.getSession({ username: "mike" }, function (err, data) {
                        assert.ok(!err);
                        c.getSession({ username: "mike" }, function (err, data) {
                            assert.ok(createSession.calledOnce);
                            done();
                        });
                    });
                });

                it("should ignore cache if 'ignoreCache' option is passed", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, "token");
                    createSession.onCall(1).callsArgWith(1, null, "new-token");
                    c.getSession({ username: "mike" }, function (err, data) {
                        assert.ok(!err);
                        c.getSession({ username: "mike", ignoreCache: true }, function (err, data) {
                            assert.ok(!err);
                            assert.equal(data, "new-token");
                            done();
                        });
                    });
                });

                describe("When cache are disabled", function () {

                    it("should invoke createSessionCb always", function (done) {

                        opts.disableCache = true;
                        delete opts.refreshSessionCb;
                        delete opts.disposeSessionCb;

                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, { auth: "custom" });
                        createSession.onCall(1).callsArgWith(1, null, { auth: "custom2" });

                        c.getSession( {}, function (err, session, auth) {
                            assert.ok(createSession.calledOnce);
                            assert.ok(!err);
                            assert.equal(session.auth, "custom");
                            assert.equal(auth, "custom");


                            c.getSession( {}, function (err, session, auth) {
                                assert.ok(createSession.calledTwice);
                                assert.ok(!err);
                                assert.equal(session.auth, "custom2");
                                assert.equal(auth, "custom2");
                                done();
                            });
                        });
                    });


                    it("should fail if session doesn't have 'auth' prop", function (done) {

                        opts.disableCache = true;
                        delete opts.refreshSessionCb;
                        delete opts.disposeSessionCb;

                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, {});

                        c.getSession( {}, function (err, session, auth) {
                            assert.ok(createSession.calledOnce);
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "session doesn't have 'auth' property.");
                            done();
                        });
                    });
                });

                describe("When an user hasn't a session.", function () {

                    describe("and user credentials were not configured", function () {

                        it("should invoke createSessionCb callback.", function (done) {
                            var c = new Connector(opts);
                            createSession.onCall(0).callsArgWith(1, null, "custom");

                            c.getSession({ }, function (err, session, auth) {
                                assert.ok(createSession.calledOnce);
                                assert.ok(!err);
                                assert.equal(session, "custom");
                                assert.ok(auth);
                                done();
                            });
                        });
                    });

                    describe("and user credentials were configured", function () {


                        beforeEach(function () {
                            opts.config = { username: "foo", password: "bar" };
                        });

                        it("should use configured credentials when no credentials were passed on.", function (done) {

                            var c = new Connector(opts);
                            c.getSession({}, function (err, session, auth) {
                                assert.ok(!err);
                                assert.ok(session);
                                assert.ok(auth);

                                assert.ok(createSession.calledOnce);
                                var args = createSession.getCall(0).args;
                                assert.deepEqual(args[0], { username: "foo", password: "bar" });
                                done();
                            });
                        });

                        it("should use passed on credentials.", function (done) {

                            var c = new Connector(opts);
                            c.getSession({ username: "alfa", password: "beta"}, function (err, session, auth) {
                                assert.ok(!err);
                                assert.ok(session);
                                assert.ok(auth);

                                assert.ok(createSession.calledOnce);
                                var args = createSession.getCall(0).args;
                                assert.deepEqual(args[0], { username: "alfa", password: "beta" });
                                done();
                            });
                        });
                    });
                });

                describe("When a user has an existing session.", function () {
                    it("should return data from cache if a valid auth token was passed on.", function (done) {
                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, "custom");

                        c.getSession({ username: "mike", password: "1234" }, function (err, session, auth) {
                            assert.ok(!err);
                            assert.ok(session);
                            assert.ok(auth);

                            c.getSession({ auth: auth }, function (err, session2, auth2) {
                                assert.ok(!refreshSession.called);
                                assert.ok(!err);
                                assert.equal(session, session2);
                                assert.equal(auth, auth2);
                                done();
                            });
                        });
                    });

                    it("should return data from cache if a valid username and password were passed on.", function (done) {
                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, "custom");

                        c.getSession({ username: "mike", password: "1234" }, function (err, session, auth) {
                            assert.ok(!err);
                            assert.ok(session);
                            assert.ok(auth);

                            c.getSession({ username: "mike", password: "1234" }, function (err, session2, auth2) {
                                assert.ok(!err);
                                assert.equal(session, session2);
                                assert.equal(auth, auth2);
                                done();
                            });
                        });
                    });

                    it("should fail if a valid username but wrong password were passed on.", function (done) {
                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, "custom");
                        createSession.onCall(1).callsArgWith(1, "some error");

                        c.getSession({ username: "mike", password: "1234" }, function (err, session, auth) {
                            assert.ok(!err);
                            assert.ok(session);
                            assert.ok(auth);

                            c.getSession({ username: "mike", password: "5678" }, function (err, session2, auth2) {
                                assert.ok(!session2);
                                assert.ok(!auth2);
                                assert.equal(err, "some error");

                                // valiate createSession calls' arguments
                                assert.deepEqual(createSession.getCall(0).args[0],  { username: "mike", password: "1234" });
                                assert.deepEqual(createSession.getCall(1).args[0],  { username: "mike", password: "5678" });
                                done();
                            });
                        });
                    });

                    describe("And module was initialized with a 'refreshSessionCb' callback", function () {

                        it("should return any error returned by refreshSession callback.", function (done) {
                            var c = new Connector(opts);
                            createSession.onCall(0).callsArgWith(1, null, "custom", new Date());

                            c.getSession({ username: "mike" }, function (err, session, auth) {
                                assert.ok(!err);
                                assert.ok(session);
                                assert.ok(auth);

                                // refresh authentication and returns new metadata and new expiration
                                refreshSession.onCall(0).callsArgWith(1, "some error");

                                // wait until token expires
                                setTimeout(function () {
                                    // token is expired, a new getSession must refresh the token
                                    c.getSession({ auth: auth }, function (err, session2, auth2) {
                                        assert.ok(refreshSession.calledOnce);
                                        assert.ok(!session2);
                                        assert.ok(!auth2);
                                        assert.equal(err, "some error");
                                        done();
                                    });
                                }, 20);
                            });
                        });

                        it("should invoke 'refreshSession' callback  when auth token is expired.", function (done) {

                            var firstDate = new Date();
                            var secondDate = new Date(firstDate.getTime() + 5000);

                            // authenticates user and returns metadata and expiration
                            // firstDate is an expired time
                            createSession.onCall(0).callsArgWith(1, null, "custom", firstDate);

                            // refresh authentication and returns new metadata and new expiration
                            refreshSession.onCall(0).callsArgWith(1, null, "custom2", secondDate);


                            var c = new Connector(opts);
                            // first getSession users
                            c.getSession({ username: "mike", password: "1234" }, function (err, session, auth) {


                                assert.ok(!err);
                                assert.ok(auth);
                                assert.equal(session, "custom");

                                // wait until token expires
                                setTimeout(function () {

                                    // token is expired, a new getSession must refresh the token
                                    c.getSession({ auth: auth }, function (err, session2, auth2) {

                                        assert.ok(!err);
                                        // auth token must remain the same one
                                        assert.equal(auth2, auth);
                                        // the session must be the new one
                                        assert.equal(session2, "custom2");

                                        // Refresh method must be invoked once.
                                        assert.ok(refreshSession.calledOnce);

                                        // The refresh method must recieve:
                                        var args = refreshSession.getCall(0).args;
                                        assert.equal(args[0], session);
                                        done();
                                    });
                                }, 20);
                            });
                        });

                        it("should return data from cache if auth token is not expired", function (done) {
                            var c = new Connector(opts);

                            createSession.onCall(0).callsArgWith(1, null, "custom", new Date(new Date().getTime() + 5000));

                            c.getSession({ username: "mike" }, function (err, session, auth) {
                                assert.ok(createSession.calledOnce);
                                assert.ok(!err);
                                assert.ok(auth);
                                assert.equal(session, "custom");

                                c.getSession({ auth: auth }, function (err, session2, auth2) {
                                    assert.ok(!refreshSession.hcalled);
                                    assert.ok(!err);
                                    assert.equal(session, session2);
                                    assert.equal(auth, auth2);
                                    done();
                                });
                            });
                        });

                        it("should fail when 'createSessionCb' callback returns a token expiration that is not of type Date.", function (done) {
                            var c = new Connector(opts);

                            createSession.onCall(0).callsArgWith(1, null, "custom", "invalid expiration time");

                            c.getSession({ username: "mike" }, function (err, session, auth) {
                                assert.ok(createSession.calledOnce);
                                assert.ok(!session);
                                assert.ok(!auth);
                                assert.ok(err instanceof Error);
                                assert.equal(err.message, "Create session aborted.");
                                assert.equal(err.description, "When 'createSessionCb' callback returns an 'expire' argument. It must be of type Date.");
                                done();
                            });
                        });

                        it("should invoke 'createSessionCb' callback when 'refreshSessionCb' does not return a new session.", function (done) {
                            var firstDate = new Date();
                            var secondDate = new Date(firstDate.getTime() + 5000);

                            // authenticates user and returns session and expiration 
                            // firstDate is an expired time
                            createSession.onCall(0).callsArgWith(1, null, "custom", firstDate);

                            // authenticates user and returns sesison and expiration 
                            createSession.onCall(1).callsArgWith(1, null, "custom2", secondDate);

                            // refresh authentication does NOT return a new session
                            refreshSession.onCall(0).callsArgWith(1, null, null);

                            var c = new Connector(opts);

                            // first getSession users
                            c.getSession({ username: "mike", password: "1234" }, function (err, session, auth) {

                                assert.ok(!err);
                                assert.ok(auth);
                                assert.equal(session, "custom");

                                // wait until token expires
                                setTimeout(function () {

                                    // token is expired, a new getSession must refresh the token
                                    c.getSession({ auth: auth }, function (err, session2, auth2) {

                                        assert.ok(!err);
                                        // auth token must remain the same one
                                        assert.equal(auth2, auth);
                                        // the session must be the new one
                                        assert.equal(session2, "custom2");

                                        // Refresh method must be invoked once.
                                        assert.ok(refreshSession.calledOnce);

                                        // Create method must be invoked twice.
                                        assert.ok(createSession.calledTwice);

                                        // The refresh method must recieve:
                                        var args = refreshSession.getCall(0).args;
                                        assert.equal(args[0], session);
                                        done();
                                    });
                                }, 20);
                            });

                        });
                    });

                    describe("And module was initialized with a 'disposeSession' callback", function () {

                        it("should invoke disposeSession when an item timeouts", function (done) {
                            var timeout = 100;
                            opts.config = { timeout: timeout };

                            var c = new Connector(opts);

                            createSession.onCall(0).callsArgWith(1, null, "custom");
                            disposeSession.onCall(0).callsArg(1);

                            c.getSession({ username: "mike" }, function (err, session, auth) {
                                assert.ok(!err);
                                assert.ok(auth);
                                assert.equal(session, "custom");
                            });

                            setTimeout(function () {
                                assert.ok(disposeSession.calledOnce);
                                var args = disposeSession.getCall(0).args;
                                assert.equal(args.length, 2);
                                assert.equal(args[0], "custom");
                                assert.equal(typeof args[1], "function");
                                done();
                            }, timeout + 20);
                        });
                    });
                });
            });

            describe("close", function () {

                beforeEach(function () {
                    opts.credentialProps = ["username",  "password"];
                    opts.createSessionCb = createSession;
                    opts.refreshSessionCb = refreshSession;
                    opts.disposeSessionCb = disposeSession;
                });

                it("should no fail if there aren't any session.", function (done) {
                    var c = new Connector(opts);
                    c.close(done);
                });

                it("should no fail if caching is disabled.", function (done) {
                    opts.disableCache = true;
                    var c = new Connector(opts);
                    c.close(done);
                });

                it("should invoke 'disposeSession' callback for each session", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, "custom");
                    createSession.onCall(1).callsArgWith(1, null, "custom2");

                    disposeSession.onCall(0).callsArgWith(1);
                    disposeSession.onCall(1).callsArgWith(1);

                    c.getSession({ username: "mike" }, function (err, session, auth) {
                        assert.ok(createSession.calledOnce);
                        assert.ok(!err);
                        assert.equal(session, "custom");
                        assert.ok(auth);

                        c.getSession({ username: "john" }, function (err, session2, auth2) {
                            assert.ok(createSession.calledTwice);
                            assert.ok(!err);
                            assert.equal(session2, "custom2");
                            assert.ok(auth2);

                            c.close(function () {
                                assert.ok(disposeSession.calledTwice);
                                assert.equal(disposeSession.getCall(0).args[0], session);
                                assert.equal(disposeSession.getCall(1).args[0], session2);
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe("after module was initialized without disposeSession", function () {
            var createSession = sinon.stub();
            var disposeSession = sinon.stub();
            var refreshSession = sinon.stub();
            var opts;

            before(function () {
                require.uncache("../index.js");
                connector   = require("../index.js");
                Connector   = connector.Connector;
                connector.init("test", winston);
            });

            beforeEach(function () {
                createSession.reset();
                disposeSession.reset();
                refreshSession.reset();
                opts = {
                    credentialProps: ["username",  "password"],
                    createSessionCb: createSession,
                    refreshSessionCb: refreshSession
                };
            });

            describe("getSession", function () {
                describe("When a user has an existing session.", function () {
                    it("should not fail when a cache item expires by timeout", function (done) {
                        var expectedAuth = null;
                        var timeout = 100;
                        opts.config = { timeout: timeout };
                        var c = new Connector(opts);

                        createSession.onCall(0).callsArgWith(1, null, "custom");
                        createSession.onCall(1).callsArgWith(1, null, "custom");

                        c.getSession({ username: "mike" }, function (err, session, auth) {
                            assert.ok(!err);
                            assert.ok(auth);
                            assert.equal(session, "custom");
                            expectedAuth = auth;
                        });

                        setTimeout(function () {
                            // getSession again
                            c.getSession({ username: "mike" }, function (err, session2, auth2) {
                                assert.ok(!err);
                                assert.equal(session2, "custom");
                                assert.ok(expectedAuth !== auth2);
                                done();
                            });
                        }, timeout + 20);
                    });
                });
            });

            describe("close", function () {
                it("should not fail", function (done) {
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, "custom");

                    c.getSession({ username: "mike" }, function (err, session, auth) {
                        assert.ok(createSession.calledOnce);
                        assert.ok(!err);
                        assert.equal(session, "custom");
                        assert.ok(auth);

                            c.close(function () {
                            assert.ok(!disposeSession.called);
                            done();
                        });
                    });
                });

                it("should not fail when caching is disabled", function (done) {
                    opts.disableCache = true;
                    var c = new Connector(opts);
                    createSession.onCall(0).callsArgWith(1, null, { auth: "custom" });

                    c.getSession({ username: "mike" }, function (err, session, auth) {
                        assert.ok(createSession.calledOnce);
                        assert.ok(!err);
                        assert.equal(session.auth, "custom");
                        assert.equal(auth, "custom");

                            c.close(function () {
                            assert.ok(disposeSession.notCalled);
                            done();
                        });
                    });
                });
            });
        });

        describe("after module was initialized without refreshSession", function () {
            var createSession = sinon.stub();
            var disposeSession = sinon.stub();
            var refreshSession = sinon.stub();
            var opts = {};

            before(function () {
                require.uncache("../index.js");
                connector = require("../index.js");
                Connector = connector.Connector;
                connector.init("test", winston);
            });

            beforeEach(function () {
                createSession.reset();
                disposeSession.reset();
                refreshSession.reset();

                opts = {
                    credentialProps: ["username",  "password"],
                    createSessionCb: createSession,
                    disposeSessionCb: disposeSession
                };
            });

            describe("getSession", function () {

                describe("When a user has an existing session.", function () {

                    it("should fail when 'createSessionCb' callback returns a token's expiration.", function (done) {
                        var c = new Connector(opts);
                        createSession.onCall(0).callsArgWith(1, null, "custom", new Date(new Date().getTime() + 5000));

                        c.getSession({ username: "mike" }, function (err, session, auth) {
                            assert.ok(createSession.calledOnce);
                            assert.ok(!auth);
                            assert.ok(!session);
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "Create session aborted.");
                            assert.equal(err.description, "When 'createSessionCb' callback returned an 'expire' argument but not 'refreshSessionCb' callback was initialized.");
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("init", function () {

        var dir = path.resolve(process.cwd(), "./logs/");

        beforeEach(function () {
            if (fs.existsSync(dir)) fs.rmdirSync(dir);
        });

        it("should fail if no label", function () {
            try {
                require.uncache("../index.js");
                connector   = require("../index.js");
                Connector   = connector.Connector;
                connector.init();
                assert.fail("should not reach here!");
            } catch (e) {
                assert.ok(e instanceof Error);
                assert.equal(e.message, "'label' argument is missing.");
            }
        });

        it("should fail if no winston", function () {
            try {
                require.uncache("../index.js");
                connector   = require("../index.js");
                Connector   = connector.Connector;
                connector.init("foo");
                assert.fail("should not reach here!");
            } catch (e) {
                assert.ok(e instanceof Error);
                assert.equal(e.message, "'winston' argument is missing.");
            }
        });

        it("should work", function () {
            require.uncache("../index.js");
            connector   = require("../index.js");
            Connector   = connector.Connector;
            connector.init("test", winston, noop);
        });

        it("should fail when is initialized by a second time", function () {
            require.uncache("../index.js");
            connector   = require("../index.js");
            Connector   = connector.Connector;
            connector.init("test", winston, noop);
            try {
                connector.init("test", winston, noop);
                assert.fail("Did not fail.");
            } catch (e) {
                assert.ok(e instanceof Error);
                assert.equal(e.message, "Can't be initialized twice.");
            }
        });

        it("should work with --level", function () {
            require.uncache("../index.js");
            process.argv.push("--level");
            process.argv.push("debug");
            connector = require("../index.js");
            connector.init("test", winston, noop);
        });

        it("'timestamp' winston option must be a valid function.", function () {
            require.uncache("../index.js");
            process.argv.push("--level");
            process.argv.push("debug");
            connector = require("../index.js");
            connector.init("test", winston);
            assert.ok(winston.add.calledTwice);
            var args = winston.add.getCall(0).args;
            var timestamp = args[1].timestamp;
            assert.equal(typeof timestamp, "function");
            assert.ok(timestamp());
        });


        it("should create log folder.", function () {
            require.uncache("../index.js");
            process.argv.push("--level");
            process.argv.push("debug");
            connector = require("../index.js");
            connector.init("test", winston);
            assert.ok(fs.existsSync(dir));
        });

        it("should not fail id log folder aready exists.", function () {

            fs.mkdirSync(dir);
            assert.ok(fs.existsSync(dir));
            require.uncache("../index.js");
            process.argv.push("--level");
            process.argv.push("debug");
            connector = require("../index.js");
            connector.init("test", winston);
            assert.ok(fs.existsSync(dir));
        });
    });

    describe("isHostAllowed", function () {
        before(function () {
            process.env.RUNNING_ON = "hub";
            connector = require("../index.js");
        });

        it("Should fail with no host", function (done) {
            connector.isHostAllowed(function (err, allowed) {
                assert.ok(!allowed);
                assert.ok(err);
                assert.strictEqual(err.message, "host parameter is mandatory");
                done();
            });
        });

        it("Should fail with invalid host type", function (done) {
            connector.isHostAllowed(123, function (err, allowed) {
                assert.ok(!allowed);
                assert.ok(err);
                assert.strictEqual(err.message, "host must be a string");
                done();
            });
        });

        it("Should fail with missing cb host type", function (done) {
            connector.isHostAllowed(123, function (err, allowed) {
                assert.ok(!allowed);
                assert.ok(err);
                assert.strictEqual(err.message, "host must be a string");
                done();
            });
        });

        it("Should fail with invalid host", function (done) {
            connector.isHostAllowed("INVALID", function (err, allowed) {
                assert.ok(!allowed);
                assert.ok(err);
                assert.strictEqual(err.message, "getaddrinfo ENOTFOUND");
                done();
            });
        });

        it("Should return invalid with loopback host ipv4", function (done) {
            connector.isHostAllowed("localhost", function (err, allowed) {
                assert.ok(!err);
                assert.ok(!allowed);
                done();
            });
        });

        it("Should return invalid with loopback ip ipv4", function (done) {
            connector.isHostAllowed("127.0.0.3", function (err, allowed) {
                assert.ok(!err);
                assert.ok(!allowed);
                done();
            });
        });

        it("Should return invalid with loopback host ipv6", function (done) {
            connector.isHostAllowed("::1", function (err, allowed) {
                assert.ok(!err);
                assert.ok(!allowed);
                done();
            });
        });

        it("Should return invalid with internal host ipv4", function (done) {
            connector.isHostAllowed("10.0.1.10", function (err, allowed) {
                assert.ok(!err);
                assert.ok(!allowed);
                done();
            });
        });

        it("Should return invalid with internal host ipv6", function (done) {
            connector.isHostAllowed("fe80::6267:20ff:fe22:4928", function (err, allowed) {
                assert.ok(!err);
                assert.ok(!allowed);
                done();
            });
        });

        it("Should work with valid hostname", function (done) {
            connector.isHostAllowed("www.google.com", function (err, allowed) {
                assert.ok(!err);
                assert.ok(allowed);
                done();
            });
        });

        it("Should work with valid IP", function (done) {
            connector.isHostAllowed("64.233.186.147", function (err, allowed) {
                assert.ok(!err);
                assert.ok(allowed);
                done();
            });
        });

        it("Should work when not running on hub", function (done) {
            process.env.RUNNING_ON = "agent";
            connector.isHostAllowed("localhost", function (err, allowed) {
                assert.ok(!err);
                assert.ok(allowed);

                process.env.RUNNING_ON = "hub";
                done();
            });
        });
    });
});



/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });
};

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};
