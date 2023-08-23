[中文](https://github.com/WingDr/siyuan-plugin-sidebar-memo/blob/main/README_zh_CN.md)

# Sidebar Memo

## Usage Instructions

After installing the plugin, you can open the sidebar display by clicking on the "Sidebar Memo" button in the top bar and selecting "Open Sidebar Memos". Clicking again will close it (at this point, the button text will change to "Close Sidebar Memos").

## Reasons for Sidebar Not Displaying

1. Check if the window width of SiYuan Note is sufficiently large. The sidebar won't be displayed if the window width is less than 500px.
2. Ensure that the right-side blank space of the note editor is large enough. The sidebar won't be displayed if the right-side blank space is less than 250px.

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
	--sidebar-memo-editor-padding-right: 280px;
	--sidebar-memo-sidebar-right: -50px;
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

## Acknowledgments

Special thanks to [Roy](https://github.com/royc01) for contributing the default styles.

Thanks to the "SiYuan Note Enthusiast Group" for their ideas, technical support, and debugging assistance.