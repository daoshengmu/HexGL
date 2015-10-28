
// TODO: 1. To setup connection while server reload 2. ip insert via app.

function runClient() {
	var socket = navigator.mozTCPSocket.open('192.168.137.101', 8088);
	var isConnected = false;
	var connectedSocket = null; // replace it with socket?
	var active = true;
	var stickMargin = 0;
	var stickID = -1;
	var stickPos = new Vec2(0, 0);
	var stickStartPos = new Vec2(0, 0);
	var stickVector = new Vec2(0, 0);

	socket.ondata = function (evt) {

		stickMargin = window.innerWidth * 0.5;
		document.getElementById("text").innerHTML += evt.data + "\n";

		if (typeof evt.data !== 'string') {
			return;
		}

		data = evt.data.split(',');
		var ack;

		switch(data[0]) {
			case 'HANDSHAKE':
			connectedSocket = evt.target;
			ack = 'ACK,from ' + socket.host;
			active = true;
			break;
		}

		evt.target.send(data);	// target is server socket.
	}

	socket.onopen = function() { 
		document.getElementById("text").innerHTML = "got client open\n";
		console.log("got client open"); 
		console.log("stickMargin is " + stickMargin);
		isConnected = true;
	}

	window.addEventListener('touchstart', function(evt) {
		touchStart(evt);
	}, false);

	window.addEventListener('touchmove', function(evt) {
		touchMove(evt);
	}, false);
	  
	window.addEventListener('touchend', function(evt) {
		touchEnd(evt);
	}, false);

	function touchStart(evt) {

		console.log("touchStart func...");
		var touch, _i, _len, _ref;
		if (!active) {
			return;
		}

		_ref = evt.changedTouches;
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			touch = _ref[_i];
			if (stickID < 0 && touch.clientX < stickMargin) {
			  	stickID = touch.identifier;
			  	stickStartPos.set(touch.clientX, touch.clientY);
			  	stickPos.copy(stickStartPos);
			  	stickVector.set(0, 0);

			  	var data = "MOVE," + stickVector.x.toString() + "," + stickVector.y.toString();
				sendDataToServer(data);
				continue;
			} else {
				var data = "FORWARD," + 1;
				console.log("Btn clock forward true");
				sendDataToServer(data);
			}
		}
		touches = evt.touches;
		return false;
	}

	function touchMove(evt) {
		console.log("touchMove func...");
		var touch, _i, _len, _ref;
		evt.preventDefault();

		if (!active) {
			return;
		}
		_ref = evt.changedTouches;
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			touch = _ref[_i];
			if (stickID === touch.identifier && touch.clientX < stickMargin) {
				stickPos.set(touch.clientX, touch.clientY);
				stickVector.copy(stickPos).substract(stickStartPos);

				var data = "MOVE," + stickVector.x.toString() + "," + stickVector.y.toString();
				console.log("Move data is " + data);
				sendDataToServer(data);
				break;
			}
		}
		touches = evt.touches;
		return false;
	}

	function touchEnd(evt) {
		console.log("touchEnd func...");
		var touch, _i, _len, _ref;
		if (!active) {
			return;
		}
		this.touches = evt.touches;
		_ref = evt.changedTouches;
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			touch = _ref[_i];
			if (stickID === touch.identifier) {
			  	stickID = -1;
				stickVector.set(0, 0);

				var data = "MOVE," + stickVector.x.toString() + "," + stickVector.y.toString();
				sendDataToServer(data);
			  break;
			 } 
			 else {
				var data = "FORWARD," + 0;
				console.log("Btn clock forward false");
				sendDataToServer(data);
			}
		}

		return false;
	}

	function sendDataToServer(data) {
		connectedSocket.send(data);
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
