const os = require('os');
const path = require("path"); // nodejs核心模块，专门用来处理路径问题
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin')

const threads = os.cpus().length; // cpu核数

// 用来获取处理样式的loader
function getStyleLoader(pre) {
    return [
        // 执行顺序，从右到左（从下到上）
        MiniCssExtractPlugin.loader, // 提取css成单独文件
        'css-loader', // 将css资源编译成commonjs的模块到js中
        {
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: [
                        "postcss-preset-env", // 能解决大多数样式兼容问题
                    ]
                }
            }
        },
        pre
    ].filter(Boolean)
}

module.exports = {
    // 入口
    entry: './src/main.js', // 相对路径
    // 输出
    output: {
        // 文件的输出路径
        // __dirname nodejs的变量，代表当前文件的文件夹目录
        path: path.resolve(__dirname, '../dist'), // 绝对路径
        // 入口文件打包输出文件名
        filename: 'static/js/main.js',
        // 自动清空上次打包的内容
        // 原理，在打包前，将path整个目录内容清空，再进行打包
        clean: true,
    },
    // 加载器
    module: {
        rules: [
            {
                oneOf: [
                    // loader的配置
                    {
                        test: /\.css$/i, // 只检测.css文件
                        use: getStyleLoader()
                    },
                    {
                        test: /\.less$/i,
                        use: getStyleLoader(),
                    },
                    {
                        test: /\.s[ac]ss$/i,
                        use: getStyleLoader(),
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
        }),
        new MiniCssExtractPlugin({
            filename: 'static/css/main.css',
        }),
        // new CssMinimizerPlugin(),
        // new TerserWebpackPlugin({
        //     parallel: threads // 开启多进程和设置进程数量
        // }),
    ],
    // 压缩的操作配置
    optimization: {
        minimizer: [
            // 压缩css
            new CssMinimizerPlugin(),
            // 压缩js
            new TerserWebpackPlugin({
                parallel: threads // 开启多进程和设置进程数量
            }),
        ]
    },
    // 模式
    mode: "production",
    // source-map 有行和列的映射
    devtool: "source-map"
}; 