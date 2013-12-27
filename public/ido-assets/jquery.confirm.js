/**
 * jquery.confirm
 *
 * @version 1.2
 *
 * @author My C-Labs
 * @author Matthieu Napoli <matthieu@mnapoli.fr>
 *
 * @url https://github.com/myclabs/jquery.confirm
 */
(function ($) {

    /**
     * Confirm a link or a button
     * @param options {text, confirm, cancel, confirmButton, cancelButton, post}
     */
    $.fn.confirm = function (options) {
        if (typeof options === 'undefined') {
            options = {};
        }

        options.button = $(this);

        this.click(function (e) {
            e.preventDefault();

            $.confirm(options, e);
        });

        return this;
    };

    /**
     * Show a confirmation dialog
     * @param options {text, confirm, cancel, confirmButton, cancelButton, post}
     */
    $.confirm = function (options, e) {
        
        // Default options
        var settings = $.extend({
            text: "Are you sure?",
            confirmButton: "כן",
            cancelButton: "בטל",
            post: false,
            confirm: function (confirmButton) {
                // var url = e.currentTarget.attributes['href'].value;  //ido
                if (options.post) {
                    alert('answer yes'); //ido
                    var form = $('<form method="post" class="hide" action="' + url + '"></form>');
                    $("body").append(form);
                    form.submit();
                } else {
                    console.log('settings');
                    console.log(settings);

                    var currentStep = 'step' + (1+options.tab.index());
                    delete notifications[currentStep][options.name];
                    $(options.nextSelector).trigger('click');
                    confirmButton.show();

                    /*idoNotifications(options.form, options.tab);*/
                }
            },
            cancel: function (o) {
            },
            button: null
        }, options);

        //modal 
        /*var buttons = '<button class="confirm btn btn-primary" type="button" data-dismiss="modal">'
            + settings.confirmButton + '</button>'
            + '<button class="cancel btn" type="button" data-dismiss="modal">'
            + settings.cancelButton + '</button>';
        var modalHTML = '<div class="confirmation-modal modal hide fade" tabindex="-1" role="dialog">'
            + '<div class="modal-body">' + settings.text + '</div>'
            + '<div class="modal-footer">' + buttons + '</div>'
            + '</div>';*/





        // Modal - ido edited
        var buttons = '<button class="confirm btn btn-primary" type="button" data-dismiss="modal">'
            + settings.confirmButton + '</button>'
            + '<button class="cancel btn" type="button" data-dismiss="modal">'
            + settings.cancelButton + '</button>';
        var modalHTML = '<div class="modal fade" tabindex="-1" role="dialog">'
            + '<div class="modal-dialog ">'
            + '<div class="modal-content">'
            + '<div class="modal-body">' + settings.text + '</div>'
            + '<div class="modal-footer">' + buttons + '</div>'
            + '</div>';
            + '</div>';
            + '</div>';



        var modal = $(modalHTML);

        modal.on('shown', function () {
            modal.find(".btn-primary:first").focus();
        });
        modal.on('hidden', function () {
            modal.remove();
        });
        modal.find(".confirm").click(function (e) {
            var confirmButton = $(this);
            confirmButton.hide()
            settings.confirm(/*settings.button*/confirmButton);
        });
        modal.find(".cancel").click(function (e) {
            settings.cancel(settings.button);
        });

        // Show the modal
        $("body").append(modal);
        modal.modal();
    }
    
    $.confirmTrigger = function (options, e) {
        
        // Default options
        var settings = $.extend({
            text: "Are you sure?",
            confirmButton: "כן",
            cancelButton: "בטל",
            confirm: function (confirmButton) {
                console.log('settings');
                console.log(settings);
                allowEmptyTriggerLink = true;
                $(options.nextSelector).trigger('click');
                confirmButton.show();
            },
            cancel: function (o) {
            },
            button: null
        }, options);

        // Modal - ido edited
        var buttons = '<button class="confirm btn btn-primary" type="button" data-dismiss="modal">'
            + settings.confirmButton + '</button>'
            + '<button class="cancel btn" type="button" data-dismiss="modal">'
            + settings.cancelButton + '</button>';
        var modalHTML = '<div class="modal fade" tabindex="-1" role="dialog">'
            + '<div class="modal-dialog ">'
            + '<div class="modal-content">'
            + '<div class="modal-body">' + settings.text + '</div>'
            + '<div class="modal-footer">' + buttons + '</div>'
            + '</div>';
            + '</div>';
            + '</div>';



        var modal = $(modalHTML);

        modal.on('shown', function () {
            modal.find(".btn-primary:first").focus();
        });
        modal.on('hidden', function () {
            modal.remove();
        });
        modal.find(".confirm").click(function (e) {
            var confirmButton = $(this);
            confirmButton.hide()
            settings.confirm(/*settings.button*/confirmButton);
        });
        modal.find(".cancel").click(function (e) {
            settings.cancel(settings.button);
        });

        // Show the modal
        $("body").append(modal);
        modal.modal();
    }

    $.confirmDataUpload = function (options, e) {
        
        // Default options
        var settings = $.extend({
            text: "Are you sure?",
            confirmButton: "כן",
            cancelButton: "בטל",
            confirm: function (confirmButton) {
                console.log('settings');
                console.log(settings);
                allowApplyData = true;
                $(options.nextSelector).trigger('click');
                confirmButton.show();
            },
            cancel: function (o) {
            },
            button: null
        }, options);

        // Modal - ido edited
        var buttons = '<button class="confirm btn btn-primary" type="button" data-dismiss="modal">'
            + settings.confirmButton + '</button>'
            + '<button class="cancel btn" type="button" data-dismiss="modal">'
            + settings.cancelButton + '</button>';
        var modalHTML = '<div class="modal fade" tabindex="-1" role="dialog">'
            + '<div class="modal-dialog ">'
            + '<div class="modal-content">'
            + '<div class="modal-body">' + settings.text + '</div>'
            + '<div class="modal-footer">' + buttons + '</div>'
            + '</div>';
            + '</div>';
            + '</div>';



        var modal = $(modalHTML);

        modal.on('shown', function () {
            modal.find(".btn-primary:first").focus();
        });
        modal.on('hidden', function () {
            modal.remove();
        });
        modal.find(".confirm").click(function (e) {
            var confirmButton = $(this);
            confirmButton.hide()
            settings.confirm(/*settings.button*/confirmButton);
        });
        modal.find(".cancel").click(function (e) {
            settings.cancel(settings.button);
        });

        // Show the modal
        $("body").append(modal);
        modal.modal();
    }

})(jQuery);
