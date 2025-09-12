# 写一个脚本

读取add/dat.xml的machine节点

## 工作

### 解析xml成json

### 生成代码

1、根据machine name、sourcefile属性，在src/dep/generated/driverlist.h下插入DRV BurnDrv{name}、&BurnDrv{name}、{ "{name}", "{sourcefile}"}
2、根据machine的属性和子节点。
2.1如sourcefile=是pgm/d_pgm.cpp，则在src/burn/drv/pgm/d_pgm.cpp下插入static struct BurnDIPInfo {name}DIPList[]、STDDIPINFOEXT({name},		pgm, {name})、static struct BurnRomInfo {name}RomDesc[]、STDROMPICKEXT({name}, {name}, pgm)、STD_ROM_FN({name})、struct BurnDriver BurnDrv{name}
2.2如sourcefile=是pneogeo/d_neogeo.cpp，则在src/burn/drv/neogeo/d_neogeo.cpp下插入static struct BurnDIPInfo {name}DIPList[]、STDDIPINFOEXT({name},		neogeo, {name})、static struct BurnRomInfo {name}RomDesc[]、STDROMPICKEXT({name}, {name}, neogeo)、STD_ROM_FN({name})、struct BurnDriver BurnDrv{name}

### 具体的生成代码内容你需要参考现有的代码