/*
 * Send data from db as a web service
 *
 * Use : http://lame11:3000/getPostCount?from=2015-12-01&to=2016-01-01
 */

var app    = require('../lib/app.js').app;
var config = require("./package.json");
var pg     = require("pg");
var http   = require("http");
var _      = require("underscore");

var confPostgres = "postgres://" + config.postgres.user + ":" + config.postgres.pswd + "@localhost/" + config.postgres.db;

app.configure();

http.createServer(app).listen(config.port, function() {
	console.log("dbReader server listening on port " + config.port);
});


app.get('/getPostCount', function(req, res){

	// get all data from fb_post_basic_count view

	var from = req.query.from;
	var to   = req.query.to;

	if (from == null || to == null)
		res.status(500).send({ error: 'Attention ! Il faut renseigner from et to !' });

	var client = new pg.Client(confPostgres);

	client.connect(function(err) {

		if (err)
			res.status(500).send({ error: 'Could not connect to postgres : ' + err });
	  
	  	client.query('select * from fb_post_basic_count where created_time >= \'' + from + '\' and created_time <= \'' + to + '\'', function(err, dbRes) {
	    	
	    	if (err)
	    		res.status(500).send({ error: 'Error running query : ' + err });

	    	var compressedRes = _.map(dbRes.rows, function(r){
	    		var tmp = {};
	    		tmp.id = r.id;
	    		tmp.created_time = r.created_time;
	    		tmp.counts = r.direct_like_count + "|" + r.direct_comment_count + "|" + r.child_like_count + "|" + r.child_comment_count;
	    		return tmp;
	    	});

	    	res.send({posts : compressedRes});

	    	client.end();
	  	});
	});	
});

