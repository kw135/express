const Datastore = require('nedb')
const express = require("express")
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');


app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('static'))
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
}));
app.set('view engine', 'hbs');


const coll = new Datastore({
    filename: 'cars.db',
    autoload: true
});


app.get("/", function (req, res) {
    res.render("cars.hbs")
})

app.get("/addCars", function (req, res) {
    res.render("addCar.hbs")
})
app.post("/addCars", function (req, res) {
    const obj = {
        ubezpieczony: req.body.ubezpieczony ? "tak" : "nie",
        benzyna: req.body.benzyna ? "tak" : "nie",
        uszkodzony: req.body.uszkodzony ? "tak" : "nie",
        neped: req.body.neped ? "tak" : "nie",
    }
    coll.insert(obj, function (err, newDoc) {
        console.log("id dokumentu: " + newDoc._id,)
        res.render("addCar.hbs", { id: newDoc._id })
    });
})

app.get("/list", function (req, res) {
    coll.find({}, function (err, docs) {
        res.render("list.hbs", { docs: docs })
    });

})
app.get("/Delete", function (req, res) {
    coll.find({}, function (err, docs) {
        res.render("delete.hbs", { docs: docs })
    });

})

app.get("/Edit", function (req, res) {
    coll.find({}, function (err, docs) {
        res.render("edit.hbs", { docs: docs })
    });

})
app.get("/deleteOne", function(req,res){
    coll.remove({ _id: Object.keys(req.query)[0] }, {}, function (err, numRemoved) {
        coll.find({}, function (err, docs) {
            res.render("delete.hbs", { docs: docs})
        });
    });
})

app.get("/deleteAll", function(req,res){
    coll.remove({}, { multi: true }, function (err, numRemoved) {
        coll.find({}, function (err, docs) {
            res.render("delete.hbs", { docs: docs })
        });
    });
})

app.get("/deleteSelected", function(req,res){
    for (let i = 0; i < Object.keys(req.query).length; i++){
        coll.remove({ _id: Object.keys(req.query)[i] }, {}, function (err, numRemoved) {
            console.log("usunięto dokumentów: ",numRemoved)
        });
    }
    coll.find({}, function (err, docs) {
        res.render("delete.hbs", { docs: docs })
    });
})

app.get("/editOne", function(req, res) {
    coll.find({}, function(err, docs) {
        docs.forEach(doc => {
            if (doc._id == Object.keys(req.query)[0]) {
                doc.edit = true;
            }
        });
        res.render("edit.hbs", { docs: docs });
    });
});

app.get("/updateCar", function(req,res){
    for (let i = 0; i < Object.keys(req.query).length; i++){
        coll.update({ _id: Object.keys(req.query)[4] }, { $set: {ubezpieczony: req.query.ubezpieczony,benzyna: req.query.benzyna,uszkodzony: req.query.uszkodzony,neped: req.query.neped} }, {}, function (err, numUpdated) {
            console.log("zaktualizowano " + numUpdated)
         });
    }
    coll.find({}, function (err, docs) {
        res.render("edit.hbs", { docs: docs })
    });
})

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})