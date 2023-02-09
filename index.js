function mod(a, b) {
  const div = a / b;
  return (div - Math.floor(div)) * b;
}

let pitch = 0;

/**
 * 
 * @param {string} char 
 */
function getFrequency(char) {
  const value = char.charCodeAt(0);

  const normValue = (mod(value, 255) + 1) / 256;

  return pitch * normValue;
}

/**
 * 
 * @param {number} bpm 
 */
function bpmToMs(bpm) {
  if (typeof bpm !== 'number' || Number.isNaN(bpm)) {
    throw new TypeError('Expected number');
  }

  if (bpm < 1) {
    throw new Error('Expected non-zero positive number');
  }

  return 1 / (bpm / 60000);
}

/**
 * @type {AudioContext}
 */
let ctx;

/**
 * @type {OscillatorNode}
 */
let osc;

/**
 * Represents a state of sound playback.
 * 
 * @type {boolean}
 */
let state = false;

let waveform = "sine";

const button = document.querySelector('button#toggle');
const sequenceInputEl = document.querySelector('input#sequence');
const loopInputEl = document.querySelector('input[type="checkbox"]#loop');
const bpmInputEl = document.querySelector('input[type="number"]#bpm');
const pitchInputEl = document.querySelector('input#pitch');

const waveformButtons = ["sine", "sawtooth", "square", "triangle"].map(wave => {
  return document.querySelector(`.waveform > #${wave}`);
});

waveformButtons.forEach(waveButtonEl => {
  waveButtonEl.addEventListener('click', () => {
    waveformButtons.forEach(btn => { btn.removeAttribute("disabled"); });
    waveform = waveButtonEl.id;

    if (osc) {
      osc.type = waveform;
    }

    waveButtonEl.setAttribute('disabled', '');
  });
});

pitch = pitchInputEl.value;

pitchInputEl.addEventListener("input", e => {
  pitch = e.target.value;
});

bpmInputEl.addEventListener('blur', e => {
  e.target.value = e.target.value.replace(',', '.');

  if (e.target.value.includes('.')) {
    e.target.step = 'any';
  } else {
    e.target.step = '1';
  }

  e.target.value = e.target.value.replace(/[^\d\.]/g, '');
});

/**
 * 
 * @returns {string[]}
 */
const getSequence = () => {
  return sequenceInputEl.value.split("");
};

let interval = null;

const stopPlayback = () => {
  clearInterval(interval);
  osc.stop();
  osc.disconnect();
  ctx.close();

  osc = null;
  ctx = null;
  state = false;

  button.innerHTML = 'Start';
  sequenceInputEl.removeAttribute('readonly');
  sequenceInputEl.blur();
};

const startPlayback = () => {
  const seq = getSequence();

  if (seq.length < 1) {
    return;
  }
  state = true;
  button.innerHTML = 'Stop';
  sequenceInputEl.setAttribute('readonly', '');

  if (!ctx) {
    ctx = new AudioContext();
  }

  if (!osc) {
    osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = 40;
    osc.connect(ctx.destination);
  }

  osc.start(ctx.currentTime);

  let currentId = 0;

  interval = setInterval(() => {
    sequenceInputEl.focus();
    sequenceInputEl.setSelectionRange(currentId, currentId + 1, "forward");
    const ch = seq[currentId];
    osc.frequency.value = getFrequency(ch);

    currentId++;

    if (currentId === seq.length) {
      currentId = 0;

      if (!loopInputEl.checked) {
        stopPlayback();
      }
    }
  }, bpmToMs(parseInt(bpmInputEl.value)));
};

button.addEventListener('click', () => {
  if (!state) {
    startPlayback();
  } else {
    stopPlayback();
  }
});

