import React, { useEffect, useState } from "react";
import "./Newtab.css";
import Tree from "react-d3-tree";
import wikipng from "../../assets/img/wiki-128.png";
import save from "../../assets/img/floppy-disk-regular.svg";
import info from "../../assets/img/info.svg";
import saveimg from "../../assets/img/saveimg.svg";
import upload from "../../assets/img/upload.svg";

const findNodeWithId = (root, searchId) => {
  if (!root || !searchId) {
    console.error("Node or id is undefined");
    return;
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

  const parentDict = JSON.parse(window.localStorage.getItem("tabs")) ?? {};

  const getWikiTabs = () =>
    chrome.tabs.query(
      {
        url: ["*://en.wikipedia.org/wiki/*"],
      },
      (wikiTabs) => {
        const tree = {
          name: "Wiki",
          children: [],
        };
        wikiTabs.length > 0 &&
          wikiTabs.map((tab) => {
            // console.log(tab.title, tab.id, tab.openerTabId);

            let parentId;
            if (tab.openerTabId) {
              parentId = tab.openerTabId;
              parentDict[tab.id] = tab.openerTabId;
              window.localStorage.setItem("tabs", JSON.stringify(parentDict));
            } else {
              parentId = parentDict[tab.id] ?? undefined;
            }

            let parentTab = parentId
              ? findNodeWithId(tree, parentId)
              : undefined;
            if (!parentTab) parentTab = tree;

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

  console.log("TREE: ", tabs);

  const importTree = (file) => {
    let reader = new FileReader();
    reader.onload = (e) => {
      let tree = JSON.parse(e.target.result);
      setTabs(tree);
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      <div style={{ padding: "20px", width: "150px", position: "absolute" }}>
        <img src={wikipng} alt="wikitree" />
      </div>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundColor: "#f8f9fa",
        }}
      >
        {tabs && (
          <Tree
            data={tabs}
            pathFunc="step"
            orientation="vetical"
            translate={{ x: window.innerWidth / 2, y: 100 }}
            separation={{ siblings: 4, nonSiblings: 4 }}
            nodeSize={{ x: 100, y: 175 }}
            onNodeClick={(node) => goToTab(node.data)}
            renderCustomNodeElement={(rd3tNodeProps) =>
              renderWikiNode({ ...rd3tNodeProps })
            }
          />
        )}
      </div>
      <div
        style={{
          padding: "20px",
          position: "absolute",
          right: 0,
        }}
      >
        <Toolbar tree={tabs} importTree={importTree} />
      </div>
    </div>
  );
};

export default WikiTree;

const Toolbar = ({ tree, importTree }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#dedede",
          borderRadius: "6px",
          padding: "5px 10px",
        }}
      >
        <div style={{ cursor: "pointer" }} onClick={() => exportTree(tree)}>
          <img src={save} height={24} width={24} alt="save" />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#dedede",
          borderRadius: "6px",
          padding: "5px 10px",
        }}
      >
        <div style={{ cursor: "pointer" }} onClick={() => saveImage()}>
          <img src={saveimg} height={24} width={24} alt="saveimg" />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#dedede",
          borderRadius: "6px",
          padding: "5px 10px",
        }}
      >
        <div style={{ cursor: "pointer" }}>
          <label style={{ cursor: "pointer" }}>
            <img src={upload} height={24} width={24} alt="upload" />
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              name="image"
              accept="data:text/json"
              data-original-title="upload json"
              onInput={(e) => importTree(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#dedede",
          borderRadius: "6px",
          padding: "5px 10px",
        }}
      >
        <div
          style={{ cursor: "pointer" }}
          onClick={() => alert("Made by Vathsa")}
        >
          <img src={info} height={24} width={24} alt="info" />
        </div>
      </div>
    </div>
  );
};

const exportTree = (obj) => {
  const dataUrl =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
  const link = document.createElement("a");
  document.body.appendChild(link);

  link.href = dataUrl;
  link.target = "_self";
  link.fileName = "test_file_download.gif";
  link.download = "wikitree";
  link.click();
};

const saveImage = async () => {
  chrome.tabs.captureVisibleTab((dataUrl) => {
    const link = document.createElement("a");
    document.body.appendChild(link);

    link.href = dataUrl;
    link.target = "_self";
    link.fileName = "test_file_download.gif";
    link.download = "wikitree";
    link.click();
  });
};

const goToTab = (node) => {
  if (node.name !== "Wiki") {
    chrome.tabs.get(node.attributes.id).then((tab) => {
      chrome.tabs.update(tab.id, { active: true });
    });
  }
};

const renderWikiNode = ({ nodeDatum, foreignObjectProps }) => (
  <g>
    {/* <circle r={15}></circle> */}
    {/* `foreignObject` requires width & height to be explicitly set. */}
    <foreignObject width={200} height={200} x={-100} y={-50}>
      <div
        style={{
          backgroundColor: "#dedede",
          borderRadius: "6px",
          padding: "2px",
        }}
        onClick={() => goToTab(nodeDatum)}
      >
        <h3 style={{ textAlign: "center", color: "black" }}>
          {nodeDatum.name}
        </h3>
        {/* {nodeDatum.children && (
          <button style={{ width: "100%" }} onClick={toggleNode}>
            {nodeDatum.__rd3t.collapsed ? "Expand" : "Collapse"}
          </button>
        )} */}
      </div>
    </foreignObject>
  </g>
);
