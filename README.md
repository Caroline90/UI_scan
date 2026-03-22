1. Start the program (pull the program from github)
2. Open Swagger UI on http://localhost:8081/swagger-ui.html
3. Open the fallback launcher page on http://localhost:8081/launcher.html if Chrome or Edge extension installation is blocked
4. Use one of the launcher options:
   * Bookmarklet: drag the launcher link to your bookmarks/favourites bar and click it on the page you want to inspect
   * DevTools console: copy the loader command from the launcher page and paste it into the console on the target page
5. Go to any page you want to test
6. Run the bookmarklet or console command, then click Enable Picker

V1.0
* Startup project
* Replace DOM Path output with semantic context in the picker panel
* Enhance selector picker with ranked locators, uniqueness checks, Cypress snippet, and expandable DOM tree
* Improve locator tab with smarter XPath suggestions
* Add @FindBy Selenium locator snippets to the code tab
* Make the UI element picker better at selecting meaningful targets inside rich components such as date/time pickers, tabs, grids, dialogs, toasts and other composite controls.
* Ensure inputs with date/time variants (time, date, datetime-local, week, month) are recognized as interactive elements for highlighting and selection.
* Make placeholder-based locators visible even when they are not unique so users can copy a usable selector instead of the picker hiding it.
* Improve the picker so hover and click resolve to the actual interactive element (including ARIA-based widgets and label-linked controls) for more reliable locators.
* Ensure inputs with date/time variants (time, date, datetime-local, week, month) are recognized as interactive elements for highlighting and selection.
* Make the UI element picker better at selecting meaningful targets inside rich components such as date/time pickers, tabs, grids, dialogs, toasts and other composite controls.
* Allow the selector picker to capture user selections on elements that block normal mouse interactions (for example disabled or read-only controls) so locators can be generated for non-clickable elements.
* Add a launcher page with bookmarklet and DevTools-console fallbacks so the picker can still be used without installing a Chrome or Edge extension.
