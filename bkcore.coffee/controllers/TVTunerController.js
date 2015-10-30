// Generated by CoffeeScript 1.6.3
/*
  TVTunerController (Orientation + buttons) for touch devices

  @class bkcore.TVTunerController
  @author Mahesh Kulkarni <http://twitter.com/maheshkk>
*/


(function() {
  var TVTunerController, exports, _base;
  var self;
  var socketListener;

  TVTunerController = (function() {

    var sockets = [];
    var isDestroy = false;

    TVTunerController.isCompatible = function() {
      return true;
    };

    /*
      Creates a new TVTuner
    */
    function TVTunerController(domElement, keyPressCallback) {
      self = this;
      this.keyPressCallback = keyPressCallback;
      this.stickVector = { x: 0, y: 0 };
      this.beta = 0;
      this.active = true;

      domElement.addEventListener('keydown', onKeyDown, false);
      domElement.addEventListener('keyup', onKeyUp, false);

      constructSocketListen();
    }

    TVTunerController.prototype.destroy = function() {
      isDestroy = true;
    }

    TVTunerController.prototype.closeConnection = function() {
      sockets.forEach(function(s) {
        var data = 'BYE';
        s.send(data);
      });

      sockets = [];
      socketListener.close();
    }

    function onKeyDown(event) {

      switch(event.keyCode)
      {
        case 50: case 98: case 38: /*up*/ this.forward = true; break;

        case 56: case 104: case 40: /*down*/this.backward = true; break;

        case 52: case 100: case 37: /*left*/this.left = true; break;

        case 54: case 102: case 39: /*right*/this.right = true; break;

        // case 81: /*Q*/this.ltrigger = true; break;
        // case 65: /*A*/this.ltrigger = true; break;

        // case 68: /*D*/this.rtrigger = true; break;
        // case 69: /*E*/this.rtrigger = true; break;
      }

      self.keyPressCallback(this);
    }

    function onKeyUp(event) {

      switch(event.keyCode)
      {
        case 50: case 98: case 38:/*up*/ this.forward = false; break;

        case 56: case 104: case 40:/*down*/this.backward = false; break;

        case 52: case 100: case 37:/*left*/this.left = false; break;

        case 54: case 102: case 39:/*right*/this.right = false; break;

        // case 81: /*Q*/this.ltrigger = false; break;
        // case 65: /*A*/this.ltrigger = false; break;

        // case 68: /*D*/this.rtrigger = false; break;
        // case 69: /*E*/this.rtrigger = false; break;
      }

      self.keyPressCallback(this);
    }

    // Reload window we need to reconnect the connection?
    function constructSocketListen() {
      socketListener = navigator.mozTCPSocket.listen(8088);

      socketListener.onconnect = socketConnect;
     // socketListener.onclose = socketClose;  // No onclose on TV
    }

    function socketConnect(evt) {
      var success = "HANDSHAKE,Connect to server success.";

      console.log("connect success...");

      if (evt.socket !== undefined) {
        sockets.push(evt.socket);
        evt.socket.send(success);
        evt.socket.ondata = socketReceive;
      } 
      else {  // On TV b2g 2.2, socket is undefined.
        sockets.push(evt);
        evt.send(success);
        evt.ondata = socketReceive;
      }
    }

    function socketReceive(evt) {
      if (typeof evt.data !== 'string') {
        return;
      }

      var data = evt.data.split(",");
      switch(data[0]) {

        case 'MOVE':
          console.log("MOVE data " + data[1]);
          
          if (!isNaN(data[1]))  // deviceOrientation have some noise. To filter.
            self.beta = Number(data[1]);
        break;

        case 'FORWARD':

          if (isDestroy) {
            self.closeConnection();
            isDestroy = false;
            window.location.reload();
          }

          if (data[1] === '1') {
            console.log("Receive FORWARD event");
            this.forward = true;
          }
          else if (data[1] === '0') {
            console.log("Receive STOP event");
            this.forward = false;
          }

          self.keyPressCallback(this);

        break;
      }
    }

    function socketClose(evt) {
      console.log("socket is closed....");
    }

    return TVTunerController;

  })();

  exports = exports != null ? exports : this;

  exports.bkcore || (exports.bkcore = {});

  (_base = exports.bkcore).controllers || (_base.controllers = {});

  exports.bkcore.controllers.TVTunerController = TVTunerController;

}).call(this);
