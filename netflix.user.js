// ==UserScript==
// @name       Netflix ScrubRub
// @match      *://www.netflix.com/WiPlayer?*
// @author Stuart P. Bentley
// ==/UserScript==

(function(){
var nfi;

if (typeof netflix != 'undefined') {
  if (netflix.cadmium) {
    nfi = {
      player: netflix.cadmium.objects.videoPlayer(),
      imageRoot: netflix.cadmium.metadata.getActiveVideo().progressImageRoot
    };
  }
}

if (nfi) {
  initScrubRub(nfi);
}

function initScrubRub(nfi) {
  var np = document.getElementById("netflix-player");
  var vp = nfi.player;
  var imgroot = nfi.imageRoot;
  function getFrame(t) {
    t = Math.floor(t/10000).toString(10);
    var f = '00000'.slice(t.length)+t;
    return imgroot + f + '.jpg';
  }
  var filmstrip = document.createElement('div');
  filmstrip.style.display = 'flex';
  filmstrip.style.justifyContent = 'center';
  filmstrip.style.alignItems = 'center';
  filmstrip.style.overflow = 'hidden';
  filmstrip.style.opacity = 0;
  filmstrip.hidden = true;
  filmstrip.style.backgroundColor = 'rgba(0,0,0,0.5)';
  filmstrip.style.zIndex = 1000;
  filmstrip.style.position = 'absolute';
  filmstrip.style.top = 0;
  filmstrip.style.left = 0;
  filmstrip.style.bottom = 0;
  filmstrip.style.right = 0;
  filmstrip.style.pointerEvents = 'none';
  
  var thumb = document.createElement('img');
  filmstrip.appendChild(thumb);

  var originTime = 0;
  var lastTouchId = null;
  var lastTouchX = null;
  var totalDelta = 0;
  var currentDelta = 0;
  var wasPaused;
  
  function targetTime() {
    return originTime - totalDelta * 5;
  }
  
  function selectTouch(touch) {
    totalDelta += currentDelta;
    lastTouchId = touch.identifier;
    lastTouchX = touch.clientX;
    currentDelta = 0;
  }
  
  function startRub(evt) {
    if (!vp.getBusy()) {
      wasPaused = vp.getPaused();
      vp.pause();
      originTime = vp.getCurrentTime();
      totalDelta = 0;
      currentDelta = 0;
      selectTouch(evt.touches[0]);
      thumb.src = getFrame(originTime);
      filmstrip.style.opacity = 1;
      filmstrip.hidden = false;
    }
  }
  
  function endRub(evt) {
    if (!vp.getBusy()) {
      lastTouchId = null;
      lastTouchX = null;
      filmstrip.style.opacity = 0;
      filmstrip.hidden = true;
      vp.seek(targetTime());
      // it seems sometimes wasPaused can get set to true during playback
      // when scrubbing, inadvertantly putting us into a paused state
      // so for now, just always resume
      if(!wasPaused || true) {
        vp.play();
      }
    }
  }
  
  function upRub(evt) {
    thumb.src = getFrame(targetTime());
  }
  
  function touchStart(evt) {
    if (!lastTouchId) {
      startRub(evt);
    }
    evt.preventDefault();
  }
  
  function touchStop(evt) {
    if (evt.touches.length == 0) {
      totalDelta += currentDelta;
      endRub(evt);
    } else {
      selectTouch(touches[0]);
    }
    evt.preventDefault();
  }
  
  function touchMove(evt) {
    var touch = evt.touches[0];
    if (touch.identifier == lastTouchId) {
      currentDelta = touch.clientX - lastTouchX;
    }
    else {
      selectTouch(touch);
    }
    upRub();
    evt.preventDefault();
  }
  
  np.appendChild(filmstrip);
  np.addEventListener('touchstart', touchStart, true);
  np.addEventListener('touchend', touchStop, true);
  np.addEventListener('touchleave', touchStop, true);
  np.addEventListener('touchcancel', touchStop, true);
  np.addEventListener('touchmove', touchMove, true);
}
})()
