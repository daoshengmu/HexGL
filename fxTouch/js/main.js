
// TODO: 1. To setup connection while server reload 2. ip insert via app.

function runClient() {
	var ipAddress = '10.247.37.144';
	var port = 8088;
	var socket = navigator.mozTCPSocket.open(ipAddress, port);
	var isConnected = false;
	var connectSocket = null; // replace it with socket?
	var active = false;
	var stickMargin = 0;
	var stickID = -1;
	var stickPos = new Vec2(0, 0);
	var stickStartPos = new Vec2(0, 0);
	var stickVector = new Vec2(0, 0);

	var dalpha = null, dbeta = null, dgamma = null;
	var alpha = null, beta = null, gamma = null;

	socket.ondata = socketOnData;
	socket.onopen = socketOnOpen;
	socket.onclose = socketOnClose;
	socket.onerror = socketOnError;

	window.addEventListener('deviceorientation', function(evt) {
		deviceOrientation(evt);
    }, false);

	window.addEventListener('touchstart', function(evt) {
		touchStart(evt);
	}, false);
	  
	window.addEventListener('touchend', function(evt) {
		touchEnd(evt);
	}, false);

	function socketOnData(evt) {
		stickMargin = window.innerWidth * 0.5;
		document.getElementById("text").innerHTML += evt.data + "\n";

		if (typeof evt.data !== 'string') {
			return;
		}

		data = evt.data.split(',');

		switch(data[0]) {
			case 'HANDSHAKE':

				if (retryConnection) {	// clear retry connection.
					clearInterval(retryConnection);
				}

				connectSocket = evt.target;
				console.log('connect from ' + socket.host);
				active = true;
			break;

			case 'BYE':
				connectSocket = null;
				active = false;
				socket.close();
				return;
			break;
		}

		evt.target.send(data);	// target is server socket.
	}

	function socketOnOpen(evt) {
		document.getElementById("text").innerHTML = "got client open\n";
		console.log("got client open"); 
		console.log("stickMargin is " + stickMargin);
		isConnected = true;
		active = true;
	}

	var retryConnection = null;

	function socketOnClose(evt) {
		// Retry connnect to server
		retryConnection = setInterval( function() {
		 	retrySocket();			
		}, 3000 );

		function retrySocket() {
			socket = navigator.mozTCPSocket.open(ipAddress, port);
			socket.ondata = socketOnData;
			socket.onopen = socketOnOpen;
			socket.onclose = socketOnClose;
			socket.onerror = socketOnError;

			clearInterval(retryConnection);
			retryConnection = null;			
		}
	}

	function socketOnError(evt) {
		console.error(evt.data);
	}

	function deviceOrientation(evt) {
		if (!active) {
			return;
		}

		if (dalpha === null) {
			dalpha = evt.alpha;
			dbeta = evt.beta;
			dgamma = evt.gamma;
		}

		alpha = evt.alpha - dalpha;
		beta = evt.beta - dbeta;
		gamma = evt.gamma - dgamma;

		var data = "MOVE," + beta.toString();
		console.log("Move data is " + data);
		sendDataToServer(data);
		return false;
	}

	function touchStart(evt) {

		console.log("touchStart func...");
		if (!active) {
			return;
		}

		var data = "FORWARD," + 1;
		console.log("Btn clock forward true");
		sendDataToServer(data);

		return false;
	}

	function touchEnd(evt) {
		console.log("touchEnd func...");
		if (!active) {
			return;
		}
		var data = "FORWARD," + 0;
		console.log("Btn clock forward false");
		sendDataToServer(data);

		return false;
	}

	function sendDataToServer(data) {
		if (connectSocket)
			connectSocket.send(data);
	}

	function reconnectToServer() {
		socket = navigator.mozTCPSocket.open(ipAddress, port);
	}
}

/*
	Internal class used for vector2
	@class Vec2
	@private
   */

Vec2 = (function() {
	function Vec2(x, y) {
	  this.x = x != null ? x : 0;
	  this.y = y != null ? y : 0;
	}

	Vec2.prototype.substract = function(vec) {
	  this.x -= vec.x;
	  this.y -= vec.y;
	  return this;
	};

	Vec2.prototype.copy = function(vec) {
	  this.x = vec.x;
	  this.y = vec.y;
	  return this;
	};

	Vec2.prototype.set = function(x, y) {
	  this.x = x;
	  this.y = y;
	  return this;
	};

	return Vec2;

})();

window.onload = function() {
	runClient();
}
