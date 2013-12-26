function initTriggers(){
    App.init();
    FormComponents.init();
    FormSamples.init();
    loadTriggers(1);
    generateToolTipsFromDb(toolTips['triggers']);


    var error = $('.tab-pane .alert-danger');
	var success = $('.tab-pane .alert-success');
	var validateSettings = {
        doNotHideMessage: true,
        errorElement: 'span', //default input error message container
        errorClass: 'help-block', // default input error message class
        focusInvalid: false, // do not focus the last invalid input
        rules: {
            text: {
                required: true,
                minlength:1
            },
            minInterval: {
       			min:1
            },
        },
        invalidHandler: function (event, validator) { //display error alert on form submit   
            error.show();
            App.scrollTo(error, -200);
        },
        highlight: function (element) { // hightlight error inputs
            console.log('hightlight');
            console.log(element);
            /*success.hide();
            error.hide();*/
            $(element)
                .closest('.form-group').addClass('has-error'); // set error class to the control group

                
        },
        success: function (label) {
            label.closest('.form-group').removeClass('has-error');
            label.remove();
        },
        errorPlacement: function (error, element) {
            console.log('errorPlacement');
            console.log(element);
            error.insertAfter(element);
        },
        submitHandler: function (form) {
            error.hide();
            success.hide();
            form.submit(); // form validation success, call ajax form submit
        }
    }
    $('.tab-pane#tab_0 form').validate(validateSettings);
    $('.tab-pane#tab_1 form').validate(validateSettings);
    $('.tab-pane#tab_2 form').validate(validateSettings);
	notifications={
		link:{
			isRequired: function(input){
				if(input.val() || input.is(':disabled') || !input.is(':visible')){return false;}
				else{return true;}
			},
			name: 'category',
			text: 'לא הוגדר קישור. האם להמשיך?'
		}
	};
	/*notifications={};*/
}
function loadTriggers(managerId){
	aGet('/api/triggers/'+managerId, function(data){
		if(data){
			console.log('triggers from server:');
			console.log(data);
			$.each(data,function(i,t){						
				var cntr=$('div[data-trigger-type='+t.type+']');
				cntr.find('textarea[name=text]').val(t.text);
				cntr.find('input[name=link]').val(t.link);
				cntr.find('select[name=sound]').val(t.sound);
				cntr.find('input[name=minInterval]').val(t.minInterval);
				cntr.find('input[name=isActive]').prop('checked',t.isActive);
				$('#isActive-'+t.type).bootstrapSwitch(); //TODO can be made for all of them at once outside the loop
			});
		}
	});
}
var allowEmptyTriggerLink = false;
function triggerLinkNotification(form, type, nextSelector){
	var linkInput = $('.tab-pane.active input[name="link"]');
	if(allowEmptyTriggerLink){
		allowEmptyTriggerLink=false;
		return true;
	}else{
		if(linkInput){
			if( linkInput.val() ){
					return true;
				}else{
					var btnActivateTrigger = $('.tab-pane.active input[name="isActive"]');
					var notification = $.extend(notifications.link, {currentWizard:form, tab:type, nextSelector:btnActivateTrigger});
					$.confirmTrigger(notification);
					return false;
				}
			}else{alert('no input found');
		}
	}
}

$(function(){
	//update trigger:
	$('body').on('change', 'input[name="isActive"]', function(){
		if($(this).hasClass('returning-switch')){//Check if returning switch
			$(this).removeClass('returning-switch');
		}else{
			var cntr = $('.tab-pane.active');
			if($('.tab-pane.active form').valid()){
				var t = {};
				t.type = cntr.attr('data-trigger-type');
				t.text = $(cntr.find('textarea')[0]).val();
				t.link = $(cntr.find('input[name="link"]')[0]).val();
				t.minInterval = $(cntr.find('input[name="minInterval"]')[0]).val();
				t.isActive = $(cntr.find('input[name="isActive"]')[0]).is(':checked');

				if(triggerLinkNotification('.tab-pane.active form',t.type, $(this) )){
					console.log('before send to server');
					console.log(t);
					aPost('/api/triggers/1',t,function(newId){
						console.log('trigger update');
						$('.tab-pane.active .alert-danger').hide();
						var alertSuccess = cntr.find('.alert-success');
						alertSuccess.addClass('visible');	
						setTimeout(function(){alertSuccess.removeClass('visible');},2000);
					});	
				}else{
				$(this).addClass('returning-switch');
				$(this).parent().parent().bootstrapSwitch('toggleState');
				}
			}else{
				$(this).addClass('returning-switch');
				$(this).parent().parent().bootstrapSwitch('toggleState');
			}
		}
	});
});

