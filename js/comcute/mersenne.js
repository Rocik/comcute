/**
 * Moduł obliczeniowy JavaScript<br/>
 * Implementacja poszukiwania liczb pierwszych Mersenne'a
 * @author Waldemar Korłub
 */

window.comcuteMersenneModule = {

	identifier: "mersenne",

    parallelTaskJobs: true,

    getStatus: function(dataObject, lang) {
		const exponent = parseInt(dataObject);
		
		return {
			description: lang === "pl"
				? "Poszukiwanie liczb pierwszych Mersenne'a. Testowanie: "
				: "Searching Mersenne prime numbers. Testing: ",
			taskStatus: "M(" + exponent + ")"
		};
    },

    task: function(dataObject) {
		/**
		 * Test Lucas–Lehmera sprawdzający, czy liczba postaci 2^exponent - 1
		 * jest liczbą pierwszą.
		 */
		function isMersennePrime(exponent) {
			const zero = new BigInteger("0");
			const one = new BigInteger("1");
			const two = new BigInteger("2");
			
			let n = two.pow(exponent)
				.subtract(one);
			
			let s = new BigInteger("4");
			
			// Numer wyrazu, który jest resztą Lucas–Lehmera
			const residueOrdinal = exponent - 2;
			setProgressGoal(residueOrdinal);

			for (let i = 0; i < residueOrdinal; i++) {
				s = s.multiply(s)
					.subtract(two)
					.mod(n);

				if (i % 10 == 0) {
					updateProgress(i + 1);
				}
			}

			updateProgress(residueOrdinal);
			return s.equals(zero);
		}

		const exponent = parseInt(dataObject);
		if (isMersennePrime(exponent)) {
			return dataObject;
		}

		return "";
    }
}
