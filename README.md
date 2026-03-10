1. Start the program (pull the program from github)
2. Check if swagger-ui is working on http://localhost:8080/swagger-ui/index.html
3. Add the page to favourite
4. in link paste: javascript:(function(){var s=document.createElement('script');s.src='http://localhost:8080/selector-picker.js';document.body.appendChild(s);})();
5. Go to any page you what test
6. Go to favourties and enable the plugin

V1.0
* Startup project
* Replace DOM Path output with semantic context in the picker panel
* Enhance selector picker with ranked locators, uniqueness checks, Cypress snippet, and expandable DOM tree
* Improve locator tab with smarter XPath suggestions
* Add @FindBy Selenium locator snippets to the code tab
* Make the UI element picker better at selecting meaningful targets inside rich components such as date/time pickers, tabs, grids, dialogs, toasts and other composite controls.
* Ensure inputs with date/time variants (time, date, datetime-local, week, month) are recognized as interactive elements for highlighting and selection.
* Prefer returning a semantic container for compound widgets so the picker opens a useful panel for complex nested UI patterns.
