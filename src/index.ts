import {
    Plugin,
    Menu,
    getFrontend,
    Setting,
    showMessage
} from "siyuan";
import "./index.scss";
import { isDev } from "./constants";
import { ILogger, createLogger } from "./simple-logger";
import { sleep } from "./utils";

const STORAGE_NAME = "menu-config";

interface Indexs {
    [id: string]: {
        node?: HTMLElement,
        container?: HTMLElement
    }
}

interface MergedMemo {
    block: HTMLElement,
    totalContent: string
    memo: string
    originIndexs: number[]
}

export default class PluginSidebarMemo extends Plugin {

    private isMobile: boolean;
    private onChange: boolean;
    private alignCenter: boolean;
    private minPaddingRight = 150;

    private logger: ILogger;

    private topBarElement:HTMLElement;
    private editorNode: HTMLElement;

    private refreshEditorBindThis = this.refreshEditor.bind(this);
    private handleMainNode: MutationCallback;
    private handleMemoNode: MutationCallback;
    private handleMainNodeAttr: MutationCallback;
    private handelProtyleNodeAttr: MutationCallback;

    private protyleObservers: {[mainNodeID: string]: MutationObserver};
    private mainNodeObservers: {[mainNodeID: string]: MutationObserver};
    private mainNodeAttrObserver: {[mainNodeID: string]: MutationObserver};
    private memoObservers: {[mainNodeID: string]: MutationObserver[]};

    onload() {
        this.data[STORAGE_NAME] = {
            openSideBarMemo: false
        };

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.topBarElement = this.addTopBar({
            icon: "iconM",
            title: this.i18n.name,
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.addMenu();
                } else {
                    let rect = this.topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            }
        });

        this.logger = createLogger("main");
    }

    async onLayoutReady() {
        await this.loadData(STORAGE_NAME);
        this.editorNode = document.querySelector("div.layout__center");
        this.memoObservers = {};
        this.mainNodeObservers = {};
        this.mainNodeAttrObserver = {};
        this.protyleObservers = {};
        this.onChange = false;
        this.alignCenter = true;

        if (isDev) this.logger.info("找到编辑器, editor =>", this.editorNode);

        this.initHandleFunctions();
        setTimeout(() => {
            this.openSideBar(this.data[STORAGE_NAME].openSideBarMemo, true);
        }, 5000);
    }

    onunload() {
        this.openSideBar(false);
    }


    private initSettingTab() {
        const textareaElement = document.createElement("textarea");
        this.setting = new Setting({
            confirmCallback: () => {
                this.saveData(STORAGE_NAME, {readonlyText: textareaElement.value});
            }
        });
        this.setting.addItem({
            title: "Readonly text",
            createActionElement: () => {
                textareaElement.className = "b3-text-field fn__block";
                textareaElement.placeholder = "Readonly text in the menu";
                textareaElement.value = this.data[STORAGE_NAME].readonlyText;
                return textareaElement;
            },
        });
        const btnaElement = document.createElement("button");
        btnaElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        btnaElement.textContent = "Open";
        btnaElement.addEventListener("click", () => {
            window.open("https://github.com/siyuan-note/plugin-sample");
        });
        this.setting.addItem({
            title: "Open plugin url",
            description: "Open plugin url in browser",
            actionElement: btnaElement,
        });
    }

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample");
        if (!this.isMobile) {
            menu.addItem({
                icon: "iconLayoutBottom",
                label: this.data[STORAGE_NAME].openSideBarMemo ? this.i18n.closeSidebarMemo : this.i18n.openSidebarMemo,
                click: () => {
                    this.openSideBar(!this.data[STORAGE_NAME].openSideBarMemo, true);
                }
            });
        }
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }

    private initHandleFunctions() {
        this.handleMainNode = async (mutationsList, observer) => { 
            const targeList:Node[] = [];
            for (const mutation of mutationsList) {
                if (targeList.indexOf(mutation.target) != -1) continue;
                else targeList.push(mutation.target);
                if (isDev) this.logger.info("Main Node Observer Callback, detail=>", {mutation, observer});
                if (this.onChange) return;
                this.onChange = true;
                const mainNode = (observer as any).mainNode;
                const sidebar = (observer as any).sidebar;
                // await this.waitForDataLoading(mainNode);
                setTimeout(() => { 
                    if (this.data[STORAGE_NAME].openSideBarMemo) {
                        this.refreshSideBarMemos(mainNode, sidebar);
                    } else this.openSideBar(false);
                    this.onChange = false;
                }, 0);
            }
        };
        this.handleMemoNode = (mutationsList, observer) => {
            const targeList:Node[] = [];
            for (const mutation of mutationsList) {
                if (mutation.type === "attributes") {
                    if (targeList.indexOf(mutation.target) != -1) continue;
                    else targeList.push(mutation.target);
                    if (isDev) this.logger.info("Memo Observer Callback, detail=>", {mutation, observer});
                    if (!this.data[STORAGE_NAME].openSideBarMemo) {this.openSideBar(false);return;}
                    const memo = mutation.target as HTMLElement;
                    const block = this.getBlockNode(memo);
                    const node_id = block.getAttribute("data-node-id");
                    const memoNodes = block.querySelectorAll("span[data-type*=\"inline-memo\"]") as NodeListOf<HTMLElement>;
                    const mergedMemo = this.getMergedMemos(memoNodes);
                    const sidebar = (observer as unknown as {sidebar:HTMLElement}).sidebar;
                    // 找到所在块中的index
                    let idx = 0;
                    for (let i = 0; i < memoNodes.length; ++i) {
                        const item = memoNodes[i];
                        if (item == memo) idx = i;
                    }
                    // 找到在合并结果后的index
                    let mergedIdx = 0;
                    for (let i = 0; i < mergedMemo.length; ++i) {
                        if (mergedMemo[i].originIndexs.indexOf(idx) != -1) mergedIdx = i;
                    }
                    const sidebarBlock = sidebar.querySelector(`div[id="protyle-sidebar-memo-${node_id}-${mergedIdx}"]`);
                    // 如果找不到对应的块就刷新一遍读取
                    if (!sidebarBlock) return this.refreshSideBarMemos((observer as any).mainNode, sidebar);
                    const sidebarMemo = sidebarBlock.querySelector("div[data-content-type=\"memo\"]") as HTMLElement;
                    // 如果找到的块不对也说明memo错位了
                    if (sidebarMemo.textContent != mergedMemo[mergedIdx].totalContent) return this.refreshSideBarMemos((observer as any).mainNode, sidebar);
                    const memoContent = mergedMemo[mergedIdx].memo;
                    sidebarMemo.innerText = `${memoContent}`;
                }
            }
        };
        this.handleMainNodeAttr = async (mutationList, observer) => {
            const targeList:Node[] = [];
            for (const mutation of mutationList) {
                if (mutation.type == "attributes") {
                    if (targeList.indexOf(mutation.target) != -1) continue;
                    else targeList.push(mutation.target);
                    if (isDev) this.logger.info("Attr Observer触发, detail=>", {mutation,observer});
                    const mainNode = (observer as any).mainNode;
                    const sidebar = (observer as any).sidebar;
                    // await this.waitForDataLoading(mainNode, true);
                    const paddingRight = parseFloat(getComputedStyle(mainNode).paddingRight);
                    const fullwidth = mainNode.parentElement.dataset.fullwidth;
                    const isDisplayed = (mainNode.parentElement.parentElement.getAttribute("class").indexOf("fn__none") == -1);
                    if (isDisplayed && !fullwidth && (paddingRight < this.minPaddingRight)) {
                        if (isDev) this.logger.info("编辑器宽度不足，取消侧栏，paddingRight=>", {paddingRight});
                        showMessage(this.i18n.noEnoughPaddingRight, 2000, "info");
                        this.openSideBar(false);
                    } else {
                        if (isDev) this.logger.info("宽度改变，进行刷新，paddingRight=>", {paddingRight});
                        if (!isDisplayed) {
                            if (isDev) this.logger.info("这个页面没渲染，不着急，mainNode=>", {mainNode});
                            return;
                        }
                        sidebar?.remove();
                        await this.refreshEditor();
                    }
                }
            }
        };
        this.handelProtyleNodeAttr = async (mutationList, observer) => {
            const targeList:Node[] = [];
            for (const mutation of mutationList) {
                console.log(mutation);
                if (mutation.type == "attributes") {
                    if (targeList.indexOf(mutation.target) != -1) continue;
                    else targeList.push(mutation.target);
                    if (isDev) this.logger.info("Protyle Observer触发, detail=>", {mutation,observer});
                    const mainNode = (observer as any).mainNode;
                    const isDisplayed = ((mutation.target as HTMLElement).getAttribute("class").indexOf("fn__none") == -1);
                    if (isDisplayed) {
                        const sidebar = this.addSideBar(mainNode);
                        await this.waitForDataLoading(mainNode);
                        this.refreshSideBarMemos(mainNode, sidebar);
                    }
                }
            }
        };
    }

    private openSideBar(open: boolean, save=false) {
        if (isDev) this.logger.info("open sidebar 触发, open=>", {open});
        if (open) {
            this.memoObservers = {};
            this.mainNodeObservers = {};
            this.eventBus.on("loaded-protyle", this.refreshEditorBindThis);
            this.refreshEditor();
        } else {
            this.eventBus.off("loaded-protyle", this.refreshEditorBindThis);
            Object.keys(this.mainNodeObservers).forEach(id => {
                this.mainNodeObservers[id]?.disconnect();
                if (isDev) this.logger.info("关闭mainNodeObserver=>", {id});
            });
            if (isDev) this.logger.info(`关闭mainNodeAttrObserver${Object.keys(this.mainNodeAttrObserver).length}个`);
            Object.values(this.mainNodeAttrObserver).forEach(observer => observer.disconnect());
            if (isDev) this.logger.info(`关闭protyleObserver${Object.keys(this.protyleObservers).length}个`);
            Object.values(this.protyleObservers).forEach(observer => observer.disconnect());
            Object.keys(this.memoObservers).forEach(id => {
                this.memoObservers[id]?.forEach(observer => {observer.disconnect();});
                if (isDev) this.logger.info("关闭memoObserver=>", {id});
            });
            const mainNodes = this.editorNode.querySelectorAll("div.protyle-wysiwyg") as NodeListOf<HTMLElement>;
            mainNodes.forEach(mainNode=> {
                const sidebar = mainNode.parentElement.querySelector("#protyle-sidebar") as HTMLElement;
                sidebar?.remove();
            });
            if (isDev) this.logger.info("侧栏已关闭，Observer已关闭");
        }
        if (save) {
            const setting = {
                openSideBarMemo: open
            };
            this.data[STORAGE_NAME] = setting;
            this.saveData(STORAGE_NAME, setting);
        }
    }

    private addSideBar(mainNode: HTMLElement) {
        let sidebar = mainNode.parentElement.querySelector("#protyle-sidebar") as HTMLElement;
        const titleNode = mainNode.parentElement.querySelector("div.protyle-title");
        const paddingRight = parseFloat(globalThis.getComputedStyle(mainNode).paddingRight);
        const fullwidth = mainNode.parentElement.dataset.fullwidth;
        const isDisplayed = (mainNode.parentElement.parentElement.getAttribute("class").indexOf("fn__none") == -1);
        if (isDisplayed && !fullwidth && (paddingRight < this.minPaddingRight)) {
            if (isDev) this.logger.info("编辑器宽度不足，取消侧栏，detail=>", {mainNode, paddingRight});
            showMessage(this.i18n.noEnoughPaddingRight, 2000, "info");
            return null;
        }
        if (isDev) this.logger.info("编辑器宽度足够，detail=>", {mainNode, paddingRight});
        if (!sidebar) {
            sidebar = document.createElement("div");
            sidebar.scrollTop = mainNode.scrollTop;
            sidebar.id = "protyle-sidebar";
            titleNode.insertAdjacentElement("beforeend", sidebar);
            const width = fullwidth ? 230 : paddingRight - 20;
            sidebar.style.cssText = `position:absolute;right:-${width}px;width:${width}px;z-index:3;`;
            sidebar.scrollTop = titleNode.scrollTop;
            mainNode.style.minWidth = "90%";
        }
        return sidebar;
    }

    private adjustAlign(nowIdx:number, teamIdxs:number[], totalNodes:HTMLCollectionOf<HTMLElement>, mainNode:HTMLElement): null {
        // 递归结束
        if (nowIdx < 0) return null;
        let distance = 0;
        const firstNodeOffset = totalNodes[teamIdxs[0]].offsetTop;
        const firstNodeHeisht = totalNodes[teamIdxs[0]].scrollHeight;
        const lastNodeOffset = totalNodes[teamIdxs[teamIdxs.length - 1]].offsetTop;
        const lastNodeHeight = totalNodes[teamIdxs[teamIdxs.length - 1]].scrollHeight;

        // 如果和前一个元素相接就合并;
        if (teamIdxs[0]) {
            const prevMargin = parseFloat(getComputedStyle(totalNodes[teamIdxs[0]-1]).getPropertyValue("margin-bottom"));
            const prevNodeOffset = totalNodes[teamIdxs[0]-1].offsetTop + totalNodes[teamIdxs[0]-1].scrollHeight;
            // 可以容许的最大移动路径
            distance = firstNodeOffset - (prevNodeOffset + prevMargin);
            if (!distance) {
                if (isDev) this.logger.info("检测到相接，进行下一次递归, detail=>", {prevMargin, prevNodeOffset});
                return this.adjustAlign(nowIdx-1, [teamIdxs[0]-1, ...teamIdxs], totalNodes, mainNode);
            }
        } else distance = firstNodeOffset;
        if (isDev) this.logger.info("节点初始计算, detail=>", {nowIdx, teamIdxs, firstNodeOffset, firstNodeHeisht, lastNodeOffset, lastNodeHeight, distance});
        // 如果没有可以和前面合并的就进行处理
        // 如果判断了合并之后仍然只有一个节点那就直接进行下一个
        if (teamIdxs.length == 1) return this.adjustAlign(nowIdx-1 , [nowIdx-1], totalNodes, mainNode);
        // 此时已经获得了完整的组合，开始进行整体调整
        const blocks = teamIdxs.map(idx => {
            const id  = totalNodes[idx].dataset.nodeId;
            const node = mainNode.querySelector(`div[data-node-id="${id}"]`) as HTMLElement;
            return {
                node,
                offset: this.getRelatedTop(mainNode, node),
                height: node.scrollHeight
            };
        }).sort((a,b) => a.offset-b.offset);
        if (isDev) this.logger.info("获得对应blocks=>", blocks);
        // 块的加权中心
        // const blocksCenter = blocks.reduce((sum, block) => {return sum + this.getRelatedTop(mainNode, block) + block.scrollHeight / 2;}, 0) / blocks.length;
        // 块的几何中心
        const blocksCenter = (blocks[blocks.length-1].offset + blocks[blocks.length-1].height + blocks[0].offset)/2;
        const memoCenter = (firstNodeOffset + lastNodeOffset + lastNodeHeight) / 2;
        const offset = Math.min(distance, memoCenter - blocksCenter);
        const topOffset = parseFloat(totalNodes[teamIdxs[0]].style.top) - offset;
        if (isDev) this.logger.info("移动块整体到新位置, detail=>", {blocksCenter, memoCenter, offset, topOffset});
        teamIdxs.forEach(idx => {
            totalNodes[idx].style.top = `${topOffset}px`;
        });
        // 如果移动了最大距离说明和前面的又拼一起了
        if (nowIdx && offset == distance) {
            if (isDev) this.logger.info("移动后相接，进行下一次递归");
            return this.adjustAlign(nowIdx-1, [teamIdxs[0]-1, ...teamIdxs], totalNodes, mainNode);
        }
        else return this.adjustAlign(nowIdx-1, [nowIdx-1], totalNodes, mainNode);
    }

    private async refreshEditor() {
        const mainNodes = this.editorNode.querySelectorAll("div.protyle-wysiwyg") as NodeListOf<HTMLElement>;
        if (isDev) this.logger.info("获取mainNode=>", mainNodes);
        // if (!this.checkElementChanged(mainNodes)) return;
        const changeList = Object.assign({}, this.mainNodeObservers);
        const pList:Promise<any>[] = [];
        let close = false;
        mainNodes.forEach(mainNode => {
            const mainNodeID = this.getMainNodeID(mainNode);
            if (isDev) this.logger.info("等待数据加载完成...");
            // 记录产生变化的观测器
            if (changeList[mainNodeID]) delete changeList[mainNodeID];
            const sidebar = this.addSideBar(mainNode);
            pList.push(this.waitForDataLoading(mainNode).then(async () => {
                if (isDev) this.logger.info("数据加载完成");
                // 如果不满足生成sidebar的条件就不生成了
                if (!sidebar) {close = true; return;}
                setTimeout(() => { this.refreshSideBarMemos(mainNode, sidebar);}, 0);
                // 没有观测器就加入观测器
                let observer = this.mainNodeObservers[mainNodeID];
                if (!observer) {
                    if (isDev) this.logger.info(`向${mainNodeID}中加入mainNodeObserver`);
                    observer = new MutationObserver(this.handleMainNode.bind(this));
                    this.mainNodeObservers[mainNodeID] = observer;
                } else {
                    observer.disconnect();
                }
                (observer as any).mainNode = mainNode;
                (observer as any).sidebar = sidebar;
                observer.observe(mainNode, {childList:true, subtree:true});
                let attrObserver = this.mainNodeAttrObserver[mainNodeID];
                if (!attrObserver) {
                    if (isDev) this.logger.info(`向${mainNodeID}中加入mainNodeAttrObserver`);
                    attrObserver = new MutationObserver(this.handleMainNodeAttr.bind(this));
                    this.mainNodeAttrObserver[mainNodeID] = attrObserver;
                } else {
                    attrObserver.disconnect();
                }
                attrObserver.observe(mainNode, {attributes: true});
                (attrObserver as any).mainNode = mainNode;
                (attrObserver as any).sidebar = sidebar;
                // 监听protyle的切换，切换到哪个protyle就刷新哪个
                let protyleObserver = this.protyleObservers[mainNodeID];
                if (!protyleObserver) {
                    if (isDev) this.logger.info(`向${mainNodeID}中加入mainNodeObserver`);
                    protyleObserver = new MutationObserver(this.handelProtyleNodeAttr.bind(this));
                    this.protyleObservers[mainNodeID] = protyleObserver;
                } else {
                    protyleObserver.disconnect();
                }
                (protyleObserver as any).mainNode = mainNode;
                (protyleObserver as any).sidebar = sidebar;
                protyleObserver.observe(mainNode.parentElement.parentElement, {attributes:true});
            }));
        });
        await Promise.all(pList);
        // 清除多余的观测器
        Object.keys(changeList).forEach(id => {
            this.mainNodeObservers[id]?.disconnect();
            this.mainNodeAttrObserver[id]?.disconnect();
            this.protyleObservers[id]?.disconnect();
            this.memoObservers[id]?.forEach(observer => {
                observer.disconnect();
            });
            delete this.mainNodeObservers[id];
            delete this.mainNodeAttrObserver[id];
            delete this.protyleObservers[id];
            delete this.memoObservers[id];
        });
        if (close) {
            this.openSideBar(false);
        }
    }

    private refreshSideBarMemos(mainNode:HTMLElement, sidebar:HTMLElement) {
        const memoNodes = mainNode.querySelectorAll("span[data-type*=\"inline-memo\"]") as NodeListOf<HTMLElement>;
        const mergedMemoNodes = this.getMergedMemos(memoNodes);
        const container = document.createElement("div");
        const indexs:Indexs = {};
        const mainNodeID = this.getMainNodeID(mainNode);
        this.memoObservers[mainNodeID]?.forEach(observer => {observer.disconnect();});
        this.memoObservers[mainNodeID] = [];
        memoNodes.forEach((memo: HTMLElement) => {
            const observer = new MutationObserver(this.handleMemoNode.bind(this));
            observer.observe(memo, {attributes: true});
            (observer as any).mainNode = mainNode;
            (observer as any).sidebar = sidebar;
            this.memoObservers[mainNodeID].push(observer);
        });
        mergedMemoNodes.forEach(memo => {
            const block = memo.block;
            const node_id  = block.dataset.nodeId;
            if (!indexs[node_id]) {
                indexs[node_id] = {};
                const nodeContainer = document.createElement("div");
                indexs[node_id].node = block;
                nodeContainer.style.margin = "16px 8px";
                nodeContainer.style.position = "relative";
                nodeContainer.id = `protyle-sidebar-memo-${node_id}`;
                nodeContainer.setAttribute("data-node-id", node_id);
                indexs[node_id].container = nodeContainer;
            }
            const memoElement = document.createElement("div");
            const idx = indexs[node_id].container.children.length;
            memoElement.id = `protyle-sidebar-memo-${node_id}-${idx}`;
            memoElement.setAttribute("data-node-index", idx.toString());
            memoElement.style.cssText = "padding:8px;margin:8px;border-radius:6px;font-size:80%;box-shadow: rgb(15 15 15 / 10%) 0px 0px 0px 1px, rgb(15 15 15 / 10%) 0px 2px 4px;";
            const content = memo.memo;
            const originText = memo.totalContent;
            memoElement.innerHTML = `<div data-content-type="number" style="display:inline-block;">${idx+1}</div><div data-content-type="text" style="display:inline-block;font-weight:700;user-select:text;">${originText}</div><div data-content-type="memo" style="margin:8px 0 0 0;word-wrap:break-word;user-select:text;white-space:pre-line">${content}</div>`;
            indexs[node_id].container.insertAdjacentElement("beforeend", memoElement);
        });
        Object.keys(indexs).forEach( id => {
            const nodeContainer = indexs[id].container;
            container.insertAdjacentElement("beforeend", nodeContainer);
        });
        sidebar.innerHTML = container.innerHTML;
        this.refreshMemoOffset(mainNode, sidebar, indexs);
    }

    private refreshMemoOffset(mainNode:HTMLElement, sidebar:HTMLElement, indexs:Indexs) {
        const alignCenter = this.alignCenter;
        Object.keys(indexs).reduce((prv, id) => {
            const item = sidebar.querySelector(`div[data-node-id="${id}"]`) as HTMLElement;
            const block = mainNode.querySelector(`div[data-node-id="${id}"]`) as HTMLElement;
            let offsetHeight = this.getRelatedTop(mainNode, block);
            offsetHeight += alignCenter ? this.getCenterOffset(block, item) : 0;
            offsetHeight -= Math.min(item.offsetTop, offsetHeight - prv.elemOffset);
            this.logger.info("节点offset初始化, detail=>", {mainNode, sidebar, item, block, offsetHeight, blockOffset: this.getRelatedTop(mainNode, block)});
            item.style.top = `${offsetHeight}px`;
            return {elemOffset: offsetHeight};
        }, {elemOffset: 0});
        const totalNodes = sidebar.children as HTMLCollectionOf<HTMLElement>;
        if (alignCenter) this.adjustAlign(totalNodes.length - 1, [totalNodes.length - 1], totalNodes, mainNode);
    }

    private getBlockNode(sourceNode:HTMLElement) {
        let node = sourceNode;
        while (!node.dataset.nodeId) {
            node = node.parentElement;
        }
        return node;
    }

    private getCenterOffset(block:HTMLElement, item:HTMLElement) {
        return block.scrollHeight / 2 - item.scrollHeight / 2;
    }

    private getMainNodeID(mainNode: HTMLElement) {
        return mainNode.parentElement.parentElement.getAttribute("data-id");
    }

    private getMergedMemos(memoNodes: NodeListOf<HTMLElement>): MergedMemo[] {
        const mergedRes:MergedMemo[] = [];
        memoNodes.forEach((memo, idx) => {
            const block = this.getBlockNode(memo);
            const memoContent = memo.getAttribute("data-inline-memo-content");
            if (idx) {
                const lastMerged = mergedRes[mergedRes.length-1];
                const lastIndex = lastMerged.originIndexs[lastMerged.originIndexs.length-1];
                if (memoNodes[lastIndex].nextSibling == memo 
                    && block == lastMerged.block
                    && lastMerged.memo == memoContent) {
                    lastMerged.totalContent += memo.textContent;
                    lastMerged.originIndexs.push(idx);
                    return;
                }
            }
            mergedRes.push({
                block,
                totalContent: memo.textContent,
                memo: memoContent,
                originIndexs: [idx]
            });
        });
        if (isDev) this.logger.info("获得合并memo=>", mergedRes);
        return mergedRes;
    }

    private getRelatedTop(parentNode:HTMLElement, targetNode:HTMLElement) {
        return targetNode.getBoundingClientRect().y - parentNode.getBoundingClientRect().y;
    }

    private async waitForDataLoading(mainNode: HTMLElement, check=false) {
        // 只有全宽模式要改变宽度，所以只有全宽模式要等待
        const fullwidth = mainNode.parentElement.dataset.fullwidth;
        if (isDev) this.logger.info(`检测到${fullwidth ? "是" : "不是" }全宽模式`);
        if (!fullwidth && !check) return await sleep(100);
        let i = 0;
        const originSize = Object.assign({}, getComputedStyle(mainNode));
        await sleep(50);
        let ready = (originSize.padding != getComputedStyle(mainNode).padding || originSize.width != getComputedStyle(mainNode).width);
        while (!ready) {
            ready = (originSize.padding != getComputedStyle(mainNode).padding || originSize.width != getComputedStyle(mainNode).width);
            // console.log("origin", originSize.padding, originSize.width);
            // console.log("now", getComputedStyle(mainNode).padding, getComputedStyle(mainNode).width);
            await sleep(50);
            i += 1;
            if (i == 5) break;
        }
        let former = {padding: "", width: ""};
        ready = (former.padding == getComputedStyle(mainNode).padding && former.width == getComputedStyle(mainNode).width);
        while (!ready) {
            former = Object.assign({}, getComputedStyle(mainNode));
            await sleep(100);
            ready = (former.padding == getComputedStyle(mainNode).padding && former.width == getComputedStyle(mainNode).width);
            // console.log("former", former.padding, former.width);
            // console.log("now", getComputedStyle(mainNode).padding, getComputedStyle(mainNode).width);
            i += 1;
            if (i == 10) break;
        }
    }
}
