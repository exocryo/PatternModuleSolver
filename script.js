class RuleGridApp {
  constructor(rows = 7, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.isRunning = false;
    this.highlightedCell = null;
    this.pendingTimeout = null;
    this.rotationState = 0; // 0 = original, 1 = 90°, 2 = 180°, 3 = 270°

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
    this.debugRuleIndex = 0;

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
      resetRotationBtn: document.getElementById("resetRotationBtn"),
      //printBtn: document.getElementById("printBtn"),
      clearLogBtn: document.getElementById("clearLogBtn"),
      threeSequenceModeSelect: document.getElementById("threeSequenceModeSelect"),
      threeScopeModeSelect: document.getElementById("threeScopeModeSelect"),
      neighborModeSelect: document.getElementById("neighborModeSelect"),
      indexBaseModeSelect: document.getElementById("indexBaseModeSelect"),
      stepRuleBtn: document.getElementById("stepRuleBtn"),
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
    this.el.threeSequenceModeSelect.value = this.threeSequenceMode;
    this.el.threeScopeModeSelect.value = this.threeScopeMode;
    this.el.neighborModeSelect.value = this.neighborMode;
    this.el.indexBaseModeSelect.value = this.indexBaseMode;

    this.el.rulesetSelect.addEventListener("change", () => {
      this.selectedRuleset = this.el.rulesetSelect.value;
      this.refreshRulesDisplay();
      this.resetDebugRuleIndex();
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
    this.el.resetRotationBtn.addEventListener("click", () => this.resetRotation());
    // this.el.printBtn.addEventListener("click", () => this.printGrid());
    this.el.clearLogBtn.addEventListener("click", () => this.clearLog());
    this.el.threeSequenceModeSelect.addEventListener("change", () => {
      if (this.isRunning) return;
      this.threeSequenceMode = this.el.threeSequenceModeSelect.value;
      this.refreshRulesDisplay();
      this.logMessage(`3-in-row match type set to ${this.threeSequenceMode}`);
    });

    this.el.threeScopeModeSelect.addEventListener("change", () => {
      if (this.isRunning) return;
      this.threeScopeMode = this.el.threeScopeModeSelect.value;
      this.refreshRulesDisplay();
      this.logMessage(`3-in-row scope set to ${this.threeScopeMode}`);
    });

    this.el.neighborModeSelect.addEventListener("change", () => {
      if (this.isRunning) return;
      this.neighborMode = this.el.neighborModeSelect.value;
      this.refreshRulesDisplay();
      this.logMessage(`Neighbor mode set to ${this.neighborMode}`);
    });

    this.el.indexBaseModeSelect.addEventListener("change", () => {
      if (this.isRunning) return;
      this.indexBaseMode = this.el.indexBaseModeSelect.value;
      this.refreshRulesDisplay();
      this.logMessage(`Column numbering set to ${this.indexBaseMode}`);
    });
    this.el.stepRuleBtn.addEventListener("click", () => this.applyNextRuleOnly());

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
      this.el.stepRuleBtn,
    ].forEach((el) => {
      el.disabled = disabled;
    });
  }

  refreshRulesDisplay() {
    const threeSequenceLabel = this.threeSequenceMode === "on_only" ? "ON only" : "ON or OFF";

    let threeScopeLabel = "";
    if (this.threeScopeMode === "contiguous") {
      threeScopeLabel = "Cell in sequence only";
    } else if (this.threeScopeMode === "whole_row") {
      threeScopeLabel = "whole row count";
    } else {
      threeScopeLabel = "sequence anywhere in row";
    }

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

    const newGrid = Array.from({ length: this.cols }, () => Array(this.rows));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        newGrid[this.cols - 1 - c][r] = this.grid[r][c];
      }
    }

    this.grid = newGrid;
    [this.rows, this.cols] = [this.cols, this.rows];
    this.rotationState = (this.rotationState + 3) % 4;

    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid rotated left.");
  }

  rotateRight() {
    if (this.isRunning) return;

    const newGrid = Array.from({ length: this.cols }, () => Array(this.rows));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        newGrid[c][this.rows - 1 - r] = this.grid[r][c];
      }
    }

    this.grid = newGrid;
    [this.rows, this.cols] = [this.cols, this.rows];
    this.rotationState = (this.rotationState + 1) % 4;

    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid rotated right.");
  }

  resetRotation() {
    if (this.isRunning) return;

    while (this.rotationState !== 0) {
      const newGrid = Array.from({ length: this.cols }, () => Array(this.rows));

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          newGrid[this.cols - 1 - c][r] = this.grid[r][c];
        }
      }

      this.grid = newGrid;
      [this.rows, this.cols] = [this.cols, this.rows];
      this.rotationState = (this.rotationState + 3) % 4;
    }

    this.highlightedCell = null;
    this.renderGrid();
    this.logMessage("Grid rotation reset to original orientation.");
  }

  printGrid() {
    const gridText = this.grid.map((row) => row.map((cell) => (cell ? "1" : "0")).join(" ")).join("\n");
    const report = [
      "Grid:",
      gridText,
      `Ruleset: ${this.selectedRuleset}`,
      `3-in-row sequence mode: ${this.threeSequenceMode === "on_only" ? "ON only" : "ON or OFF"}`,
      `3-in-row scope: ${this.threeScopeMode === "contiguous" ? "contiguous only" : this.threeScopeMode === "whole_row" ? "whole row count" : "sequence anywhere in row"}`,
      `Neighbor mode: ${this.neighborMode === "cardinal" ? "cardinal" : "8-way"}`,
      `Column base: ${this.indexBaseMode === "one_based" ? "1-based" : "0-based"}`,
      "------------------------------",
    ].join("\n");

    console.log(report);
    this.logMessage(report);
  }

  clearLog() {
    this.el.logText.textContent = "";
    this.logMessage("Ready.");
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

  rowHasThreeSequence(r) {
    for (let c = 0; c <= this.cols - 3; c += 1) {
      const A = this.isOn(r, c);
      const B = this.isOn(r, c + 1);
      const D = this.isOn(r, c + 2);

      if (this.threeSequenceMode === "on_only") {
        if (A && B && D) return true;
      } else {
        if (A === B && B === D) return true;
      }
    }

    return false;
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

    if (this.threeScopeMode === "row_has_sequence") {
      return this.rowHasThreeSequence(r);
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


  getActiveRulesFromCurrentPosition() {
    const activeRules = this.rulesets[this.selectedRuleset] || [];
    return {
      activeRules,
      startIndex: this.debugRuleIndex >= 0 && this.debugRuleIndex < activeRules.length
        ? this.debugRuleIndex
        : 0,
    };
  }

  resetDebugRuleIndex() {
    this.debugRuleIndex = 0;
  }

  applyNextRuleOnly() {
    if (this.isRunning) return;

    const activeRules = this.rulesets[this.selectedRuleset];
    if (!activeRules || activeRules.length === 0) return;

    if (this.debugRuleIndex >= activeRules.length) {
      this.debugRuleIndex = 0;
    }

    const ruleNumber = this.debugRuleIndex + 1;
    const [direction, conditionName, action] = activeRules[this.debugRuleIndex];

    this.logMessage("========================================");
    this.logMessage(`Debug step: applying rule ${ruleNumber} of ${activeRules.length}`);
    this.logMessage(`[${direction}] ${conditionName} -> ${action}`);

    const changed = this.applySingleRule(direction, conditionName, action);

    this.highlightedCell = null;
    this.renderGrid();

    this.logMessage(`Rule ${ruleNumber} changed ${changed} cell(s).`);

    this.debugRuleIndex += 1;

    if (this.debugRuleIndex >= activeRules.length) {
      this.logMessage("Reached end of ruleset. Next press will wrap to rule 1.");
      this.debugRuleIndex = 0;
    } else {
      this.logMessage(`Next debug rule will be rule ${this.debugRuleIndex + 1}.`);
    }

    this.logMessage("========================================");
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

    const { activeRules, startIndex } = this.getActiveRulesFromCurrentPosition();
    if (!activeRules.length) return;

    this.logMessage("========================================");
    this.logMessage(
      startIndex === 0
        ? "Applying full ruleset instantly from rule 1."
        : `Continuing ruleset instantly from rule ${startIndex + 1}.`
    );

    for (let i = startIndex; i < activeRules.length; i += 1) {
      const [direction, conditionName, action] = activeRules[i];
      this.logMessage(`Applying rule ${i + 1}/${activeRules.length}: [${direction}] ${conditionName} -> ${action}`);
      this.applySingleRule(direction, conditionName, action);
    }

    this.highlightedCell = null;
    this.renderGrid();

    this.debugRuleIndex = 0;

    this.logMessage("Ruleset pass complete.");
    this.logMessage("========================================");
  }

  applyAllRulesAnimated() {
    if (this.isRunning) return;

    const { activeRules, startIndex } = this.getActiveRulesFromCurrentPosition();
    if (!activeRules.length) return;

    this.ruleIndex = startIndex;
    this.isRunning = true;
    this.setControlsDisabled(true);

    this.logMessage("========================================");
    this.logMessage(
      startIndex === 0
        ? `Applying ruleset [${this.selectedRuleset}] from rule 1...`
        : `Continuing ruleset [${this.selectedRuleset}] from rule ${startIndex + 1}...`
    );

    this.runNextRule();
  }

  runNextRule() {
    const activeRules = this.rulesets[this.selectedRuleset];

    if (this.ruleIndex >= activeRules.length) {
      this.highlightedCell = null;
      this.renderGrid();
      this.debugRuleIndex = 0;
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
