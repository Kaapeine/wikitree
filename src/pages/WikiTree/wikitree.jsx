import React, { useEffect, useState } from "react";
import "./Newtab.css";
import "./Newtab.scss";
import Tree from "react-d3-tree";

const findNodeWithId = (root, searchId) => {
  if (!root) {
    throw Error("No root tab given");
  }

  const queue = [root];

  while (queue.length !== 0) {
    // console.log("QUEUE: ", queue);
    const curr = queue.pop();
    // console.log("CURR", curr);

    if (curr.name !== "Wiki" && curr.attributes.id === searchId) {
      // console.log("FOUND", curr);
      return curr;
    } else {
      curr.children?.map((child) => queue.push(child));
    }
  }
  return undefined;
};

const WikiTree = () => {
  const [tabs, setTabs] = useState({
    name: "Wiki",
    children: [],
  });

  const parentDict = JSON.parse(window.localStorage.getItem("tabs"));

  const getWikiTabs = () =>
    chrome.tabs.query(
      {
        url: ["*://en.wikipedia.org/wiki/*", "<all_urls>"],
      },
      (wikiTabs) => {
        const tree = {
          name: "Wiki",
          children: [],
        };
        wikiTabs.length > 0 &&
          wikiTabs.map((tab) => {
            // console.log(tab.title, tab.id, tab.openerTabId);
            // no parent tab
            let parentId;
            if (tab.openerTabId) {
              parentId = tab.openerTabId;
              parentDict[tab.id] = tab.openerTabId;
              window.localStorage.setItem("tabs", JSON.stringify(parentDict));
            } else {
              parentId = parentDict[tab.id] ?? undefined;
            }

            const parentTab = parentId ? findNodeWithId(tree, parentId) : tree;
            const name = tab.title.replace("- Wikipedia", "");

            parentTab.children.push({
              name: name,
              attributes: {
                id: tab.id,
                parentId: parentId,
                url: tab.url,
              },
              children: [],
            });
          });

        setTabs(tree);
      }
    );

  useEffect(() => {
    getWikiTabs();
  }, []);

  chrome.tabs.onUpdated.addListener(getWikiTabs);

  // chrome.tabs.onCreated.addListener((tab) => {
  //   console.log("NEW", tab);
  //   if (tabs.children.length === 0) return;

  //   const tree = {
  //     name: "root",
  //     children: tabs.children,
  //   };

  //   const parentTab = tab.openerTabId
  //     ? findNodeWithId(tree, tab.openerTabId)
  //     : tree;

  //   console.log("PARENT", parentTab);

  //   const name = tab.title.replace("- Wikipedia", "");

  //   parentTab?.children?.push({
  //     name: name,
  //     attributes: {
  //       id: tab.id,
  //       parentId: tab.openerTabId,
  //       url: tab.url,
  //     },
  //     children: [],
  //   });
  // });

  console.log("TREE: ", tabs);

  return (
    <div className="App">
      <div style={{ height: "100vh", width: "100vw" }}>
        {tabs && (
          <Tree
            data={tabs}
            pathFunc="step"
            orientation="vetical"
            translate={{ x: window.innerWidth / 2, y: 50 }}
            separation={{ siblings: 2, nonSiblings: 3 }}
            onNodeClick={(node) => {
              chrome.tabs.get(node.data.attributes.id).then((tab) => {
                chrome.tabs.update(tab.id, { active: true });
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WikiTree;
