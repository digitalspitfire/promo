//get the QS params
//get cookies off the other params
//save to all 4 to cookies
//send to registration table

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

$(function(){
	var qsMPhone = getParameterByName('m');
	var qsIvrId = getParameterByName('i');
	var qsDevisMac = getParameterByName('device_token');
	var qsNodeMac = getParameterByName('node_mac');

	var cMPhone = getCookie('mPhone');
	var cIvrId = getCookie('ivrId');
	var cDevisMac = getCookie('deviceMac');
	var cNodeMac = getCookie('nodeMac');
	alert(qsMPhone + ' / ' +qsIvrId + ' / '+qsDevisMac + ' / ' + qsNodeMac + ' / ');

	if(qsMPhone && qsIvrId){
		setCookie('mPhone', qsMPhone, 20);
		setCookie('ivrId', qsIvrId, 20);
		setCookie('deviceMac', cDevisMac, 20);
		setCookie('nodeMac', cNodeMac, 20);

		$.ajax({
			type:'POST',
			url: 'http://office.sola.co.il:3000/register-by-phone',
			data:{mPhone:qsMPhone, ivrId:qsIvrId, deviceMac: cDevisMac, nodeMac: cNodeMac},
			success: function(response){alert(response);}
		});
	}
});