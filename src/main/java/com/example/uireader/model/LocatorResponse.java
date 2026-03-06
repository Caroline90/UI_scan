package com.example.uireader.model;

public class LocatorResponse {

    private String selenium;
    private String playwright;
    private String css;
    private String xpath;

    public LocatorResponse(String selenium, String playwright, String css, String xpath) {
        this.selenium = selenium;
        this.playwright = playwright;
        this.css = css;
        this.xpath = xpath;
    }

    public String getSelenium() { return selenium; }
    public String getPlaywright() { return playwright; }
    public String getCss() { return css; }
    public String getXpath() { return xpath; }
}