function updateHUD() {
    document.getElementById('bar-hp').style.width = Math.max(0, (player.hp / player.maxHp * 100)) + '%';
    document.getElementById('txt-hp').innerText   = Math.max(0, Math.floor(player.hp));
    document.getElementById('bar-xp').style.width = (player.xp / player.nextXp * 100) + '%';
    document.getElementById('txt-lvl').innerText  = player.lvl;
    document.getElementById('txt-kills').innerText = player.kills;

    if (player.revives > 0) {
        document.getElementById('revive-row').style.display   = 'flex';
        document.getElementById('txt-revive').innerText = player.revives;
    } else {
        document.getElementById('revive-row').style.display = 'none';
    }

    document.getElementById('regen-row').style.display = player.regen > 0 ? 'flex' : 'none';

    const boss = enemies.find(e => e.boss);
    if (boss) {
        document.getElementById('boss-hpbar-wrap').style.display = 'block';
        document.getElementById('boss-hpbar-label').innerText    = '⚠️ BOSS: ' + boss.n;
        document.getElementById('boss-hpfill').style.width       = (boss.hp / boss.max * 100) + '%';
    } else {
        document.getElementById('boss-hpbar-wrap').style.display = 'none';
    }

    const qHint = document.getElementById('q-hint');
    if (qWaveCd <= 0) {
        qHint.style.borderColor = '#ff4444';
        qHint.style.color       = '#ff4444';
        qHint.innerText         = '[Q] — BOT DALGASI ÇAĞIR';
    } else {
        qHint.style.borderColor = '#555';
        qHint.style.color       = '#555';
        qHint.innerText         = `[Q] — ${Math.ceil(qWaveCd / 60)}s bekleniyor`;
    }
}

function levelUp() {
    setGameState(true);
    player.lvl++;
    player.xp = 0;
    player.nextXp = Math.floor(player.nextXp * 1.18 + 4);

    if (player.lvl % 10 === 0) spawnBoss(streamerName || 'SAKOVATA');

    Snd.play('levelup');
    spawnConfetti();
    document.getElementById('bar-xp').classList.add('rainbow-active');

    const box = document.getElementById('card-box');
    box.innerHTML = '';
    document.getElementById('level-screen').style.display = 'flex';

    const opts = [
        { t:'DEV CAN',         d:'+25 Max HP ve anında dolu',            i:'💗', r:'common',    f:()=>{ player.maxHp+=25; player.hp=Math.min(player.hp+25,player.maxHp); } },
        { t:'KALKAN',          d:'+1 Kalkan katmanı (maks 5)',           i:'🛡️', r:'rare',      f:()=>{ if(player.shield<player.maxShield) player.shield++; } },
        { t:'MERMİ HIZI',      d:'Mermiler çok daha hızlı gider',        i:'🚀', r:'common',    f:()=>{ player.bulletSpeed+=2.5; } },
        { t:'SERİ TETİK',      d:'Ateş hızı önemli ölçüde artar',        i:'🔫', r:'rare',      f:()=>{ player.maxCd=Math.max(5,player.maxCd-4); } },
        { t:'TOP HASARI',      d:'Yörünge topları daha çok hasar verir', i:'💣', r:'common',    f:()=>{ player.orbDmg+=5; } },
        { t:'TOP HIZI',        d:'Toplar daha hızlı döner',               i:'💫', r:'common',    f:()=>{ player.orbSpd+=0.06; } },
        { t:'TOP SAYISI',      d:'+1 Yörünge topu',                       i:'🔮', r:'legendary', f:()=>{ player.orb++; } },
        { t:'TOP MENZİLİ',     d:'Toplar daha geniş yörüngede döner',    i:'🌀', r:'rare',      f:()=>{ player.orbRange+=30; } },
        { t:'SARIMSAK',        d:'Alan hasarı & yarıçap artar',           i:'🧄', r:'epic',      f:()=>{ player.garlicDmg+=7; player.garlic++; } },
        { t:'RÜZGAR',          d:'Hareket hızı artar',                    i:'👟', r:'common',    f:()=>{ player.spd+=1.2; } },
        { t:'ATILMA',          d:'Dash bekleme süresi kısalır',           i:'💨', r:'rare',      f:()=>{ player.maxDashCd=Math.max(60,player.maxDashCd-35); } },
        { t:'ÇOKLU NAMLU',     d:'+1 Aynı anda atılan mermi',            i:'💥', r:'legendary', f:()=>{ player.multi++; } },
        { t:'BİLGELİK',        d:'+%30 XP kazanımı',                     i:'📘', r:'rare',      f:()=>{ player.xpMult+=0.3; } },
        { t:'DİRİLİŞ',         d:'+1 Canlanma hakkı',                    i:'⚰️', r:'rare',      f:()=>{ player.revives++; } },
        { t:'CAN ÇALMA',       d:'Verilen hasarın %6si can olur',         i:'🩸', r:'epic',      f:()=>{ player.lifesteal=Math.min(player.lifesteal+0.06,0.4); } },
        { t:'KRİTİK DARBE',    d:'+%20 Kritik şans, 2.2× hasar',        i:'⚡', r:'epic',      f:()=>{ player.critChance=Math.min(player.critChance+0.20,0.85); } },
        { t:'PATLAYAN MERMİ',  d:'Mermiler vurduğunda alan hasarı verir',i:'🧨', r:'legendary', f:()=>{ player.explosiveBullets=true; } },
        { t:'YAVAŞLATAN MERMİ',d:'Mermiler düşmanları yavaşlatır',       i:'🧊', r:'rare',      f:()=>{ player.slowBullets=true; } },
        { t:'SEKME MERMİSİ',   d:'Mermiler 2 kez seker',                 i:'🏓', r:'epic',      f:()=>{ player.bounceBullets=true; } },
        { t:'HIZLI İYİLEŞME',  d:'Her saniye 3 HP yenilenir',            i:'💚', r:'rare',      f:()=>{ player.regen+=3; } },
        { t:'TİTAN GÖVDE',     d:'+60 Max HP, +15 hasar gücü',           i:'🏔️', r:'mythic',   f:()=>{ player.maxHp+=60; player.hp=Math.min(player.hp+40,player.maxHp); player.dmg+=15; } },
    ];

    opts.sort(() => 0.5 - Math.random()).slice(0, 3).forEach(o => {
        const el = document.createElement('div');
        el.className = 'card ' + o.r;
        el.innerHTML = `<div class="rarity">${o.r.toUpperCase()}</div><div class="icon">${o.i}</div><h2>${o.t}</h2><p>${o.d}</p>`;
        el.onmousemove = ev => {
            const rect = el.getBoundingClientRect();
            const x = ev.clientX - rect.left - rect.width / 2;
            const y = ev.clientY - rect.top  - rect.height / 2;
            el.style.transform = `rotateY(${x / 10}deg) rotateX(${-y / 10}deg)`;
        };
        el.onmouseleave = () => el.style.transform = '';
        el.onclick = () => {
            o.f();
            document.getElementById('level-screen').style.display = 'none';
            document.getElementById('bar-xp').classList.remove('rainbow-active');
            setGameState(false);
        };
        box.appendChild(el);
    });
}

function setGameState(p) {
    isPaused = p;
    if (p  && audioCtx) audioCtx.suspend();
    if (!p && audioCtx) audioCtx.resume();
}

function resumeFromSimplePause() {
    document.getElementById('pause-overlay').style.display = 'none';
    setGameState(false);
}

function openSettings() {
    if (!gameActive) return;
    setGameState(true);
    document.getElementById('settings-modal').style.display  = 'flex';
    document.getElementById('pause-overlay').style.display   = 'none';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
    setGameState(false);
}

(function loadSettings() {
    if (localStorage.kickVol)  { masterVol = parseFloat(localStorage.kickVol);  document.getElementById('vol-slider').value  = masterVol; }
    if (localStorage.kickZoom) { zoomLevel = parseFloat(localStorage.kickZoom); document.getElementById('zoom-slider').value = zoomLevel; }
    if (localStorage.kickChar) {
        charScale = parseFloat(localStorage.kickChar);
        document.getElementById('char-slider').value    = charScale;
        document.getElementById('char-val').innerText   = charScale.toFixed(1) + '×';
    }
    if (localStorage.kickAudio) {
        useCustomAudio = localStorage.kickAudio === 'true';
        document.getElementById('custom-audio-chk').checked = useCustomAudio;
    }
})();

document.getElementById('vol-slider').oninput  = e => { masterVol  = parseFloat(e.target.value); localStorage.kickVol  = masterVol; };
document.getElementById('zoom-slider').oninput = e => { zoomLevel  = parseFloat(e.target.value); localStorage.kickZoom = zoomLevel; };
document.getElementById('char-slider').oninput = e => {
    charScale = parseFloat(e.target.value);
    document.getElementById('char-val').innerText = charScale.toFixed(1) + '×';
    localStorage.kickChar = charScale;
};
document.getElementById('custom-audio-chk').onchange = e => {
    useCustomAudio = e.target.checked;
    localStorage.kickAudio = useCustomAudio;
};

function triggerGameOver(killer) {
    gameActive = false;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('killer-name').innerText = killer;
    document.getElementById('final-stats').innerHTML =
        `Hayatta kalma: <b>${Math.floor(timeSec / 60)}dk ${timeSec % 60}s</b><br>` +
        `Seviye: <b>${player.lvl}</b> &nbsp;|&nbsp; Öldürme: <b>${player.kills}</b><br>` +
        `Verilen hasar: <b>${player.damageDealt.toFixed(0)}</b>`;
}
