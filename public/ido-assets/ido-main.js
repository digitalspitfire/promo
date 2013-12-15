function emptyDashboard(){
  $('.page-content .row:not(#page-header)').remove();
}
function loadTemplate(templateName){
  console.log('template name: '+ templateName);
  aGet( 'loadTemplate/'+templateName , function(response){
    emptyDashboard();
    $('.page-content').append(response);
    init[templateName]();
    $('.page-sidebar-menu li').removeClass('loading-template')
  });
}

function isAuth(response){
  console.log('response: ');
  console.log(response);
  var isAuth = 401 ? false : true;
  return isAuth;
}
//TODO : these 3 can be one function:
function aGet(url , successFunc){
  var aReq = $.ajax({
    url:url,
    success: function(response){successFunc(response);},
    error:function(jqXHR){
      if(jqXHR.status==401){
        //call func empty dashbard.
        $.get('/login',function(response){
          $('.page-content').append(response);
        });
        window.location.replace("/login");
      }
    }
  });  
}
function aPost(url ,data, successFunc){
  var aReq = $.ajax({
    method:'POST',
    url:url,
    data:data,
    success: function(response){successFunc(response);},
    error:function(jqXHR){
      if(jqXHR.status==401){
        //call func empty dashbard.
        $.get('/login',function(response){
          $('.page-content').append(response);
        });
        window.location.replace("/login");
      }
    }
  });  
}
function aDelete(url, successFunc){
  var aReq = $.ajax({
    method:'DELETE',
    url:url,    
    success: function(response){successFunc(response);},
    error:function(jqXHR){
      if(jqXHR.status==401){
        //call func empty dashbard.
        $.get('/login',function(response){
          $('.page-content').append(response);
        });
        window.location.replace("/login");
      }
    }
  });  
}


/*

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}*/