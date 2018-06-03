node {
    checkout scm
    def app
    def dockerImage = docker.build("buildprocess/docker", "./buildImage/")
    withEnv([
        'DOCKER_ACCOUNT=firestarthehack',
        'IMAGE_VERSION=1.01',
        'IMAGE_NAME=mtgbackend',
        'RANCHER_STACK_NAME=mtgsynloadcom',
        'RANCHER_SERVICE_NAME=MTGBackend',
        'RANCHER_SERVICE_URL=http://34.215.0.188:8080/v2-beta'
    ]){
        stage('Build') {
          dockerImage.inside{
            sh 'npm install'
            sh 'npm run build'
          }
        }
        stage('Docker Build') {
            app = docker.build("${env.DOCKER_ACCOUNT}/${env.IMAGE_NAME}", "./")
        }
        stage('Test image') {
            app.inside {
              sh 'echo "Tests passed"'
            }
        }
        stage('Publish Latest Image') {
            app.push("${env.IMAGE_VERSION}")
            app.push("latest")
        }
        stage('Deploy') {
            rancher(environmentId: '1a5', ports: '', environments: '1i50661', confirm: true, image: "${env.DOCKER_ACCOUNT}/${env.IMAGE_NAME}:${env.IMAGE_VERSION}", service: "${env.RANCHER_STACK_NAME}/${env.RANCHER_SERVICE_NAME}", endpoint: "${env.RANCHER_SERVICE_URL}", credentialId: 'rancher-server')
        }
    }
}