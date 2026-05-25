const CVS = document.getElementById('cvs');
const CTX = CVS.getContext('2d');
const W   = screen.width  || window.innerWidth;
const H   = screen.height || window.innerHeight;
CVS.width  = W;
CVS.height = H;
CVS.style.width  = '100vw';
CVS.style.height = '100vh';
window.oncontextmenu = e => { e.preventDefault(); return false; };

const imgPlayer = new Image(); imgPlayer.src = 'atlas.png';
const imgMelee  = new Image(); imgMelee.src  = 'oyuncode/dusman.png';
const imgRanged = new Image(); imgRanged.src = 'oyuncode/uzak.png';
const imgAvatar = new Image();
const avatarCanvas = document.createElement('canvas');
const avatarCtx    = avatarCanvas.getContext('2d');

let streamerName = '';
let streamerPic  = 'https://files.kick.com/images/user/29960048/profile_image/conversion/b79ac22c-5f2e-41a1-acfa-ace08ba63db9-fullsize.webp';
let chatRoomId   = '28632539';

let gameActive = false;
let isPaused   = false;

let audioCtx       = null;
let masterVol      = 0.5;
let zoomLevel      = 1.6;
let charScale      = 1.0;
let useCustomAudio = true;

let keys = {};

let frame      = 0;
let timeSec    = 0;
let timerInt   = null;
let eidCounter = 0;
let qWaveCd    = 0;
let orbAng     = 0;

let player = Object.assign({}, PLAYER_DEFAULT);

let enemies  = [];
let bullets  = [];
let eBullets = [];
let props    = [];
let trees    = [];
let rocks    = [];
let items    = [];
let floats   = [];
let parts    = [];

let terrainZones = [];
let roads        = [];
let campfires    = [];
let landmarks    = [];
