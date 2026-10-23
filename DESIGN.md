---
name: 高性价比人生
description: 完善后设计稿 V6 的原生微信小程序视觉语言
colors:
  bg: "#eff6ee"
  ink: "#173f36"
  muted: "#4f7064"
  mint: "#cee8dc"
  green: "#2e806b"
  coral: "#ed5b46"
  white: "#ffffff"
  coral-base: "#c74b36"
  secondary-base: "#c8ddce"
  tag-bg: "#dceee3"
  divider: "#d1e3d6"
  board-border: "#cfe2d4"
  start: "#f6d879"
  health: "#cb6868"
  protection: "#4e8995"
  resource-track: "#e3ecdf"
  disabled-ink: "#607169"
  disabled-bg: "#dce5dc"
typography:
  headline:
    fontSize: "46rpx"
    fontWeight: 750
    lineHeight: 1.4
    letterSpacing: "-1rpx"
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
  title:
    fontSize: "34rpx"
    fontWeight: 700
    lineHeight: 1.5
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
  body:
    fontSize: "28rpx"
    lineHeight: 1.65
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
  label:
    fontSize: "24rpx"
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
  resource-value:
    fontSize: "35rpx"
    fontWeight: 700
    lineHeight: 1.6
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
  board-title:
    fontSize: "44rpx"
    fontWeight: 750
    lineHeight: 1.4
    fontFamily: "-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
rounded:
  card: "36rpx"
  button: "40rpx"
  input: "28rpx"
  tile: "20rpx"
  tag: "10rpx"
  pill: "22rpx"
  track: "8rpx"
spacing:
  page-x: "38rpx"
  card-x: "28rpx"
  card-y: "38rpx"
  button-x: "20rpx"
  button-y: "26rpx"
  gap: "16rpx"
  board-gap: "10rpx"
  section: "24rpx"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "26rpx 20rpx"
    typography: "{typography.title}"
    width: "100%"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "26rpx 20rpx"
    typography: "{typography.title}"
    width: "100%"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "38rpx 28rpx"
  card-mint:
    backgroundColor: "{colors.mint}"
    rounded: "{rounded.card}"
    padding: "38rpx 28rpx"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "24rpx 28rpx"
    height: "100rpx"
    width: "100%"
  tag:
    backgroundColor: "{colors.tag-bg}"
    textColor: "{colors.green}"
    rounded: "{rounded.tag}"
    padding: "4rpx 15rpx"
  board-tile:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "16rpx 2rpx 8rpx"
  resource-bar:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "20rpx"
---

# Design System: 高性价比人生

## Overview

**Creative North Star: "完善后设计稿 V6"**

以用户选定的“完善后设计稿 V6”为视觉依据，以浅绿底、深绿字、薄荷信息卡与珊瑚主按钮承载生活取舍。原生微信导航环境与系统中文字体是这一方向的固有约束。

这份文档从现有 WXSS 与三个原生组件提取视觉语言，用于后续界面的延展；它记录实现事实，不构成真机、截图一致性或可访问性验收。

**Key Characteristics:**

- 浅绿背景与深绿文字形成基础层次。
- 薄荷卡片聚合信息，珊瑚按钮提示主要行动。
- 16 格顺时针棋盘是产品的识别图形。
- 尺寸以原生 rpx 为准，390×844 为设计目标。

## Colors

配色保持柔和的生活街区感；精确值以 frontmatter 为准。

### Primary

- **珊瑚红（coral）**用于主要行动与棋盘“你”的位置标记；coral-base 提供按钮底沿。
- **深绿（ink）**用于正文主色、标题及返回箭头。

### Secondary

- **薄荷绿（mint）**用于信息卡、已选选项与资产格背景。
- **行动绿（green）**用于链接、选中描边、进度及资产标记。

### Tertiary

- **起点黄（start）**标识棋盘起点；**健康红（health）**和**保障蓝（protection）**限于资源条含义。

### Neutral

- **浅绿底（bg）**覆盖页面、导航容器与弹窗。
- **柔绿字（muted）**承载说明、编号与辅助标签；**白色（white）**构成普通卡片、输入框及按钮文字。
- 其他 frontmatter 色值分别记录底沿、标签底色、细分隔、棋盘描边、资源轨道与禁用状态。

**The V6 Rule.** 延展界面沿用用户选定 V6 的色彩角色；资源语义色不替代主按钮色。

## Typography

**Display Font / Body Font:** 系统字体栈，按 frontmatter 顺序回退；不加载外部字体。

标题通过字号和字重建立层级。正文基础行高由页面定义；说明正文可采用已实现的 1.8，卡片说明采用 1.85。导航标题采用 34rpx、750 字重、1.4 行高；棋盘格名采用 25rpx、700 字重、1.4 行高。资源数值启用等宽数字，分母使用较小字号。

frontmatter 的 headline、title、body、label、resource-value 和 board-title 对应实际出现的字级；并非另行引入的字体方案。

## Layout

原生微信小程序以 390×844 为设计目标，尺寸保留 rpx。页面水平内边距使用 page-x，最大宽度 920rpx；底部操作区的内容最大宽度 844rpx，底部 padding 包含 env(safe-area-inset-bottom)。未从这些源码发现媒体查询断点。

棋盘使用相对定位容器与百分比定位的 5×5 外圈，中心占据中间 3×3，外圈形成 16 格路径；每格宽高占容器的 18.8%，格间距占 1.5%，整体通过百分比内边距保持 1.1 的宽高比。组件内部显式重置按钮宽度、边距和盒模型，不依赖全局样式穿透或 aspect-ratio 支持。资源条采用横向 Flex 四列，金钱列比例为 1.08，其余为 1，并设 min-width:0。以上为实现结构，未声明所有小屏尺寸均已真机验证。

导航组件从微信窗口与胶囊信息计算状态栏顶部、导航高度及右侧留白，并在页面尺寸变化时重新计算；返回按钮保留微信页面栈返回行为。页面与底部操作区保留安全区内边距，短屏通过页面纵向滚动展示完整内容。这里记录的是原生组件在微信导航环境中的适配策略。

## Elevation & Depth

卡片主要通过底色叠放区分层级，不带普通卡片阴影。主按钮有珊瑚底沿及轻投影，次按钮有柔绿底沿；骰子也有底沿。具体阴影保存在 sidecar。遮罩使用半透明深绿，覆盖层级为 30，底部操作区层级为 5。

## Shapes

卡片和弹窗使用 card 圆角，按钮使用 button 圆角，输入框使用 input 圆角。棋盘格及骰子采用 tile 圆角；当前位置以绿色边框和珊瑚圆形标识呈现。标签、胶囊选项和进度轨道分别采用 tag、pill、track 圆角。资源小图形由原生样式构成。

## Components

### Buttons

微信 `style: v2` 默认按钮规则的优先级高于单个类名。页面按钮通过 `.page .primary`、`.page .secondary`、`.page .link` 等选择器控制尺寸与外观；组件通过 `.board > .tile`、`.nav .back` 和 `.resources .explain` 覆盖默认规则。调整选择器时同步保留资产、起点、当前位置及禁用态的优先级。

主要行动使用珊瑚底白字与底沿；次要行动使用白底深绿字。二者全宽，文字允许换行。全局按下态为 opacity:.8 与向下位移 2rpx。禁用态使用 disabled-ink、disabled-bg，取消阴影并降低透明度；此处不推断未定义的 hover 或 focus 视觉。

### Cards / Containers

普通卡片白底、薄荷变体使用 mint，居中排版，间距和圆角见 frontmatter。资源条同样使用白色容器与 card 圆角，但采用更紧凑的 20rpx 内边距。

### Inputs / Fields

文本输入为白底深绿字，原生单行输入高度由 frontmatter 记录。多行输入沿用 input 圆角，高度为 280rpx。当前提取范围未定义独立的聚焦样式。

### Chips

静态标签使用 tag-bg 和 green；胶囊选项选中时采用 green 底白字。选项卡选中时采用薄荷背景与绿色边框。不要把这些状态理解为浏览器悬浮态。

### Navigation

导航标题与返回箭头置于浅绿容器，顶部及胶囊留白由微信 API 动态取得，使用系统字体；不另行绘制微信系统胶囊。

### Life Board

外圈白底普通格、薄荷资产格与黄色起点格以小号编号及较粗格名区分；当前位置增加绿色描边和珊瑚“你”标记。中心包含街区标题、顺时针说明与房屋图形。移动时显示骰子，旋转在负 8 至正 8 度之间往返，持续 .4s、ease-out、无限 alternate；没有提取到其他转场或减弱动画配置。

### Resource Bar

金钱、精力、健康、保障分为四列；资源数值使用深绿和等宽数字。精力轨道为 green，健康为 health，保障为 protection；进度背景使用 resource-track。数值说明为带下划线的原生按钮。

## Do's and Don'ts

### Do:

- **Do** 延续 V6 的浅绿、深绿、薄荷与珊瑚色角色。
- **Do** 使用原生微信组件、系统字体与安全区布局。
- **Do** 为棋盘保留 16 格顺时针路径和当前位置标识。
- **Do** 将源码提取、预览展示和真机验收明确区分。

### Don't:

- **Don't** 用网页运行时或外部字体替换用户确认的原生实现。
- **Don't** 将尚未检查的效果、交互状态或尺寸适配写成已验收。
- **Don't** 将资源条中的健康、保障颜色提升为全局主要行动色。
