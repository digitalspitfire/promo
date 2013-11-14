var express = require('express');
var app = express()
			.use(express.bodyParser());


app.listen(3000);
console.log('listening in port 3000');

app.get('/ido', function(req, res){
  var body = 'ido maron';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

//Loading static files:
app.use(express.static(__dirname+'/public'));

//dashboard
app.get('/dashboard',function(req,res){
	res.sendfile('public/dashboard.html');
});


//DB deffenitions
var Sq = require('sequelize-mysql').sequelize
var mysql     = require('sequelize-mysql').mysql
var sq = new Sq('promonim', 'root', 'rootpass');

var conf = sq.define('conf',{name:Sq.TEXT,value:Sq.TEXT});
var manager = sq.define('manager',{vendorName:Sq.TEXT, name:Sq.TEXT, email:Sq.TEXT, phoneNumber:Sq.TEXT, user:Sq.TEXT, pass:Sq.TEXT,ivrId:Sq.INTEGER,ivrPhone:Sq.INTEGER,roostConfKey:Sq.TEXT,roostSecretKey:Sq.TEXT});
var campaign = sq.define('campaign',{name:Sq.TEXT, description:Sq.TEXT, hour:Sq.INTEGER, dayOfWeek:Sq.INTEGER, message:Sq.TEXT, link:Sq.TEXT,sound:Sq.TEXT,isRec:Sq.BOOLEAN,isActive:Sq.BOOLEAN, isCanceled:Sq.BOOLEAN});
var node = sq.define('node',{nodeMac:Sq.TEXT});
var filter = sq.define('filter',{name:Sq.TEXT});
var activation = sq.define('activation',{mPhone:Sq.TEXT, deviceMac:Sq.TEXT, nodeMac:Sq.TEXT});
var reg = sq.define('registration',{mPhone:Sq.TEXT, deviceMac:Sq.TEXT, roostDeviceToken:Sq.TEXT});

manager
	.hasMany(campaign)
	.hasMany(node)
	.hasMany(filter)
	.hasMany(activation)
	.hasMany(reg);
campaign.belongsTo(manager);
node.belongsTo(manager);
filter.belongsTo(manager);
activation.belongsTo(manager);
reg.belongsTo(manager);

sq.sync();

//GENERAL FUNCTIONS
function sendError(res,message){
	console.log('Error: '+ message);
	console.log('Error: '+ message);
	res.send('Error: '+ message);
}


//IVR Callbacks listners:
app.get('/ivrcb',function(req,res){
	console.log(req.query);
	var rQ = req.query;
	if(rQ.phone && rQ.dest && rQ.c){
		manager.find({where:{ivrPhone:rQ.dest}}).success(function(m){
			if(m){
				if(m.ivrId!=rQ.c){m.ivrId=rQ.c; m.save();}
				activation.create({mPhone:rQ.phone, managerId:m.id}).success(function(){});//TODO need to learn how to create this directly from the selected manager instance	
			}
		});
	}
	res.send(200, 'ok');
});

//Widget listners + allow cross domain
app.all('/register-by-phone', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    if(rB.mPhone && rB.ivrId){
    	manager.find({where:{ivrId:rB.ivrId}}).success(function(m){
			if(m){
				reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
    				if(r){console.log('already registered'); res.send('already registered');}//do nothing
    				else{
    					reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
    						if(r){
    							r.mPhone = rB.mPhone; 
    							r.save().success(function(){
    								console.log('added phone to existing reg!');
    								res.send('added phone to existing reg!');
    							})
    						}else{
    							reg.create({mPhone:rB.mPhone, managerId: m.id, deviceMac:rB.deviceMac}).success(function(){
    								console.log('new reg created');
    								res.send('new reg created');
    							});
    						}
    					});
					}
    			});
    		}else{console.log('no manager found');res.send('no manager found');}
    	});
	}else{}//no params, do nothing
});
app.all('/store-requested', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    console.log(rB);
    if(rB.mPhone && rB.ivrId){
    	manager.find({where:{ivrId:rB.ivrId}}).success(function(m){
			if(m){
				reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
    				if(r){
    					if(r.roostDeviceToken){
    						//sendNotification
    						console.log('sending notification for welcome back (mp)'); res.send('sending notification for welcome back (mp)');
    					}else{console.log('new cutomer'); res.send('new cutomer');}//do nothing
					}else{console.log('error: reg not found'); res.send('error: reg not found');}
				});
			}else{console.log('error: manager not found'); res.send('error: manager not found');}
		});
    }else if(rB.deviceMac && rB.nodeMac){console.log('device');
    	node.find({where:{nodeMac:rB.nodeMac}}).success(function(n){
    		if(n){
    			manager.find({where:{id:n.managerId}}).success(function(m){ //TODO add manager get by node function
					if(m){
						reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
    						if(r){
								if(r.roostDeviceToken){
									//sendNotification
									console.log('sending notification for welcome back'); res.send('sending notification for welcome back');
								}else{console.log('new cutomer'); res.send('new cutomer');}//do nothing
							}else{sendError(res, 'reg not found');}
						});
					}else{sendError(res, 'manager not found');}
				});		
    		}else{sendError(res, 'node not found');}
    	});
    }else{sendError(res, 'no cookies sent');}
});

//ROOST Callback Lisner:
app.post('/roost-cb',function(req,res){
	var rBt = req.body.tags;
	if(rBt){
		console.log(rBt);
		for(var t in rBt){
			console.log(rBt[t].toString().split('-')[0]);
		}
	}
});

//optional: delete myself from ROOST at first, as I am twice in there....
//finish the roost-cb function
// download roost and send a tag mp-544585295
//check that the widgets are working
//connect to their message=ing system when on returning customer.
//mimic ALL THIs to WIFI
//complete scheduled campaigns



//Temp:
//here I am trying to send a request to roost. just as an excersize
var http = require('http');

var options = {
  host: 'example.com',
  auth
  path: '/foo.html'
};

http.get(options, function(res){
  res.on('data', function(chunk){
    //do something with chunk
  });
}).on("error", function(e){
  console.log("Got error: " + e.message);
});

//DASHBOARD API

//Scheduling

