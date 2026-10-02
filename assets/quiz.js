(function () {
  const data = window.LEXICON_DATA || {};
  const allCategories = Object.entries(data);
  const allCheckbox = document.querySelector("[data-all-categories]");
  const categoryList = document.querySelector("[data-category-list]");
  const modeSelect = document.querySelector("[data-quiz-mode]");
  const startButton = document.querySelector("[data-start-quiz]");
  const nextButton = document.querySelector("[data-next-question]");
  const speakButton = document.querySelector("[data-speak]");
  const optionsBox = document.querySelector("[data-quiz-options]");
  const promptBox = document.querySelector("[data-question-prompt]");
  const promptLabel = document.querySelector("[data-question-label]");
  const feedback = document.querySelector("[data-feedback]");
  const answerEn = document.querySelector("[data-answer-en]");
  const answerZh = document.querySelector("[data-answer-zh]");
  const progress = document.querySelector("[data-quiz-progress]");
  const scoreBox = document.querySelector("[data-score]");
  const streakBox = document.querySelector("[data-streak]");
  const poolBox = document.querySelector("[data-pool-size]");
  const wrongBookCount = document.querySelector("[data-wrongbook-count]");

  const WRONGBOOK_KEY = "ieltsWritingLexiconWrongBook";

  let deck = [];
  let questionNumber = 0;
  let score = 0;
  let streak = 0;
  let answered = false;
  let current = null;

  function readWrongBook() {
    try {
      return JSON.parse(window.localStorage.getItem(WRONGBOOK_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function writeWrongBook(items) {
    try {
      window.localStorage.setItem(WRONGBOOK_KEY, JSON.stringify(items));
    } catch (error) {
      // Private browsing or file URLs may disable storage; the quiz still works.
    }
    updateWrongBookCount(items);
  }

  function updateWrongBookCount(items = readWrongBook()) {
    if (wrongBookCount) wrongBookCount.textContent = items.length;
  }

  function saveWrongAnswer(entry) {
    const items = readWrongBook();
    const key = keyFor(entry);
    const existing = items.find((item) => item.key === key);
    if (existing) {
      existing.mistakes = (existing.mistakes || 1) + 1;
      existing.updatedAt = Date.now();
      existing.lastMode = modeSelect.value;
    } else {
      items.unshift({
        key,
        en: entry.en,
        zh: entry.zh,
        category: entry.category,
        categorySlug: entry.categorySlug,
        sources: entry.sources,
        mistakes: 1,
        updatedAt: Date.now(),
        lastMode: modeSelect.value
      });
    }
    writeWrongBook(items);
  }

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function keyFor(entry) {
    return entry.en.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderCategoryFilters() {
    categoryList.innerHTML = allCategories.map(([slug, category]) => `
      <label class="category-check"><input type="checkbox" value="${esc(slug)}" checked><span>${esc(category.name)}</span><small>${category.entries.length}</small></label>
    `).join("");
    categoryList.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      const inputs = Array.from(categoryList.querySelectorAll("input"));
      allCheckbox.checked = inputs.every((item) => item.checked);
      refreshPoolSize();
    }));
  }

  function selectedSlugs() {
    if (allCheckbox.checked) return allCategories.map(([slug]) => slug);
    return Array.from(categoryList.querySelectorAll("input:checked")).map((input) => input.value);
  }

  function selectedEntries() {
    const unique = new Map();
    selectedSlugs().forEach((slug) => {
      (data[slug]?.entries || []).forEach((entry) => {
        const key = keyFor(entry);
        if (!unique.has(key)) unique.set(key, { ...entry, category: data[slug].name, categorySlug: slug });
      });
    });
    return Array.from(unique.values());
  }

  function refreshPoolSize() {
    const size = selectedEntries().length;
    poolBox.textContent = `${size} 个词条可练习`;
    startButton.disabled = size < 4;
    if (size < 4) {
      startButton.textContent = "至少选择 4 个词条";
    } else {
      startButton.textContent = "开始 memorise →";
    }
  }

  function resetStats() {
    questionNumber = 0;
    score = 0;
    streak = 0;
    scoreBox.textContent = "0";
    streakBox.textContent = "0";
  }

  function startSession() {
    deck = shuffle(selectedEntries());
    resetStats();
    nextQuestion();
  }

  function buildOptions(entry) {
    const mode = modeSelect.value;
    const seen = new Set([mode === "toEnglish" ? entry.en : entry.zh]);
    const distractors = shuffle(deck.filter((item) => item.en !== entry.en)).filter((item) => {
      const label = mode === "toEnglish" ? item.en : item.zh;
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    }).slice(0, 3);
    return shuffle([entry, ...distractors]);
  }

  function nextQuestion() {
    if (!deck.length) return;
    current = deck[questionNumber % deck.length];
    questionNumber += 1;
    answered = false;
    const mode = modeSelect.value;
    promptLabel.textContent = mode === "toEnglish" ? "中文释义 · 选出对应的英文" : "English phrase · 选出对应的中文";
    promptBox.textContent = mode === "toEnglish" ? current.zh : current.en;
    answerEn.textContent = current.en;
    answerZh.textContent = current.zh;
    feedback.textContent = "选择一个答案后，这里会显示结果";
    feedback.className = "quiz-feedback";
    optionsBox.innerHTML = buildOptions(current).map((entry, index) => {
      const label = mode === "toEnglish" ? entry.en : entry.zh;
      return `<button class="quiz-option" type="button" data-option-index="${index}" data-entry-key="${esc(keyFor(entry))}"><span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${esc(label)}</span></button>`;
    }).join("");
    optionsBox.querySelectorAll(".quiz-option").forEach((button) => button.addEventListener("click", () => answerQuestion(button)));
    nextButton.disabled = true;
    nextButton.textContent = "下一题 →";
    progress.textContent = `Q${questionNumber.toString().padStart(2, "0")}`;
    poolBox.textContent = `${deck.length} 个词条可练习`;
  }

  function answerQuestion(selectedButton) {
    if (answered || !current) return;
    answered = true;
    const correctKey = keyFor(current);
    const isCorrect = selectedButton.dataset.entryKey === correctKey;
    if (isCorrect) {
      score += 1;
      streak += 1;
      selectedButton.classList.add("is-correct");
      feedback.textContent = "回答正确 ✓ 继续保持这个节奏！";
      feedback.className = "quiz-feedback is-good";
    } else {
      streak = 0;
      saveWrongAnswer(current);
      selectedButton.classList.add("is-wrong");
      const correctButton = optionsBox.querySelector(`[data-entry-key="${CSS.escape(correctKey)}"]`);
      if (correctButton) correctButton.classList.add("is-correct");
      feedback.textContent = "这次不对，正确答案已经标绿。记住它，再来一题。";
      feedback.className = "quiz-feedback is-wrong";
    }
    optionsBox.querySelectorAll(".quiz-option").forEach((button) => { button.disabled = true; });
    scoreBox.textContent = `${score}`;
    streakBox.textContent = `${streak}`;
    nextButton.disabled = false;
  }

  function speakCurrent() {
    if (!current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(current.en);
    utterance.lang = "en-US";
    utterance.rate = .82;
    window.speechSynthesis.speak(utterance);
  }

  allCheckbox.addEventListener("change", () => {
    categoryList.querySelectorAll("input").forEach((input) => { input.checked = allCheckbox.checked; });
    refreshPoolSize();
  });
  startButton.addEventListener("click", startSession);
  nextButton.addEventListener("click", nextQuestion);
  speakButton.addEventListener("click", speakCurrent);
  modeSelect.addEventListener("change", () => {
    if (deck.length) startSession();
  });

  renderCategoryFilters();
  refreshPoolSize();
  updateWrongBookCount();
  startSession();
})();
