// Global variables
let currentExperiment = null;
let simulationStarted = false;
let simulationPaused = false;
let simulationTime = 0;
let wavePoints = [];
let previousRuns = []; // Store previous runs for comparison
let runColors = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12"]; // Colors for different runs
let p5Instance = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Experiment selection buttons
  document
    .getElementById("exp1-btn")
    .addEventListener("click", () => selectExperiment(1));
  document
    .getElementById("exp2-btn")
    .addEventListener("click", () => selectExperiment(2));

  // Control buttons
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

  // Slider controls
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

// Update slider value displays
function updateSliderValue(e) {
  document.getElementById(`${e.target.id}-value`).textContent = e.target.value;

  // Only allow parameter changes before simulation starts
  if (p5Instance && !simulationStarted) {
    updateSimulationParameters();
  }
}

// Disable sliders when simulation starts
function toggleControlsInteractivity(disabled) {
  document.getElementById("density-ratio").disabled = disabled;
  document.getElementById("cylinder-length").disabled = disabled;
  document.getElementById("cube-size").disabled = disabled;
}

// Toggle pause/resume function
function togglePause() {
  if (!simulationStarted) return;

  simulationPaused = !simulationPaused;
  const pauseBtn = document.getElementById("pause-btn");

  if (simulationPaused) {
    pauseBtn.textContent = "Resume";
    pauseBtn.style.backgroundColor = "#f39c12";
  } else {
    pauseBtn.textContent = "Pause";
    pauseBtn.style.backgroundColor = "#3498db";
  }
}

// Select experiment and show appropriate UI
function selectExperiment(experimentNumber) {
  currentExperiment = experimentNumber;

  // Hide selection and show experiment container
  document.getElementById("experiment-selection").classList.add("hidden");
  document.getElementById("experiment-container").classList.remove("hidden");

  // Show appropriate controls and guide
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

  // Initialize the simulation canvas (but don't start animation yet)
  initSimulation();
}

// Start the experiment animation
function startExperiment() {
  simulationStarted = true;
  simulationPaused = false;
  simulationTime = 0;
  wavePoints = [];

  // Update button states
  document.getElementById("start-btn").disabled = true;
  document.getElementById("pause-btn").disabled = false;
  document.getElementById("pause-btn").textContent = "Pause";
  document.getElementById("pause-btn").style.backgroundColor = "#3498db";

  // Disable parameter controls once simulation starts
  toggleControlsInteractivity(true);

  // Set a timer to automatically stop after 10 seconds
  setTimeout(() => {
    if (simulationStarted && !simulationPaused) {
      resetExperiment();
    }
  }, 10000); // 10 seconds
}

// Reset the experiment
function resetExperiment() {
  // Store current run data before resetting if we have points
  if (simulationStarted && wavePoints.length > 0) {
    // Get parameters for this run to store with the data
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

    // Store the run with its parameters and ALL points
    previousRuns.push({
      experiment: currentExperiment,
      params: params,
      points: [...wavePoints], // Make a complete copy
      color: runColors[previousRuns.length % runColors.length],
    });

    // Limit stored runs to prevent memory issues (keep more runs)
    if (previousRuns.length > 10) {
      previousRuns.shift();
    }
  }

  simulationStarted = false;
  simulationPaused = false;
  simulationTime = 0;
  wavePoints = [];

  // Re-enable start button and disable pause button
  document.getElementById("start-btn").disabled = false;
  document.getElementById("pause-btn").disabled = true;
  document.getElementById("pause-btn").textContent = "Pause";
  document.getElementById("pause-btn").style.backgroundColor = "#3498db";

  // Re-enable parameter controls
  toggleControlsInteractivity(false);

  // Re-initialize simulation WITHOUT clearing previous run data
  if (p5Instance) {
    p5Instance.remove();
  }
  initSimulation();
}

// Go back to experiment selection
function backToSelection() {
  // Clear previous runs when changing experiments
  previousRuns = [];

  // Clean up current simulation
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }

  simulationStarted = false;
  simulationPaused = false;

  // Show selection screen
  document.getElementById("experiment-selection").classList.remove("hidden");
  document.getElementById("experiment-container").classList.add("hidden");

  // Re-enable parameter controls
  toggleControlsInteractivity(false);
}

// Update simulation parameters based on slider values
function updateSimulationParameters() {
  if (currentExperiment === 1) {
    // Experiment 1 parameters
    p5Instance.densityRatio = parseFloat(
      document.getElementById("density-ratio").value
    );
    p5Instance.cylinderLength = parseFloat(
      document.getElementById("cylinder-length").value
    );

    // Recalculate physics properties when parameters change
    p5Instance.recalculatePhysics();
  } else {
    // Experiment 2 parameters
    p5Instance.cubeSize = parseFloat(
      document.getElementById("cube-size").value
    );

    // Recalculate physics properties when parameters change
    p5Instance.recalculatePhysics();
  }
}

// Initialize the p5.js simulation
function initSimulation() {
  const simulationArea = document.getElementById("simulation-area");
  const waveDisplay = document.getElementById("wave-display");

  // Clear previous instance if exists
  if (p5Instance) {
    p5Instance.remove();
  }

  // Create new p5 instance
  p5Instance = new p5(sketch, simulationArea);

  // Create wave visualization in a separate canvas
  new p5(waveSketch, waveDisplay);
}

// P5.js sketch for the main simulation
const sketch = (p) => {
  // Simulation properties
  let canvasWidth, canvasHeight;
  let equilibriumY;
  let amplitude;
  let period;
  let position;
  let background;
  let staticElements;

  // Experiment 1 specific properties
  p.densityRatio = 0.5; // ρ₁/ρ₂
  p.cylinderLength = 100;

  // Experiment 2 specific properties
  p.cubeSize = 50;

  // Animation speed factor - increase for faster animation
  const SPEED_FACTOR = 5;

  // Function to recalculate physics parameters when inputs change
  p.recalculatePhysics = () => {
    if (currentExperiment === 1) {
      // Cylinder experiment - recalculate period and amplitude
      amplitude = p.cylinderLength * 0.25;
      period =
        2 * p.PI * p.sqrt(p.cylinderLength / (2 * 9.8 * (1 - p.densityRatio)));

      // Update container in the buffer if needed
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
      // Cubic blocks experiment - recalculate period and amplitude
      amplitude = p.cubeSize * 0.25;
      period = 2 * p.PI * p.sqrt(p.cubeSize / 9.8);
    }

    // Display updated information for debugging
    console.log(
      `Parameters updated: densityRatio=${
        p.densityRatio
      }, period=${period.toFixed(2)}s`
    );
  };

  p.setup = () => {
    canvasWidth = document.getElementById("simulation-area").offsetWidth;
    canvasHeight = document.getElementById("simulation-area").offsetHeight;
    p.createCanvas(canvasWidth, canvasHeight);

    // Create a buffer for static elements to improve performance
    background = p.createGraphics(canvasWidth, canvasHeight);
    staticElements = p.createGraphics(canvasWidth, canvasHeight);

    // Initialize position based on experiment
    equilibriumY = canvasHeight * 0.6;

    if (currentExperiment === 1) {
      // Cylinder experiment
      amplitude = p.cylinderLength * 0.25;
      // Note: For a floating cylinder, as density ratio approaches 1,
      // the period increases (slower oscillation)
      period =
        2 * p.PI * p.sqrt(p.cylinderLength / (2 * 9.8 * (1 - p.densityRatio)));

      // Draw container in the buffer (static element)
      background.stroke(100);
      background.strokeWeight(2);
      background.fill(240);
      const containerWidth = 200;
      const containerX = canvasWidth / 2 - containerWidth / 2;
      background.rect(containerX, equilibriumY - 200, containerWidth, 300);
    } else {
      // Cubic blocks experiment
      amplitude = p.cubeSize * 0.25;
      period = 2 * p.PI * p.sqrt(p.cubeSize / 9.8);

      // Pre-render static elements for experiment 2
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

    // Set framerate higher for smoother animation
    p.frameRate(60);
  };

  p.draw = () => {
    p.clear();

    // Draw background buffer (static elements)
    if (currentExperiment === 1) {
      p.image(background, 0, 0);
    } else {
      p.image(staticElements, 0, 0);
    }

    // Water level
    p.fill(135, 206, 235, 180);
    p.rect(0, equilibriumY, canvasWidth, canvasHeight - equilibriumY);

    // Update position if simulation is started and not paused
    if (simulationStarted && !simulationPaused) {
      // Increase time increment for faster animation
      simulationTime += 0.02 * SPEED_FACTOR;
      position =
        equilibriumY - amplitude * p.cos((2 * p.PI * simulationTime) / period);

      // Add point to wave array - store ALL points instead of limiting them
      if (simulationTime % 0.1 < 0.02 * SPEED_FACTOR) {
        wavePoints.push({
          x: simulationTime * 20,
          y: position - equilibriumY,
        });
      }
    }

    // Draw the experiment
    if (currentExperiment === 1) {
      drawCylinderExperiment(position);
    } else {
      drawCubicBlocksExperiment(position);
    }

    // Show performance info and physics parameters
    displayInfo();
  };

  // Performance and physics info display
  function displayInfo() {
    p.fill(0, 100);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.RIGHT);
    p.text(`FPS: ${p.frameRate().toFixed(1)}`, canvasWidth - 10, 15);

    // Add more detailed physics info
    p.textAlign(p.LEFT);
    p.fill(0);
    p.textSize(14);
    p.text(`Amplitude: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Period: ${period.toFixed(2)}s`, 20, 50);

    if (currentExperiment === 1) {
      p.text(`Density Ratio: ${p.densityRatio}`, 20, 70);
    }

    // Show simulation state
    p.textAlign(p.RIGHT);
    if (simulationStarted) {
      p.fill(0, 100);
      p.text(simulationPaused ? "PAUSED" : "RUNNING", canvasWidth - 10, 30);
    }
  }

  // Draw Experiment 1: Cylinder in Liquid
  function drawCylinderExperiment(yPos) {
    // Cylinder
    p.fill(139, 69, 19); // Brown for wood
    p.strokeWeight(1);
    p.stroke(100);
    const containerWidth = 200;
    const cylinderWidth = containerWidth / 3;
    const cylinderHeight = p.cylinderLength;

    // Draw the cylinder with rounded bottom corners
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

    // Add some details to cylinder
    p.stroke(120, 60, 10);
    p.line(
      canvasWidth / 2 - cylinderWidth / 2,
      yPos,
      canvasWidth / 2 + cylinderWidth / 2,
      yPos
    );

    // Equation display
    p.fill(0);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(`Amplitude: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Period: ${period.toFixed(2)}s`, 20, 50);
  }

  // Draw Experiment 2: Cubic Blocks in Water
  function drawCubicBlocksExperiment(yPos) {
    const cubeA = p.cubeSize;
    const cubeB = p.cubeSize * 2;

    // Draw the combined cubes
    p.fill(150, 75, 0); // Darker brown for blocks
    p.stroke(0);

    // Draw the cubes in the correct order - larger cube first (bottom)
    p.rect(canvasWidth / 2 - cubeB / 2, yPos, cubeB, cubeB);

    // Then smaller cube on top
    p.rect(canvasWidth / 2 - cubeA / 2, yPos - cubeA, cubeA, cubeA);

    // Equation display
    p.fill(0);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(`Amplitude: ${amplitude.toFixed(1)}`, 20, 30);
    p.text(`Period: ${period.toFixed(2)}s`, 20, 50);
  }
};

// P5.js sketch for the wave visualization
const waveSketch = (p) => {
  let canvasWidth, canvasHeight;
  let waveGraphics;
  let fullWaveGraphics; // New graphics buffer for full wave history

  p.setup = () => {
    canvasWidth = document.getElementById("wave-display").offsetWidth;

    canvasHeight = document.getElementById("wave-display").offsetHeight;
    p.createCanvas(canvasWidth, canvasHeight);

    // Create persistent graphics buffer for the wave
    waveGraphics = p.createGraphics(canvasWidth, canvasHeight);
    fullWaveGraphics = p.createGraphics(canvasWidth, canvasHeight); // For complete wave history
    waveGraphics.clear();
    fullWaveGraphics.clear();

    // Set higher framerate for smoother animation
    p.frameRate(60);
  };

  p.draw = () => {
    p.background(245);

    // Draw axes on the main canvas
    p.stroke(200);
    p.line(0, canvasHeight / 2, canvasWidth, canvasHeight / 2); // x-axis
    p.line(50, 0, 50, canvasHeight); // y-axis

    // Labels
    p.fill(0);
    p.noStroke();
    p.textSize(10);
    p.text("Time", canvasWidth - 30, canvasHeight / 2 + 15);
    p.push();
    p.translate(30, 50);
    p.rotate(-p.HALF_PI);
    p.text("Position", 0, 0);
    p.pop();

    // Draw previous runs as "ghost" trails with lower opacity
    drawPreviousRuns();

    // Draw current wave without limitations
    if (wavePoints.length > 1 && simulationStarted) {
      // Draw the current full wave with high visibility
      p.stroke(30, 144, 255);
      p.strokeWeight(2.5); // Make current wave slightly thicker
      p.noFill();
      p.beginShape();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = 50 + wavePoints[i].x;
        const y = canvasHeight / 2 - wavePoints[i].y * 0.5;

        // Only draw points that are within the canvas bounds
        if (x >= 50 && x < canvasWidth) {
          p.vertex(x, y);
        }
      }
      p.endShape();
    }

    // Draw the full wave history from buffer
    p.image(fullWaveGraphics, 0, 0);

    // When experiment is reset, clear the full wave graphics
    if (!simulationStarted && simulationTime === 0 && wavePoints.length === 0) {
      fullWaveGraphics.clear();
    }

    // Draw legend for previous runs
    drawRunLegend();
  };

  // Draw previous run trails with legend info
  function drawPreviousRuns() {
    for (let i = 0; i < previousRuns.length; i++) {
      const run = previousRuns[i];

      // Skip if not from current experiment
      if (run.experiment !== currentExperiment) continue;

      // Set color for ghost trails - make them fairly visible but distinguishable from current
      const color = p.color(run.color);
      color.setAlpha(180); // Bright enough to see clearly
      p.stroke(color);
      p.strokeWeight(1.8); // Slightly thicker for better visibility
      p.noFill();

      // Draw the complete wave from start to finish
      p.beginShape();
      for (let j = 0; j < run.points.length; j++) {
        const x = 50 + run.points[j].x;
        const y = canvasHeight / 2 - run.points[j].y * 0.5;

        // Only draw points that are within the canvas
        if (x >= 50 && x < canvasWidth) {
          p.vertex(x, y);
        }
      }
      p.endShape();
    }
  }

  // Draw legend for previous runs
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

      // Skip if not from current experiment
      if (run.experiment !== currentExperiment) continue;

      // Draw colored line sample
      p.stroke(run.color);
      p.strokeWeight(2);
      p.line(
        legendX,
        legendY + i * lineSpacing,
        legendX + lineLength,
        legendY + i * lineSpacing
      );

      // Draw parameter text
      p.noStroke();
      p.fill(0);

      let paramText = "";
      if (run.experiment === 1) {
        paramText = `ρ₁/ρ₂: ${run.params.densityRatio}, L: ${run.params.cylinderLength}`;
      } else {
        paramText = `Cube: ${run.params.cubeSize}`;
      }

      p.text(
        paramText,
        legendX + lineLength + 10,
        legendY + i * lineSpacing + 4
      );
    }
  }
};
