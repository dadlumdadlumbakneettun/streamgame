// Pixel Art tarzını desteklemek için Canvas üzerinde keskin piksel render ayarı (Gerektiğinde dışarıda da çağrılabilir)
if (CTX) {
    CTX.imageSmoothingEnabled = false;
    CTX.mozImageSmoothingEnabled = false;
    CTX.webkitImageSmoothingEnabled = false;
    CTX.msImageSmoothingEnabled = false;
}

function draw() {
    // Derin ve piksellenmiş orman tabanı arka plan rengi
    CTX.fillStyle = '#050c05';
    CTX.fillRect(0, 0, W, H);
    
    // Hafif karanlık atmosfer filtresi için orman tabanına büyük piksel dokulu gradyan simülasyonu
    const pixelSize = 4; // Pixel art doku çözünürlüğü
    
    CTX.save();
    try {
        CTX.translate(W / 2, H / 2);
        CTX.scale(zoomLevel, zoomLevel);
        const VW = W / zoomLevel, VH = H / zoomLevel;
        const HVW = VW / 2 + 80, HVH = VH / 2 + 80; // Görüş alanı dışı eleme marjı

        // KATMANLI PİXEL ART ÇİZİM SIRASI
        drawTerrain(VW, VH, HVW, HVH);
        drawGrid(VW, VH); // Piksel zemin dokusu buraya entegre edildi
        drawRoads(VW, VH);
        drawLandmarks(HVW, HVH);
        drawRocks(HVW, HVH);
        drawTrees(HVW, HVH);
        drawCampfires(HVW, HVH);
        drawProps(HVW, HVH);
        drawItems(HVW, HVH);
        drawEnemyBullets(VW, VH);
        drawEnemies(HVW, HVH);
        drawGarlicZone();
        drawShieldRing();
        drawOrbs();
        drawDashBar();
        drawPlayer();
        drawBullets(VW, VH);
        drawParticles();
        drawFloats();
    } finally {
        CTX.restore();
    }
    
    // Pixel art temalı detaylı mini harita
    drawMinimap();
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
    terrainZones.forEach(z => {
        const pos = relPos(z.x, z.y);
        if (Math.abs(pos.x) > HVW + z.r || Math.abs(pos.y) > HVH + z.r) return;

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
        CTX.setLineDash([8, 12, 4, 16]); // Piksellenmiş kenar geçişi
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, z.r - 3, 0, Math.PI * 2);
        CTX.stroke();
        CTX.restore();

        // Bölgeye özel İç Pixel Art Doku Elemanları (Procedural Pixel Details)
        // Kararlı rastgelelik için bölgenin koordinatlarını tohum (seed) olarak kullanalım
        const seed = Math.floor(z.x + z.y);
        const detailCount = 14;
        
        CTX.save();
        for (let i = 0; i < detailCount; i++) {
            // Tohuma bağlı deterministik sahte-rastgele pozisyonlar
            const angle = ((seed * (i + 1) * 123.45) % 360) * Math.PI / 180;
            const dist = ((seed * (i + 5) * 67.89) % (z.r * 0.8));
            const px = pos.x + Math.cos(angle) * dist;
            const py = pos.y + Math.sin(angle) * dist;

            // Küçük piksellenmiş detay blokları çiz
            CTX.fillStyle = (i % 3 === 0) ? colors.light : ((i % 3 === 1) ? colors.accent : colors.dark);
            
            if (z.type === 'water') {
                // Su dalgacıkları (Yatay 3x1 piksel çizgileri)
                CTX.fillRect(px - 6, py, 12, 3);
                CTX.fillRect(px - 2, py - 3, 4, 3);
            } else if (z.type === 'lava') {
                // Lav kabarcıkları ve sıcak pikseller
                CTX.fillRect(px - 3, py - 3, 6, 6);
                CTX.fillStyle = '#fff'; // En sıcak parıltı noktası
                CTX.fillRect(px - 1, py - 1, 2, 2);
            } else if (z.type === 'forest' || z.type === 'swamp') {
                // Küçük ot/yosun pikselleri (V şeklinde ot kümeleri)
                CTX.fillRect(px, py, 3, 9);
                CTX.fillRect(px - 3, py + 3, 3, 6);
                CTX.fillRect(px + 3, py + 3, 3, 6);
            } else if (z.type === 'snow') {
                // Kar kristalleri ve buz pikselleri
                CTX.fillRect(px - 2, py - 2, 5, 5);
                CTX.fillStyle = '#fff';
                CTX.fillRect(px, py - 4, 1, 9);
                CTX.fillRect(px - 4, py, 9, 1);
            } else if (z.type === 'ruins') {
                // Kırık tuğla pikselleri
                CTX.fillRect(px - 5, py - 2, 10, 4);
                CTX.fillStyle = colors.dark;
                CTX.fillRect(px - 5, py + 2, 10, 1);
            } else {
                // Genel zemin pürüzleri
                CTX.fillRect(px - 2, py - 2, 4, 4);
            }
        }
        CTX.restore();
    });
}

// Yolları piksellenmiş parke taşı veya toprak yol görünümüne kavuştur
function drawRoads(VW, VH) {
    roads.forEach(rd => {
        CTX.save(); 
        
        // Yolun ana gövdesi (Koyu toprak/taş rengi)
        CTX.fillStyle = '#1c1712'; 
        
        let dy = rd.pos - player.y;
        if (dy < -MAP_H / 2) dy += MAP_H; else if (dy > MAP_H / 2) dy -= MAP_H;
        let dx = rd.pos - player.x;
        if (dx < -MAP_W / 2) dx += MAP_W; else if (dx > MAP_W / 2) dx -= MAP_W;

        if (rd.type === 'h') {
            CTX.fillRect(-VW, dy - 21, VW * 2, 42);
            
            // Kenar taşları/Sınırlar (Piksel blokları şeklinde)
            CTX.fillStyle = '#2d251e';
            CTX.fillRect(-VW, dy - 24, VW * 2, 3);
            CTX.fillRect(-VW, dy + 21, VW * 2, 3);
            
            // Yolun içindeki piksellenmiş kırıklar ve taş detayları
            CTX.fillStyle = '#120f0c';
            for (let x = -VW; x < VW; x += 40) {
                const shift = Math.abs(Math.sin(x)) * 12;
                CTX.fillRect(x + shift, dy - 10, 8, 4);
                CTX.fillRect(x + shift + 15, dy + 8, 12, 4);
            }
        } else {
            CTX.fillRect(dx - 21, -VH, 42, VH * 2);
            
            // Sınırlar
            CTX.fillStyle = '#2d251e';
            CTX.fillRect(dx - 24, -VH, 3, VH * 2);
            CTX.fillRect(dx + 21, -VH, 3, VH * 2);
            
            // Detaylar
            CTX.fillStyle = '#120f0c';
            for (let y = -VH; y < VH; y += 40) {
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
    CTX.save();
    
    // Mossy dirt - Yosunlu toprak pikselleri simülasyonu
    const gs = 80; // Grid boyutu
    const ox = player.x % gs, oy = player.y % gs;
    
    // Hafif arka plan grid hatları (Yosunlu yeşil tonda pikselli görünüm)
    CTX.strokeStyle = '#10240d'; 
    CTX.lineWidth = 2;
    CTX.setLineDash([4, 12]); // Noktalı/Pikselli grid çizgisi
    
    CTX.beginPath();
    for (let x = -VW / 2 - gs; x < VW / 2 + gs; x += gs) {
        const dx = Math.floor((x - ox) / gs) * gs + (gs - ox);
        CTX.moveTo(dx, -VH / 2); CTX.lineTo(dx, VH / 2);
    }
    for (let y = -VH / 2 - gs; y < VH / 2 + gs; y += gs) {
        const dy = Math.floor((y - oy) / gs) * gs + (gs - oy);
        CTX.moveTo(-VW / 2, dy); CTX.lineTo(VW / 2, dy);
    }
    CTX.stroke();
    
    // Her hücrenin ortasına rastgele küçük pixel art yosun/taş desenleri serpelim
    CTX.fillStyle = '#173614';
    for (let x = -VW / 2 - gs; x < VW / 2 + gs; x += gs) {
        const dx = Math.floor((x - ox) / gs) * gs + (gs - ox);
        for (let y = -VH / 2 - gs; y < VH / 2 + gs; y += gs) {
            const dy = Math.floor((y - oy) / gs) * gs + (gs - oy);
            
            // Sabit ama dinamik desen yerleşimi için koordinat bazlı tohumlama
            const hash = Math.abs(Math.sin(dx * 12.9898 + dy * 78.233)) * 43758.5453;
            if (hash % 10 > 7) {
                // 3x3 piksellik minik yosun öbeği
                CTX.fillRect(dx + (hash % 20) - 10, dy + ((hash >> 2) % 20) - 10, 4, 4);
                CTX.fillRect(dx + (hash % 20) - 6, dy + ((hash >> 2) % 20) - 8, 4, 2);
            }
        }
    }
    
    CTX.restore();
}

// Landmark (İşaret noktaları) - Gizemli pixel rün dairesi şeklinde
function drawLandmarks(HVW, HVH) {
    landmarks.forEach(lm => {
        const pos = relPos(lm.x, lm.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        CTX.save();
        // Dış rün dairesi (Pikselli kesik çizgili)
        CTX.strokeStyle = '#a484ff';
        CTX.lineWidth = 2;
        CTX.setLineDash([6, 10, 2, 8]);
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, lm.r, 0, Math.PI * 2);
        CTX.stroke();

        // Rün dairesinin içi (Yarı saydam mistik rün ışığı)
        CTX.fillStyle = 'rgba(164, 132, 255, 0.05)';
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, lm.r, 0, Math.PI * 2);
        CTX.fill();

        // Rün Merkezindeki Pixel Art Sütun/Anıt Tabanı
        CTX.fillStyle = '#4b3d61';
        CTX.fillRect(pos.x - 12, pos.y - 12, 24, 24);
        CTX.fillStyle = '#7a649e';
        CTX.fillRect(pos.x - 10, pos.y - 10, 20, 6); // Işıklı üst kısım
        CTX.fillStyle = '#2a2238';
        CTX.fillRect(pos.x - 12, pos.y + 8, 24, 4);  // Gölge taban
        
        // Landmark Etiketi (Pixel art retro yazı görünümü)
        CTX.globalAlpha = 0.8;
        CTX.fillStyle = '#ffffff';
        CTX.font = "bold 11px 'Courier New', monospace";
        CTX.textAlign = 'center';
        CTX.fillText(`.: ${lm.name.toUpperCase()} :.`, pos.x, pos.y - lm.r - 10);
        CTX.restore();
    });
}

// Kayaları gölgeli ve köşeli pixel art tarzında çiz
function drawRocks(HVW, HVH) {
    rocks.forEach(r => {
        const pos = relPos(r.x, r.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        CTX.save();
        
        // Piksel Gölgesi
        CTX.fillStyle = 'rgba(0,0,0,0.45)';
        CTX.beginPath();
        CTX.ellipse(pos.x + r.r * 0.15, pos.y + r.r * 0.4, r.r, r.r * 0.45, 0, 0, Math.PI * 2);
        CTX.fill();

        // Ana Kaya Gövdesi (Çokgen kesim, yuvarlak değil)
        CTX.fillStyle = r.c; // Genellikle gri tonları
        CTX.beginPath();
        // Yuvarlak yerine köşeli pixel-art kaya silueti çiziyoruz
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

        // Üst Piksel Aydınlatması (Güneş ışığı vuran kısımlar)
        CTX.fillStyle = '#a0a0a0'; // Açık gri
        CTX.beginPath();
        CTX.moveTo(pos.x - r.r * 0.8, pos.y - r.r * 0.1);
        CTX.lineTo(pos.x - r.r * 0.2, pos.y - r.r * 0.7);
        CTX.lineTo(pos.x + r.r * 0.5, pos.y - r.r * 0.6);
        CTX.lineTo(pos.x + r.r * 0.2, pos.y);
        CTX.closePath();
        CTX.fill();

        // Kaya Çatlakları (Koyu pikselli çizgiler)
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
    trees.forEach(t => {
        const pos = relPos(t.x, t.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        CTX.save();
        
        // 1. Zemin Gölgesi (Büyük piksel şeklinde oval gölge)
        CTX.fillStyle = 'rgba(0, 0, 0, 0.4)';
        CTX.beginPath();
        CTX.ellipse(pos.x + 6, pos.y + t.r * 0.4, t.r * 0.8, t.r * 0.3, 0, 0, Math.PI * 2);
        CTX.fill();

        // 2. Ağaç Gövdesi (Piksel rötüşlü kahverengi odun)
        CTX.fillStyle = '#42240c'; // Koyu kahve
        CTX.fillRect(pos.x - 5, pos.y - t.r * 0.1, 10, t.r * 0.6);
        // Gövde dokusu/gölgesi
        CTX.fillStyle = '#261405';
        CTX.fillRect(pos.x - 5, pos.y - t.r * 0.1, 4, t.r * 0.6);

        // 3. Yaprak Katmanları (Pixel Art Pine/Pinecone Tarzı Katmanlar)
        const leafColor = t.color || '#1e4c1e';
        const shadowLeafColor = '#0f2b0f';
        const lightLeafColor = '#307530';
        
        // Alttan üste doğru 3 adet pikselli yaprak katmanı çiziyoruz
        const layers = [
            { r: t.r * 0.9, yOffset: -t.r * 0.1, h: t.r * 0.65 },
            { r: t.r * 0.75, yOffset: -t.r * 0.5, h: t.r * 0.55 },
            { r: t.r * 0.55, yOffset: -t.r * 0.9, h: t.r * 0.45 }
        ];

        layers.forEach((layer, idx) => {
            const ly = pos.y + layer.yOffset;
            
            // Katman Gölgesi
            CTX.fillStyle = shadowLeafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r, ly + layer.h * 0.5);
            CTX.lineTo(pos.x + layer.r, ly + layer.h * 0.5);
            CTX.lineTo(pos.x, ly - layer.h * 0.5);
            CTX.closePath();
            CTX.fill();

            // Katman Ana Rengi (Piksel kaydırma ile hafif sol)
            CTX.fillStyle = leafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r + 3, ly + layer.h * 0.4);
            CTX.lineTo(pos.x + layer.r - 3, ly + layer.h * 0.4);
            CTX.lineTo(pos.x, ly - layer.h * 0.4);
            CTX.closePath();
            CTX.fill();

            // Katman Işık Vuran Kısmı (Sol üst piksel parlaması)
            CTX.fillStyle = lightLeafColor;
            CTX.beginPath();
            CTX.moveTo(pos.x - layer.r * 0.7, ly + layer.h * 0.1);
            CTX.lineTo(pos.x, ly + layer.h * 0.2);
            CTX.lineTo(pos.x, ly - layer.h * 0.4);
            CTX.closePath();
            CTX.fill();
            
            // Ekstra piksellenmiş katman tırtıkları
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
    campfires.forEach(c => {
        const pos = relPos(c.x, c.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        c.t++;
        const animState = Math.floor(c.t * 0.15) % 4; // 4 kare pixel art alev animasyonu
        
        CTX.save();
        
        // Kamp ateşi etrafı zemin karartısı
        CTX.fillStyle = 'rgba(0,0,0,0.5)';
        CTX.beginPath();
        CTX.arc(pos.x, pos.y + 4, 18, 0, Math.PI * 2);
        CTX.fill();

        // 1. Etraftaki Küçük Taşlar (Pixel Art Çemberi)
        CTX.fillStyle = '#595959';
        const stoneAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        stoneAngles.forEach(ang => {
            const rad = ang * Math.PI / 180;
            const sx = pos.x + Math.cos(rad) * 14;
            const sy = pos.y + Math.sin(rad) * 11;
            CTX.fillRect(sx - 3, sy - 3, 6, 5);
            CTX.fillStyle = '#3a3a3a';
            CTX.fillRect(sx - 1, sy - 1, 2, 2); // Taş gölgesi
        });

        // 2. Çapraz Yanan Odunlar (Kahverengi küçük piksel çubuklar)
        CTX.fillStyle = '#4d2600';
        CTX.fillRect(pos.x - 10, pos.y - 3, 20, 4);
        CTX.fillRect(pos.x - 3, pos.y - 10, 4, 20);

        // 3. Katmanlı Pixel Art Alevleri (Her karede değişen pikseller)
        const flicker = Math.sin(c.t * 0.3) * 2;
        
        // Büyük Turuncu Dış Alev
        CTX.fillStyle = '#e65c00';
        CTX.beginPath();
        CTX.moveTo(pos.x - 8 - flicker, pos.y + 2);
        CTX.lineTo(pos.x + 8 + flicker, pos.y + 2);
        CTX.lineTo(pos.x + flicker * 0.5, pos.y - 14 - animState * 2);
        CTX.closePath();
        CTX.fill();

        // Orta Sarı Alev
        CTX.fillStyle = '#ffcc00';
        CTX.beginPath();
        CTX.moveTo(pos.x - 5, pos.y + 1);
        CTX.lineTo(pos.x + 5, pos.y + 1);
        CTX.lineTo(pos.x, pos.y - 8 - animState);
        CTX.closePath();
        CTX.fill();

        // İç Beyaz Çekirdek (Çok sıcak nokta)
        CTX.fillStyle = '#ffffff';
        CTX.fillRect(pos.x - 2, pos.y - 2, 4, 5);
        
        // Havaya yükselen piksel kıvılcımları
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
    props.forEach(p => {
        const pos = relPos(p.x, p.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        CTX.save();
        
        if (p.type === 'barrel') {
            // Varil Gölgesi
            CTX.fillStyle = 'rgba(0,0,0,0.35)';
            CTX.fillRect(pos.x - 13, pos.y + 11, 26, 6);

            // Ahşap Varil Gövdesi
            CTX.fillStyle = '#5c2d00'; // Koyu odun
            CTX.fillRect(pos.x - 12, pos.y - 15, 24, 30);
            
            // Varil bombesi efekti (Kenarları biraz daha koyu)
            CTX.fillStyle = '#3d1e00';
            CTX.fillRect(pos.x - 12, pos.y - 15, 3, 30);
            CTX.fillRect(pos.x + 9, pos.y - 15, 3, 30);

            // Metal Çemberler (Gümüş demir şeritler)
            CTX.fillStyle = '#7a8a99';
            CTX.fillRect(pos.x - 12, pos.y - 8, 24, 3);
            CTX.fillRect(pos.x - 12, pos.y + 5, 24, 3);
            CTX.fillStyle = '#cbd4db'; // Demir parlaması
            CTX.fillRect(pos.x - 6, pos.y - 8, 3, 3);
            CTX.fillRect(pos.x - 6, pos.y + 5, 3, 3);

            // Dikey ahşap çizgileri
            CTX.fillStyle = '#291400';
            CTX.fillRect(pos.x - 4, pos.y - 15, 2, 30);
            CTX.fillRect(pos.x + 3, pos.y - 15, 2, 30);
        } else {
            // Kutu (Crate) - Çapraz destekli ahşap kutu
            // Kutu Gölgesi
            CTX.fillStyle = 'rgba(0,0,0,0.35)';
            CTX.fillRect(pos.x - 15, pos.y + 11, 30, 6);

            // Ana Ahşap Alan
            CTX.fillStyle = '#8f612d'; 
            CTX.fillRect(pos.x - 14, pos.y - 14, 28, 28);

            // Dış Çerçeve ve Gölgeler
            CTX.fillStyle = '#4f3311'; // Koyu Ahşap Sınır
            CTX.strokeRect(pos.x - 14, pos.y - 14, 28, 28);
            CTX.fillRect(pos.x - 14, pos.y - 14, 28, 3); // Üst kenar gölgesi
            CTX.fillRect(pos.x - 14, pos.y + 11, 28, 3); // Alt kenar gölgesi

            // Kutu Çapraz Tahtası (X işareti)
            CTX.strokeStyle = '#4f3311';
            CTX.lineWidth = 3.5;
            CTX.beginPath();
            CTX.moveTo(pos.x - 11, pos.y - 11);
            CTX.lineTo(pos.x + 11, pos.y + 11);
            CTX.moveTo(pos.x + 11, pos.y - 11);
            CTX.lineTo(pos.x - 11, pos.y + 11);
            CTX.stroke();

            // Köşe Vidaları (Çiviler)
            CTX.fillStyle = '#b8c4c7';
            CTX.fillRect(pos.x - 12, pos.y - 12, 2, 2);
            CTX.fillRect(pos.x + 10, pos.y - 12, 2, 2);
            CTX.fillRect(pos.x - 12, pos.y + 10, 2, 2);
            CTX.fillRect(pos.x + 10, pos.y + 10, 2, 2);

            // Can Barı (Kırık kutuları gösteren retro kırmızı can barı)
            if (p.hp < 3) {
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
    items.forEach(it => {
        const pos = relPos(it.x, it.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        CTX.save();
        
        // Eşya altındaki hafif zemin parıltısı
        const col = ITEM_CMAP[it.t] || '#fff';
        CTX.fillStyle = col;
        CTX.globalAlpha = 0.22;
        CTX.beginPath();
        CTX.arc(pos.x, pos.y + 2, 11, 0, Math.PI * 2);
        CTX.fill();
        CTX.globalAlpha = 1.0;

        // Eşya Türüne Göre Çizim
        if (it.t.includes('xp')) {
            // XP Kristali (Mavi parlayan RPG kristali)
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
            
            // Parlayan merkez beyaz pikseli
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        } else if (it.t === 'hp') {
            // İksir Şişesi / Kalp (Kırmızı retro kalp veya can iksiri)
            CTX.fillStyle = '#ff3333';
            // Piksel kalp tasarımı
            CTX.fillRect(pos.x - 5, pos.y - 4, 4, 3);
            CTX.fillRect(pos.x + 1, pos.y - 4, 4, 3);
            CTX.fillRect(pos.x - 6, pos.y - 1, 12, 3);
            CTX.fillRect(pos.x - 4, pos.y + 2, 8, 3);
            CTX.fillRect(pos.x - 2, pos.y + 5, 4, 2);
            // Beyaz parıltı pikseli
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 3, pos.y - 3, 2, 2);
        } else if (it.t === 'mag') {
            // Mıknatıs (Magnet - Sarı/Mavi U şeklinde mıknatıs)
            CTX.fillStyle = '#ffcc00';
            CTX.fillRect(pos.x - 5, pos.y - 5, 10, 3);
            CTX.fillStyle = '#3399ff';
            CTX.fillRect(pos.x - 5, pos.y - 2, 3, 7);
            CTX.fillRect(pos.x + 2, pos.y - 2, 3, 7);
        } else if (it.t === 'shield') {
            // Kalkan Orb'u (Mavi küre veya kalkan amblemi)
            CTX.fillStyle = '#00e5ff';
            // Elmas biçimli kalkan arması
            CTX.beginPath();
            CTX.moveTo(pos.x, pos.y - 7);
            CTX.lineTo(pos.x + 6, pos.y - 3);
            CTX.lineTo(pos.x + 5, pos.y + 3);
            CTX.lineTo(pos.x, pos.y + 8);
            CTX.lineTo(pos.x - 5, pos.y + 3);
            CTX.lineTo(pos.x - 6, pos.y - 3);
            CTX.closePath();
            CTX.fill();
            // İç gümüş parıltısı
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 2, pos.y - 3, 4, 5);
        } else {
            // Diğer standart eşyalar için piksellenmiş kare sandık simgesi
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
    CTX.save();
    eBullets.forEach(b => {
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < VW && Math.abs(pos.y) < VH) {
            // Mermi Dış Parıltısı (Hafif piksel gölgesi şeklinde)
            CTX.fillStyle = 'rgba(255,85,85,0.4)';
            CTX.fillRect(pos.x - 6, pos.y - 6, 12, 12);
            
            // Çekirdek Kırmızı Mermi
            CTX.fillStyle = '#ff2222';
            CTX.fillRect(pos.x - 4, pos.y - 4, 8, 8);
            
            // Parlayan İç Beyaz Piksel
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        }
    });
    CTX.restore();
}

// Düşmanları çok daha şık, detaylı, karanlık fantezi canavarı piksellerine dönüştür
function drawEnemies(HVW, HVH) {
    enemies.forEach(e => {
        const pos = relPos(e.x, e.y);
        if (Math.abs(pos.x) > HVW || Math.abs(pos.y) > HVH) return;
        
        const ER = e.r * charScale;
        CTX.save();

        // 1. Düşman Zemin Gölgesi (Pikselli koyuluk)
        CTX.fillStyle = 'rgba(0, 0, 0, 0.45)';
        CTX.beginPath();
        CTX.ellipse(pos.x, pos.y + ER * 0.8, ER * 0.8, ER * 0.3, 0, 0, Math.PI * 2);
        CTX.fill();

        // Donma veya Yavaşlatma Durumu Efektleri (Pikselli kaplamalar)
        if (e.frozen > 0) {
            CTX.fillStyle = '#00ffff';
            CTX.shadowBlur = 10;
            CTX.shadowColor = '#00ffff';
        } else if (e.boss) {
            // Boss Etrafı Kırmızı Şeytani Kıvılcımlar
            CTX.strokeStyle = '#ff0055';
            CTX.lineWidth = 2;
            CTX.setLineDash([4, 6]);
            CTX.beginPath();
            CTX.arc(pos.x, pos.y, ER + 5, 0, Math.PI * 2);
            CTX.stroke();
        }

        // 2. Canavar Çizimi (Görsel yüklenmediyse, el yapımı piksel canavar çizeceğiz!)
        const img = e.range ? imgRanged : imgMelee;
        let drawnCustom = false;
        
        try {
            if (img.complete && img.naturalWidth > 0) {
                CTX.drawImage(img, pos.x - ER, pos.y - ER, ER * 2, ER * 2);
            } else {
                drawnCustom = true;
            }
        } catch (err) {
            drawnCustom = true;
        }

        if (drawnCustom) {
            // Özel El Yapımı Pixel Art Canavar Görseli (Eğer resim yüklenemezse)
            CTX.fillStyle = e.c || '#801a1a';
            
            if (e.range) {
                // Uzakçı Canavar (Kanatlı/Boynuzlu Gözcü İblis)
                // Kafa
                CTX.fillRect(pos.x - ER * 0.8, pos.y - ER * 0.8, ER * 1.6, ER * 1.6);
                // Kanatlar
                CTX.fillStyle = '#4a0d0d';
                CTX.fillRect(pos.x - ER * 1.4, pos.y - ER * 0.4, ER * 0.6, ER * 0.8);
                CTX.fillRect(pos.x + ER * 0.8, pos.y - ER * 0.4, ER * 0.6, ER * 0.8);
                // Parlayan Kırmızı Tek Göz
                CTX.fillStyle = '#ff0033';
                CTX.fillRect(pos.x - 3, pos.y - 3, 6, 6);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            } else {
                // Yakın Dövüşçü (Zombi / Slime / Ork Savaşçı)
                // Kask/Kafalık
                CTX.fillRect(pos.x - ER, pos.y - ER * 0.6, ER * 2, ER * 1.4);
                // Alt Gövde / Pelerin
                CTX.fillStyle = '#2b1a4a';
                CTX.fillRect(pos.x - ER * 0.8, pos.y + ER * 0.5, ER * 1.6, ER * 0.5);
                // Parlayan Gözler
                CTX.fillStyle = e.boss ? '#ffff00' : '#00ff66';
                CTX.fillRect(pos.x - ER * 0.5, pos.y - ER * 0.1, 4, 3);
                CTX.fillRect(pos.x + ER * 0.2, pos.y - ER * 0.1, 4, 3);
            }
        }

        // Frozen (Donmuş) Katmanı
        if (e.frozen > 0) {
            CTX.globalAlpha = 0.5;
            CTX.fillStyle = '#b3f0ff';
            CTX.fillRect(pos.x - ER, pos.y - ER, ER * 2, ER * 2);
            CTX.globalAlpha = 1.0;
        }
        
        // Boss Tacı (Sarı pikselli rütbe simgesi)
        if (e.boss) {
            CTX.fillStyle = '#ffd700';
            // Piksel taç tasarımı
            CTX.fillRect(pos.x - 9, pos.y - ER - 11, 3, 5);
            CTX.fillRect(pos.x - 3, pos.y - ER - 13, 6, 7);
            CTX.fillRect(pos.x + 6, pos.y - ER - 11, 3, 5);
            CTX.fillRect(pos.x - 9, pos.y - ER - 6, 18, 3);
        }
        CTX.restore();

        // 3. İsim ve Sağlık Barı (Daha derli toplu ve okunaklı retro RPG tasarımı)
        CTX.save();
        CTX.font = `bold ${e.boss ? '13px' : '10px'} 'Courier New', monospace`;
        CTX.textAlign = 'center';
        
        // İsim Plakası Arka Planı
        const tw = CTX.measureText(e.n).width;
        CTX.fillStyle = 'rgba(10, 10, 10, 0.85)';
        CTX.fillRect(pos.x - tw / 2 - 4, pos.y - ER - 24, tw + 8, 14);
        
        // İsim Metni
        CTX.fillStyle = e.boss ? '#ffd700' : '#ffffff';
        CTX.fillText(e.n, pos.x, pos.y - ER - 14);

        // Can Barı Sınır Çerçevesi
        const bw = ER * 2;
        CTX.fillStyle = '#140505';
        CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw, 4);
        
        // Dolu Can Miktarı (Pixel bölmeli görünüm)
        const pct = e.hp / e.max;
        CTX.fillStyle = e.boss ? '#e60000' : (pct > 0.5 ? '#00e64d' : '#ff5500');
        CTX.fillRect(pos.x - ER, pos.y - ER - 8, bw * pct, 4);
        
        CTX.restore();
    });
}

// Sarımsak Alanı - Gizemli aura rünleri ve dairesel pikselli dalgalar halinde
function drawGarlicZone() {
    if (!player.garlic) return;
    const gr = (100 + player.garlic * 28) * charScale;
    
    CTX.save();
    // Sarımsak halkasının dış dairesi (Pikselli kesikli çizgi)
    CTX.strokeStyle = 'rgba(230, 230, 0, 0.35)';
    CTX.lineWidth = 2.5;
    CTX.setLineDash([6, 14]);
    CTX.beginPath();
    CTX.arc(0, 0, gr, 0, Math.PI * 2);
    CTX.stroke();

    // Sarımsak aurası iç dolgusu
    const grad = CTX.createRadialGradient(0, 0, gr * 0.4, 0, 0, gr);
    grad.addColorStop(0, 'rgba(255, 255, 0, 0.08)');
    grad.addColorStop(1, 'transparent');
    CTX.fillStyle = grad;
    CTX.beginPath();
    CTX.arc(0, 0, gr, 0, Math.PI * 2);
    CTX.fill();

    // Halka etrafında dönen sihirli minik sarı pikseller
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
    if (!player.shield) return;
    CTX.save();
    
    const PR = player.r * charScale;
    const radius = PR + 10;
    
    // Kalkan çeperi (Altıgen/kesikli parıltı)
    CTX.strokeStyle = '#00ffff';
    CTX.lineWidth = 3;
    CTX.setLineDash([8, 8, 2, 8]);
    CTX.beginPath();
    CTX.arc(0, 0, radius, 0, Math.PI * 2);
    CTX.stroke();
    
    // Kalkan parlaması (Retro dairesel dalga)
    CTX.fillStyle = 'rgba(0, 255, 255, 0.08)';
    CTX.beginPath();
    CTX.arc(0, 0, radius, 0, Math.PI * 2);
    CTX.fill();

    CTX.restore();
}

// Orb'lar (Dönen Sihirli Küreler) - RPG Enerji Kristali Şeklinde
function drawOrbs() {
    if (!player.orb) return;
    CTX.save();
    
    for (let i = 0; i < player.orb; i++) {
        const a = orbAng + (Math.PI * 2 / player.orb) * i;
        const ox = Math.cos(a) * player.orbRange;
        const oy = Math.sin(a) * player.orbRange;
        
        // Mistik Mor Küre / Kristal
        CTX.fillStyle = '#b300b3'; // Koyu Mor
        CTX.fillRect(ox - 8, oy - 8, 16, 16);
        
        // İç Parlama
        CTX.fillStyle = '#ff66ff'; // Açık Pembe
        CTX.fillRect(ox - 5, oy - 5, 10, 10);
        
        // Çekirdek Parlaması
        CTX.fillStyle = '#ffffff'; // Beyaz merkez
        CTX.fillRect(ox - 2, oy - 2, 4, 4);
    }
    CTX.restore();
}

// Dash (Hızlı Atılma) Bekleme Süresi Barı
function drawDashBar() {
    if (player.dashCd <= 0) return;
    const PR = player.r * charScale;
    
    CTX.save();
    // Arka Plan
    CTX.fillStyle = '#1c1c1c';
    CTX.fillRect(-22, -PR - 14, 44, 4);
    
    // Dash Doluluk (Cyan renkli piksel bar)
    CTX.fillStyle = '#00ffff';
    const pct = 1 - player.dashCd / player.maxDashCd;
    CTX.fillRect(-22, -PR - 14, 44 * pct, 4);
    CTX.restore();
}

// Oyuncu Karakterini detaylı bir kahraman piksel görünümüne dönüştür
function drawPlayer() {
    const PR = player.r * charScale;
    
    CTX.save();
    
    // Karakter gölgesi
    CTX.fillStyle = 'rgba(0,0,0,0.5)';
    CTX.beginPath();
    CTX.ellipse(0, PR * 0.7, PR * 0.8, PR * 0.3, 0, 0, Math.PI * 2);
    CTX.fill();
    
    // Hasar alma anında yanıp sönme (Invulnerability)
    const shouldDraw = player.invul <= 0 || frame % 8 < 4;
    
    if (shouldDraw) {
        let avatarDrawn = false;
        const avatarSrc = avatarCanvas.width > 0 ? avatarCanvas : (imgAvatar.complete && imgAvatar.naturalWidth > 0 ? imgAvatar : null);
        
        if (avatarSrc) {
            try {
                // Oyuncu avatarını piksellenmiş yuvarlak portre çerçevesinde çiz
                CTX.beginPath();
                CTX.arc(0, 0, PR, 0, Math.PI * 2);
                CTX.clip();
                CTX.drawImage(avatarSrc, -PR, -PR, PR * 2, PR * 2);
                avatarDrawn = true;
            } catch (e) {
                avatarCanvas.width = 0;
            }
        }
        
        if (!avatarDrawn) {
            // El yapımı detaylı pixel art kahraman çizimi (Yüklenememe durumunda)
            CTX.fillStyle = '#008033'; // Yeşil cüppe
            CTX.fillRect(-PR * 0.8, -PR * 0.8, PR * 1.6, PR * 1.6);
            
            // Pelerin/Zırh Detayı
            CTX.fillStyle = '#a12b2b'; // Kırmızı pelerin
            CTX.fillRect(-PR * 0.8, -PR * 0.2, PR * 0.3, PR * 1.0);
            CTX.fillRect(PR * 0.5, -PR * 0.2, PR * 0.3, PR * 1.0);
            
            // Miğfer/Yüz
            CTX.fillStyle = '#e0a96d'; // Ten rengi
            CTX.fillRect(-PR * 0.5, -PR * 0.6, PR * 1.0, PR * 0.6);
            
            // Parlayan Gözler
            CTX.fillStyle = '#ffffff';
            CTX.fillRect(-3, -PR * 0.4, 2, 2);
            CTX.fillRect(2, -PR * 0.4, 2, 2);
        }
    }

    // Karakter Etrafı Neon Işıklı/Pikselli Çerçeve Halkası
    CTX.strokeStyle = player.shield > 0 ? '#00e5ff' : '#00ff66';
    CTX.lineWidth = 2.5;
    CTX.beginPath();
    CTX.arc(0, 0, PR, 0, Math.PI * 2);
    CTX.stroke();
    
    CTX.restore();
}

// Oyuncu Mermilerini Parıltılı Pixel Art Büyü Mermilerine Dönüştür
function drawBullets(VW, VH) {
    CTX.save();
    
    bullets.forEach(b => {
        const pos = relPos(b.x, b.y);
        if (Math.abs(pos.x) < VW && Math.abs(pos.y) < VH) {
            
            if (player.explosiveBullets) {
                // Patlayıcı mermi: Turuncu-Sarı alev topu pikselleri
                CTX.fillStyle = '#ff6600';
                CTX.fillRect(pos.x - 7, pos.y - 7, 14, 14);
                CTX.fillStyle = '#ffcc00';
                CTX.fillRect(pos.x - 4, pos.y - 4, 8, 8);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 1, pos.y - 1, 3, 3);
            } else if (player.slowBullets) {
                // Yavaşlatıcı mermi: Buz mavisi kristalleri
                CTX.fillStyle = '#00ffff';
                CTX.fillRect(pos.x - 5, pos.y - 5, 10, 10);
                CTX.fillStyle = '#ffffff';
                CTX.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            } else {
                // Klasik büyü mermisi: Parlayan sarı plazma
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
    parts.forEach(p => {
        const pos = relPos(p.x, p.y);
        CTX.save();
        
        CTX.globalAlpha = Math.max(0, p.l / 30);
        CTX.fillStyle = p.c; // Kan için kırmızı, kıvılcım için turuncu/sarı
        
        // Keskin pixel karesi şeklinde parçacık
        const sz = p.sz || 4;
        CTX.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
        
        CTX.restore();
        
        // Parçacık simülasyon fizikleri
        p.x = wrap(p.x + p.vx, MAP_W);
        p.y = wrap(p.y + p.vy, MAP_H);
        p.l--;
    });
    parts = parts.filter(p => p.l > 0);
}

// Hasar Sayıları ve Uçan Yazılar (Retro Arcade Font Görünümüyle)
function drawFloats() {
    CTX.save();
    CTX.font = "bold 15px 'Courier New', monospace"; // Pikselli görünüm için monospace yazı tipi
    CTX.textAlign = 'center';
    
    floats.forEach(f => {
        const pos = relPos(f.x, f.y);
        CTX.globalAlpha = Math.max(0, f.l / 50);
        
        // Arkasına siyah gölge (Metnin okunabilirliğini artırmak ve retro hissi katmak için)
        CTX.fillStyle = '#000000';
        CTX.fillText(f.t, pos.x + 1.5, pos.y + 1.5);
        
        // Ön metin rengi
        CTX.fillStyle = f.c;
        CTX.fillText(f.t, pos.x, pos.y);
        
        // Yukarı uçuş simülasyonu
        f.y -= 0.8;
        f.l--;
    });
    CTX.restore();
    floats = floats.filter(f => f.l > 0);
}

// Efsanevi Retro Pixel Art Mini Harita
function drawMinimap() {
    const MS = 150, SC = MS / MAP_W, MX = W - MS - 15, MY = 65;
    CTX.save();
    
    // 1. Mini Harita Arka Planı ve Köşeli Pixel Art Çerçevesi
    CTX.fillStyle = 'rgba(5, 12, 5, 0.9)';
    CTX.fillRect(MX, MY, MS, MS);
    
    // Retro Sarı/Altın Pixel Art Sınır Çizgisi
    CTX.strokeStyle = '#c49a45';
    CTX.lineWidth = 4;
    CTX.strokeRect(MX - 2, MY - 2, MS + 4, MS + 4);
    
    // 2. Arazileri Çiz (Piksellenmiş minik renk kutuları şeklinde)
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
        CTX.fillStyle = tc[z.type] || '#1f331f';
        CTX.beginPath();
        // Haritada pikselli dairesel bölgeler halinde çiz
        CTX.arc(MX + z.x * SC, MY + z.y * SC, z.r * SC, 0, Math.PI * 2);
        CTX.fill();
    });

    // 3. Eşyaları Mini Haritada Göster (Minik Mavi Noktalar)
    CTX.fillStyle = '#00ffff';
    items.forEach(it => {
        CTX.fillRect(MX + it.x * SC - 1, MY + it.y * SC - 1, 2, 2);
    });

    // 4. Canavarları Mini Haritada Göster (Kırmızı/Turuncu Pikseller)
    enemies.forEach(e => {
        CTX.fillStyle = e.boss ? '#ff3300' : '#ff9999';
        const sz = e.boss ? 4 : 2;
        CTX.fillRect(MX + e.x * SC - sz/2, MY + e.y * SC - sz/2, sz, sz);
    });

    // 5. Oyuncu Pozisyonu (Yeşil ve Parlayan Çapraz İşareti)
    const px = MX + player.x * SC, py = MY + player.y * SC;
    
    CTX.fillStyle = '#00ff00';
    // Artı işareti şeklinde pikselli radar imleci
    CTX.fillRect(px - 3, py, 7, 1);
    CTX.fillRect(px, py - 3, 1, 7);
    CTX.fillStyle = '#ffffff'; // Tam merkez
    CTX.fillRect(px, py, 1, 1);

    // 6. Mini Harita Etiketi ve Alt Bilgi Paneli
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
