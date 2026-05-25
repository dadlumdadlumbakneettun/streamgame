function spawn(n, c, sub, boss) {
    const a  = Math.random() * 6.28;
    const d  = 620 + Math.random() * 420;
    const sx = wrap(player.x + Math.cos(a) * d, MAP_W);
    const sy = wrap(player.y + Math.sin(a) * d, MAP_H);

    let hp = 32 + Math.floor(player.lvl * 5) + (sub ? 30 : 0);
    if (boss) hp *= 14;

    const isRange = !boss && Math.random() < 0.3;

    enemies.push({
        x: sx, y: sy,
        n: n, c: c,
        hp: hp, max: hp,
        boss:  boss,
        r:     boss ? 85 : 32,
        spd:   boss ? 2.2 : (1.4 + Math.random() * 1.8),
        range: isRange,
        frozen: 0, slowed: 0,
        id: eidCounter++
    });
}

function spawnBoss(n) {
    const el = document.getElementById('boss-alert');
    el.innerText = '⚠️ ' + n.toUpperCase() + ' GELİYOR ⚠️';
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
    spawn(n, '#cc0000', false, true);
}

function spawnQWave() {
    if (qWaveCd > 0) {
        txt(player.x, player.y - 70, `⏳ ${Math.ceil(qWaveCd / 60)}s`, '#f80');
        return;
    }
    qWaveCd = Q_WAVE_MAX;
    const count = 6 + Math.floor(player.lvl * 0.5);
    for (let i = 0; i < count; i++) {
        const n = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const c = `hsl(${Math.random() * 360},70%,55%)`;
        spawn(n, c, false, false);
    }
    Snd.play('wave');
    txt(player.x, player.y - 70, '🤖 BOT DALGASI!', '#ff4444');
    for (let i = 0; i < 40; i++) {
        parts.push({
            x: player.x, y: player.y,
            c: '#ff4444',
            vx: (Math.random() - .5) * 8,
            vy: (Math.random() - .5) * 8,
            l: 40, sz: 4
        });
    }
}

function hitEnemy(e, d, silent = false) {
    if (!e || e.hp <= 0) return;
    const dmg = Math.ceil(d);
    e.hp -= dmg;
    player.damageDealt += dmg;

    for (let i = 0; i < 3; i++) {
        parts.push({
            x: e.x, y: e.y, c: e.c,
            vx: (Math.random() - .5) * 6,
            vy: (Math.random() - .5) * 6,
            l: 18, sz: 3
        });
    }
    if (!silent) txt(e.x, e.y - 28, dmg, '#fff');

    if (e.hp <= 0) {
        const idx = enemies.indexOf(e);
        if (idx !== -1) enemies.splice(idx, 1);

        dropItem(e.x, e.y, 'xp');
        if (e.boss) {
            dropItem(e.x, e.y, 'xp_big');
            dropItem(e.x, e.y, 'hp');
            dropItem(e.x, e.y, 'shield');
        } else if (Math.random() < 0.12) {
            dropItem(e.x, e.y, 'hp');
        }

        if (!silent) Snd.play('kill');
        player.kills++;
    }
}

function takeDamage(amount, killer) {
    if (player.isDashing || player.invul > 0) return;

    if (player.shield > 0 && frame % 28 === 0) {
        player.shield--;
        Snd.play('shield');
        txt(player.x, player.y - 60, 'BLOCK', '#0ff');
        return;
    }
    if (player.shield > 0) return;

    player.hp -= amount;
    if (amount > 1) {
        txt(player.x, player.y - 60, '-' + Math.ceil(amount), '#f00');
        Snd.play('hitPl');
        player.invul = 22;
    }

    if (player.hp <= 0 && gameActive) {
        if (player.revives > 0) {
            player.revives--;
            player.hp = 60;
            player.invul = 150;
            txt(player.x, player.y - 90, '✨ DİRİLDİN!', '#00ff88');
            return;
        }
        triggerGameOver(killer);
    }
}
