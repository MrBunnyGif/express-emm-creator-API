const isOnProd = require('./isOnProd')

let apiUrl

apiUrl = isOnProd ?
	'https://api.mail-generator.promosatelie.com.br'
	:
	'http://localhost:5000';

module.exports = apiUrl