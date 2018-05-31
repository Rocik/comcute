/**
 * Moduł obliczeniowy JavaScript
 * Implementacja testowania hipotezy Collatza
 * @author Waldemar Korłub, na bazie implementacji PrimeCode.js Adama Polaka
 */

function comcuteGetStatus(input, lang) {
     var dataRange = input.split(" ");
     var start = new BigInteger(dataRange[0]);
     var size = new BigInteger(dataRange[1]);

     if (lang === "pl")
        return {
            prelude: "Hipoteza Collatza. Testowanie: ",
            description: start.toString() + " ~ " + start.add(size).toString()
        };
     else
        return {
            prelude: "Collatz hypothesis. Testing: ",
            description: start.toString() + " ~ " + start.add(size).toString()
        };
 }

function collatzIntervals(dataObject) {
    var progress = 0;

    function compute(input) {
        var dataRange = input.split(" ");

        var start = new BigInteger(dataRange[0]);
        var size = new BigInteger(dataRange[1]);

        progress = 0;
        step = 1 / dataRange[1] * 100;

        return testRange(start, start.add(size), step);
    }

    function testRange(start, end, step){
        one = new BigInteger("1");
        potentiallyNonconforming = "";

        n = start;
        startTime = new Date().getTime();

        while (n.compareTo(end) <= 0) {

            if (!conformsCollatzConjecture(n)) {
                potentiallyNonconforming += n + " ";
            }
            n = n.add(one);

            progress += step;
            updateProgress(progress);
        }

        if (n.compareTo(end) > 0) {
            packageProcessed = true;
        }

        return potentiallyNonconforming;
    }


    function conformsCollatzConjecture(n) {
        zero = new BigInteger("0");
        one = new BigInteger("1");
        two = new BigInteger("2");
        three = new BigInteger("3");
        three_thousand = new BigInteger("3000");

        loopCnt = new BigInteger("0");

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
