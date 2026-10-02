(function () {
  const KEY = "ieltsWritingLexiconWrongBook";
  const list = document.querySelector("[data-wrongbook-list]");
  const count = document.querySelector("[data-wrongbook-total]");
  const search = document.querySelector("[data-wrongbook-search]");
  const clearButton = document.querySelector("[data-clear-wrongbook]");

  function esc(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function read() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function write(items) {
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch (error) { /* no-op */ }
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = .82;
    window.speechSynthesis.speak(utterance);
  }

  function render() {
    const items = read();
    const needle = (search.value || "").trim().toLowerCase();
    const visible = items.filter((item) => `${item.en} ${item.zh} ${item.category}`.toLowerCase().includes(needle));
    count.textContent = `${items.length} 个词条`;
    if (!visible.length) {
      list.innerHTML = items.length
        ? '<div class="empty">没有匹配的错题。换一个关键词试试。</div>'
        : '<div class="wrongbook-empty"><div class="empty-icon">✓</div><h2>错题本还是空的</h2><p>去拼词测验答几题，答错的表达会自动收进这里。</p><a class="button" href="quiz.html">开始练习 →</a></div>';
      return;
    }
    list.innerHTML = visible.map((item, index) => `
      <article class="wrong-card">
        <div class="wrong-card-top"><span class="wrong-number">${String(index + 1).padStart(2, "0")}</span><span class="wrong-mistakes">错过 ${item.mistakes || 1} 次</span></div>
        <h2>${esc(item.en)}</h2><p class="wrong-translation">${esc(item.zh)}</p>
        <div class="wrong-meta"><span>${esc(item.category || "未分类")}</span><span>${esc((item.sources || []).join(" · "))}</span></div>
        <div class="wrong-actions"><button type="button" data-action="speak" data-key="${esc(item.key)}">🔊 发音</button><button type="button" data-action="mastered" data-key="${esc(item.key)}">已掌握 ✓</button></div>
      </article>`).join("");
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const items = read();
    const item = items.find((entry) => entry.key === button.dataset.key);
    if (!item) return;
    if (button.dataset.action === "speak") {
      speak(item.en);
      return;
    }
    write(items.filter((entry) => entry.key !== button.dataset.key));
    render();
  });

  search.addEventListener("input", render);
  clearButton.addEventListener("click", () => {
    if (!read().length) return;
    if (window.confirm("确定要清空全部错题吗？")) {
      write([]);
      render();
    }
  });
  render();
})();
