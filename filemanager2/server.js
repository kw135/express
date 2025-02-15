const express = require("express")
const app = express()
const PORT = 3000;
const fs = require("fs")
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
let data = []
//main page
app.get("/", function (req, res) {
    const uploadPath = path.join(__dirname, "static/upload")
    data = []
    fs.readdir(uploadPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            const filePath = path.join(uploadPath, file);
            fs.lstat(filePath, (err, stats) => {
                stats.isDirectory() ? data.push({
                    name: file,
                    ext: "dir",
                    dir: true
                }) : data.push({
                    name: file,
                    ext: file.substring(file.indexOf(".") + 1, file.length),
                    file: true
                })
            })
        })
        res.render("filemanager2.hbs", { data: data })
    })
})
//upload plikow na serwer
app.post("/handleUpload", function (req, res) {
    let form = formidable({});
    form.uploadDir = __dirname + '/static/upload/'
    form.keepExtensions = true
    form.multiples = true
    form.parse(req, function (err, fields, files) {
        res.redirect("/")
    });
})
//utworzenie nowego pliku przez przegladarke
app.get("/newFile", function (req, res) {
    if (fs.existsSync(path.join(__dirname, "static/upload/" + req.query.file + ".txt"))) {
        const filepath1 = path.join(__dirname, "static/upload/", "kopia_" + req.query.file + ".txt")
        fs.writeFile(filepath1, "", (err) => {
            if (err) throw err
            res.redirect("/")
        })
    } else {
        console.log(path.join(__dirname, "static/upload" + req.query.file + ".txt"))
        const filepath2 = path.join(__dirname, "static/upload/", req.query.file + ".txt")
        fs.writeFile(filepath2, "", (err) => {
            if (err) throw err
            res.redirect("/")
        })
    }
})
//utworzenie nowego folderu przez przegladarke
app.get("/newFolder", function (req, res) {
    if (!fs.existsSync(path.join(__dirname, "static/upload/" + req.query.folder))) {
        fs.mkdir(path.join(__dirname, "static/upload/" + req.query.folder), (err) => {
            if (err) throw err
            res.redirect("/")
        })
    } else {
        fs.mkdir(path.join(__dirname, "static/upload/kopia_" + req.query.folder), (err) => {
            if (err) throw err
            res.redirect("/")
        })
    }
})
//usuwanie plikow
app.get("/usun/:name", function (req, res) {
    const uploadPath = path.join(__dirname, "static/upload")
    fs.readdir(uploadPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            if (file === req.params.name) {
                const filePath = path.join(__dirname, "static/upload/" + req.params.name)
                fs.lstat(filePath, (err, stats) => {
                    if (stats.isDirectory()) {
                        fs.rmdir(filePath, (err) => {
                            if (err) throw err
                        })
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) throw err
                        })
                    }
                })
            }
        })
        res.redirect("/")
    })
})
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})