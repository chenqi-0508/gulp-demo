const { src, dest, parallel, series, watch } = require('gulp')

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')

const del = require('del')
const browserSync = require('browser-sync')
const bs = browserSync.create()

const data = {
    menus: [
        {
            name: 'Home',
            icon: 'aperture',
            link: 'index.html'
        },
        {
            name: 'Features',
            link: 'features.html'
        },
        {
            name: 'About',
            link: 'about.html'
        },
        {
            name: 'Contact',
            link: '#',
            children: [
                {
                    name: 'Twitter',
                    link: 'https://twitter.com/w_zce'
                },
                {
                    name: 'About',
                    link: 'https://weibo.com/zceme'
                },
                {
                    name: 'divider'
                },
                {
                    name: 'About',
                    link: 'https://github.com/zce'
                }
            ]
        }
    ],
    pkg: require('./package.json'),
    date: new Date()
}

const style = () => {
    return src(
        'src/assets/styles/*.scss',
        { base: 'src' }
    ) // 选项参数base： 将src作为基准路径，设置后会将src后面的路径保留下来
        .pipe(plugins.sass({ outputStyle: 'expanded' })) // 将编译后的css展开
        // .pipe(dest('dist'))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
        // .pipe(dest('dist'))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

const page = () => {
    return src('src/*.html', { base: 'src' })
        .pipe(plugins.swig({ data }))
        // .pipe(dest('dist'))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

const extra = () => {
    return src('public/**', { base: 'public' })
        .pipe(dest('dist'))
}

const useref = () => {
    return src('temp/*.html', { base: 'temp' })
        .pipe(plugins.useref({ searchPath: ['temp', '.'] })) // 根据html中的构建注释，将外部引入的css加入到dist下的文件中
        .pipe(plugins.if(/\.js$/, plugins.uglify())) // 压缩useref生成的js文件
        .pipe(plugins.if(/\.css$/, plugins.cleanCss())) // 压缩useref生成的css文件
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true, // 对空白换行符压缩
            minifyCSS: true, // 对html中的css压缩
            minifyJS: true, // 对html中的js压缩
        }))) // 压缩useref生成的html文件
        .pipe(dest('dist'))
}

const clean = () => {
    return del(['dist', 'temp'])
}

const serve = () => {
    watch('src/assets/styles/*.scss', style)
    watch('src/assets/scripts/*.js', script)
    watch('src/*.html', page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/font/**', font)
    // watch('public/**', extra)
    watch([
        'src/assets/images/**',
        'src/assets/font/**',
        'public/**'
    ], bs.reload)

    bs.init({
        port: 2080, // 端口
        open: true, // 是否自动打开浏览器
        // files: 'dist/**', // 热更新监听的文件 // 也可以在每个任务后面reload
        notify: false, // 是否显示‘brower connect’
        server: {
            baseDir: ['temp', 'src', 'public'], // 启动的项目文件,按顺序寻找要请求的文件
            routes: {
                '/node_modules': 'node_modules' // 路由：文件中/node_modules需要映射到根目录node_modules
            }
        }
    })
}

const compile = parallel(style, script, page) // 开发阶段可以不对 image, font 做处理，因为它们是画质无损的压缩，可以忽略，减少开发阶段的构建次数

// build任务执行顺序：
// 1.清除dist、temp目录 
// 2.对src目录中的js、css、html做处理，放入temp目录
// 3.执行useref任务，将压缩后的js、css、html放入dist
// 4.将src中的图片、文字文件压缩，与public一起放入dist
const build = series(
    clean, 
    parallel(
        series(
            compile, 
            useref
        ), 
        image, 
        font, 
        extra
    )
)

// develop任务执行顺序
// 1.对src目录中的js、css、html做处理，放入temp目录
// 2.启动服务器并监听文件变化，热更新
const develop = series(compile, serve)

module.exports = {
    clean,
    develop,
    build,
}