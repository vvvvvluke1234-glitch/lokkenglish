(function () {
  const decks = window.WORD_PARTS || {};
  const vocab = window.IELTS_MORPHOLOGY || [];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const shuffle = (array) => {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const safe = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

  // Section 1: component decks, with an all-in-one shuffled option.
  const deckLabels = { all: "ALL COMPONENTS 全部混合", prefix: "PREFIX 前綴", root: "ROOT 詞根", base: "BASE 字基", suffix: "SUFFIX 後綴" };
  let activeDeck = "all";
  let cards = [];
  let cardIndex = 0;
  let flipped = false;
  const flashcard = $("[data-flashcard]");
  const front = $("[data-card-front]");
  const answer = $("[data-card-answer]");
  const hint = $("[data-card-hint]");
  const bottom = $("[data-card-bottom]");
  const category = $("[data-card-category]");
  const cardProgress = $("[data-card-progress]");
  const cardNote = $("[data-card-note]");
  const cardFootnote = $("[data-card-footnote]");
  const cardSpeaker = $("[data-speak-card]");
  const revealButton = $("[data-card-reveal]");

  function deckFor(key) {
    if (key === "all") return Object.entries(decks).flatMap(([group, items]) => items.map((item) => ({ ...item, group })));
    return (decks[key] || []).map((item) => ({ ...item, group: key }));
  }

  function renderCard() {
    if (!cards.length) return;
    const item = cards[cardIndex];
    const detail = (window.MORPHEME_CARD_DETAILS || {})[item.term] || {};
    const rootBaseResults = window.ROOT_BASE_CARD_ANALYSIS || {};
    const rootBaseResult = rootBaseResults[`${item.group}:${item.term}`] || rootBaseResults[item.term];
    category.textContent = deckLabels[activeDeck] || deckLabels.all;
    cardProgress.textContent = `${String(cardIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    front.textContent = item.term;
    const formsMarkup = (detail.forms || []).map(([pos, word]) => `<li class="card-word-example"><b>${safe(pos)}</b><span>${safe(word)}</span><button class="example-audio-button" type="button" data-speak-text="${safe(word)}" aria-label="播放 ${safe(word)} 的英式英語發音">🔊</button></li>`).join("");
    const sentence = detail.sentence || "";
    const rootBaseMarkup = (item.group === "root" || item.group === "base")
      ? `<section class="root-base-analysis" aria-label="本卡的 Root 與 Base 判讀">
          <div class="card-detail-heading">Root／Base 判讀與本卡結果</div>
          <p class="root-base-key"><b>Root 詞根</b>：就本卡的分析層次而言，是承載核心意思、不能再拆成更小有意義構詞單位的部分；可獨立成字（plot），也可不能單獨使用（spect-）。<br><b>Base 字基</b>：某一步 prefix／suffix 實際加上的對象；可只是一個 root，也可已含其他構詞成分。Root 和 base 角色不必互斥，要看正在分析哪一步。</p>
          <p class="root-base-result"><b>本卡結果：</b>${safe(rootBaseResult || `${item.example}。${item.note || ""}`)}</p>
        </section>`
      : "";
    answer.innerHTML = `<p class="card-definition"><strong>${safe(item.meaning)}</strong><br>${safe(item.example)}</p>`
      + `<div class="card-detail-heading">不同詞性的例子（按 🔊 聽英音）</div><ul class="card-word-list">${formsMarkup}</ul>`
      + rootBaseMarkup
      + `<div class="card-sentence"><strong>例句：</strong><span class="card-sentence-text">${safe(sentence)}</span><button class="example-audio-button" type="button" data-speak-text="${safe(sentence)}" aria-label="播放例句的英式英語發音">🔊</button></div>`
      + `<p class="card-note-line">構詞提示：${safe(item.note || "")}</p>`;
    answer.hidden = !flipped;
    hint.hidden = flipped;
    bottom.textContent = flipped ? "先認構詞功能，再把構詞部分放回單字理解。" : "按「翻開答案」核對 ↗";
    flashcard.classList.toggle("is-flipped", flipped);
    cardSpeaker.dataset.speakText = detail.audio || (String(item.example).match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || [String(item.term).replace(/[^A-Za-z]/g, "")])[0];
    const specialNote = item.starNote || detail.starNote || "";
    cardFootnote.textContent = specialNote ? `＊特別提醒：${specialNote}` : "";
    cardFootnote.hidden = !flipped || !specialNote;
    revealButton.textContent = flipped ? "收起答案" : "翻開答案";
    cardNote.textContent = flipped ? "看完答案後，試著自己造一個包含這個構詞部分的單字。" : "先用自己的話回想意思，再翻卡檢查。";
  }

  function setDeck(key, shouldShuffle = true) {
    activeDeck = key;
    cards = deckFor(key);
    if (shouldShuffle) cards = shuffle(cards);
    cardIndex = 0;
    flipped = false;
    $$("[data-deck]").forEach((button) => button.classList.toggle("is-active", button.dataset.deck === key));
    renderCard();
  }

  $$("[data-deck]").forEach((button) => {
    const key = button.dataset.deck;
    const count = key === "all" ? Object.values(decks).flat().length : (decks[key] || []).length;
    const countNode = document.querySelector(`[data-count="${key}"]`);
    if (countNode) countNode.textContent = count;
    button.addEventListener("click", () => setDeck(key));
  });
  revealButton.addEventListener("click", () => { flipped = !flipped; renderCard(); });
  $("[data-card-next]").addEventListener("click", () => { cardIndex = (cardIndex + 1) % cards.length; flipped = false; renderCard(); });
  $("[data-card-prev]").addEventListener("click", () => { cardIndex = (cardIndex - 1 + cards.length) % cards.length; flipped = false; renderCard(); });
  $("[data-shuffle-deck]").addEventListener("click", () => setDeck(activeDeck));

  // Section 2: IELTS vocabulary component cloze.
  const fillForm = $("[data-fill-form]");
  const input = $("[data-component-answer]");
  const wordBox = $("[data-fill-word]");
  const meaningBox = $("[data-fill-meaning]");
  const posBox = $("[data-fill-pos]");
  const exampleBox = $("[data-fill-example]");
  const progressBox = $("[data-fill-progress]");
  const partsBox = $("[data-word-parts]");
  const typeBox = $("[data-missing-type]");
  const feedback = $("[data-fill-feedback]");
  const nextWordButton = $("[data-next-word]");
  const scoreBox = $("[data-fill-score]");
  const totalBox = $("[data-fill-total]");
  const streakBox = $("[data-fill-streak]");
  const fullBreakdown = $("[data-full-breakdown]");
  const showBreakdownButton = $("[data-show-breakdown]");
  const typeLabels = { prefix: "PREFIX 前綴", root: "ROOT 詞根", base: "BASE 字基", suffix: "SUFFIX 後綴" };
  let questions = [];
  let fillIndex = 0;
  let currentQuestion = null;
  let hiddenPart = null;
  let fillAnswered = false;
  let fillScore = 0;
  let fillStreak = 0;

  function renderParts(item, missing, reveal = false) {
    return item.parts.map((part, index) => {
      const isMissing = part === missing;
      const text = isMissing && !reveal ? "?" : part.piece;
      const partHtml = isMissing
        ? `<span class="part-blank${reveal ? " revealed" : ""}" aria-label="${isMissing && !reveal ? "待填空" : safe(part.piece)}">${safe(text)}</span>`
        : `<span class="part-chip">${safe(part.piece)}</span>`;
      return `${index ? '<span class="part-plus" aria-hidden="true">+</span>' : ""}${partHtml}`;
    }).join("");
  }

  function updateBreakdown(reveal = false) {
    partsBox.innerHTML = renderParts(currentQuestion, hiddenPart, reveal);
    fullBreakdown.innerHTML = `<strong>完整拆解：</strong> ${currentQuestion.parts.map((part) => safe(part.piece)).join(" + ")}<br><strong>記憶提示：</strong> 前綴常改變方向或否定；詞根／字基帶主要意思；後綴常提示詞性。`
      + `<br><strong>例句：</strong> ${safe(currentQuestion.example)}`;
  }

  function renderQuestion() {
    if (!questions.length) return;
    currentQuestion = questions[fillIndex];
    hiddenPart = currentQuestion.parts[Math.floor(Math.random() * currentQuestion.parts.length)];
    fillAnswered = false;
    wordBox.textContent = currentQuestion.word;
    meaningBox.textContent = currentQuestion.zh;
    posBox.textContent = currentQuestion.pos;
    exampleBox.textContent = currentQuestion.example;
    progressBox.textContent = `WORD ${String(fillIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
    typeBox.textContent = typeLabels[hiddenPart.type] || "COMPONENT 構詞部分";
    input.value = "";
    input.disabled = false;
    input.focus({ preventScroll: true });
    nextWordButton.disabled = true;
    nextWordButton.textContent = fillIndex === questions.length - 1 ? "完成本輪 ✓" : "下一題 →";
    feedback.className = "fill-feedback";
    feedback.innerHTML = '可輸入構詞片段，例如 <code>un-</code>、<code>spect</code> 或 <code>-tion</code>。答案不分大小寫，連字號可省略。';
    fullBreakdown.hidden = true;
    showBreakdownButton.disabled = false;
    updateBreakdown(false);
  }

  function startRound() {
    questions = shuffle(vocab);
    fillIndex = 0;
    fillScore = 0;
    fillStreak = 0;
    delete nextWordButton.dataset.roundComplete;
    scoreBox.textContent = "0";
    totalBox.textContent = String(questions.length);
    streakBox.textContent = "0";
    renderQuestion();
  }

  function normalize(value) {
    return String(value).toLowerCase().trim().replace(/[\s-‐‑‒–—]/g, "");
  }

  fillForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (fillAnswered || !currentQuestion) return;
    const guess = normalize(input.value);
    if (!guess) {
      feedback.textContent = "先輸入你猜的構詞部分，再檢查答案。";
      feedback.className = "fill-feedback is-wrong";
      input.focus();
      return;
    }
    fillAnswered = true;
    input.disabled = true;
    showBreakdownButton.disabled = true;
    nextWordButton.disabled = false;
    updateBreakdown(true);
    fullBreakdown.hidden = false;
    if (guess === normalize(hiddenPart.piece)) {
      fillScore += 1;
      fillStreak += 1;
      feedback.textContent = `答對了！${hiddenPart.piece} 是這個單字的${typeLabels[hiddenPart.type].split(" ")[1]}。`;
      feedback.className = "fill-feedback is-good";
    } else {
      fillStreak = 0;
      feedback.textContent = `再記一次：正確構詞部分是「${hiddenPart.piece}」。注意這題要填的是${typeLabels[hiddenPart.type].split(" ")[1]}。`;
      feedback.className = "fill-feedback is-wrong";
    }
    scoreBox.textContent = String(fillScore);
    streakBox.textContent = String(fillStreak);
  });

  showBreakdownButton.addEventListener("click", () => {
    if (fillAnswered) return;
    fillAnswered = true;
    input.disabled = true;
    nextWordButton.disabled = false;
    showBreakdownButton.disabled = true;
    updateBreakdown(true);
    fullBreakdown.hidden = false;
    feedback.textContent = `完整拆解已顯示：缺少的部分是「${hiddenPart.piece}」。這題不計入答對數。`;
    feedback.className = "fill-feedback";
  });

  nextWordButton.addEventListener("click", () => {
    if (nextWordButton.dataset.roundComplete === "true") {
      startRound();
      return;
    }
    if (fillIndex >= questions.length - 1) {
      nextWordButton.dataset.roundComplete = "true";
      nextWordButton.textContent = "再練一輪 ↻";
      feedback.textContent = `本輪完成：答對 ${fillScore} / ${questions.length} 題。按「再練一輪」重新隨機出題。`;
      feedback.className = "fill-feedback is-good";
      return;
    }
    fillIndex += 1;
    renderQuestion();
  });
  $("[data-new-round]").addEventListener("click", startRound);

  // Browser-native speech synthesis. Prefer a British English voice with a feminine name;
  // use another en-GB voice if the browser does not expose voice gender metadata.
  const voiceStatus = $("[data-voice-status]");
  const femaleHints = /female|victoria|karen|serena|hazel|susan|amy|libby|olivia|sonia|emily|kate|martha|moira|fiona|google uk english female|english united kingdom female/i;
  let selectedVoice = null;
  function selectVoice() {
    if (!window.speechSynthesis) {
      voiceStatus.textContent = "此瀏覽器不支援內建語音播放。可改用 Safari、Chrome 或 Edge。";
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const british = voices.filter((voice) => /^en-GB/i.test(voice.lang));
    selectedVoice = british.find((voice) => femaleHints.test(voice.name)) || british[0] || null;
    if (selectedVoice && femaleHints.test(selectedVoice.name)) {
      voiceStatus.textContent = `目前選用：${selectedVoice.name}（英式英語）。`;
    } else if (selectedVoice) {
      voiceStatus.textContent = `未找到標記為女聲的英音，暫用 ${selectedVoice.name}（英式英語）；聲線由瀏覽器提供。`;
    } else {
      voiceStatus.textContent = "裝置未提供英式語音；播放時會請系統以 en-GB 發音，實際聲線依裝置而定。";
    }
  }
  if (window.speechSynthesis) {
    selectVoice();
    window.speechSynthesis.addEventListener("voiceschanged", selectVoice);
  }
  function playSpeech(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.86;
    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak-text]");
    if (button) playSpeech(button.dataset.speakText);
  });
  $("[data-speak-word]").addEventListener("click", () => {
    if (currentQuestion) playSpeech(currentQuestion.word);
  });
  $("[data-speak-example]").addEventListener("click", () => {
    if (currentQuestion) playSpeech(currentQuestion.example);
  });

  totalBox.textContent = String(vocab.length);
  setDeck("all");
  startRound();
})();
