[中文](https://github.com/WingDr/siyuan-plugin-sidebar-memo/blob/main/README_zh_CN.md)

# Sidebar Memo

> Display your memos in the sidebar

## Usage

After installing the plugin, you can open the sidebar display by clicking on the "Sidebar Memo" button in the top bar and selecting "Toggle Sidebar Memo Display". Clicking again will close it.

## Theme Compatibility / Customizing Memo Styles

Most of the memo styles are set using CSS variables. Here's the specific code:

```CSS
.layout__center {
	--sidebar-memo-number-height: 18px;
	--sidebar-memo-number-width: 4px;
	--sidebar-memo-number-border-radius: 50px;
	--sidebar-memo-number-margin-right: 6px;
	--sidebar-memo-number-color: transparent;
	--sidebar-memo-number-background-color: var(--b3-theme-primary);
	--sidebar-memo-number-not-only-child-width: 18px;
	--sidebar-memo-number-not-only-child-color: var(--b3-theme-background);
	--sidebar-memo-editor-padding-right: 250px;
	--sidebar-memo-sidebar-right: -80px;
	--sidebar-memo-text-max-width: 150px;
}
```

In the above code:

```CSS
--sidebar-memo-number-* : Style of the memo number within each memo block when there are multiple memos within the same block.
--sidebar-memo-number-not-only-child-* : Style of the memo number when there is only one memo within a block.
--sidebar-memo-text-* : Text style of the sidebar memo.
--sidebar-memo-editor-* : Editor style when the SiYuan editor is set to "Adaptive Width" and the sidebar memo is expanded.
--sidebar-memo-sidebar-* : Style of the sidebar memo when the SiYuan editor is set to "Adaptive Width".
```