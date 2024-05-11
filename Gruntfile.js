module.exports = function ( grunt ) {

	require( 'load-grunt-tasks' )( grunt );

    // Project configuration.
    grunt.initConfig(
        {
            pkg: grunt.file.readJSON('package.json'),

            // # Build and release

            // Remove any files in zip destination and build folder
            clean: {
                main: [ 'build/**' ],
            },

            // Copy the plugin into the build directory
            copy: {
                main: {
                    src: [
                    '**',
                    '!node_modules/**',
                    '!build/**',
                    '!deploy/**',
                    '!svn/**',
                    '!**/*.zip',
                    '!**/*.bak',
                    '!wp-assets/**',
                    '!package-lock.json',
                    '!nyp-logo.png',
                    '!screenshots/**',
                    '!.git/**',
                    '!**.md',
                    '!Gruntfile.js',
                    '!package.json',
                    '!gitcreds.json',
                    '!.gitcreds',
                    '!.gitignore',
                    '!.gitmodules',
                    '!sftp-config.json',
                    '!**.sublime-workspace',
                    '!**.sublime-project',
                    '!deploy.sh',
                    '!**/*~',
                    '!phpcs.xml',
                    '!composer.json',
                    '!composer.lock',
                    '!vendor/**',
                    '!none',
                    '!includes/compatibility/backcompatibility/**',
                    ],
                    dest: 'build/',
                },
            },

            // Make a zipfile.
            compress: {
                main: {
                    options: {
                        mode: 'zip',
                        archive: 'deploy/<%= pkg.name %>-<%= pkg.version %>.zip',
                    },
                    expand: true,
                    cwd: 'build/',
                    dest: '<%= pkg.name %>',
                    src: [ '**/*' ],
                },
            },

            // # Internationalization

            // Add text domain
            addtextdomain: {
                options: {
                    textdomain: '<%= pkg.name %>', // Project text domain.
                },
                target: {
                    files: {
                        src: [
                        '*.php',
                        '**/*.php',
                        '**/**/*.php',
                        '!node_modules/**',
                        '!deploy/**',
                        ],
                    },
                },
            },

            // bump version numbers (replace with version in package.json)
            replace: {
                Version: {
                    src: [ 'readme.txt', '<%= pkg.name %>.php' ],
                    overwrite: true,
                    replacements: [
                    {
                        from: /Stable tag:.*$/m,
                        to: 'Stable tag: <%= pkg.version %>',
                    },
                    {
                        from: /Version:.*$/m,
                        to: 'Version: <%= pkg.version %>',
                    },
                    {
                        from: /public \$version = \'.*.'/m,
                        to: "public $version = '<%= pkg.version %>'",
                    },
                    {
                        from: /public \$version = \'.*.'/m,
                        to: "public $version = '<%= pkg.version %>'",
                    },
                    {
                        from: /public static \$version = \'.*.'/m,
                        to: "public static $version = '<%= pkg.version %>'",
                    },
                    {
                        from: /const VERSION = \'.*.'/m,
                        to: "const VERSION = '<%= pkg.version %>'",
                    },
                    ],
                },
            },
        } 
    );

    // Register tasks.
    grunt.registerTask('default', [ 'replace' ]);
    grunt.registerTask('zip', [ 'clean', 'copy', 'compress', 'clean' ]);
    grunt.registerTask('docs', [ 'wp_readme_to_markdown' ]);
    grunt.registerTask('build', [ 'replace', 'clean', 'copy' ]);
    grunt.registerTask('release', [ 'build', 'compress' ]);
};
