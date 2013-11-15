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
var reg = sq.define('registration',{mPhone:Sq.TEXT, deviceMac:Sq.TEXT, roostDeviceToken:Sq.TEXT, isRoostActive:Sq.BOOLEAN});
var tM = sq.define('trigerredMessage',{type:Sq.TEXT, text:Sq.TEXT, link:Sq.TEXT, isActive:Sq.BOOLEAN});

manager
	.hasMany(campaign)
	.hasMany(node)
	.hasMany(filter)
	.hasMany(activation)
	.hasMany(reg)
    .hasMany(tM);
campaign.belongsTo(manager);
node.belongsTo(manager);
filter.belongsTo(manager);
activation.belongsTo(manager);
reg.belongsTo(manager);
tM.belongsTo(manager);

sq.sync();

//GENERAL FUNCTIONS
function sendError(res,message){
	console.log('Error: '+ message);
	console.log('Error: '+ message);
	res.send('Error: '+ message);
}

//============= LISNERS ===========//
//Listner to IVR, write to activation + update ivrId with ivrPhone
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

//Listen to widget #1, Register+ create activation if by Wifi   //TODO- add 'register-by-device-mac'
    //by phone
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
    //by wifi
app.all('/register-by-device-mac', function(req, res) {
    console.log(req.body);
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    if(rB.deviceMac && rB.nodeMac){
        node.find({where:{}}).success(function(n){
            if(n){
                manager.find({where:{id:n.managerId}}).success(function(m){
                    if(m){
                        reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
                            if(r){console.log('already registered');}//do nothing
                            else{
                                reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
                                    if(r){
                                        r.deviceMac = rB.deviceMac; 
                                        r.save().success(function(){
                                            console.log('added deviceMac to existing reg!');
                                            res.send('added deviceMac to existing reg!');
                                        });
                                    }else{
                                        reg.create({mPhone:rB.mPhone, managerId: m.id, deviceMac:rB.deviceMac}).success(function(){ //note: adding here all we got from widget #2
                                            console.log('new reg created');
                                            res.send('new reg created');
                                        });
                                    }
                                });
                            }
                        });
                    }else{console.log('no manager found');}
                });
            }else{console.log('no node found');}
        });
    }else{console.log('Error: sent from widget without device & node params !');}//no params, do nothing
});

//Listen to widget #2, Send push notification on second roost download if the registeration isRoostActive: 
app.all('/store-requested', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    console.log(rB);
    if(rB.mPhone && rB.ivrId){ //TODO unify with device MAc
    	manager.find({where:{ivrId:rB.ivrId}}).success(function(m){
			if(m){
				reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
    				if(r){
    					if(r.roostDeviceToken && r.isRoostActive){
    						sendPushNot(r,'roost-reg-welcome-back',m);
                            //setTimeout(function(){sendPushNot(r,'roost-reg-welcome-back',m); console.log('push note sent');},60000);
    						console.log('sending notification for welcome back (mp)');
    					}else{console.log('new cutomer'); res.send('new cutomer');}//do nothing
					}else{console.log('error: reg not found'); res.send('error: reg not found');}
				});
			}else{console.log('error: manager not found'); res.send('error: manager not found');}
		});
    }else if(rB.deviceMac && rB.nodeMac){ //TODO unify with mPhone
        console.log('device');
    	node.find({where:{nodeMac:rB.nodeMac}}).success(function(n){
    		if(n){
    			manager.find({where:{id:n.managerId}}).success(function(m){ //TODO add manager get by node function
					if(m){
						reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
    						if(r){
								if(r.roostDeviceToken && r.isRoostActive){
									setTimeout(function(){sendPushNot(r,'roost-reg-welcome-back',m); console.log('push note sent');},60000);
									console.log('sending notification for welcome back (wifi)');
								}else{console.log('ROOSt will send notification');}//do nothing
							}else{sendError(res, 'reg not found');}
						});
					}else{sendError(res, 'manager not found');}
				});		
    		}else{sendError(res, 'node not found');}
    	});
    }else{sendError(res, 'no cookies sent');}
});

//Listen to ROOST. 1) On reg- Update deviceTokens. 2)On un-reg- send cancelation SMS //TODO - should write it shorter....
app.post('/roost-cb',function(req,res){ //TODO I think I can write this one shorter...
    console.log(req.body);

    var rB = req.body;
    var tagType='';
    var tagValue='';
    //getting the identifier (mPhone OR deviceMac)
    for(var t in rB.tags){
        var tagParts = rB.tags[t].split("-");
        if(tagParts[0]=='mp'){
            tagType = 'mPhone';
            tagValue= tagParts[1];
            console.log('phone is: '+tagParts[1]);
            break;
        }else if(tagParts[0]=='dm'){
            tagType = 'deviceMac';
            tagValue= tagParts[1];
            console.log('device_mac is: '+tagParts[1]);
            break;
        }
    }
    if(tagType && tagValue){
        manager.find({where:{roostConfKey: rB.appKey}}).success(function(m){
            if(m){        
                if(rB.enabled==true){
                    roostReg(rB , tagType, tagValue, m);
                }else if(rB.enabled==false){
                    roostUnReg(rB, tagType, tagValue, m);
                }else{console.log('Error: user enabled is undefined');}
            }else{console.log('Error: manager not found');}
        });
    }else{console.log('Error: user has no identifiers in roost');}
});

function roostReg(rB, tagType, tagValue, m){
    if(tagType=='mPhone'){ //TODO add method of save device token to reg instance
        reg.find({where:{managerId:m.id, mPhone:tagValue}}).success(function(r){
            if(r){
                r.roostDeviceToken = rB.device_token; //note: no need to check if it is returning customer- ROOST will send welcome anyways....
                r.isRoostActive = true;
                r.save().success(function(){console.log('Device token added to registration');});
            }
        });
    }else if(tagType=='deviceMac'){ //TODO can to unify this and mPhone
        reg.find({where:{managerId:m.id, deviceMac:tagValue}}).success(function(r){
            if(r){
                r.roostDeviceToken = rB.device_token; //note: no need to check if it is returning customer- ROOST will send welcome anyways....
                r.isRoostActive = true;
                r.save().success(function(){console.log('Device token added to registration');});
            }
        });
    }    
}

function roostUnReg(rB, tagType, tagValue, m){
    if(tagType=='mPhone'){ //TODO add method of make roost not active to reg instance
        reg.find({where:{managerId:m.id, mPhone:tagValue}}).success(function(r){
            if(r){
                r.isRoostActive = false; 
                r.save().success(function(){console.log('user un registered from ROOST, trying to send SMS');});
                sendSms(r,'roost-cancelation',m);
            }
        });
    }else if(tagType=='deviceMac'){ //TODO add method of make roost not active to reg instance
        reg.find({where:{managerId:m.id, deviceMac:mPhoneTag}}).success(function(r){
            if(r){
                r.isRoostActive = false; 
                r.save().success(function(){console.log('Device token added to registration');});
                sendSms(r,'roost-cancelation',m);
            }
        });
    }
}

//===== FUNCTIONS =====//
//SEND SMS to a spcific reg
function sendSms(reg, type, manager){
    if(reg.managerId && reg.mPhone){
        console.log(reg);
        tM.find({where:{managerId:reg.managerId, type:type}}).success(function(tM){
            if(tM){
                var http = require('http');
                var qs = require('querystring');
                var smsData = qs.stringify({post:2,uid:'2561',un:'promonim',msg:tM.text,list:'05'+reg.mPhone,charset:'utf-8',from:'035555555'});
                var options = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    host: 'www.micropay.co.il',
                    method:'POST',
                    path: '/ExtApi/ScheduleSms.php',
                };
                /*TODO the following came with the http function, need to organuize it in my code*/
                callback = function(response) {
                    var str = '';
                    //another chunk of data has been recieved, so append it to `str`
                    response.on('data', function (chunk) {
                        str += chunk;
                    });
                    //the whole response has been recieved, so we just print it out here
                    response.on('end', function () {
                        console.log(str);
                    });
                }
                /*TODO the following came with the http function----END---*/
                var postReq = http.request(options, callback);
                postReq.write(smsData);
                postReq.end();
            }else{concole.log('Error: no triggered message of this type fot this manager');}
        });
    }else{console.log('SMS not sent since reg has no mPhone (or no managerId)');}
}

//SEND PUSH Notification to a specific reg
function sendPushNot(reg,type,manager){
    if(reg.roostDeviceToken){
        console.log(reg);
        tM.find({where:{managerId:reg.managerId, type:type}}).success(function(tM){ //TODO maybe unify with function sendSms()
            if(tM){
                var https = require('https');
                //var qs = require('querystring'); 
                var data = JSON.stringify({alert:tM.text, url:tM.link,device_tokens:[reg.roostDeviceToken]}); //TODO add sound

                var options = {
                  hostname: 'launch.alertrocket.com',
                  port: 443,
                  path: '/api/push',
                  method: 'POST',
                  auth:manager.roostConfKey+':'+manager.roostSecretKey,
                  //headers: { 'Content-Type': 'application/json','Content-Length': userString.length}
                };

                var req = https.request(options, function(res) {
                  //console.log("statusCode: ", res.statusCode);
                  //console.log("headers: ", res.headers);

                  res.on('data', function(d) {
                    //process.stdout.write(d); //TODO WHAT IS THIS??
                  });
                });
                req.write(data);
                req.end();

                req.on('error', function(e) {
                  console.error('error');
                  console.error(e);
                });
            }else{concole.log('Error: no triggered message of this type fot this manager');}
        });
    }   
}

//optional: delete the unndecessary tags from moshe and me

// download roost and send a tag mp-544585295
//connect to their message=ing system when on returning customer.
//mimic ALL THIs to WIFI
//complete scheduled campaigns










/*EXAMPLE FOT CONTACTING ROOST API*/  /*WORKING*/
/*
var https = require('https');

var options = {
  hostname: 'launch.alertrocket.com',
  port: 443,
  path: '/api/device_tokens',
  method: 'GET',
  auth:'1f24e572334d4575b5d3ae72afd45d8f:25b45e9c29814bba8a6e41dbdd6edee4'
};

var req = https.request(options, function(res) {
  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);

  res.on('data', function(d) {
    console.error('yo yo');
    process.stdout.write(d);
  });
});
req.end();

req.on('error', function(e) {
  console.error('error');
  console.error(e);
});
*/
/*EXAMPLE FOT CONTACTING ROOST API*/  /*WORKING---END*/

/*EXAMPLE FOT CONTACTING ROOST API*/

/*
function sendPushNot(){
    var https = require('https');
    var qs = require('querystring'); 
    var data = JSON.stringify({alert:'MOSHE if you see this SMS me', url:'http://launch.alertrocket.com/demo'});

    var options = {
      hostname: 'launch.alertrocket.com',
      port: 443,
      path: '/api/push',
      method: 'POST',
      auth:'1f24e572334d4575b5d3ae72afd45d8f:25b45e9c29814bba8a6e41dbdd6edee4',
      //headers: { 'Content-Type': 'application/json','Content-Length': userString.length}
    };

    var req = https.request(options, function(res) {
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        console.error('yo yo');
        process.stdout.write(d);
      });
    });
    req.write(data);
    req.end();

    req.on('error', function(e) {
      console.error('error');
      console.error(e);
    });
}
*/