describe("Web Workers library", function() {
    function inc(a) {
        var now = new Date().getTime();
        while (new Date().getTime() < now + 100) { }
        return a + 1;
    }

    it("should be function", function() {
        expect(typeof WW).toBe('function');
    });

    it("should be instantiable", function() {
        const ww = new WW();
        expect(typeof ww).toBe('object');
    });

    describe("Running job as", function() {
        beforeEach(function(done) {
            setTimeout(function() {
                done();
            }, 1000);
        });

        it("function should increment value by 1", function(done) {
            const ww = new WW(inc);

            ww.run(1, function(result) {
                expect(result).toBe(2);
                done();
            });
        });

        it("function should allow nested runs", function(done) {
            const ww = new WW(inc);

            ww.run(1, function(result) {
                expect(result).toBe(2);
                ww.run(2, function(result) {
                    expect(result).toBe(3);
                    done();
                });
            });
        });

        it("string function should increment value by 1", function(done) {
            const ww = new WW("function inc(a) { return a + 1;}");

            ww.run(2, function(result) {
                expect(result).toBe(3);
                done();
            });
        });

        it("function which reports progress using x outOf y", function(done) {
            const ww = new WW(function() {
                for (i = 1; i <= 100; ++i)
                    updateProgress(i, 100);
            });

            var progress = 0;
            ww.onProgressChanged = (p) => {
                progress++;
                expect(p).toBeCloseTo(progress);
            };

            ww.run(1, function(result) {
                done();
            });
        });

        it("function which reports direct progress", function(done) {
            const ww = new WW(function() {
                for (i = 1; i <= 100; ++i)
                    updateProgress(i);
            });

            var progress = 0;
            ww.onProgressChanged = (p) => {
                progress++;
                expect(p).toBeCloseTo(progress);
            };

            ww.run(1, function(result) {
                done();
            });
        });
    });

    describe("Running job in disposed worker", function() {
        it("should do nothing when set before running", function(done) {
            const ww = new WW(inc);
            ww.dispose();

            ww.run(1, function(result) {
                done.fail("Function has executed");
            });

            setTimeout(function() {
                expect(true).toBe(true);
                done();
            }, 500);
        });

        it("should do nothing when set while running", function(done) {
            const ww = new WW(inc);

            ww.run(1, function(result) {
                done.fail("Function has executed");
            });
            setTimeout(function() {
                ww.dispose();
            }, 20);

            setTimeout(function() {
                expect(true).toBe(true);
                done();
            }, 500);
        });
    });

    describe("Importing scripts", function() {
        function testLib() {
            return typeof BigInteger !== 'undefined';
        }

        beforeEach(function(done) {
            setTimeout(function() {
                done();
            }, 1000);
        });

        it("should fail when not nothing was imported", function(done) {
            const ww = new WW(testLib);

            ww.run(1, function(result) {
                expect(result).toBe(false);
                done();
            });
        });

        it("should work for absolute paths", function(done) {
            const ww = new WW(testLib);
            ww.import('http://localhost:8888/jsbn.js');

            ww.run(1, function(result) {
                expect(result).toBe(true);
                done();
            });
        });

        it("should work for relative paths", function(done) {
            const ww = new WW(testLib);
            ww.import('jsbn.js');

            ww.run(1, function(result) {
                expect(result).toBe(true);
                done();
            });
        });

        it("should work for relative paths on subdomains", function(done) {
            const ww = new WW(function testLib() {
                return typeof TestSubdomain !== 'undefined';
            });
            ww.testLocation = (new URL('http://localhost:8888/__spec__/')).toString();
            ww.import('helpers/wwHelpers.js');

            ww.run(1, function(result) {
                expect(result).toBe(true);
                done();
            });
        });
    });
});
