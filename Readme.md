## 背景

某些老项目的Vue单文件行数过多，方法和逻辑很多，因而阅读起来很麻烦，所以很多方法的调用很难快速地理清楚；

## 需求

想知道某个方法在哪些地方被调用，或在哪个调用链上会被触发，这就有点类似Chrome调试工具中查看函数的调用栈；

## 方法

- 使用@vuedx/analyze包可以快速得到Vue文件的script部分以及标识符的位置等信息
- 使用acorn作为JS AST parser得到script部分的AST信息；
- 使用acorn-walk来遍历AST结构，提取methods声明的方法以及methods方法调用栈信息（静态）；
- 可使用echarts来可视化所有可能的调用关系图；
- 也可以输出一份bottom-up（自底向上） call tree信息，简洁明了；

## to do

- [ ] vscode插件化；
- [ ] call tree折叠查看；
- [ ] 点击函数名可以跳到相应的源码位置（@vuedx/analyze分析结果有）；
