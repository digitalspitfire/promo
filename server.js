var express = require('express');
var app = express()
                    .use(express.bodyParser());
var fs = require('fs');
var csv = require("fast-csv");

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
//UplodedFile
app.get('/uploaded',function(req,res){
    res.sendfile('public/uploaded.html');
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
var uD = sq.define('usersData',{mPhone:Sq.TEXT, filterName:Sq.TEXT, value:Sq.TEXT});

manager
	.hasMany(campaign)
	.hasMany(node)
	.hasMany(filter)
	.hasMany(activation)
	.hasMany(reg)
    .hasMany(tM)
    .hasMany(uD);
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
function log(message){console.log('>>> '+message);}

//============= LISNERS ===========//
//Listner to IVR, write to activation + update ivrId with ivrPhone
app.get('/ivrcb',function(req,res){
	if(req.query.dest=='0722280630'){ //TODO - remove this
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
	}else{console.log('Error: sent from widget without mPhone & ivrId !');res.send('Error: sent from widget without mPhone & ivrId !');}
});
    //by wifi (here also create activation)
app.all('/register-by-device-mac', function(req, res) {
    console.log(req.body);
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    if(rB.deviceMac && rB.nodeMac){
        activation.create({deviceMac:rB.deviceMac, nodeMac:rB.nodeMac}).success(function(){});
        node.find({where:{}}).success(function(n){
            if(n){
                manager.find({where:{id:n.managerId}}).success(function(m){
                    if(m){
                        reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
                            if(r){console.log('already registered');res.send('already registered');}//do nothing
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
    }else{console.log('Error: sent from widget without device & node params !');res.send('Error: sent from widget without device & node params !');}//no params, do nothing
});

//Listen to widget #2, Send push notification on second roost download if the registeration isRoostActive: 
app.all('/store-requested', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "X-Requested-With");  //TODO make it specific here?
    var rB = req.body;
    console.log(rB);
    console.log(rB.mPhone);
    console.log(rB.ivrId);
    if(rB.mPhone!='null' && rB.ivrId!='null'){ //TODO unify with device MAc
        console.log('store requested with mPhone');
        manager.find({where:{ivrId:rB.ivrId}}).success(function(m){
			if(m){
				reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
    				if(r){
    					if(r.roostDeviceToken && r.isRoostActive){
                            setTimeout(function(){sendPushNot(r,'roost-reg-welcome-back',m); console.log('push note sent');},180000);
    						console.log('sending notification for welcome back (mp)');
    					}else{console.log('new cutomer'); res.send('new cutomer');}//do nothing
					}else{console.log('error: reg not found'); res.send('error: reg not found');}
				});
			}else{console.log('error: manager not found'); res.send('error: manager not found');}
		});
    }else if(rB.deviceMac!='null' && rB.nodeMac!='null'){ //TODO unify with mPhone
        console.log('device');
    	node.find({where:{nodeMac:rB.nodeMac}}).success(function(n){
    		if(n){
    			manager.find({where:{id:n.managerId}}).success(function(m){ //TODO add manager get by node function
					if(m){
						reg.find({where:{deviceMac:rB.deviceMac, managerId: m.id}}).success(function(r){
    						if(r){
								if(r.roostDeviceToken && r.isRoostActive){
									setTimeout(function(){sendPushNot(r,'roost-reg-welcome-back',m); console.log('push note sent');},180000);
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
app.all('/roost-cb',function(req,res){ //TODO I think I can write this one shorter...
    console.log(req.body);
    var rB = req.body;
    var mPhoneTag='';
    var deviceMacTag='';
    //getting the identifier (mPhone OR deviceMac)
    for(var t in rB.tags){
        var tagParts = rB.tags[t].split("-");
        if(tagParts[0]=='mp'){
            if(tagParts[1] && tagParts[1]!='null'){
                mPhoneTag = tagParts[1];
                log('mPhone tag found: '+tagParts[1]);
            }
        }else if(tagParts[0]=='dm'){
            if(tagParts[1] && tagParts[1]!='null'){
                deviceMacTag = tagParts[1];
                log('deviceMac tag found: '+tagParts[1]);    
            }
        }
    }
    if(mPhoneTag || deviceMacTag){
        manager.find({where:{roostConfKey: rB.appKey}}).success(function(m){
            if(m){        
                if(rB.enabled==true){
                    roostReg(rB , mPhoneTag, deviceMacTag, m);
                }else if(rB.enabled==false){
                    roostUnReg(rB, mPhoneTag, deviceMacTag, m);
                }else{log('Error: user enabled is undefined');}
            }else{log('Error: manager not found');}
        });
    }else{log('Error: user has no identifiers in roost');}
});
    //function roostReg
function roostReg(rB, mPhoneTag, deviceMacTag, m){
    log('Roost reg...')
    //NOTE: we assume we have only one reg with roostDeviceToken per managetId:
    if(mPhoneTag=='null'){mPhoneTag='';}
    if(deviceMacTag=='null'){deviceMacTag='';}
    reg.find({where:{managerId:m.id, roostDeviceToken:rB.device_token}}).success(function(eR){
        if(eR){
            if(mPhoneTag){eR.mPhone=mPhoneTag; log('cb sent mPhoneTag');}
            if(deviceMacTag){eR.deviceMac=deviceMacTag; log('cb sent deviceMacTag');}
            eR.isRoostActive=true; 
            eR.save().success(function(){
                log('registeration is now active with and with all the identifiers that were sent');
                //NOTE: We assume we do not need to delete unnecessary regs if we got to this stage...
            });
        }else{
            log('no reg has this roostDeviceToken')
            log('m.id: '+ m.id);
            log('mPhoneTag: '+mPhoneTag);
            log('deviceMacTag: '+deviceMacTag);
            reg.find({where:{managerId: m.id, mPhone: mPhoneTag}}).success(function(rMP){ //rMP = registration with mPhone
                if(rMP){
                    if(deviceMacTag){rMP.deviceMac=deviceMacTag; log('deviceMac was overwritten');}
                    rMP.roostDeviceToken=rB.device_token;
                    rMP.save().success(function(){
                        log('added deviceToken to mPhone regisreration');
                        //Deleting un-necessary deviceMac reg
                        if(deviceMacTag){
                            reg.find({where:{managerId: m.id, deviceMac: deviceMacTag, id:{ne:rMP.id}}}).success(function(rD){  //rD= reg-to-delete
                                if(rD){
                                    rD.destroy().success(function(){log('un necessary deviceMac reg was deleted');});
                                }else{log('No un-necessary deviceMac reg was found :)');}
                            }); 
                        }
                    });    
                }else{
                    log('no mPhone reg was found, will look for deviceMac reg');
                    reg.find({where:{managerId: m.id, deviceMac: deviceMacTag}}).success(function(rDM){ //rDM= reg-with-deviceMac
                        if(rDM){
                            if(mPhoneTag){rDM.deviceMac=deviceMacTag; log('deviceMac was overwritten');}
                            rDM.roostDeviceToken=rB.device_token;
                            rDM.save().success(function(){
                                log('added deviceToken to deviceMac regisreration');
                            });    
                        }else{log('Error: no registration found with the identifiers sent from Roost');}
                    });
                }
            });
        }
    }); 
}
    //function roostUnReg
function roostUnReg(rB, mPhoneTag, deviceMacTag, m){ //TODO this function works OK, can try make it shorter
    //check both tags and make isRoostActive=false
    log('Roost Un-Register...');
    if(mPhoneTag && deviceMacTag){ 
        log('Roost CB sends both mPhoneTag + deviceMacTag');
        reg.find({where:{managerId:m.id, mPhone:mPhoneTag, roostDeviceToken:rB.device_token}}).success(function(r){ //rDM=reg with deviceMac
            if(r){
                r.isRoostActive = false; 
                r.save().success(function(){log('user registeration by phone is now isRoostActive=fale, trying to send SMS');});
                sendSms(r,'roost-cancelation',m);
            }else{
                log('Warning: the registeration has no mPhone but the the ROOST has mPhoneTag');
                reg.find({where:{managerId:m.id, deviceMac:deviceMacTag, roostDeviceToken:rB.device_token}}).success(function(rDM){ //rDM=reg with deviceMac
                    if(rDM){
                        rDM.isRoostActive = false; 
                        rDM.save().success(function(){log('user registeration by deviceMac is now isRoostActive=fale');});
                    }else{log('ERROR: Registeration has no identifiers but Roost has both tags !!!');}
                });
            }
        });
    }else if(mPhoneTag && !deviceMacTag){
        log('Roost CB sends only mPhoneTag');
        reg.find({where:{managerId:m.id, mPhone:mPhoneTag, roostDeviceToken:rB.device_token}}).success(function(rMP){ //rDM=reg with deviceMac
            if(rMP){
                rMP.isRoostActive = false; 
                rMP.save().success(function(){log('user registeration by mPhone is now isRoostActive=fale');});
            }else{log('ERROR: Registeration has no mPhone but Roost has has only mPhoneTag !!!');}
        });
    }else if(deviceMacTag && !mPhoneTag){
        log('Roost CB sends only deviceMacTag');
        reg.find({where:{managerId:m.id, deviceMac:deviceMacTag, roostDeviceToken:rB.device_token}}).success(function(rDM){ //rDM=reg with deviceMac
            if(rDM){
                rDM.isRoostActive = false; 
                rDM.save().success(function(){log('user registeration by deviceMac is now isRoostActive=fale');});
            }else{log('ERROR: Registeration has no deviceMac but Roost has has only deviceMacTag !!!');}
        });
    }
}

//===============DASHBOARD API LISTNERS ==============//
    //File upload:
app.all('/api/dataFileUpload/:managerId',function(req, res){
    console.log(req.body);
    console.log(req.files);
    console.log(req.path);
    fs.readFile(req.files.dataFile.path, function(err,data){
        var newPath = __dirname+'/uploads/data-'+req.params.managerId+'.csv';
        fs.writeFile(newPath, data, function(err){
            if(err){
                result = err;
                res.redirect('back');
            }else{
                console.log(newPath);
                console.log('saved file. content: '+ data);
                res.redirect('/uploaded');    
            }
        });
    });
});
app.get('/api/getCsvHeaders/:managerId', function(req,res){
    manager.find({where:{id:req.params.managerId}}).success(function(m){
        if(m){
            var uploadedData = [];
            var path = 'uploads/data-'+m.id+'.csv';
            var result='';
            console.log(path);
            fs.readFile(path, function (err, data) {
                if(err){
                    console.log('No CSV file found');
                    res.send('No CSV file found');
                }else{
                    var headers='';
                    var stream = fs.createReadStream(path);
                    csv(stream)
                    .on("data", function(data,index){
                        uploadedData[index]=data;
                        console.log(data);
                    })
                    .on("end", function(){
                        console.log("done");
                        for(var h in uploadedData[0]){
                            if(!uploadedData[0][h]){uploadedData[0].splice(h);}
                        }
                        res.json(uploadedData[0]);
                    })
                    .parse();    
                }
            });
        }else{res.send('no manager found');}
    });
});

app.get('/api/updateData/:managerId',function(req,res){
   manager.find({where:{id:req.params.managerId}}).success(function(m){
        if(m){
            var uploadedData = [];
            var path = 'uploads/data-'+m.id+'.csv';
            var result='';
            console.log(path);
            fs.readFile(path, function (err, data) {
                if(err){
                    console.log('No CSV file found');
                    res.send('No CSV file found');
                }else{
                    var headers='';
                    var stream = fs.createReadStream(path);
                    csv(stream)
                    .on("data", function(data,index){
                        uploadedData[index]=data;
                        console.log(data);
                    })
                    .on("end", function(){
                        var organizedData = [];
                        var headers = [];
                        console.log("done");
                        for(var r in uploadedData){
                            if(r==0){
                                headers = uploadedData[0];
                                if(headers[headers.length-1]==''){headers.splice(headers.length-1);}
                            }else{
                                for(var i in uploadedData[r]){
                                    if(i!=0 && uploadedData[r][i]){
                                        organizedData.push({managerId:m.id, mPhone:uploadedData[r][0],filterName:headers[i],value:uploadedData[r][i]});
                                    }    
                                }

                            }    
                        }
                        uD.bulkCreate(organizedData)
                            .success(function(users){
                                console.log(users);
                                res.json(organizedData);
                            })
                            .error(function(err){console.log(err);});
                    })
                    .parse();    
                }
            });
        }else{console.log('no manager found');}
    });
});
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

//Parse CSV:
function parseCSV(){
    var stream = fs.createReadStream("uploads/data.csv");
    csv(stream)
     .on("data", function(data){
         console.log(data);
         //return data[0];

     })
     .on("end", function(){
         console.log("done");
     })
     .parse();    
}






//Recognizing listner

/*
app.all('*',function(req,res){
    console.log('===================================================');
    console.log(req.params);
    console.log(req.query);
    console.log('===================================================');
    res.send(200, 'OK');
});
*/
app.all('/radius.*/',function(req,res){
    console.log('===================================================');
    console.log(req.params);
    console.log(req.query);
    console.log('===================================================');
    res.send(200, 'OK');
});
app.all('/radius.*/',function(req,res){
    console.log('===================================================');
    console.log(req.params);
    console.log(req.query);
    console.log('===================================================');
    res.send(200, 'OK');
});
app.all('/radius.*/',function(req,res){
    console.log('===================================================');
    console.log(req.params);
    console.log(req.query);
    console.log('===================================================');
    res.send(200, 'OK');
});
app.all('/script-sh',function(req,res){
    console.log('===================================================');
    console.log(req.params);
    console.log(req.query);
    console.log('===================================================');
    res.send(200, 'OK');
});




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


//PUT
/*
var https = require('https');
var data = JSON.stringify({"tags":[]});
var options = {
  hostname: 'launch.alertrocket.com',
  port: 443,
  path: '/api/device_tokens/49C91D3BA0B336173C1D10FA40DEFAD91E019086703924467F5C2ED94C981F6F',
  method: 'PUT',
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
req.write(data);
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








//TRMP improving the roost-cb handler:
//the conditioning should be in the reg
//if have 2 tags- bla bla bla
//if only one...bla bla


/* OLD
function roostReg(rB, tagType, tagValue, m){
    if(tagType=='mPhone'){ //TODO add method of save device token to reg instance
        //Check if this device token already registered with this manager:
        reg.find({where:{managerId:m.id, roostDeviceToken:rB.device_token}}).success(function(eR){
            if(eR){
                eR.mPhone = tagValue;
                eR.roostDeviceToken = rB.device_token; //note: no need to check if it is returning customer- ROOST will send welcome anyways....
                eR.isRoostActive = true;
                eR.save().success(function(){
                    console.log('Device token added to registration');
                    reg.find({where:{mPhone: tagValue, roostDeviceToken:null}}).success(function(regToDelete){
                        if(regToDelete){
                            console.log()
                            regToDelete.destroy();    
                        }
                    })
                });
            }else{//deviceToken not yet registered, add device Token
                reg.find({where:{managerId:m.id, mPhone:tagValue}}).success(function(r){
                    if(r){
                        r.roostDeviceToken = rB.device_token; //note: no need to check if it is returning customer- ROOST will send welcome anyways....
                        r.isRoostActive = true;
                        r.save().success(function(){console.log('Device token added to registration');});
                    }else{console.log('Error: did not find the phone number in regs table');}
                });
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


function roostReg(rB, mPhoneTag, deviceMacTag, m){
    //if we have 2 identifiers create one record out of them
    if(mPhoneTag && deviceMacTag){
        log('call back sends mPhone+deviceMac');
        reg.find({where:{managerId:m.id, roostDeviceToken:rB.device_token}}).success(function(eR){ //er = existing Reg
            //Check if the roost tag is already registered
            log('here');
            if(eR){
                if(eR.mPhone && eR.deviceMac){
                    eR.isRoostActive = true; eR.save(); log('GREAT! reg is already unified!');
                }else if(eR.mPhone && !eR.deviceMac){
                    eR.deviceMac = deviceMacTag;
                    eR.isRoostActive = true;
                    eR.save().success(function(){
                        log('adding deivceMac to existing reg;')
                        reg.find({where:{managerId:m.id, deviceMac:deviceMacTag, id:{ne:eR.id}}}).success(function(rD){  //rD = Reg-to-Delete
                            if(rD){
                                rD.destroy().succes(function(){log('deleted un-necessary reg')});    
                            }
                            
                        });
                    });
                }else if(eR.deviceMac && !eR.mPhone){
                    eR.mPhone = mPhoneTag;
                    eR.isRoostActive = true;
                    eR.save().success(function(){
                        log('adding deivceMac to existing reg;')
                        reg.find({where:{managerId:m.id, mPhone:mPhoneTag, id:{ne:eR.id}}}).success(function(rD){  //rD = Reg-to-Delete
                            if(rD){
                                rD.destroy().success(function(){log('deleted un-necessary reg')});    
                            }
                        });
                    });
                }else{log('Error: ther is a registration with roostId without any identifier!');}
            }else{ // no roostDeviceToken found
                log('Warning: Roost has 2 identifiers and but no roostDeviceToken is registered...');
                reg.find({where:{}}).success(function(r))
            }
        });
    }else if(mPhoneTag && !deviceMacTag){
        log('call back sends only mPhone...')
        reg.find({where:{mPhone: mPhoneTag, managerId:m.id}}).success(function(r){
            if(r){
                if(r.roostDeviceToken){consol.log('this regalready have roostDeviceToken');}
                else{consol.log('this reg does not yet have roost device token, now adding...');}
                r.roostDeviceToken = rB.device_token;
                r.isRoostActive = true;
                r.save().success(function(){log('we made sure this reg isRoostActive=true');});
            }else{log('Error: this phone is not registered!!!');}
        });
    }else if(deviceMacTag && !mPhoneTag){
        log('call back sends only deviceMac...')
        reg.find({where:{deviceMac:deviceMacTag, managerId:m.id}}).success(function(r){
            if(r){
                if(r.roostDeviceToken){log('this reg already have roostDeviceToken');}
                else{consol.log('this reg does not yet have roost device token, now adding...');}
                r.roostDeviceToken = rB.device_token;
                r.isRoostActive = true;
                r.save().success(function(){log('we made sure this reg isRoostActive=true');});
            }else{log('Error: this phone is not registered!!!');}
        });
    }else{log('Error: this CB from Roost has not even one identifier !!!');}
}

 OLD ===END=== */