const playlistItems = document.querySelectorAll('.playlist-item');
const carousel = document.getElementById('carousel');
const carouselContainer = document.getElementById('carousel-container');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const canvas = document.querySelector('.wave-canvas');
const ctx = canvas.getContext('2d');

let currentIndex = 0;
let isPlaying = false;
let audio = new Audio(playlistItems[0].dataset.src);
let audioCtx, analyser, bufferLength, dataArray;

// Resize canvas
canvas.width = 300;
canvas.height = 300;

// ================== Player Update ==================
function updatePlayer(index) {
  const item = playlistItems[index];
  songTitle.textContent = item.dataset.title;
  songArtist.textContent = item.dataset.artist;
  audio.src = item.dataset.src;
  carousel.style.transform = `translateX(${-index * 290}px)`;
  playlistItems.forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  progress.style.width = '0%';
  pauseAlbums();
  isPlaying = false;
  playBtn.textContent = '▶';
}

// ================== Album Rotation Control ==================
function playAlbums() {
  document.querySelectorAll('.album-container').forEach(el => el.classList.remove('paused'));
}

function pauseAlbums() {
  document.querySelectorAll('.album-container').forEach(el => el.classList.add('paused'));
}

// ================== Play / Pause ==================
playBtn.addEventListener('click', async () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    drawWaveform();
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    pauseAlbums();
  } else {
    try {
      await audio.play();
      isPlaying = true;
      playBtn.textContent = '⏸';
      playAlbums();
    } catch (err) {
      console.log('Playback blocked:', err);
    }
  }
});

// ================== Next / Previous ==================
function nextSong() { currentIndex = (currentIndex + 1) % playlistItems.length; updatePlayer(currentIndex); playBtn.click(); }
function prevSong() { currentIndex = (currentIndex - 1 + playlistItems.length) % playlistItems.length; updatePlayer(currentIndex); playBtn.click(); }
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

// ================== Playlist Click ==================
playlistItems.forEach((item, index) => {
  item.addEventListener('click', () => { currentIndex = index; updatePlayer(currentIndex); playBtn.click(); });
});

// ================== Progress Bar ==================
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
    if (audio.ended) nextSong();
  }
});

// ================== Swipe Support ==================
let startX = 0, isDragging = false;
carouselContainer.addEventListener('mousedown', e => { startX = e.pageX; isDragging = true; });
carouselContainer.addEventListener('mousemove', e => { if(!isDragging) return; carousel.style.transform = `translateX(${-currentIndex*290 + (e.pageX-startX)}px)`; });
carouselContainer.addEventListener('mouseup', e => { isDragging = false; const diff = e.pageX-startX; if(diff>50) prevSong(); else if(diff<-50) nextSong(); else updatePlayer(currentIndex); });
carouselContainer.addEventListener('touchstart', e => { startX = e.touches[0].pageX; isDragging = true; });
carouselContainer.addEventListener('touchmove', e => { if(!isDragging) return; const diff = e.touches[0].pageX-startX; carousel.style.transform = `translateX(${-currentIndex*290 + diff}px)`; });
carouselContainer.addEventListener('touchend', e => { isDragging = false; const diff = e.changedTouches[0].pageX-startX; if(diff>50) prevSong(); else if(diff<-50) nextSong(); else updatePlayer(currentIndex); });

// ================== Waveform Animation ==================
function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = '#b8926a';
  ctx.lineWidth = 2;
  const centerX = canvas.width/2;
  const centerY = canvas.height/2;
  const radius = 100;
  const slice = (Math.PI*2)/bufferLength;
  for(let i=0;i<bufferLength;i++){
    const amplitude = dataArray[i]/2;
    const angle = i*slice;
    const x = centerX + Math.cos(angle)*(radius+amplitude);
    const y = centerY + Math.sin(angle)*(radius+amplitude);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.stroke();
}

// ================== Initial Setup ==================
updatePlayer(currentIndex);
