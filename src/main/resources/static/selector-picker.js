(function () {

    if (window.__uiPickerActive) return;
    window.__uiPickerActive = true;

    /* =========================
       STATE
    ========================= */

    let pickerEnabled = false;
    let highlightBox = null;

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

            highlightBox?.remove();
            highlightBox = null;

            document.getElementById("ui-picker-panel")?.remove();
        }
    };

    document.body.appendChild(toggle);

    /* =========================
       HIGHLIGHT ELEMENT
    ========================= */

    function showHighlight(el) {

        if (!highlightBox) {

            highlightBox = document.createElement("div");

            highlightBox.style.position = "fixed";
            highlightBox.style.pointerEvents = "none";
            highlightBox.style.border = "3px solid #4f9cff";
            highlightBox.style.zIndex = "2147483646";

            document.body.appendChild(highlightBox);
        }

        const r = el.getBoundingClientRect();

        highlightBox.style.top = r.top + "px";
        highlightBox.style.left = r.left + "px";
        highlightBox.style.width = r.width + "px";
        highlightBox.style.height = r.height + "px";
    }

    /* =========================
       CSS LOCATOR
    ========================= */

    function uniqueCss(el) {

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

            if (document.querySelectorAll(full).length === 1)
                return full;

            el = el.parentElement;
        }

        return path.join(" > ");
    }

    /* =========================
       XPATH
    ========================= */

    function uniqueXPath(el) {

        if (el.id) return `//*[@id="${el.id}"]`;

        let path = [];

        while (el && el.nodeType === 1) {

            let i = 1;
            let sib = el.previousSibling;

            while (sib) {

                if (sib.nodeType === 1 && sib.nodeName === el.nodeName)
                    i++;

                sib = sib.previousSibling;
            }

            path.unshift(`${el.nodeName.toLowerCase()}[${i}]`);

            el = el.parentNode;
        }

        return "/" + path.join("/");
    }

    /* =========================
       DOM TREE
    ========================= */

    function buildTree(el, selectedEl, depth = 0) {

        const indent = "&nbsp;".repeat(depth * 4);

        let attrs = "";

        for (const a of el.attributes) {

            if (a.name.startsWith("ui-picker")) continue;

            attrs += ` <span class="tree-attr">${a.name}</span>=<span class="tree-attr">"${a.value}"</span>`;
        }

        const selected = el === selectedEl ? " tree-selected" : "";

        let html = `
<div class="tree-node${selected}">
${indent}<span class="tree-tag">&lt;${el.tagName.toLowerCase()}</span>${attrs}<span class="tree-tag">&gt;</span>
</div>
`;

        const children = [...el.children];

        children.slice(0, 8).forEach(child => {
            html += buildTree(child, selectedEl, depth + 1);
        });

        html += `
<div class="tree-node">
${indent}<span class="tree-tag">&lt;/${el.tagName.toLowerCase()}&gt;</span>
</div>
`;

        return html;
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

    function domPath(el) {

        const arr = [];

        while (el && el.nodeType === 1) {
            arr.unshift(el.tagName.toLowerCase());
            el = el.parentElement;
        }

        return arr.join(" > ");
    }

    function field(label, val) {

        return `
<div class="section">
<div class="label">${label}</div>
<textarea class="field">${val}</textarea>
</div>
`;
    }

    /* =========================
       PANEL
    ========================= */

    function openPanel(el) {

        const css = uniqueCss(el);
        const xpath = uniqueXPath(el);

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
${field("CSS Selector", css)}
${field("XPath", xpath)}
</div>

<div class="picker-content" id="dom" style="display:none">
<div class="tree">${buildTree(document.documentElement, el)}</div>
</div>

<div class="picker-content" id="attr" style="display:none">
${field("Attributes", attrs(el))}
${field("DOM Path", domPath(el))}
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
<option value="click">Click</option>
<option value="sendkeys">SendKeys</option>
<option value="wait">WebDriverWait</option>
<option value="playwright">Playwright</option>
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

            click: `driver.findElement(By.cssSelector("${css}")).click();`,
            sendkeys: `driver.findElement(By.cssSelector("${css}")).sendKeys("text");`,

            wait: `new WebDriverWait(driver, Duration.ofSeconds(10))
.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("${css}")));`,

            playwright: `const el = page.locator("${css}");`
        };

        const select = panel.querySelector("#code-type");
        const textarea = panel.querySelector("#code-snippet");

        function updateSnippet() {
            textarea.value = snippets[select.value] || "";
        }

        select.onchange = updateSnippet;
        updateSnippet();

        panel.querySelectorAll(".picker-tab").forEach(tab => {

            tab.onclick = () => {

                panel.querySelectorAll(".picker-tab")
                    .forEach(t => t.classList.remove("active"));

                tab.classList.add("active");

                panel.querySelectorAll(".picker-content")
                    .forEach(c => c.style.display = "none");

                panel.querySelector("#" + tab.dataset.tab)
                    .style.display = "block";
            };
        });

        document.getElementById("ui-picker-panel")?.remove();
        document.body.appendChild(panel);

        setTimeout(() => {

            const selectedNode = panel.querySelector(".tree-selected");

            if (selectedNode) {
                selectedNode.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        }, 50);

        makeDraggable(panel);
    }

    /* =========================
       EVENTS
    ========================= */

    document.addEventListener("mouseover", e => {

        if (!pickerEnabled) return;

        if (
            e.target.closest("#ui-picker-panel") ||
            e.target.closest("#ui-picker-toggle")
        ) return;

        showHighlight(e.target);
    });

    document.addEventListener("mousedown", e => {

        if (!pickerEnabled) return;

        if (
            e.target.closest("#ui-picker-panel") ||
            e.target.closest("#ui-picker-toggle")
        ) return;

        e.preventDefault();
        e.stopPropagation();

        openPanel(e.target);

    }, true);

})();