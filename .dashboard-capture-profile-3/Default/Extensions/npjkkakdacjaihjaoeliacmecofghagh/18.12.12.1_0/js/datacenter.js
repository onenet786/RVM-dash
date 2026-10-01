/*
 *
 * datacenter.js
 *
 * Manages data center selection
 *
 */

var Datacenter = {
    DATACENTERS: {
        'us-east-1' : null,
        'us-west-1' : null,
        'eu-west-3' : null
    },
    
    _currentDC: null,

    _currentTimeMillis() {
        return (new Date()).getTime();
    },

    _pingEndpoint: function(region, endpoint, img, onPingComplete) {
        console.log('pingEndpoint');
        var randomString = Math.floor(Math.random()*0xFFFFFFFFFFFFFFFF).toString(36);
        var targetUrl = endpoint + "/ping?x=" + randomString;
        if (img.prevErrorListener)
            img.removeEventListener('error', img.prevErrorListener);
        img.prevErrorListener = onPingComplete;
        img.addEventListener('error', onPingComplete);
        img.setAttribute('src', targetUrl);
    },
    
    _step1Connect: function(region, endpoint, img, onFinished) {
        console.log('step1Connect');
        this._pingEndpoint(region, endpoint, img, function() { this._step2Ping(region, endpoint, img, onFinished); }.bind(this));
    },
    
    _step2Ping: function( region, endpoint, img, onFinished) {
        console.log('step2Ping');
        var startTime = this._currentTimeMillis();
        this._pingEndpoint(region, endpoint, img, function() { this._step3Finish(startTime, region, endpoint, img, onFinished); }.bind(this));
    },
    
    _step3Finish: function(startTime, region, endpoint, img, onFinished) {
        var endTime = this._currentTimeMillis();
        var elapsed = endTime - startTime;
        document.body.removeChild(img);
        this.DATACENTERS[region] = elapsed;
        if (!this._currentDC || (this._currentDC[1] > elapsed)) {
            this._currentDC = [ region, elapsed ];
        }
        for (var region in this.DATACENTERS) {
            if (!this.DATACENTERS[region])
                return;
        }
        // We have a value for all datacenters, so we are done
        IETAB.Storage.set('current-dc', this._currentDC);
        if (onFinished) {
            onFinished();
        }
    },

    refreshDC: function(onFinished) {
        console.log('refreshDatacenter');
        var img;
        var endpoint;
        for (var region in this.DATACENTERS)  {
            endpoint = 'https://dynamodb.' + region + '.amazonaws.com';
            img = document.createElement('img');
            img.id = region;
            document.body.appendChild(img);
            this._step1Connect(region, endpoint, img, onFinished);
        }
    },

    getCurrentDC: function() {
        return 'us-east-1';
    },

    _init: function () {
    }
}

Datacenter._init();