var FormWizard = function () {


    return {
        //main function to initiate the module
        init: function (currentWizard) {
            if (!jQuery().bootstrapWizard) {
                return;
            }
            function format(state) {
                if (!state.id) return state.text; // optgroup
                return "<img class='flag' src='assets/img/flags/" + state.id.toLowerCase() + ".png'/>&nbsp;&nbsp;" + state.text;
            }
            $("#country_list").select2({
                placeholder: "Select",
                allowClear: true,
                formatResult: format,
                formatSelection: format,
                escapeMarkup: function (m) {
                    return m;
                }
            });

            var form = $('#submit_form');
            var error = $('.alert-danger', form);
            var success = $('.alert-success', form);
            if(currentWizard=='#form-wizard-campaigns'){
                var rules={
                    //step 1
                    name: {
                        minlength: 1,
                        required: true
                    },
                    message: {
                        minlength: 1,
                        required: true
                    },
                    //receivers
                    localMinTimeGap: {
                        minutesRequired : ''
                        /*required: true*/
                    },
                    email: {
                        required: true,
                        email: true
                    },
                    phone: {
                        required: true
                    },
                    gender: {
                        required: true
                    },
                    address: {
                        required: true
                    },
                    city: {
                        required: true
                    },
                    country: {
                        required: true
                    },
                    //content
                    link: {
                        
                    },
                    card_number: {
                        minlength: 16,
                        maxlength: 16,
                        required: true
                    },
                    card_cvc: {
                        digits: true,
                        required: true,
                        minlength: 3,
                        maxlength: 4
                    },
                    card_expiry_date: {
                        required: true
                    },
                    'payment[]': {
                        required: true,
                        minlength: 1
                    }
                }
            }else if(currentWizard=='#form-wizard-upload-data'){
                var rules={
                    //step 1
                    hdnFileInput: {
                        csvFile: '',
                    },
                    selectCelCol: {
                        required: true
                    },
                    desiredAttrs: {
                        minNumOfColomns: 2
                    },

                }
            }else{
                var rules = {}
            }
            console.log('rules');
            console.log(rules);

            form.validate({
                doNotHideMessage: true, //this option enables to show the error/success messages on tab switch.
                errorElement: 'span', //default input error message container
                errorClass: 'help-block', // default input error message class
                focusInvalid: false, // do not focus the last invalid input
                rules: rules,
                /*rules: {},*/
                messages: { // custom messages for radio buttons and checkboxes
                    'payment[]': {
                        required: "Please select at least one option",
                        minlength: jQuery.format("Please select at least one option")
                    }
                },

                errorPlacement: function (error, element) { // render error placement for each input type
                    if (element.attr("name") == "gender") { // for uniform radio buttons, insert the after the given container
                        error.insertAfter("#form_gender_error");
                    } else if (element.attr("name") == "payment[]") { // for uniform radio buttons, insert the after the given container
                        error.insertAfter("#form_payment_error");
                    } else {
                        error.insertAfter(element); // for other inputs, just perform default behavior
                    }
                },

                invalidHandler: function (event, validator) { //display error alert on form submit   
                    success.hide();
                    error.show();
                    App.scrollTo(error, -200);
                },

                highlight: function (element) { // hightlight error inputs
                    console.log('hightlight');
                    console.log(element);
                    $(element)
                        .closest('.form-group').removeClass('has-success').addClass('has-error'); // set error class to the control group
                },

                unhighlight: function (element) { // revert the change done by hightlight
                    console.log('success');
                    console.log(element);
                    $(element)
                        .closest('.form-group').removeClass('has-error'); // set error class to the control group
                },

                success: function (label) {                    
                    if (label.attr("for") == "gender" || label.attr("for") == "payment[]") { // for checkboxes and radio buttons, no need to show OK icon
                        label
                            .closest('.form-group').removeClass('has-error').addClass('has-success');
                        label.remove(); // remove error label here
                    } else { // display success icon for other inputs
                        label
                            .addClass('valid') // mark the current input as valid and display OK icon
                        .closest('.form-group').removeClass('has-error').addClass('has-success'); // set success class to the control group
                    }
                },

                submitHandler: function (form) {
                    success.show();
                    error.hide();
                    //add here some ajax code to submit your form or just call form.submit() if you want to submit the form without ajax
                }

            });

            var displayConfirm = function() {
                $('#tab4 .form-control-static', form).each(function(){
                    var input = $('[name="'+$(this).attr("data-display")+'"]', form);
                    if (input.is(":text") || input.is("textarea")) {
                        $(this).html(input.val());
                    } else if (input.is("select")) {
                        $(this).html(input.find('option:selected').text());
                    } else if (input.is(":radio") && input.is(":checked")) {
                        $(this).html(input.attr("data-title"));
                    } else if ($(this).attr("data-display") == 'payment') {
                        var payment = [];
                        $('[name="payment[]"]').each(function(){
                            payment.push($(this).attr('data-title'));
                        });
                        $(this).html(payment.join("<br>"));
                    }
                });
            }

            var handleTitle = function(tab, navigation, index) {
                var total = navigation.find('li').length;
                var current = index + 1;
                // set wizard title
                $('.step-title', $(currentWizard)).text('Step ' + (index + 1) + ' of ' + total);
                // set done steps
                jQuery('li', $(currentWizard)).removeClass("done");
                var li_list = navigation.find('li');
                for (var i = 0; i < index; i++) {
                    jQuery(li_list[i]).addClass("done");
                }
                if (current == 1) {
                    $(currentWizard).find('.button-previous').hide();
                } else {
                    $(currentWizard).find('.button-previous').show();
                }

                if (current >= total) {
                    $(currentWizard).find('.button-next').hide();
                    $(currentWizard).find('.button-submit').show();
                    displayConfirm();
                } else {
                    $(currentWizard).find('.button-next').show();
                    $(currentWizard).find('.button-submit').hide();
                }
                App.scrollTo($('.page-title'));
            }

            // default form wizard

            var isTabClickFromNextButton = false;
            $(currentWizard).bootstrapWizard({
                'nextSelector': '.button-next',
                'previousSelector': '.button-previous',
                onTabClick: function (tab, navigation, index, clickedIndex) {
                    //ido commented:
                    /*success.hide();
                    error.hide();
                    if (form.valid() == false) {
                        return false;
                    }*/
                    //ido addition:
                    if(isTabClickFromNextButton){
                        handleTitle(tab, navigation, clickedIndex);    
                    }else{
                        return false;
                    }
                    
                },
                onNext: function (tab, navigation, index) {
                    success.hide();
                    error.hide();
                    if (form.valid() == false) {
                        return false;
                    }
                    //ido:
                    if( notificationsApproved(currentWizard, tab, this.nextSelector) ){
                        isTabClickFromNextButton=true;
                        handleTitle(tab, navigation, index);    
                        isTabClickFromNextButton=false;
                    }else{
                        return false;
                    }
                    /*handleTitle(tab, navigation, index);    */

                    
                },
                onPrevious: function (tab, navigation, index) {
                    success.hide();
                    error.hide();

                    handleTitle(tab, navigation, index);
                },
                onTabShow: function (tab, navigation, index) {
                    var total = navigation.find('li').length;
                    var current = index + 1;
                    var $percent = (current / total) * 100;
                    $(currentWizard).find('.progress-bar').css({
                        width: $percent + '%'
                    });
                }
            });

            $(currentWizard).find('.button-previous').hide();
            $(currentWizard).find('.button-submit').click(function () {
                /*debugger;*/
                /*alert('Finished! Hope you like it XXX :)');*/
            }).hide();
        }

    };

}();