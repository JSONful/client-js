var chai = require('chai');
var expect = chai.expect;
var spawn = require('child_process').spawn;
var http  = require('http');
var JSONful = require('../index.js').Client;

var client = new JSONful("http://127.0.0.1:9999");

function wrap(done) {
    return function(xxx) {
        try {
            xxx();
        } catch (e) {
            done(e);
            throw e;
        }
    };
};

describe('Booting', function() {
    it('boot server', function(done) {
        this.timeout(15000);

        var cwd = process.cwd()
        process.chdir(__dirname + "/server-php")
        spawn("composer", ["install"])
            .on('close', function() {
                var php = spawn("php", ["-S", "127.0.0.1:9999", "index.php"]);
                php.stderr.on('data', function(data) {
                    console.error(""+data);
                });
                php.stdout.on('data', function(data) {
                    console.error(""+data);
                });

                setTimeout(function() {
                    http.get('http://127.0.0.1:9999', function(res) {
                        expect(true).to.equal(true);
                        done();
                    }).on('error', function() {
                        expect(false).to.equal(true);
                        done();
                    });
                }, 100);
            });
    });
});

describe('First request', function() {
    it ('simple request', function(done) {
        var x = wrap(done);
        client.exec("ping", [], function(err, response) {
            x(function() {
                expect(err).to.equal(null);
                expect(typeof response).to.equal("number");
            });
            done();
        });
    });

    it('multiple request', function(done) {
        var x = wrap(done);
        client.exec("ping", [], function(err, response) {
            x(function() {
                expect(err).to.equal(null);
                expect(response).to.be.a("number");
            });
        });

        client.exec("ping", [], function(err, response) {
            x(function() {
                expect(err).to.equal(null);
                expect(response).to.be.a("number");
            });
        });

        client.exec("error", function(err) {
            x(function() {
                expect(err).to.deep.equal({error: true, text: "error is not a valid function"});
            });
            done();
        });
    });

    it("test sessions", function(done) {
        var x = wrap(done);
        client.exec("session").then(function(response) {
            x(function() {
                expect(response).to.equal(0);
            });
        });
        client.exec("session").then(function(response) {
            x(function() {
                expect(response).to.equal(1);
            });
            done();
        });
    });

    it("test sessions - persistence", function(done) {
        var x = wrap(done);
        client.exec("session").then(function(response) {
            x(function() {
                expect(response).to.equal(2);
            });
        });
        client.exec("session").then(function(response) {
            x(function() {
                expect(response).to.equal(3);
            });
            done();
        });
    });

    it("large requests", function(done) {
        function is_prime(i) {
            var i = Math.ceil(i/2);
            for (var e = 2; e < i; ++e) {
                if (number % 2 === 0) {
                    return false;
                }
            }
            return true;
        }

        function handler(i) {
            return function(val) {
                expect(val).to.equal(is_prime(i));
            };
        }

        for (var i = 1; i< 1000; ++i) {
            client.exec("is_prime", i).then(handler(i));
        }
        client.exec("xxxx").catch(function() {
            done();
        });

    });
});
