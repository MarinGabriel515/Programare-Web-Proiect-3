const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session=require('express-session');
const bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/ArticoleDB";
const fs = require('fs');
const app = express();
app.use(cookieParser())
const port = 6789;
var VectorObiecteArticol=[];


app.set('view engine', 'ejs');

app.use(expressLayouts);

app.use(express.static('public'))

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
	maxAge: 1000000
	}
	}));

fs.readFile('Articole.json','utf8', function (err, data) {
	if (err) throw err;
	VectorObiecteArticol = JSON.parse(data);
	//console.log(VectorObiecteArticol);
  });

app.get('/', (req, res) => {
	MongoClient.connect(url,function(err,db)
		{
			if (err) throw err;
			dbo = db.db("ArticoleDB");
			dbo.listCollections().toArray(function(err, items){
				if (err) throw err;
				if(items.length==0)
				{
				console.log("Nu am gasit nici o colectie")}
			});
		});
});

app.post('/PosteazaArticol',(req,res)=>
{

	res.render('AdminEditare',{Mod:"Postare"});

});

app.post('/StergeArticol',(req,res)=>
{
MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("ArticoleDB");
	dbo.collection("Articole").deleteOne({Nume:req.body.ArticolSters}, function(err, result) {	
	  if (err) throw err;
	  res.redirect('/MainPage');
	  db.close();
	});
  });
});

app.post('/EditeazaArticol',(req,res)=>
{
	console.log(req.body);
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("ArticoleDB");
		dbo.collection("Articole").findOne({Nume:req.body.ArticolEditat}, function(err, result) {
			//console.log(result.Continut+"<-----------------------------");
		  if (err) throw err;
		  res.render('AdminEditare',{Mod:"Editare",Articol:result});
		  db.close();
		});
	  });
});

app.post('/EditArticol',(req,res)=>
{
var DataPostare = new Date();
	DataPostare=DataPostare.toISOString().slice(0,10);
	var Articol={Nume:req.body.NumeArticol,Continut:req.body.ContinutArticol,Data:DataPostare};
	
	MongoClient.connect(url,function(err,db)
		{
			if (err) throw err;
			dbo = db.db("ArticoleDB");
			dbo.collection("Articole").findOne({Nume:req.body.NumeArticolVechi}, function(err, result) {
				if (err) throw err;
			dbo.collection("Articole").replaceOne(result,Articol);
			db.close();
			});
		});
res.redirect('/MainPage');
});

app.post('/PostArticol',(req,res)=>
{
	
console.log(req.body);

var DataPostare = new Date();
	DataPostare=DataPostare.toISOString().slice(0,10);

var Articol={Nume:req.body.NumeArticol,Continut:req.body.ContinutArticol,Data:DataPostare};

MongoClient.connect(url,function(err,db)
		{
			if (err) throw err;
			dbo = db.db("ArticoleDB");
			dbo.collection("Articole").insertOne(Articol);
		});
res.redirect('/MainPage');
});

app.post('/Articol', (req, res) => {
	//console.log(req.body);
	MongoClient.connect(url,function(err,db)
		{
			if (err) throw err;
			var dbo = db.db("ArticoleDB");
			var cursor=dbo.collection('Articole').find().toArray(function(err,rez)
			{
				rez.forEach(elementRez=>
					{
						if(elementRez.Nume==req.body.ArticolSelectat)
					{
					
						res.render('Articol',{Articol:elementRez});
						return;
					}
					});
			});
		});	
});

app.get('/Admin',(req,res)=>{
res.render('AdminAutentificare');
});

app.post('/AutentificareAdmin',(req,res)=>{	
console.log(req.body);
/*
if(req.body.IdAdmin=='Kratos')
{
	console.log("Ok IdAdmin");
}
else{
	console.log("Nok IdAdmin");
}

if(req.body.ParolaAdmin=='123')
{
	console.log("Ok ParolaAdmin");
}
else{
	console.log("Nok ParolaAdmin");
}
*/
if(req.body.IdAdmin=='Kratos' && req.body.ParolaAdmin =='123')
{
	//console.log("OK");
	res.cookie("Admin",req.body.IdAdmin,{ expires: new Date(Date.now() + 900000)});
	res.redirect('/MainPage');
	res.end();
}
else
{
	//console.log("NOK");
	res.cookie("mesajEroare","Credentiale incorecte",{ expires: new Date(Date.now() + 1000)});
	res.redirect("/Admin");
	res.end();
}

});

app.get('/MainPage',(req,res)=>
{
	/*
	if(!req.cookies.Admin)
	{
		console.log("Fara cookie Admin");
	}
	else{
		console.log("Cu cookie Admin");
	}*/

	MongoClient.connect(url,function(err,db)
	{
		if (err) throw err;
		dbo = db.db("ArticoleDB");
		dbo.listCollections().toArray(function(err, items){
			if (err) throw err;
			if(items.length==0)
			{
			console.log("Nu am gasit nici o colectie")
			if(!req.cookies.Admin)
				{
					res.render('MainPage',{Admin:null,Articole:null});
				}
				else
				{
					res.render('MainPage',{Admin:req.cookies.Admin,Articole:null});
				}
			}
			else
			{
			var cursor=dbo.collection('Articole').find().toArray(function(err,rez)
			{
				//console.log(rez);
				if(err) throw err;
				if(!req.cookies.Admin)
				{
					res.render('MainPage',{Admin:null,Articole:rez});
				}
				else
				{
					res.render('MainPage',{Admin:req.cookies.Admin,Articole:rez});
				}
			});
			}
		  }); 
	});
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));