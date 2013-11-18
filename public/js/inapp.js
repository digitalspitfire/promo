//=== ROLES ===
//get the QS params
//get cookies off the other params
//save to all 4 to cookies
//send to registration table

//TODO - add for wifi also

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function setCookie(c_name,value,exdays){
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

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
function del_cookie(name)
{
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

$(function(){
	var qsMPhone = getParameterByName('m');
	var qsIvrId = getParameterByName('i');
	var qsDeviceMac = getParameterByName('client_mac');
	var qsNodeMac = getParameterByName('node_mac');

	var cMPhone = getCookie('mPhone');
	var cIvrId = getCookie('ivrId');
	var cDeviceMac = getCookie('deviceMac');
	var cNodeMac = getCookie('nodeMac');
	alert('QS params: '+ qsMPhone + ' / ' +qsIvrId + ' / '+qsDeviceMac + ' / ' + qsNodeMac + ' / ');

	if(qsMPhone && qsIvrId){
		setCookie('mPhone', qsMPhone, 20);
		setCookie('ivrId', qsIvrId, 20);
		setCookie('deviceMac', cDeviceMac, 20);
		setCookie('nodeMac', cNodeMac, 20);

		$.ajax({
			type:'POST',
			url: 'http://office.sola.co.il:3000/register-by-phone',
			data:{mPhone:qsMPhone, ivrId:qsIvrId, deviceMac: cDeviceMac, nodeMac: cNodeMac},
			success: function(response){alert(response);}
		});
	}
	if(qsDeviceMac && qsNodeMac){
		setCookie('mPhone', cMPhone, 20);
		setCookie('ivrId', cIvrId, 20);
		setCookie('deviceMac', qsDeviceMac, 20);
		setCookie('nodeMac', qsNodeMac, 20);

		$.ajax({
			type:'POST',
			url: 'http://office.sola.co.il:3000/register-by-device-mac',
			data:{mPhone:cMPhone, ivrId:cIvrId, deviceMac: qsDeviceMac, nodeMac: qsNodeMac},
			success: function(response){alert(response);}
		});
	}
	alert('identifiers cookies: ' + cMPhone +' / '+ cIvrId +' / '+ cDeviceMac +' / '+ cNodeMac );
	/*
	setCookie('name', 'ido', 20);		
	alert('name cookie: ' + getCookie('name'));

	del_cookie('name');
	del_cookie('mPhone');
	del_cookie('ivrId');
	del_cookie('deviceMac');
	del_cookie('nodeMac');
	alert('cookies deleted in inapp1');
	alert('name cookie after delete: ' + getCookie('name'));
	*/
	

});