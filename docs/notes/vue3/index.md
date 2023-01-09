# 阅读前准备
## 重点阅读目录

| 文件夹           | 描述      |
|---------------|---------|
| compiler-core | 编译核心    |
| compiler-dom  | 编译dom   |
| reactivity    | 响应式     |
| runtime-core  | 运行时核心   |
| runtime-dom   | 运行时的dom |

## 阅读方式

根据Demo一步一步了解代码之间的关联

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div id="app"></div>
</body>
<script src="../dist/vue.global.js"></script>
<script>
    const app = Vue.createApp();
    app.mount('#app');
</script>
</html>
```

