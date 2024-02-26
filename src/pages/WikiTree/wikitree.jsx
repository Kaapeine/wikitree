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

    if (curr?.attributes?.id === searchId) {
      return curr;
    } else {
      curr.children?.map((child) => queue.push(child));
    }
  }

  return undefined;
};

const WikiTree = () => {
  const [tabs, setTabs] = useState();

  const getWikiTabs = () =>
    chrome.tabs.query(
      {
        url: ["*://en.wikipedia.org/wiki/*"],
      },
      (wikiTabs) => {
        const tree = {
          name: "root",
          children: [],
        };
        wikiTabs.map((tab) => {
          console.log(tab);
          // no parent tab
          const parentTab = tab.openerTabId
            ? findNodeWithId(tree, tab.openerTabId)
            : tree;

          const name = tab.title.replace("- Wikipedia", "");

          parentTab.children.push({
            name: name,
            attributes: {
              id: tab.id,
              parentId: tab.openerTabId,
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
  chrome.tabs.onCreated.addListener(getWikiTabs);

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
