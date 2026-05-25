window.onkeydown = e => {
    if (e.key === 'Escape') {
        document.getElementById('settings-modal').style.display === 'flex'
            ? closeSettings()
            : openSettings();
    }
    keys[e.key] = true;
    if (!gameActive || isPaused) return;
    if (e.key.toLowerCase() === 'q') spawnQWave();
};
window.onkeyup = e => keys[e.key] = false;

function init() {
    document.getElementById('start-menu').style.display        = 'none';
    document.getElementById('streamer-hud').style.display      = 'flex';
    document.getElementById('kills-row').style.display         = 'flex';
    document.getElementById('q-hint').style.display            = 'block';

    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}

    resetWorld();
    connectPusher();
    gameActive = true;
    loop();
    startTimer();
}

function restartGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    resetWorld();
    connectPusher();
    gameActive = true;
    loop();
    startTimer();
}

function startTimer() {
    if (timerInt) clearInterval(timerInt);
    timerInt = setInterval(() => {
        if (!gameActive || isPaused) return;
        timeSec++;
        const m = Math.floor(timeSec / 60).toString().padStart(2, '0');
        const s = (timeSec % 60).toString().padStart(2, '0');
        document.getElementById('timer-indicator').innerText = m + ':' + s;
        if (timeSec % 60 === 0) spawnBoss(streamerName || 'SAKOVATA');
    }, 1000);
}

function loop() {
    if (!gameActive) return;
    requestAnimationFrame(loop);
    if (!isPaused) { update(); draw(); }
}

function update() {
    frame++;
    if (player.dashCd > 0) player.dashCd--;
    if (player.invul  > 0) player.invul--;
    if (qWaveCd       > 0) qWaveCd--;

    if (player.regen > 0) {
        player.regenTick++;
        if (player.regenTick >= 60) {
            player.regenTick = 0;
            player.hp = Math.min(player.hp + player.regen, player.maxHp);
        }
    }

    if (keys[' '] && player.dashCd <= 0) {
        player.isDashing = true; player.dashTime = 15; player.dashCd = player.maxDashCd;
        Snd.play('dash');
        player.dashVx = 0; player.dashVy = 0;
        if (keys['w'] || keys['ArrowUp'])    player.dashVy = -1;
        if (keys['s'] || keys['ArrowDown'])  player.dashVy =  1;
        if (keys['a'] || keys['ArrowLeft'])  player.dashVx = -1;
        if (keys['d'] || keys['ArrowRight']) player.dashVx =  1;
        if (!player.dashVx && !player.dashVy) player.dashVx = 1;
    }

    if (player.isDashing) {
        player.x += player.dashVx * player.spd * 3;
        player.y += player.dashVy * player.spd * 3;
        player.dashTime--;
        parts.push({ x:player.x, y:player.y, c:'#00ffff', vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3, l:18, sz:3 });
        if (player.dashTime <= 0) player.isDashing = false;
    } else {
        if (keys['w'] || keys['ArrowUp'])    player.y -= player.spd;
        if (keys['s'] || keys['ArrowDown'])  player.y += player.spd;
        if (keys['a'] || keys['ArrowLeft'])  player.x -= player.spd;
        if (keys['d'] || keys['ArrowRight']) player.x += player.spd;
    }
    player.x = wrap(player.x, MAP_W);
    player.y = wrap(player.y, MAP_H);

    if (player.cd > 0) player.cd--;
    else if (!player.isDashing) {
        const t = getTarget();
        if (t) {
            Snd.play('shoot');
            const rel = relPos(t.x, t.y);
            const ang = Math.atan2(rel.y, rel.x);
            for (let i = 0; i < player.multi; i++) {
                const a = ang + (i - (player.multi - 1) / 2) * 0.18;
                bullets.push({
                    x: player.x, y: player.y,
                    vx: Math.cos(a) * player.bulletSpeed,
                    vy: Math.sin(a) * player.bulletSpeed,
                    life: 75,
                    explosive: player.explosiveBullets,
                    slowing:   player.slowBullets,
                    bounce:    player.bounceBullets,
                    bounced:   0
                });
            }
            player.cd = player.maxCd;
        }
    }

    // Orb damage
    if (player.orb > 0) {
        orbAng += player.orbSpd;
        for (let i = 0; i < player.orb; i++) {
            const a  = orbAng + (Math.PI * 2 / player.orb) * i;
            const ox = wrap(player.x + Math.cos(a) * player.orbRange, MAP_W);
            const oy = wrap(player.y + Math.sin(a) * player.orbRange, MAP_H);
            for (let k = enemies.length - 1; k >= 0; k--)
                if (wdist(ox, oy, enemies[k].x, enemies[k].y) < 38) hitEnemy(enemies[k], player.orbDmg, true);
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x = wrap(b.x + b.vx, MAP_W); b.y = wrap(b.y + b.vy, MAP_H); b.life--;
        let hit = false;

        for (let k = enemies.length - 1; k >= 0; k--) {
            const e = enemies[k];
            if (wdist(b.x, b.y, e.x, e.y) < e.r + 6) {
                const isCrit = Math.random() < player.critChance;
                const dmg    = player.dmg * (isCrit ? player.critMult : 1);
                hitEnemy(e, dmg);
                if (player.lifesteal > 0) player.hp = Math.min(player.hp + dmg * player.lifesteal, player.maxHp);
                if (b.slowing && k < enemies.length && enemies[k]) enemies[k].slowed = 150;
                if (isCrit) txt(e.x, e.y - 32, '⚡' + Math.floor(dmg), '#ffff00');
                if (b.explosive) {
                    for (let j = enemies.length - 1; j >= 0; j--)
                        if (enemies[j] !== e && wdist(b.x, b.y, enemies[j].x, enemies[j].y) < 90) hitEnemy(enemies[j], dmg * 0.6, true);
                    for (let p = 0; p < 12; p++) parts.push({ x:b.x, y:b.y, c:'#ff6600', vx:(Math.random()-.5)*8, vy:(Math.random()-.5)*8, l:25, sz:3 });
                }
                if (b.bounce && b.bounced < 2) { b.bounced++; b.vx=-b.vx*(0.8+Math.random()*0.4); b.vy=-b.vy*(0.8+Math.random()*0.4); hit=false; }
                else hit = true;
                break;
            }
        }

        if (!hit) {
            for (let p = props.length - 1; p >= 0; p--) {
                if (wdist(b.x, b.y, props[p].x, props[p].y) < 28) {
                    props[p].hp--; Snd.play('hit'); hit = true;
                    if (props[p].hp <= 0) {
                        dropItem(props[p].x, props[p].y, Math.random() < 0.35 ? 'hp' : (Math.random() < 0.4 ? 'xp_big' : 'xp'));
                        props.splice(p, 1);
                    }
                    break;
                }
            }
        }
        if (hit || b.life <= 0) bullets.splice(i, 1);
    }

    // Enemy contact damage scales with level
    const baseMelee = 0.5 + player.lvl * 0.02;
    const baseBoss  = 0.8 + player.lvl * 0.04;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]; if (!e) continue;
        if (e.frozen > 0) { e.frozen--; continue; }
        const spdMult = (e.slowed && e.slowed-- > 0) ? 0.35 : 1;
        const d   = wdist(player.x, player.y, e.x, e.y);
        const rel = relPos(e.x, e.y);
        const ang = Math.atan2(-rel.y, -rel.x);

        if (e.range) {
            if (d > 380) { e.x = wrap(e.x + Math.cos(ang) * e.spd * spdMult, MAP_W); e.y = wrap(e.y + Math.sin(ang) * e.spd * spdMult, MAP_H); }
            if (frame % (90 + e.id % 60) === (e.id % 30) && d < 950)
                eBullets.push({ x:e.x, y:e.y, vx:Math.cos(ang)*5.5, vy:Math.sin(ang)*5.5, life:130, owner:e.n });
        } else {
            const zigzag = e.boss ? 0 : Math.sin(frame * 0.05 + e.id) * 0.3;
            e.x = wrap(e.x + Math.cos(ang + zigzag) * e.spd * spdMult, MAP_W);
            e.y = wrap(e.y + Math.sin(ang + zigzag) * e.spd * spdMult, MAP_H);
        }
        if (d < player.r + e.r) takeDamage(e.boss ? baseBoss : baseMelee, e.n);
    }

    // Ranged bullet damage scales with level
    const bulletDmg = 8 + Math.floor(player.lvl * 1.0);
    for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i];
        b.x = wrap(b.x + b.vx, MAP_W); b.y = wrap(b.y + b.vy, MAP_H); b.life--;
        if (wdist(b.x, b.y, player.x, player.y) < player.r) { takeDamage(bulletDmg, b.owner || 'Düşman'); eBullets.splice(i, 1); }
        else if (b.life <= 0) eBullets.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const d  = wdist(player.x, player.y, it.x, it.y);
        if (d < player.mag && it.t.includes('xp')) {
            const rel = relPos(it.x, it.y);
            it.x = wrap(it.x - rel.x * 0.14, MAP_W);
            it.y = wrap(it.y - rel.y * 0.14, MAP_H);
        }
        if (d < 32) {
            if (it.t === 'xp')     { player.xp += 1  * player.xpMult; Snd.play('xp'); }
            if (it.t === 'xp_big') { player.xp += 25 * player.xpMult; Snd.play('xp'); }
            if (it.t === 'hp')     { player.hp = Math.min(player.hp + 30, player.maxHp); txt(player.x, player.y - 55, '❤+30', '#0f0'); }
            if (it.t === 'mag')    { player.mag = 4000; setTimeout(() => player.mag = 150, 5000); txt(player.x, player.y - 55, '🧲', '#ff0'); }
            if (it.t === 'shield') { if (player.shield < player.maxShield) player.shield++; txt(player.x, player.y - 55, '🛡️', '#0ff'); }
            items.splice(i, 1);
            if (player.xp >= player.nextXp) levelUp();
        }
    }

    // Performance: cap arrays to avoid unbounded growth
    if (parts.length  > 250) parts.length  = 250;
    if (floats.length > 40)  floats.length = 40;

    updateHUD();
}
