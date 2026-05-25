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
            if (id) {
                chatRoomId  = String(id);
                if (pic) streamerPic = pic;
                streamerName = name;
                document.getElementById('login-status').innerText = '✅ Bağlanılıyor...';
                imgAvatar.crossOrigin = 'anonymous';
                imgAvatar.onload  = () => bakeAvatar();
                imgAvatar.onerror = () => { avatarCanvas.width = 0; };
                imgAvatar.src     = streamerPic;
                setTimeout(goToStartMenu, 800);
                return;
            }
        }
        document.getElementById('login-status').innerText = '❌ Kanal bulunamadı!';
        resetLoginButton();
    } catch (e) {
        document.getElementById('login-status').innerText = '⚠️ API hatası oluştu!';
        resetLoginButton();
    }
}

function resetLoginButton() {
    document.getElementById('btn-login').disabled  = false;
    document.getElementById('btn-login').innerText = 'BAĞLAN';
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

const popularStreamers = ['atlassya', 'rraenee', 'caglasen', 'cordiseps'];

async function loadSuggestedStreamers() {
    const listEl = document.getElementById('streamers-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    for (const username of popularStreamers) {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = "display: flex; flex-direction: row; gap: 15px; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; cursor: pointer; transition: all 0.2s; min-height: 82px; box-sizing: border-box;";
        
        itemEl.onmouseover = () => { 
            itemEl.style.background = 'rgba(255,255,255,0.07)'; 
            itemEl.style.borderColor = 'rgba(255,255,255,0.15)';
            itemEl.style.transform = 'translateX(-5px)'; 
        };
        itemEl.onmouseout = () => { 
            itemEl.style.background = 'rgba(255,255,255,0.03)'; 
            itemEl.style.borderColor = 'rgba(255,255,255,0.08)';
            itemEl.style.transform = 'translateX(0)'; 
        };
        
        itemEl.onclick = () => {
            document.getElementById('streamer-input').value = username;
            doLogin();
        };

        const imgEl = document.createElement('img');
        imgEl.style.cssText = "width: 52px; height: 52px; border-radius: 2px; background: #222; object-fit: cover; flex-shrink: 0;";
        imgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52'><rect width='52' height='52' fill='%23222'/></svg>";
        itemEl.appendChild(imgEl);

        const contentWrap = document.createElement('div');
        contentWrap.style.cssText = "display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; height: 52px; box-sizing: border-box;";

        const topRow = document.createElement('div');
        topRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; width: 100%;";

        const nameSpan = document.createElement('span');
        nameSpan.innerText = username;
        nameSpan.style.cssText = "font-weight: bold; color: #fff; font-size: 16px;";
        topRow.appendChild(nameSpan);

        const viewersSpan = document.createElement('span');
        viewersSpan.innerText = "";
        viewersSpan.style.cssText = "font-size: 13px; color: #53fc18; font-weight: bold;";
        topRow.appendChild(viewersSpan);

        contentWrap.appendChild(topRow);

        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = "display: flex; justify-content: flex-start; align-items: center; width: 100%;";

        const statusSpan = document.createElement('span');
        statusSpan.innerText = "Yükleniyor...";
        statusSpan.style.cssText = "font-size: 11px; color: #555; font-weight: bold;";
        bottomRow.appendChild(statusSpan);

        contentWrap.appendChild(bottomRow);
        itemEl.appendChild(contentWrap);
        listEl.appendChild(itemEl);

        fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`)
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.profile_pic) {
                    imgEl.src = data.user.profile_pic;
                }
                if (data.livestream) {
                    statusSpan.innerText = "CANLI";
                    statusSpan.style.color = "#53fc18";
                    const viewerCount = data.livestream.viewer_count || data.livestream.viewers || 0;
                    viewersSpan.innerText = viewerCount.toLocaleString() + " izleyici";
                    viewersSpan.style.color = "#53fc18";
                } else {
                    statusSpan.innerText = "OFFLINE";
                    statusSpan.style.color = "#777";
                    viewersSpan.innerText = "";
                }
            })
            .catch(() => {
                statusSpan.innerText = "Hata";
                statusSpan.style.color = "#555";
            });
    }
}

document.addEventListener('DOMContentLoaded', loadSuggestedStreamers);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadSuggestedStreamers();
}
