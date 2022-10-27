const apiUrl = require('../constants/apiUrl')

module.exports = currentPath => {
	const path = currentPath
	return `${apiUrl}${path.substring(path.indexOf('/storage'))}`
}