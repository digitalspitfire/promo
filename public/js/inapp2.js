//==== ROLES ====
//get cookies of all params and resave them
//generate the iframe src 
//generate the registration-only link
//add event to the store-link to my server

//TODO - add for wifi also

function getCookie(c_name){
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1){
	  c_start = c_value.indexOf(c_name + "=");
	}
	if (c_start == -1){
	  c_value = null;
	}
	else{
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1){
			c_end = c_value.length;
		}
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
}
function getStoreLink(){
	if (navigator && navigator.userAgent) {
        //lowercase version of the user-agent header.
        var uagent = navigator.userAgent.toLowerCase();

        if (uagent.search("iphone") > -1){return 'https://itunes.apple.com/us/app/roost-web-push/id477125272?mt=8';}
        else if(uagent.search("android") > -1){return 'market://details?id=com.alertrocket';}
        else{return 'http://ynet.co.il';}
    }else{return 'http://ynet.co.il';}
}
function del_cookie(name)
{
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

$(function(){
	
	var cMPhone = getCookie('mPhone');
	var cIvrId = getCookie('ivrId');
	var cDeviceMac = getCookie('deviceMac');
	var cNodeMac = getCookie('nodeMac');
	
	alert(cMPhone + ' / ' +cIvrId + ' / '+cDeviceMac + ' / ' + cNodeMac + ' / ');
	
	$('#app-install').on('click',function(){
		$.ajax({
			type:'POST',
			url: 'http://office.sola.co.il:3000/store-requested',
			data:{mPhone:cMPhone, ivrId:cIvrId , deviceMac:cDeviceMac, nodeMac:cNodeMac},
			success: function(response){alert(response);}
		});

	});

	$('#app-install').attr('href',getStoreLink());
	if(cMPhone && cDeviceMac){
		$('#roost-iframe').attr('src','http://roost.me/mnt?tag=mp-'+cMPhone+'&tag=dm-'+cDeviceMac);
		$('#sbs-install').attr('href', 'alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone+'&tag=dm-'+cDeviceMac);
		alert('alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone+'&tag=dm-'+cDeviceMac);
	}
	else if(cMPhone && !cDeviceMac){
		$('#roost-iframe').attr('src','http://roost.me/mnt?tag=mp-'+cMPhone);
		$('#sbs-install').attr('href', 'alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone);
		alert('alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone);
	}
	else if(cDeviceMac && !cMPhone){
		$('#roost-iframe').attr('src','http://roost.me/mnt?tag=dm-'+cDeviceMac);
		$('#sbs-install').attr('href', 'alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=dm-'+cDeviceMac);
		alert('alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone);
	}else{console.log('Error: no cookies !!!');}
/*
	del_cookie('mPhone');
	del_cookie('ivrId');
	del_cookie('deviceMac');
	del_cookie('nodeMac');
	alert('cookies seleted in inapp2');
	*/
});