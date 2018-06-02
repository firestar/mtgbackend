pipeline {
  agent {
    docker {
      image 'node:10.3.0-stretch'
    }
    
  }
  stages {
    stage('Install Packages') {
      steps {
        sh 'npm install'
      }
    }
    stage('Build Project') {
      steps {
        sh 'npm run build'
      }
    }
    stage('') {
      steps {
        sh 'docker build ./'
      }
    }
  }
}