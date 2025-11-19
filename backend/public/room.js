// === URL params ===
function getQueryParam(key){ return new URLSearchParams(window.location.search).get(key); }
const username = getQueryParam('name') || 'Guest';
const roomCode = getQueryParam('room') || 'XXXXXX';
const service = getQueryParam('service') || 'youtube';

document.getElementById('user-name').textContent = username;
document.getElementById('room-code-top').textContent = `Room: ${roomCode}`;

// === Elements ===
const sideMenu = document.getElementById('side-menu');
const menuToggle = document.getElementById('menu-toggle');
const appearanceToggle = document.getElementById('appearance-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-text');
const sendBtn = document.getElementById('send-btn');
const emojiBtns = document.querySelectorAll('.emoji-btn');
const searchBarInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const participantsBtn = document.getElementById('participants-btn');

// === MENU toggle and close outside ===
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  sideMenu.classList.toggle('open');
  sideMenu.setAttribute('aria-hidden', !sideMenu.classList.contains('open'));
});

// close when click outside menu
document.addEventListener('click', (e) => {
  const isClickInside = sideMenu.contains(e.target) || menuToggle.contains(e.target);
  if (!isClickInside && sideMenu.classList.contains('open')) {
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden','true');
  }
});

// close with Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
    sideMenu.classList.remove('open');
  }
});

// === APPEARANCE toggle ===
appearanceToggle.addEventListener('click', () => {
  appearanceToggle.classList.toggle('active');
  document.body.classList.toggle('light');
});

// ensure side menu also updates its aria-checked
function setAppearanceState(state){
  if(state){
    appearanceToggle.classList.add('active');
    document.body.classList.add('light');
  } else {
    appearanceToggle.classList.remove('active');
    document.body.classList.remove('light');
  }
}

// initialize from default (you can later save to localStorage)
setAppearanceState(false);

// === LOAD MEDIA (youtube / vlc local) ===
const mediaContainer = document.getElementById('media-container');

function loadSelectedService(){
  mediaContainer.innerHTML = ''; // clear

  if(service === 'youtube'){
    const iframe = document.createElement('iframe');
    iframe.width = '100%'; iframe.height = '350';
    iframe.src = 'https://www.youtube.com/embed/?controls=1';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.frameBorder = 0;
    iframe.setAttribute('allowfullscreen','');
    mediaContainer.appendChild(iframe);
  } else if(service === 'vlc'){
    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = 'video/*,audio/*';
    const video = document.createElement('video'); video.controls = true; video.style.width = '100%'; video.style.height = '350px';
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0];
      if(f) video.src = URL.createObjectURL(f);
    });
    mediaContainer.appendChild(fileInput);
    mediaContainer.appendChild(video);
  } else {
    mediaContainer.innerHTML = '<p class="placeholder">Selected service not supported</p>';
  }
}
loadSelectedService();

// === PLAY / PAUSE for local video only ===
document.getElementById('play').addEventListener('click', () => {
  const v = document.querySelector('#media-container video');
  if(v) v.play();
});
document.getElementById('pause').addEventListener('click', () => {
  const v = document.querySelector('#media-container video');
  if(v) v.pause();
});

// prev/next currently visual - you will wire these later for playlist
document.getElementById('prev').addEventListener('click', () => { /* placeholder for prev */ });
document.getElementById('next').addEventListener('click', () => { /* placeholder for next */ });

// === CHAT: simple local render (later we will hook to Firebase/socket) ===
function addMessage(user, text, mine=false){
  const wrap = document.createElement('div');
  wrap.className = 'msg' + (mine ? ' me' : '');
  if(!mine){
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = user;
    wrap.appendChild(meta);
  }
  const txt = document.createElement('div'); txt.className = 'text'; txt.textContent = text;
  wrap.appendChild(txt);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if(!text) return;
  addMessage(username, text, true);
  chatInput.value = '';
});

chatInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') sendBtn.click();
});

// === EMOJI floating (improved visuals) ===
emojiBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.innerText;
    // small local display in chat
    addMessage(username, emoji, true);

    // create floating element
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.innerText = emoji;

    // position near chat panel center horizontally
    const rect = chatPanel.getBoundingClientRect();
    const x = rect.left + rect.width/2 + (Math.random()*120 - 60);
    const y = rect.bottom - 80;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    setTimeout(()=> el.remove(), 1500);
  });
});

// === SEARCH / PARTICIPANTS button styling already done; basic handlers below ===
searchBtn.addEventListener('click', () => {
  const q = (searchBarInput.value || '').trim();
  if(!q) return;
  // open youtube search in new tab for now
  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
});

participantsBtn.addEventListener('click', () => {
  alert('Participants popup not implemented yet. Will add next.');
});