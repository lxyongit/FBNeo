# FBNeo 游戏驱动代码生成器

这个脚本可以根据 `dat.xml` 文件中的 machine 节点自动生成 FBNeo 游戏驱动代码。

## 功能

- 解析 XML 文件中的 machine 节点
- 根据 sourcefile 属性判断游戏平台（PGM 或 NeoGeo）
- 自动生成相应的驱动代码结构：
  - DIP 开关信息 (`BurnDIPInfo`)
  - ROM 描述信息 (`BurnRomInfo`)
  - 驱动结构 (`BurnDriver`)
- 生成 driverlist.h 中的驱动声明
- 可选择性地将代码插入到实际文件中

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 准备 XML 文件

确保 `dat.xml` 文件存在并包含正确的 machine 节点。

### 3. 运行脚本

```bash
node gen.js
```

脚本会询问是否要将代码插入到实际文件中：
- 输入 `y` 或 `Y`: 将生成的代码插入到相应的源文件中
- 输入 `n` 或其他: 仅显示生成的代码，不修改文件

## 支持的平台

### PGM (PolyGame Master)
- 文件: `src/burn/drv/pgm/d_pgm.cpp`
- 生成标准的 PGM 驱动结构

### Neo Geo
- 文件: `src/burn/drv/neogeo/d_neogeo.cpp`
- 生成标准的 Neo Geo MVS 驱动结构

## ROM 类型识别

脚本会根据 ROM 文件名自动识别类型：

### NeoGeo ROM 类型
- `.p*` 或 `-p*`: 68K 程序代码
- `.s*` 或 `-s*`: 文本图层瓦片
- `.c*` 或 `-c*`: 精灵数据
- `.m*` 或 `-m*`: Z80 代码
- `.v*` 或 `-v*`: 音频数据

### PGM ROM 类型
- `.p*` 或 `_p*`: 68K 程序代码
- `.t*` 或 `_t*`: 瓦片数据
- `.a*` 或 `_a*`: 精灵颜色数据
- `.b*` 或 `_b*`: 精灵遮罩和颜色索引
- `.m*` 或 `_m*`: 音频数据

## 文件结构

```
add/
├── dat.xml          # 输入的 XML 数据文件
├── gen.js           # 主脚本文件
├── package.json     # npm 配置文件
└── README.md        # 说明文档
```

## 注意事项

1. 运行前请备份重要文件
2. 确保 XML 文件格式正确
3. 生成的代码可能需要手动调整以符合具体需求
4. 建议先选择不插入文件，检查生成的代码无误后再实际插入

## 示例 XML 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE datafile PUBLIC "-//Logiqx//DTD ROM Management Datafile//EN" "http://www.logiqx.com/Dats/datafile.dtd">
<datafile>
    <header>
        <name>Sample Games</name>
        <description>Sample game data</description>
    </header>
    <machine name="gamename" romof="parent" sourcefile="platform/d_platform.cpp">
        <description>Game Description</description>
        <year>1997</year>
        <manufacturer>Manufacturer Name</manufacturer>
        <rom name="rom1.p1" size="1048576" crc="12345678"/>
        <rom name="rom2.c1" size="8388608" crc="87654321"/>
        <!-- 更多 ROM 条目 -->
    </machine>
</datafile>
```
