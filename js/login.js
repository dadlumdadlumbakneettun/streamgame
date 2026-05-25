let previewTimeout = null;

function onStreamerInput() {
    clearTimeout(previewTimeout);
    const inp = document.getElementById('streamer-input').value.trim();
    if (!inp) { hidePreview(); return; }
    previewTimeout = setTimeout(() => fetchChannelPreview(inp), 700);
}

async function fetchChannelPreview(username) {
    try {
        const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`);
        if (!res.ok) { hidePreview(); return; }
        const data = await res.json();
        const pic  = data.user?.profile_pic || null;
        const id   = data.chatroom?.id || null;
        const name = data.user?.username || username;

        if (pic && id) {
            document.getElementById('login-preview-wrap').style.display = 'flex';
            document.getElementById('login-avatar-preview').src = pic;
            document.getElementById('login-found-name').innerText   = '✅ ' + name;
            document.getElementById('login-found-id').innerText     = 'Chat ID: ' + id;
            document.getElementById('login-status').innerText       = '';
        } else { hidePreview(); }
    } catch (e) { hidePreview(); }
}

function hidePreview() {
    document.getElementById('login-preview-wrap').style.display = 'none';
}

async function doLogin() {
    const inp = document.getElementById('streamer-input').value.trim();
    if (!inp) { document.getElementById('login-status').innerText = '⚠️ Bir kullanıcı adı gir!'; return; }

    document.getElementById('btn-login').disabled  = true;
    document.getElementById('btn-login').innerText = 'Aranıyor...';
    document.getElementById('login-status').innerText = '🔍 Kanal bilgileri alınıyor...';

    try {
        const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(inp)}`);
        if (res.ok) {
            const data = await res.json();
            const id   = data.chatroom?.id;
            const pic  = data.user?.profile_pic;
            const name = data.user?.username || inp;
            if (id)  chatRoomId  = String(id);
            if (pic) streamerPic = pic;
            streamerName = name;
            document.getElementById('login-status').innerText = '✅ Bulundu! Chat ID: ' + chatRoomId;
        } else {
            streamerName = inp;
            document.getElementById('login-status').innerText = '⚠️ Kanal bulunamadı — varsayılan ID kullanılıyor';
        }
    } catch (e) {
        streamerName = inp;
        document.getElementById('login-status').innerText = '⚠️ API hatası — varsayılan kullanılıyor';
    }

    imgAvatar.crossOrigin = 'anonymous';
    imgAvatar.onload  = () => bakeAvatar();
    imgAvatar.onerror = () => { avatarCanvas.width = 0; };
    imgAvatar.src     = streamerPic;

    setTimeout(goToStartMenu, 800);
}

function bakeAvatar() {
    const S = 128;
    avatarCanvas.width = S; avatarCanvas.height = S;
    avatarCtx.clearRect(0, 0, S, S);
    avatarCtx.save();
    avatarCtx.beginPath();
    avatarCtx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    avatarCtx.clip();
    try {
        avatarCtx.drawImage(imgAvatar, 0, 0, S, S);
    } catch (e) {
    
        avatarCanvas.width = 0;
    }
    avatarCtx.restore();
}

function goToStartMenu() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('start-menu').style.display   = 'flex';
    document.getElementById('menu-streamer').innerText    = '📺  ' + streamerName + '  kanalı';
    document.getElementById('hud-avatar').src             = streamerPic;
    document.getElementById('hud-name').innerText         = streamerName;
    createMenuParticles();
}

function createMenuParticles() {
    const L = document.getElementById('left-fx');
    const R = document.getElementById('right-fx');
    L.innerHTML = ''; R.innerHTML = '';
    for (let i = 0; i < 22; i++) {
        [L, R].forEach(el => {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (2 + Math.random() * 3) + 's';
            p.style.animationDelay    = Math.random() + 's';
            el.appendChild(p);
        });
    }
}
