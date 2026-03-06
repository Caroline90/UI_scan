package com.example.uireader.service;

import com.example.uireader.model.LocatorRequest;
import com.example.uireader.model.LocatorResponse;
import org.springframework.stereotype.Service;

@Service
public class LocatorService {

    public LocatorResponse build(LocatorRequest req) {

        String selenium;
        String playwright;

        switch (req.getLocatorType()) {

            case "id":
                selenium = "driver.findElement(By.id(\"" + req.getLocatorValue() + "\"))";
                playwright = "page.locator(\"#" + req.getLocatorValue() + "\")";
                break;

            case "name":
                selenium = "driver.findElement(By.name(\"" + req.getLocatorValue() + "\"))";
                playwright = "page.locator(\"[name=" + req.getLocatorValue() + "]\")";
                break;

            default:
                selenium = "driver.findElement(By.cssSelector(\"" + req.getCss() + "\"))";
                playwright = "page.locator(\"" + req.getCss() + "\")";
        }

        return new LocatorResponse(
                selenium,
                playwright,
                req.getCss(),
                req.getXpath()
        );
    }
}