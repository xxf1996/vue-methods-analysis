const { createFullAnalyzer } = require('@vuedx/analyze');
const { promises: { readFile, writeFile } } = require('fs');
const acorn = require('acorn');
const walker = require('acorn-walk');
// const filePath = '/Users/xuefengxie/Desktop/project/onemap-fe/src/App.vue';
const filePath = '/Users/xuefengxie/Desktop/project/onemap-fe/src/views/project-management/rules/edit/components/RulesTable.vue';

/**
 * 导出为echart图数据
 * @param {Map<string, string>} methods 
 * @param {Map<string, Set<string>>} trigger 
 */
function exportEchartData (methods, trigger) {
  const nodes = []
  const edges = []
  methods.forEach(item => {
    nodes.push({
      name: item
    })
  })
  trigger.forEach((link, target) => {
    link.forEach(source => {
      edges.push({
        source,
        target,
      })
    }) // source -> target
  })
  return writeFile('./result.json', JSON.stringify({
    nodes,
    edges
  }, null, 2))
}

/**
 * 导出为bottom-up call tree结构
 * @param {Map<string, string>} methods 
 * @param {Map<string, Set<string>>} trigger 
 */
function exportCallTree (methods, trigger) {
  const callTree = {}
  const addCallTree = (source, paths) => {
    if (callTree[source]) {
      callTree[source].push(paths)
    } else {
      callTree[source] = [paths]
    }
  }
  const findCallTree = (source, target, paths) => {
    const up = trigger.get(target)
    if (up && up.size) {
      up.forEach(path => {
        findCallTree(source, path, [...paths, target])
      })
    } else {
      addCallTree(source, [...paths, target])
    }
  }
  methods.forEach(item => {
    const links = trigger.get(item)
    links && links.forEach(link => {
      findCallTree(item, link, [])
    })
  })

  return writeFile('./call-tree.json', JSON.stringify(callTree, null, 2))
}

const analyzer = createFullAnalyzer();
readFile(filePath).then((res) => {
  const sourceCode = res.toString();
  try {
    const info = analyzer.analyze(sourceCode, 'Test.vue');
    const script = `let data = ${info.options.properties.methods.loc.source}`;
    const ast = acorn.parse(script, {
      ecmaVersion: 'latest'
    });
    // walker.simple(ast, {
    //   Property(node) {
    //     console.log(node.type, node.value.type)
    //   },
    //   CallExpression(node) {
    //     const callee = node.callee
    //     if (callee.object && callee.object.type === 'ThisExpression') {
    //       console.log(node.type, callee.property)
    //     }
    //   },
    //   FunctionExpression(node) {
    //     console.log(node.type, node.parent)
    //   }
    // })
    const methods = new Set()
    const trigger = new Map()
    walker.ancestor(ast, {
      Property(node, ancestors) {
        // if (node.key.name === 'getHash') {
        //   console.log('方法层级：', ancestors.length)
        // }
        if (ancestors.length === 5) {
          methods.add(node.key.name)
        }
      }
    })
    walker.ancestor(ast, {
      CallExpression(node, ancestors) {
        const callee = node.callee
        if (callee.object && callee.object.type === 'ThisExpression') {
          const callName = callee.property.name
          if (!methods.has(callName)) return
          const bottomUp = ancestors.reverse()
          for (let i = 0; i < bottomUp.length; i++) {
            const cur = bottomUp[i]
            const parent = bottomUp[i + 1]
            if (cur.type === 'FunctionExpression' && parent.type === 'Property' && methods.has(parent.key.name)) {
              if (trigger.has(callName)) {
                const list = trigger.get(callName)
                list.add(parent.key.name)
              } else {
                const list = new Set()
                list.add(parent.key.name)
                trigger.set(callName, list)
              }
              break
            }
          }
        }
      }
    })
    exportEchartData(methods, trigger)
    exportCallTree(methods, trigger)
    // console.log(methods, trigger)
    // console.log(ast);
    // console.log(Object.keys(info));
    // console.log(info.identifierSource);
    // console.log(info.options.properties.methods.loc.source);
    // writeFile('./vue-analysis.json', JSON.stringify(info, null, 2));
  } catch (err) {
    console.log(err);
  }
});
