
// Myrtille support
//
// This provides a communication proxy for the IE Tab container page to communicate
// with the network object in the service worker
//
var NetworkProxy = {
    /*
    prefixes (3 chars) are used to serialize commands with strings instead of numbers
    they make it easier to read log traces to find out which commands are issued
    they must match the prefixes used server side
    */
    commandEnum :
    {
        // connection
        SEND_SERVER_ADDRESS: { value: 0, text: 'SRV' },
        SEND_VM_GUID: { value: 1, text: 'VMG' },
        SEND_USER_DOMAIN: { value: 2, text: 'DOM' },
        SEND_USER_NAME: { value: 3, text: 'USR' },
        SEND_USER_PASSWORD: { value: 4, text: 'PWD' },
        SEND_START_PROGRAM: { value: 5, text: 'PRG' },
        CONNECT_CLIENT: { value: 6, text: 'CON' },

        // browser
        SEND_BROWSER_RESIZE: { value: 7, text: 'RSZ' },

        // keyboard
        SEND_KEY_UNICODE: { value: 8, text: 'KUC' },
        SEND_KEY_SCANCODE: { value: 9, text: 'KSC' },

        // mouse
        SEND_MOUSE_MOVE: { value: 10, text: 'MMO' },
        SEND_MOUSE_LEFT_BUTTON: { value: 11, text: 'MLB' },
        SEND_MOUSE_MIDDLE_BUTTON: { value: 12, text: 'MMB' },
        SEND_MOUSE_RIGHT_BUTTON: { value: 13, text: 'MRB' },
        SEND_MOUSE_WHEEL_UP: { value: 14, text: 'MWU' },
        SEND_MOUSE_WHEEL_DOWN: { value: 15, text: 'MWD' },

        // control
        SET_SCALE_DISPLAY: { value: 16, text: 'SCA' },
        SET_RECONNECT_SESSION: { value: 17, text: 'RCN' },
        SET_IMAGE_ENCODING: { value: 18, text: 'ECD' },
        SET_IMAGE_QUALITY: { value: 19, text: 'QLT' },
        SET_IMAGE_QUANTITY: { value: 20, text: 'QNT' },
        SET_AUDIO_FORMAT: { value: 21, text: 'AUD' },
        SET_AUDIO_BITRATE: { value: 22, text: 'BIT' },
        SET_SCREENSHOT_CONFIG: { value: 23, text: 'SSC' },
        START_TAKING_SCREENSHOTS: { value: 24, text: 'SS1' },
        STOP_TAKING_SCREENSHOTS: { value: 25, text: 'SS0' },
        TAKE_SCREENSHOT: { value: 26, text: 'SCN' },
        REQUEST_FULLSCREEN_UPDATE: { value: 27, text: 'FSU' },
        REQUEST_REMOTE_CLIPBOARD: { value: 28, text: 'CLP' },
        CLOSE_CLIENT: { value: 29, text: 'CLO' }
    },

    getCommandEnum: function() { return this.commandEnum; },

    send: function(data, excludeImg) {
        chrome.runtime.sendMessage({
            type: 'RH_NETWORK_SEND',
            data: data,
            excludeImg: excludeImg
        })
    },

    processUserEvent: function(event, data) {
        chrome.runtime.sendMessage({
            type: 'RH_NETWORK_PROCESSUSEREVENT',
            event: event,
            data: data
        });
    }
}

