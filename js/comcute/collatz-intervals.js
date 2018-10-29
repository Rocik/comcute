/**
 * Moduł obliczeniowy JavaScript
 * Implementacja testowania hipotezy Collatza
 * @author Waldemar Korłub, na bazie implementacji PrimeCode.js Adama Polaka
 */

window.comcuteCollatzModule = {

    identifier: "collatz",

    parallelTaskJobs: true,

    getStatus: function(input, lang) {
        var dataRange = input.split(" ");
        var start = new BigInteger(dataRange[0]);
        var size = new BigInteger(dataRange[1]);

        if (lang === "pl") {
            return {
                description: "Hipoteza Collatza. Testowanie: ",
                taskStatus: start.toString() + " ~ " + start.add(size).toString()
            };
        } else {
            return {
                description: "Collatz hypothesis. Testing: ",
                taskStatus: start.toString() + " ~ " + start.add(size).toString()
            };
        }
    },

    task: function(dataObject) {
        let progress = 0;

        function compute(input) {
            var dataRange = input.split(" ");

            var start = new BigInteger(dataRange[0]);
            var size = new BigInteger(dataRange[1]);

            progress = 0;
            const step = 1 / dataRange[1] * 100;

            return testRange(start, start.add(size), step);
        }

        function testRange(start, end, step) {
            const one = new BigInteger("1");
            let potentiallyNonconforming = "";

            let n = start;

            while (n.compareTo(end) <= 0) {

                if (!conformsCollatzConjecture(n)) {
                    potentiallyNonconforming += n + " ";
                }
                n = n.add(one);

                progress += step;
                updateProgress(progress);
            }

            return potentiallyNonconforming;
        }


        function conformsCollatzConjecture(n) {
            const zero = new BigInteger("0");
            const one = new BigInteger("1");
            const two = new BigInteger("2");
            const three = new BigInteger("3");
            const three_thousand = new BigInteger("3000");

            let loopCnt = new BigInteger("0");

            while (!n.equals(one)) {
                loopCnt = loopCnt.add(one);

                if (n.mod(two).equals(zero)) {
                    n = n.divide(two);
                } else {
                    n = n.multiply(three).add(one);
                }

                if (loopCnt.compareTo(three_thousand) > 0) {
                    return false;
                }
            }

            return true;
        }

        return compute(dataObject);
    }
};
