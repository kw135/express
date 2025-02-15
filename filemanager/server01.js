const express = require("express")
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const formidable = require('formidable');


app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('static'))
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
}));
app.set('view engine', 'hbs');


app.get("/", function (req, res) {
    res.render("upload.hbs")
})
let data = []
app.post("/", function (req, res) {
    let form = formidable({});
    form.uploadDir = __dirname + '/static/upload/'
    form.keepExtensions = true
    form.multiples = true
    form.parse(req, function (err, fields, files) {
        if (!files.file.length) {
            pliki = [files.file]
        } else pliki = files.file

        pliki.forEach(plik => {
            data.push({
                id: data.length === 0 ? 1 : data[data.length - 1].id + 1,
                icon: plik.name.substr(plik.name.length - 3),
                name: plik.name,
                size: plik.size,
                type: plik.type,
                path: plik.path,
                date: plik.lastModifiedDate
            })
        });
        res.redirect("/filemanager")
    })
})

app.get("/filemanager", function (req, res) {
    res.render("filemanager.hbs", { data: data })
})
app.get("/delete/:id", function (req, res) {
    data.forEach(file => {
        if (file["id"] === parseInt(req.params.id)) {
            data.splice(data.indexOf(file), 1)
        }
    })
    res.redirect("/filemanager")
})
app.get("/download/:id", function (req, res) {
    data.forEach(file => {
        if (file["id"] === parseInt(req.params.id)) {
            res.download(file.path)
        }
    })
})
app.get("/show/:id", function (req, res) {
    data.forEach(file => {
        if (file["id"] === parseInt(req.params.id)) {
            res.sendFile(file.path)
        }
    })
})
app.get("/deleteAll", function (req, res) {
    data = []
    res.redirect("/filemanager")
})
let fileInfo = []
app.get("/info/:id", function (req, res) {
    fileInfo = []
    data.forEach(file => {
        if (file["id"] === parseInt(req.params.id)) {
            fileInfo.push(file)
        }
    })
    res.redirect("/info")
})
app.get("/clear", function (req, res) {
    fileInfo = []
    res.redirect("/info")
})
app.get("/info", function (req, res) {
    res.render("info.hbs", { file: fileInfo })
})
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

