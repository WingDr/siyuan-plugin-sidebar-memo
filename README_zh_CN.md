[English](https://github.com/WingDr/siyuan-plugin-sidebar-memo/blob/main/README.md)

# 侧边备注

> 让你的备注再侧边显示

## 使用方法

安装插件后，通过`顶栏“侧边备注”按钮->“切换备注的侧边显示”`即可打开侧边显示，再按一次就是关闭。

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
	--sidebar-memo-editor-padding-right: 250px;
	--sidebar-memo-sidebar-right: -80px;
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