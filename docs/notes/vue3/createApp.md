# createApp

## 说明：

vue3新增API，用于代替vue2的new Vue()；由于vue2的全局配置是挂载到Vue.xxx下面的，容易造成污染所有实例的情况。
vue3为了解决问题引入了createApp，用来返回一个新的实例。以后所有的全局配置都将挂载到这个实例上。

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

    const render: RootRenderFunction = (vnode, container, isSVG) => {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode, null, null, true)
            }
        } else {
            patch(container._vnode || null, vnode, container, null, null, null, isSVG)
        }
        flushPreFlushCbs()
        flushPostFlushCbs()
        container._vnode = vnode
    }

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
            _uid: uid++,
            _component: rootComponent as ConcreteComponent,
            _props: rootProps,
            _container: null,
            _context: context,
            _instance: null,

            version,

            get config() {
                return context.config
            },

            set config(v) {
            },

            // 配置插件：首先判断插件集合中是否拥有当前插件
            // 插件必须是一个函数或者带有install方法的对象
            // 两种形式都会接收到当前app实例和use中传递的额外参数
            use(plugin: Plugin, ...options: any[]) {
                if (installedPlugins.has(plugin)) {
                    __DEV__ && warn(`目标应用上有该插件`)
                } else if (plugin && isFunction(plugin.install)) {
                    installedPlugins.add(plugin)
                    plugin.install(app, ...options)
                } else if (isFunction(plugin)) {
                    installedPlugins.add(plugin)
                    plugin(app, ...options)
                }
                return app
            },

            // 混入
            mixin(mixin: ComponentOptions) {
                if (__FEATURE_OPTIONS_API__) {
                    if (!context.mixins.includes(mixin)) {
                        context.mixins.push(mixin)
                    }
                }
                return app
            },

            // 组件
            component(name: string, component?: Component): any {
                if (!component) {
                    return context.components[name]
                }
                context.components[name] = component
                return app
            },

            // 指令
            directive(name: string, directive?: Directive) {
                if (!directive) {
                    return context.directives[name] as any
                }
                context.directives[name] = directive
                return app
            },

            // 挂载
            mount(
                rootContainer: HostElement,
                isHydrate?: boolean,
                isSVG?: boolean
            ): any {
                if (!isMounted) {
                    // #5571
                    if (__DEV__ && (rootContainer as any).__vue_app__) {
                        warn(
                            `已经有app实例挂载到该容器上\n` +
                            ` 如果你想在同一个容器上挂载另一个实例` +
                            ` 你需要通过app.unmount()卸载之前的应用`
                        )
                    }
                    // 创建虚拟节点
                    const vnode = createVNode(
                        rootComponent as ConcreteComponent,
                        rootProps
                    )
                    // 根Vnode上存储app上下文
                    // 将会在初始挂载时在根实例上设置
                    vnode.appContext = context


                    if (isHydrate && hydrate) {
                        hydrate(vnode as VNode<Node, Element>, rootContainer as any)
                    } else {
                        render(vnode, rootContainer, isSVG)
                    }
                    isMounted = true
                    app._container = rootContainer
                    // for devtools and telemetry
                    ;(rootContainer as any).__vue_app__ = app

                    return getExposeProxy(vnode.component!) || vnode.component!.proxy
                }
            },

            // 卸载
            unmount() {
                if (isMounted) {
                    render(null, app._container)
                    delete app._container.__vue_app__
                }
            },

            provide(key, value) {
                if (__DEV__ && (key as string | symbol) in context.provides) {
                    warn(
                        `App already provides property with key "${String(key)}". ` +
                        `它将被新的值所覆盖`
                    )
                }

                context.provides[key as string | symbol] = value

                return app
            }
        })

        return app
    }
}
```
