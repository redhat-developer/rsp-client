#!/usr/bin/env groovy

node('rhel8') {
    stage('Checkout repo') {
        deleteDir()
        git url: "https://github.com/${params.FORK}/rsp-client.git", branch: params.BRANCH
    }

    stage('Install requirements') {
        def nodeHome = tool 'nodejs-12.13.1'
        env.PATH = "${nodeHome}/bin:${env.PATH}"
    }

    stage('Build') {
        sh "npm install"
        sh "npm run build"
    }

    stage('Test') {
        sh "npm test"
    }

    stage('Package') {
        sh "npm pack"
        def packageJson = readJSON file: 'package.json'
        def packs = findFiles(glob: '**.tgz')
        def packName = "rsp-client-${packageJson.version}-${env.BUILD_NUMBER}.tgz"
        sh "mv ${packs[0].name} ${packName}"
        sh "ln -s ${packName} rsp-client-latest.tgz"
    }

    if (params.UPLOAD_LOCATION) {
        stage('Snapshot') {
            def filesToPush = findFiles(glob: '**.tgz')
            for (i = 0; i < filesToPush.length; i++) {
                sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-middleware-tools/rsp-client/ <<< \$'put -p ${filesToPush[i].path}'"
            }
        }
    }

    if (publish.equals('true')) {
        stage('Publish to NPM') {
            withCredentials([[$class: 'StringBinding', credentialsId: 'npm-token', variable: 'TOKEN']]) {
                sh "echo registry=https://registry.npmjs.com > .npmrc"
                sh "echo //registry.npmjs.com/:_authToken=${TOKEN} >> .npmrc"
                sh "npm publish"
            }
        }
    }
}