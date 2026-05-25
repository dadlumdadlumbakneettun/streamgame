function wdist(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    if (dx > MAP_W / 2) dx = MAP_W - dx;
    if (dy > MAP_H / 2) dy = MAP_H - dy;
    return Math.sqrt(dx * dx + dy * dy);
}

function relPos(ox, oy) {
    let dx = ox - player.x;
    let dy = oy - player.y;
    if (dx < -MAP_W / 2) dx += MAP_W; else if (dx > MAP_W / 2) dx -= MAP_W;
    if (dy < -MAP_H / 2) dy += MAP_H; else if (dy > MAP_H / 2) dy -= MAP_H;
    return { x: dx, y: dy };
}

function wrap(val, max) {
    return ((val % max) + max) % max;
}

function getTarget() {
    let t = null, md = 750;
    for (const e of enemies) {
        const d = wdist(player.x, player.y, e.x, e.y);
        if (d < md) { md = d; t = e; }
    }
    return t;
}

function txt(x, y, t, c) {
    floats.push({ x, y, t: String(t), c: c || '#fff', l: 55 });
}

function dropItem(x, y, t) {
    items.push({ x, y, t });
}

function spawnConfetti() {
    for (let i = 0; i < 70; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left       = Math.random() * 100 + 'vw';
        c.style.background = `hsl(${Math.random() * 360},100%,55%)`;
        c.style.animationDuration = (0.9 + Math.random()) + 's';
        c.style.width = c.style.height = (8 + Math.random() * 8) + 'px';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 2000);
    }
}
