
// TODO: 1. To setup connection while server reload 2. ip insert via app.

function runClient() {
	var ipAddress = document.getElementById('ipAddress').value;
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
				isConnected = true;
			break;

			case 'BYE':
				connectSocket = null;
				isConnected = false;
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
		if (!active)
			return; // Initial connect fail. Don't do retry

		console.log("retry connection......");
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
		console.error(evt.type + ': ' + evt.name);
		evt.target.close();
	}

	function deviceOrientation(evt) {
		if (!isConnected) {
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
		if (!isConnected) {
			return;
		}

		var data = "FORWARD," + 1;
		console.log("Btn clock forward true");
		sendDataToServer(data);

		return false;
	}

	function touchEnd(evt) {
		console.log("touchEnd func...");
		if (!isConnected) {
			return;
		}
		var data = "FORWARD," + 0;
		console.log("Btn clock forward false");
		sendDataToServer(data);

		return false;
	}

	function sendDataToServer(data) {
		if (connectSocket) {
			if (connectSocket.readyState == 'closed') {
				connectSocket.close();		// Return back to home screen
				return;
			}

			connectSocket.send(data);
		}
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

// Initial UI and layout
function InitialStage() {
	var ipAddress = document.getElementById('ipAddress').value;
	var socket = null;
	var network = new NetworkStage(this);

	this.connectToServer = function() {
		network.setupConnection(ipAddress);
		network.logOnInitial = this.logMessage;
	}

	this.showStage = function() {
		var s = document.getElementsByClassName('initialStage');
		var i;
		for (i = 0; i < s.length; i++) {
			s[i].style.display = 'block';
		}
		
		s = document.getElementsByClassName('gameStage');
		for (i = 0; i < s.length; i++) {
			s[i].style.display = 'none';
		}
	}

	this.logMessage = function(log) {
		console.log(log);
		document.getElementById("text").innerHTML = log;
	}
};

// Handle network connection
function NetworkStage(initStage) {

	var ipAddress = '';
	var port = 8088;
	var game = null;
	var isConnected = false;
	var active = false;
	var self = this;
	var initialStage = initStage;
	var retryConnection = null;

	this.logOnInitial = null;

	this.setupConnection = function(ip) {
		ipAddress = ip;
		socket = navigator.mozTCPSocket.open(ipAddress, port);

		socket.ondata = socketOnData;
		socket.onopen = socketOnOpen;
		socket.onclose = socketOnClose;
		socket.onerror = socketOnError;
	}

	function socketOnData(evt) {
		self.logOnInitial(evt.data);

		if (typeof evt.data !== 'string') {
			return;
		}

		data = evt.data.split(',');

		switch(data[0]) {
			case 'HANDSHAKE':

				if (retryConnection) {	// clear retry connection.
					clearInterval(retryConnection);
					retryConnection = null;
				}

				connectSocket = evt.target;
				console.log('connect success from ' + socket.host);
				self.logOnInitial('connect success from ' + socket.host);
				active = true;
				isConnected = true;
				game = new GameStage();
				game.showStage();
				game.init(sendDataToServer);
			break;

			case 'BYE':
				connectSocket = null;
				isConnected = false;
				game.terminate();
				game = null;
				self.logOnInitial('connect BYE from ' + socket.host);
				socket.close();
				return;
			break;
		}

		evt.target.send(data);	// target is the server socket.
	}

	function sendDataToServer(data) {
		if (connectSocket) {
			if (connectSocket.readyState === 'closed') {
				connectSocket.close();		// Return back to home screen
				return;
			}

			connectSocket.send(data);
		}
	}

	function socketOnOpen(evt) {
		self.logOnInitial("got client open");
		isConnected = true;
		active = true;
	}

	function socketOnClose(evt) {
		// Retry connnect to server
		if (!active)
			return; // Initial connect fail. Don't do retry

		initialStage.showStage();
		self.logOnInitial("retry connection......\n");
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
		initialStage.showStage();
		console.error(evt.type + ': ' + evt.name);
		self.logOnInitial(evt.type + ': ' + evt.name);
		evt.target.close();
	}

};

function GameStage() {

	var sendDataToServer = null;	// send data socket callback

	var dalpha = null, dbeta = null, dgamma = null;
	var alpha = null, beta = null, gamma = null;

	this.init = function(dataFunc) {
		sendDataToServer = dataFunc;

		window.addEventListener('deviceorientation', function(evt) {
			deviceOrientation(evt);
	    }, false);

		window.addEventListener('touchstart', function(evt) {
			touchStart(evt);
		}, false);
		  
		window.addEventListener('touchend', function(evt) {
			touchEnd(evt);
		}, false);
	}

	this.terminate = function() {
		window.removeEventListener('deviceorientation', deviceOrientation); 
		window.removeEventListener('touchstart', touchStart); 
		window.removeEventListener('touchend', touchEnd);

		sendDataToServer = null;
	}

	this.showStage = function() {
		var s = document.getElementsByClassName('gameStage');
		var i;
		for (i = 0; i < s.length; i++) {
			s[i].style.display = 'block';
		}
		
		s = document.getElementsByClassName('initialStage');
		for (i = 0; i < s.length; i++) {
			s[i].style.display = 'none';
		}
	}

	function deviceOrientation(evt) {
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

		if (sendDataToServer)
			sendDataToServer(data);
		return false;
	}

	function touchStart(evt) {
		console.log("touchStart func...");

		var data = "FORWARD," + 1;
		console.log("Btn clock forward true");

		if (sendDataToServer)
			sendDataToServer(data);

		return false;
	}

	function touchEnd(evt) {
		console.log("touchEnd func...");
		
		var data = "FORWARD," + 0;
		console.log("Btn clock forward false");

		if (sendDataToServer)
			sendDataToServer(data);

		return false;
	}
};

function runGame() {

	// Ping server
	// Success -> onOpen -> onData HandShake Jump to game state and listen events
		// disconnect -> remove listen, close sockets -> back to initial stage
	// Fail -> close socket.
	var initialStage = new InitialStage();
	initialStage.showStage();
	initialStage.connectToServer();
}

window.onload = function() {
	document.getElementById('enterBtn').onclick = runGame;
}

