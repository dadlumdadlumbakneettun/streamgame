function resetWorld() {
    enemies = []; bullets = []; eBullets = []; props = [];
    trees = []; rocks = []; items = []; floats = []; parts = [];
    timeSec = 0; frame = 0; orbAng = 0; qWaveCd = 0;
    player = Object.assign({}, PLAYER_DEFAULT, { x: MAP_W / 2, y: MAP_H / 2 });

    document.getElementById('bar-xp').classList.remove('rainbow-active');
    document.getElementById('revive-row').style.display = 'none';
    document.getElementById('regen-row').style.display  = 'none';

    terrainZones = [];
    const ztypes = ['water','sand','ruins','forest','lava','snow','swamp'];
    for (let i = 0; i < 30; i++) {
        terrainZones.push({
            x: Math.random() * MAP_W,
            y: Math.random() * MAP_H,
            r: 200 + Math.random() * 500,
            type: ztypes[Math.floor(Math.random() * ztypes.length)]
        });
    }

    roads = [];
    for (let i = 0; i < 5; i++) {
        roads.push({
            type: Math.random() < 0.5 ? 'h' : 'v',
            pos:  Math.random() * (Math.random() < 0.5 ? MAP_W : MAP_H)
        });
    }

    campfires = [];
    for (let i = 0; i < 20; i++) {
        campfires.push({ x: Math.random() * MAP_W, y: Math.random() * MAP_H, t: Math.random() * 100 });
    }

    landmarks = [];
    const lnames = ['KALE','MAĞARA','KÖPRÜ','TAPINAK','KÜMBET','GÖLET','ÇARŞI'];
    for (let i = 0; i < 8; i++) {
        landmarks.push({
            x: Math.random() * MAP_W,
            y: Math.random() * MAP_H,
            name: lnames[Math.floor(Math.random() * lnames.length)],
            r: 80 + Math.random() * 60
        });
    }

    for (let i = 0; i < 100; i++) {
        props.push({
            x: Math.random() * MAP_W,
            y: Math.random() * MAP_H,
            hp: 3,
            type: Math.random() < 0.6 ? 'barrel' : 'crate'
        });
    }

    for (let i = 0; i < 500; i++) {
        const h = Math.floor(Math.random() * 3 + 1);
        trees.push({
            x: Math.random() * MAP_W,
            y: Math.random() * MAP_H,
            r: 30 + Math.random() * 55,
            color: `rgb(${10 + h * 8},${55 + Math.random() * 30},${10 + h * 5})`
        });
    }

    for (let i = 0; i < 200; i++) {
        rocks.push({
            x: Math.random() * MAP_W,
            y: Math.random() * MAP_H,
            r: 10 + Math.random() * 28,
            c: `hsl(${Math.random() * 30},12%,${20 + Math.random() * 25}%)`
        });
    }
}
