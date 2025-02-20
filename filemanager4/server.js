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
app.use(express.json());
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
const extensions = ["js", "txt", "css", "html", "json"]
const templates = {
    js: "<script>\r\tconsole.log('witam')\r</script>",
    css: "body {\r\tbackground-color: 'red'\r}",
    html: "<html>\r\t<head>\r\t\t<title>Strona główna</title>\r\t</head>\r\t<body>\r\t\t<h1>Witamy na stronie głównej!</h1>\r\t</body>\r</html>",
    json: "{\r\tname: 'John Doe',\r\tage: 30\r}",
    txt: "Przykładowy tekst\rtekst 2"
}
let font = 16
let usedTheme = "theme1"
app.get("/filemanager", function (req, res) {
    let showRenameButton = false
    //tworzenie sciezki folderow
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
    currentPath = path.join(__dirname, "static/", path1)
    fs.readdir(currentPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            const filePath = path.join(currentPath, file);
            fs.lstat(filePath, (err, stats) => {
                const splittedName = file.split(".");
                const ext = splittedName[splittedName.length - 1];
                const show = extensions.includes(ext)
                let name = file.length > 10 ? (file.substring(0, 9) + "...") : file
                stats.isDirectory() ? data.push({
                    fullname: file,
                    name: name,
                    ext: "dir",
                    dir: true,
                    path: pathInfo.length > 1 ? pathInfo[pathInfo.length - 1].path : "",
                }) : data.push({
                    fullname: file,
                    name: name,
                    ext: ext,
                    file: true,
                    path: pathInfo.length > 1 ? pathInfo[pathInfo.length - 1].path : "",
                    show: show
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
    let text = ''
    switch (req.query.ext) {
        case ".js":
            text = templates.js
            break;
        case ".css":
            text = templates.css
            break;
        case ".html":
            text = templates.html
            break;
        case ".json":
            text = templates.json
            break;
        case ".txt":
            text = templates.txt
            break;
        default:
            break
    }
    if (fs.existsSync(path.join(currentPath, req.query.file + req.query.ext))) {
        const filepath1 = path.join(currentPath, "kopia_" + req.query.file + req.query.ext)
        fs.writeFile(filepath1, text, (err) => {
            if (err) throw err
            res.redirect("/filemanager?path=" + shortPath)
        })
    } else {
        const filepath2 = path.join(currentPath, req.query.file + req.query.ext)
        fs.writeFile(filepath2, text, (err) => {
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
    fs.readdir(currentPath, (err, files) => {
        if (err) throw err
        files.forEach((file) => {
            if (file === req.params.name) {
                const filePath = path.join(currentPath, "/" + req.params.name)
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
//zmiana nazwy plikow
app.get("/rename", function (req, res) {
    const splittedRoot = req.query.name.split("/");
    let newName = req.query.newName;
    if (req.query.ext) {
        newName = `${req.query.newName}${req.query.ext}`
    }
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
                if (req.query.ext) {
                    res.redirect("/showFile?name=" + oldRoot + "/" + newName);
                } else
                    res.redirect("/filemanager?path=" + oldRoot + "/" + newName);
            }
        })
    }
    else {
        res.redirect("/filemanager?path=" + shortPath);
    }
})
//otwieranie plików w nowej karcie
app.get("/displayFile", function (req, res) {
    res.sendFile(path.join(__dirname, "static/upload", req.query.path))
})
//edycja i wyswietlanie pliku
app.get("/showFile", function (req, res) {
    let showFileData = {
        filename: req.query.name,
        filedata: "",
        theme: usedTheme,
        font: font
    };
    const filePath = path.join(__dirname, "static/upload", req.query.name)
    fs.readFile(filePath, (err, data) => {
        if (err) throw err
        showFileData.filedata = data.toString();
        res.render("showFile.hbs", { showFileData: showFileData })
    })
})
//zapis pliku
app.post("/saveFile", function (req, res) {
    const filepath = path.join(__dirname, "static/upload", "/", req.body.filename)
    fs.writeFile(filepath, req.body.mainText, (err) => {
        if (err) throw err
        res.redirect("/filemanager?path=" + shortPath);
    })
})
//zapisanie konfiguracji
app.post("/saveConfig", function (req, res) {
    usedTheme = req.body.color
    font = req.body.font
    res.redirect("/show?path=" + req.body.ext);
})
//zmiana style fetchem bez zapisu na serwerze
app.post("/changeTheme", function (req, res) {
    console.log(req.body)
    res.send(JSON.stringify({ theme: req.body.colors, font: req.body.font }));  
})
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})