$(document).ready(function() {
    'use strict';

    const loader = new Loader();

    function resetUI() {
        $('#comcute-start').removeAttr("style");
        $('#comcute-stop').css("display", "none");
        $('#progressbar').addClass('collapsed').removeClass('expanded');
        $('.progress').css("width", "0%");
        $('#computing-status').addClass('hidden').removeClass('visible');
    }

    $('#comcute-start').click(function() {
        $('#comcute-start').css("display", "none");
        $('#comcute-stop').removeAttr("style");
        $('#progressbar').addClass('expanded').removeClass('collapsed');
        loader.setFailureEvent(resetUI);
        loader.registerAndGetModule();
    });

    $('#comcute-stop').click(function() {
        resetUI();
        loader.unregister();
    });

    $('#more-less').click(function() {
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
}());
