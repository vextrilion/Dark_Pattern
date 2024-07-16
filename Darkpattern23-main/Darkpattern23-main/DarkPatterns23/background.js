// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
});

async function executeScriptOnTab(tabId, scriptFunction) {
    const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: scriptFunction,
    });

    return result && result.length > 0 ? result[0].result : null;
}

async function highlightElements(tabId, textStrings, category) {
    for (const textString of textStrings) {
        if (!textString.trim() || /^\d+$/.test(textString.trim())) {
            continue; // Skip empty or numeric text strings
        }

        let xpathExpression = '';

        switch (category) {
            case 'Urgency':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Scarcity':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Misdirection':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Social Proof':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'NewCategory':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Scam':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Discount':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'LimitedStock':
                xpathExpression = `//*[contains(text(), "${textString}")]`;
                break;
            case 'Authority':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="authority-highlight"]`;
                break;
            case 'Consensus':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="consensus-highlight"]`;
                break;
            case 'FOMO (Fear of Missing Out)':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="fomo-highlight"]`;
                break;
            case 'Reciprocity':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="reciprocity-highlight"]`;
                break;
            case 'Novelty':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="novelty-highlight"]`;
                break;
            case 'Trust':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="trust-highlight"]`;
                break;
            case 'Exclusivity':
                xpathExpression = `//*[contains(text(), "${textString}") and @class="exclusivity-highlight"]`;
                break;
            default:
                continue; // Skip unknown category
        }

        const elements = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: (xpath) => {
                const elements = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                    null,
                );
                const highlightedElements = [];
                for (let i = 0; i < elements.snapshotLength; i++) {
                    const element = elements.snapshotItem(i);
                    element.style.border = "4px solid red";
                    element.style.backgroundColor = "orange";
                    highlightedElements.push(element.innerText.trim());
                }
                return highlightedElements;
            },
            args: [xpathExpression],
        });

        console.log(`Found ${elements.length} elements for text: "${textString}"`, elements);
    }
}

async function sendDataToServer(data, tabId) {
    const serverUrl = "http://127.0.0.1:5000"; // Adjust the URL based on your server

    try {
        const response = await fetch(serverUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: data,
        });

        console.log("Request sent successfully");

        if (response.ok) {
            const responseData = await response.json();
            chrome.runtime.sendMessage({
                command: "showResults",
                data: responseData,
            });

            // Highlight elements for each category
            for (const category in responseData) {
                const info = responseData[category];
                if (info.count > 0) {
                    await highlightElements(tabId, info.text_strings, category);
                }
            }

            console.log("Elements highlighted based on responseData");
        } else {
            console.error("Error receiving response from the server");
        }
    } catch (error) {
        console.error("Error sending request:", error);
    }
}

async function handleExtensionClick(tab) {
    if (!tab || !tab.url) {
        console.error("Invalid or non-matching tab:", tab);
        return;
    }

    console.log("Handling click for tab:", tab);

    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState,
    });

    if (nextState === "ON") {
        const resultRightCol = await executeScriptOnTab(tab.id, () => {
            const targetElement = document.getElementById("rightCol");
            return targetElement ? targetElement.innerText.trim() : null;
        });

        const resultLeftCol = await executeScriptOnTab(tab.id, () => {
            const targetElement = document.getElementById("leftCol");
            return targetElement ? targetElement.innerText.trim() : null;
        });

        const elementsTextContent = [
            resultRightCol,
            resultLeftCol,
            // Add other results here
        ]
            .filter(Boolean)
            .join("\n");

        console.log(elementsTextContent);

        sendDataToServer(elementsTextContent, tab.id);
    } else if (nextState === "OFF") {
        await chrome.scripting.removeCSS({
            files: ["focus-mode.css"],
            target: { tabId: tab.id },
        });
    }
}

chrome.action.onClicked.addListener(async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });

    if (tab) {
        await handleExtensionClick(tab);
    } else {
        console.error("No active tab found");
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "detect") {
        chrome.tabs.query({ active: true }, async function (tabs) {
            console.log(tabs);
            if (tabs && tabs.length > 0) {
                const tab = tabs[0];
                await handleExtensionClick(tab);
            } else {
                console.error("No active tab found");
            }
        });
    }
});

