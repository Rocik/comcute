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
                expect(ww.getUsedWorkers()).toBe(0);
                ww.run(2, function(result) {
                    expect(result).toBe(3);
                    done();
                });
                expect(ww.getUsedWorkers()).toBe(1);
            });
            expect(ww.getUsedWorkers()).toBe(1);
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

            let progress = 0;
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

            ww.run(1, function() { done(); });
        });
    });

    describe("Allows running job in disposed worker", function() {
        it("should do nothing when set before running", function(done) {
            const ww = new WW(inc);
            ww.dispose();

            ww.run(1, function() {
                done.fail("Function has executed");
            });

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

        it("should work for multiple workers", function(done) {
            const ww = new WW(testLib);
            ww.import('jsbn.js');

            let counter = 0;

            ww.run(1, function(result) {
                expect(result).toBe(true);
                counter++;
                if (counter == 2)
                    done();
            });

            ww.run(1, function(result) {
                expect(result).toBe(true);
                counter++;
                if (counter == 2)
                    done();
            });
        });
    });

    describe("Allows running multiple jobs", function() {
        beforeEach(function(done) {
            setTimeout(function() {
                done();
            }, 1000);
        });

        it("can be queued on a single worker", function(done) {
            const ww = new WW(inc);
            ww.setWorkersAmount(1);

            ww.run(1, function(result) {
                expect(result).toBe(2);
            });

            ww.run(3, function(result) {
                expect(result).toBe(4);
                done();
            });

            expect(ww.getUsedWorkers()).toBe(1);
        });

        it("can be queued on a multiple workers", function(done) {
            const ww = new WW(inc);
            ww.setWorkersAmount(2);

            let job1Done, job2Done;

            ww.run(1, function(result) {
                job1Done = true;
                expect(result).toBe(2);
            });

            expect(ww.getFreeWorkers()).toBe(1);

            ww.run(3, function(result) {
                job2Done = true;
                expect(result).toBe(4);
            });

            ww.run(5, function(result) {
                expect(job1Done || job2Done).toBe(true);
                expect(result).toBe(6);
            });

            ww.run(7, function(result) {
                expect(job1Done).toBe(true);
                expect(job2Done).toBe(true);
                expect(result).toBe(8);
                done();
            });

            expect(ww.getFreeWorkers()).toBe(0);
            expect(ww.getUsedWorkers()).toBe(2);
        });

        it("all at once and just once", function(done) {
            const ww = new WW(inc);
            ww.setWorkersAmount(3);
            let results = 0;

            ww.run(1, function(result) {
                expect(result).toBe(2);
                results++;
                if (results === 3)
                    done();
            });

            ww.run(3, function(result) {
                expect(result).toBe(4);
                results++;
                if (results === 3)
                    done();
            });

            ww.run(5, function(result) {
                expect(result).toBe(6);
                results++;
                if (results === 3)
                    done();
            });

            expect(ww.getUsedWorkers()).toBe(3);
        });

        it("does not allow to alter set workers amount while any is running", function(done) {
            const ww = new WW(inc);
            ww.setWorkersAmount(2);

            ww.run(1, function() { });

            expect(function(){
                ww.setWorkersAmount(1);
            }).toThrow();
            done();
        });

        it("progress is aggregated", function(done) {
            const ww = new WW(function() {
                for (i = 1; i <= 100; ++i)
                    updateProgress(i);
            });
            ww.setWorkersAmount(2);

            var progress = 0;
            ww.onProgressChanged = (p) => {
                progress++;
                expect(p).toBeCloseTo(progress / 2);
            };

            ww.run(1, function() { done(); });
            ww.run(2, function() { done(); });
        });
    });

    describe("Allows returning results via", function() {
        beforeEach(function(done) {
            setTimeout(function() {
                done();
            }, 1000);
        });

        it("callback", function(done) {
            const ww = new WW(inc);

            const returnedValue = ww.run(1, function(result) {
                expect(result).toBe(2);
                done();
            });

            expect(returnedValue).toBeUndefined();
        });

        it("promise object when callback not passed", function(done) {
            const ww = new WW(inc);

            ww.run(1)
            .then(function(result) {
                expect(result).toBe(2);
                done();
            });
        });
    });
});
