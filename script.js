class RuleGridApp {
  constructor(rows = 7, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.isRunning = false;
    this.highlightedCell = null;
    this.pendingTimeout = null;

    this.rulesets = {
      "1": [
        ["LR-TB", "exactly_2_neighbors", "toggle"],
        ["TB-LR", "cell_above_enabled", "toggle"],
        ["RL-BT", "row_more_than_3_enabled", "disable"],
        ["LR-TB", "no_neighbors_enabled", "enable"],
        ["TB-LR", "left_and_right_enabled", "toggle"],
        ["RL-BT", "column_even_count", "toggle"],
        ["LR-TB", "three_in_a_row_horizontally", "toggle"],
        ["BT-RL", "on_even_column_and_enabled", "toggle"],
        ["LR-TB", "more_enabled_in_row_than_column", "disable"],
        ["RL-BT", "exactly_1_neighbors", "enable"],
      ],
      "13": [
        ["LR-TB", "exactly_1_neighbors", "toggle"],
        ["RL-BT", "exactly_2_neighbors", "toggle"],
        ["TB-LR", "cell_above_enabled", "toggle"],
        ["BT-RL", "left_and_right_enabled", "toggle"],
        ["LR-TB", "column_even_count", "toggle"],
        ["RL-BT", "on_even_column_and_enabled", "toggle"],
        ["TB-LR", "three_in_a_row_horizontally", "toggle"],
        ["BT-RL", "exactly_3_neighbors", "toggle"],
      ],
      "15": [
        ["LR-TB", "more_than_1_neighbors", "disable"],
        ["TB-LR", "cell_above_enabled", "disable"],
        ["RL-BT", "row_more_than_2_enabled", "disable"],
        ["LR-TB", "three_in_a_row_horizontally", "disable"],
        ["BT-RL", "on_even_column_and_enabled", "disable"],
        ["RL-BT", "more_enabled_in_row_than_column", "disable"],
        ["LR-TB", "no_neighbors_enabled", "enable"],
      ],
    };

    this.selectedRuleset = "1";
    this.threeSequenceMode = "on_only";
    this.threeScopeMode = "contiguous";
    this.neighborMode = "cardinal";
    this.indexBaseMode = "one_based";

    this.el = {
      grid: document.getElementById("grid"),
      rulesText: document.getElementById("rulesText"),
      logText: document.getElementById("logText"),
      rulesetSelect: document.getElementById("rulesetSelect"),
      delaySlider: document.getElementById("delaySlider"),
      delayValue: document.getElementById("delayValue"),
      applyAnimatedBtn: document.getElementById("applyAnimatedBtn"),
      applyInstantBtn: document.getElementById("applyInstantBtn"),
      clearBtn: document.getElementById("clearBtn"),
      fillBtn: document.getElementById("fillBtn"),
      rotateLeftBtn: document.getElementById("rotateLeftBtn"),
      rotateRightBtn: document.getElementById("rotateRightBtn"),
      printBtn: document.getElementById("printBtn"),
      threeSequenceModeBtn: document.getElementById("threeSequenceModeBtn"),
      threeScopeModeBtn: document.getElementById("threeScopeModeBtn"),
      neighborModeBtn: document.getElementById("neighborModeBtn"),
      indexBaseBtn: document.getElementById("indexBaseBtn"),
    };

    this.init();
  }

  init() {
    Object.keys(this.rulesets).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      this.el.rulesetSelect.appendChild(option);
    });
    this.el.rulesetSelect.value = this.selectedRuleset;
    this.el.delayValue.textContent = this.el.delaySlider.value;

    this.el.rulesetSelect.addEventListener("change", () => {
      this.selectedRuleset = this.el.rulesetSelect.value;
      this.refreshRulesDisplay();
      this.logMessage(`Switched to ruleset [${this.selectedRuleset}]`);
    });

    this.el.delaySlider.addEventListener("input", () => {
      this.el.delayValue.textContent = this.el.delaySlider.value;
    });

    this.el.applyAnimatedBtn.addEventListener("click", () => this.applyAllRulesAnimated());
    this.el.applyInstantBtn.addEventListener("click", () => this.applyAllRulesInstant());
    this.el.clearBtn.addEventListener("click", () => this.clearGrid());
    this.el.fillBtn.addEventListener("click", () => this.fillOn());
    this.el.rotateLeftBtn.addEventListener("click", () => this.rotateLeft());
    this.el.rotateRightBtn.addEventListener("click", () => this.rotateRight());
    this.el.printBtn.addEventListener("click", () => this.printGrid());
    this.el.threeSequenceModeBtn.addEventListener("click", () => this.toggleThreeSequenceMode());
    this.el.threeScopeModeBtn.addEventListener("click", () => this.toggleThreeScopeMode());
    this.el.neighborModeBtn.addEventListener("click", () => this.toggleNeighborMode());
    this.el.indexBaseBtn.addEventListener("click", () => this.toggleIndexBaseMode());

    this.updateThreeSequenceModeButton();
    this.updateThreeScopeModeButton();
    this.updateNeighborModeButton();
    this.updateIndexBaseButton();

    this.refreshRulesDisplay();
    this.logMessage("Ready.");
    this.renderGrid();
  }

  setControlsDisabled(disabled) {
    [
      this.el.rulesetSelect,
      this.el.clearBtn,
      this.el.fillBtn,
      this.el.rotateLeftBtn,
      this.el.rotateRightBtn,
      this.el.applyAnimatedBtn,
      this.el.applyInstantBtn,
      this.el.threeSequenceModeBtn,
      this.el.threeScopeModeBtn,
      this.el.neighborModeBtn,
      this.el.indexBaseBtn,
    ].forEach((el) => {
      el.disabled = disabled;
    });
  }

  refreshRulesDisplay() {
    const threeSequenceLabel = this.threeSequenceMode === "on_only" ? "ON only" : "ON or OFF";
    const threeScopeLabel = this.threeScopeMode === "contiguous" ? "contiguous only" : "whole row count";
    const neighborLabel = this.neighborMode === "cardinal" ? "cardinal" : "8-way";
    const columnBaseLabel = this.indexBaseMode === "one_based" ? "1-based" : "0-based";

    const lines = [
      `Ruleset [${this.selectedRuleset}]`,
      `3-in-row sequence mode: ${threeSequenceLabel}`,
      `3-in-row scope: ${threeScopeLabel}`,
      `Neighbor mode: ${neighborLabel}`,
      `Even-column mode: ${columnBaseLabel}`,
      "",
    ];

    for (const [direction, conditionName, action] of this.rulesets[this.selectedRuleset]) {
      lines.push(`[${direction}] IF ${conditionName.replaceAll("_", " ").toUpperCase()} -> ${action.toUpperCase()}`);
    }

    this.el.rulesText.textContent = lines.join("\n");
  }

  logMessage(msg) {
    this.el.logText.textContent += `${msg}\n`;
    this.el.logText.scrollTop = this.el.logText.scrollHeight;
  }

  

  logicalColumnNumber(c) {
  return this.indexBaseMode === "one_based" ? c + 1 : c;
  }

  updateThreeSequenceModeButton() {
    this.el.threeSequenceModeBtn.textContent = this.threeSequenceMode === "on_only"
      ? "3-in-row sequence: ON only"
      : "3-in-row sequence: ON or OFF";
  }

  toggleThreeSequenceMode() {
    if (this.isRunning) return;
    this.threeSequenceMode = this.threeSequenceMode === "on_only" ? "uniform" : "on_only";
    this.updateThreeSequenceModeButton();
    this.refreshRulesDisplay();
    this.logMessage(
      `3-in-row sequence mode set to ${this.threeSequenceMode === "on_only" ? "ON only" : "ON or OFF"}.`
    );
  }

  updateThreeScopeModeButton() {
    this.el.threeScopeModeBtn.textContent = this.threeScopeMode === "contiguous"
      ? "3-in-row scope: contiguous only"
      : "3-in-row scope: whole row count";
  }

  toggleThreeScopeMode() {
    if (this.isRunning) return;
    this.threeScopeMode = this.threeScopeMode === "contiguous" ? "whole_row" : "contiguous";
    this.updateThreeScopeModeButton();
    this.refreshRulesDisplay();
    this.logMessage(
      `3-in-row scope set to ${this.threeScopeMode === "contiguous" ? "contiguous only" : "whole row count"}.`
    );
  }

  updateNeighborModeButton() {
    this.el.neighborModeBtn.textContent = this.neighborMode === "cardinal"
      ? "Neighbors: cardinal"
      : "Neighbors: 8-way";
  }

  toggleNeighborMode() {
    if (this.isRunning) return;
    this.neighborMode = this.neighborMode === "cardinal" ? "eight_way" : "cardinal";
    this.updateNeighborModeButton();
    this.refreshRulesDisplay();
    this.logMessage(
      `Neighbor mode set to ${this.neighborMode === "cardinal" ? "cardinal" : "8-way"}.`
    );
  }


  updateIndexBaseButton() {
    this.el.indexBaseBtn.textContent = this.indexBaseMode === "one_based"
      ? "Column base: 1-based"
      : "Column base: 0-based";
  }

  toggleIndexBaseMode() {
    if (this.isRunning) return;
    this.indexBaseMode = this.indexBaseMode === "one_based" ? "zero_based" : "one_based";
    this.updateIndexBaseButton();
    this.refreshRulesDisplay();
    this.logMessage(`Column numbering set to ${this.indexBaseMode === "one_based" ? "1-based" : "0-based"}.`);
  }

  renderGrid() {
    this.el.grid.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
    this.el.grid.innerHTML = "";

    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const btn = document.createElement("button");
        const on = this.grid[r][c];
        const isCurrent = this.highlightedCell && this.highlightedCell[0] === r && this.highlightedCell[1] === c;

        btn.type = "button";
        btn.className = "cell";
        btn.classList.add(on ? "on" : "off");
        if (isCurrent) btn.classList.add("current");
        btn.textContent = on ? "ON" : "OFF";
        btn.addEventListener("click", () => this.toggleCell(r, c));

        this.el.grid.appendChild(btn);
      }
    }

  }

  toggleCell(r, c) {
    if (this.isRunning) return;
    this.grid[r][c] = !this.grid[r][c];
    this.renderGrid();
  }


  clearGrid() {
    if (this.isRunning) return;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid cleared.");
  }

  fillOn() {
    if (this.isRunning) return;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(true));
    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid filled with ON.");
  }

  rotateLeft() {
    if (this.isRunning) return;
    const oldRows = this.rows;
    const oldCols = this.cols;
    const newGrid = Array.from({ length: oldCols }, (_, nr) =>
      Array.from({ length: oldRows }, (_, nc) => this.grid[nc][oldCols - 1 - nr])
    );

    this.grid = newGrid;
    this.rows = oldCols;
    this.cols = oldRows;
    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid rotated left.");
  }

  rotateRight() {
    if (this.isRunning) return;
    const oldRows = this.rows;
    const oldCols = this.cols;
    const newGrid = Array.from({ length: oldCols }, (_, nr) =>
      Array.from({ length: oldRows }, (_, nc) => this.grid[oldRows - 1 - nc][nr])
    );

    this.grid = newGrid;
    this.rows = oldCols;
    this.cols = oldRows;
    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid rotated right.");
  }

  printGrid() {
    const gridText = this.grid.map((row) => row.map((cell) => (cell ? "1" : "0")).join(" ")).join("\n");
    const report = [
      "Grid:",
      gridText,
      `Ruleset: ${this.selectedRuleset}`,
      `3-in-row sequence mode: ${this.threeSequenceMode === "on_only" ? "ON only" : "ON or OFF"}`,
      `3-in-row scope: ${this.threeScopeMode === "contiguous" ? "contiguous only" : "whole row count"}`,
      `Neighbor mode: ${this.neighborMode === "cardinal" ? "cardinal" : "8-way"}`,
      `Column base: ${this.indexBaseMode === "one_based" ? "1-based" : "0-based"}`,
      "------------------------------",
    ].join("\n");

    console.log(report);
    this.logMessage(report);
  }

  baseTraversalOrder(direction) {
    const coords = [];

    if (direction === "TB-LR") {
      for (let c = 0; c < this.cols; c += 1) {
        for (let r = 0; r < this.rows; r += 1) coords.push([r, c]);
      }
    } else if (direction === "BT-RL") {
      for (let c = this.cols - 1; c >= 0; c -= 1) {
        for (let r = this.rows - 1; r >= 0; r -= 1) coords.push([r, c]);
      }
    } else if (direction === "LR-TB") {
      for (let r = 0; r < this.rows; r += 1) {
        for (let c = 0; c < this.cols; c += 1) coords.push([r, c]);
      }
    } else if (direction === "RL-BT") {
      for (let r = this.rows - 1; r >= 0; r -= 1) {
        for (let c = this.cols - 1; c >= 0; c -= 1) coords.push([r, c]);
      }
    } else {
      throw new Error(`Unknown direction: ${direction}`);
    }

    return coords;
  }

  neighborOffsets() {
    if (this.neighborMode === "eight_way") {
      return [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
    }

    return [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
  }

  neighborCount(r, c) {
    let count = 0;
    for (const [dr, dc] of this.neighborOffsets()) {
      if (this.isOn(r + dr, c + dc)) count += 1;
    }
    return count;
  }

  isOn(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols ? this.grid[r][c] : false;
  }

  orthogonalNeighborCount(r, c) {
    return [
      this.isOn(r - 1, c),
      this.isOn(r + 1, c),
      this.isOn(r, c - 1),
      this.isOn(r, c + 1),
    ].filter(Boolean).length;
  }

  rowOnCount(r) {
    return this.grid[r].filter(Boolean).length;
  }

  columnOnCount(c) {
    let count = 0;
    for (let r = 0; r < this.rows; r += 1) count += this.grid[r][c] ? 1 : 0;
    return count;
  }

  hasThreeInARowHorizontally(r, c) {
    if (this.threeScopeMode === "whole_row") {
      const onCount = this.rowOnCount(r);
      const offCount = this.cols - onCount;

      if (this.threeSequenceMode === "on_only") {
        return onCount >= 3;
      }

      return onCount >= 3 || offCount >= 3;
    }

    const patterns = [
      [c - 2, c - 1, c],
      [c - 1, c, c + 1],
      [c, c + 1, c + 2],
    ];

    return patterns.some(([a, b, d]) => {
      if (a < 0 || b < 0 || d < 0 || a >= this.cols || b >= this.cols || d >= this.cols) {
        return false;
      }

      const A = this.isOn(r, a);
      const B = this.isOn(r, b);
      const D = this.isOn(r, d);

      if (this.threeSequenceMode === "on_only") {
        return A && B && D;
      }

      return A === B && B === D;
    });
  }

  applyAction(r, c, action) {
    if (action === "toggle") this.grid[r][c] = !this.grid[r][c];
    else if (action === "enable") this.grid[r][c] = true;
    else if (action === "disable") this.grid[r][c] = false;
    else throw new Error(`Unknown action: ${action}`);
  }

  conditionMatches(conditionName, r, c) {
    switch (conditionName) {
      case "exactly_1_neighbors": return this.neighborCount(r, c) === 1;
      case "exactly_2_neighbors": return this.neighborCount(r, c) === 2;
      case "exactly_3_neighbors": return this.neighborCount(r, c) === 3;
      case "more_than_1_neighbors": return this.neighborCount(r, c) > 1;
      case "no_neighbors_enabled": return this.neighborCount(r, c) === 0;
      case "cell_above_enabled": return this.isOn(r - 1, c);
      case "left_and_right_enabled": return this.isOn(r, c - 1) && this.isOn(r, c + 1);
      case "column_even_count": return this.columnOnCount(c) % 2 === 0;
      case "on_even_column_and_enabled": return (this.logicalColumnNumber(c) % 2 === 0) && this.isOn(r, c);
      case "three_in_a_row_horizontally": return this.hasThreeInARowHorizontally(r, c);
      case "row_more_than_3_enabled": return this.rowOnCount(r) > 3;
      case "row_more_than_2_enabled": return this.rowOnCount(r) > 2;
      case "more_enabled_in_row_than_column": return this.rowOnCount(r) > this.columnOnCount(c);
      default: throw new Error(`Unknown condition: ${conditionName}`);
    }
  }

  applySingleRule(direction, conditionName, action) {
    let changed = 0;
    const order = this.baseTraversalOrder(direction);
    for (const [r, c] of order) {
      if (this.conditionMatches(conditionName, r, c)) {
        const oldValue = this.grid[r][c];
        this.applyAction(r, c, action);
        if (this.grid[r][c] !== oldValue) changed += 1;
      }
    }
    return changed;
  }

  applyAllRulesInstant() {
    if (this.isRunning) return;
    const activeRules = this.rulesets[this.selectedRuleset];
    this.logMessage("========================================");
    this.logMessage(`Applying ruleset [${this.selectedRuleset}]...`);
    for (let i = 0; i < activeRules.length; i += 1) {
      const [direction, conditionName, action] = activeRules[i];
      const changed = this.applySingleRule(direction, conditionName, action);
      this.renderGrid();
      this.logMessage(`Rule ${i + 1}: [${direction}] ${conditionName} -> ${action} changed ${changed} cell(s)`);
    }
    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Done.");
    this.logMessage("========================================");
  }

  applyAllRulesAnimated() {
    if (this.isRunning) return;
    this.ruleIndex = 0;
    this.isRunning = true;
    this.setControlsDisabled(true);
    this.logMessage("========================================");
    this.logMessage(`Applying ruleset [${this.selectedRuleset}]...`);
    this.runNextRule();
  }

  runNextRule() {
    const activeRules = this.rulesets[this.selectedRuleset];

    if (this.ruleIndex >= activeRules.length) {
      this.highlightedCell = null;
      this.renderGrid();
      this.logMessage("Done.");
      this.logMessage("========================================");
      this.isRunning = false;
      this.setControlsDisabled(false);
      return;
    }

    const [direction, conditionName, action] = activeRules[this.ruleIndex];
    this.currentOrder = this.baseTraversalOrder(direction);
    this.currentStep = 0;
    this.currentDirection = direction;
    this.currentCondition = conditionName;
    this.currentAction = action;
    this.currentChanged = 0;

    this.logMessage(`Running rule ${this.ruleIndex + 1}: [${direction}] ${conditionName} -> ${action}`);
    this.stepCurrentRule();
  }

  stepCurrentRule() {
    if (this.currentStep >= this.currentOrder.length) {
      this.logMessage(`Rule ${this.ruleIndex + 1} finished: changed ${this.currentChanged} cell(s)`);
      this.ruleIndex += 1;
      this.pendingTimeout = window.setTimeout(() => this.runNextRule(), 300);
      return;
    }

    const [r, c] = this.currentOrder[this.currentStep];
    this.highlightedCell = [r, c];

    if (this.conditionMatches(this.currentCondition, r, c)) {
      const oldValue = this.grid[r][c];
      this.applyAction(r, c, this.currentAction);
      if (this.grid[r][c] !== oldValue) this.currentChanged += 1;
    }

    this.renderGrid();
    this.currentStep += 1;
    const delay = Number(this.el.delaySlider.value);
    this.pendingTimeout = window.setTimeout(() => this.stepCurrentRule(), delay);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new RuleGridApp(7, 4);
});
