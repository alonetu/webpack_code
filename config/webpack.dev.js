const os = require('os');
const path = require("path"); // nodejs核心模块，专门用来处理路径问题
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const threads = os.cpus().length; // cpu核数

module.exports = {
    // 入口
    entry: './src/main.js', // 相对路径
    // 输出
    output: {
        // 文件的输出路径
        // 开发模式没有输出
        path: undefined,
        // 入口文件打包输出文件名
        filename: 'static/js/main.js',
    },
    // 加载器
    module: {
        rules: [
            {
                // 每个文件只能被其中一个loader配置处理
                oneOf: [
                    // loader的配置
                    {
                        test: /\.css$/i, // 只检测.css文件
                        use: [
                            // 执行顺序，从右到左（从下到上）
                            'style-loader', // 将js中css通过创建style标签添加到html文件中生效
                            'css-loader', // 将css资源编译成commonjs的模块到js中
                        ],
                    },
                    {
                        test: /\.less$/i,
                        use: [
                            // compiles Less to CSS
                            'style-loader',
                            'css-loader',
                            'less-loader',
                        ],
                    },
                    {
                        test: /\.s[ac]ss$/i,
                        use: [
                            // 将 JS 字符串生成为 style 节点
                            'style-loader',
                            // 将 CSS 转化成 CommonJS 模块
                            'css-loader',
                            // 将 Sass 编译成 CSS
                            'sass-loader',
                        ],
                    },
                    {
                        test: /\.(png|jpe?g|gif|webp|svg)$/,
                        type: 'asset',
                        parser: {
                            dataUrlCondition: {
                                // 小于10kb的图片转base64
                                // 优点：减少请求次数 缺点：体积会变大
                                maxSize: 10 * 1024 // 10kb
                            }
                        },
                        generator: {
                            // 输出文件名称 [hash]: 文件名对应的唯一值 hash值取前10位 [ext]: 文件扩展名 [query]: 文件上的参数
                            filename: 'static/images/[hash:10][ext][query]'
                        }
                    },
                    {
                        test: /\.(ttf|woff2?|map3|map4|avi)$/,
                        type: 'asset/resource',
                        generator: {
                            // 输出文件名称 [hash]: 文件名对应的唯一值 hash值取前10位 [ext]: 文件扩展名 [query]: 文件上的参数
                            filename: 'static/media/[hash:10][ext][query]'
                        }
                    },
                    {
                        test: /\.m?js$/,
                        // exclude: /node_modules/, // 排除 node_modules 中的js文件（这些文件不处理）
                        include: path.resolve(__dirname, '../src'), // 只处理src下的文件，其他文件不处理
                        use: [
                            {
                                loader: 'thread-loader', // 开启多进程
                                options: {
                                    works: threads, // 进程数量
                                }
                            },
                            {
                                loader: 'babel-loader',
                                options: { // 这里使用 babel.config.js 中的配置
                                    // presets: ['@babel/preset-env'],
                                    cacheDirectory: true, // 开启babel缓存
                                    cacheCompression: false, // 关闭缓存文件压缩
                                    plugins: ['@babel/plugin-transform-runtime'], // 减少代码体积
                                },
                            }
                        ]
                    },
                ]
            }
        ],
    },
    // 插件
    plugins: [
        // plugin的配置
        new ESLintPlugin({
            // 检测哪些文件
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules", // 默认值
            cache: true, // 开启缓存
            cacheLocation: path.resolve(
                __dirname,
                "../node_modules/.cache/eslintcache"
            ),
            threads, // 开启多进程和设置进程数量
        }),
        new HtmlWebpackPlugin({
            // 模版，以public/index.html文件创建新的html文件
            // 新的html文件特点：1，结构和原来一致 2，自动引入打包输出的资源
            template: path.resolve(__dirname, "../public/index.html")
        })
    ],
    // 开发服务器：不会输出资源，在内存中编译打包的
    devServer: {
        host: "localhost", // 启动服务器域名
        port: "8000", // 启动服务器端口号
        open: true, // 是否自动打开浏览器
        hot: true, // 关闭 HMR（热模块替换）
    },
    // 模式
    mode: "development",
    // cheap-module-source-map 只有行映射
    devtool: "cheap-module-source-map"
};