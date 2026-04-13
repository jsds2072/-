(function () {
  "use strict";

  const mainDisplay = document.getElementById("mainDisplay");
  const subDisplay = document.getElementById("subDisplay");
  const keys = document.getElementById("keys");

  /** @type {number | null} */
  let accumulator = null;
  /** @type {string | null} */
  let pendingOp = null;
  /** @type {string} */
  let current = "0";
  /** @type {boolean} */
  let fresh = false;

  const MAX_DIGITS = 12;

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "오류";
    const s = String(n);
    if (s.replace(/[-.e]/gi, "").length > MAX_DIGITS) {
      return n.toPrecision(MAX_DIGITS);
    }
    return s;
  }

  function updateDisplay() {
    mainDisplay.textContent = current;
    mainDisplay.classList.toggle("display__main--error", current === "오류");

    if (accumulator !== null && pendingOp) {
      const opLabel = { "+": "+", "-": "−", "*": "×", "/": "÷" }[pendingOp] || pendingOp;
      subDisplay.textContent = `${formatNumber(accumulator)} ${opLabel}`;
    } else {
      subDisplay.textContent = "";
    }
  }

  function applyOp(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function flushPending() {
    if (accumulator === null || !pendingOp) return;
    const next = parseFloat(current);
    const result = applyOp(accumulator, next, pendingOp);
    if (!Number.isFinite(result)) {
      current = "오류";
      accumulator = null;
      pendingOp = null;
      fresh = true;
      return;
    }
    accumulator = result;
    current = formatNumber(result);
    pendingOp = null;
    fresh = true;
  }

  function inputDigit(d) {
    if (current === "오류") {
      current = "0";
      accumulator = null;
      pendingOp = null;
    }
    if (fresh) {
      current = d;
      fresh = false;
    } else {
      if (current === "0" && d !== "0") current = d;
      else if (current === "0" && d === "0") return;
      else if (current.replace(/[.-]/g, "").length < MAX_DIGITS) current += d;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (current === "오류") {
      current = "0.";
      accumulator = null;
      pendingOp = null;
      fresh = false;
      updateDisplay();
      return;
    }
    if (fresh) {
      current = "0.";
      fresh = false;
      updateDisplay();
      return;
    }
    if (!current.includes(".")) {
      current += ".";
      updateDisplay();
    }
  }

  function setOperator(op) {
    if (current === "오류") return;
    const value = parseFloat(current);

    if (accumulator === null) {
      accumulator = value;
    } else if (pendingOp && !fresh) {
      const result = applyOp(accumulator, value, pendingOp);
      if (!Number.isFinite(result)) {
        current = "오류";
        accumulator = null;
        pendingOp = null;
        fresh = true;
        updateDisplay();
        return;
      }
      accumulator = result;
      current = formatNumber(result);
    }

    pendingOp = op;
    fresh = true;
    updateDisplay();
  }

  function equals() {
    if (current === "오류") return;
    flushPending();
    updateDisplay();
  }

  function clearAll() {
    accumulator = null;
    pendingOp = null;
    current = "0";
    fresh = false;
    updateDisplay();
  }

  function toggleSign() {
    if (current === "오류" || fresh) return;
    if (current === "0") return;
    if (current.startsWith("-")) current = current.slice(1);
    else current = "-" + current;
    updateDisplay();
  }

  function percent() {
    if (current === "오류") return;
    const n = parseFloat(current) / 100;
    current = formatNumber(n);
    fresh = true;
    updateDisplay();
  }

  keys.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");

    switch (action) {
      case "digit":
        inputDigit(btn.getAttribute("data-value") || "");
        break;
      case "decimal":
        inputDecimal();
        break;
      case "operator":
        setOperator(btn.getAttribute("data-op") || "+");
        break;
      case "equals":
        equals();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      default:
        break;
    }
  });

  const keyMap = {
    Enter: "=",
    "=": "=",
    Escape: "clear",
    Backspace: "back",
    "%": "%",
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const k = e.key;

    if (k >= "0" && k <= "9") {
      e.preventDefault();
      inputDigit(k);
      return;
    }

    if (k === ".") {
      e.preventDefault();
      inputDecimal();
      return;
    }

    const opKeys = { "+": "+", "-": "-", "*": "*", "/": "/" };
    if (opKeys[k]) {
      e.preventDefault();
      setOperator(opKeys[k]);
      return;
    }

    const special = keyMap[k];
    if (special === "=") {
      e.preventDefault();
      equals();
      return;
    }
    if (special === "clear") {
      e.preventDefault();
      clearAll();
      return;
    }
    if (special === "back") {
      e.preventDefault();
      if (current === "오류" || fresh) return;
      if (current.length <= 1) current = "0";
      else current = current.slice(0, -1);
      updateDisplay();
      return;
    }
    if (special === "%") {
      e.preventDefault();
      percent();
      return;
    }
  });

  updateDisplay();
})();
