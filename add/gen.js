const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

// 配置文件路径
const CONFIG = {
    XML_FILE: path.join(__dirname, 'dat.xml'),
    DRIVERLIST_FILE: path.join(__dirname, '../src/dep/generated/driverlist.h'),
    PGM_FILE: path.join(__dirname, '../src/burn/drv/pgm/d_pgm.cpp'),
    NEOGEO_FILE: path.join(__dirname, '../src/burn/drv/neogeo/d_neogeo.cpp')
};

// 解析XML文件
function parseXML() {
    try {
        const xmlContent = fs.readFileSync(CONFIG.XML_FILE, 'utf8');
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        const machines = doc.getElementsByTagName('machine');
        const machineData = [];
        
        for (let i = 0; i < machines.length; i++) {
            const machine = machines[i];
            const name = machine.getAttribute('name');
            const romof = machine.getAttribute('romof');
            const sourcefile = machine.getAttribute('sourcefile');
            
            // 获取description
            const descElements = machine.getElementsByTagName('description');
            const description = descElements.length > 0 ? descElements[0].textContent : name;
            
            // 获取year
            const yearElements = machine.getElementsByTagName('year');
            const year = yearElements.length > 0 ? yearElements[0].textContent : '????';
            
            // 获取manufacturer
            const mfgElements = machine.getElementsByTagName('manufacturer');
            const manufacturer = mfgElements.length > 0 ? mfgElements[0].textContent : '????';
            
            // 获取ROM信息
            const roms = machine.getElementsByTagName('rom');
            const romInfo = [];
            for (let j = 0; j < roms.length; j++) {
                const rom = roms[j];
                romInfo.push({
                    name: rom.getAttribute('name'),
                    size: rom.getAttribute('size'),
                    crc: rom.getAttribute('crc')
                });
            }
            
            machineData.push({
                name,
                romof,
                sourcefile,
                description,
                year,
                manufacturer,
                roms: romInfo
            });
        }
        
        return machineData;
    } catch (error) {
        console.error('解析XML文件失败:', error);
        return [];
    }
}

// 生成驱动列表条目
function generateDriverListEntries(machines) {
    const entries = [];
    
    machines.forEach(machine => {
        entries.push(`DRV\t\tBurnDrv${machine.name};`);
    });
    
    return entries;
}

// 生成PGM代码
function generatePGMCode(machine) {
    const name = machine.name;
    const description = machine.description;
    const year = machine.year;
    const manufacturer = machine.manufacturer;
    
    // 生成DIP信息
    const dipInfo = `static struct BurnDIPInfo ${name}DIPList[] = {
	{0x2E,	0xFF, 0xFF,	0x04, NULL								},

	{0,		0xFE, 0,	6,    "Region (Fake)"					},
	{0x2E,	0x01, 0x0F,	0x00, "China"							},
	{0x2E,	0x01, 0x0F,	0x01, "Taiwan"							},
	{0x2E,	0x01, 0x0F,	0x02, "Japan"							},
	{0x2E,	0x01, 0x0F,	0x03, "Korea"							},
	{0x2E,	0x01, 0x0F,	0x04, "Hong Kong"						},
	{0x2E,	0x01, 0x0F,	0x05, "World"							},
};

STDDIPINFOEXT(${name},\t\tpgm, ${name})`;

    // 生成ROM信息
    let romDesc = `static struct BurnRomInfo ${name}RomDesc[] = {\n`;
    machine.roms.forEach((rom, index) => {
        const size = parseInt(rom.size);
        const crc = rom.crc;
        let type = '';
        
        // 根据ROM名称确定类型
        if (rom.name.includes('.p') || rom.name.includes('_p')) {
            type = '1 | BRF_PRG | BRF_ESS';
        } else if (rom.name.includes('.t') || rom.name.includes('_t')) {
            type = '2 | BRF_GRA';
        } else if (rom.name.includes('.a') || rom.name.includes('_a')) {
            type = '3 | BRF_GRA';
        } else if (rom.name.includes('.b') || rom.name.includes('_b')) {
            type = '4 | BRF_GRA';
        } else if (rom.name.includes('.m') || rom.name.includes('_m')) {
            type = '5 | BRF_SND';
        } else {
            type = '1 | BRF_PRG | BRF_ESS';
        }
        
        romDesc += `\t{ "${rom.name}",\t\t\t\t0x${size.toString(16).padStart(7, '0')}, 0x${crc}, ${type} },\t//  ${index} \n`;
    });
    romDesc += `};

STDROMPICKEXT(${name}, ${name}, pgm)
STD_ROM_FN(${name})`;

    // 生成BurnDriver结构
    const burnDriver = `struct BurnDriver BurnDrv${name} = {
\t"${name}", NULL, "pgm", NULL, "${year}",
\t"${description}\\0", NULL, "${manufacturer}", "PolyGame Master",
\tNULL, NULL, NULL, NULL,
\tBDF_GAME_WORKING, 4, HARDWARE_IGS_PGM, GBF_SCRFIGHT, 0,
\tNULL, ${name}RomInfo, ${name}RomName, NULL, NULL, NULL, NULL, pgmInputInfo, ${name}DIPInfo,
\tpgmInit, pgmExit, pgmFrame, pgmDraw, pgmScan, &nPgmPalRecalc, 0x900,
\t448, 224, 4, 3
};`;

    return {
        dipInfo,
        romDesc,
        burnDriver
    };
}

// 生成NeoGeo代码
function generateNeoGeoCode(machine) {
    const name = machine.name;
    const description = machine.description;
    const year = machine.year;
    const manufacturer = machine.manufacturer;
    
    // 生成DIP信息
    const dipInfo = `static struct BurnDIPInfo ${name}DIPList[] = {
\t{0x19,\t0xF0, 0x00,\t0x00, NULL},

\t{0x00,\t0xFF, 0xFF,\t0x00, NULL}, // DIP 1
\t{0x01,\t0xFF, 0x7F,\t0x00, NULL}, // DIP 2
\t{0x02,\t0xFF, 0xFF,\t0x86, NULL}, // System
\t{0x08,\t0xFF, 0xFF,\t0x00, NULL}, // Fake DIP (Overscan)

\t{0,\t\t0xFE, 0,\t2,\t  "Setting mode"},
\t{0x00,\t0x01, 0x01,\t0x00, "Off"},
\t{0x00,\t0x01, 0x01,\t0x01, "On"},
};

STDDIPINFOEXT(${name},\t\tneogeo, ${name})`;

    // 生成ROM信息
    let romDesc = `static struct BurnRomInfo ${name}RomDesc[] = {\n`;
    machine.roms.forEach((rom, index) => {
        const size = parseInt(rom.size);
        const crc = rom.crc;
        let type = '';
        let comment = '';
        
        // 根据ROM名称确定类型和注释
        if (rom.name.includes('.p') || rom.name.includes('-p')) {
            type = '1 | BRF_ESS | BRF_PRG';
            comment = '68K code';
        } else if (rom.name.includes('.s') || rom.name.includes('-s')) {
            type = '2 | BRF_GRA';
            comment = 'Text layer tiles';
        } else if (rom.name.includes('.c') || rom.name.includes('-c')) {
            type = '3 | BRF_GRA';
            comment = 'Sprite data';
        } else if (rom.name.includes('.m') || rom.name.includes('-m')) {
            type = '4 | BRF_ESS | BRF_PRG';
            comment = 'Z80 code';
        } else if (rom.name.includes('.v') || rom.name.includes('-v')) {
            type = '5 | BRF_SND';
            comment = 'Sound data';
        } else if (rom.name.includes('_c') || rom.name.endsWith('.rom')) {
            // kof97_c1.rom 等类型
            if (rom.name.includes('_c')) {
                type = '3 | BRF_GRA';
                comment = 'Sprite data';
            } else if (rom.name.includes('_p')) {
                type = '1 | BRF_ESS | BRF_PRG';
                comment = '68K code';
            } else if (rom.name.includes('_s')) {
                type = '2 | BRF_GRA';
                comment = 'Text layer tiles';
            } else if (rom.name.includes('_m')) {
                type = '4 | BRF_ESS | BRF_PRG';
                comment = 'Z80 code';
            } else if (rom.name.includes('_v')) {
                type = '5 | BRF_SND';
                comment = 'Sound data';
            } else {
                type = '1 | BRF_ESS | BRF_PRG';
                comment = '68K code';
            }
        } else {
            type = '1 | BRF_ESS | BRF_PRG';
            comment = '68K code';
        }
        
        romDesc += `\t{ "${rom.name}",    0x${size.toString(16).padStart(6, '0')}, 0x${crc}, ${type} }, //  ${index} ${comment}\n`;
    });
    romDesc += `};

STDROMPICKEXT(${name}, ${name}, neogeo)
STD_ROM_FN(${name})`;

    // 生成BurnDriver结构
    const burnDriver = `struct BurnDriver BurnDrv${name} = {
\t"${name}", NULL, "neogeo", NULL, "${year}",
\t"${description}\\0", NULL, "${manufacturer}", "Neo Geo MVS",
\tNULL, NULL, NULL, NULL,
\tBDF_GAME_WORKING, 2, HARDWARE_PREFIX_CARTRIDGE | HARDWARE_SNK_NEOGEO, GBF_VSFIGHT, 0,
\tNULL, ${name}RomInfo, ${name}RomName, NULL, NULL, NULL, NULL, neogeoInputInfo, ${name}DIPInfo,
\tNeoInit, NeoExit, NeoFrame, NeoRender, NeoScan, &NeoRecalcPalette,
\t0x1000, 304, 224, 4, 3
};`;

    return {
        dipInfo,
        romDesc,
        burnDriver
    };
}

// 主函数
function main() {
    console.log('开始解析XML文件...');
    const machines = parseXML();
    
    if (machines.length === 0) {
        console.log('没有找到machine节点');
        return;
    }
    
    console.log(`找到 ${machines.length} 个machine节点`);
    
    // 询问用户是否要实际插入代码
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('是否要将代码插入到实际文件中？(y/N): ', (answer) => {
        const shouldInsert = answer.toLowerCase() === 'y';
        
        if (shouldInsert) {
            console.log('开始插入代码到文件...');
            
            // 插入到driverlist.h
            console.log('插入驱动列表条目...');
            insertDriverListEntries(machines);
            
            // 为每个machine生成并插入代码
            machines.forEach(machine => {
                console.log(`处理游戏: ${machine.name} (${machine.sourcefile})`);
                
                if (machine.sourcefile.includes('pgm/d_pgm.cpp')) {
                    const pgmCode = generatePGMCode(machine);
                    insertPGMCode(machine, pgmCode);
                } else if (machine.sourcefile.includes('neogeo/d_neogeo.cpp')) {
                    const neoGeoCode = generateNeoGeoCode(machine);
                    insertNeoGeoCode(machine, neoGeoCode);
                }
            });
            
            console.log('代码插入完成！');
        } else {
            console.log('仅显示生成的代码，不插入文件：');
            
            // 生成驱动列表条目
            const driverEntries = generateDriverListEntries(machines);
            
            // 为每个machine生成代码
            machines.forEach(machine => {
                console.log(`\n处理游戏: ${machine.name} (${machine.sourcefile})`);
                
                if (machine.sourcefile.includes('pgm/d_pgm.cpp')) {
                    const pgmCode = generatePGMCode(machine);
                    console.log(`生成PGM代码 for ${machine.name}:`);
                    console.log('DIP信息:', pgmCode.dipInfo);
                    console.log('ROM描述:', pgmCode.romDesc);
                    console.log('驱动结构:', pgmCode.burnDriver);
                    console.log('---');
                } else if (machine.sourcefile.includes('neogeo/d_neogeo.cpp')) {
                    const neoGeoCode = generateNeoGeoCode(machine);
                    console.log(`生成NeoGeo代码 for ${machine.name}:`);
                    console.log('DIP信息:', neoGeoCode.dipInfo);
                    console.log('ROM描述:', neoGeoCode.romDesc);
                    console.log('驱动结构:', neoGeoCode.burnDriver);
                    console.log('---');
                }
            });
            
            // 输出驱动列表条目
            console.log('\n驱动列表条目:');
            driverEntries.forEach(entry => console.log(entry));
        }
        
        rl.close();
    });
}

// 插入代码到文件
function insertCodeToFile(filePath, code, insertPoint) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 找到插入点
        const insertIndex = content.lastIndexOf(insertPoint);
        if (insertIndex === -1) {
            console.error(`在文件 ${filePath} 中找不到插入点: ${insertPoint}`);
            return false;
        }
        
        // 插入代码
        const beforeInsert = content.substring(0, insertIndex);
        const afterInsert = content.substring(insertIndex);
        
        const newContent = beforeInsert + code + '\n\n' + afterInsert;
        
        // 写回文件
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`成功插入代码到 ${filePath}`);
        return true;
    } catch (error) {
        console.error(`插入代码到 ${filePath} 失败:`, error);
        return false;
    }
}

// 插入到driverlist.h
function insertDriverListEntries(machines) {
    try {
        let content = fs.readFileSync(CONFIG.DRIVERLIST_FILE, 'utf8');
        let modified = false;
        
        machines.forEach(machine => {
            // 1. 添加DRV声明 - 在最后一个DRV声明前插入
            const drvDeclaration = `DRV\t\tBurnDrv${machine.name};`;
            const drvInsertPoint = 'DRV\t\tBurnDrvZzyzzyxx2;';
            const drvInsertIndex = content.indexOf(drvInsertPoint);
            if (drvInsertIndex !== -1) {
                content = content.substring(0, drvInsertIndex) + drvDeclaration + '\n' + content.substring(drvInsertIndex);
                modified = true;
                console.log(`添加DRV声明: ${drvDeclaration}`);
            }
            
            // 2. 添加到pDriver数组 - 在倒数第二个条目后插入
            const pDriverEntry = `\t&BurnDrv${machine.name},\t\t\t// ${machine.description}`;
            const pDriverArrayEnd = '&BurnDrvZzyzzyxx2,';
            const pDriverInsertIndex = content.indexOf(pDriverArrayEnd);
            if (pDriverInsertIndex !== -1) {
                content = content.substring(0, pDriverInsertIndex) + pDriverEntry + '\n\t' + content.substring(pDriverInsertIndex);
                modified = true;
                console.log(`添加到pDriver数组: ${pDriverEntry}`);
            }
            
            // 3. 添加到sourcefile_table - 在 { "\0", "\0"} 之前插入
            const sourcefileEntry = `\t{ "${machine.name}", "${machine.sourcefile}"},`;
            const sourcefileInsertPoint = '{ "\\0", "\\0"}';
            content.replace(sourcefileInsertPoint, sourcefileEntry + '\n' + sourcefileInsertPoint);
        });
        
        if (modified) {
            fs.writeFileSync(CONFIG.DRIVERLIST_FILE, content, 'utf8');
            console.log('成功更新 driverlist.h');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('更新 driverlist.h 失败:', error);
        return false;
    }
}

// 插入PGM代码
function insertPGMCode(machine, code) {
    const insertPoint = 'struct BurnDriver BurnDrv';
    const fullCode = `// ${machine.description}

${code.dipInfo[0].toUpperCase() + code.dipInfo.slice(1)}

${code.romDesc}

${code.burnDriver}

`;
    return insertCodeToFile(CONFIG.PGM_FILE, fullCode, insertPoint);
}

// 插入NeoGeo代码
function insertNeoGeoCode(machine, code) {
    const insertPoint = 'struct BurnDriver BurnDrv';
    const fullCode = `// ${machine.description}

${code.dipInfo[0].toUpperCase() + code.dipInfo.slice(1)}

${code.romDesc}

${code.burnDriver}

`;
    return insertCodeToFile(CONFIG.NEOGEO_FILE, fullCode, insertPoint);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    parseXML,
    generateDriverListEntries,
    generatePGMCode,
    generateNeoGeoCode,
    insertCodeToFile,
    insertDriverListEntries,
    insertPGMCode,
    insertNeoGeoCode
};
