const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const ejs = require('ejs')
const cors = require('cors')
const multer = require('multer')
const generator = require('./table-generator')
const fs = require('fs')
const getServerPath = require('./functions/getServerPath')
const apiUrl = require('./constants/apiUrl')

// Start variables and constants
let currentClient, currentSubClient, curentAssetFile, currentCamp, currentTask, taskPath, imagesPath, emmTitle, reqBody, currFileName
const year = new Date().getFullYear()
const PORT = process.env.PORT || 5000
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, imagesPath)
	},
	filename: (req, file, cb) => {
		currFileName = Date.now() + '-' + file.originalname
		cb(null, currFileName)
	}
})
const assetStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(taskPath, 'assets'))
	},
	filename: (req, file, cb) => {
		curentAssetFile = file.originalname
		cb(null, file.originalname)
	}
})
const upload = multer({ storage: storage }).array('files')
const uploadAsset = multer({ storage: assetStorage }).array('asset')

const app = express()
// End variables and constants

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static('public'));

// Start Functions
function newFolder(path) {
	if (!fs.existsSync(path))
		fs.mkdirSync(path)
	return path
}

function checkForYearFolder() {
	const yearFolder = path.join(__dirname, `./public/storage/${year}`)
	if (!fs.existsSync(yearFolder))
		fs.mkdirSync(yearFolder, year);
}

function getRealSelectValue(value, flag) {
	if (value === 'outro')
		return reqBody[flag]
	return value
}
// End Functions

app.use(cors())

// Start Routes
app.get('/', (req, res) => res.send('Versão atual: 0dc84'))

app.post('/', (req, res) => {
	try {
		if (fs.existsSync(imagesPath)) {
			const files = fs.readdirSync(imagesPath);
			files.forEach(file => {
				try {
					fs.rmSync(path.join(imagesPath, file))
				}
				catch (error) {
					res.sendStatus(500).json({ error: 'Erro ao deletar imagens antigas', message:'' })
				}
			})
		}
	}
	catch (error) {
		res.sendStatus(500).json({ error: 'Erro ao subir subir imagens', message:''  })
	}
	// try {
	// 	imagesPath = undefined
	// 	imagesPath = newFolder(path.join(taskPath, 'images'));
	// }
	// catch (error) {
	// 	res.sendStatus(500).json({ error: 'Erro ao recriar pasta de imagens', message:''  })
	// }
	try {
		upload(req, res, (err) => {
			if (err) {
				console.error('entrou em err')
				res.status(500).json({ error: 'Erro ao enviar imagens', message: "Não foi possível enviar as imagens para gerar a tabela HTML" })
				return
			}
			res.send(generator(imagesPath, emmTitle));
		});
	}
	catch (error) {
		res.sendStatus(500).json({ error: 'Erro ao subir subir imagens', message:''  })
	}
})

app.get('/clients', (req, res) => {
	checkForYearFolder()
	const directoryPath = path.join(__dirname, `./public/storage/${year}`)
	if (!directoryPath) {
		res.status(500).json({ error: 'Clientes não encontrados', message: "Não foi possível encontrar a pasta de clientes do ano para os clientes" })
		return
	}
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			res.status(500).json({ error: 'Clientes não encontrados', message: "Não foi possível fazer a listagem de clientes" })
			return
		}
		res.send(files)
	});
});

app.post('/single-file-upload', (req, res) => {
	fs.rmSync(imagesPath, { recursive: true, force: true });
	imagesPath = undefined
	imagesPath = newFolder(path.join(taskPath, 'images'))
	upload(req, res, (err) => {
		if (err) {
			res.status(500).json({ error: 'Erro ao enviar imagens', message: "Não foi possível enviar as imagens para gerar a tabela HTML" })
			return
		}
		res.send(getServerPath(`${imagesPath}/${currFileName}`));
	});
})

app.get('/sub-clients/:client', (req, res) => {
	const directoryPath = path.join(__dirname, `./public/storage/${year}`, req.params.client)
	if (!directoryPath) {
		res.status(500).json({ error: 'Cliente não encontrado', message: "Não foi possível encontrar a pasta do cliente para os subclientes" })
		return
	}
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			res.status(500).json({ error: 'Subclientes do cliente não encontrados', message: "Não foi possível fazer a listagem de subclientes" })
			return
		}
		res.send(files)
	});
})

app.get('/campaigns/:client/:subClient', (req, res) => {
	const directoryPath = path.join(__dirname, `./public/storage/${year}`, req.params.client, req.params.subClient)
	if (!directoryPath) {
		res.status(500).json({ error: 'Subcliente não encontrado', message: "Não foi possível encontrar a pasta do subcliente para as campanhas" })
		return
	}
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			res.status(500).json({ error: 'Campanhas do subcliente não encontradas', message: "Não foi possível fazer a listagem das campanhas" })
			return
		}
		res.send(files)
	});
})

app.post('/newproject', (req, res) => {
	reqBody = req.body
	if (!reqBody) {
		res.status(500).json({ error: 'Dados incompletos', message: "Por favor preencha todos os dados necessários" })
		return
	}
	currentClient = getRealSelectValue(req.body.client, 'customClient')
	currentSubClient = getRealSelectValue(req.body.subClient, 'customSubClient')
	currentCamp = getRealSelectValue(req.body.campaign, 'customCampaign')
	currentProject = req.body.runrunitTask
	currentTask = req.body.runrunitTask
	emmTitle = req.body.emmTitle

	const values = [
		{ name: 'Cliente', value: currentClient },
		{ name: 'Subcliente', value: currentSubClient },
		{ name: 'Campanha', value: currentCamp },
		{ name: 'Projeto', value: currentProject },
		{ name: 'Tarefa', value: currentTask },
		{ name: 'Título do email', value: emmTitle }
	]
	values.forEach(value => {
		if (!value.value) {
			res.status(500).json({ error: `Erro no ${value.name}`, message: "Por favor confira os dados e tente novamente" })
			return
		}
	})

	const yearPath = path.join(__dirname, `./public/storage/${year}`)

	newFolder(path.join(yearPath, currentClient))
	newFolder(path.join(yearPath, currentClient, currentSubClient))
	newFolder(path.join(yearPath, currentClient, currentSubClient, currentCamp))
	const currentTaskPath = path.join(yearPath, currentClient, currentSubClient, currentCamp, currentTask)
	if (!fs.existsSync(currentTaskPath))
		taskPath = newFolder(currentTaskPath)
	else {
		res.status(500).json({ error: 'Tarefa já existe', message: "Tarefa já existente, por favor criar outra", field: "runrunitTask" })
		return
	}
	imagesPath = newFolder(path.join(yearPath, currentClient, currentSubClient, currentCamp, currentTask, 'images'))
	if (!imagesPath) {
		res.status(500).json({ error: `Pasta de imagens não criada`, message: "Não foi possível criar a pasta de imagens, confira os dados ou entre em contato com o suporte" })
		return
	}
	newFolder(path.join(yearPath, currentClient, currentSubClient, currentCamp, currentTask, 'assets'))
	res.send('Projeto criado com sucesso!')

})

app.post('/save-file', (req, res) => {
	const tableHTML = req.body.html
	const template = fs.readFileSync('./templates/emm-template.ejs', 'utf-8');
	const html = ejs.render(template, { emmTitle, tableHTML });
	if (!html) {
		res.status(500).json({ error: `Não foi possível gerar o HTMl da tabela`, message: "Não foi possível criar o html da tabela, por favor entre em contato com o suporte" })
		return
	}

	fs.writeFile(`${taskPath}/index.html`, html, err => {
		if (err) {
			res.status(500).json({ error: `Erro ao salvar tabela`, message: "Não foi possível salvar a tabela no servidor, por favor entre em contato com o suporte" });
			return
		}
	});

	res.send({ fileAdress: getServerPath(taskPath) })
})

app.post('/upload-asset', (req, res) => {
	uploadAsset(req, res, (err) => {
		if (err) {
			res.status(500).json({ error: `Erro ao subir anexo`, message: "Não foi possível anexar o arquivo no servidor, por favor entre em contato com o suporte" })
			return
		}
		res.send(getServerPath(path.join(taskPath, 'assets', curentAssetFile)));
	});
})

app.post('/download-file', (req, res) => {
	const file = __dirname + req.body.path.replace(apiUrl, '/public') + '/index.html'
	if (!file) {
		res.status(500).json({ error: `Erro ao fazer download`, message: "Não foi possível fazer o download do arquivo, por favor tente novamente mais tarde" })
		return
	}
	res.download(file);
})
// End Routes

app.listen(PORT, () => console.log('🖥️', ` Server started on port ${PORT} 🖥️`))
app.use(express.static(path.join(__dirname, "public")))