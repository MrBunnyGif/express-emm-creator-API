const fs = require('fs')
const ejs = require('ejs')
const apiUrl = require('./constants/apiUrl')
const getServerPath = require('./functions/getServerPath')

module.exports = (imagesFolderPath, emmTitle) => {
	const fs = require('fs')
	const sizeOf = require('image-size');

	const files = fs.readdirSync(imagesFolderPath);
	let emmRows = []
	let rowWithColumns = []
	let rowWithColumnsDimensions = []
	let largestWidth = sizeOf(`${imagesFolderPath}/${files[0]}`).width;

	function renderTable(rows) {
		const template = fs.readFileSync('./templates/table-template.ejs', 'utf-8');
		const tableHTML = ejs.render(template, { rows: rows.join('') });

		return tableHTML
	}

	function isRowComplete(dimensions) {
		return dimensions.reduce((a, b) => a + b, 0) === largestWidth
	}

	function getEmailSize(files) {
		files.forEach(file => {
			const dimensions = sizeOf(`${imagesFolderPath}/${file}`);
			if (dimensions.width > largestWidth)
				largestWidth = dimensions.width
		})
	}

	function joinImages(files) {
		files.forEach((file, i) => {
			const dimensions = sizeOf(`${imagesFolderPath}/${file}`);
			const tdElement = `<td class="editable"><span class="edit-btn">Editar</span><img style="display: block; border: 0;" align="top" width="${dimensions.width}" height="${dimensions.height}"	src="${getServerPath(imagesFolderPath)}/${file}" alt="${emmTitle}" /></td>`

			if (dimensions.width < largestWidth) {
				rowWithColumnsDimensions.push(dimensions.width)
				rowWithColumns.push(`${tdElement}`)
			}
			if (isRowComplete(rowWithColumnsDimensions)) {
				emmRows.push(
					`<tr><td>${renderTable(rowWithColumns)}</td></tr>`
				)
				rowWithColumns = []
				rowWithColumnsDimensions = []
			}
			else if (dimensions.width >= largestWidth)
				emmRows.push(
					`<tr>${tdElement}</tr>`
				)
		})
	}

	getEmailSize(files)
	joinImages(files)

	return renderTable(emmRows)
}