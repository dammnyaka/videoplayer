document.addEventListener("DOMContentLoaded", function () {
  const videoPlayer = document.getElementById("video");

  const currentPosition = document.getElementById("currentPosition");
  const targetPosition = document.getElementById("targetPosition");

  const playPauseButton = document.getElementById("playPauseButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const seekBar = document.getElementById("seekBar");
  const volume = document.getElementById("volume");
  const speedUp = document.getElementById("speed");
  const volumeRate = document.getElementById("volumeRate");
  const speedRate = document.getElementById("speedRate");
  const videoContainer = document.querySelector(".video-container");

  const veryLowResolution = document.getElementById("veryLowResolution");
  const lowResolution = document.getElementById("lowResolution");
  const mediumResolution = document.getElementById("mediumResolution");
  const hightResolution = document.getElementById("hightResolution");
  const veryHightResolution = document.getElementById("veryHightResolution");

  const videoStats = document.querySelector(".video-stats");
  const bufferSize = document.getElementById("bufferSize");
  const sizeStart = document.querySelector(".size-start");
  const sizeEnd = document.querySelector(".size-end");
  const level = document.querySelector(".level");

  const videoSrc = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  if (Hls.isSupported()) {
    let hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(videoPlayer);
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
      const qualityLevels = data.levels.map((level) => level.height);
      const metricsHTML = data.levels
        .map(
          (i) => `
      <div class="resolution-${i.height}">
        <strong>audioCodec</strong> ${i.audioCodec}
        <strong>bitrate</strong> ${i.bitrate}
        <strong>codecSet</strong> ${i.codecSet}
        <strong>height</strong> ${i.height}
      </div>
    `,
        )
        .join("");

      videoStats.innerHTML = metricsHTML;

      let currentResolutionElement = null;

      function switchResolution(value) {
        const className = `resolution-${value}`;
        const elementWithClass = document.querySelector(`.${className}`);
        if (currentResolutionElement) {
          currentResolutionElement.classList.remove("color");
        }
        elementWithClass.classList.add("color");
        currentResolutionElement = elementWithClass;

        beforeUnload();
        const resolutionIndex = qualityLevels.indexOf(value);
        hls.currentLevel = resolutionIndex;
        videoPlayer.play();
      }
      const resolutions = [
        { element: veryLowResolution, value: 184 },
        { element: lowResolution, value: 288 },
        { element: mediumResolution, value: 480 },
        { element: hightResolution, value: 720 },
        { element: veryHightResolution, value: 1080 },
      ];

      resolutions.forEach((resolution) => {
        resolution.element.addEventListener("click", () =>
          switchResolution(resolution.value),
        );
      });
    });

    hls.on(Hls.Events.BUFFER_APPENDED, function (event, data) {
      if ((data.type = "video")) {
        sizeStart.textContent = "start:" + data.chunkMeta.buffering.video.start;
        sizeEnd.textContent = "end:" + data.chunkMeta.buffering.video.end;
        level.textContent = "level:" + data.chunkMeta.level;
      }
    });

    window.addEventListener("beforeunload", beforeUnload);
    videoPlayer.addEventListener("loadedmetadata", loadedMetaData);
    videoPlayer.addEventListener("timeupdate", timeUpdate);
    videoPlayer.addEventListener("progress", updateBufferSize);

    speedUp.addEventListener("change", speedUpdate);
    playPauseButton.addEventListener("click", togglePlayPause);
    fullscreenButton.addEventListener("click", toggleFullscreen);
    seekBar.addEventListener("input", updateSeekBar);
    volume.addEventListener("input", volumeUpdate);
  } else {
    console.error("HLS.js is not supported");
  }

  function loadedMetaData() {
    targetPosition.textContent = formatTime(videoPlayer.duration);
    videoPlayer.playbackRate = speedUp.value;
    speedRate.textContent = speedUp.value;

    const storedVolume = window.localStorage.getItem("volume");
    if (storedVolume) {
      videoPlayer.volume = storedVolume;
      volume.value = storedVolume * 100;
      volumeRate.textContent = storedVolume * 100;
    } else {
      volumeRate.textContent = volume.value;
    }

    const storedSeekTime = window.localStorage.getItem("seekTime");
    if (storedSeekTime) {
      videoPlayer.currentTime = storedSeekTime;
    }
  }

  function beforeUnload() {
    window.localStorage.setItem("seekTime", videoPlayer.currentTime);
  }

  function timeUpdate() {
    currentPosition.textContent = formatTime(videoPlayer.currentTime);
    seekBar.value = calculatePercentage(
      videoPlayer.currentTime,
      videoPlayer.duration,
    );
  }

  function updateBufferSize() {
    if (videoPlayer.buffered.length > 0) {
      const loadedPercentage =
        (videoPlayer.buffered.end(0) / videoPlayer.duration) * 100;
      bufferSize.textContent = `${loadedPercentage.toFixed(2)}%`;
    }
  }

  function speedUpdate() {
    videoPlayer.playbackRate = speedUp.value;
    speedRate.textContent = videoPlayer.playbackRate;
  }

  function togglePlayPause() {
    videoPlayer.paused
      ? ((playPauseButton.textContent = "pause"), videoPlayer.play())
      : ((playPauseButton.textContent = "play"), videoPlayer.pause());
  }

  function toggleFullscreen() {
    const isFullscreen =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;

    if (!isFullscreen) {
      const requestFullscreen =
        videoContainer.requestFullscreen ||
        videoContainer.mozRequestFullScreen ||
        videoContainer.webkitRequestFullscreen ||
        videoContainer.msRequestFullscreen;
      if (requestFullscreen) {
        requestFullscreen.call(videoContainer);
      }
    } else {
      const exitFullscreen =
        document.exitFullscreen ||
        document.msExitFullscreen ||
        document.mozCancelFullScreen ||
        document.webkitExitFullscreen;
      if (exitFullscreen) {
        exitFullscreen.call(document);
      }
    }
  }

  function updateSeekBar() {
    const seekValue = seekBar.value;
    const newTime = (seekValue / 100) * videoPlayer.duration;
    videoPlayer.currentTime = newTime;
  }

  function volumeUpdate() {
    const volumeValue = volume.value / 100;
    videoPlayer.volume = volumeValue;
    volumeRate.textContent = (volumeValue * 100).toFixed(0);
    window.localStorage.setItem("volume", volumeValue);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }

  function calculatePercentage(currentTime, totalDuration) {
    return (currentTime / totalDuration) * 100;
  }
});
