function draw() {
    CTX.fillStyle = '#0b160b';
    CTX.fillRect(0, 0, W, H);
    CTX.save();
    CTX.translate(W / 2, H / 2);
    CTX.scale(zoomLevel, zoomLevel);
    const VW = W / zoomLevel, VH = H / zoomLevel;

    drawTerrain(VW, VH);
    drawRoads(VW, VH);
    drawGrid(VW, VH);
    drawLandmarks(VW, VH);
    drawRocks(VW, VH);
    drawTrees(VW, VH);
    drawCampfires(VW, VH);
    drawProps(VW, VH);
    drawItems(VW, VH);
    drawEnemyBullets(VW, VH);
    drawEnemies(VW, VH);
    drawGarlicZone();
    drawShieldRing();
    drawOrbs();
    drawDashBar();
    drawPlayer();
    drawBullets(VW, VH);
    drawParticles();
    drawFloats();

    CTX.restore();
    drawMinimap();
}

const terrainColors = {
    water: '#00336688', sand: 'rgba(139,115,85,0.22)',
    ruins: 'rgba(60,60,60,0.25)', forest: 'rgba(20,70,20,0.28)',
    lava:  'rgba(150,40,0,0.25)', snow:   'rgba(200,220,255,0.18)',
    swamp: 'rgba(30,60,10,0.25)'
};

function drawTerrain(VW, VH) {
    terrainZones.forEach(z => {
        const pos = relPos(z.x, z.y);
        if (Math.abs(pos.x) > VW / 2 + z.r || Math.abs(pos.y) > VH / 2 + z.r) return;
        const grad = CTX.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, z.r);
        grad.addColorStop(0, terrainColors[z.type] || 'rgba(50,50,50,0.15)');
        grad.addColorStop(1, 'transparent');
        CTX.fillStyle = grad;
        CTX.beginPath(); CTX.arc(pos.x, pos.y, z.r, 0, 6.28); CTX.fill();
        if (Math.abs(pos.x) < VW / 4 && Math.abs(pos.y) < VH / 4) {
            CTX.save(); CTX.globalAlpha = 0.12; CTX.fillStyle = '#fff';
            CTX.font = '12px monospace'; CTX.textAlign = 'center';
            CTX.fillText(z.type.toUpperCase(), pos.x, pos.y); CTX.restore();
        }
    });
}

function drawRoads(VW, VH) {
    roads.forEach(rd => {
        CTX.save(); CTX.strokeStyle = '#111'; CTX.lineWidth = 42;
        CTX.beginPath();
        if (rd.type === 'h') {
            let dy = rd.pos - player.y;
            if (dy < -MAP_H / 2) dy += MAP_H; else if (dy > MAP_H / 2) dy -= MAP_H;
            CTX.moveTo(-VW, dy); CTX.lineTo(VW, dy);
        } else {
            let dx = rd.pos - player.x;
            if (dx < -MAP_W / 2) dx += MAP_W; else if (dx > MAP_W / 2) dx -= MAP_W;
            CTX.moveTo(dx, -VH); CTX.lineTo(dx, VH);
        }
        CTX.stroke();
        CTX.strokeStyle = '#1f1f1f'; CTX.lineWidth = 2; CTX.setLineDash([28, 28]); CTX.stroke();
        CTX.setLineDash([]); CTX.restore();
    });
}

function drawGrid(VW, VH) {
    CTX.strokeStyle = '#121f12'; CTX.lineWidth = 1; CTX.beginPath();
    const gs = 110, ox = player.x % gs, oy = player.y % gs;
    for (let x = -VW / 2 - gs; x < VW / 2 + gs; x += gs) {
        const dx = Math.floor((x - ox) / gs) * gs + (gs - ox);
        CTX.moveTo(dx, -VH / 2); CTX.lineTo(dx, VH / 2);
    }
    for (let y = -VH / 2 - gs; y < VH / 2 + gs; y += gs) {
        const dy = Math.floor((y - oy) / gs) * gs + (gs - oy);
        CTX.moveTo(-VW / 2, dy); CTX.lineTo(VW / 2, dy);
    }
    CTX.stroke();
}

function drawLandmarks(VW, VH) {
    landmarks.forEach(lm => {
        const pos = relPos(lm.x, lm.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        CTX.save(); CTX.globalAlpha = 0.15; CTX.strokeStyle = '#fff'; CTX.lineWidth = 1; CTX.setLineDash([5, 8]);
        CTX.beginPath(); CTX.arc(pos.x, pos.y, lm.r, 0, 6.28); CTX.stroke(); CTX.setLineDash([]);
        CTX.globalAlpha = 0.2; CTX.fillStyle = '#fff'; CTX.font = 'bold 13px monospace'; CTX.textAlign = 'center';
        CTX.fillText('[ ' + lm.name + ' ]', pos.x, pos.y); CTX.restore();
    });
}

function drawRocks(VW, VH) {
    rocks.forEach(r => {
        const pos = relPos(r.x, r.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        CTX.save(); CTX.fillStyle = r.c;
        CTX.beginPath(); CTX.ellipse(pos.x, pos.y, r.r * 1.3, r.r * 0.75, 0.4, 0, 6.28); CTX.fill();
        CTX.fillStyle = 'rgba(255,255,255,0.06)';
        CTX.beginPath(); CTX.ellipse(pos.x - r.r * 0.25, pos.y - r.r * 0.2, r.r * 0.4, r.r * 0.2, 0.3, 0, 6.28); CTX.fill();
        CTX.restore();
    });
}

function drawTrees(VW, VH) {
    trees.forEach(t => {
        const pos = relPos(t.x, t.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        CTX.save(); CTX.globalAlpha = 0.18; CTX.fillStyle = '#000';
        CTX.beginPath(); CTX.ellipse(pos.x + 8, pos.y + t.r * 0.45, t.r * 0.72, t.r * 0.22, 0, 0, 6.28); CTX.fill(); CTX.restore();
        CTX.fillStyle = '#4a2e10'; CTX.fillRect(pos.x - 4, pos.y, 8, t.r * 0.5);
        CTX.fillStyle = t.color || '#1a4a1a';
        CTX.beginPath(); CTX.arc(pos.x, pos.y - t.r * 0.25, t.r * 0.85, 0, 6.28); CTX.fill();
        CTX.save(); CTX.globalAlpha = 0.07; CTX.fillStyle = '#fff';
        CTX.beginPath(); CTX.arc(pos.x - t.r * 0.22, pos.y - t.r * 0.45, t.r * 0.35, 0, 6.28); CTX.fill(); CTX.restore();
    });
}

function drawCampfires(VW, VH) {
    campfires.forEach(c => {
        const pos = relPos(c.x, c.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        c.t++; const flicker = Math.sin(c.t * 0.28) * 4;
        CTX.save();
        CTX.globalAlpha = 0.06 + Math.abs(flicker) * 0.008; CTX.fillStyle = '#ff6600';
        CTX.beginPath(); CTX.arc(pos.x, pos.y, 70, 0, 6.28); CTX.fill();
        CTX.globalAlpha = 1; CTX.shadowBlur = 18 + flicker; CTX.shadowColor = '#ff6600';
        CTX.fillStyle = `hsl(${28 + flicker * 2},100%,${55 + flicker}%)`;
        CTX.beginPath(); CTX.arc(pos.x, pos.y, 4 + Math.abs(flicker) * 0.4, 0, 6.28); CTX.fill(); CTX.restore();
    });
}

function drawProps(VW, VH) {
    props.forEach(p => {
        const pos = relPos(p.x, p.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        if (p.type === 'barrel') {
            CTX.fillStyle = '#6b3500';
            CTX.beginPath(); CTX.ellipse(pos.x, pos.y, 13, 17, 0, 0, 6.28); CTX.fill();
            CTX.strokeStyle = '#9a5010'; CTX.lineWidth = 2;
            CTX.beginPath(); CTX.ellipse(pos.x, pos.y - 5, 13, 4, 0, 0, 6.28); CTX.stroke();
            CTX.beginPath(); CTX.ellipse(pos.x, pos.y + 3, 13, 4, 0, 0, 6.28); CTX.stroke();
        } else {
            CTX.fillStyle = '#7a5c0a'; CTX.fillRect(pos.x - 14, pos.y - 14, 28, 28);
            CTX.fillStyle = '#4a3a08'; CTX.fillRect(pos.x - 12, pos.y - 12, 24, 3);
            CTX.fillRect(pos.x - 12, pos.y + 9, 24, 3);
            CTX.fillStyle = 'rgba(255,255,255,0.06)'; CTX.fillRect(pos.x - 13, pos.y - 13, 26, 13);
            if (p.hp < 3) { CTX.fillStyle = p.hp === 2 ? '#ff0' : '#f00'; CTX.fillRect(pos.x - 10, pos.y - 18, 7 * p.hp, 3); }
        }
    });
}

function drawItems(VW, VH) {
    const cmap = { xp:'#00bfff', xp_big:'#00ffff', hp:'#f55', mag:'#ffff00', shield:'#00ffff' };
    items.forEach(it => {
        const pos = relPos(it.x, it.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        const bob = Math.sin(frame * 0.1 + it.x * 0.01) * 3;
        CTX.save();
        CTX.shadowBlur = 16; CTX.shadowColor = cmap[it.t] || '#fff'; CTX.fillStyle = cmap[it.t] || '#fff';
        if (it.t.includes('xp')) {
            CTX.translate(pos.x, pos.y + bob); CTX.rotate(Math.PI / 4); CTX.fillRect(-5, -5, 10, 10);
        } else {
            CTX.beginPath(); CTX.arc(pos.x, pos.y + bob, 8, 0, 6.28); CTX.fill();
        }
        CTX.restore();
    });
}

function drawEnemyBullets(VW, VH) {
    CTX.save(); CTX.shadowBlur = 10; CTX.shadowColor = '#f55'; CTX.fillStyle = '#f55';
    eBullets.forEach(b => {
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < VW && Math.abs(pos.y) < VH) {
            CTX.beginPath(); CTX.arc(pos.x, pos.y, 7, 0, 6.28); CTX.fill();
        }
    });
    CTX.restore();
}

function drawEnemies(VW, VH) {
    enemies.forEach(e => {
        const pos = relPos(e.x, e.y);
        if (Math.abs(pos.x) > VW || Math.abs(pos.y) > VH) return;
        const ER = e.r * charScale;
        CTX.save();
        if (e.frozen > 0)      { CTX.shadowBlur = 20; CTX.shadowColor = '#00ffff'; }
        else if (e.slowed > 0) { CTX.shadowBlur = 10; CTX.shadowColor = '#0066ff'; }
        else if (e.boss)       { CTX.shadowBlur = 30 + Math.sin(frame * 0.08) * 12; CTX.shadowColor = '#f00'; }

        const img = e.range ? imgRanged : imgMelee;
        try {
            if (img.complete && img.naturalWidth > 0) { CTX.drawImage(img, pos.x - ER, pos.y - ER, ER * 2, ER * 2); }
            else { CTX.fillStyle = e.c; CTX.beginPath(); CTX.arc(pos.x, pos.y, ER, 0, 6.28); CTX.fill(); }
        } catch (err) { CTX.fillStyle = e.c; CTX.beginPath(); CTX.arc(pos.x, pos.y, ER, 0, 6.28); CTX.fill(); }

        if (e.frozen > 0) { CTX.globalAlpha = 0.45; CTX.fillStyle = '#00ffff'; CTX.beginPath(); CTX.arc(pos.x, pos.y, ER, 0, 6.28); CTX.fill(); }
        if (e.boss) { CTX.globalAlpha = 1; CTX.strokeStyle = '#ffd700'; CTX.lineWidth = 4; CTX.beginPath(); CTX.arc(pos.x, pos.y, ER + 4, 0, 6.28); CTX.stroke(); }
        CTX.restore();

        CTX.save();
        CTX.font = `bold ${e.boss ? 15 : 13}px 'Courier New', monospace`;
        CTX.textAlign = 'center';
        const tw = CTX.measureText(e.n).width;
        CTX.fillStyle = 'rgba(0,0,0,0.75)';
        CTX.fillRect(pos.x - tw / 2 - 5, pos.y - ER - 26, tw + 10, 18);
        CTX.fillStyle = e.boss ? '#ffd700' : '#fff';
        CTX.shadowColor = e.boss ? '#ffd700' : e.c; CTX.shadowBlur = 6;
        CTX.fillText(e.n, pos.x, pos.y - ER - 12);
        CTX.restore();

        const bw = ER * 2;
        CTX.fillStyle = '#200'; CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw, 6);
        const pct = e.hp / e.max;
        CTX.fillStyle = e.boss ? `hsl(${pct * 30},100%,50%)` : (pct > 0.5 ? '#0f0' : '#f50');
        CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw * pct, 6);
    });
}

function drawGarlicZone() {
    if (!player.garlic) return;
    const gr = (100 + player.garlic * 28) * charScale;
    const grad = CTX.createRadialGradient(0, 0, gr * 0.6, 0, 0, gr);
    grad.addColorStop(0, 'rgba(255,255,0,0.08)'); grad.addColorStop(1, 'transparent');
    CTX.fillStyle = grad; CTX.beginPath(); CTX.arc(0, 0, gr, 0, 6.28); CTX.fill();
    CTX.strokeStyle = 'rgba(255,255,0,0.25)'; CTX.lineWidth = 1; CTX.setLineDash([8, 12]);
    CTX.beginPath(); CTX.arc(0, 0, gr, 0, 6.28); CTX.stroke(); CTX.setLineDash([]);
}

function drawShieldRing() {
    if (!player.shield) return;
    CTX.save(); CTX.shadowBlur = 18; CTX.shadowColor = '#00ffff';
    CTX.strokeStyle = `rgba(0,255,255,${0.3 + player.shield * 0.15})`;
    CTX.lineWidth = 3 + player.shield;
    CTX.beginPath(); CTX.arc(0, 0, player.r * charScale + 8, 0, 6.28); CTX.stroke();
    CTX.restore();
}

function drawOrbs() {
    if (!player.orb) return;
    for (let i = 0; i < player.orb; i++) {
        const a = orbAng + (Math.PI * 2 / player.orb) * i;
        const ox = Math.cos(a) * player.orbRange, oy = Math.sin(a) * player.orbRange;
        CTX.save(); CTX.shadowBlur = 15; CTX.shadowColor = '#d0f'; CTX.fillStyle = '#d0f';
        CTX.beginPath(); CTX.arc(ox, oy, 10 * charScale, 0, 6.28); CTX.fill(); CTX.restore();
    }
}

function drawDashBar() {
    if (player.dashCd <= 0) return;
    const PR = player.r * charScale;
    CTX.fillStyle = '#222'; CTX.fillRect(-24, -PR - 14, 48, 5);
    CTX.fillStyle = '#0ff'; CTX.fillRect(-24, -PR - 14, 48 * (1 - player.dashCd / player.maxDashCd), 5);
}

function drawPlayer() {
    const PR = player.r * charScale;
    if (player.invul <= 0 || frame % 8 < 4) {
        try {
            if (imgPlayer.complete && imgPlayer.naturalWidth > 0) {
                CTX.drawImage(imgPlayer, -PR, -PR, PR * 2, PR * 2);
            } else {
                CTX.fillStyle = '#1a3a1a';
                CTX.beginPath(); CTX.arc(0, 0, PR, 0, 6.28); CTX.fill();
            }
        } catch (e) {
            CTX.fillStyle = '#1a3a1a';
            CTX.beginPath(); CTX.arc(0, 0, PR, 0, 6.28); CTX.fill();
        }
    }

    const avatarSrc = avatarCanvas.width > 0 ? avatarCanvas : (imgAvatar.complete && imgAvatar.naturalWidth > 0 ? imgAvatar : null);
    if (avatarSrc) {
        CTX.save();
        CTX.beginPath(); CTX.arc(0, 0, PR, 0, Math.PI * 2); CTX.clip();
        CTX.globalAlpha = (player.invul > 0 && frame % 8 >= 4) ? 0.3 : 0.88;
        CTX.drawImage(avatarSrc, -PR, -PR, PR * 2, PR * 2);
        CTX.restore();
    }

    CTX.save();
    CTX.strokeStyle = player.shield > 0 ? '#00ffff' : '#00ff44';
    CTX.lineWidth = 2.5;
    CTX.shadowBlur = 12; CTX.shadowColor = player.shield > 0 ? '#00ffff' : '#00ff44';
    CTX.beginPath(); CTX.arc(0, 0, PR, 0, Math.PI * 2); CTX.stroke();
    CTX.restore();
}

function drawBullets(VW, VH) {
    CTX.save();
    CTX.shadowBlur  = 12;
    CTX.shadowColor = player.explosiveBullets ? '#ff6600' : '#ff0';
    CTX.fillStyle   = player.explosiveBullets ? '#ff6600' : (player.slowBullets ? '#6699ff' : '#ff0');
    bullets.forEach(b => {
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < VW && Math.abs(pos.y) < VH) {
            CTX.beginPath(); CTX.arc(pos.x, pos.y, player.explosiveBullets ? 8 : 6, 0, 6.28); CTX.fill();
        }
    });
    CTX.restore();
}

function drawParticles() {
    parts.forEach(p => {
        const pos = relPos(p.x, p.y);
        CTX.save(); CTX.globalAlpha = Math.max(0, p.l / 30); CTX.fillStyle = p.c;
        CTX.beginPath(); CTX.arc(pos.x, pos.y, p.sz || 3, 0, 6.28); CTX.fill(); CTX.restore();
        p.x = wrap(p.x + p.vx, MAP_W); p.y = wrap(p.y + p.vy, MAP_H); p.l--;
    });
    parts = parts.filter(p => p.l > 0);
}

function drawFloats() {
    floats.forEach(f => {
        const pos = relPos(f.x, f.y);
        CTX.save(); CTX.globalAlpha = Math.max(0, f.l / 50); CTX.fillStyle = f.c;
        CTX.font = 'bold 22px monospace'; CTX.textAlign = 'center';
        CTX.shadowBlur = 8; CTX.shadowColor = f.c;
        CTX.fillText(f.t, pos.x, pos.y); CTX.restore();
        f.y -= 0.7; f.l--;
    });
    floats = floats.filter(f => f.l > 0);
}

function drawMinimap() {
    const MS = 140, SC = MS / MAP_W, MX = W - MS - 10, MY = 65;
    CTX.save();
    CTX.fillStyle = 'rgba(0,0,0,0.75)'; CTX.fillRect(MX, MY, MS, MS);
    CTX.strokeStyle = '#2a2a2a'; CTX.lineWidth = 1; CTX.strokeRect(MX, MY, MS, MS);

    const tc = { water:'#003', sand:'#432', ruins:'#222', forest:'#030', lava:'#300', snow:'#aaf', swamp:'#121' };
    terrainZones.forEach(z => {
        CTX.globalAlpha = 0.5; CTX.fillStyle = tc[z.type] || '#111';
        CTX.beginPath(); CTX.arc(MX + z.x * SC, MY + z.y * SC, z.r * SC, 0, 6.28); CTX.fill();
    });
    CTX.globalAlpha = 1;

    enemies.forEach(e => {
        CTX.fillStyle = e.boss ? '#ff6600' : '#f00';
        CTX.fillRect(MX + e.x * SC - 1.5, MY + e.y * SC - 1.5, e.boss ? 4 : 3, e.boss ? 4 : 3);
    });

    CTX.fillStyle = '#00bfff';
    items.forEach(it => CTX.fillRect(MX + it.x * SC - 1, MY + it.y * SC - 1, 2, 2));

    const px = MX + player.x * SC, py = MY + player.y * SC;
    CTX.save(); CTX.shadowBlur = 8; CTX.shadowColor = '#0f0'; CTX.fillStyle = '#0f0';
    CTX.beginPath(); CTX.arc(px, py, 3.5, 0, 6.28); CTX.fill(); CTX.restore();

    CTX.fillStyle = '#333'; CTX.font = '9px monospace'; CTX.textAlign = 'center';
    CTX.fillText('MİNİ HARİTA', MX + MS / 2, MY + MS + 13);
    CTX.restore();
}
