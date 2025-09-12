// 测试脚本插入功能的简单测试文件
const { insertDriverListEntries, parseXML } = require('./gen.js');

// 创建一个简化的测试用例
function testInsertion() {
    console.log('开始测试插入功能...');
    
    // 解析现有的XML数据
    const machines = parseXML();
    
    if (machines.length === 0) {
        console.log('没有找到测试数据');
        return;
    }
    
    console.log(`找到 ${machines.length} 个测试游戏`);
    
    // 显示将要插入的条目
    machines.forEach(machine => {
        console.log(`\n游戏: ${machine.name}`);
        console.log(`  描述: ${machine.description}`);
        console.log(`  源文件: ${machine.sourcefile}`);
        console.log(`  DRV声明: DRV\t\tBurnDrv${machine.name};`);
        console.log(`  pDriver条目: \t&BurnDrv${machine.name},\t\t\t// ${machine.description}`);
        console.log(`  sourcefile条目: \t{ "${machine.name}", "${machine.sourcefile}"},`);
    });
    
    console.log('\n注意: 这只是显示测试，实际插入需要运行主脚本并选择 "y"');
}

if (require.main === module) {
    testInsertion();
}
