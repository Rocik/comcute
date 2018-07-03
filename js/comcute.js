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
        loader.setFailureEvent(resetUI);
        loader.registerAndGetModule();

        $('#comcute-start').css("display", "none");
        $('#comcute-stop').removeAttr("style");
        $('#progressbar').addClass('expanded').removeClass('collapsed');
        $('#sim-canvas').css('display', 'none');
        $('#computing-status').addClass('visible').removeClass('hidden');
        $('#text-status').html(Comcute.messages.awaitingData);
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
