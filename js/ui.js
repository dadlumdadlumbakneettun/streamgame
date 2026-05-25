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
        // CAN & SAĞLIK (Dengeli ve küçük adımlarla can artışları)
        { t:'HAFİF BÜNYE',     d:'+8 Max HP ve anında can yenileme',      i:'❤️', r:'common',    f:()=>{ player.maxHp+=8; player.hp=Math.min(player.hp+8,player.maxHp); } },
        { t:'ORANGE İKSİR',    d:'Anında 15 HP yeniler (Sınırı aşamaz)',  i:'🍊', r:'common',    f:()=>{ player.hp=Math.min(player.hp+15,player.maxHp); } },
        { t:'YAŞAM KAYNAĞI',   d:'+18 Max HP ve anında can yenileme',     i:'💗', r:'rare',      f:()=>{ player.maxHp+=18; player.hp=Math.min(player.hp+18,player.maxHp); } },
        { t:'DEV CAN',         d:'+35 Max HP ve anında can yenileme',     i:'💖', r:'epic',      f:()=>{ player.maxHp+=35; player.hp=Math.min(player.hp+35,player.maxHp); } },
        
        // REJENERASYON (Yavaş can yenileme özellikleri)
        { t:'MİNİK REJEN',     d:'Saniyede +0.5 HP yeniler',             i:'🌱', r:'common',    f:()=>{ player.regen+=0.5; } },
        { t:'BİTKİ ÖZÜ',       d:'Saniyede +1.0 HP yeniler',             i:'🌿', r:'rare',      f:()=>{ player.regen+=1.0; } },
        { t:'HIZLI İYİLEŞME',  d:'Saniyede +2.0 HP yeniler',             i:'💚', r:'epic',      f:()=>{ player.regen+=2.0; } },
        
        // CAN ÇALMA (Düşük oranlardan başlayarak geliştirilebilir)
        { t:'KIVILCIM KAN',    d:'Verilen hasarın %1.5 kadarı can olur',  i:'🩸', r:'common',    f:()=>{ player.lifesteal=Math.min(player.lifesteal+0.015,0.35); } },
        { t:'KAN ARZUSU',      d:'Verilen hasarın %3.5 kadarı can olur',  i:'🧛', r:'rare',      f:()=>{ player.lifesteal=Math.min(player.lifesteal+0.035,0.35); } },
        { t:'SAMPİRİK GÜÇ',    d:'Verilen hasarın %6.0 kadarı can olur',  i:'🧬', r:'epic',      f:()=>{ player.lifesteal=Math.min(player.lifesteal+0.06,0.35); } },
        
        // KALKAN (Savunma katmanları)
        { t:'MİNİK BLOK',      d:'+1 Kalkan katmanı (Maksimum 5)',        i:'🛡️', r:'rare',      f:()=>{ if(player.shield<player.maxShield) player.shield++; } },
        
        // HAREKET & DASH (Hız geliştirmeleri)
        { t:'MİNİK RÜZGAR',    d:'Koşu hızı hafifçe artar (+0.3)',        i:'👟', r:'common',    f:()=>{ player.spd+=0.3; } },
        { t:'ESİNTİ',          d:'Koşu hızı artar (+0.7)',                i:'💨', r:'common',    f:()=>{ player.spd+=0.7; } },
        { t:'RÜZGAR',          d:'Koşu hızı önemli ölçüde artar (+1.2)',  i:'⚡', r:'rare',      f:()=>{ player.spd+=1.2; } },
        { t:'HAFİF DESTEK',    d:'Atılma (Dash) bekleme süresi azalır',   i:'⏱️', r:'common',    f:()=>{ player.maxDashCd=Math.max(60,player.maxDashCd-15); } },
        { t:'ATILMA UZMANI',   d:'Atılma bekleme süresi çok azalır',      i:'🌀', r:'rare',      f:()=>{ player.maxDashCd=Math.max(60,player.maxDashCd-35); } },

        // MERMİ COOLDOWN / ATEŞ HIZI
        { t:'HIZLI TETİK',     d:'Mermi atış hızı hafifçe artar (-1 CD)', i:'⏲️', r:'common',    f:()=>{ player.maxCd=Math.max(5,player.maxCd-1); } },
        { t:'SERİ TETİK',      d:'Mermi atış hızı artar (-3 CD)',         i:'🔫', r:'rare',      f:()=>{ player.maxCd=Math.max(5,player.maxCd-3); } },
        { t:'MAKİNELİ',        d:'Mermi atış hızı çok artar (-5 CD)',     i:'🔥', r:'epic',      f:()=>{ player.maxCd=Math.max(5,player.maxCd-5); } },

        // MERMİ HASARI & HIZI
        { t:'UFAK GÜÇ',        d:'Mermilerin hasar gücü +3 artar',        i:'🏹', r:'common',    f:()=>{ player.dmg+=3; } },
        { t:'KESKİN GÜÇ',      d:'Mermilerin hasar gücü +7 artar',        i:'🗡️', r:'rare',      f:()=>{ player.dmg+=7; } },
        { t:'MERMİ IVME',      d:'Mermiler biraz daha hızlı gider',       i:'🚀', r:'common',    f:()=>{ player.bulletSpeed+=1.0; } },
        { t:'MERMİ HIZI',      d:'Mermiler çok daha hızlı gider',         i:'☄️', r:'rare',      f:()=>{ player.bulletSpeed+=2.2; } },

        // KRİTİK VURUŞ (Yavaş yavaş artan kritik oranları)
        { t:'ODAKLANMA',       d:'+%5 Kritik şansı (Kritik hasar 2.2x)',  i:'🎯', r:'common',    f:()=>{ player.critChance=Math.min(player.critChance+0.05,0.85); } },
        { t:'GÖZ HAPSİ',       d:'+%12 Kritik şansı (Kritik hasar 2.2x)', i:'👁️', r:'rare',      f:()=>{ player.critChance=Math.min(player.critChance+0.12,0.85); } },
        { t:'KRİTİK DARBE',    d:'+%22 Kritik şansı (Kritik hasar 2.2x)', i:'⚡', r:'epic',      f:()=>{ player.critChance=Math.min(player.critChance+0.22,0.85); } },

        // YÖRÜNGE TOPLARI (ORB) GELİŞTİRMELERİ
        { t:'MİNİK TOP GÜCÜ',  d:'Dönen topların hasarı +2 artar',        i:'🔮', r:'common',    f:()=>{ player.orbDmg+=2; } },
        { t:'TOP HASARI',      d:'Dönen topların hasarı +5 artar',        i:'💣', r:'rare',      f:()=>{ player.orbDmg+=5; } },
        { t:'TOP DÖNÜŞÜ',      d:'Dönen topların hızı +0.02 artar',       i:'💫', r:'common',    f:()=>{ player.orbSpd+=0.02; } },
        { t:'TOP HIZI',        d:'Dönen topların hızı +0.05 artar',       i:'🌠', r:'rare',      f:()=>{ player.orbSpd+=0.05; } },
        { t:'DAR HALE',        d:'Topların yörünge alanı +10 genişler',   i:'⭕', r:'common',    f:()=>{ player.orbRange+=10; } },
        { t:'TOP MENZİLİ',     d:'Topların yörünge alanı +25 genişler',   i:'🪐', r:'rare',      f:()=>{ player.orbRange+=25; } },
        { t:'TOP SAYISI',      d:'+1 Yeni yörünge topu eklenir',          i:'🎡', r:'legendary', f:()=>{ player.orb++; } },

        // TECRÜBE (XP BONUSLARI)
        { t:'KÜÇÜK BİLGELİK',  d:'+%10 daha fazla XP kazanımı',           i:'📖', r:'common',    f:()=>{ player.xpMult+=0.10; } },
        { t:'BİLGELİK YOLU',   d:'+%20 daha fazla XP kazanımı',           i:'📘', r:'rare',      f:()=>{ player.xpMult+=0.20; } },

        // MERMİ EFEKTLERİ & LEGENDARY/MYTHIC ÖZEL YETENEKLER
        { t:'ÇOKLU NAMLU',     d:'+1 Aynı anda atılan mermi miktarı',     i:'💥', r:'legendary', f:()=>{ player.multi++; } },
        { t:'DİRİLİŞ',         d:'+1 Canlanma hakkı kazandırır',          i:'⚰️', r:'epic',      f:()=>{ player.revives++; } },
        { t:'PATLAYAN MERMİ',  d:'Mermiler çarptığında alan hasarı verir',i:'🧨', r:'legendary', f:()=>{ player.explosiveBullets=true; } },
        { t:'YAVAŞLATAN MERMİ',d:'Mermiler düşmanları dondurup yavaşlatır',i:'🧊', r:'rare',      f:()=>{ player.slowBullets=true; } },
        { t:'SEKME MERMİSİ',   d:'Mermiler duvar veya hedeften seker',     i:'🏓', r:'epic',      f:()=>{ player.bounceBullets=true; } },
        { t:'TİTAN GÖVDE',     d:'+35 Max HP, +8 hasar gücü',             i:'🏔️', r:'mythic',   f:()=>{ player.maxHp+=35; player.hp=Math.min(player.hp+25,player.maxHp); player.dmg+=8; } },
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
