# JMind

基于 Canvas 技术，使用 [Janvas](https://github.com/jarenchow/janvas) 封装库实现的 [XMind](https://www.xmind.cn) 的主要功能。

[Online 演示](http://janvas.cn/JMind/index.html)

[PDF 手册](http://janvas.cn/JMind/JMind%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C.pdf)

# JMind 使用手册

|       功能       |              描述              |                     快捷键                      |
| :--------------: | :----------------------------: | :---------------------------------------------: |
|  **新增**子节点  |   新增一个节点到当前节点右侧   |                 <kbd>Tab</kbd>                  |
| **向下新增**节点 |   新增一个节点到当前节点下侧   |                <kbd>Enter</kbd>                 |
| **向上新增**节点 |   新增一个节点到当前节点上侧   |             <kbd>Shift+Enter</kbd>              |
|  **新增父**节点  |   新增一个节点到当前节点左侧   |              <kbd>Ctrl+Enter</kbd>              |
|   **删除**节点   |     删除当前节点及其子节点     |          <kbd>Delete\|Backspace</kbd>           |
|   **选择**节点   |      选择待操作的目标节点      |    <kbd>&uarr;\|&larr;\|&darr;\|&rarr;</kbd>    |
|  **选择**多节点  |    选择多个待操作的目标节点    | <kbd>Ctrl+&uarr;\|&larr;\|&darr;\|&rarr;</kbd>  |
|   **移动**节点   |     移动目标节点到附近位置     | <kbd>Shift+&uarr;\|&larr;\|&darr;\|&rarr;</kbd> |
|   **剪切**节点   |       复制并删除当前节点       |                <kbd>Ctrl+x</kbd>                |
|   **复制**节点   |          复制节点内容          |                <kbd>Ctrl+c</kbd>                |
|   **克隆**节点   | 复制节点内容为 Markdown 并粘贴 |                <kbd>Ctrl+d</kbd>                |
|   **粘贴**节点   |          粘贴节点内容          |                <kbd>Ctrl+v</kbd>                |
|   **伸缩**节点   |       展开或收缩目标节点       |                <kbd>Ctrl+e</kbd>                |
|   **回退**操作   |      编辑模式下将操作回退      |                <kbd>Ctrl+z</kbd>                |
|   **前进**操作   |      编辑模式下将操作前进      |         <kbd>Ctrl+y\|Ctrl+Shift+z</kbd>         |
|   **全选**节点   |       全选当前未收缩节点       |                <kbd>Ctrl+a</kbd>                |
|   **定位**节点   |      将焦点转移回到根节点      |                <kbd>Ctrl+q</kbd>                |
|   **打开**文件   |       打开文件为思维导图       |                <kbd>Ctrl+o</kbd>                |
|   **保存**文件   |       保存思维导图为文件       |                <kbd>Ctrl+s</kbd>                |

*TIPS: <kbd>Ctrl+Delete</kbd> 可以仅删除单节点而保留子节点*

*TIPS: 多节点操作当前只支持 <kbd>Ctrl+Enter</kbd>*