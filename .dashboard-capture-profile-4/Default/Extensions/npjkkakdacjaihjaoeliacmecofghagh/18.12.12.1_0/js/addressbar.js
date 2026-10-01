/*
*    addressbar.js
*
*    Handles functionality for the address bar in the container page
*
 */
var AddressBar = {
    onAddressEnter: function() {
        // Navigate the top frame so this navigation gets into the history and the
        // back / forward queue
        var url = $('#address-box').val();
        IEContainer.navigateContainer(url);
    },

    onReturnToChrome: function() {
        IEContainer.onReturnToChrome();
    },
    
    addEventListeners: function() {
        $('#address-box').keypress(function(e) {
            if(e.which == 13) {
                this.onAddressEnter();
            }
        }.bind(this));

        $('#go-btn-anchor').click(function(e) {
            this.onAddressEnter();
            e.preventDefault();
        }.bind(this));

        $('#address-box').focus(function() {
            window.setTimeout(function() {
                $('#address-box').select();
            }, 100);
        });

        $('#debug-btn').click(function(e) {
            e.preventDefault();
            IEContainer.onOpenDebugger();
        });

        $('#close-btn').click(function(e) {
            this.onReturnToChrome();
            e.preventDefault();
        }.bind(this));
    },

    initCompatMode: function() {
        var mode = Settings.get('compat-mode');

        // Strip the 'S' or 'F' indicator and add a space after 'IE'
        mode = mode.slice(0, -1);
        mode = mode.replace('IE', 'IE ');
        $('#compat-mode-str').text(mode);

        $('#compat-mode').css('display', 'inline-block');
        $('#address-text').css('display', 'none');

        $('#current-compat-mode').click(function() {
            document.getElementById('compat-selector').classList.toggle('show');
        });
        $(window).click(function(e) {
            if (!document.getElementById('compat-mode').contains(e.target)) {
                document.getElementById('compat-selector').classList.remove('show');
            }
        });

        $('#compat-selector a').click(function(e) {
            var mode = e.target.id;
            BackgroundProxy.call2('setSetting', 'compat-mode', mode);
            window.setTimeout(() => {
                window.location.reload();
            }, 600);
        });
    },

    initRemoteHost: function() {
        this.initCompatMode();

    },

    init: function() {
        if (Settings.get('license-key')) {
            $('#btn-docs').attr('href', 'http://www.ietab.net/ie-tab-documentation?key=1');
        }

        // Hosted mode specific initialization
        if (Settings.get('use-remote-host')) {
            this.initRemoteHost();
        }

        this.addEventListeners();
    }
}

AddressBar.init();
