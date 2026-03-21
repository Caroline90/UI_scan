1. Start the program.
2. Open the session builder on http://localhost:8090/.
3. Confirm the generated Swagger URL and bookmarklet use the desired port (default is 8090 and can be changed in the UI).
4. Enter the Xray ticket and target URL, then use **Add step** to create step cards for the details you want to keep recorded.
5. Save the generated bookmarklet as a browser favorite.
6. Open the page you want to test and launch the bookmarklet from favorites.
7. If you captured screenshots, upload them back into the session builder to download renamed copies with the Xray ticket and step number in the filename.
8. Export the session JSON when you want a single file containing all recorded inputs.

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
