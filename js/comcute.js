"use strict";
jQuery(document).ready(function($) {
    var infoId = '#comcute';
    var logger = new Logger();
    logger.infoId = infoId;
    var jsL = new Loader({
        infoId: infoId,
        logger: logger
    });

    $('#comcute-start').click(function(event) {
        $('#comcute-start').css("display", "none");
        $('#comcute-stop').removeAttr("style");
        $('#progressbar').addClass('expanded').removeClass('collapsed');
        jsL.registerAndGetModule();
    });

    $('#comcute-stop').click(function(event) {
        $('#comcute-start').removeAttr("style");
        $('#comcute-stop').css("display", "none");
        $('#progressbar').addClass('collapsed').removeClass('expanded');
        jsL.unregister();
    });

    $('#more-less').click(function(event) {
        if ($('#more-less').hasClass('less')) {
            $('#more-less').removeClass('less');
            $('#line').removeClass('less');
            $('.page-content').removeClass('more');
            $('#panel').removeClass('hidden');
        } else {
            $('#more-less').addClass('less');
            $('#line').addClass('less');
            $('.page-content').addClass('more');
            $('#panel').addClass('hidden');
        }
    });
}(jQuery));
