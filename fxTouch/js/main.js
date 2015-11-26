(function(exports) {

  var gControllerStage = new ControllerStage();
  var gNetworkStage = new NetworkStage();
  var gConn = null;
  var gRequest = null;

  function changeStage(stageName) {
    switch (stageName) {
    case "connection":
      var selectedDiv;

      selectedDiv = document.getElementById('connectionBox');
      selectedDiv.style.display = 'block';

      selectedDiv = document.getElementById('controllerBox');
      selectedDiv.style.display = 'none';

      break;
    case "controller":
      var selectedDiv;

      selectedDiv = document.getElementById('connectionBox');
      selectedDiv.style.display = 'none';

      selectedDiv = document.getElementById('controllerBox');
      selectedDiv.style.display = 'block';

      break;
    default:
      console.warn("There's no such stage: " + stageName);
      break;
    }
  }

  // Handle network connection
  function NetworkStage() {

    var presentationConn = null;

    function setupConnectionCallback(conn) {
      console.log('setupConnectionCallback...');

      if (conn) {
        conn.onstatechange = function() {
          switch (conn.state) {
          case "closed":
            console.log("closed...");

            gControllerStage.exit();
            changeStage("connection");
            break;

          case "terminated":
            console.log("terminated...");

            gControllerStage.exit();
            changeStage("connection");
            break;

          case "connected":
            conn.send("say hello");
            console.log("connected...");
            break;

          default:
            console.warn("This should not happend, connection state is: " + conn.state);
            break;
          }
        };

        // register message handler
        conn.onmessage = function (evt) {
          console.log("receive message", evt.data);
        };
      }
    }

    function closeExistedConnection() {
      console.log("closeExistedConnection...");
      presentationConn && presentationConn.terminate();
    }

    function onAvailabilityChange(state) {
      console.log( 'handleAvailabilityChange is ', state);
    }

    this.setupPresentation = function() {
      function promiseHandle(resolve, reject) {
        gRequest = gRequest || new PresentationRequest('app://hexgl.gaiamobile.org/index.html');

        gRequest.getAvailability()
          .then((availability) => {
            var self = this;

            console.log('getAvailability...1');

            // Start new presentation.
            gRequest.start()
              .then((conn) => {
                console.log("connected");

                closeExistedConnection();
                setupConnectionCallback(conn);
                presentationConn = conn;
                gConn = conn;

                resolve(conn);
              })
              .catch((exception) => {
                var errMsg = 'connection error: ' + exception;

                reject(errMsg);
              });

            availability.onchange = function() { onAvailabilityChange(this.value); };
          })
          .catch(() => {
            console.log('getAvailability...2');
            onAvailabilityChange(true);
            reject("not support");
          });
      }

      return new Promise(promiseHandle);
    }
  };

  function ControllerStage() {
    var dalpha = null, dbeta = null, dgamma = null;
    var alpha = null, beta = null, gamma = null;

    this.init = function() {
      this._deviceOrientation = this._deviceOrientation.bind(this);
      this._touchStart = this._touchStart.bind(this);
      this._touchEnd = this._touchEnd.bind(this);
    }

    this.enter = function() {
      window.addEventListener('deviceorientation', this._deviceOrientation);
      window.addEventListener('touchstart', this._touchStart);
      window.addEventListener('touchend', this._touchEnd);
    }

    this.exit = function() {
      window.removeEventListener('deviceorientation', this._deviceOrientation);
      window.removeEventListener('touchstart', this._touchStart);
      window.removeEventListener('touchend', this._touchEnd);
    }

    this._deviceOrientation = function(evt) {
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

      if (gConn) {
        gConn.send(data);
      }

      return false;
    }

    this._touchStart = function(evt) {
      console.log("touchStart func...");

      var data = "FORWARD," + 1;
      console.log("Btn clock forward true");

      if (gConn) {
        gConn.send(data);
      }

      return false;
	  }

	  this._touchEnd = function(evt) {
		  console.log("touchEnd func...");

		  var data = "FORWARD," + 0;
		  console.log("Btn clock forward false");

      if (gConn) {
        gConn.send(data);
      }

      return false;
	  }
  };

  window.onload = function() {
    function tryConnect() {
	    gNetworkStage.setupPresentation()
        .then((conn) => {
          changeStage("controller");

          gControllerStage.setSendFunc(gConn.send);
          gControllerStage.enter();

          console.log("connection success");
        })
        .catch((err) => {
          console.log(err);
        });
    }

    gControllerStage.init();
    changeStage("connection");

	  document.getElementById('enterBtn').onclick = tryConnect;
  }

}(window));
