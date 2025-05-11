// Global variables
let currentExperiment = null;
let simulationStarted = false;
let simulationPaused = false;
let simulationTime = 0;
let wavePoints = [];
let previousRuns = [];
let runColors = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12"];
let p5Instance = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("exp1-btn")
    .addEventListener("click", () => selectExperiment(1));
  document
    .getElementById("exp2-btn")
    .addEventListener("click", () => selectExperiment(2));

  document
    .getElementById("start-btn")
    .addEventListener("click", startExperiment);
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document
    .getElementById("reset-btn")
    .addEventListener("click", resetExperiment);
  document
    .getElementById("back-btn")
    .addEventListener("click", backToSelection);

  document
    .getElementById("density-ratio")
    .addEventListener("input", updateSliderValue);
  document
    .getElementById("cylinder-length")
    .addEventListener("input", updateSliderValue);
  document
    .getElementById("cube-size")
    .addEventListener("input", updateSliderValue);
});

// përditëson vlerat e rreshtuesve
function updateSliderValue(e) {
  document.getElementById(`${e.target.id}-value`).textContent = e.target.value;

  if (p5Instance && !simulationStarted) {
    updateSimulationParameters();
  }
}

// çaktivizon kontrollet gjatë eksperimentit
function toggleControlsInteractivity(disabled) {
  document.getElementById("density-ratio").disabled = disabled;
  document.getElementById("cylinder-length").disabled = disabled;
  document.getElementById("cube-size").disabled = disabled;
}

// ndërpret/rifillon simulimin
function togglePause() {
  if (!simulationStarted) return;

  simulationPaused = !simulationPaused;
  const pauseBtn = document.getElementById("pause-btn");

  if (simulationPaused) {
    pauseBtn.textContent = "Vazhdo";
    pauseBtn.style.backgroundColor = "#f39c12";
  } else {
    pauseBtn.textContent = "Ndalo";
    pauseBtn.style.backgroundColor = "#3498db";
  }
}

// zgjedh eksperimentin
function selectExperiment(experimentNumber) {
  currentExperiment = experimentNumber;

  document.getElementById("experiment-selection").classList.add("hidden");
  document.getElementById("experiment-container").classList.remove("hidden");

  if (experimentNumber === 1) {
    document.getElementById("exp1-controls").classList.remove("hidden");
    document.getElementById("exp2-controls").classList.add("hidden");
    document.getElementById("exp1-guide").classList.remove("hidden");
    document.getElementById("exp2-guide").classList.add("hidden");
  } else {
    document.getElementById("exp1-controls").classList.add("hidden");
    document.getElementById("exp2-controls").classList.remove("hidden");
    document.getElementById("exp1-guide").classList.add("hidden");
    document.getElementById("exp2-guide").classList.remove("hidden");
  }

  initSimulation();
}

// fillon eksperimentin
function startExperiment() {
  simulationStarted = true;
  simulationPaused = false;
  simulationTime = 0;
  wavePoints = [];

  document.getElementById("start-btn").disabled = true;
  document.getElementById("pause-btn").disabled = false;
  document.getElementById("pause-btn").textContent = "Ndalo";
  document.getElementById("pause-btn").style.backgroundColor = "#3498db";

  toggleControlsInteractivity(true);
}

// rivendos eksperimentin
function resetExperiment() {
  if (simulationStarted && wavePoints.length > 0) {
    let params = {};
    if (currentExperiment === 1) {
      params = {
        densityRatio: p5Instance.densityRatio,
        cylinderLength: p5Instance.cylinderLength,
      };
    } else {
      params = {
        cubeSize: p5Instance.cubeSize,
      };
    }

    previousRuns.push({
      experiment: currentExperiment,
      params: params,
      points: [...wavePoints],
      color: runColors[previousRuns.length % runColors.length],
    });

    if (previousRuns.length > 10) {
      previousRuns.shift();
    }
  }

  simulationStarted = false;
  simulationPaused = false;
  simulationTime = 0;
  wavePoints = [];

  document.getElementById("start-btn").disabled = false;
  document.getElementById("pause-btn").disabled = true;
  document.getElementById("pause-btn").textContent = "Ndalo";
  document.getElementById("pause-btn").style.backgroundColor = "#3498db";

  toggleControlsInteractivity(false);

  if (p5Instance) {
    p5Instance.remove();
  }
  initSimulation();
}

// kthehet në zgjedhjen e eksperimenteve
function backToSelection() {
  previousRuns = [];

  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }

  simulationStarted = false;
  simulationPaused = false;

  document.getElementById("experiment-selection").classList.remove("hidden");
  document.getElementById("experiment-container").classList.add("hidden");

  toggleControlsInteractivity(false);
}

// përditëson parametrat e simulimit
function updateSimulationParameters() {
  if (currentExperiment === 1) {
    p5Instance.densityRatio = parseFloat(
      document.getElementById("density-ratio").value
    );
    p5Instance.cylinderLength = parseFloat(
      document.getElementById("cylinder-length").value
    );

    p5Instance.recalculatePhysics();
  } else {
    p5Instance.cubeSize = parseFloat(
      document.getElementById("cube-size").value
    );

    p5Instance.recalculatePhysics();
  }
}

// inicializon simulimin
function initSimulation() {
  const simulationArea = document.getElementById("simulation-area");
  const waveDisplay = document.getElementById("wave-display");

  if (p5Instance) {
    p5Instance.remove();
  }

  p5Instance = new p5(sketch, simulationArea);

  new p5(waveSketch, waveDisplay);
}

// skica kryesore për simulimin
const sketch = (p) => {
  let canvasWidth, canvasHeight;
  let equilibriumY;
  let amplitude;
  let period;
  let position;
  let background;
  let staticElements;

  p.densityRatio = 0.5;
  p.cylinderLength = 100;

  p.cubeSize = 50;

  const SPEED_FACTOR = 5;

  // rillogarit parametrat fizik
  p.recalculatePhysics = () => {
    if (currentExperiment === 1) {
      amplitude = p.cylinderLength * 0.25;
      period =
        2 * p.PI * p.sqrt(p.cylinderLength / (2 * 9.8 * (1 - p.densityRatio)));

      if (background) {
        background.clear();
        background.stroke(100);
        background.strokeWeight(2);
        background.fill(240);
        const containerWidth = 200;
        const containerX = canvasWidth / 2 - containerWidth / 2;
        background.rect(containerX, equilibriumY - 200, containerWidth, 300);
      }
    } else {
      amplitude = p.cubeSize * 0.25;
      period = 2 * p.PI * p.sqrt(p.cubeSize / 9.8);
    }

    console.log(
      `Parameters updated: densityRatio=${
        p.densityRatio
      }, period=${period.toFixed(2)}s`
    );
  };

  // konfigurimi fillestar
  p.setup = () => {
    canvasWidth = document.getElementById("simulation-area").offsetWidth;
    canvasHeight = document.getElementById("simulation-area").offsetHeight;
    p.createCanvas(canvasWidth, canvasHeight);

    background = p.createGraphics(canvasWidth, canvasHeight);
    staticElements = p.createGraphics(canvasWidth, canvasHeight);

    equilibriumY = canvasHeight * 0.6;

    if (currentExperiment === 1) {
      amplitude = p.cylinderLength * 0.25;
      period =
        2 * p.PI * p.sqrt(p.cylinderLength / (2 * 9.8 * (1 - p.densityRatio)));

      background.stroke(100);
      background.strokeWeight(2);
      background.fill(240);
      const containerWidth = 200;
      const containerX = canvasWidth / 2 - containerWidth / 2;
      background.rect(containerX, equilibriumY - 200, containerWidth, 300);
    } else {
      amplitude = p.cubeSize * 0.25;
      period = 2 * p.PI * p.sqrt(p.cubeSize / 9.8);

      staticElements.stroke(0, 100, 255, 100);
      staticElements.strokeWeight(2);
      staticElements.line(
        canvasWidth / 2 - 100,
        equilibriumY,
        canvasWidth / 2 + 100,
        equilibriumY
      );
    }

    position = equilibriumY;

    p.frameRate(60);
  };

  // vizatimi i kuadrit
  p.draw = () => {
    p.clear();

    if (currentExperiment === 1) {
      p.image(background, 0, 0);
    } else {
      p.image(staticElements, 0, 0);
    }

    p.fill(135, 206, 235, 180);
    p.rect(0, equilibriumY, canvasWidth, canvasHeight - equilibriumY);

    if (simulationStarted && !simulationPaused) {
      simulationTime += 0.02 * SPEED_FACTOR;
      position =
        equilibriumY - amplitude * p.cos((2 * p.PI * simulationTime) / period);

      if (simulationTime % 0.1 < 0.02 * SPEED_FACTOR) {
        wavePoints.push({
          x: simulationTime * 20,
          y: position - equilibriumY,
        });
      }
    }

    if (currentExperiment === 1) {
      drawCylinderExperiment(position);
    } else {
      drawCubicBlocksExperiment(position);
    }

    displayInfo();
  };

  // shfaq informacionin e performancës
  function displayInfo() {
    p.fill(0, 100);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.RIGHT);
    p.text(`FPS: ${p.frameRate().toFixed(1)}`, canvasWidth - 10, 15);

    p.textAlign(p.LEFT);
    p.fill(0);
    p.textSize(14);
    p.text(`Amplituda: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Perioda: ${period.toFixed(2)}s`, 20, 50);

    if (currentExperiment === 1) {
      p.text(`Raporti i Densitetit: ${p.densityRatio}`, 20, 70);
    }

    p.textAlign(p.RIGHT);
    if (simulationStarted) {
      p.fill(0, 100);
      p.text(simulationPaused ? "NDËRPRERË" : "AKTIV", canvasWidth - 10, 30);
    }
  }

  // vizaton eksperimentin e cilindrit
  function drawCylinderExperiment(yPos) {
    p.fill(139, 69, 19);
    p.strokeWeight(1);
    p.stroke(100);
    const containerWidth = 200;
    const cylinderWidth = containerWidth / 3;
    const cylinderHeight = p.cylinderLength;

    p.rect(
      canvasWidth / 2 - cylinderWidth / 2,
      yPos - cylinderHeight / 2,
      cylinderWidth,
      cylinderHeight,
      0,
      0,
      5,
      5
    );

    p.stroke(120, 60, 10);
    p.line(
      canvasWidth / 2 - cylinderWidth / 2,
      yPos,
      canvasWidth / 2 + cylinderWidth / 2,
      yPos
    );

    p.fill(0);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(`Amplituda: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Perioda: ${period.toFixed(2)}s`, 20, 50);
  }

  // vizaton eksperimentin e kubeve
  function drawCubicBlocksExperiment(yPos) {
    const cubeA = p.cubeSize;
    const cubeB = p.cubeSize * 2;

    p.fill(150, 75, 0);
    p.stroke(0);

    p.rect(canvasWidth / 2 - cubeB / 2, yPos, cubeB, cubeB);

    p.rect(canvasWidth / 2 - cubeA / 2, yPos - cubeA, cubeA, cubeA);

    p.fill(0);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(`Amplituda: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Perioda: ${period.toFixed(2)}s`, 20, 50);
  }
};

// skica për vizualizimin e valës
const waveSketch = (p) => {
  let canvasWidth, canvasHeight;
  let waveGraphics;
  let fullWaveGraphics;

  // konfigurimi fillestar i vizualizimit
  p.setup = () => {
    canvasWidth = document.getElementById("wave-display").offsetWidth;

    canvasHeight = document.getElementById("wave-display").offsetHeight;
    p.createCanvas(canvasWidth, canvasHeight);

    waveGraphics = p.createGraphics(canvasWidth, canvasHeight);
    fullWaveGraphics = p.createGraphics(canvasWidth, canvasHeight);
    waveGraphics.clear();
    fullWaveGraphics.clear();

    p.frameRate(60);
  };

  // vizaton grafikun e valës
  p.draw = () => {
    p.background(245);

    p.stroke(200);
    p.line(0, canvasHeight / 2, canvasWidth, canvasHeight / 2);
    p.line(50, 0, 50, canvasHeight);

    p.fill(0);
    p.noStroke();
    p.textSize(10);
    p.text("Koha", canvasWidth - 30, canvasHeight / 2 + 15);
    p.push();
    p.translate(30, 50);
    p.rotate(-p.HALF_PI);
    p.text("Pozicioni", 0, 0);
    p.pop();

    drawPreviousRuns();

    if (wavePoints.length > 1 && simulationStarted) {
      p.stroke(30, 144, 255);
      p.strokeWeight(2.5);
      p.noFill();
      p.beginShape();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = 50 + wavePoints[i].x;
        const y = canvasHeight / 2 - wavePoints[i].y * 0.5;

        if (x >= 50 && x < canvasWidth) {
          p.vertex(x, y);
        }
      }
      p.endShape();
    }

    p.image(fullWaveGraphics, 0, 0);

    if (!simulationStarted && simulationTime === 0 && wavePoints.length === 0) {
      fullWaveGraphics.clear();
    }

    drawRunLegend();
  };

  // vizaton valet e mëparshme
  function drawPreviousRuns() {
    for (let i = 0; i < previousRuns.length; i++) {
      const run = previousRuns[i];

      if (run.experiment !== currentExperiment) continue;

      const color = p.color(run.color);
      color.setAlpha(180);
      p.stroke(color);
      p.strokeWeight(1.8);
      p.noFill();

      p.beginShape();
      for (let j = 0; j < run.points.length; j++) {
        const x = 50 + run.points[j].x;
        const y = canvasHeight / 2 - run.points[j].y * 0.5;

        if (x >= 50 && x < canvasWidth) {
          p.vertex(x, y);
        }
      }
      p.endShape();
    }
  }

  // vizaton legjendën e valave të mëparshme
  function drawRunLegend() {
    if (previousRuns.length === 0) return;

    const legendX = 60;
    const legendY = 20;
    const lineLength = 30;
    const lineSpacing = 20;

    p.textSize(12);
    p.textAlign(p.LEFT);

    for (let i = 0; i < previousRuns.length; i++) {
      const run = previousRuns[i];

      if (run.experiment !== currentExperiment) continue;

      p.stroke(run.color);
      p.strokeWeight(2);
      p.line(
        legendX,
        legendY + i * lineSpacing,
        legendX + lineLength,
        legendY + i * lineSpacing
      );

      p.noStroke();
      p.fill(0);

      let paramText = "";
      if (run.experiment === 1) {
        paramText = `ρ₁/ρ₂: ${run.params.densityRatio}, L: ${run.params.cylinderLength}`;
      } else {
        paramText = `Kubi: ${run.params.cubeSize}`;
      }

      p.text(
        paramText,
        legendX + lineLength + 10,
        legendY + i * lineSpacing + 4
      );
    }
  }
};
