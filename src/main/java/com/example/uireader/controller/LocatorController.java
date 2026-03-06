package com.example.uireader.controller;

import com.example.uireader.model.LocatorRequest;
import com.example.uireader.model.LocatorResponse;
import com.example.uireader.service.LocatorService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/locator")
public class LocatorController {

    private final LocatorService service;

    public LocatorController(LocatorService service) {
        this.service = service;
    }

    @PostMapping
    public LocatorResponse create(@RequestBody LocatorRequest request) {
        return service.build(request);
    }
}