package com.example.uireader.util;

import org.jsoup.nodes.Element;

public class LocatorBuilder {

    public static String buildCss(Element el) {

        if (!el.id().isBlank()) {
            return "#" + el.id();
        }

        if (!el.className().isBlank()) {
            return el.tagName() + "." +
                    el.classNames().iterator().next();
        }

        return el.tagName();
    }

    public static String buildXPath(Element el) {

        if (!el.id().isBlank()) {
            return "//*[@id='" + el.id() + "']";
        }

        if (!el.attr("name").isBlank()) {
            return "//*[@name='" + el.attr("name") + "']";
        }

        return "//" + el.tagName();
    }

    public static String bestType(Element el) {

        if (!el.id().isBlank()) return "id";
        if (!el.attr("name").isBlank()) return "name";
        if (!el.className().isBlank()) return "css";

        return "xpath";
    }

    public static String bestValue(Element el) {

        if (!el.id().isBlank()) return el.id();
        if (!el.attr("name").isBlank()) return el.attr("name");
        if (!el.className().isBlank())
            return el.tagName() + "." +
                    el.classNames().iterator().next();

        return "//" + el.tagName();
    }

    public static boolean isClickable(Element el) {
        String tag = el.tagName();
        return tag.equalsIgnoreCase("button")
                || tag.equalsIgnoreCase("a")
                || tag.equalsIgnoreCase("input")
                || "button".equalsIgnoreCase(el.attr("role"));
    }

    public static String buildSeleniumCode(Element el) {

        if (!el.id().isBlank()) {
            return "driver.findElement(By.id(\"" + el.id() + "\"))";
        }

        if (!el.attr("name").isBlank()) {
            return "driver.findElement(By.name(\"" + el.attr("name") + "\"))";
        }

        String css = buildCss(el);
        return "driver.findElement(By.cssSelector(\"" + css + "\"))";
    }
}