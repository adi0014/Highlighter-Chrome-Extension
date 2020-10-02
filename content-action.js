!function () {
	"use strict";

	
	var ruleExistenceDict = {};
	var sheet = (function() {
		var style = document.createElement("style");
		style.appendChild(document.createTextNode(""));	// WebKit hack @@
		document.head.appendChild(style);
		return style.sheet;
	})();

	
	var highlightWordInTextNodeOnly = function (word, bgColorCode) {

		
		if (word == null || word.length === 0) return;

		
		var wordRegex = new RegExp(word, "gi");
		var treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
			acceptNode: function (node) {
				var result = NodeFilter.FILTER_SKIP;
				if (wordRegex.test(node.nodeValue)) result = NodeFilter.FILTER_ACCEPT;
				return result;
			}
		}, false);

	
		var skipTagName = {
			"NOSCRIPT": true,
			"SCRIPT": true,
			"STYLE": true
		};
		var nodeList = [];
		while(treeWalker.nextNode()) {
			if (!skipTagName[treeWalker.currentNode.parentNode.tagName]) {
				nodeList.push(treeWalker.currentNode);
			}
		}

		nodeList.forEach(function (n) {
			var rangeList = [];

			
			var startingIndex = 0;
			do {
				
				startingIndex = n.textContent.indexOf(word, startingIndex + 1);
				if (startingIndex !== -1) {
					var wordRange = document.createRange();
					wordRange.setStart(n, startingIndex);
					wordRange.setEnd(n, startingIndex + word.length);
					rangeList.push(wordRange);
				}
			} while (startingIndex !== -1);

			// highlight all ranges
			rangeList.forEach(function (r) {
				highlightRange(r, bgColorCode);
			});
		});
	};
	
	var highlightWordAcrossNode = function (word, bgColorCode) {

		
		window.getSelection().removeAllRanges();

		
		var rangeList = [];
		if (window.find(word, false, false, false, false, false, false)) {
			do {
				rangeList.push(window.getSelection().getRangeAt(0));
				
			} while (window.find(word, false, false, false, false, false, false));
			
			window.scrollTo(0, 0);
		} else {
			console.log("[highlightWordAcrossNode] nothing found", word, bgColorCode, document.title);
		}

		
		rangeList.forEach(function (r) {
			highlightRange(r, bgColorCode);
		});
	};
	
	var highlightRange = function (range, bgColorCode) {

		
		var iNode = document.createElement("i");
		var selectorName = iNode.className = "AA-".concat(bgColorCode);
		iNode.classList.add("AA");

		
		if (!ruleExistenceDict[bgColorCode]) {
			sheet.insertRule([".", selectorName, " { background: #", bgColorCode, " !important; }"].join(""), 0);
			ruleExistenceDict[bgColorCode] = true;
			console.log(sheet);
		}

		
		iNode.appendChild(range.extractContents());
		range.insertNode(iNode);
	};
	
	var highlightAllWords = function (wordGroupsDict) {

		var highlightWordFunction;
		if (window.find) {
			highlightWordFunction = highlightWordAcrossNode;
			
		} else {
			console.log("window.find() function not exists, only textnode will be searched");
			highlightWordFunction = highlightWordInTextNodeOnly;
		}

		
		Object.keys(wordGroupsDict).forEach(function (groupName) {
			if (wordGroupsDict[groupName].isOn) {
				wordGroupsDict[groupName].words.forEach(function (word) {
					highlightWordFunction(word, groupName);
				});
			}
		});
	};

	
	chrome.storage.sync.get('wordGroupsDict', function (wordGroupsDict) {

		if (!wordGroupsDict.wordGroupsDict) return;
		else wordGroupsDict = wordGroupsDict.wordGroupsDict;

		
		setTimeout(highlightAllWords, 500, wordGroupsDict);

		
	});


	chrome.runtime.onMessage.addListener(function (messageBody, sender, sendResponse) {

		
		[].slice.call(document.getElementsByClassName("AA")).forEach(function (e) {
			var parentNode = e.parentNode;
			while(e.firstChild) parentNode.insertBefore(e.firstChild, e);
			parentNode.removeChild(e);
		});

		highlightAllWords(messageBody);
		if (sendResponse) sendResponse({content: "highlight done!"});
	});
}();
