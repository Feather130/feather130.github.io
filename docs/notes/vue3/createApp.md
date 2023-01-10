# createApp

## 说明：

vue3新增API，用于代替vue2的`new Vue()`。由于vue2的全局配置是挂载到`Vue.xxx`下面的，容易造成污染所有实例的情况。
vue3为了解决问题引入了`createApp`，用来返回一个新的实例。以后所有的全局配置都将挂载到这个实例上。

## 本节Demo

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
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
    const app = Vue.createApp();
    console.log(app); // 期望：返回实例
</script>
</html>
```

## 源码

位置：packages/runtime-dom/src/index.ts

```typescript
export const createApp = ((...args) => {
    // 最开始执行ensureRenderer方法，经过层层调用后返回一个对象
    // 执行对象中的一个函数createApp，最终返回半成品实例
    const app = ensureRenderer().createApp(...args)

    const {mount} = app
    // 重写mount方法
    app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
        // 暂时省略
    }

    // 最终返回一个新实例
    return app
}) as CreateAppFunction<Element>
```

### ensureRenderer流程

ensureRenderer->调用createRenderer->调用baseCreateRenderer

```typescript
function ensureRenderer() {
    return (
        renderer ||
        (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
    )
}
```

位置：packages/runtime-core/src/renderer.ts

```typescript
export function createRenderer<
    HostNode = RendererNode,
    HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {
    return baseCreateRenderer<HostNode, HostElement>(options)
}

function baseCreateRenderer(
    options: RendererOptions,
    createHydrationFns?: typeof createHydrationFunctions
): any {
    /*以下省略2000多行关于渲染的函数声明，遇到再看*/

    return {
        render,
        hydrate, // ssr
        createApp: createAppAPI(render, hydrate)
    }
}
```

### createAppAPI

位置：packages/runtime-core/src/apiCreateApp.ts

```typescript
export function createAppAPI<HostElement>(
    render: RootRenderFunction<HostElement>,
    hydrate?: RootHydrateFunction
): CreateAppFunction<HostElement> {
    return function createApp(rootComponent, rootProps = null) {
        if (!isFunction(rootComponent)) {
            rootComponent = {...rootComponent}
        }

        if (rootProps != null && !isObject(rootProps)) {
            rootProps = null
        }

        // 创建App执行上下文
        const context = createAppContext()
        // 创建一个存储插件的集合
        const installedPlugins = new Set()

        let isMounted = false

        // app 实例
        const app: App = (context.app = {
            // 实现App接口
        })

        return app
    }
}
```

App接口定义

```typescript

export interface App<HostElement = any> {
    version: string
    config: AppConfig

    use<Options extends unknown[]>(
        plugin: Plugin<Options>,
        ...options: Options
    ): this

    use<Options>(plugin: Plugin<Options>, options: Options): this

    mixin(mixin: ComponentOptions): this

    component(name: string): Component | undefined

    component(name: string, component: Component): this

    directive(name: string): Directive | undefined

    directive(name: string, directive: Directive): this

    mount(
        rootContainer: HostElement | string,
        isHydrate?: boolean,
        isSVG?: boolean
    ): ComponentPublicInstance

    unmount(): void

    provide<T>(key: InjectionKey<T> | string, value: T): this

    // 内部使用，但需要为服务器渲染器和devtools公开
    _uid: number
    _component: ConcreteComponent
    _props: Data | null
    _container: HostElement | null
    _context: AppContext
    _instance: ComponentInternalInstance | null
}
```

## 总结

createApp的作用主要就是返回一个新的实例，没有什么复杂的实现。