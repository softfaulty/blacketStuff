/*
 * Copyright (C) 2026 softfault
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

(async () => {
    const repo = "softfaulty/blacketStuff";
    const branch = "main";
    const apiUrl = `https://api.github.com/repos/${repo}/contents/minified?ref=${branch}`;
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/minified`;

    const makeLabel = (name) => {
        const script = name.replace(/\.minified\.js$/, "");
        const words = script.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[-_ ]+/);

        return words
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const response = await fetch(apiUrl);

    if (!response.ok) {
        console.error(`failed to load scripts: ${response.status}`);
        return;
    }

    const files = await response.json();
    const scripts = files
        .filter((file) => file.type === "file")
        .filter((file) => file.name.endsWith(".minified.js"))
        .filter((file) => file.name !== "loader.minified.js")
        .sort((a, b) => a.name.localeCompare(b.name));

    if (scripts.length === 0) {
        alert("no scripts found");
        return;
    }

    const menu = scripts
        .map((file, index) => `${index + 1}. ${makeLabel(file.name)}`)
        .join("\n");

    let selected = null;

    while (selected === null) {
        const input = prompt(`choose a script:\n\n${menu}`);
        if (input === null) return;

        const parsed = Number(input);

        if (!Number.isInteger(parsed) || parsed < 1 || parsed > scripts.length) {
            alert(`enter a number from 1 to ${scripts.length}`);
            continue;
        }

        selected = scripts[parsed - 1];
    }

    const scriptResponse = await fetch(`${rawUrl}/${selected.name}`);

    if (!scriptResponse.ok) {
        console.error(`failed to load ${selected.name}: ${scriptResponse.status}`);
        return;
    }

    eval(await scriptResponse.text());
})();
