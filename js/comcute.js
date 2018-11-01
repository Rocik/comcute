---
---
'use strict';

{% include_relative ww.js %}
{% include_relative comcute/fake-server.js %}
{% include_relative comcute/server.js %}
{% include_relative comcute/runner.js %}
{% include_relative comcute/loader.js %}
{% include_relative comcute/user-settings.js %}
{% include_relative comcute/ui.js %}

{% include_relative comcute/collatz-intervals.js %}
{% include_relative comcute/fire.js %}
{% include_relative comcute/mersenne.js %}

window.onload = function() {
    const ui = new UI();
    ui.setup();
};
