(function () {
  const data = window.LEXICON_DATA || {};
  const sourceShort = {
    "万能逻辑链": "逻辑链",
    "精简版高频词汇": "高频词汇",
    "写作词汇素材": "Collocations"
  };

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  const slug = window.CURRENT_CATEGORY;
  if (!slug || !data[slug]) return;

  const entries = data[slug].entries || [];
  const grid = document.querySelector("[data-entry-grid]");
  const search = document.querySelector("[data-search]");
  const count = document.querySelector("[data-result-count]");
  const topicInput = document.querySelector("[data-topic]");
  const angleInput = document.querySelector("[data-angle]");
  const generateButton = document.querySelector("[data-generate]");
  const copyButton = document.querySelector("[data-copy]");
  const paragraphOutput = document.querySelector("[data-studio-paragraph]");
  const phraseOutput = document.querySelector("[data-studio-phrases]");
  let generation = 0;

  function render(query) {
    const needle = query.trim().toLowerCase();
    const visible = entries.filter((entry) => {
      return !needle || `${entry.en} ${entry.zh} ${entry.sources.join(" ")}`.toLowerCase().includes(needle);
    });
    count.textContent = `${visible.length} / ${entries.length} entries`;
    if (!visible.length) {
      grid.innerHTML = '<div class="empty">没有匹配的词条。换一个关键词试试。</div>';
      return;
    }
    grid.innerHTML = visible.map((entry) => `
      <article class="entry-card">
        <div><div class="entry-top"><span class="entry-index">${esc(entry.id)}</span></div>
        <h3>${esc(entry.en)}</h3><p>${esc(entry.zh)}</p></div>
        <div class="source-row">${entry.sources.map((source) => `<span class="source">${esc(sourceShort[source] || source)}</span>`).join("")}</div>
      </article>`).join("");
  }

  search.addEventListener("input", () => render(search.value));
  render("");

  if (!topicInput || !angleInput || !generateButton || !paragraphOutput || !phraseOutput) return;

  const verbStart = /^(boost|promote|improve|enhance|develop|reduce|increase|provide|create|support|protect|foster|encourage|maintain|expand|raise|balance|cultivate|acquire|obtain|meet|achieve|realize|fulfill|keep|stand up|take|make|give|pay|avoid|prevent|cause|lead|result|exert|lay|overcome|accelerate|optimize|stimulate|narrow|widen|decrease|safeguard|ensure|stabilize|enact|strengthen|broaden|facilitate|contribute|preserve|carry|adhere|remove|attract|enrich|nurture|arouse|satiate|seclude|explore|learn|think|evaluate|draw|adapt|shoulder|undertake|seek|display|define|accumulate|master|work|have access|be |to )/i;
  const adjectiveStart = /^(competitive|creative|practical|philosophical|original|physical|emotional|psychological|stimulating|versatile|theoretical|comprehensive|solid|vocational|quality|student-oriented|mainstream|popular|famous|objective|subjective|misleading|trustworthy|informative|entertaining|responsible|influential|enjoyable|fashionable|isolated|unimaginative|unsociable|irresistible|reliable|tempting|edifying|instructive|abstract|concrete|refreshing|exotic|ambitious|adaptable|flexible|promising|bright|decent|challenging|ideal|inspiring|advanced|sustainable|environmentally-friendly|energy-saving|ridiculous|absurd|unprecedented|soaring|disastrous|potential|radical|independent|breathtaking|unhealthy|over-commercialized|short-sighted|overcrowded|available|beneficial|positive|negative|labor-consuming|time-consuming|artificial|dominant|endangered|cruel|humane|equal|valid|relevant|social|cultural|critical|high|low|serious|rapid|modern|better|good|poor)/i;

  function sourcePriority(entry) {
    if (entry.sources.includes("写作词汇素材")) return 0;
    if (entry.sources.includes("万能逻辑链")) return 1;
    return 2;
  }

  function pickPool(test, fallback) {
    const primary = entries.filter(test).sort((a, b) => sourcePriority(a) - sourcePriority(b));
    return primary.length ? primary : fallback;
  }

  function take(pool, offset) {
    return pool[(generation * 3 + offset) % pool.length];
  }

  function isVerb(entry) {
    return verbStart.test(entry.en.trim());
  }

  function isAdjective(entry) {
    return adjectiveStart.test(entry.en.trim());
  }

  function isAction(entry) {
    const phrase = entry.en.trim().toLowerCase();
    return isVerb(entry) && !/^(be |to |have access|be closely related|be disadvantageous|be deeply impressed|be exposed|be attributed)/i.test(phrase);
  }

  function verbCore(entry) {
    const variants = entry.en.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
    const score = (part) => {
      const words = part.split(/\s+/).length;
      const incomplete = /\b(to|of|for|with|on|at|in|about|from)$/i.test(part) ? 2 : 0;
      const articleOnly = /^(a|an|the)\s+\S+$/i.test(part) ? 1 : 0;
      return words - incomplete - articleOnly;
    };
    const phrase = variants.reduce((best, part) => score(part) >= score(best) ? part : best, variants[0] || entry.en).trim();
    return phrase.toLowerCase().startsWith("to ") ? phrase.slice(3) : phrase;
  }

  function isNounPhrase(entry) {
    return !isVerb(entry) && !isAdjective(entry) && entry.en.trim().split(/\s+/).length >= 2;
  }

  function canUse(entry) {
    if (isVerb(entry)) return `can ${verbCore(entry)}`;
    if (isAdjective(entry)) return `can be ${entry.en}`;
    return `can contribute to ${entry.en}`;
  }

  function actionUse(entry) {
    if (isVerb(entry)) return verbCore(entry);
    if (isAdjective(entry)) return `be ${entry.en}`;
    return `support ${entry.en}`;
  }

  function relatedUse(entry) {
    if (isVerb(entry)) return `the need to ${entry.en}`;
    if (isAdjective(entry)) return `a ${entry.en} approach`;
    return entry.en;
  }

  function highlight(entry) {
    return `<mark>${esc(entry.en)}</mark>`;
  }

  function generateParagraph() {
    generation += 1;
    const topic = topicInput.value.trim() || `the role of ${data[slug].en.toLowerCase()} in modern society`;
    const angle = angleInput.value;
    const fallback = entries;
    const verbs = pickPool(isAction, pickPool(isVerb, fallback));
    const nouns = pickPool(isNounPhrase, pickPool((entry) => !isVerb(entry) && !isAdjective(entry), fallback));
    const a = take(verbs, 1);
    const b = take(nouns, 2);
    const c = take(verbs, 3);
    const d = take(nouns, 4);
    const e = take(verbs, 5);
    const opening = angle === "concern"
      ? `the main concern is how it may affect ${highlight(b)}`
      : angle === "balanced"
        ? `a balanced view should connect ${highlight(b)} with its wider effects`
        : `the strongest argument is that it creates room for ${highlight(b)}`;
    const pivot = angle === "concern"
      ? "Nevertheless, the issue should not be discussed only in negative terms."
      : angle === "balanced"
        ? "At the same time, a convincing IELTS paragraph should acknowledge the trade-off."
        : "This advantage, however, is meaningful only when the wider consequences are considered.";
    paragraphOutput.innerHTML = `When discussing <strong>${esc(topic)}</strong>, ${opening}. In practice, this can be reinforced when institutions ${actionUse(c)}, while individuals and policymakers can also ${actionUse(a)}. ${pivot} A realistic concern is whether the change will raise questions about ${highlight(d)} and make it harder to ${actionUse(e)}. Therefore, the most convincing position is to ${actionUse(e)} while keeping ${highlight(b)} in view.`;
    phraseOutput.innerHTML = [a, b, c, d, e].map((entry) => `<span class="studio-phrase"><b>${esc(entry.en)}</b><small>${esc(entry.zh)}</small></span>`).join("");
    if (copyButton) copyButton.textContent = "复制段落";
  }

  generateButton.addEventListener("click", generateParagraph);
  angleInput.addEventListener("change", generateParagraph);
  topicInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") generateParagraph();
  });
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const plain = paragraphOutput.textContent;
      try {
        await navigator.clipboard.writeText(plain);
        copyButton.textContent = "已复制 ✓";
        setTimeout(() => { copyButton.textContent = "复制段落"; }, 1600);
      } catch (error) {
        copyButton.textContent = "请手动选取";
      }
    });
  }
  generateParagraph();
})();
