const audioFiles = {
    shoot:   new Audio('oyuncode/ates.mp3'),
    xp:      new Audio('oyuncode/xp.mp3'),
    levelup: new Audio('oyuncode/seviye_atlama.mp3'),
    kill:    new Audio('oyuncode/canavar_yok_etme.mp3')
};

const Snd = {
    play(type) {
        if (masterVol <= 0) return;

        if (useCustomAudio) {
            const map = { shoot:'shoot', xp:'xp', levelup:'levelup', kill:'kill' };
            if (map[type]) {
                const s = audioFiles[map[type]].cloneNode();
                s.volume = masterVol;
                if (type === 'shoot') s.playbackRate = 2.0;
                s.play().catch(() => {});
                return;
            }
        }

        if (!audioCtx) return;
        try {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            const t = audioCtx.currentTime;

            if (type === 'shoot')  { o.type='square';    o.frequency.setValueAtTime(600,t); o.frequency.exponentialRampToValueAtTime(100,t+0.1);  g.gain.value=0.07*masterVol; o.start(); o.stop(t+0.1);  }
            if (type === 'hit')    { o.type='sawtooth';  o.frequency.value=150;             g.gain.value=0.1*masterVol;  g.gain.exponentialRampToValueAtTime(0.01,t+0.12); o.start(); o.stop(t+0.12); }
            if (type === 'hitPl')  { o.type='sawtooth';  o.frequency.value=100;             g.gain.value=0.2*masterVol;  g.gain.exponentialRampToValueAtTime(0.01,t+0.2);  o.start(); o.stop(t+0.2);  }
            if (type === 'shield') { o.type='sine';      o.frequency.setValueAtTime(220,t); o.frequency.linearRampToValueAtTime(440,t+0.2);        g.gain.value=0.12*masterVol; o.start(); o.stop(t+0.22); }
            if (type === 'xp')     { o.type='sine';      o.frequency.setValueAtTime(800,t); o.frequency.linearRampToValueAtTime(1200,t+0.1);       g.gain.value=0.05*masterVol; o.start(); o.stop(t+0.1);  }
            if (type === 'dash')   { o.type='triangle';  o.frequency.setValueAtTime(200,t); o.frequency.linearRampToValueAtTime(600,t+0.2);        g.gain.value=0.1*masterVol;  o.start(); o.stop(t+0.22); }
            if (type === 'levelup'){ o.type='sine';      o.frequency.setValueAtTime(400,t); o.frequency.linearRampToValueAtTime(900,t+0.5);        g.gain.value=0.18*masterVol; o.start(); o.stop(t+0.5);  }
            if (type === 'kill')   { o.type='square';    o.frequency.setValueAtTime(200,t); o.frequency.linearRampToValueAtTime(50,t+0.2);         g.gain.value=0.1*masterVol;  o.start(); o.stop(t+0.22); }
            if (type === 'wave')   { o.type='sawtooth';  o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(40,t+0.5);    g.gain.value=0.22*masterVol; g.gain.exponentialRampToValueAtTime(0.01,t+0.5); o.start(); o.stop(t+0.5); }
        } catch(e) {}
    }
};
