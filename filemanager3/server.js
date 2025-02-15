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
//redirect na /filemanager
app.get("/", function (req, res) {
    res.redirect("/filemanager")
})
//main page
let currentPath = path.join(__dirname, 'upload');
let shortPath = ''
app.get("/filemanager", function (req, res) {
    let showRenameButton = false
    //tworzenie sciezki pliku
    const path1 = req.query.path === "home" || req.query.path === undefined ? "upload" : "upload" + req.query.path
    shortPath = req.query.path === "home" || req.query.path === undefined ? "" : req.query.path
    const pathInfo = [{ name: "home", path: "" }];
    if (path1.includes("/")) {
        const splittedPath = path1.split("/");
        for (let i = 1; i < splittedPath.length; i++) {
            if (splittedPath[i] != "") {
                let pathToContext = "";
                for (let j = 1; j < i; j++) {
                    pathToContext += "/" + splittedPath[j];
                }
                pathInfo.push({
                    name: splittedPath[i],
                    path: pathToContext + "/" + splittedPath[i],
                });
            }
        }
    }
    let lastFile = [{ path: pathInfo[pathInfo.length - 1].path }]
    pathInfo.length > 1 ? showRenameButton = true : null
    data = []
    currentPath = path.join(__dirname, "static/", path1,)

    fs.readdir(currentPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            const filePath = path.join(currentPath, file);
            fs.lstat(filePath, (err, stats) => {
                let name = file.length > 10 ? (file.substring(0, 9) + "...") : file
                stats.isDirectory() ? data.push({
                    name: name,
                    ext: "dir",
                    dir: true,
                    path: pathInfo.length > 1 ? pathInfo[pathInfo.length - 1].path : "",
                }) : data.push({
                    name: name,
                    ext: file.substring(file.indexOf(".") + 1, file.length),
                    file: true,
                })
            })
        })
        res.render("filemanager2.hbs", { data: data, pathInfo: pathInfo, visible: showRenameButton, lastFile: lastFile })
    })
})


//upload plikow na serwer
app.post("/handleUpload", function (req, res) {
    let form = formidable({});
    form.uploadDir = currentPath
    form.keepExtensions = true
    form.multiples = true
    form.parse(req, function (err, fields, files) {
        res.redirect("/filemanager?path=" + shortPath)
    });
})
//utworzenie nowego pliku przez przegladarke
app.get("/newFile", function (req, res) {
    if (fs.existsSync(path.join(currentPath + req.query.file + ".txt"))) {
        const filepath1 = path.join(currentPath, "kopia_" + req.query.file + ".txt")
        fs.writeFile(filepath1, "", (err) => {
            if (err) throw err
            res.redirect("/filemanager?path=" + shortPath)
        })
    } else {
        console.log(path.join(currentPath + req.query.file + ".txt"))
        const filepath2 = path.join(currentPath, req.query.file + ".txt")
        fs.writeFile(filepath2, "", (err) => {
            if (err) throw err
            res.redirect("/filemanager?path=" + shortPath)
        })
    }
})
//utworzenie nowego folderu przez przegladarke
app.get("/newFolder", function (req, res) {
    if (!fs.existsSync(path.join(currentPath + req.query.folder))) {
        fs.mkdir(path.join(currentPath + "/" + req.query.folder), (err) => {
            if (err) throw err
            res.redirect("/filemanager?path=" + shortPath)
        })
    } else {
        fs.mkdir(path.join(currentPath + "/kopia_" + req.query.folder), (err) => {
            if (err) throw err
            res.redirect("/filemanager?path=" + shortPath)
        })
    }
})
//usuwanie plikow
app.get("/usun/:name", function (req, res) {
    const uploadPath = path.join(currentPath)
    fs.readdir(uploadPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            if (file === req.params.name) {
                const filePath = path.join(currentPath + "/" + req.params.name)
                console.log(filePath)
                fs.lstat(filePath, (err, stats) => {
                    if (stats.isDirectory()) {
                        fs.rm(filePath, { recursive: true }, (err) => {
                            if (err) throw err
                            res.redirect("/filemanager?path=" + shortPath)
                        })
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) throw err
                            res.redirect("/filemanager?path=" + shortPath)
                        })
                    }
                })
            }
        })
    })
})
//zmiana nazwy folderu
app.get("/rename", function (req, res) {
    const splittedRoot = req.query.name.split("/");
    const newName = req.query.newName;
    let oldRoot = "";
    for (let i = 1; i < splittedRoot.length - 1; i++) {
        oldRoot += "/" + splittedRoot[i];
    }
    const newPath = path.join(__dirname, "static/upload", oldRoot, newName);
    const oldPath = path.join(__dirname, "static/upload", req.query.name);
    if (!fs.existsSync(newPath)) {
        fs.rename(oldPath, newPath, (err) => {
            if (err) console.log(err);
            else {
                console.log("/filemanager?path=" + oldRoot + "/" + newName)
                res.redirect("/filemanager?path=" + oldRoot + "/" + newName);
            }
        })
    }
    else {
        res.redirect("/filemanager?path=" + shortPath);
    }
})
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})