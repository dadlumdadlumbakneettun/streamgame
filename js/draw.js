// Pixel Art tarzını desteklemek için Canvas üzerinde keskin piksel render ayarı (Gerektiğinde dışarıda da çağrılabilir)
if (typeof CTX !== 'undefined' && CTX) {
    CTX.imageSmoothingEnabled = false;
    CTX.mozImageSmoothingEnabled = false;
    CTX.webkitImageSmoothingEnabled = false;
    CTX.msImageSmoothingEnabled = false;
}

// Çizim fonksiyonlarının herhangi birinde hata oluşsa bile oyunun donmasını engelleyen güvenli sarmalayıcı
function safeDraw(drawFn, name) {
    try {
        drawFn();
    } catch (e) {
        // Hata konsola yazdırılır ancak oyunun çizimi ve akışı asla kesintiye uğramaz
        console.warn(`Çizim Hatası [${name}]:`, e);
    }
}

function draw() {
    if (typeof CTX === 'undefined' || !CTX) return;

    // Derin ve piksellenmiş orman tabanı arka plan rengi
    CTX.fillStyle = '#050c05';
    CTX.fillRect(0, 0, W, H);
    
    // zoomLevel değerinin tanımsız, 0 veya negatif olma ihtimaline karşı güvenlik bariyeri
    const safeZoom = (typeof zoomLevel !== 'undefined' && zoomLevel && zoomLevel > 0.05 && !isNaN(zoomLevel)) ? zoomLevel : 1.0;
    
    CTX.save();
    try {
        CTX.translate(W / 2, H / 2);
        CTX.scale(safeZoom, safeZoom);
        
        const VW = W / safeZoom, VH = H / safeZoom;
        const HVW = VW / 2 + 80, HVH = VH / 2 + 80; // Görüş alanı dışı eleme marjı

        // KATMANLI GÜVENLİ ÇİZİM SIRASI
        safeDraw(() => drawTerrain(VW, VH, HVW, HVH), "Zemin Bölgeleri");
        safeDraw(() => drawGrid(VW, VH), "Piksel Izgara");
        safeDraw(() => drawRoads(VW, VH), "Yollar");
        safeDraw(() => drawLandmarks(HVW, HVH), "İşaret Noktaları");
        safeDraw(() => drawRocks(HVW, HVH), "Kayalar");
        safeDraw(() => drawTrees(HVW, HVH), "Ağaçlar");
        safeDraw(() => drawCampfires(HVW, HVH), "Kamp Ateşleri");
        safeDraw(() => drawProps(HVW, HVH), "Kutular ve Variller");
        safeDraw(() => drawItems(HVW, HVH), "Yerdeki Eşyalar");
        safeDraw(() => drawEnemyBullets(VW, VH), "Düşman Mermileri");
        safeDraw(() => drawEnemies(HVW, HVH), "Düşmanlar");
        safeDraw(() => drawGarlicZone(), "Sarımsak Alanı");
        safeDraw(() => drawShieldRing(), "Kalkan Çemberi");
        safeDraw(() => drawOrbs(), "Dönen Orb'lar");
        safeDraw(() => drawDashBar(), "Dash Barı");
        safeDraw(() => drawPlayer(), "Oyuncu");
        safeDraw(() => drawBullets(VW, VH), "Oyuncu Mermileri");
        safeDraw(() => drawParticles(), "Parçacık Efektleri");
        safeDraw(() => drawFloats(), "Hasar Sayıları");
    } finally {
        CTX.restore();
    }
    
    // Pixel art temalı detaylı mini harita
    safeDraw(() => drawMinimap(), "Mini Harita");
}

// Detaylı pixel art arazi renk paletleri
const terrainColors = {
    water:  { main: '#004c8c', light: '#0073b3', dark: '#00264d', accent: '#33ccff' },
    sand:   { main: '#bfa15f', light: '#d9c58c', dark: '#8c6b30', accent: '#f2e5b1' },
    ruins:  { main: '#424d3b', light: '#5e6b54', dark: '#2b3325', accent: '#7c8c70' },
    forest: { main: '#133a13', light: '#1d541d', dark: '#0b240b', accent: '#2e7a2e' },
    lava:   { main: '#a82000', light: '#e04c00', dark: '#610a00', accent: '#ffb300' },
    snow:   { main: '#c6d9d9', light: '#e8f2f2', dark: '#98b3b3', accent: '#ffffff' },
    swamp:  { main: '#1c2e15', light: '#2c4721', dark: '#0e1a0a', accent: '#3e632e' }
};

// Arazileri detaylı pixel art dokularıyla çiz
function drawTerrain(VW, VH, HVW, HVH) {
    if (typeof terrainZones === 'undefined' || !terrainZones) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    terrainZones.forEach(z => {
        if (!z) return;
        const pos = relPos(z.x, z.y);
        if (Math.abs(pos.x) > safeHVW + z.r || Math.abs(pos.y) > safeHVH + z.r) return;

        const colors = terrainColors[z.type] || terrainColors.forest;
        
        // Arazi taban dairesi
        CTX.fillStyle = colors.main;
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, z.r, 0, Math.PI * 2);
        CTX.fill();

        // Pixel Art Tarzı Tırtıklı Kenarlık (Dithering Simülasyonu)
        CTX.save();
        CTX.strokeStyle = colors.dark;
        CTX.lineWidth = 6;
        CTX.setLineDash([8, 12, 4, 16]); 
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, z.r - 3, 0, Math.PI * 2);
        CTX.stroke();
        CTX.restore();

        // Bölgeye özel İç Pixel Art Doku Elemanları
        const seed = Math.floor(z.x + z.y);
        const detailCount = 14;
        
        CTX.save();
        for (let i = 0; i < detailCount; i++) {
            const angle = ((seed * (i + 1) * 123.45) % 360) * Math.PI / 180;
            const dist = ((seed * (i + 5) * 67.89) % (z.r * 0.8));
            const px = pos.x + Math.cos(angle) * dist;
            const py = pos.y + Math.sin(angle) * dist;

            CTX.fillStyle = (i % 3 === 0) ? colors.light : ((i % 3 === 1) ? colors.accent : colors.dark);
            
            if (z.type === 'water') {
                CTX.fillRect(px - 6, py, 12, 3);
                CTX.fillRect(px - 2, py - 3, 4, 3);
            } else if (z.type === 'lava') {
                CTX.fillRect(px - 3, py - 3, 6, 6);
                CTX.fillStyle = '#fff';
                CTX.fillRect(px - 1, py - 1, 2, 2);
            } else if (z.type === 'forest' || z.type === 'swamp') {
                CTX.fillRect(px, py, 3, 9);
                CTX.fillRect(px - 3, py + 3, 3, 6);
                CTX.fillRect(px + 3, py + 3, 3, 6);
            } else if (z.type === 'snow') {
                CTX.fillRect(px - 2, py - 2, 5, 5);
                CTX.fillStyle = '#fff';
                CTX.fillRect(px, py - 4, 1, 9);
                CTX.fillRect(px - 4, py, 9, 1);
            } else if (z.type === 'ruins') {
                CTX.fillRect(px - 5, py - 2, 10, 4);
                CTX.fillStyle = colors.dark;
                CTX.fillRect(px - 5, py + 2, 10, 1);
            } else {
                CTX.fillRect(px - 2, py - 2, 4, 4);
            }
        }
        CTX.restore();
    });
}

// Yolları piksellenmiş parke taşı veya toprak yol görünümüne kavuştur
function drawRoads(VW, VH) {
    if (typeof roads === 'undefined' || !roads) return;

    const safeVW = Math.min(VW, 3000);
    const safeVH = Math.min(VH, 3000);

    roads.forEach(rd => {
        if (!rd) return;
        CTX.save(); 
        
        CTX.fillStyle = '#1c1712'; 
        
        let dy = rd.pos - player.y;
        if (dy < -MAP_H / 2) dy += MAP_H; else if (dy > MAP_H / 2) dy -= MAP_H;
        let dx = rd.pos - player.x;
        if (dx < -MAP_W / 2) dx += MAP_W; else if (dx > MAP_W / 2) dx -= MAP_W;

        if (rd.type === 'h') {
            CTX.fillRect(-safeVW, dy - 21, safeVW * 2, 42);
            
            CTX.fillStyle = '#2d251e';
            CTX.fillRect(-safeVW, dy - 24, safeVW * 2, 3);
            CTX.fillRect(-safeVW, dy + 21, safeVW * 2, 3);
            
            CTX.fillStyle = '#120f0c';
            for (let x = -safeVW; x < safeVW; x += 40) {
                const shift = Math.abs(Math.sin(x)) * 12;
                CTX.fillRect(x + shift, dy - 10, 8, 4);
                CTX.fillRect(x + shift + 15, dy + 8, 12, 4);
            }
        } else {
            CTX.fillRect(dx - 21, -safeVH, 42, safeVH * 2);
            
            CTX.fillStyle = '#2d251e';
            CTX.fillRect(dx - 24, -safeVH, 3, safeVH * 2);
            CTX.fillRect(dx + 21, -safeVH, 3, safeVH * 2);
            
            CTX.fillStyle = '#120f0c';
            for (let y = -safeVH; y < safeVH; y += 40) {
                const shift = Math.abs(Math.cos(y)) * 12;
                CTX.fillRect(dx - 10, y + shift, 4, 8);
                CTX.fillRect(dx + 8, y + shift + 15, 4, 12);
            }
        }
        CTX.restore();
    });
}

// Zemin piksellenmiş ızgara ve yosun dokusu çizimi
function drawGrid(VW, VH) {
    const safeVW = Math.min(VW, 3000);
    const safeVH = Math.min(VH, 3000);

    CTX.save();
    
    const gs = 80; 
    const ox = player.x % gs, oy = player.y % gs;
    
    CTX.strokeStyle = '#10240d'; 
    CTX.lineWidth = 2;
    CTX.setLineDash([4, 12]); 
    
    CTX.beginPath();
    for (let x = -safeVW / 2 - gs; x < safeVW / 2 + gs; x += gs) {
        const dx = Math.floor((x - ox) / gs) * gs + (gs - ox);
        CTX.moveTo(dx, -safeVH / 2); CTX.lineTo(dx, safeVH / 2);
    }
    for (let y = -safeVH / 2 - gs; y < safeVH / 2 + gs; y += gs) {
        const dy = Math.floor((y - oy) / gs) * gs + (gs - oy);
        CTX.moveTo(-safeVW / 2, dy); CTX.lineTo(safeVW / 2, dy); // Yatay çizgi hizalama hatası düzeltildi
    }
    CTX.stroke();
    
    CTX.fillStyle = '#173614';
    for (let x = -safeVW / 2 - gs; x < safeVW / 2 + gs; x += gs) {
        const dx = Math.floor((x - ox) / gs) * gs + (gs - ox);
        for (let y = -safeVH / 2 - gs; y < safeVH / 2 + gs; y += gs) {
            const dy = Math.floor((y - oy) / gs) * gs + (gs - oy);
            
            const hash = Math.abs(Math.sin(dx * 12.9898 + dy * 78.233)) * 43758.5453;
            if (hash % 10 > 7) {
                CTX.fillRect(dx + (hash % 20) - 10, dy + ((hash >> 2) % 20) - 10, 4, 4);
                CTX.fillRect(dx + (hash % 20) - 6, dy + ((hash >> 2) % 20) - 8, 4, 2);
            }
        }
    }
    
    CTX.restore();
}

// Landmark (İşaret noktaları) - Gizemli pixel rün dairesi şeklinde
function drawLandmarks(HVW, HVH) {
    if (typeof landmarks === 'undefined' || !landmarks) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    landmarks.forEach(lm => {
        if (!lm) return;
        const pos = relPos(lm.x, lm.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        CTX.save();
        CTX.strokeStyle = '#a484ff';
        CTX.lineWidth = 2;
        CTX.setLineDash([6, 10, 2, 8]);
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, lm.r, 0, Math.PI * 2);
        CTX.stroke();

        CTX.fillStyle = 'rgba(164, 132, 255, 0.05)';
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, lm.r, 0, Math.PI * 2);
        CTX.fill();

        CTX.fillStyle = '#4b3d61';
        CTX.fillRect(pos.x - 12, pos.y - 12, 24, 24);
        CTX.fillStyle = '#7a649e';
        CTX.fillRect(pos.x - 10, pos.y - 10, 20, 6); 
        CTX.fillStyle = '#2a2238';
        CTX.fillRect(pos.x - 12, pos.y + 8, 24, 4);  
        
        CTX.globalAlpha = 0.8;
        CTX.fillStyle = '#ffffff';
        CTX.font = "bold 11px 'Courier New', monospace";
        CTX.textAlign = 'center';
        const lmName = lm.name ? lm.name.toUpperCase() : "LANDMARK";
        CTX.fillText(`.: ${lmName} :.`, pos.x, pos.y - lm.r - 10);
        CTX.restore();
    });
}

// Kayaları gölgeli ve köşeli pixel art tarzında çiz
function drawRocks(HVW, HVH) {
    if (typeof rocks === 'undefined' || !rocks) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    rocks.forEach(r => {
        if (!r) return;
        const pos = relPos(r.x, r.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        CTX.save();
        
        CTX.fillStyle = 'rgba(0,0,0,0.45)';
        CTX.beginPath();
        CTX.ellipse(pos.x + r.r * 0.15, pos.y + r.r * 0.4, r.r, r.r * 0.45, 0, 0, Math.PI * 2);
        CTX.fill();

        CTX.fillStyle = r.c || '#666'; 
        CTX.beginPath();
        const steps = 6;
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const radiusOffset = ((Math.sin(i * 15) * 0.15) + 0.95) * r.r;
            const px = pos.x + Math.cos(angle) * radiusOffset;
            const py = pos.y + Math.sin(angle) * radiusOffset * 0.85;
            if (i === 0) CTX.moveTo(px, py); else CTX.lineTo(px, py);
        }
        CTX.closePath();
        CTX.fill();

        CTX.fillStyle = '#a0a0a0'; 
        CTX.beginPath();
        CTX.moveTo(pos.x - r.r * 0.8, pos.y - r.r * 0.1);
        CTX.lineTo(pos.x - r.r * 0.2, pos.y - r.r * 0.7);
        CTX.lineTo(pos.x + r.r * 0.5, pos.y - r.r * 0.6);
        CTX.lineTo(pos.x + r.r * 0.2, pos.y);
        CTX.closePath();
        CTX.fill();

        CTX.strokeStyle = '#2d2d2d';
        CTX.lineWidth = 2.5;
        CTX.beginPath();
        CTX.moveTo(pos.x - r.r * 0.3, pos.y - r.r * 0.3);
        CTX.lineTo(pos.x - r.r * 0.1, pos.y + r.r * 0.1);
        CTX.lineTo(pos.x + r.r * 0.2, pos.y + r.r * 0.2);
        CTX.stroke();

        CTX.restore();
    });
}

// Ağaçları muhteşem katmanlı pixel art çam/yaprak ağacı şeklinde çiz
function drawTrees(HVW, HVH) {
    if (typeof trees === 'undefined' || !trees) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    trees.forEach(t => {
        if (!t) return;
        const pos = relPos(t.x, t.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        CTX.save();
        
        CTX.fillStyle = 'rgba(0, 0, 0, 0.4)';
        CTX.beginPath();
        CTX.ellipse(pos.x + 6, pos.y + t.r * 0.4, t.r * 0.8, t.r * 0.3, 0, 0, Math.PI * 2);
        CTX.fill();

        CTX.fillStyle = '#42240c'; 
        CTX.fillRect(pos.x - 5, pos.y - t.r * 0.1, 10, t.r * 0.6);
        CTX.fillStyle = '#261405';
        CTX.fillRect(pos.x - 5, pos.y - t.r * 0.1, 4, t.r * 0.6);

        const leafColor = t.color || '#1e4c1e';
        const shadowLeafColor = '#0f2b0f';
        const lightLeafColor = '#307530';
        
        const layers = [
            { r: t.r * 0.9, yOffset: -t.r * 0.1, h: t.r * 0.65 },
            { r: t.r * 0.75, yOffset: -t.r * 0.5, h: t.r * 0.55 },
            { r: t.r * 0.55, yOffset: -t.r * 0.9, h: t.r * 0.45 }
        ];

        layers.forEach((layer, idx) => {
            const ly = pos.y + layer.yOffset;
            
            CTX.fillStyle = shadowLeafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r, ly + layer.h * 0.5);
            CTX.lineTo(pos.x + layer.r, ly + layer.h * 0.5);
            CTX.lineTo(pos.x, ly - layer.h * 0.5);
            CTX.closePath();
            CTX.fill();

            CTX.fillStyle = leafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r + 3, ly + layer.h * 0.4);
            CTX.lineTo(pos.x + layer.r - 3, ly + layer.h * 0.4);
            CTX.lineTo(pos.x, ly - layer.h * 0.4);
            CTX.closePath();
            CTX.fill();

            CTX.fillStyle = lightLeafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r * 0.7, ly + layer.h * 0.1);
            CTX.lineTo(pos.x, ly + layer.h * 0.2);
            CTX.lineTo(pos.x, ly - layer.h * 0.4);
            CTX.closePath();
            CTX.fill();
            
            CTX.fillStyle = shadowLeafColor;
            CTX.fillRect(pos.x - layer.r, ly + layer.h * 0.45, 4, 3);
            CTX.fillRect(pos.x + layer.r - 4, ly + layer.h * 0.45, 4, 3);
            CTX.fillRect(pos.x - 2, ly + layer.h * 0.45, 4, 3);
        });

        CTX.restore();
    });
}

// Kamp ateşlerini animasyonlu, çıtırdayan odunlu ve piksellenmiş alev efektleriyle çiz
function drawCampfires(HVW, HVH) {
    if (typeof campfires === 'undefined' || !campfires) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    campfires.forEach(c => {
        if (!c) return;
        const pos = relPos(c.x, c.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        // Zamanlayıcı tanımsız ise güvenle sıfırla (NaN kilitlenmesini engeller)
        if (typeof c.t === 'undefined' || isNaN(c.t)) c.t = 0;
        c.t++;
        const animState = Math.floor(c.t * 0.15) % 4; 
        
        CTX.save();
        
        CTX.fillStyle = 'rgba(0,0,0,0.5)';
        CTX.beginPath();
        CTX.arc(pos.x, pos.y + 4, 18, 0, Math.PI * 2);
        CTX.fill();

        CTX.fillStyle = '#595959';
        const stoneAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        stoneAngles.forEach(ang => {
            const rad = ang * Math.PI / 180;
            const sx = pos.x + Math.cos(rad) * 14;
            const sy = pos.y + Math.sin(rad) * 11;
            CTX.fillRect(sx - 3, sy - 3, 6, 5);
            CTX.fillStyle = '#3a3a3a';
            CTX.fillRect(sx - 1, sy - 1, 2, 2); 
        });

        CTX.fillStyle = '#4d2600';
        CTX.fillRect(pos.x - 10, pos.y - 3, 20, 4);
        CTX.fillRect(pos.x - 3, pos.y - 10, 4, 20);

        const flicker = Math.sin(c.t * 0.3) * 2;
        
        CTX.fillStyle = '#e65c00';
        CTX.beginPath();
        CTX.moveTo(pos.x - 8 - flicker, pos.y + 2);
        CTX.lineTo(pos.x + 8 + flicker, pos.y + 2);
        CTX.lineTo(pos.x + flicker * 0.5, pos.y - 14 - animState * 2);
        CTX.closePath();
        CTX.fill();

        CTX.fillStyle = '#ffcc00';
        CTX.beginPath();
        CTX.moveTo(pos.x - 5, pos.y + 1);
        CTX.lineTo(pos.x + 5, pos.y + 1);
        CTX.lineTo(pos.x, pos.y - 8 - animState);
        CTX.closePath();
        CTX.fill();

        CTX.fillStyle = '#ffffff';
        CTX.fillRect(pos.x - 2, pos.y - 2, 4, 5);
        
        CTX.fillStyle = '#ff9900';
        if (animState === 0) CTX.fillRect(pos.x - 4, pos.y - 18, 2, 2);
        if (animState === 1) CTX.fillRect(pos.x + 3, pos.y - 22, 2, 2);
        if (animState === 2) CTX.fillRect(pos.x - 1, pos.y - 25, 2, 2);
        if (animState === 3) CTX.fillRect(pos.x + 5, pos.y - 16, 2, 2);

        CTX.restore();
    });
}

// Barrel (Varil) ve Box (Kutu) objelerini detaylı pikselli dokularla süsle
function drawProps(HVW, HVH) {
    if (typeof props === 'undefined' || !props) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    props.forEach(p => {
        if (!p) return;
        const pos = relPos(p.x, p.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        CTX.save();
        
        if (p.type === 'barrel') {
            CTX.fillStyle = 'rgba(0,0,0,0.35)';
            CTX.fillRect(pos.x - 13, pos.y + 11, 26, 6);

            CTX.fillStyle = '#5c2d00'; 
            CTX.fillRect(pos.x - 12, pos.y - 15, 24, 30);
            
            CTX.fillStyle = '#3d1e00';
            CTX.fillRect(pos.x - 12, pos.y - 15, 3, 30);
            CTX.fillRect(pos.x + 9, pos.y - 15, 3, 30);

            CTX.fillStyle = '#7a8a99';
            CTX.fillRect(pos.x - 12, pos.y - 8, 24, 3);
            CTX.fillRect(pos.x - 12, pos.y + 5, 24, 3);
            CTX.fillStyle = '#cbd4db'; 
            CTX.fillRect(pos.x - 6, pos.y - 8, 3, 3);
            CTX.fillRect(pos.x - 6, pos.y + 5, 3, 3);

            CTX.fillStyle = '#291400';
            CTX.fillRect(pos.x - 4, pos.y - 15, 2, 30);
            CTX.fillRect(pos.x + 3, pos.y - 15, 2, 30);
        } else {
            CTX.fillStyle = 'rgba(0,0,0,0.35)';
            CTX.fillRect(pos.x - 15, pos.y + 11, 30, 6);

            CTX.fillStyle = '#8f612d'; 
            CTX.fillRect(pos.x - 14, pos.y - 14, 28, 28);

            CTX.fillStyle = '#4f3311'; 
            CTX.strokeRect(pos.x - 14, pos.y - 14, 28, 28);
            CTX.fillRect(pos.x - 14, pos.y - 14, 28, 3); 
            CTX.fillRect(pos.x - 14, pos.y + 11, 28, 3); 

            CTX.strokeStyle = '#4f3311';
            CTX.lineWidth = 3.5;
            CTX.beginPath();
            CTX.moveTo(pos.x - 11, pos.y - 11);
            CTX.lineTo(pos.x + 11, pos.y + 11);
            CTX.moveTo(pos.x + 11, pos.y - 11);
            CTX.lineTo(pos.x - 11, pos.y + 11);
            CTX.stroke();

            CTX.fillStyle = '#b8c4c7';
            CTX.fillRect(pos.x - 12, pos.y - 12, 2, 2);
            CTX.fillRect(pos.x + 10, pos.y - 12, 2, 2);
            CTX.fillRect(pos.x - 12, pos.y + 10, 2, 2);
            CTX.fillRect(pos.x + 10, pos.y + 10, 2, 2);

            if (typeof p.hp !== 'undefined' && p.hp < 3) {
                CTX.fillStyle = '#1a0000';
                CTX.fillRect(pos.x - 14, pos.y - 20, 28, 5);
                CTX.fillStyle = p.hp === 2 ? '#ffcc00' : '#ff2200';
                CTX.fillRect(pos.x - 13, pos.y - 19, 8 * p.hp, 3);
            }
        }
        CTX.restore();
    });
}

// Yerden toplanabilir eşyaları pixel art nesnelerine dönüştür
function drawItems(HVW, HVH) {
    if (typeof items === 'undefined' || !items) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    items.forEach(it => {
        if (!it) return;
        const pos = relPos(it.x, it.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        CTX.save();
        
        const col = ITEM_CMAP[it.t] || '#fff';
        CTX.fillStyle = col;
        CTX.globalAlpha = 0.22;
        CTX.beginPath();
        CTX.arc(pos.x, pos.y + 2, 11, 0, Math.PI * 2);
        CTX.fill();
        CTX.globalAlpha = 1.0;

        if (it.t && it.t.includes('xp')) {
            const isBig = it.t === 'xp_big';
            const sz = isBig ? 8 : 5;
            
            CTX.fillStyle = isBig ? '#00ffff' : '#00bfff';
            CTX.beginPath();
            CTX.moveTo(pos.x, pos.y - sz);
            CTX.lineTo(pos.x + sz, pos.y);
            CTX.lineTo(pos.x, pos.y + sz);
            CTX.lineTo(pos.x - sz, pos.y);
            CTX.closePath();
            CTX.fill();
            
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        } else if (it.t === 'hp') {
            CTX.fillStyle = '#ff3333';
            CTX.fillRect(pos.x - 5, pos.y - 4, 4, 3);
            CTX.fillRect(pos.x + 1, pos.y - 4, 4, 3);
            CTX.fillRect(pos.x - 6, pos.y - 1, 12, 3);
            CTX.fillRect(pos.x - 4, pos.y + 2, 8, 3);
            CTX.fillRect(pos.x - 2, pos.y + 5, 4, 2);
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 3, pos.y - 3, 2, 2);
        } else if (it.t === 'mag') {
            CTX.fillStyle = '#ffcc00';
            CTX.fillRect(pos.x - 5, pos.y - 5, 10, 3);
            CTX.fillStyle = '#3399ff';
            CTX.fillRect(pos.x - 5, pos.y - 2, 3, 7);
            CTX.fillRect(pos.x + 2, pos.y - 2, 3, 7);
        } else if (it.t === 'shield') {
            CTX.fillStyle = '#00e5ff';
            CTX.beginPath();
            CTX.moveTo(pos.x, pos.y - 7);
            CTX.lineTo(pos.x + 6, pos.y - 3);
            CTX.lineTo(pos.x + 5, pos.y + 3);
            CTX.lineTo(pos.x, pos.y + 8);
            CTX.lineTo(pos.x - 5, pos.y + 3);
            CTX.lineTo(pos.x - 6, pos.y - 3);
            CTX.closePath();
            CTX.fill();
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 2, pos.y - 3, 4, 5);
        } else {
            CTX.fillStyle = '#d4af37';
            CTX.fillRect(pos.x - 6, pos.y - 5, 12, 10);
            CTX.fillStyle = '#1a1a1a';
            CTX.fillRect(pos.x - 2, pos.y - 1, 4, 3);
        }
        
        CTX.restore();
    });
}

// Düşman mermilerini pikselli, parlayan sihir kürelerine dönüştür
function drawEnemyBullets(VW, VH) {
    if (typeof eBullets === 'undefined' || !eBullets) return;

    const safeVW = Math.min(VW, 3000);
    const safeVH = Math.min(VH, 3000);

    CTX.save();
    eBullets.forEach(b => {
        if (!b) return;
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < safeVW && Math.abs(pos.y) < safeVH) {
            CTX.fillStyle = 'rgba(255,85,85,0.4)';
            CTX.fillRect(pos.x - 6, pos.y - 6, 12, 12);
            
            CTX.fillStyle = '#ff2222';
            CTX.fillRect(pos.x - 4, pos.y - 4, 8, 8);
            
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        }
    });
    CTX.restore();
}

// Düşmanları çok daha şık, detaylı, karanlık fantezi canavarı piksellerine dönüştür
function drawEnemies(HVW, HVH) {
    if (typeof enemies === 'undefined' || !enemies) return;

    const safeHVW = Math.min(HVW, 2000);
    const safeHVH = Math.min(HVH, 2000);

    enemies.forEach(e => {
        if (!e) return;
        const pos = relPos(e.x, e.y);
        if (Math.abs(pos.x) > safeHVW || Math.abs(pos.y) > safeHVH) return;
        
        const ER = e.r * charScale;
        CTX.save();

        CTX.fillStyle = 'rgba(0, 0, 0, 0.45)';
        CTX.beginPath();
        CTX.ellipse(pos.x, pos.y + ER * 0.8, ER * 0.8, ER * 0.3, 0, 0, Math.PI * 2);
        CTX.fill();

        if (e.frozen > 0) {
            CTX.fillStyle = '#00ffff';
            CTX.shadowBlur = 10;
            CTX.shadowColor = '#00ffff';
        } else if (e.boss) {
            CTX.strokeStyle = '#ff0055';
            CTX.lineWidth = 2;
            CTX.setLineDash([4, 6]);
            CTX.beginPath();
            CTX.arc(pos.x, pos.y, ER + 5, 0, Math.PI * 2);
            CTX.stroke();
        }

        // Görsel tanımlarının eksik olması/isimlendirme farklılığı ihtimaline karşı güvenli kontrol
        const img = e.range ? 
            (typeof imgRanged !== 'undefined' ? imgRanged : null) : 
            (typeof imgMelee !== 'undefined' ? imgMelee : null);
            
        let drawnCustom = false;
        
        try {
            if (img && img.complete && img.naturalWidth > 0) {
                CTX.drawImage(img, pos.x - ER, pos.y - ER, ER * 2, ER * 2);
            } else {
                drawnCustom = true;
            }
        } catch (err) {
            drawnCustom = true;
        }

        if (drawnCustom) {
            CTX.fillStyle = e.c || '#801a1a';
            
            if (e.range) {
                CTX.fillRect(pos.x - ER * 0.8, pos.y - ER * 0.8, ER * 1.6, ER * 1.6);
                CTX.fillStyle = '#4a0d0d';
                CTX.fillRect(pos.x - ER * 1.4, pos.y - ER * 0.4, ER * 0.6, ER * 0.8);
                CTX.fillRect(pos.x + ER * 0.8, pos.y - ER * 0.4, ER * 0.6, ER * 0.8);
                CTX.fillStyle = '#ff0033';
                CTX.fillRect(pos.x - 3, pos.y - 3, 6, 6);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            } else {
                CTX.fillRect(pos.x - ER, pos.y - ER * 0.6, ER * 2, ER * 1.4);
                CTX.fillStyle = '#2b1a4a';
                CTX.fillRect(pos.x - ER * 0.8, pos.y + ER * 0.5, ER * 1.6, ER * 0.5);
                CTX.fillStyle = e.boss ? '#ffd700' : '#00ff66';
                CTX.fillRect(pos.x - ER * 0.5, pos.y - ER * 0.1, 4, 3);
                CTX.fillRect(pos.x + ER * 0.2, pos.y - ER * 0.1, 4, 3);
            }
        }

        if (e.frozen > 0) {
            CTX.globalAlpha = 0.5;
            CTX.fillStyle = '#b3f0ff';
            CTX.fillRect(pos.x - ER, pos.y - ER, ER * 2, ER * 2);
            CTX.globalAlpha = 1.0;
        }
        
        if (e.boss) {
            CTX.fillStyle = '#ffd700';
            CTX.fillRect(pos.x - 9, pos.y - ER - 11, 3, 5);
            CTX.fillRect(pos.x - 3, pos.y - ER - 13, 6, 7);
            CTX.fillRect(pos.x + 6, pos.y - ER - 11, 3, 5);
            CTX.fillRect(pos.x - 9, pos.y - ER - 6, 18, 3);
        }
        CTX.restore();

        CTX.save();
        CTX.font = `bold ${e.boss ? '13px' : '10px'} 'Courier New', monospace`;
        CTX.textAlign = 'center';
        
        const eName = e.n || "Düşman";
        const tw = CTX.measureText(eName).width;
        CTX.fillStyle = 'rgba(10, 10, 10, 0.85)';
        CTX.fillRect(pos.x - tw / 2 - 4, pos.y - ER - 24, tw + 8, 14);
        
        CTX.fillStyle = e.boss ? '#ffd700' : '#ffffff';
        CTX.fillText(eName, pos.x, pos.y - ER - 14);

        const bw = ER * 2;
        CTX.fillStyle = '#140505';
        CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw, 4);
        
        const pct = (typeof e.hp !== 'undefined' && typeof e.max !== 'undefined') ? (e.hp / e.max) : 1.0;
        CTX.fillStyle = e.boss ? '#e60000' : (pct > 0.5 ? '#00e64d' : '#ff5500');
        CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw * pct, 4);
        
        CTX.restore();
    });
}

// Sarımsak Alanı - Gizemli aura rünleri ve dairesel pikselli dalgalar halinde
function drawGarlicZone() {
    if (typeof player === 'undefined' || !player || !player.garlic) return;
    const gr = (100 + player.garlic * 28) * charScale;
    
    CTX.save();
    CTX.strokeStyle = 'rgba(230, 230, 0, 0.35)';
    CTX.lineWidth = 2.5;
    CTX.setLineDash([6, 14]);
    CTX.beginPath();
    CTX.arc(0, 0, gr, 0, Math.PI * 2);
    CTX.stroke();

    const grad = CTX.createRadialGradient(0, 0, gr * 0.4, 0, 0, gr);
    grad.addColorStop(0, 'rgba(255, 255, 0, 0.08)');
    grad.addColorStop(1, 'transparent');
    CTX.fillStyle = grad;
    CTX.beginPath();
    CTX.arc(0, 0, gr, 0, Math.PI * 2);
    CTX.fill();

    CTX.fillStyle = '#ffff66';
    const particlesCount = 4 + player.garlic * 2;
    for (let i = 0; i < particlesCount; i++) {
        const angle = (frame * 0.02 + (i * Math.PI * 2 / particlesCount)) % (Math.PI * 2);
        const px = Math.cos(angle) * gr;
        const py = Math.sin(angle) * gr;
        CTX.fillRect(px - 3, py - 3, 6, 6);
        CTX.fillStyle = '#ffffff';
        CTX.fillRect(px - 1, py - 1, 2, 2);
    }
    CTX.restore();
}

// Kalkan Çemberi - Fütüristik parlayan koruma katmanı
function drawShieldRing() {
    if (typeof player === 'undefined' || !player || !player.shield) return;
    CTX.save();
    
    const PR = player.r * charScale;
    const radius = PR + 10;
    
    CTX.strokeStyle = '#00ffff';
    CTX.lineWidth = 3;
    CTX.setLineDash([8, 8, 2, 8]);
    CTX.beginPath();
    CTX.arc(0, 0, radius, 0, Math.PI * 2);
    CTX.stroke();
    
    CTX.fillStyle = 'rgba(0, 255, 255, 0.08)';
    CTX.beginPath();
    CTX.arc(0, 0, radius, 0, Math.PI * 2);
    CTX.fill();

    CTX.restore();
}

// Orb'lar (Dönen Sihirli Küreler) - RPG Enerji Kristali Şeklinde
function drawOrbs() {
    if (typeof player === 'undefined' || !player || !player.orb) return;
    CTX.save();
    
    for (let i = 0; i < player.orb; i++) {
        const a = orbAng + (Math.PI * 2 / player.orb) * i;
        const ox = Math.cos(a) * player.orbRange;
        const oy = Math.sin(a) * player.orbRange;
        
        CTX.fillStyle = '#b300b3'; 
        CTX.fillRect(ox - 8, oy - 8, 16, 16);
        
        CTX.fillStyle = '#ff66ff'; 
        CTX.fillRect(ox - 5, oy - 5, 10, 10);
        
        CTX.fillStyle = '#ffffff'; 
        CTX.fillRect(ox - 2, oy - 2, 4, 4);
    }
    CTX.restore();
}

// Dash (Hızlı Atılma) Bekleme Süresi Barı
function drawDashBar() {
    if (typeof player === 'undefined' || !player || player.dashCd <= 0) return;
    const PR = player.r * charScale;
    
    CTX.save();
    CTX.fillStyle = '#1c1c1c';
    CTX.fillRect(-22, -PR - 14, 44, 4);
    
    CTX.fillStyle = '#00ffff';
    const pct = 1 - player.dashCd / player.maxDashCd;
    CTX.fillRect(-22, -PR - 14, 44 * pct, 4);
    CTX.restore();
}

// Oyuncu Karakterini detaylı bir kahraman piksel görünümüne dönüştür
function drawPlayer() {
    if (typeof player === 'undefined' || !player) return;
    const PR = player.r * charScale;
    
    CTX.save();
    
    CTX.fillStyle = 'rgba(0,0,0,0.5)';
    CTX.beginPath();
    CTX.ellipse(0, PR * 0.7, PR * 0.8, PR * 0.3, 0, 0, Math.PI * 2);
    CTX.fill();
    
    const shouldDraw = player.invul <= 0 || frame % 8 < 4;
    
    if (shouldDraw) {
        let avatarDrawn = false;
        
        // Avatar tanımlarının güvenli kontrolü
        const hasAvatarCanvas = (typeof avatarCanvas !== 'undefined' && avatarCanvas && avatarCanvas.width > 0);
        const hasImgAvatar = (typeof imgAvatar !== 'undefined' && imgAvatar && imgAvatar.complete && imgAvatar.naturalWidth > 0);
        const avatarSrc = hasAvatarCanvas ? avatarCanvas : (hasImgAvatar ? imgAvatar : null);
        
        if (avatarSrc) {
            try {
                CTX.beginPath();
                CTX.arc(0, 0, PR, 0, Math.PI * 2);
                CTX.clip();
                CTX.drawImage(avatarSrc, -PR, -PR, PR * 2, PR * 2);
                avatarDrawn = true;
            } catch (e) {
                if (hasAvatarCanvas) avatarCanvas.width = 0;
            }
        }
        
        if (!avatarDrawn) {
            CTX.fillStyle = '#008033'; 
            CTX.fillRect(-PR * 0.8, -PR * 0.8, PR * 1.6, PR * 1.6);
            
            CTX.fillStyle = '#a12b2b'; 
            CTX.fillRect(-PR * 0.8, -PR * 0.2, PR * 0.3, PR * 1.0);
            CTX.fillRect(PR * 0.5, -PR * 0.2, PR * 0.3, PR * 1.0);
            
            CTX.fillStyle = '#e0a96d'; 
            CTX.fillRect(-PR * 0.5, -PR * 0.6, PR * 1.0, PR * 0.6);
            
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(-3, -PR * 0.4, 2, 2);
            CTX.fillRect(2, -PR * 0.4, 2, 2);
        }
    }

    CTX.strokeStyle = player.shield > 0 ? '#00e5ff' : '#00ff66';
    CTX.lineWidth = 2.5;
    CTX.beginPath();
    CTX.arc(0, 0, PR, 0, Math.PI * 2);
    CTX.stroke();
    
    CTX.restore();
}

// Oyuncu Mermilerini Parıltılı Pixel Art Büyü Mermilerine Dönüştür
function drawBullets(VW, VH) {
    if (typeof bullets === 'undefined' || !bullets) return;

    const safeVW = Math.min(VW, 3000);
    const safeVH = Math.min(VH, 3000);

    CTX.save();
    bullets.forEach(b => {
        if (!b) return;
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < safeVW && Math.abs(pos.y) < safeVH) {
            
            if (player.explosiveBullets) {
                CTX.fillStyle = '#ff6600';
                CTX.fillRect(pos.x - 7, pos.y - 7, 14, 14);
                CTX.fillStyle = '#ffcc00';
                CTX.fillRect(pos.x - 4, pos.y - 4, 8, 8);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 1, pos.y - 1, 3, 3);
            } else if (player.slowBullets) {
                CTX.fillStyle = '#00ffff';
                CTX.fillRect(pos.x - 5, pos.y - 5, 10, 10);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            } else {
                CTX.fillStyle = '#e6b800';
                CTX.fillRect(pos.x - 5, pos.y - 5, 10, 10);
                CTX.fillStyle = '#ffff66';
                CTX.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            }
        }
    });
    CTX.restore();
}

// Parçacık (Kan, Kıvılcım vb.) efektlerini keskin piksellere dönüştür
function drawParticles() {
    if (typeof parts === 'undefined' || !parts) return;

    parts.forEach(p => {
        if (!p) return;
        const pos = relPos(p.x, p.y);
        CTX.save();
        
        CTX.globalAlpha = Math.max(0, p.l / 30);
        CTX.fillStyle = p.c; 
        
        const sz = p.sz || 4;
        CTX.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
        
        CTX.restore();
        
        p.x = wrap(p.x + p.vx, MAP_W);
        p.y = wrap(p.y + p.vy, MAP_H);
        p.l--;
    });
    parts = parts.filter(p => p && p.l > 0);
}

// Hasar Sayıları ve Uçan Yazılar (Retro Arcade Font Görünümüyle)
function drawFloats() {
    if (typeof floats === 'undefined' || !floats) return;

    CTX.save();
    CTX.font = "bold 15px 'Courier New', monospace"; 
    CTX.textAlign = 'center';
    
    floats.forEach(f => {
        if (!f) return;
        const pos = relPos(f.x, f.y);
        CTX.globalAlpha = Math.max(0, f.l / 50);
        
        CTX.fillStyle = '#000000';
        CTX.fillText(f.t, pos.x + 1.5, pos.y + 1.5);
        
        CTX.fillStyle = f.c;
        CTX.fillText(f.t, pos.x, pos.y);
        
        f.y -= 0.8;
        f.l--;
    });
    CTX.restore();
    floats = floats.filter(f => f && f.l > 0);
}

// Efsanevi Retro Pixel Art Mini Harita
function drawMinimap() {
    if (typeof terrainZones === 'undefined' || typeof player === 'undefined') return;

    const MS = 150, SC = MS / MAP_W, MX = W - MS - 15, MY = 65;
    CTX.save();
    
    CTX.fillStyle = 'rgba(5, 12, 5, 0.9)';
    CTX.fillRect(MX, MY, MS, MS);
    
    CTX.strokeStyle = '#c49a45';
    CTX.lineWidth = 4;
    CTX.strokeRect(MX - 2, MY - 2, MS + 4, MS + 4);
    
    const tc = { 
        water: '#003366', 
        sand: '#806633', 
        ruins: '#3d3d3d', 
        forest: '#004d00', 
        lava: '#661100', 
        snow: '#99b3b3', 
        swamp: '#14240e' 
    };
    
    terrainZones.forEach(z => {
        if (!z) return;
        CTX.fillStyle = tc[z.type] || '#1f331f';
        CTX.beginPath();
        CTX.arc(MX + z.x * SC, MY + z.y * SC, z.r * SC, 0, Math.PI * 2);
        CTX.fill();
    });

    if (typeof items !== 'undefined' && items) {
        CTX.fillStyle = '#00ffff';
        items.forEach(it => {
            if (it) CTX.fillRect(MX + it.x * SC - 1, MY + it.y * SC - 1, 2, 2);
        });
    }

    if (typeof enemies !== 'undefined' && enemies) {
        enemies.forEach(e => {
            if (!e) return;
            CTX.fillStyle = e.boss ? '#ff3300' : '#ff9999';
            const sz = e.boss ? 4 : 2;
            CTX.fillRect(MX + e.x * SC - sz/2, MY + e.y * SC - sz/2, sz, sz);
        });
    }

    const px = MX + player.x * SC, py = MY + player.y * SC;
    
    CTX.fillStyle = '#00ff00';
    CTX.fillRect(px - 3, py, 7, 1);
    CTX.fillRect(px, py - 3, 1, 7);
    CTX.fillStyle = '#ffffff'; 
    CTX.fillRect(px, py, 1, 1);

    CTX.fillStyle = '#111';
    CTX.fillRect(MX - 2, MY + MS + 2, MS + 4, 18);
    CTX.strokeStyle = '#c49a45';
    CTX.strokeRect(MX - 2, MY + MS + 2, MS + 4, 18);
    
    CTX.fillStyle = '#c49a45';
    CTX.font = "bold 9px 'Courier New', monospace";
    CTX.textAlign = 'center';
    CTX.fillText('MİNİ MAP [RADAR]', MX + MS / 2, MY + MS + 14);
    
    CTX.restore();
}
