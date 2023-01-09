import {defaultTheme, defineUserConfig} from 'vuepress';
import {sidebar} from './configs';

export default defineUserConfig({
    base: '/',
    locales: {
        '/': {
            lang: 'zh-CN',
            title: '个人小记',
            description: '个人小记',
        },
    },
    theme: defaultTheme({
        docsDir: 'docs',
        locales: {
            '/': {
                sidebar: sidebar,
            }
        }
    })
})