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
        itemEl.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: #1a1c20; border: 1px solid #2a2d32; border-radius: 8px; cursor: pointer; transition: background 0.2s, transform 0.1s;";
        itemEl.onmouseover = () => { itemEl.style.background = '#252930'; itemEl.style.transform = 'scale(1.03)'; };
        itemEl.onmouseout = () => { itemEl.style.background = '#1a1c20'; itemEl.style.transform = 'scale(1)'; };
        
        itemEl.onclick = () => {
            document.getElementById('streamer-input').value = username;
            doLogin();
        };

        const nameSpan = document.createElement('span');
        nameSpan.innerText = username;
        nameSpan.style.cssText = "font-weight: bold; color: #fff; font-size: 14px;";
        itemEl.appendChild(nameSpan);

        const statusWrap = document.createElement('div');
        statusWrap.style.cssText = "display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-size: 11px;";

        try {
            const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.livestream) {
                    const liveBadge = document.createElement('span');
                    liveBadge.innerText = '🔴 CANLI';
                    liveBadge.style.cssText = "color: #ff4d4d; font-weight: bold; background: rgba(255,77,77,0.15); padding: 2px 6px; border-radius: 4px; font-size: 10px; letter-spacing: 0.5px;";
                    
                    const viewersSpan = document.createElement('span');
                    const viewerCount = data.livestream.viewer_count || data.livestream.viewers || 0;
                    viewersSpan.innerText = viewerCount.toLocaleString() + ' izleyici';
                    viewersSpan.style.color = '#53fc18';

                    statusWrap.appendChild(liveBadge);
                    statusWrap.appendChild(viewersSpan);
                } else {
                    const offlineSpan = document.createElement('span');
                    offlineSpan.innerText = 'Çevrimdışı';
                    offlineSpan.style.color = '#555';
                    statusWrap.appendChild(offlineSpan);
                }
            } else {
                const errSpan = document.createElement('span');
                errSpan.innerText = 'Yüklenemedi';
                errSpan.style.color = '#444';
                statusWrap.appendChild(errSpan);
            }
        } catch (e) {
            const errSpan = document.createElement('span');
            errSpan.innerText = 'Hata';
            errSpan.style.color = '#444';
            statusWrap.appendChild(errSpan);
        }

        itemEl.appendChild(statusWrap);
        listEl.appendChild(itemEl);
    }
}

document.addEventListener('DOMContentLoaded', loadSuggestedStreamers);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadSuggestedStreamers();
}
