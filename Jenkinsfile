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
        def packs = findFiles(glob: '**.tgz')
        sh "mv ./${packs[0].name} ./rsp-client-latest.tgz"
    }

    if (params.UPLOAD_LOCATION) {
        stage('Snapshot') {
            def filesToPush = findFiles(glob: '**.tgz')
            sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${filesToPush[0].path} ${UPLOAD_LOCATION}/snapshots/vscode-middleware-tools/rsp-client/"
        }
    }
}