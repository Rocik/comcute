/**
 * Moduł obliczeniowy JavaScript<br/>
 * Implementacja testowania hipotezy Collatza
 * @author Waldemar Korłub, na bazie implementacji PrimeCode.js Adama Polaka
 */

var progress = 0;

/**
 * Funkcja wykonująca obliczenia, jest wywoływana przez JSModuleWrapper
 *
 * @param input dane wejściowe dla problemu
 */
function compute2(input) {

    var dataRange = input.split(" ");

    var start = new BigInteger(dataRange[0]);
    var size = new BigInteger(dataRange[1]);

    progress = 0;
    step = 1 / dataRange[1] * 100;

    if(window.$ !== undefined){
        $('#computing-status').html("Testowanie: [" + start.toString() + ", " + start.add(size).toString() + "]");
    }

    return testRange2(start, start.add(size), step);
}

function testRange2(start, end, step){
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
        $('.progress').css("width", progress + "%");

        currentTime = new Date().getTime();

        if(currentTime - startTime > COMPUTATION_TIME){
            //alert("testRange(new BigInteger(\"" + n + "\"), new BigInteger(\"" + end + "\"))");
            setTimeout("testRange2(new BigInteger(\"" + n + "\"), new BigInteger(\"" + end + "\"), " + step + ")", COMPUTATION_INTERVAL);
            break;
        }
    }

    if (n.compareTo(end) > 0) {
        packageProcessed = true;
    }

    result += potentiallyNonconforming + " ";
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
