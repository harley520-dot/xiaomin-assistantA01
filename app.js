const connectButton = document.querySelector("#connectButton");
const microphoneButton = document.querySelector("#microphoneButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const sensitivity = document.querySelector("#sensitivity");
const sensitivityValue = document.querySelector("#sensitivityValue");
const mouth = document.querySelector("#mouth");
const levelBar = document.querySelector("#levelBar");
const statusPill = document.querySelector("#statusPill");
const statusText = document.querySelector("#statusText");
const notice = document.querySelector("#notice");
const capturedVideo = document.querySelector("#capturedVideo");
const courseInput = document.querySelector("#courseInput");
const courseDisplay = document.querySelector("#courseDisplay");
const avatarWrap = document.querySelector("#avatarWrap");

let captureStream = null;
let captureMode = null;
let audioContext = null;
let analyser = null;
let sampleBuffer = null;
let animationFrame = null;
let smoothedLevel = 0;
let lastSpeechAt = 0;
let wasSpeaking = false;
let nextHappyEyesAt = 0;
let happyEyesUntil = 0;

function setStatus(state, label) {
  statusPill.dataset.state = state;
  statusText.textContent = label;
}

function updateNotice(html) {
  if (notice) notice.innerHTML = html;
}

function renderMouth(level) {
  const boosted = Math.min(1, level * Number(sensitivity.value));
  smoothedLevel = smoothedLevel * 0.68 + boosted * 0.32;
  const active = smoothedLevel > 0.025;
  const now = performance.now();
  if (active) lastSpeechAt = now;
  if (active && !wasSpeaking) {
    nextHappyEyesAt = now + 1100 + Math.random() * 900;
  }
  if (active && now >= nextHappyEyesAt) {
    happyEyesUntil = now + 480 + Math.random() * 260;
    nextHappyEyesAt = now + 2600 + Math.random() * 1900;
  }
  if (!active) happyEyesUntil = 0;
  const happyEyes = active && now < happyEyesUntil;
  const smiling = active || now - lastSpeechAt < 720;
  const delighted = active && smoothedLevel > 0.28;
  const height = active ? 8 + smoothedLevel * 43 : 12;
  const width = active ? 36 + smoothedLevel * 13 : 38;
  mouth.style.height = `${height}px`;
  mouth.style.width = `${width}px`;
  mouth.style.left = `${74 - (width - 38) / 2}px`;
  levelBar.style.width = `${Math.min(100, smoothedLevel * 120)}%`;
  avatarWrap.style.setProperty("--voice-energy", smoothedLevel.toFixed(3));
  avatarWrap.classList.toggle("speaking", active);
  avatarWrap.classList.toggle("cheerful", smiling);
  avatarWrap.classList.toggle("delighted", delighted);
  avatarWrap.classList.toggle("happy-eyes", happyEyes);
  wasSpeaking = active;
}

function audioLoop() {
  analyser.getFloatTimeDomainData(sampleBuffer);
  let sum = 0;
  for (const sample of sampleBuffer) sum += sample * sample;
  const rms = Math.sqrt(sum / sampleBuffer.length);
  renderMouth(Math.min(1, rms * 5.2));
  animationFrame = requestAnimationFrame(audioLoop);
}

async function beginAnalysis(stream, mode) {
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) throw new Error("NO_AUDIO_TRACK");

  captureStream = stream;
  captureMode = mode;
  audioContext = new AudioContext();
  await audioContext.resume();
  const source = audioContext.createMediaStreamSource(new MediaStream(audioTracks));
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.55;
  sampleBuffer = new Float32Array(analyser.fftSize);
  source.connect(analyser);

  captureStream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      if (captureStream) stopCapture();
    }, { once: true });
  });

  if (mode === "microphone") {
    microphoneButton.classList.add("connected");
    microphoneButton.textContent = "停止麥克風感應";
    setStatus("live", "麥克風已連接");
    updateNotice("<strong>麥克風模式已啟動。</strong>");
  } else {
    capturedVideo.srcObject = captureStream;
    connectButton.classList.add("connected");
    connectButton.innerHTML = '<span class="button-icon">■</span>停止擷取';
    setStatus("live", "已連接");
    updateNotice("<strong>連接成功。</strong>");
  }

  audioLoop();
}

function stopCapture() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  if (captureStream) captureStream.getTracks().forEach((track) => track.stop());
  captureStream = null;
  captureMode = null;
  capturedVideo.srcObject = null;
  if (audioContext) audioContext.close();
  audioContext = null;
  analyser = null;
  smoothedLevel = 0;
  wasSpeaking = false;
  happyEyesUntil = 0;
  renderMouth(0);
  connectButton.classList.remove("connected");
  connectButton.innerHTML = '<span class="button-icon">▶</span>擷取電腦聲音';
  microphoneButton.classList.remove("connected");
  microphoneButton.textContent = "用麥克風感應";
  setStatus("idle", "等待連接");
}

async function connectAudio() {
  if (captureStream) {
    stopCapture();
    return;
  }

  if (!navigator.mediaDevices?.getDisplayMedia) {
    setStatus("error", "瀏覽器不支援");
    return;
  }

  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      surfaceSwitching: "include",
      systemAudio: "include"
    });

    if (!displayStream.getAudioTracks().length) {
      displayStream.getTracks().forEach((track) => track.stop());
      setStatus("error", "沒有收到電腦音訊");
      updateNotice("<strong>這個瀏覽器沒有提供電腦音訊。</strong>");
      return;
    }

    await beginAnalysis(displayStream, "display");
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      setStatus("idle", "已取消");
    } else {
      setStatus("error", "連接失敗");
      console.error(error);
    }
  }
}

async function connectMicrophone() {
  if (captureStream) {
    stopCapture();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("error", "瀏覽器不支援");
    return;
  }

  try {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true
      },
      video: false
    });
    await beginAnalysis(micStream, "microphone");
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      setStatus("error", "需要麥克風權限");
      updateNotice("<strong>麥克風尚未允許。</strong>");
    } else {
      setStatus("error", "麥克風連接失敗");
      console.error(error);
    }
  }
}

connectButton.addEventListener("click", connectAudio);
microphoneButton.addEventListener("click", connectMicrophone);
sensitivity.addEventListener("input", () => {
  sensitivityValue.value = `${Number(sensitivity.value).toFixed(1)}×`;
});

function updateCourseName(value) {
  const courseName = value.trim();
  courseDisplay.textContent = courseName;
  courseDisplay.classList.toggle("has-value", Boolean(courseName));
  localStorage.setItem("assistantCourseName", value);
}

courseInput.value = localStorage.getItem("assistantCourseName") || "";
updateCourseName(courseInput.value);
courseInput.addEventListener("input", (event) => updateCourseName(event.target.value));

if (!navigator.mediaDevices?.getDisplayMedia) {
  connectButton.hidden = true;
  microphoneButton.textContent = "啟用麥克風感應";
  microphoneButton.classList.add("mobile-primary");
}

fullscreenButton.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      document.body.classList.add("fullscreen");
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error(error);
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) document.body.classList.remove("fullscreen");
});

window.addEventListener("beforeunload", stopCapture);
