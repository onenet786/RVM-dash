/*
 *  Google Analytics Tracking of extension data and events
 */


var GATracking = {
    FIRSTRUN_KEY: "GATrackingFirstRun",
    DAILYLASTHIT_KEY: "GATrackingDailyLastHit",
    ONEDAY_MS: 86400000,
    _category: 'IE Tab Events',

    init: function() {
        chrome.alarms.onAlarm.addListener(GATracking.onAlarm.bind(GATracking));
        
        this._onDailyPing = Background.onDailyPing.bind(Background);
        Background.waitForInit(() => {
            if (Background.isSessionStart) {
                this._checkDailyPing();
            }
        });
    },

    trackEvent: function(action, label, value) {
        // Log even to Analytics, once done, go to the link
        // ga('send', 'event', this._category, action, label, value);
    },

    trackEvents: function(arrEvents) {
        var arrCommands = [];
        for(var i=0; i<arrEvents.length; i++) {
            this.trackEvent(arrEvents[i].action, arrEvents[i].label, arrEvents[i].value);
        }
    },

    _getDayString: function(time) {
        var date = new Date(time);
        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    },


    _scheduleNextPingCheck: function() {
        var now = new Date();
        var nextCheckTime = new Date();
        nextCheckTime.setHours(0, 0, 0, 0); // Set to midnight
        nextCheckTime.setDate(nextCheckTime.getDate() + 1); // Move to tomorrow
        nextCheckTime.setTime(nextCheckTime.getTime() + Math.random() * (9 * 60 * 60 * 1000)) // Add 0-9 hours


        var delay = (nextCheckTime - now) / 60000; // Convert ms to minutes
        chrome.alarms.create('dailyPing', {
            delayInMinutes: delay
        });

    },
    

    onAlarm: function(alarm) {
        if ((alarm.name === 'dailyPing') && (Utils.inServiceWorker())) {
            Background.waitForInit(() => {
                console.log('dailyPing alarm');
                this._checkDailyPing();
            });
        }
    },

    _checkDailyPing: function() {
        console.log('Checking daily ping: ' + (new Date()));
        var now = (new Date()).getTime();
        var thisDay = this._getDayString(now);

        var lastHit = oldStorage[this.DAILYLASTHIT_KEY];
        lastHit = lastHit ? JSON.parse(lastHit) : 0;
        var lastDay = this._getDayString(lastHit);
        if(thisDay != lastDay) {
            oldStorage.set(this.DAILYLASTHIT_KEY, JSON.stringify(now));

            if(this._onDailyPing) {
                this._onDailyPing();
            }
        }

        this._scheduleNextPingCheck();        
    }
}

GATracking.init();

