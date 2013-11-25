var express = require('express');
var app = express()
                    .use(express.bodyParser());
var fs = require('fs');
var csv = require("fast-csv");
var schedule = require('node-schedule');

app.listen(3000);
console.log('listening in port 3000');


//Loading static files:
app.use(express.static(__dirname+'/public'));
//Allow app.delete
app.use(express.logger());

//dashboard
app.get('/dashboard',function(req,res){
    res.sendfile('public/dashboard.html');
});

app.get('/manager',function(req,res){
    res.sendfile('public/manager.html');
});
app.get('/test',function(req,res){
    res.sendfile('public/test.html');
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
var manager = sq.define('manager',{vendorName:Sq.TEXT, name:Sq.TEXT, email:Sq.TEXT, phoneNumber:Sq.TEXT, user:Sq.TEXT, pass:Sq.TEXT,ivrId:Sq.INTEGER,ivrPhone:Sq.INTEGER,roostConfKey:Sq.TEXT,roostSecretKey:Sq.TEXT,roostSecretKey:Sq.TEXT, roostGeoLoc:Sq.TEXT});
var campaign = sq.define('campaign',{isActive:Sq.BOOLEAN, name:Sq.TEXT, category:Sq.TEXT,goals:Sq.TEXT,budget:Sq.TEXT,message:Sq.TEXT, link:Sq.TEXT,sound:Sq.TEXT, recurring:Sq.TEXT, dayOfWeek:Sq.INTEGER, hour:Sq.INTEGER, isRoostGeoLoc:Sq.BOOLEAN,sent:Sq.TEXT});
var node = sq.define('node',{nodeMac:Sq.TEXT});
var filter = sq.define('filter',{name:Sq.TEXT});
var activation = sq.define('activation',{mPhone:Sq.TEXT, deviceMac:Sq.TEXT, nodeMac:Sq.TEXT});
var reg = sq.define('registration',{mPhone:Sq.TEXT, deviceMac:Sq.TEXT, roostDeviceToken:Sq.TEXT, isRoostActive:Sq.BOOLEAN});
var tM = sq.define('trigerredMessage',{type:Sq.TEXT, text:Sq.TEXT, link:Sq.TEXT, isActive:Sq.BOOLEAN});
var uD = sq.define('usersData',{mPhone:Sq.TEXT, filterName:Sq.TEXT, value:Sq.TEXT});
var recMac = sq.define('recognisedMac',{deviceMac:Sq.TEXT, nodeMac:Sq.TEXT});

manager
    .hasMany(campaign)
    .hasMany(node)
    .hasMany(filter)
    .hasMany(activation)
    .hasMany(reg)
    .hasMany(tM)
    .hasMany(uD);
reg.belongsTo(manager);
campaign.belongsTo(manager);
node.belongsTo(manager);
filter.belongsTo(manager);
activation.belongsTo(manager);
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
        if(rQ.phonereceived=='0'){
            sendWelcomebackSms(rQ.phone, rQ.dest);
        }
    }
    res.send(200);
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
    if(rB.mPhone && rB.mPhone!='null' && rB.ivrId && rB.ivrId!='null'){ //TODO unify with device MAc
        console.log('store requested with mPhone');
        manager.find({where:{ivrId:rB.ivrId}}).success(function(m){
            if(m){
                reg.find({where:{mPhone:rB.mPhone, managerId: m.id}}).success(function(r){
                    if(r){
                        if(r.roostDeviceToken && r.isRoostActive){
                            setTimeout(function(){sendPushNot(r,'roost-reg-welcome-back',m); console.log('push note sent');},30000);
                            console.log('sending notification for welcome back (mp)');
                        }else{console.log('new cutomer'); res.send('new cutomer');}//do nothing
                    }else{console.log('error: reg not found'); res.send('error: reg not found');}
                });
            }else{console.log('error: manager not found'); res.send('error: manager not found');}
        });
    }else if(rB.deviceMac && rB.deviceMac!='null' && rB.nodeMac && rB.nodeMac!='null'){ //TODO unify with mPhone
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
                    rMP.isRoostActive=true;
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
                            rDM.isRoostActive=true;
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
                r.save().success(function(){
                    log('user registeration by phone is now isRoostActive=false, trying to send SMS');
                    sendSms(r,'roost-cancelation',m);
                });
                
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
                rMP.save().success(function(){
                    log('user registeration by phone is now isRoostActive=false, trying to send SMS');
                    sendSms(rMP,'roost-cancelation',m);
                });
            }else{log('ERROR: Registeration has no mPhone but Roost has has only mPhoneTag !!!');}
        });
    }else if(deviceMacTag && !mPhoneTag){
        log('Roost CB sends only deviceMacTag');
        reg.find({where:{managerId:m.id, deviceMac:deviceMacTag, roostDeviceToken:rB.device_token}}).success(function(rDM){ //rDM=reg with deviceMac
            if(rDM){
                rDM.isRoostActive = false; 
                rDM.save().success(function(){log('user registeration by deviceMac is now isRoostActive=false');});
            }else{log('ERROR: Registeration has no deviceMac but Roost has has only deviceMacTag !!!');}
        });
    }
}
//Listen to Node logon call:
app.all('/radius/online',function(req,res){
    console.log('=================================================================');
    console.log('>>>request from node:' + req.params);
    console.log(req.path);
    console.log(req.query);
    if(req.params.mac){
        var nodeMac='';
        if(req.params.nasid){nodeMac=req.params.nodeMac;}
        recMac.create({deviceMac:req.params.mac, nodeMac:nodeMac}).success(function(rM){
            log('recognized user registered');
            trigerRecognizedMacEvent(rM);
        });
    }
    res.send(200);
});

//===============DASHBOARD API LISTNERS ==============//
//Users data file upload + management
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
                res.redirect('/manager?uploaded=true');    
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
app.post('/api/presentData/:managerId', function(req,res){
    manager.find({where:{id:req.params.managerId}}).success(function(m){
        if(m){
            var cellularCol = req.body.celCol;
            var selectedCols = req.body.selectedCols;
            log('celCol: ' +cellularCol);
            log('selectedCols: ' +selectedCols);
            var organizedData = {};
            var path = 'uploads/data-'+m.id+'.csv';
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
                        organizedData[index]=[];
                        for(var item in data){
                            if(selectedCols.indexOf(item)>-1){
                                organizedData[index].push(data[item]);    
                            }
                        }
                        log('Raw Data: '+data);
                        log('organized Data: '+organizedData[index]);
                    })
                    .on("end", function(){
                        console.log("done");
                        console.log(organizedData);
                        res.send(organizedData);
                    })
                    .parse();    
                }
            });
        }else{res.send('no manager found');}
    });
});
app.get('/api/update-users-data/:managerId',function(req,res){
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
                        //console.log(data);
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
                        //update usersData table:
                        updateUserDataValue(organizedData,0, res);
                        res.send('The data is updating....');
                    })
                    .parse();    
                }
            });
        }else{console.log('no manager found'); res.send('not updated!, no manager found');}
    });
});
function updateUserDataValue(organizedData , index, res){
    
    if(!organizedData[index]){
        return false;
    }
    else{
        var oDv = organizedData[index];
        uD.find({where:{managerId:oDv.managerId, mPhone: oDv.mPhone, filterName:oDv.filterName}}).success(function(eV){
            if(eV){
                eV.value=oDv.value; 
                eV.save();
                updateUserDataValue(organizedData, index+1)
                log('updated value of existing row');
            }else{
                uD.create(oDv).success(function(){
                    log('created a new value');
                    updateUserDataValue(organizedData, index+1)
                });
            }
        });
    }
}
app.get('/api/usersData/:managerId',function(req,res){
   manager.find({where:{id:req.params.managerId}}).success(function(m){
        if(m){
            uD.findAll({where:{managerId:m.id}}).success(function(users){
                if(users){
                    var usersData = [];
                    for(var u in users){
                        //console.log(users[u].dataValues);
                        usersData.push(users[u].dataValues);
                    }
                    res.json(usersData);
                }
            });
        }else{console.log('no manager found');}
    });
});
//Campaigns:
app.get('/api/campaigns/:managerId/:campaignId?',function(req,res){
    if(req.params.campaignId){
        campaign.find({where:{id:req.params.campaignId,managerId:req.params.managerId}}).success(function(c){
            if(c){
                res.json(c);
            }else{log('Error: no campaign by this Id found..');}
        });
    }else{
        campaign.findAll({where:{managerId:req.params.managerId}}).success(function(cs){
            if(cs){
                var campaigns = [];
                for(var c in cs){
                    campaigns.push(cs[c].dataValues);
                }
                res.json(campaigns);
            }else{log('Error: no campaigns by this managerId...');}
        });
    }
});
app.post('/api/campaigns/:managerId/:campaignId?',function(req,res){
    if(req.params.campaignId){ //updating exsiting campaign
        var rB = req.body;
        if(req.params.campaignId && req.params.managerId){
            campaign.find({where:{id:req.params.campaignId,managerId:req.params.managerId}}).success(function(c){
                if(c){
                    c.updateAttributes(rB).success(function(c){
                        log('Campaign-'+c.dataValues.toString()+'was updated');
                        if(c.dataValues.isActive){
                            scheduleCampaign(c.dataValues);
                        }else if(scheduledJobs[c.dataValues.id]){
                                scheduledJobs[c.dataValues.id].cancel();
                        }
                    });
                }else{log('Error: no campaign by this Id & managerId found..');}
            });
        }else{log('Error: no campaignId or managerId sent from client');}
        res.send('trying to update campaign');    
    }else{ //creating new campaign
        campaign.create({managerId:req.params.managerId}).success(function(nC){ //nC=newCampaign
            if(nC){
                log('new campaign created! id: '+nC.id);
                res.json(nC.id);
            }
        });
    }    
});
app.delete('/api/campaigns/:managerId/:campaignId',function(req,res){
    campaign.find({where:{id:req.params.campaignId}}).success(function(c){
        if(c){
            log('the c going to be deleted: '+c.id);
            c.destroy().success(function(){
                log('campaign deleted! id: '+c.id);
                unSceduleCampaign(c.id);
                res.json(c.id);
            });
        }
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
                var smsData = qs.stringify({post:2,uid:'2561',un:'promonim',msg:tM.text,list:'05'+reg.mPhone,charset:'utf-8',from:'036006660'});
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
//SEND SMS to a spcific on Menashe second call
function sendWelcomebackSms(mPhone, ivrPhone){
    log('sending welcome-back SMS....');
    if(mPhone && ivrPhone){
        manager.find({where:{ivrPhone:ivrPhone}}).success(function(m){
            if(m){
                tM.find({where:{managerId:m.id, type:'recognized'}}).success(function(tM){
                    if(tM){
                        var http = require('http');
                        var qs = require('querystring');
                        var smsData = qs.stringify({post:2,uid:'2561',un:'promonim',msg:tM.text,list:mPhone,charset:'utf-8',from:'036006660'});
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
                    }else{log('Error: no triggered message of this type fot this manager');}
                });
            }else{log('SMS not sent since reg has no mPhone (or no managerId)');}
        });
    }else{log('Error: no mphone OR ivrPhone for welcomeback SMS');}
}
//triggerRecognizedMac:
function triggerRecognizedMac(rM){ //rM = recMac object
    recMac.findAll({where:{deviceMac:rM.deviceMac}},{order:'updatedAt DESC'}).success(function(rMs){ //TODO check sybtax of query + if DESC or ASC
        var regBeforeLast = rMs[1];
        console.log(rMs[1].dataValues);
    });
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
//Send campaign via SMS
function sendSmsCampaign(c,smsList){
    for(var mP in smsList){
        smsList[mP]='05'+ smsList[mP];
    }
    var http = require('http');
    var qs = require('querystring');
    var smsData = qs.stringify({post:2,uid:'2561',un:'promonim',msg:c.message,list:smsList,charset:'utf-8',from:'036006660'});
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
}
//Send campaign via Roost
function sendRoostCampaign(c, roostList , manager){
    var https = require('https');
    //var qs = require('querystring'); 
    //var data = JSON.stringify({alert:c.message, url:c.link,device_tokens:roostList}); //TODO add sound
    var data = JSON.stringify({"alert":"bbbb", "url":"aaaa"}); //TODO add sound
    var options = {
      hostname: 'launch.alertrocket.com',
      port: 443,
      path: '/api/push',
      method: 'POST',
      //auth:manager.roostConfKey+':'+manager.roostSecretKey,
      auth:'1f24e572334d4575b5d3ae72afd45d8f:25b45e9c29814bba8a6e41dbdd6edee4'
      //headers: { 'Content-Type': 'application/json'}
    };
    log(manager.roostConfKey+':'+manager.roostSecretKey);
    log(c.message);
    log(c.link);
    var req = https.request(options, function(res) {
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);

      res.on('data', function(d) {
        process.stdout.write(d); //TODO WHAT IS THIS??
      });
    });
    req.write(data);
    req.end();
    log('sent roost campaign to roost, tokens: '+roostList.toString());
    req.on('error', function(e) {
        console.error('error');
        console.error(e);
    });
}

//===============SCHEDULE CAMPAIGNS========//
//TODO:add enums : 0:one-time // 1:daily // 2:weekly
//ReSchedule on function init:
var scheduledJobs = {};

campaign.findAll({where:{isActive:1}}).success(function(cs){
    log('ReScheduling existing campaigns');
    if(cs){
        for(var c in cs){
            scheduleCampaign(cs[c].dataValues);
        }
        //log('list: ');
        //console.log(schedule.scheduledJobs);
    }
});

function scheduleCampaign(camp){
    var id=camp.id;
    if(camp.recurring==0){//create a one timejob
        //TEMP
        /*
        if(s.getSeconds()<50){
            s.setSeconds(s.getSeconds()+10);
        }else{
            s.setMinutes(s.getMinutes()+1);
            s.setSeconds(0);
        }
        log('fire :'+s);
        */
        var now = new Date();
        log(now);

        //TEMP---END
        var s = new Date();
        if(s.getDay()!=camp.dayOfWeek || camp.hour>s.getHours()){ 
            //s.setDate(s.getDate() + (s - 1 - s.getDay() + 7) % 7 + 1);    
        }else{}//special case- the schedule is for today
        //s.setHours(camp.hour);//temp
        
        //s.setMinutes(0); //temp
        s.setSeconds(s.getSeconds()+4); //temp
        scheduledJobs[id]= schedule.scheduleJob(s,cb(camp));
        log('Campaign-'+id+'(single-time) was scheduled');
    }else if(camp.recurring==1){//daily
        var rule=new schedule.recurringRule();
        rule.hour=camp.hour;
        rule.minute=0;
        scheduledJobs[id]= schedule.scheduleJob(rule,cb(camp));
        log('Campaign-'+id+'(daily) was scheduled');
    }else if(camp.recurring==2){//weekly
        var rule=new schedule.recurringRule();
        rule.dayOfWeek=camp.day;
        rule.hour=camp.hour;
        rule.minute=0;
        scheduledJobs[id]= schedule.scheduleJob(rule,cb(camp));
        log('Campaign-'+id+'(weekly) was scheduled');
    }
}
function unScheduleCampaign(campaignId){
    scheduledJobs[campaignId].cancel();
}
function cb(campaign) {
    return function() {
        fireCampaign(campaign);
    };
}
function fireCampaign(c){
    console.log(c);
    log('Campaign-'+c.id+' is firing!');
    manager.find({where:{id:c.managerId}}).success(function(m){
        reg.findAll({where:{managerId:m.id}}).success(function(rs){
            var roostList = [];
            var smsList = [];
            for(var r in rs){                        
                console.log('regId to send campaign to: '+rs[r].id);
                if(rs[r].isRoostActive && rs[r].isRoostActive){
                    roostList.push(rs[r].roostDeviceToken);
                }else if(!rs[r].isRoostActive && rs[r].mPhone && rs[r].mPhone!='null'){
                    smsList.push(rs[r].mPhone);
                }
            }
            console.log('smsList: '+smsList);
            console.log('roostList: '+roostList);
            sendSmsCampaign(c, smsList);
            sendRoostCampaign(c, roostList, m);
            var sentVals = JSON.parse(c.sent);
            log(sentVals.sms);
            log(sentVals.roost);
            log(smsList.length);
            log(roostList.length);
            if(!(sentVals)){
                log('no history');
                sentVals={sms:smsList.length,roost:roostList.length};
            }else{
                log('adding to  history');
                sentVals.sms = parseInt(sentVals.sms) + parseInt(smsList.length);
                sentVals.roost = parseInt(sentVals.roost) + parseInt(roostList.length);
            }
            //NOTE: I must find it again since 'c' is not the real object (and there is a reason for that)
            campaign.find({where:{id:c.id}}).success(function(sentCampaign){
                console.log(sentCampaign.dataValues);
                if(sentCampaign.dataValues){
                    sentCampaign.dataValues.sent=JSON.stringify(sentVals);    
                    sentCampaign.save().success(function(sC){
                        log('This campaign totaly sent by now: '+sC.dataValues.sent);
                    });
                }
            });
        });
    });  
}
/*
campaign.find({where:{id:1}}).success(function(c){
    console.log(c.dataValues);
    c.sent=JSON.stringify({sms:'1',roost:'2'});
    c.save().success(function(){log('hey================================');});
});
*/
//Recognizing listner


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


