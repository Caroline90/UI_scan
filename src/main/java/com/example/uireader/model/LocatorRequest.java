package com.example.uireader.model;

public class LocatorRequest {

    private String page;
    private String element;
    private String css;
    private String xpath;
    private String locatorType;
    private String locatorValue;

    public LocatorRequest() {}

    public String getPage() { return page; }
    public void setPage(String page) { this.page = page; }

    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }

    public String getCss() { return css; }
    public void setCss(String css) { this.css = css; }

    public String getXpath() { return xpath; }
    public void setXpath(String xpath) { this.xpath = xpath; }

    public String getLocatorType() { return locatorType; }
    public void setLocatorType(String locatorType) { this.locatorType = locatorType; }

    public String getLocatorValue() { return locatorValue; }
    public void setLocatorValue(String locatorValue) { this.locatorValue = locatorValue; }
}