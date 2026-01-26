const DATA_FILE = "data.json";
const NUM_CHOICES = 4;
const ADVANCE_DELAY_MS = 800;

// State
let items = [];
let pool = [];
let current = null;
let score = 0;
let total = 0;
let answeredCount = 0;

let missed = [];
let skipped = [];

// Helpers
function normalize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// UI
const questionEl = document.getElementById("question");
const countEl = document.getElementById("count");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const remainingEl = document.getElementById("remaining");

const submitBtn = document.getElementById("submit");
const skipBtn = document.getElementById("skip");
const finishBtn = document.getElementById("finish");
const restartBtn = document.getElementById("restart");

// Core
function resetPool() {
  pool = items.slice();
  shuffle(pool);
  updateRemaining();
}

function updateRemaining() {
  remainingEl.textContent = `Remaining: ${pool.length}`;
}

function updateCount() {
  const totalItems = items.length || 0;
  countEl.textContent = `Question: ${answeredCount + 1} / ${totalItems}`;
}

function renderChoices(choices, correct) {
  choicesEl.innerHTML = "";
  choices.forEach((choice, i) => {
    const id = `choice_${i}`;
    const label = document.createElement("label");
    label.className = "choice";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "choice";
    input.value = choice;
    input.id = id;

    const span = document.createElement("span");
    span.textContent = choice;

    label.appendChild(input);
    label.appendChild(span);
    choicesEl.appendChild(label);
  });
}

function nextQuestion() {
  if (!pool.length) {
    alert("All questions used once. Reshuffling.");
    resetPool();
  }

  feedbackEl.textContent = "";
  feedbackEl.style.color = "#222";

  current = pool.pop();
  const correct = current.CorrectAddress;

  const allAddresses = items.map(i => i.CorrectAddress);
  const distractors = allAddresses.filter(a => normalize(a) !== normalize(correct));
  shuffle(distractors);

  const selectedDistractors = distractors.slice(0, Math.min(NUM_CHOICES - 1, distractors.length));
  const choices = shuffle([correct, ...selectedDistractors]);

  questionEl.textContent = `Name: ${current.Name}`;
  renderChoices(choices, correct);
  updateRemaining();
  updateCount();
}

function getSelectedChoice() {
  const checked = document.querySelector("input[name='choice']:checked");
  return checked ? checked.value : "";
}

function submitAnswer() {
  const selected = getSelectedChoice();
  if (!selected) {
    alert("Please choose an answer.");
    return;
  }

  const correct = current.CorrectAddress;
  total += 1;
  answeredCount += 1;

  if (normalize(selected) === normalize(correct)) {
    score += 1;
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.style.color = "green";
  } else {
    missed.push({
      Name: current.Name,
      CorrectAddress: correct,
      YourChoice: selected
    });
    feedbackEl.textContent = `❌ Incorrect. Correct: ${correct}`;
    feedbackEl.style.color = "red";
  }

  scoreEl.textContent = `Score: ${score}/${total}`;
  setTimeout(nextQuestion, ADVANCE_DELAY_MS);
}

function skipQuestion() {
  skipped.push({
    Name: current.Name,
    CorrectAddress: current.CorrectAddress
  });
  answeredCount += 1;
  feedbackEl.textContent = "⏭️ Skipped.";
  feedbackEl.style.color = "#555";
  setTimeout(nextQuestion, ADVANCE_DELAY_MS);
}

function finishQuiz() {
  const percent = total > 0 ? (score / total * 100).toFixed(1) : "0.0";
  let recap = `Score: ${score}/${total}  |  Percent: ${percent}%\n\n`;

  recap += "Missed:\n";
  recap += missed.length
    ? missed.map(m => `- ${m.Name} → Correct: ${m.CorrectAddress} | You chose: ${m.YourChoice}`).join("\n")
    : "None 🎉";

  recap += "\n\nSkipped:\n";
  recap += skipped.length
    ? skipped.map(s => `- ${s.Name} → ${s.CorrectAddress}`).join("\n")
    : "None";

  alert(recap);
}

function restartQuiz() {
  score = 0;
  total = 0;
  answeredCount = 0;
  missed = [];
  skipped = [];

  scoreEl.textContent = "Score: 0/0";
  feedbackEl.textContent = "";

  resetPool();
  nextQuestion();
}

// Init
fetch(DATA_FILE)
  .then(res => res.json())
  .then(data => {
    items = data;
    resetPool();
    nextQuestion();
  });

// Events
submitBtn.addEventListener("click", submitAnswer);
skipBtn.addEventListener("click", skipQuestion);
finishBtn.addEventListener("click", finishQuiz);
restartBtn.addEventListener("click", restartQuiz);