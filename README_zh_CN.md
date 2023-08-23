[English](https://github.com/WingDr/siyuan-plugin-sidebar-memo/blob/main/README.md)

# 侧边备注

## 使用方法

安装插件后，通过`顶栏“侧边备注”按钮->“打开备注的侧边显示”`即可打开侧边显示，再按一次就是关闭（此时按钮文本为`“关闭备注的侧边显示”`）。

## 不显示侧边栏的原因

1. 检查思源笔记的窗口宽度是否足够大，目前小于500px的窗口宽度就不会显示侧边栏。
2. 检查笔记编辑器的右侧空白是否足够大，右侧空白小于250px就不会显示侧边栏。

## 主题适配/备注样式修改

备注的大部分样式都是通过CSS变量设定的，具体代码如下：

```CSS
.layout__center{
	--sidebar-memo-number-height: 18px;
	--sidebar-memo-number-width: 4px;
	--sidebar-memo-number-border-radius: 50px;
	--sidebar-memo-number-margin-right:6px;
	--sidebar-memo-number-color:transparent;
	--sidebar-memo-number-background-color:var(--b3-theme-primary);
	--sidebar-memo-number-not-only-child-width:18px;
	--sidebar-memo-number-not-only-child-color:var(--b3-theme-background);
	--sidebar-memo-editor-padding-right: 280px;
	--sidebar-memo-sidebar-right: -50px;
	--sidebar-memo-text-max-width: 150px;
}
```

其中，
```CSS
--sidebar-memo-number-* ：当同一个块中有多个备注时，每个备注的块内编号的样式。
--sidebar-memo-number-not-only-child-* ：当一个块中只有一个备注时编号的样式。
--sidebar-memo-text-* ：侧边备注的文本样式
--sidebar-memo-editor-* ：思源编辑器打开“自适应宽度”后，展开侧边备注时的编辑器样式
--sidebar-memo-sidebar-* ：思源编辑器打开“自适应宽度”后，侧边备注的样式
```

## 致谢

感谢[Roy](https://github.com/royc01)写的默认样式。

感谢“思源笔记折腾群”的想法、技术与调试支持。