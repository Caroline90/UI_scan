(function () {

    if (window.__uiPickerActive) return;
    window.__uiPickerActive = true;

    let pickerEnabled = false;
    let highlightBox = null;
    const pageObjectFields = [];
    const recordedSteps = [];

    const style = document.createElement("style");
    style.innerHTML = `
:root{--bg:#1e1e1e;--panel:#252526;--border:#3c3c3c;--accent:#4f9cff;--text:#e6e6e6;}
#ui-picker-toggle{position:fixed;bottom:20px;right:20px;z-index:2147483647;background:var(--accent);color:white;border:none;padding:12px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.4);}
#ui-picker-panel{position:fixed;top:30px;right:30px;width:560px;height:600px;resize:both;overflow:hidden;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:system-ui;z-index:2147483647;box-shadow:0 10px 30px rgba(0,0,0,.6);}
.picker-header{padding:12px;border-bottom:1px solid var(--border);font-weight:700;font-size:15px;cursor:grab;user-select:none;background:#2d2d2d;flex-shrink:0;}
.picker-tabs{display:flex;border-bottom:1px solid var(--border);position:sticky;flex-shrink:0;}
.picker-tab{flex:1;padding:10px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;transition:.2s;}
.picker-tab:hover{background:#2d2d2d;}
.picker-tab.active{background:var(--accent);color:white;}
.picker-content{padding:14px;flex:1;overflow:auto;min-height:0;}
.section{margin-bottom:14px;}
.label{font-size:12px;opacity:.8;margin-bottom:5px;font-weight:600;}
.field{width:100%;background:#1b1b1b;border:1px solid #444;color:#d4d4d4;padding:10px;border-radius:6px;font-family:Consolas,monospace;font-size:13px;line-height:1.5;white-space:pre;}
select.field{cursor:pointer;}
.action-row{display:flex;gap:8px;flex-wrap:wrap;}
.action-btn{background:#3a3d41;color:#fff;border:1px solid #5a5a5a;border-radius:6px;padding:8px 10px;cursor:pointer;font-size:12px;}
.tree{font-family:Consolas,monospace;font-size:13px;line-height:1.6;background:#1b1b1b;padding:10px;border-radius:6px;height:100%;overflow:scroll;white-space:nowrap;}
.tree-tag{color:#569CD6;font-weight:600;}.tree-attr{color:#CE9178;}.tree-node:hover{background:#2d2d2d;}
.tree-selected{background:#264f78;border-left:4px solid #4f9cff;padding-left:6px;border-radius:4px;font-weight:600;}
.ui-picker-highlight-box{position:fixed;pointer-events:none;border:3px solid var(--accent);background:rgba(79,156,255,.1);z-index:2147483646;}
`;
    document.head.appendChild(style);

    const toggle = document.createElement("button");
    toggle.id = "ui-picker-toggle";
    toggle.textContent = "Enable Picker";
    toggle.onclick = (e) => {
        e.stopPropagation();
        pickerEnabled = !pickerEnabled;
        toggle.textContent = pickerEnabled ? "Disable Picker" : "Enable Picker";
        if (!pickerEnabled) {
            highlightBox?.remove();
            highlightBox = null;
            document.getElementById("ui-picker-panel")?.remove();
        }
    };
    document.body.appendChild(toggle);

    function getEventTarget(event) {
        return event.composedPath?.()[0] || event.target;
    }

    function showHighlight(el) {
        if (!highlightBox) {
            highlightBox = document.createElement("div");
            highlightBox.className = "ui-picker-highlight-box";
            document.body.appendChild(highlightBox);
        }
        const r = el.getBoundingClientRect();
        highlightBox.style.top = r.top + "px";
        highlightBox.style.left = r.left + "px";
        highlightBox.style.width = r.width + "px";
        highlightBox.style.height = r.height + "px";
    }

    function uniqueCss(el) {
        if (el.id) return "#" + CSS.escape(el.id);
        const path = [];
        while (el && el.nodeType === 1) {
            let sel = el.tagName.toLowerCase();
            if (el.classList.length) sel += "." + CSS.escape(el.classList[0]);
            const parent = el.parentNode;
            if (parent?.children) {
                const siblings = [...parent.children].filter(e => e.tagName === el.tagName);
                if (siblings.length > 1) sel += `:nth-of-type(${siblings.indexOf(el) + 1})`;
            }
            path.unshift(sel);
            const full = path.join(" > ");
            try {
                if (document.querySelectorAll(full).length === 1) return full;
            } catch (_) {}
            el = el.parentElement;
        }
        return path.join(" > ");
    }

    function shadowCssPath(el) {
        const segments = [];
        let current = el;
        while (current && current.nodeType === 1) {
            segments.unshift(uniqueCss(current));
            const root = current.getRootNode();
            if (root instanceof ShadowRoot) {
                current = root.host;
                segments.unshift(":shadow-host");
            } else {
                current = current.parentElement;
            }
        }
        return segments.join(" >>> ").replace(/:shadow-host >>> /g, "");
    }

    function escapeXPathString(value) {
        if (!value.includes('"')) return `"${value}"`;
        if (!value.includes("'")) return `'${value}'`;
        const parts = value.split('"').map(part => `"${part}"`);
        return `concat(${parts.join(', "\\\"", ')})`;
    }

    function evalXPathCount(xpath) {
        const doc = document;
        return doc.evaluate(`count(${xpath})`, doc, null, XPathResult.NUMBER_TYPE, null).numberValue;
    }

    function absoluteXPath(el) {
        const path = [];
        while (el && el.nodeType === 1) {
            let i = 1;
            let sib = el.previousSibling;
            while (sib) {
                if (sib.nodeType === 1 && sib.nodeName === el.nodeName) i++;
                sib = sib.previousSibling;
            }
            path.unshift(`${el.nodeName.toLowerCase()}[${i}]`);
            el = el.parentNode;
        }
        return "/" + path.join("/");
    }

    function textBasedXPath(el) {
        const text = el.innerText?.trim().replace(/\s+/g, " ");
        if (text && text.length <= 80) {
            return `//${el.tagName.toLowerCase()}[contains(normalize-space(.), ${escapeXPathString(text.slice(0, 80))})]`;
        }
        return `//${el.tagName.toLowerCase()}[contains(normalize-space(.), "")]`;
    }

    function uniqueXPath(el) {
        const attrs = ["id", "name", "data-testid", "data-test", "data-qa", "aria-label", "title", "placeholder"];
        for (const attr of attrs) {
            const value = el.getAttribute?.(attr);
            if (!value) continue;
            const candidate = `//*[@${attr}=${escapeXPathString(value)}]`;
            if (evalXPathCount(candidate) === 1) return candidate;
        }
        const textCandidate = textBasedXPath(el);
        if (evalXPathCount(textCandidate) >= 1) return textCandidate;
        return absoluteXPath(el);
    }

    function reactLocator(el) {
        const testId = el.getAttribute("data-testid") || el.getAttribute("data-test");
        if (testId) return `page.getByTestId("${testId}")`;
        if (el.getAttribute("aria-label")) return `page.getByLabel("${el.getAttribute("aria-label")}")`;
        return `page.locator("${uniqueCss(el)}")`;
    }

    function angularLocator(el) {
        const byModel = el.getAttribute("formcontrolname") || el.getAttribute("ng-reflect-name");
        if (byModel) return `By.css('[formcontrolname="${byModel}"]')`;
        const ngAttr = [...el.attributes].find(a => a.name.startsWith("ng-reflect-"));
        if (ngAttr) return `By.css('[${ngAttr.name}="${ngAttr.value}"]')`;
        return `By.css('${uniqueCss(el)}')`;
    }

    function attrs(el) {
        return [...el.attributes].map(a => `${a.name}="${a.value}"`).join("\n");
    }

    function domPath(el) {
        const arr = [];
        while (el && el.nodeType === 1) {
            arr.unshift(el.tagName.toLowerCase());
            el = el.parentElement;
        }
        return arr.join(" > ");
    }

    function buildTree(el, selectedEl, depth = 0) {
        const indent = "&nbsp;".repeat(depth * 4);
        const attrsHtml = [...el.attributes]
            .filter(a => !a.name.startsWith("ui-picker"))
            .map(a => ` <span class="tree-attr">${a.name}</span>=<span class="tree-attr">"${a.value}"</span>`)
            .join("");
        const selected = el === selectedEl ? " tree-selected" : "";
        let html = `<div class="tree-node${selected}">${indent}<span class="tree-tag">&lt;${el.tagName.toLowerCase()}</span>${attrsHtml}<span class="tree-tag">&gt;</span></div>`;
        [...el.children].slice(0, 8).forEach(child => html += buildTree(child, selectedEl, depth + 1));
        html += `<div class="tree-node">${indent}<span class="tree-tag">&lt;/${el.tagName.toLowerCase()}&gt;</span></div>`;
        return html;
    }

    function makeDraggable(panel) {
        let dragging = false, offsetX = 0, offsetY = 0;
        panel.addEventListener("mousedown", (e) => {
            if (e.target.closest("textarea,select,button")) return;
            const rect = panel.getBoundingClientRect();
            if (e.clientX > rect.right - 12 || e.clientY > rect.bottom - 12) return;
            dragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.addEventListener("mousemove", movePanel);
            document.addEventListener("mouseup", stopDrag);
        });
        function movePanel(e) { if (dragging) { panel.style.left = (e.clientX - offsetX) + "px"; panel.style.top = (e.clientY - offsetY) + "px"; panel.style.right = "auto"; } }
        function stopDrag() { dragging = false; document.removeEventListener("mousemove", movePanel); document.removeEventListener("mouseup", stopDrag); }
    }

    function copyToClipboard(text) {
        navigator.clipboard?.writeText(text).catch(() => {});
    }

    function exportPageObjectClass() {
        const body = pageObjectFields.length
            ? pageObjectFields.map((f, i) => `    @FindBy(css = "${f.css}")\n    private WebElement ${f.name}${i + 1};`).join("\n\n")
            : "    // No fields recorded yet";
        const code = `public class GeneratedPageObject {\n\n${body}\n\n}`;
        copyToClipboard(code);
        return code;
    }

    function exportRecordedSeleniumTest() {
        const steps = recordedSteps.length
            ? recordedSteps.map((s, idx) => `        // Step ${idx + 1}: ${s}`).join("\n")
            : "        // No recorded steps yet";
        const code = `@Test\npublic void recordedFlow() {\n${steps}\n}`;
        copyToClipboard(code);
        return code;
    }

    function openPanel(el) {
        const css = uniqueCss(el);
        const xpath = uniqueXPath(el);
        const xpathAbsolute = absoluteXPath(el);
        const xpathText = textBasedXPath(el);
        const shadowPath = shadowCssPath(el);

        const id = el.id || "";
        const name = el.getAttribute("name") || "";
        const className = el.classList?.[0] || "";

        const panel = document.createElement("div");
        panel.id = "ui-picker-panel";
        panel.innerHTML = `
<div class="picker-header">Element: ${el.tagName.toLowerCase()}</div>
<div class="picker-tabs">
<div class="picker-tab active" data-tab="loc">Locators</div>
<div class="picker-tab" data-tab="dom">DOM</div>
<div class="picker-tab" data-tab="attr">Attributes</div>
<div class="picker-tab" data-tab="code">Code</div>
</div>
<div class="picker-content" id="loc">
<div class="section"><div class="label">CSS Selector</div><textarea class="field">${css}</textarea></div>
<div class="section"><div class="label">XPath (recommended)</div><textarea class="field">${xpath}</textarea></div>
<div class="section"><div class="label">XPath (text-based)</div><textarea class="field">${xpathText}</textarea></div>
<div class="section"><div class="label">Shadow-DOM path</div><textarea class="field">${shadowPath}</textarea></div>
<div class="section"><div class="label">XPath (absolute)</div><textarea class="field">${xpathAbsolute}</textarea></div>
</div>
<div class="picker-content" id="dom" style="display:none"><div class="tree">${buildTree(document.documentElement, el)}</div></div>
<div class="picker-content" id="attr" style="display:none">
<div class="section"><div class="label">Attributes</div><textarea class="field">${attrs(el)}</textarea></div>
<div class="section"><div class="label">DOM Path</div><textarea class="field">${domPath(el)}</textarea></div>
</div>
<div class="picker-content" id="code" style="display:none">
<div class="section"><div class="label">Snippet Type</div>
<select id="code-type" class="field">
<option value="id">By.id</option><option value="name">By.name</option><option value="css">By.cssSelector</option><option value="class">By.className</option><option value="xpath">By.xpath</option>
<option value="react">React helper</option><option value="angular">Angular helper</option><option value="shadow">Shadow DOM helper</option>
<option value="findby-css">@FindBy(css)</option><option value="click">Click</option><option value="sendkeys">SendKeys</option><option value="wait">WebDriverWait</option><option value="playwright">Playwright</option>
</select></div>
<div class="section"><div class="label">Code</div><textarea class="field" id="code-snippet"></textarea></div>
<div class="section action-row">
<button class="action-btn" id="record-click">Record click step</button>
<button class="action-btn" id="record-send">Record sendKeys step</button>
<button class="action-btn" id="export-po">Export PageObject</button>
<button class="action-btn" id="export-test">Export Selenium test</button>
</div>
</div>`;

        const snippets = {
            id: `driver.findElement(By.id("${id}"));`,
            name: `driver.findElement(By.name("${name}"));`,
            class: `driver.findElement(By.className("${className}"));`,
            css: `driver.findElement(By.cssSelector("${css}"));`,
            xpath: `driver.findElement(By.xpath("${xpath}"));`,
            react: `${reactLocator(el)};`,
            angular: `driver.findElement(${angularLocator(el)});`,
            shadow: `WebElement host = driver.findElement(By.cssSelector("${shadowPath.split(" >>> ")[0] || css}"));\nSearchContext root = host.getShadowRoot();\nWebElement target = root.findElement(By.cssSelector("${css}"));`,
            "findby-css": `@FindBy(css = "${css}")\nprivate WebElement element;`,
            click: `driver.findElement(By.cssSelector("${css}")).click();`,
            sendkeys: `driver.findElement(By.cssSelector("${css}")).sendKeys("text");`,
            wait: `new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("${css}")));`,
            playwright: `const el = page.locator("${css}");`
        };

        const select = panel.querySelector("#code-type");
        const textarea = panel.querySelector("#code-snippet");
        const updateSnippet = () => textarea.value = snippets[select.value] || "";
        select.onchange = updateSnippet;
        updateSnippet();

        panel.querySelector("#record-click").onclick = () => {
            const step = `driver.findElement(By.cssSelector("${css}")).click();`;
            recordedSteps.push(step);
            textarea.value = step;
        };
        panel.querySelector("#record-send").onclick = () => {
            const step = `driver.findElement(By.cssSelector("${css}")).sendKeys("value");`;
            recordedSteps.push(step);
            textarea.value = step;
        };
        panel.querySelector("#export-po").onclick = () => {
            pageObjectFields.push({ name: `${el.tagName.toLowerCase()}Element`, css });
            textarea.value = exportPageObjectClass();
        };
        panel.querySelector("#export-test").onclick = () => {
            textarea.value = exportRecordedSeleniumTest();
        };

        panel.querySelectorAll(".picker-tab").forEach(tab => {
            tab.onclick = () => {
                panel.querySelectorAll(".picker-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                panel.querySelectorAll(".picker-content").forEach(c => c.style.display = "none");
                panel.querySelector("#" + tab.dataset.tab).style.display = "block";
            };
        });

        document.getElementById("ui-picker-panel")?.remove();
        document.body.appendChild(panel);
        makeDraggable(panel);
    }

    document.addEventListener("mouseover", e => {
        if (!pickerEnabled) return;
        const target = getEventTarget(e);
        if (target?.closest?.("#ui-picker-panel") || target?.closest?.("#ui-picker-toggle")) return;
        if (target instanceof Element) showHighlight(target);
    }, true);

    document.addEventListener("mousedown", e => {
        if (!pickerEnabled) return;
        const target = getEventTarget(e);
        if (target?.closest?.("#ui-picker-panel") || target?.closest?.("#ui-picker-toggle")) return;
        if (!(target instanceof Element)) return;
        e.preventDefault();
        e.stopPropagation();
        openPanel(target);
    }, true);
})();
