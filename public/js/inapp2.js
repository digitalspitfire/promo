//get the QS params
//get cookies off the other params
//save to all 4 to cookies
//send to registration table

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

$(function(){
	var cMPhone = getCookie('mPhone');
	var cIvrId = getCookie('ivrId');
	var cDeviceMac = getCookie('deviceMac');
	var cNodeMac = getCookie('nodeMac');
	
	alert(cMPhone + ' / ' +cIvrId + ' / '+cDeviceMac + ' / ' + cNodeMac + ' / ');
	
	$('#ido').on('click',function(){
		$.ajax({
			type:'POST',
			url: 'http://office.sola.co.il:3000/store-requested',
			data:{mPhone:cMPhone, ivrId:cIvrId , deviceMac:cDeviceMac, nodeMac:cNodeMac},
			success: function(response){alert(response);}
		});
	});

	$('#app-install').attr('href',getStoreLink());
	if(cMPhone){
		$('#roost-iframe').attr('src','http://roost.me/mnt?tag=mp-'+cMPhone);
		$('#sbs-install').attr('href', 'alertrocket://register?appKey=1f24e572334d4575b5d3ae72afd45d8f&tag=mp-'+cMPhone);
	}
});