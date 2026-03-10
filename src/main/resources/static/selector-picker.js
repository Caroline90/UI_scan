(function () {

    if (window.__uiPickerActive) return;
    window.__uiPickerActive = true;

    /* =========================
       STATE
    ========================= */

    let pickerEnabled = false;
    const hostDocument = document;
    const highlightBoxes = new WeakMap();
    const trackedDocuments = new Set();


    /* =========================
       STYLES
    ========================= */

    const style = document.createElement("style");

    style.innerHTML = `

:root{
    --bg:#1e1e1e;
    --panel:#252526;
    --border:#3c3c3c;
    --accent:#4f9cff;
    --text:#e6e6e6;
    --green:#6A9955;
    --blue:#569CD6;
    --orange:#CE9178;
    --yellow:#DCDCAA;
}

/* =========================
   PICKER BUTTON
========================= */

#ui-picker-toggle{
    position:fixed;
    bottom:20px;
    right:20px;
    z-index:2147483647;

    background:var(--accent);
    color:white;

    border:none;
    padding:12px 16px;
    border-radius:6px;

    cursor:pointer;

    font-size:14px;
    font-weight:600;

    box-shadow:0 4px 12px rgba(0,0,0,0.4);
}

/* =========================
   PANEL
========================= */

    #ui-picker-panel{
    position:fixed;
    top:30px;
    right:30px;
    
    width:520px;
    height:520px;
    
    resize:both;
    overflow:hidden;   /* important */
    
    display:flex;
    flex-direction:column;
    
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:10px;
    
    color:var(--text);
    font-family:system-ui;
    
    z-index:2147483647;
    
    box-shadow:0 10px 30px rgba(0,0,0,.6);
}

/* =========================
   HEADER
========================= */

.picker-header{
    padding:12px;

    border-bottom:1px solid var(--border);

    font-weight:700;
    font-size:15px;

    cursor:grab;
    user-select:none;

    background:#2d2d2d;
}

.picker-header:active{
    cursor:grabbing;
}

/* =========================
   TABS
========================= */

.picker-tabs{
display:flex;
border-bottom:1px solid var(--border);
position:sticky;
flex-shrink:0;
}

.picker-header{
flex-shrink:0;
}

.picker-tab{
    flex:1;
    padding:10px;

    text-align:center;
    cursor:pointer;

    font-size:13px;
    font-weight:600;

    transition:.2s;
}

.picker-tab:hover{
    background:#2d2d2d;
}

.picker-tab.active{
    background:var(--accent);
    color:white;
}

/* =========================
   CONTENT
========================= */

.picker-content{
    padding:14px;

    flex:1;
    overflow:hidden;
    min-height:0;
}
/* =========================
   SECTIONS
========================= */

.section{
    margin-bottom:14px;
}

.label{
    font-size:12px;
    opacity:.8;
    margin-bottom:5px;
    font-weight:600;
}

/* =========================
   TEXTAREAS
========================= */

.field{
    width:100%;

    background:#1b1b1b;
    border:1px solid #444;

    color:#d4d4d4;

    padding:10px;
    border-radius:6px;

    font-family:Consolas,monospace;
    font-size:14px;

    line-height:1.5;

    white-space:pre;
}

/* dropdown */

select.field{
    cursor:pointer;
}

/* =========================
   DOM TREE
========================= */

.tree{
    font-family:Consolas,monospace;
    font-size:13px;
    line-height:1.6;

    background:#1b1b1b;
    padding:10px;

    border-radius:6px;

    height:100%;
    overflow:scroll;

    white-space:nowrap;

    scrollbar-gutter:stable both-edges;
}

.tree-toggle{
    cursor:pointer;
    color:var(--text);
    user-select:none;
}

.tree-children{
    margin-left:16px;
    display:none;
}

.tree-children.expanded{
    display:block;
}

.tree-node{
    white-space:nowrap;
}

.tree-tag{
    color:#569CD6;
    font-weight:600;
}

.tree-attr{
    color:#CE9178;
}

.tree-node:hover{
    background:#2d2d2d;
}

.tree::-webkit-scrollbar{
    height:10px;
    width:10px;
}

.tree::-webkit-scrollbar-thumb{
    background:#555;
    border-radius:6px;
}

.tree::-webkit-scrollbar-thumb:hover{
    background:#777;
}

/* selected DOM element */

.tree-selected{
    background:#264f78;
    border-left:4px solid #4f9cff;
    padding-left:6px;
    border-radius:4px;

    font-weight:600;
}

.tree-selected .tree-tag{
    color:#ffffff;
}

.tree-selected::before{
    content:"▶";
    color:#4f9cff;
    margin-right:6px;
}

/* =========================
   PAGE HIGHLIGHT
========================= */

.ui-picker-highlight-box{
    position:fixed;
    pointer-events:none;

    border:3px solid var(--accent);
    background:rgba(79,156,255,.1);

    z-index:2147483646;
}

`;

    document.head.appendChild(style);

    /* =========================
       TOGGLE BUTTON
    ========================= */

    const toggle = document.createElement("button");

    toggle.id = "ui-picker-toggle";
    toggle.textContent = "Enable Picker";

    toggle.onclick = (e) => {

        e.stopPropagation();

        pickerEnabled = !pickerEnabled;

        toggle.textContent =
            pickerEnabled ? "Disable Picker" : "Enable Picker";

        if (!pickerEnabled) {

            trackedDocuments.forEach(doc => {
                const box = highlightBoxes.get(doc);
                box?.remove();
            });

            hostDocument.getElementById("ui-picker-panel")?.remove();
        }
    };

    document.body.appendChild(toggle);

    /* =========================
       HIGHLIGHT ELEMENT
    ========================= */

    function getHighlightBox(doc) {

        let box = highlightBoxes.get(doc);

        if (box?.isConnected) return box;

        box = doc.createElement("div");
        box.style.position = "fixed";
        box.style.pointerEvents = "none";
        box.style.border = "3px solid #4f9cff";
        box.style.background = "rgba(79,156,255,.1)";
        box.style.zIndex = "2147483646";

        (doc.body || doc.documentElement)?.appendChild(box);
        highlightBoxes.set(doc, box);

        return box;
    }

    function showHighlight(el) {

        const doc = el.ownerDocument;
        const box = getHighlightBox(doc);
        const r = el.getBoundingClientRect();

        if (!r.width && !r.height) return;

        box.style.top = r.top + "px";
        box.style.left = r.left + "px";
        box.style.width = r.width + "px";
        box.style.height = r.height + "px";
    }

    function hideHighlight(doc) {

        const box = highlightBoxes.get(doc);
        if (!box) return;

        box.style.width = "0px";
        box.style.height = "0px";
    }

    /* =========================
       CSS LOCATOR
    ========================= */

    function uniqueCss(el, doc = el.ownerDocument) {

        if (el.id) return "#" + CSS.escape(el.id);

        let path = [];

        while (el && el.nodeType === 1) {

            let sel = el.tagName.toLowerCase();

            if (el.classList.length)
                sel += "." + el.classList[0];

            const siblings = [...el.parentNode.children]
                .filter(e => e.tagName === el.tagName);

            if (siblings.length > 1)
                sel += `:nth-of-type(${siblings.indexOf(el) + 1})`;

            path.unshift(sel);

            const full = path.join(" > ");

            if (doc.querySelectorAll(full).length === 1)
                return full;

            el = el.parentElement;
        }

        return path.join(" > ");
    }

    function isUniqueCss(selector, doc = hostDocument) {

        if (!selector) return false;

        try {
            return doc.querySelectorAll(selector).length === 1;
        } catch {
            return false;
        }
    }

    /* =========================
       XPATH
    ========================= */

    function escapeXPathString(value) {

        if (!value.includes('"')) return `"${value}"`;

        if (!value.includes("'")) return `'${value}'`;

        const parts = value.split('"').map(part => `"${part}"`);
        return `concat(${parts.join(', "\\"", ')})`;
    }

    function countXPathMatches(xpath, doc = hostDocument) {

        try {
            return doc.evaluate(
                `count(${xpath})`,
                doc,
                null,
                XPathResult.NUMBER_TYPE,
                null
            ).numberValue;
        } catch {
            return 0;
        }
    }

    function isUniqueXPath(xpath, doc = hostDocument) {
        return countXPathMatches(xpath, doc) === 1;
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

    function uniqueXPath(el, doc = el.ownerDocument) {

        const attrPriority = [
            "id",
            "name",
            "data-testid",
            "data-test",
            "data-qa",
            "aria-label",
            "title",
            "placeholder",
            "type",
            "value"
        ];

        for (const attr of attrPriority) {

            const value = el.getAttribute?.(attr);

            if (!value) continue;

            const candidate = `//*[@${attr}=${escapeXPathString(value)}]`;

            if (isUniqueXPath(candidate, doc)) return candidate;

            const tagCandidate = `//${el.tagName.toLowerCase()}[@${attr}=${escapeXPathString(value)}]`;

            if (isUniqueXPath(tagCandidate, doc)) return tagCandidate;
        }

        const text = el.textContent?.trim().replace(/\s+/g, " ");

        if (text && text.length <= 50) {

            const textCandidate = `//${el.tagName.toLowerCase()}[normalize-space()=${escapeXPathString(text)}]`;

            if (isUniqueXPath(textCandidate, doc)) return textCandidate;
        }

        const classes = [...el.classList].filter(Boolean);

        if (classes.length) {

            const classCandidate = `//${el.tagName.toLowerCase()}[contains(concat(' ', normalize-space(@class), ' '), ' ${classes[0]} ')]`;

            if (isUniqueXPath(classCandidate, doc)) return classCandidate;
        }

        const fullPath = absoluteXPath(el);

        if (isUniqueXPath(fullPath, doc)) {

            const segments = fullPath.slice(1).split("/");

            for (let i = 0; i < segments.length; i++) {

                const shorterCandidate = `//${segments.slice(i).join("/")}`;

                if (isUniqueXPath(shorterCandidate, doc)) return shorterCandidate;
            }
        }

        return fullPath;
    }

    /* =========================
       DOM TREE
    ========================= */

    const MAX_TREE_NODES = 1500;

    function buildTree(el, selectedEl, options = {}, depth = 0, state = {count: 0, truncated: false}) {

        if (state.count >= (options.maxNodes || MAX_TREE_NODES)) {
            state.truncated = true;
            return "";
        }

        state.count++;

        let attrs = "";

        for (const a of el.attributes) {

            if (a.name.startsWith("ui-picker")) continue;

            attrs += ` <span class="tree-attr">${a.name}</span>=<span class="tree-attr">"${a.value}"</span>`;
        }

        const selected = el === selectedEl ? " tree-selected" : "";
        const children = [...el.children];
        const hasChildren = children.length > 0;
        const expanded = depth < 2 || el.contains(selectedEl) ? "expanded" : "";
        const marker = hasChildren ? (expanded ? "▼" : "▶") : "•";

        let html = `
<div class="tree-node${selected}" data-node-id="${depth}-${el.tagName}-${children.length}-${selected}">
<span class="tree-toggle" data-toggle="${hasChildren ? "1" : "0"}">${marker}</span>
<span class="tree-tag">&lt;${el.tagName.toLowerCase()}</span>${attrs}<span class="tree-tag">&gt;</span>
</div>
`;

        if (hasChildren) {

            html += `<div class="tree-children ${expanded}">`;

            children.forEach(child => {
                html += buildTree(child, selectedEl, options, depth + 1, state);
            });

            html += `</div>`;
        }

        return html;
    }

    function getLocatorCandidates(el, doc = el.ownerDocument) {

        const cssAttributeSelector = (attr, value) => {

            if (!value) return "";

            const escaped = CSS.escape(value);
            return `[${attr}="${escaped}"]`;
        };

        const dataTestId = el.getAttribute("data-testid") || "";
        const id = el.id || "";
        const name = el.getAttribute("name") || "";
        const placeholder = el.getAttribute("placeholder") || "";
        const css = uniqueCss(el, doc);
        const xpath = uniqueXPath(el, doc);

        return [
            {
                key: "data-testid",
                label: "Data Test ID",
                value: cssAttributeSelector("data-testid", dataTestId),
                unique: dataTestId ? isUniqueCss(cssAttributeSelector("data-testid", dataTestId), doc) : false
            },
            {
                key: "id",
                label: "ID",
                value: id ? `#${CSS.escape(id)}` : "",
                unique: id ? isUniqueCss(`#${CSS.escape(id)}`, doc) : false
            },
            {
                key: "name",
                label: "Name",
                value: cssAttributeSelector("name", name),
                unique: name ? isUniqueCss(cssAttributeSelector("name", name), doc) : false
            },
            {
                key: "placeholder",
                label: "Placeholder",
                value: cssAttributeSelector("placeholder", placeholder),
                unique: placeholder ? isUniqueCss(cssAttributeSelector("placeholder", placeholder), doc) : false
            },
            {
                key: "css",
                label: "CSS Selector",
                value: css,
                unique: isUniqueCss(css, doc)
            },
            {
                key: "xpath",
                label: "XPath",
                value: xpath,
                unique: isUniqueXPath(xpath, doc)
            }
        ];
    }

    function recommendedLocator(el, doc = el.ownerDocument) {

        const ranked = getLocatorCandidates(el, doc);
        return ranked.find(candidate => candidate.value && candidate.unique)
            || ranked.find(candidate => candidate.value)
            || ranked[ranked.length - 1];
    }

    /* =========================
       DRAG PANEL
    ========================= */

    function makeDraggable(panel){

        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        panel.addEventListener("mousedown", (e) => {

            /* prevent dragging while interacting with inputs */
            if (
                e.target.closest("textarea") ||
                e.target.closest("select") ||
                e.target.closest("button")
            ) return;

            /* prevent dragging when resizing */
            const rect = panel.getBoundingClientRect();

            const resizeMargin = 12;

            const onRightEdge = e.clientX > rect.right - resizeMargin;
            const onBottomEdge = e.clientY > rect.bottom - resizeMargin;

            if (onRightEdge || onBottomEdge) return;

            dragging = true;

            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;

            panel.style.cursor = "grabbing";

            document.addEventListener("mousemove", movePanel);
            document.addEventListener("mouseup", stopDrag);
        });

        function movePanel(e){

            if(!dragging) return;

            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";

            panel.style.right = "auto";
        }

        function stopDrag(){

            dragging = false;

            panel.style.cursor = "grab";

            document.removeEventListener("mousemove", movePanel);
            document.removeEventListener("mouseup", stopDrag);
        }
    }

    /* =========================
       HELPERS
    ========================= */

    function attrs(el) {
        return [...el.attributes]
            .map(a => `${a.name}="${a.value}"`)
            .join("\n");
    }

    function semanticContext(el) {

        const lines = [];
        const role = el.getAttribute("role") || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        const type = el.getAttribute("type") || "";
        const placeholder = el.getAttribute("placeholder") || "";
        const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);

        if (role) lines.push(`role: ${role}`);
        if (ariaLabel) lines.push(`aria-label: ${ariaLabel}`);
        if (type) lines.push(`type: ${type}`);
        if (placeholder) lines.push(`placeholder: ${placeholder}`);
        if (text) lines.push(`visible text: ${text}`);

        const rect = el.getBoundingClientRect();
        lines.push(`position: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}`);
        lines.push(`size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);

        return lines.join("\n") || "No semantic context available";
    }

    function field(label, val) {

        return `
<div class="section">
<div class="label">${label}</div>
<textarea class="field">${val}</textarea>
</div>
`;
    }

    function getFrameChain(el) {

        const chain = [];
        let currentWindow = el.ownerDocument.defaultView;

        while (currentWindow && currentWindow !== window.top) {

            const frameEl = currentWindow.frameElement;
            if (!frameEl) break;

            const selector = uniqueCss(frameEl, frameEl.ownerDocument);
            chain.unshift(selector);
            currentWindow = frameEl.ownerDocument.defaultView;
        }

        return chain;
    }

    function toPlaywrightFrameLocator(frameChain, selector) {

        if (!frameChain.length) return `page.locator("${selector}")`;

        const framePart = frameChain.map(path => `.frameLocator("${path}")`).join("");
        return `page${framePart}.locator("${selector}")`;
    }

    /* =========================
       PANEL
    ========================= */

    function openPanel(el) {

        const sourceDoc = el.ownerDocument;
        const frameChain = getFrameChain(el);
        const framePathText = frameChain.length ? frameChain.join("\n") : "Top document";

        const css = uniqueCss(el, sourceDoc);
        const xpath = uniqueXPath(el, sourceDoc);
        const xpathAbsolute = absoluteXPath(el);
        const recommended = recommendedLocator(el, sourceDoc);
        const rankedLocators = getLocatorCandidates(el, sourceDoc);

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
${field(`Recommended Locator (${recommended.key})`, recommended.value)}
${field("Locator Uniqueness Check", rankedLocators
            .map(l => `${l.label}: ${l.value || "N/A"} ${l.unique ? "✅ unique" : "❌ not unique"}`)
            .join("\n"))}
${field("CSS Selector", css)}
${field("XPath (recommended)", xpath)}
${field("XPath (absolute)", xpathAbsolute)}
${field("Frame Path", framePathText)}
</div>

<div class="picker-content" id="dom" style="display:none">
<div class="tree" id="dom-tree" data-loaded="0">Loading DOM tree…</div>
</div>

<div class="picker-content" id="attr" style="display:none">
${field("Attributes", attrs(el))}
${field("Semantic Context", semanticContext(el))}
</div>

<div class="picker-content" id="code" style="display:none">

<div class="section">
<div class="label">Snippet Type</div>

<select id="code-type" class="field">
<option value="id">By.id</option>
<option value="name">By.name</option>
<option value="css">By.cssSelector</option>
<option value="class">By.className</option>
<option value="xpath">By.xpath</option>
<option value="findby-id">@FindBy(id)</option>
<option value="findby-name">@FindBy(name)</option>
<option value="findby-css">@FindBy(css)</option>
<option value="findby-class">@FindBy(className)</option>
<option value="findby-xpath">@FindBy(xpath)</option>
<option value="click">Click</option>
<option value="sendkeys">SendKeys</option>
<option value="wait">WebDriverWait</option>
<option value="playwright">Playwright</option>
<option value="cypress">Cypress</option>
</select>
</div>

<div class="section">
<div class="label">Code</div>
<textarea class="field" id="code-snippet"></textarea>
</div>

</div>
`;

        const snippets = {

            id: `driver.findElement(By.id("${id}"));`,
            name: `driver.findElement(By.name("${name}"));`,
            class: `driver.findElement(By.className("${className}"));`,
            css: `driver.findElement(By.cssSelector("${css}"));`,
            xpath: `driver.findElement(By.xpath("${xpath}"));`,

            "findby-id": `@FindBy(id = "${id}")\nprivate WebElement element;`,
            "findby-name": `@FindBy(name = "${name}")\nprivate WebElement element;`,
            "findby-css": `@FindBy(css = "${css}")\nprivate WebElement element;`,
            "findby-class": `@FindBy(className = "${className}")\nprivate WebElement element;`,
            "findby-xpath": `@FindBy(xpath = "${xpath}")\nprivate WebElement element;`,

            click: `driver.findElement(By.cssSelector("${css}")).click();`,
            sendkeys: `driver.findElement(By.cssSelector("${css}")).sendKeys("text");`,

            wait: `new WebDriverWait(driver, Duration.ofSeconds(10))
.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("${css}")));`,

            playwright: `const el = ${toPlaywrightFrameLocator(frameChain, css)};`,
            cypress: `cy.get("${recommended.value || css}").should("be.visible");`
        };

        const select = panel.querySelector("#code-type");
        const textarea = panel.querySelector("#code-snippet");

        function updateSnippet() {
            textarea.value = snippets[select.value] || "";
        }

        select.onchange = updateSnippet;
        updateSnippet();

        const domTree = panel.querySelector("#dom-tree");

        function renderDomTreeIfNeeded() {

            if (!domTree || domTree.dataset.loaded === "1") return;

            const state = {count: 0, truncated: false};
            const treeHtml = buildTree(sourceDoc.documentElement, el, {maxNodes: MAX_TREE_NODES}, 0, state);
            const note = state.truncated
                ? `<div class="tree-node">⚠ DOM tree truncated to ${MAX_TREE_NODES} nodes to keep picker responsive.</div>`
                : "";

            domTree.innerHTML = note + treeHtml;
            domTree.dataset.loaded = "1";

            domTree.querySelectorAll(".tree-toggle[data-toggle='1']").forEach(toggleBtn => {

                toggleBtn.addEventListener("click", () => {

                    const node = toggleBtn.closest(".tree-node");
                    const children = node?.nextElementSibling;

                    if (!children || !children.classList.contains("tree-children")) return;

                    const isExpanded = children.classList.toggle("expanded");
                    toggleBtn.textContent = isExpanded ? "▼" : "▶";
                });
            });
        }

        panel.querySelectorAll(".picker-tab").forEach(tab => {

            tab.onclick = () => {

                panel.querySelectorAll(".picker-tab")
                    .forEach(t => t.classList.remove("active"));

                tab.classList.add("active");

                panel.querySelectorAll(".picker-content")
                    .forEach(c => c.style.display = "none");

                panel.querySelector("#" + tab.dataset.tab)
                    .style.display = "block";

                if (tab.dataset.tab === "dom") renderDomTreeIfNeeded();
            };
        });

        hostDocument.getElementById("ui-picker-panel")?.remove();
        hostDocument.body.appendChild(panel);

        setTimeout(() => {

            renderDomTreeIfNeeded();

            const selectedNode = panel.querySelector(".tree-selected");

            if (selectedNode) {
                selectedNode.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        }, 50);

        makeDraggable(panel);

        if (panel.querySelector(".picker-tab.active")?.dataset.tab === "dom") {
            renderDomTreeIfNeeded();
        }
    }

    /* =========================
       EVENTS
    ========================= */

    function shouldIgnoreTarget(target) {
        return !!(
            target.closest("#ui-picker-panel") ||
            target.closest("#ui-picker-toggle")
        );
    }

    function toElement(target) {

        if (target instanceof Element) return target;
        return target?.parentElement || null;
    }

    function registerDocument(targetDocument) {

        if (!targetDocument || trackedDocuments.has(targetDocument)) return;

        trackedDocuments.add(targetDocument);

        const onPointerMove = e => {

            if (!pickerEnabled) return;

            const target = toElement(e.target);
            if (!target) return;
            if (shouldIgnoreTarget(target)) return;

            showHighlight(target);
        };

        targetDocument.addEventListener("mouseover", onPointerMove);
        targetDocument.addEventListener("mousemove", onPointerMove);

        targetDocument.addEventListener("mouseleave", () => {

            if (!pickerEnabled) return;
            hideHighlight(targetDocument);
        });

        targetDocument.addEventListener("mousedown", e => {

            if (!pickerEnabled) return;

            const target = toElement(e.target);
            if (!target) return;
            if (shouldIgnoreTarget(target)) return;

            e.preventDefault();
            e.stopPropagation();

            openPanel(target);

        }, true);

        targetDocument.querySelectorAll("iframe, frame").forEach(registerFrame);

        const observer = new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;

                    if (node.matches("iframe, frame")) registerFrame(node);
                    node.querySelectorAll?.("iframe, frame").forEach(registerFrame);
                });
            });
        });

        observer.observe(targetDocument.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function registerFrame(frameEl) {

        frameEl.addEventListener("load", () => {
            try {
                registerDocument(frameEl.contentDocument);
            } catch (_) {
                // Cross-origin iframe is not accessible for DOM inspection.
            }
        });

        try {
            registerDocument(frameEl.contentDocument);
        } catch (_) {
            // Cross-origin iframe is not accessible for DOM inspection.
        }
    }

    registerDocument(hostDocument);

})();
