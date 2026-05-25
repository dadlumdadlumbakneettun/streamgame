function connectPusher() {
    if (typeof Pusher === 'undefined') {
        document.getElementById('log-area').innerText = '❌ Pusher yüklenemedi';
        return;
    }
    try {
        const p  = new Pusher(PUSHER_KEY, { cluster: 'us2' });
        const ch = p.subscribe('chatrooms.' + chatRoomId + '.v2');
        document.getElementById('log-area').innerText =
            '✅ Kick Chat: ' + streamerName + ' (ID:' + chatRoomId + ')';

        ch.bind('App\\Events\\ChatMessageEvent', d => {
            let data = typeof d === 'string' ? JSON.parse(d) : d;
            if (data.sender) handleChat(data.sender, data.content);
        });
    } catch (e) {
        document.getElementById('log-area').innerText = '❌ Hata: ' + e.message;
    }
}

function handleChat(s, m) {
    if (isPaused || !gameActive) return;

    const n   = s.username;
    const c   = s.identity?.color || `hsl(${Math.random() * 360},70%,50%)`;
    const sub = s.badges?.some(b => b.type === 'subscriber') || false;
    let isMod = s.badges?.some(b => b.type === 'moderator' || b.type === 'broadcaster') || false;
    if (!isMod && s.identity?.badges)
        isMod = s.identity.badges.some(b => b.type === 'moderator' || b.type === 'broadcaster');

    const msg = m.toLowerCase().trim();

    if (msg.startsWith('!')) notify(n, msg, isMod);

    if (isMod && msg === '!temizle') { enemies = []; return; }
    if (isMod && msg === '!atak') {
        for (let k = 0; k < 12; k++) spawn(n, c, false, false);
        document.getElementById('mod-alert').style.display = 'block';
        setTimeout(() => document.getElementById('mod-alert').style.display = 'none', 2000);
        return;
    }
    if (isMod && msg === '!boss') { spawnBoss(n); return; }
    if (msg === '!can')    { player.hp = Math.min(player.hp + 25, player.maxHp); txt(player.x, player.y - 60, '❤+25', '#0f0'); return; }
    if (msg === '!saldır') { spawn(n,c,sub,false); spawn(n,c,sub,false); spawn(n,c,sub,false); return; }

    const num = parseInt(msg);
    const isExactNum = !isNaN(num) && String(num) === msg;

    if (isMod && isExactNum && num >= 1 && num <= 100) {
        for (let i = 0; i < num; i++) spawn(n, c, sub, false);
        notify(n, `${num}× saldırı! (MOD)`, true);
        txt(player.x, player.y - 70, `${n}: ${num}× saldırı!`, c);
        return;
    }

    if (!isMod && isExactNum && num >= 1 && num <= 10) {
        for (let i = 0; i < num; i++) spawn(n, c, sub, false);
        notify(n, `${num}× saldırı!`, false);
        txt(player.x, player.y - 70, `${n}: ${num}× saldırı!`, c);
        return;
    }

    spawn(n, c, sub, false);
}

function notify(n, m, isMod) {
    const d = document.createElement('div');
    d.className = isMod ? 'chat-cmd mod-cmd' : 'chat-cmd';
    d.innerText = n + ': ' + m;
    document.getElementById('chat-notifs').appendChild(d);
    setTimeout(() => d.remove(), 2500);
}
