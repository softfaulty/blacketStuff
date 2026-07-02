/*
 * Copyright (C) 2026 softfault
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

(async () => {
    const { blooks, requests } = blacket;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const blookNames = Object.keys(blooks).sort((a, b) => a.localeCompare(b));
    const listBlook = (blook, price) =>
        new Promise((resolve, reject) => {
            let settled = false;

            const finish = (value) => {
                if (settled) return;
                settled = true;
                resolve(value);
            };

            const fail = (error) => {
                if (settled) return;
                settled = true;
                reject(error);
            };

            const returned = requests.post(
                "/worker/bazaar/list",
                {
                    item: blook,
                    price,
                },
                finish,
            );

            if (returned?.then) {
                returned.then(finish).catch(fail);
            } else if (returned !== undefined) {
                finish(returned);
            }

            setTimeout(() => fail(new Error("request timed out")), 30000);
        });

    let blookName = "";

    while (!blookName) {
        const input = prompt("blook name?");
        if (input === null) return;

        const trimmed = input.trim();
        const match = blookNames.find((name) => name.toLowerCase() === trimmed.toLowerCase());

        if (!match) {
            alert("you do not own this blook!!");
            continue;
        }

        blookName = match;
    }

    let amount = 0;

    while (!amount) {
        const input = prompt(`how many ${blookName} should be listed?`);
        if (input === null) return;

        const parsed = Number(input.replaceAll(",", ""));

        if (!Number.isInteger(parsed) || parsed < 1) {
            alert("enter a number above 0 pls ty");
            continue;
        }

        amount = parsed;
    }

    let price = 0;

    while (!price) {
        const input = prompt(`Price per ${blookName}`);
        if (input === null) return;

        const parsed = Number(input.replaceAll(",", ""));

        if (!Number.isInteger(parsed) || parsed < 1) {
            alert("enter a number above 0 pls ty");
            continue;
        }

        price = parsed;
    }

    if (!confirm(`List ${amount}x ${blookName} for ${price.toLocaleString()} tokens each?`)) {
        return;
    }

    let listed = 0;
    let backoff = 2000;

    while (listed < amount) {
        try {
            const result = await listBlook(blookName, price);

            if (result?.error) {
                throw new Error(result.reason ?? result.error);
            }

            listed += 1;
            backoff = 2000;

            console.log(`[${listed}/${amount}] listed ${blookName}`);
            await sleep(1000);
        } catch (error) {
            const message = error?.message ?? String(error);

            if (!/rate|too fast|slow|wait|try again|timeout/i.test(message)) {
                console.warn(`[${listed + 1}/${amount}] ${message}`);
                console.log("stopped");
                return;
            }

            console.warn(
                `[${listed + 1}/${amount}] ${message} Retrying in ${Math.ceil(backoff / 1000)}s`,
            );
            await sleep(backoff);
            backoff = Math.min(backoff * 2, 30000);
        }
    }

    console.log(`done!!!! listed ${listed}x ${blookName} for ${price.toLocaleString()} each.`);
})();
